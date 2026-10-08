/**
 * Site push, gate after the publish — does the PUBLISHED registry stylesheet still cascade like the stylesheet
 * it was moved from (push/.tmp/site.css)? Read-only. Exit 1 on a difference the cascade can see.
 *
 * WHY. editable.mjs moves site.css into the style registry, and css-to-registry folds a class's later
 * occurrences (its @media overrides) into the class rule, which moves them up the file. Its safety check does
 * not treat two DIFFERENT classes as able to sit on one element, so a base class and its combo can swap order
 * inside a media block. On 2026-10-06 that made the home's closing path step 76vw instead of 84vw at <=767:
 * `.path_step { width: 76vw }` and `.is-closing { width: 84vw }`, both bare, decided by source order. The css
 * gates sample 1440 / 390 / 1920 and can miss a swap that only shows between those widths.
 *
 * WHAT IT CHECKS. (1) every declaration of the original stylesheet is published under the same selector, media
 * and property (the Framework's tokens, colours, spacing steps and type bases, are the only ones allowed to be
 * missing: they moved to framework.css); (2) no two declarations changed their relative order when they have the same property
 * family, the same specificity, media that can hold together, and subjects that sit on one element (classes
 * that share a page node; a class on no node is listed as RUNTIME for a human, never failed).
 *
 * THE FIX when it fails: write the combo compound in site-src (`.path_step.is-closing`, not `.is-closing`), so
 * specificity decides and no order can break it. Then push again.
 *
 * Usage: node push/cascade-check.mjs            (after node push/publish.mjs)
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const TOOLS = path.resolve(HERE, '../../../../../tools/instatic-api-sync')
process.argv.push('--site', 'institute-for-advanced-dentistry:staging')
const { connect } = await import(pathToFileURL(path.join(TOOLS, 'target.mjs')).href)
const { parseCss, normaliseMedia, normaliseSelector, registryKey, family, splitTop } = await import(pathToFileURL(path.join(TOOLS, 'css-source.mjs')).href)
const SPEC = JSON.parse(fs.readFileSync(path.resolve(HERE, '../../class-standard/framework-spec.json'), 'utf8'))
// Framework-owned names may be missing from the published stylesheet (they load from framework.css): the colours,
// and since 2026-10-08 the spacing steps and the type bases (CLASS-STANDARD.md §10; editable.mjs moves them).
const frameworkOwned = new Set([
  ...(SPEC.colors ?? []).map((c) => `--${c.slug}`),
  ...['typography', 'spacing'].flatMap((f) => (SPEC[f] ?? []).flatMap((g) => g.sizes.map((s) => `--${s.name}`))),
])

const { api, target } = await connect()
const { site } = await api.getSite()
const { rows } = await api.getPages()
const base = target.url.replace(/\/$/, '')
const home = await fetch(`${base}/`).then((r) => r.text())
const href = (home.match(/\/_instatic\/css\/style-[0-9a-f]+\.css/) ?? [])[0]
if (!href) { console.error('the published home page links no registry stylesheet (style-*.css): was editable.mjs applied and the site published?'); process.exit(1) }
const published = await fetch(base + href).then((r) => r.text())
const original = fs.readFileSync(path.join(HERE, '.tmp', 'site.css'), 'utf8')

const idToName = new Map(Object.entries(site.styleRules).map(([id, r]) => [r.id ?? id, r.name]))
const together = new Map(), onNodes = new Set()
for (const row of rows) {
  const body = typeof row.cells?.body === 'string' ? JSON.parse(row.cells.body) : row.cells?.body
  for (const node of Object.values(body?.nodes ?? {})) {
    const names = (node.classIds ?? []).map((id) => idToName.get(id)).filter(Boolean)
    for (const a of names) { onNodes.add(a); for (const b of names) if (a !== b) (together.get(a) ?? together.set(a, new Set()).get(a)).add(b) }
  }
}
const spec = (sel) => {
  let s = sel.replace(/::[\w-]+(\([^)]*\))?/g, ' E ').replace(/:(not|is|where|has)\(([^)]*)\)/g, ' $2 ')
  const a = (s.match(/#[\w-]+/g) ?? []).length
  const b = (s.match(/\.[\w-]+|\[[^\]]*\]|:[\w-]+(\([^)]*\))?/g) ?? []).length
  s = s.replace(/#[\w-]+|\.[\w-]+|\[[^\]]*\]|:[\w-]+(\([^)]*\))?/g, ' ')
  const c = (s.match(/(^|[\s>+~])[a-zA-Z][\w-]*/g) ?? []).length
  return `${a},${b},${c}`
}
const subject = (sel) => {
  const last = sel.split(/\s*[>+~]\s*|\s+/).filter(Boolean).pop() ?? ''
  const pseudoEl = (last.match(/::?(before|after|placeholder|marker|selection)/i) ?? [''])[0].toLowerCase()
  const bare = last.replace(/::?[a-z-]+(\([^)]*\))?/gi, '')
  return { classes: [...bare.matchAll(/\.([\w-]+)/g)].map((m) => m[1]), tag: (bare.match(/^[a-z][\w-]*/i) ?? [''])[0].toLowerCase(), pseudoEl }
}
const coexist = (x, y) => {
  if (x.pseudoEl !== y.pseudoEl) return false
  if (x.tag && y.tag && x.tag !== y.tag) return false
  for (const a of x.classes) for (const b of y.classes) {
    if (a === b) continue
    if (!onNodes.has(a) || !onNodes.has(b)) continue // a class on no node may be added by a script to anything
    if (!(together.get(a)?.has(b))) return false
  }
  return true
}
const widths = (ctx) => [Math.max(0, ...[...ctx.matchAll(/min-width:\s*(\d+)px/g)].map((m) => +m[1])), Math.min(1e9, ...[...ctx.matchAll(/max-width:\s*(\d+)px/g)].map((m) => +m[1]))]
const canHoldTogether = (c1, c2) => {
  const [a, b] = widths(c1), [c, d] = widths(c2)
  if (Math.max(a, c) > Math.min(b, d)) return false
  return !(/reduced-motion:\s*reduce/.test(c1 + c2) && /reduced-motion:\s*no-preference/.test(c1 + c2))
}
const load = (css) => {
  const out = new Map()
  let n = 0
  for (const r of parseCss(css).rules) {
    const ctx = r.contexts.map((c) => normaliseMedia(c)).join(' && ')
    for (const one of splitTop(r.selector, ',')) {
      const sel = normaliseSelector(one)
      for (const d of r.decls) {
        const prop = registryKey(d.prop)
        out.set(`${sel}|${ctx}|${prop}`, { pos: n++, sel, ctx, prop, value: d.value, important: /!important/.test(d.value) || !!d.important })
      }
    }
  }
  return out
}
const A = load(original), B = load(published)
const missing = [...A.entries()].filter(([k, a]) => !B.has(k) && !(/^(:root|html)$/.test(a.sel) && !a.ctx && frameworkOwned.has(a.prop)))
console.log(`${base}${href}\noriginal ${A.size} declarations, published ${B.size}; missing from the published stylesheet: ${missing.length}`)
for (const [k] of missing.slice(0, 40)) console.log(`  MISSING  ${k}`)

const byFam = new Map()
for (const [k, a] of A) { const b = B.get(k); if (!b) continue; const f = family(a.prop); (byFam.get(f) ?? byFam.set(f, []).get(f)).push({ a, b, spec: spec(a.sel), subj: subject(a.sel) }) }
let moved = 0
const fails = [], notes = []
for (const [, list] of byFam) {
  for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
    const x = list[i], y = list[j]
    if (x.a.sel === y.a.sel && x.a.ctx === y.a.ctx) continue
    if ((x.a.pos < y.a.pos) === (x.b.pos < y.b.pos)) continue
    moved++
    if (x.spec !== y.spec || x.a.important !== y.a.important) continue
    if (!canHoldTogether(x.a.ctx, y.a.ctx) || !coexist(x.subj, y.subj)) continue
    const [first, second] = x.a.pos < y.a.pos ? [x, y] : [y, x]
    const runtime = [...new Set([...first.subj.classes, ...second.subj.classes].filter((c) => !onNodes.has(c)))]
    const line = `${second.a.prop}: "${second.a.sel}" @[${second.a.ctx || 'base'}] (${second.a.value}) came AFTER "${first.a.sel}" @[${first.a.ctx || 'base'}] (${first.a.value}) and is published BEFORE it`
    if (runtime.length) notes.push(`  note  ${line}   (class on no page node: ${runtime.join(', ')})`)
    else fails.push(`  SWAP  ${line}`)
  }
}
for (const l of fails.sort()) console.log(l)
if (notes.length) console.log(`\n${notes.length} pair(s) involve a class no page node carries (unused, or added by a script): check by hand if a script adds it`)
for (const l of notes.sort().slice(0, 60)) console.log(l)
console.log(`\n${moved} pair(s) changed order; ${fails.length} of them the cascade can see`)
if (missing.length || fails.length) { console.log('FAIL — the published stylesheet does not cascade like site.css (header: the fix)'); process.exit(1) }
console.log('OK — the published stylesheet cascades like site.css')
