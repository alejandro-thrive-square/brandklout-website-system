#!/usr/bin/env node
/**
 * Contextual overrides of utility / role classes -> combo classes (Client-First), no visual change.
 *
 *   node context-combo.mjs --site <client>:staging                          # propose: writes <client>/combo-map.proposed.json
 *   node context-combo.mjs --site <client>:staging --map combo-map.json     # dry run of a reviewed map
 *   node context-combo.mjs --site <client>:staging --map combo-map.json --apply
 *
 * `.section_arrival .heading-style-h1 { font-size }` restyles the role class wherever it sits inside
 * that section: in the Styles panel an edit to `heading-style-h1` does nothing on that heading, and
 * moving the heading changes its look. The Client-First way is a combo class ON the element:
 * `heading-style-h1 is-arrival`, rule `.heading-style-h1.is-arrival`. This tool:
 *   - finds static contextual rules whose subject carries a utility/role class that has its own rule
 *     on the same property family (the override);
 *   - finds the nodes the selector matches in every page tree (descendant ` ` and child `>` only);
 *   - on apply: adds the combo class to exactly those nodes and rewrites the rule's selector to the
 *     subject compound plus the combo, keeping the rule's place in the cascade.
 * REFUSES a candidate (listed for a person) when the result could differ:
 *   - attribute / pseudo-class / sibling parts (`[data-theme]`, `:not()`, `:hover`, `+`, `~`): themes and
 *     states are legitimate context and stay;
 *   - a class in the selector that no node carries (a runtime state class) or that a script adds;
 *   - a tag in the selector (node tags are not reliable in the tree) or a selector list;
 *   - any class of the selector used inside a component (a class added there changes every instance);
 *   - specificity of the new selector differs from the old one;
 *   - the combo name exists as a class rule with declarations.
 * The map is reviewed by a person first: { "<old selector>": "is-<name>", … } (rename combos freely).
 * Saves pages + registry in ONE site-document write (insta-api keeps SEO cells and templates).
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { connect, argOf } from './target.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const APPLY = process.argv.includes('--apply')
const { api, target } = await connect()
const { site: shell, seq } = await api.getSite()
const { rows } = await api.getPages()
const client = (argOf('--site') ?? 'site').split(':')[0]
const OUT = join(HERE, 'output', 'fleet', client)
mkdirSync(OUT, { recursive: true })

const rules = Object.values(shell.styleRules ?? {})
const nameOf = new Map(rules.map((r) => [r.id, r.name]))
const classRules = new Map(rules.filter((r) => r.kind === 'class').map((r) => [r.name, r]))
const UTIL = /^(heading-style|text-size|text-style|text-weight|text-color|text-align|font-|padding-|margin-|spacer-|max-width|container-|button|icon-|background-color|align-|hide|layer|z-index|overflow|pointer|aspect|is-)/
const fam = (k) => k.replace(/^(Webkit|Moz)/, '').replace(/^(padding|margin|border|inset|gap|grid|flex|font|text|background|transition|animation)[A-Z].*$/, '$1')
const props = (r) => new Set([r.styles ?? {}, ...Object.values(r.contextStyles ?? {})].flatMap((b) => Object.keys(b ?? {}).map(fam)))

/* ── trees ──────────────────────────────────────────────────────────────── */
const parseBody = (b) => (typeof b === 'string' ? JSON.parse(b) : b)
const classesOf = (node) => {
  const set = new Set((node.classIds ?? []).map((id) => nameOf.get(id)).filter(Boolean))
  const raw = node.htmlAttributes?.class ?? node.props?.htmlAttributes?.class
  if (typeof raw === 'string') for (const t of raw.split(/\s+/)) if (t) set.add(t)
  return set
}
const trees = []
for (const row of rows ?? []) { const body = parseBody(row.cells?.body); if (body?.nodes) trees.push({ kind: 'page', row, body }) }
const componentClasses = new Set()
for (const vc of shell.visualComponents ?? []) for (const n of Object.values(vc.tree?.nodes ?? {})) for (const c of classesOf(n)) componentClasses.add(c)
for (const vc of shell.visualComponents ?? []) for (const id of vc.classIds ?? []) if (nameOf.get(id)) componentClasses.add(nameOf.get(id))
const onNodes = new Set()
for (const t of trees) {
  t.parent = new Map()
  for (const [id, n] of Object.entries(t.body.nodes)) { for (const c of n.children ?? []) t.parent.set(c, id); for (const c of classesOf(n)) onNodes.add(c) }
}
for (const c of componentClasses) onNodes.add(c)
const scriptText = (shell.files ?? []).filter((f) => f.type === 'script').map((f) => f.content ?? '').join('\n')
const scriptAdds = (c) => new RegExp(`classList\\.(add|toggle|replace)\\([^)]*['"\`]${c}['"\`]|className[^;]*\\b${c}\\b`).test(scriptText)

/* ── selector parsing (classes, descendant/child only) ──────────────────── */
const parse = (sel) => {
  const tokens = sel.trim().split(/\s*(>)\s*|\s+/).filter(Boolean)
  const steps = []
  let comb = ' '
  for (const t of tokens) {
    if (t === '>') { comb = '>'; continue }
    const m = t.match(/^((?:\.[\w-]+)+)(::?[\w-]+(?:\([^)]*\))?)?$/)
    if (!m) return null
    // Pseudo-elements and the element's OWN interaction states move with it (`.ctx .button:hover` ->
    // `.button.is-ctx:hover`); structural or negated pseudo-classes (:not, :first-child) stay.
    if (m[2] && !/^::/.test(m[2]) && !/^:(before|after|hover|focus|focus-visible|focus-within|active)$/.test(m[2])) return null
    steps.push({ classes: m[1].slice(1).split('.'), pseudo: m[2] ?? '', comb })
    comb = ' '
  }
  return steps.length >= 2 && steps.slice(0, -1).every((s) => !s.pseudo) ? steps : null
}
const specificity = (steps) => steps.reduce((n, s) => n + s.classes.length, 0)
const has = (node, step) => { const c = classesOf(node); return step.classes.every((x) => c.has(x)) }
const matches = (t, id, steps) => {
  const n = t.body.nodes[id]
  if (!has(n, steps.at(-1))) return false
  let cur = id
  for (let i = steps.length - 2; i >= 0; i--) {
    const direct = steps[i + 1].comb === '>'
    let p = t.parent.get(cur), found = false
    while (p) {
      if (has(t.body.nodes[p], steps[i])) { found = true; cur = p; break }
      if (direct) break
      p = t.parent.get(p)
    }
    if (!found) return false
  }
  return true
}
const comboName = (steps) => {
  const c = steps.at(-2).classes[0]
  const base = (c.startsWith('section_') ? c.slice(8) : c.endsWith('_component') ? c.slice(0, -10) : c.replace(/_/g, '-')).replace(/^is-/, '')
  // A name already in use (the context itself is often `.is-plain`) would make other selectors match:
  // suffix the subject role (`is-plain-h1`). A person reviews every name anyway.
  const taken = (n) => classRules.has(n) || rules.some((x) => new RegExp(`\.${n}(?![\w-])`).test(x.selector ?? ''))
  const name = `is-${base}`
  return taken(name) ? `${name}-${steps.at(-1).classes[0].split('-').pop()}` : name
}

/* ── candidates ─────────────────────────────────────────────────────────── */
const candidates = new Map()
const refused = []
for (const r of rules) {
  if (r.kind === 'class' || r.rawCss) continue
  const sel = r.selector ?? ''
  if (!/[\s>]/.test(sel.trim()) || sel.includes(',')) continue
  const steps = parse(sel)
  const subjectClasses = sel.trim().split(/\s*[>+~]\s*|\s+/).filter(Boolean).at(-1).match(/\.[\w-]+/g)?.map((x) => x.slice(1)) ?? []
  const overridden = subjectClasses.filter((c) => UTIL.test(c) && !c.startsWith('is-') && classRules.has(c) && [...props(r)].some((p) => props(classRules.get(c)).has(p)))
  if (!overridden.length) continue
  const why = []
  if (!steps) why.push('attribute / pseudo-class / sibling / tag part (theme or state: stays)')
  else {
    const all = steps.flatMap((s) => s.classes)
    const runtime = all.filter((c) => !onNodes.has(c) || scriptAdds(c))
    if (runtime.length) why.push(`runtime class ${runtime.join(', ')}`)
    const comp = all.filter((c) => componentClasses.has(c))
    if (comp.length) why.push(`used in a component: ${comp.join(', ')}`)
  }
  if (steps && steps.at(-1).classes.length + 1 !== specificity(steps)) why.push(`specificity: ${specificity(steps)} classes would become ${steps.at(-1).classes.length + 1} (by hand)`)
  if (why.length) { refused.push(`${sel}  — ${why.join('; ')}`); continue }
  const entry = candidates.get(sel) ?? { selector: sel, rules: [], combo: comboName(steps), steps, nodes: [] }
  entry.rules.push(r)
  candidates.set(sel, entry)
}
for (const e of candidates.values()) {
  for (const t of trees) for (const id of Object.keys(t.body.nodes)) if (matches(t, id, e.steps)) e.nodes.push({ t, id })
}

/* ── propose ────────────────────────────────────────────────────────────── */
if (!argOf('--map')) {
  const proposal = Object.fromEntries([...candidates.values()].map((e) => [e.selector, e.combo]))
  const file = join(OUT, 'combo-map.proposed.json')
  writeFileSync(file, JSON.stringify(proposal, null, 2))
  console.log(`${target.url}: ${candidates.size} contextual override(s) of utility/role classes can become combos; ${refused.length} stay (themes, states, components)`)
  for (const e of candidates.values()) console.log(`  ${e.selector.padEnd(60)} -> ${e.steps.at(-1).classes.join('.')}.${e.combo}${e.steps.at(-1).pseudo}   (${e.nodes.length} node(s) on ${new Set(e.nodes.map((n) => n.t.row.id)).size} page(s))`)
  if (refused.length) { console.log('\nstay as they are:'); for (const x of refused.slice(0, 80)) console.log(`  ${x}`) }
  console.log(`\nwrote ${file}: review the combo names, then --map <file>`)
  process.exit(0)
}

/* ── apply a reviewed map ───────────────────────────────────────────────── */
const map = JSON.parse(readFileSync(argOf('--map'), 'utf8'))
const problems = []
const changedRowIds = new Set()
const comboNodes = new Map()
const rewritten = new Set()
const nid = () => Math.random().toString(36).slice(2, 12) + Date.now().toString(36).slice(-6)
for (const [sel, combo] of Object.entries(map)) {
  const e = candidates.get(sel)
  if (!e) { problems.push(`${sel}: not a convertible candidate on this site (re-run the proposal)`); continue }
  if (!/^is-[a-z0-9-]+$/.test(combo)) { problems.push(`${sel}: combo "${combo}" must be is-<lowercase-words>`); continue }
  const subject = e.steps.at(-1)
  const newSel = `.${subject.classes.join('.')}.${combo}${subject.pseudo}`
  if (specificity([{ classes: [...subject.classes, combo] }]) !== specificity(e.steps)) { problems.push(`${sel}: specificity would change (${specificity(e.steps)} -> ${subject.classes.length + 1} classes): by hand`); continue }
  const existing = classRules.get(combo)
  if (existing && [existing.styles ?? {}, ...Object.values(existing.contextStyles ?? {})].some((b) => Object.keys(b ?? {}).length)) { problems.push(`${sel}: class .${combo} already has declarations: pick another name`); continue }
  if (!e.nodes.length) { problems.push(`${sel}: matches no node in the page trees (runtime markup?): by hand`); continue }
  // A new class on a node can make OTHER selectors start matching it: refuse a combo name any other
  // selector (or a script) already mentions, as class-rename refuses a new name already in use.
  const elsewhere = rules.filter((x) => !e.rules.includes(x) && !rewritten.has(x) && !Object.keys(map).includes(x.selector) && x.name !== combo && new RegExp(`\.${combo}(?![\w-])`).test(x.selector ?? ''))
  if (elsewhere.length) { problems.push(`${sel}: .${combo} already appears in ${elsewhere.slice(0, 3).map((x) => x.selector).join(' | ')}: pick another name`); continue }
  if (new RegExp(`['"\s.]${combo}(?![\w-])`).test(scriptText)) { problems.push(`${sel}: a script mentions ${combo}: pick another name`); continue }
  const key = e.nodes.map((n) => `${n.t.row.id}:${n.id}`).sort().join('|')
  if (comboNodes.has(combo) && comboNodes.get(combo) !== key) { problems.push(`${sel}: .${combo} is also used for a different set of nodes (another selector): give each its own name`); continue }
  comboNodes.set(combo, key)
  let comboRule = existing
  if (!comboRule) {
    const id = nid()
    comboRule = { id, name: combo, kind: 'class', selector: `.${combo}`, styles: {}, contextStyles: {}, order: Math.max(...rules.map((x) => x.order ?? 0)) + 1, createdAt: Date.now(), updatedAt: Date.now() }
    shell.styleRules[id] = comboRule
    classRules.set(combo, comboRule)
    nameOf.set(id, combo)
  }
  for (const { t, id } of e.nodes) {
    const n = t.body.nodes[id]
    if (!(n.classIds ?? []).includes(comboRule.id)) { n.classIds = [...(n.classIds ?? []), comboRule.id]; changedRowIds.add(t.row.id) }
  }
  for (const r of e.rules) { r.selector = newSel; r.updatedAt = Date.now(); rewritten.add(r) }
  console.log(`  ${sel.padEnd(60)} -> ${newSel}   (${e.nodes.length} node(s))`)
}
if (problems.length) { console.error(`\nREFUSING — ${problems.length} problem(s):`); for (const p of problems) console.error(`  ${p}`); process.exit(1) }
const changedPages = trees.filter((t) => changedRowIds.has(t.row.id)).map((t) => api.toChangedPage({ ...t.row, cells: { ...t.row.cells, body: t.body } }))
console.log(`\n${Object.keys(map).length} rule(s) rewritten; ${changedPages.length} page(s) gain combo classes`)
if (!APPLY) { console.log('DRY RUN — nothing written. Re-run with --apply.'); process.exit(0) }
writeFileSync(join(OUT, `before-context-combo.${seq}.json`), JSON.stringify({ site: (await api.getSite()).site, pages: rows }))
const res = await api.api('PUT', '/admin/api/cms/site-document', {
  mode: 'incremental', site: shell, changedPages, deletedPageIds: [],
  changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [],
  baseSeqs: Object.fromEntries(changedPages.map((p) => [p.id, rows.find((r) => r.id === p.id).seq])),
  shellBaseSeq: seq,
})
console.log(`saved — ${JSON.stringify(res).slice(0, 120)}. Not published. Backup: output/fleet/${client}/before-context-combo.${seq}.json`)
