#!/usr/bin/env node
/**
 * Fold a class split over several registry rules back into ONE rule, the class chip, with the same
 * cascade, so the Styles panel shows and edits a class where its elements point.
 *
 *   node fold-split.mjs --site <client>:staging [--only a,b] [--apply]
 *
 * WHY: an append-mode CSS move (css-to-registry without --in-place) leaves a class as its chip (the rule
 * the elements' classIds point at, often empty) plus one or more ambient `.name` rules seated later.
 * In the panel the chip looks empty, and a property edited on it LOSES to the later rule (Mason Park
 * 218 classes, Kids 119, IFA 87, Nahlah 24 on 2026-10-08; the Stone sites, moved --in-place, 0).
 *
 * HOW, per class, the rules sorted by `order` (Instatic emits each rule as: base, then its condition
 * contexts by condition index, then breakpoint contexts):
 *   - live declarations are replayed in emission order; a later BASE declaration kills every earlier
 *     declaration of that property in any context (it was dead on the live site: never revived, the
 *     `.cf-shot` bug); a later declaration in the same context replaces the earlier one;
 *   - the merged rule sits at the LATEST seat of the group, so declarations that already won still win;
 * REFUSES the class (listed, nothing written for it) when the merged rule could compute differently:
 *   - two surviving declarations of one property in different contexts whose width ranges can overlap
 *     and whose emission order would flip (rule order vs condition order);
 *   - a shorthand and a longhand of the same property family in the group;
 *   - any !important priority in the group;
 *   - an earlier declaration that would move past a rule of equal specificity (one class or attribute)
 *     that can style the same element (page-tree co-occurrence; a class on no node can join anything)
 *     on the same property family in an overlapping context;
 *   - a rule to delete that a node or component points at.
 * One atomic shell save (no page writes). Gates as for any registry change: css parity, runtime parity.
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { connect, argOf } from './target.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const APPLY = process.argv.includes('--apply')
const ONLY = argOf('--only') ? new Set(argOf('--only').split(',')) : null
const { api, target } = await connect()
const { site: shell, seq } = await api.getSite()
const { rows } = await api.getPages()
const client = (argOf('--site') ?? 'site').split(':')[0]
const OUT = join(HERE, 'output', 'fleet', client)
mkdirSync(OUT, { recursive: true })

const rules = Object.values(shell.styleRules ?? {})
const nameOf = new Map(rules.map((r) => [r.id, r.name]))
const conditions = shell.conditions ?? []
const condIndex = new Map(conditions.map((c, i) => [c.id, i]))
const condQuery = new Map(conditions.map((c) => [c.id, c.condition?.kind === 'media' ? String(c.condition.query ?? '') : null]))
const bpIds = new Set((shell.breakpoints ?? []).map((b) => b.id))

/* node references and class co-occurrence */
const refs = new Map()
const together = new Map()
const onNodes = new Set()
const note = (ids) => {
  for (const id of ids) refs.set(id, (refs.get(id) ?? 0) + 1)
  const names = ids.map((id) => nameOf.get(id)).filter(Boolean)
  for (const a of names) { onNodes.add(a); for (const b of names) if (a !== b) (together.get(a) ?? together.set(a, new Set()).get(a)).add(b) }
}
for (const row of rows ?? []) {
  const body = typeof row.cells?.body === 'string' ? JSON.parse(row.cells.body) : row.cells?.body
  for (const n of Object.values(body?.nodes ?? {})) {
    note(n.classIds ?? [])
    const raw = n.htmlAttributes?.class
    if (typeof raw === 'string') for (const t of raw.split(/\s+/)) if (t) onNodes.add(t)
  }
}
for (const vc of shell.visualComponents ?? []) { note(vc.classIds ?? []); for (const n of Object.values(vc.tree?.nodes ?? {})) note(n.classIds ?? []) }
// A class on no node is RUNTIME only if a script names it (classList, className, a selector string);
// otherwise it is dead CSS and styles nothing (Mason Park: hero_split, faq_layout … on 0 elements).
const scriptText = (shell.files ?? []).filter((f) => f.type === 'script').map((f) => f.content ?? '').join('\n')
const runtime = (c) => !onNodes.has(c) && new RegExp(`['"\\s.\`]${c}(?![\\w-])`).test(scriptText)
const canJoin = (a, b) => a === b || runtime(a) || runtime(b) || together.get(a)?.has(b) === true

/* contexts: emission rank and width range */
const rank = (cid) => (cid === '' ? [0, 0] : condIndex.has(cid) ? [1, condIndex.get(cid)] : [2, 0])
const before = (a, b) => { const x = rank(a), y = rank(b); return x[0] !== y[0] ? x[0] < y[0] : x[1] < y[1] }
const range = (cid) => {
  if (cid === '') return [0, Infinity]
  const q = condQuery.get(cid)
  if (q == null) return [0, Infinity] // breakpoint or non-media context: assume it can apply anywhere
  const min = q.match(/min-width:\s*(\d+(?:\.\d+)?)px/i), max = q.match(/max-width:\s*(\d+(?:\.\d+)?)px/i)
  return [min ? Number(min[1]) : 0, max ? Number(max[1]) : Infinity]
}
const overlap = (a, b) => { const [a1, a2] = range(a), [b1, b2] = range(b); return a1 <= b2 && b1 <= a2 }
const fam = (k) => k.replace(/^(Webkit|Moz)/, '').replace(/^(padding|margin|border|inset|gap|grid|flex|font|text|background|transition|animation|overflow|outline|columns|place)[A-Z].*$/, '$1')
const isShorthand = (k) => fam(k) === k && /^(padding|margin|border|inset|gap|grid|flex|font|background|transition|animation|overflow|outline|columns|place)$/.test(k)

/* specificity of one selector part: [ids, classes+attrs+pseudo-classes, tags] */
const spec = (sel) => {
  let s = sel.replace(/::[\w-]+(\([^)]*\))?/g, ' ').replace(/:(not|is|has)\(([^)]*)\)/g, ' $2 ').replace(/:where\([^)]*\)/g, ' ')
  const a = (s.match(/#[\w-]+/g) ?? []).length
  const b = (s.match(/\.[\w-]+|\[[^\]]*\]|:[\w-]+(\([^)]*\))?/g) ?? []).length
  s = s.replace(/#[\w-]+|\.[\w-]+|\[[^\]]*\]|:[\w-]+(\([^)]*\))?/g, ' ')
  const c = (s.match(/(^|[\s>+~(])[a-zA-Z][\w-]*/g) ?? []).length
  return [a, b, c]
}
const subjectClasses = (part) => [...(part.trim().split(/\s*[>+~]\s*|\s+/).filter(Boolean).at(-1) ?? '').replace(/::?[\w-]+(\([^)]*\))?/g, '').matchAll(/\.([\w-]+)/g)].map((m) => m[1])

/* groups */
const groups = new Map()
for (const r of rules) {
  if (r.rawCss) continue
  const m = String(r.selector ?? '').match(/^\.([\w-]+)$/)
  if (m) (groups.get(m[1]) ?? groups.set(m[1], []).get(m[1])).push(r)
}
const bagsOf = (r) => [['', r.styles ?? {}], ...Object.entries(r.contextStyles ?? {}).sort(([a], [b]) => (before(a, b) ? -1 : before(b, a) ? 1 : 0))]
const folded = [], refused = []
const deleteIds = new Set()

for (const [cls, list] of groups) {
  if (list.length < 2 || (ONLY && !ONLY.has(cls))) continue
  const sorted = list.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  const referenced = sorted.filter((r) => refs.has(r.id))
  const chip = referenced[0] ?? sorted.find((r) => r.kind === 'class') ?? sorted.find((r) => r.name === cls) ?? sorted[0]
  const why = []
  if (referenced.length > 1) why.push(`${referenced.length} rules are pointed at by nodes`)
  if (sorted.some((r) => Object.keys(r.stylePriorities ?? {}).length || Object.values(r.contextStylePriorities ?? {}).some((p) => Object.keys(p ?? {}).length))) why.push('!important in the group')
  const keys = new Set(sorted.flatMap((r) => bagsOf(r).flatMap(([, b]) => Object.keys(b ?? {}))))
  const fams = new Map()
  for (const k of keys) (fams.get(fam(k)) ?? fams.set(fam(k), new Set()).get(fam(k))).add(k)
  for (const [f, ks] of fams) if (ks.size > 1 && [...ks].some(isShorthand)) why.push(`shorthand and longhand of ${f}`)
  const seat = Math.max(...sorted.map((r) => r.order ?? 0))
  // replay
  const live = new Map() // prop -> [{ cid, value, order, step }]
  let step = 0
  for (const r of sorted) {
    for (const [cid, bag] of bagsOf(r)) {
      for (const [k, v] of Object.entries(bag ?? {})) {
        const entries = live.get(k) ?? []
        const kept = cid === '' ? [] : entries.filter((e) => e.cid !== cid)
        kept.push({ cid, value: v, order: r.order ?? 0, step: step++ })
        live.set(k, kept)
      }
    }
  }
  // order consistency between surviving contexts
  for (const [k, entries] of live) {
    const ctx = entries.filter((e) => e.cid !== '').sort((a, b) => a.step - b.step)
    for (let i = 0; i < ctx.length; i++) for (let j = i + 1; j < ctx.length; j++) {
      if (overlap(ctx[i].cid, ctx[j].cid) && !before(ctx[i].cid, ctx[j].cid)) why.push(`${k}: contexts ${ctx[i].cid} / ${ctx[j].cid} would swap`)
    }
  }
  // crossing: an earlier surviving declaration moved past an equal-specificity rival
  const rivals = rules.filter((x) => !sorted.includes(x) && !x.rawCss && (x.order ?? 0) < seat)
  for (const [k, entries] of live) {
    for (const e of entries) {
      if (e.order >= seat) continue
      for (const x of rivals) {
        if ((x.order ?? 0) <= e.order) continue
        const parts = String(x.selector ?? '').split(',').filter((p) => { const s = spec(p); return s[0] === 0 && s[1] === 1 && s[2] === 0 })
        if (!parts.length) continue
        const xBags = bagsOf(x).filter(([cid, b]) => Object.keys(b ?? {}).some((kk) => fam(kk) === fam(k)) && overlap(cid, e.cid))
        if (!xBags.length) continue
        const joins = parts.some((p) => { const sc = subjectClasses(p); return sc.length ? sc.some((c) => canJoin(cls, c)) : !/^\s*:root\s*$/.test(p) })
        if (joins) { why.push(`${k} (from #${e.order}) would move past ${x.selector} #${x.order}`); break }
      }
    }
  }
  for (const r of sorted) if (r !== chip && refs.has(r.id)) why.push(`rule #${r.order} is pointed at by nodes`)
  if (why.length) { refused.push(`.${cls}: ${[...new Set(why)].slice(0, 3).join('; ')}`); continue }
  // build the merged bags in replay order (insertion order = emission order inside a bag)
  const base = {}, ctxs = {}
  const all = [...live.entries()].flatMap(([k, es]) => es.map((e) => ({ k, ...e }))).sort((a, b) => a.step - b.step)
  for (const e of all) {
    const bag = e.cid === '' ? base : (ctxs[e.cid] ??= {})
    delete bag[e.k]
    bag[e.k] = e.value
  }
  folded.push({ cls, chip, sorted, base, ctxs, seat, dropped: [...keys].length })
}

for (const f of folded) {
  f.chip.styles = f.base
  f.chip.contextStyles = f.ctxs
  f.chip.order = f.seat
  f.chip.updatedAt = Date.now()
  for (const r of f.sorted) if (r !== f.chip) { delete shell.styleRules[r.id]; deleteIds.add(r.id) }
}
console.log(`${target.url} (seq ${seq}): ${folded.length} class(es) folded into their chip (${deleteIds.size} rule(s) removed); ${refused.length} left split${APPLY ? '' : '  DRY RUN'}`)
for (const f of folded.slice(0, 15)) console.log(`  fold  .${f.cls}: ${f.sorted.length} rules -> chip at #${f.seat}`)
if (folded.length > 15) console.log(`  … ${folded.length - 15} more`)
if (refused.length) { console.log('left split (a person decides):'); for (const x of refused.slice(0, 60)) console.log(`  ${x}`) }
writeFileSync(join(OUT, 'fold-split.report.txt'), [...folded.map((f) => `fold .${f.cls} ${f.sorted.map((r) => r.order).join('+')} -> ${f.seat}`), ...refused.map((x) => `left ${x}`)].join('\n'))
if (!APPLY) { console.log('DRY RUN — nothing written. Re-run with --apply.'); process.exit(0) }
writeFileSync(join(OUT, `shell.before-fold-split.${seq}.json`), JSON.stringify((await api.getSite()).site))
const saved = await api.saveShell(shell, seq)
console.log(`saved — seq ${seq} -> ${saved.seq}. Not published. Backup: output/fleet/${client}/shell.before-fold-split.${seq}.json`)
