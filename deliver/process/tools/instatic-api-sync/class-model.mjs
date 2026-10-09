#!/usr/bin/env node
/**
 * CLASS MODEL converter: bring a site's registry to the Webflow model of CLASS-STANDARD §11, in stages.
 * Every stage is a dry run unless --apply; --apply makes ONE atomic save (not published) after a backup.
 *
 *   node class-model.mjs tidy --site <client>:staging [--apply]
 *
 * STAGE tidy — changes no rendering by construction:
 *   - loose combo -> combo chip: an ambient `.button.is-navbar` rule whose modifier class has an EMPTY chip
 *     (phase 2's context-combo makes exactly that: a marker chip `.is-navbar` + an ambient compound rule)
 *     and whose nodes all carry the other classes becomes that chip: selector `.button.is-navbar`, the
 *     ambient rule's declarations and seat. Same selector, same seat, same nodes: nothing renders differently.
 *     The panel then shows `is-navbar` as a combo on the element instead of a loose rule.
 *   - selector list -> one rule per part, same declarations, consecutive seats at the list's place.
 *     A list of states of ONE compound (`.x:hover,.x:focus-visible`) and lists of globals stay whole.
 *   - unused -> deleted: ambient rules whose every class is on no node, in no script, in no embed HTML
 *     and in no class attribute of any published page (sitemap). They match nothing.
 * Prove with `migration-gates.mjs snapshot` before/after (css 0 real) and `class-model-lint.mjs`.
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { connect, argOf } from './target.mjs'
import { splitTop } from './css-source.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const stage = process.argv[2]
const APPLY = process.argv.includes('--apply')
if (stage !== 'tidy') { console.error('usage: class-model.mjs tidy --site <client>:staging [--apply]'); process.exit(2) }
const { api, target } = await connect()
const isStaging = target.env === 'staging' || /(^|[.-])staging[.-]/.test(new URL(target.url).hostname)
if (!isStaging) throw new Error('refusing: staging only')
const { site: shell, seq } = await api.getSite()
const { rows } = await api.getPages()
const client = (argOf('--site') ?? 'site').split(':')[0]
const OUT = join(HERE, 'output', 'fleet', client)
mkdirSync(OUT, { recursive: true })
const rules = shell.styleRules
const all = () => Object.values(rules)
const nameOf = new Map(all().map((r) => [r.id, r.name]))
const chips = new Map(all().filter((r) => r.kind === 'class').map((r) => [r.name, r]))
const hasDecl = (r) => [r.styles ?? {}, ...Object.values(r.contextStyles ?? {})].some((b) => Object.keys(b ?? {}).length)

/* nodes: which classes sit on which node */
const nodeClasses = []
const noteTree = (nodes) => { for (const n of Object.values(nodes ?? {})) { const s = new Set((n.classIds ?? []).map((id) => nameOf.get(id)).filter(Boolean)); if (s.size) nodeClasses.push(s) } }
for (const row of rows ?? []) { const b = typeof row.cells?.body === 'string' ? JSON.parse(row.cells.body) : row.cells?.body; noteTree(b?.nodes) }
for (const vc of shell.visualComponents ?? []) noteTree(vc.tree?.nodes)
const onNodes = new Set(nodeClasses.flatMap((s) => [...s]))
const scriptText = [
  ...(shell.files ?? []).filter((f) => f.type === 'script').map((f) => f.content ?? ''),
  ...(rows ?? []).flatMap((row) => JSON.stringify(row.cells?.body ?? '').match(/<script[\s\S]*?<\\?\/script>/gi) ?? []),
].join('\n')
const word = (c) => `(^|[^\\w-])${c.replace(/-/g, '\\-')}([^\\w-]|$)`
const byScript = (c) => new RegExp(word(c)).test(scriptText)
const bodiesText = (rows ?? []).map((row) => JSON.stringify(row.cells?.body ?? '')).join('\n')
const inEmbed = (c) => new RegExp(`class=\\\\?"[^"\\\\]*(^|[\\s"])${c.replace(/-/g, '\\-')}([\\s"\\\\]|$)`).test(bodiesText)

/* published class attributes on every URL a visitor can open (pages + collection entries, insta-api
   pageSlugs): the last word on whether a class exists. A staging sitemap can be empty (noindex). */
const base = target.url.replace(/\/$/, '')
const published = new Set()
const slugs = await api.pageSlugs()
let read = 0
for (const s of slugs) {
  const res = await fetch(`${base}/${s}`).catch(() => null)
  if (!res?.ok) continue
  const html = await res.text()
  read++
  for (const m of html.matchAll(/\bclass="([^"]*)"/g)) for (const c of m[1].split(/\s+/)) if (c) published.add(c)
}
if (read < slugs.length) throw new Error(`only ${read} of ${slugs.length} published URLs answered: cannot prove a class unused`)
console.log(`published URLs scanned: ${read}, distinct classes in their HTML: ${published.size}`)
const unusedClass = (c) => !onNodes.has(c) && !byScript(c) && !inEmbed(c) && !published.has(c)

const report = { combos: [], combosRefused: [], lists: [], unused: [] }
const changes = []

/* 1. loose combos -> combo chips */
for (const r of all()) {
  if (r.kind === 'class' || r.rawCss) continue
  const sel = String(r.selector ?? '').trim()
  const m = sel.match(/^((?:\.[\w-]+){2,})$/)
  if (!m) continue
  const cls = m[1].slice(1).split('.')
  if (!cls.every((c) => onNodes.has(c))) continue
  const sameSel = all().filter((x) => x !== r && x.kind !== 'class' && String(x.selector ?? '').trim() === sel)
  // the modifier: a class whose chip is empty and whose every node carries all the other classes
  const mod = cls.slice().reverse().find((c) => {
    const ch = chips.get(c)
    return ch && ch.selector === `.${c}` && !hasDecl(ch) && nodeClasses.filter((s) => s.has(c)).every((s) => cls.every((o) => s.has(o)))
  })
  if (!mod || sameSel.length) {
    report.combosRefused.push(`${sel}  — ${!mod ? 'no empty marker chip whose nodes all carry the other classes' : `${sameSel.length + 1} rules share this selector (fold first)`}`)
    continue
  }
  const chip = chips.get(mod)
  changes.push(() => {
    chip.selector = sel
    chip.styles = r.styles ?? {}
    chip.contextStyles = r.contextStyles ?? {}
    if (r.stylePriorities) chip.stylePriorities = r.stylePriorities
    if (r.contextStylePriorities) chip.contextStylePriorities = r.contextStylePriorities
    chip.order = r.order
    chip.updatedAt = Date.now()
    delete rules[r.id]
  })
  report.combos.push(`${sel}  -> combo chip "${mod}" (seat ${r.order})`)
}

/* 2. selector lists -> one rule per part */
const compoundBase = (p) => p.replace(/::?[\w-]+(\([^)]*\))?/g, '').replace(/\[[^\]]*\]/g, '').trim()
for (const r of all()) {
  if (r.kind === 'class' || r.rawCss) continue
  const sel = String(r.selector ?? '').trim()
  const parts = splitTop(sel, ',').map((s) => s.trim()).filter(Boolean)
  if (parts.length < 2) continue
  if (parts.every((p) => !/\.[\w-]/.test(p))) continue // a list of globals (the reset)
  if (new Set(parts.map(compoundBase)).size === 1 && parts.every((p) => !/[\s>+~]/.test(p))) continue // states of one compound
  const step = 1e-6
  changes.push(() => {
    parts.forEach((p, i) => {
      const id = `${r.id}-p${i}`
      rules[id] = { ...structuredClone(r), id, name: p, selector: p, order: (r.order ?? 0) + i * step, updatedAt: Date.now() }
    })
    delete rules[r.id]
  })
  report.lists.push(`${sel.replace(/\s+/g, ' ').slice(0, 120)}  -> ${parts.length} rules`)
}

/* 3. unused -> deleted */
for (const r of all()) {
  if (r.kind === 'class' || r.rawCss) continue
  const sel = String(r.selector ?? '')
  const cls = [...new Set([...sel.matchAll(/\.([\w-]+)/g)].map((m) => m[1]))]
  if (!cls.length || /^@/.test(sel)) continue
  if (!cls.every(unusedClass)) continue
  changes.push(() => { delete rules[r.id] })
  report.unused.push(sel.replace(/\s+/g, ' ').slice(0, 100))
}

console.log(`${target.url} (seq ${seq}) — stage tidy`)
console.log(`\nloose combos -> combo chips: ${report.combos.length}`); report.combos.forEach((x) => console.log(`  ${x}`))
if (report.combosRefused.length) { console.log(`  left for later (${report.combosRefused.length}):`); report.combosRefused.forEach((x) => console.log(`    ${x}`)) }
console.log(`\nselector lists split: ${report.lists.length}`); report.lists.forEach((x) => console.log(`  ${x}`))
console.log(`\nunused rules deleted: ${report.unused.length}`); report.unused.slice(0, 200).forEach((x) => console.log(`  ${x}`))
writeFileSync(join(OUT, `class-model-tidy.${APPLY ? 'apply' : 'dry'}.json`), JSON.stringify(report, null, 1))

if (!APPLY) { console.log('\nDRY RUN — nothing written. Re-run with --apply.'); process.exit(0) }
writeFileSync(join(OUT, `shell.before-class-model-tidy.${seq}.json`), JSON.stringify(shell))
for (const c of changes) c()
const saved = await api.saveShell(shell, seq)
console.log(`\nsaved — seq ${seq} -> ${saved.seq}. Not published. Backup: output/fleet/${client}/shell.before-class-model-tidy.${seq}.json`)
