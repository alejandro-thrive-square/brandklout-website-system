#!/usr/bin/env node
/**
 * CLASS MODEL LINT (read-only): does every style rule fit the Webflow-style model in Instatic?
 *
 *   node class-model-lint.mjs --site <client>:staging [--rich a,b] [--json out.json] [--examples 6]
 *
 * The user's test (2026-10-09): select an element in the Instatic editor and edit it in ONE place. The
 * Styles panel lists EVERY registry rule that matches the element, so the registry may hold only:
 *   ok  chip              `.card` (kind class)
 *   ok  combo chip        `.button.is-secondary` (kind class, compound: native in Instatic)
 *   ok  chip state        `.card:hover`, `.button.is-secondary:focus-visible` (Instatic has no state slot
 *                         inside a chip; the panel ties these to the element), and a list of states of ONE
 *                         compound (`.x:hover,.x:focus-visible`)
 *   ok  pseudo-element    `.button::before`, `.button:hover::after` on a chip or combo (user's exception)
 *   ok  script state      `.nav_component.is-open`: a class a script adds, as a combo (user's exception)
 *   ok  runtime element   `.split_line-mask`: a class only on elements a script creates (no node to chip)
 *   ok  rich text         `.text-rich-text p` / `a:hover` inside a rich-text class (user's exception;
 *                         rich-text classes match /rich-?text|richtext|prose/ or --rich)
 *   ok  global            tag / `:root` / `*` / attribute-only rules and lists of them, @keyframes
 * Everything else is a problem, named by what fixes it:
 *   contextual        `.design_copy .heading-style-h2` -> a combo chip on the nodes it matches
 *   theme context     `[data-theme="dark"] .x` -> the section sets the colour, children inherit (user)
 *   script context    `.js .reveal` / `.is-open .drawer_link`: an ancestor class a script adds
 *   parent state      `.card:hover .card_title`: a child restyled by its parent's state
 *   tag inside class  `.card_body p`: inner tags styled through a class that is not rich text
 *   selector list     `.a, .b .c`: one rule for several classes -> split per chip
 *   split class       a second bare `.x` rule beside the chip -> fold into the chip
 *   loose combo       `.a.b` as an ambient rule where both classes are on nodes -> a combo chip
 *   tag in selector   `h1.text-style-tagline`, `a.button`
 *   structural        `:not()`, `:nth-child()`, `[attr]` on a class compound
 *   chip selector     a class chip whose selector is not `.name` / `.base.name`
 *   (cleanup, ok)     `unused`: a class on no node, in no script and no embed HTML (never matches);
 *                     `embed html`: a class only inside raw HTML blocks (not nodes, not in the panel)
 *   motion system     `.js [data-reveal].is-revealed`: script-keyed reveal / split / wipe attributes
 * Exit 1 when any problem remains. Standard: ../client-first-style-guide/CLASS-STANDARD.md §11.
 */
import { writeFileSync } from 'node:fs'
import { connect, argOf } from './target.mjs'
import { splitTop } from './css-source.mjs'

const { api } = await connect()
const { site } = await api.getSite()
const { rows } = await api.getPages()
const rules = Object.values(site.styleRules ?? {})
const RICH = new RegExp(`rich-?text|richtext|prose${argOf('--rich') ? '|^(' + argOf('--rich').split(',').join('|') + ')$' : ''}`)
const STATES = new Set(['hover', 'focus', 'focus-visible', 'focus-within', 'active', 'visited', 'checked', 'disabled', 'target', 'placeholder-shown', 'indeterminate'])
const PSEUDO_EL = new Set(['before', 'after', 'placeholder', 'marker', 'selection'])
const okPseudoEl = (e) => PSEUDO_EL.has(e) || /^-(webkit|moz)-/.test(e)
// Attribute states Webflow has as states too ("Current" for links, open/expanded/selected): a chip state.
const ATTR_STATE = /^(aria-(current|expanded|selected|pressed|checked|disabled)|open|disabled|checked|data-(active|state|open|selected|current))$/
// The scroll-reveal / split-text / wipe motion system: script-keyed attributes, a category of its own.
const MOTION = /^\.js\b|\[data-(reveal|split|wipe|in|drag|parallax|motion|anim[\w-]*)\b/

/* classes on nodes, and text a script could add a class from */
const nameOf = new Map(rules.map((r) => [r.id, r.name]))
const onNodes = new Set()
const noteTree = (nodes) => { for (const n of Object.values(nodes ?? {})) for (const id of n.classIds ?? []) { const nm = nameOf.get(id); if (nm) onNodes.add(nm) } }
for (const row of rows ?? []) { const b = typeof row.cells?.body === 'string' ? JSON.parse(row.cells.body) : row.cells?.body; noteTree(b?.nodes) }
for (const vc of site.visualComponents ?? []) noteTree(vc.tree?.nodes)
const scriptText = [
  ...(site.files ?? []).filter((f) => f.type === 'script').map((f) => f.content ?? ''),
  ...(rows ?? []).flatMap((row) => JSON.stringify(row.cells?.body ?? '').match(/<script[\s\S]*?<\\?\/script>/gi) ?? []),
].join('\n')
const byScript = (c) => new RegExp(`(^|[^\\w-])${c.replace(/-/g, '\\-')}([^\\w-]|$)`).test(scriptText)
const chipNames = new Set(rules.filter((r) => r.kind === 'class').map((r) => r.name))
// classes written inside embed / raw HTML on pages (not nodes, so never in the Styles panel)
const bodiesText = (rows ?? []).map((row) => JSON.stringify(row.cells?.body ?? '')).join('\n')
const inEmbed = (c) => new RegExp(`class=\\\\?"[^"\\\\]*(^|[\\s"])${c.replace(/-/g, '\\-')}([\\s"\\\\]|$)`).test(bodiesText)

/* a selector part -> compounds split on combinators outside () [] and quotes */
function compounds(part) {
  const out = []
  let cur = '', depth = 0, quote = null
  for (const ch of part.trim()) {
    if (quote) { cur += ch; if (ch === quote) quote = null; continue }
    if (ch === '"' || ch === "'") { quote = ch; cur += ch; continue }
    if (ch === '(' || ch === '[') depth++
    if (ch === ')' || ch === ']') depth--
    if (depth === 0 && /[\s>+~]/.test(ch)) { if (cur) out.push(cur); cur = ''; continue }
    cur += ch
  }
  if (cur) out.push(cur)
  return out
}
function parse(c) {
  const bare = c.replace(/:not\([^)]*\)|:(is|where|has|nth-[\w-]+)\([^)]*\)/g, '')
  const attrs = [...bare.matchAll(/\[([\w-]+)/g)].map((m) => m[1])
  const attrStates = attrs.filter((a) => ATTR_STATE.test(a))
  return {
    classes: [...bare.matchAll(/\.([\w-]+)/g)].map((m) => m[1]),
    notClasses: [...c.matchAll(/:not\(([^)]*)\)/g)].flatMap((m) => [...m[1].matchAll(/\.([\w-]+)/g)].map((x) => x[1])),
    tag: (c.match(/^([a-zA-Z][\w-]*|\*)/) ?? [])[1] ?? '',
    attr: attrs.length > attrStates.length,
    attrStates,
    structural: /:(not|is|where|has|nth-[\w-]+|first-child|last-child|only-child|first-of-type|last-of-type|empty|root)\b/.test(c),
    states: [...c.matchAll(/(?<!:):([\w-]+)/g)].map((m) => m[1]).filter((p) => STATES.has(p)),
    otherPseudo: [...c.matchAll(/(?<!:):([\w-]+)/g)].map((m) => m[1]).filter((p) => !STATES.has(p) && !['not', 'is', 'where', 'has', 'root'].includes(p) && !p.startsWith('nth-') && !/child|of-type|empty/.test(p)),
    pseudoEl: [...c.matchAll(/::([\w-]+)/g)].map((m) => m[1]),
  }
}
const isRuntime = (cls) => !onNodes.has(cls) && byScript(cls)
const isDead = (cls) => !onNodes.has(cls) && !byScript(cls) && !chipNames.has(cls)

/* one selector part -> [category, ok] */
function classify(part, rule) {
  const cs = compounds(part)
  const ps = cs.map(parse)
  const anyClass = ps.some((p) => p.classes.length)
  if (MOTION.test(part)) return ['motion system', false]
  if (!anyClass) return ['global', true]
  const subj = ps[ps.length - 1]
  if (cs.length === 1) {
    if (subj.tag && subj.tag !== '*') return ['tag in selector', false]
    if (subj.attr || subj.structural) return ['structural', false]
    if (subj.pseudoEl.some((e) => !okPseudoEl(e))) return ['structural', false]
    const runtime = subj.classes.filter((c) => !onNodes.has(c))
    const hasState = subj.states.length > 0 || subj.attrStates.length > 0
    const hasEl = subj.pseudoEl.length > 0
    if (subj.classes.length === 1) {
      const c = subj.classes[0]
      if (!onNodes.has(c)) {
        if (byScript(c)) return ['runtime element', true]
        if (inEmbed(c)) return ['embed html', true]
        if (!chipNames.has(c)) return ['unused (cleanup)', true]
      }
      if (hasEl) return ['pseudo-element', true]
      if (hasState) return ['chip state', true]
      return ['split class', false] // a second bare `.x` beside its chip
    }
    // compound
    if (runtime.length) {
      if (runtime.every((c) => byScript(c))) return [hasEl ? 'pseudo-element' : 'script state', true]
      if (runtime.every((c) => byScript(c) || inEmbed(c))) return ['embed html', true]
      // a compound with a class nobody uses never matches; `class-model.mjs tidy` deletes a rule only
      // when EVERY class in it is unused, so these stay as their own (harmless) category
      return [subj.classes.every((c) => runtime.includes(c)) ? 'unused (cleanup)' : 'never matches (cleanup)', true]
    }
    if (hasEl) return ['pseudo-element', true]
    if (hasState) return ['chip state', true]
    return ['loose combo', false]
  }
  // contextual: more than one compound
  const ancestors = ps.slice(0, -1)
  if (!subj.classes.length) {
    if (ancestors.some((a) => a.classes.some((c) => RICH.test(c)))) return ['rich text', true]
    return ['tag inside class', false]
  }
  if (ancestors.some((a) => a.attr && !a.classes.length) || /\[data-theme/.test(part)) return ['theme context', false]
  if (ancestors.some((a) => a.states.length || a.attrStates.length)) return ['parent state', false]
  if (ancestors.some((a) => [...a.classes, ...a.notClasses].some((c) => isRuntime(c)))) return ['script context', false]
  if (subj.tag && subj.tag !== '*') return ['tag in selector', false]
  return ['contextual', false]
}

const tally = new Map()
const problems = []
const note = (cat, ok, r) => {
  const t = tally.get(cat) ?? { ok, n: 0, ex: [] }
  t.n++
  if (t.ex.length < Number(argOf('--examples') ?? 6)) t.ex.push(r.selector.replace(/\s+/g, ' ').slice(0, 110))
  tally.set(cat, t)
  if (!ok) problems.push({ id: r.id, selector: r.selector, category: cat, order: r.order, props: Object.keys(r.styles ?? {}).concat(...Object.values(r.contextStyles ?? {}).map((b) => Object.keys(b ?? {}))) })
}
for (const r of rules) {
  const sel = String(r.selector ?? '').trim()
  if (/^@/.test(sel) || (!sel && r.rawCss)) { note('global', true, { ...r, selector: sel || '(raw css)' }); continue }
  if (r.kind === 'class') {
    if (sel === `.${r.name}`) { note('chip', true, r); continue }
    if (/^(\.[\w-]+)+$/.test(sel) && sel.endsWith(`.${r.name}`)) { note('combo chip', true, r); continue }
    note('chip selector', false, r); continue
  }
  const parts = splitTop(sel, ',').map((s) => s.trim()).filter(Boolean)
  if (parts.length > 1) {
    const cls = parts.map((p) => classify(p, r))
    if (cls.every(([c]) => c === 'global')) { note('global', true, r); continue }
    // a list of states/pseudo-elements of ONE compound is a state group of that chip
    // same compound once its states are stripped, attribute states included (`.x:hover, .x[aria-current]`),
    // exactly as `class-model.mjs tidy` decides which lists stay whole
    const bases = new Set(parts.map((p) => compounds(p).join(' ').replace(/::?[\w-]+(\([^)]*\))?/g, '').replace(/\[[^\]]*\]/g, '').trim()))
    if (bases.size === 1 && cls.every(([, ok]) => ok)) { note(cls[0][0], true, r); continue }
    note('selector list', false, r); continue
  }
  const [cat, ok] = classify(parts[0] ?? sel, r)
  note(cat, ok, r)
}

const order = [...tally.entries()].sort((a, b) => (a[1].ok === b[1].ok ? b[1].n - a[1].n : a[1].ok ? -1 : 1))
const total = rules.length
const bad = problems.length
console.log(`class model lint: ${total} rules, ${total - bad} fit the model, ${bad} problem(s)\n`)
for (const [cat, t] of order) {
  console.log(`${t.ok ? 'ok  ' : 'FIX '} ${String(t.n).padStart(5)}  ${cat}`)
  for (const e of t.ex) console.log(`              ${e}`)
}
if (argOf('--json')) writeFileSync(argOf('--json'), JSON.stringify({ total, problems, tally: Object.fromEntries(tally) }, null, 1))
process.exit(bad ? 1 : 0)
