/**
 * combo-classes.mjs — contextual overrides of role classes become combo classes (Client-First phase 2 B,
 * CLASS-STANDARD.md §10), in the SOURCE: this site is pushed from site-src, so the staging-side tool
 * (`tools/instatic-api-sync/context-combo.mjs`) is only used to propose the map and to prove the result.
 *
 * Map: ../../class-standard/combo-map.json   { ".context .role": "is-name", … }  (descendant selectors of
 * single-class compounds; reviewed by a person; the same file the staging tool reads).
 *
 *   node tools/combo-classes.mjs                 dry run: per map entry, the nodes in pages/ + partials/ that
 *                                                would get the combo and the css rules that would be rewritten
 *   node tools/combo-classes.mjs --apply         write pages/, partials/ and css/
 *   node tools/combo-classes.mjs --check [dir]   count in a BUILD (default dist/): per entry, nodes the old
 *                                                selector matches, how many carry the combo, and combo nodes
 *                                                the old selector does not match (must be 0 / all / 0)
 *
 * What it does: `.footer_column .text-style-label { … }` restyles the role class wherever it sits in a footer
 * column, so a Styles-panel edit to `text-style-label` does nothing there. Each node the old selector matches
 * gets the combo (`text-style-label is-footer-column`) and the rule becomes `.text-style-label.is-footer-column`
 * (same specificity, same place in the cascade), so the computed styles do not change.
 *
 * The HTML matcher is a small tag scanner (comments, raw text of script/style, void and self-closed tags,
 * include markers and {{placeholders}} are inert); it needs the well-formed, hand-written markup this site
 * has. `--check` on the build is the proof, and the staging tool's `--map` dry run after the push lists 0
 * candidates when every override is gone. Pages that `tools/gen-journal.mjs` writes are patched here too, and
 * the generator's templates carry the same combos by hand (a regeneration must produce the same files).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const MAP = path.resolve(SRC, '../../class-standard/combo-map.json')
const args = process.argv.slice(2)
const APPLY = args.includes('--apply')
const CHECK = args.indexOf('--check')
const map = JSON.parse(fs.readFileSync(MAP, 'utf8'))

const CLOSE = /<\/([A-Za-z][^\s>/]*)\s*>/y, OPEN = /<([A-Za-z][^\s>/]*)/y, ATTR = /[^\s=/>]+/y // sticky: no slice per tag
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'])
const RAW = new Set(['script', 'style'])

const entries = Object.entries(map).map(([selector, combo]) => {
  const compounds = selector.trim().split(/\s+/)
  if (compounds.some((c) => !/^(\.[A-Za-z0-9_-]+)+$/.test(c)) || compounds.length < 2 || !/^is-[a-z0-9-]+$/.test(combo)) {
    throw new Error(`map entry not supported here (descendant selector of class compounds -> is-*): ${selector} -> ${combo}`)
  }
  return { selector, combo, parts: compounds.map((c) => c.split('.').filter(Boolean)), subject: compounds.at(-1) }
})

/* ── tag scanner: elements in document order with their ancestor chain ───────────────────────────────────── */
function scan(text) {
  const out = []
  const stack = []
  let i = 0
  const n = text.length
  while (i < n) {
    const lt = text.indexOf('<', i)
    if (lt < 0) break
    if (text.startsWith('<!--', lt)) { const e = text.indexOf('-->', lt + 4); i = e < 0 ? n : e + 3; continue }
    if (text.startsWith('<!', lt) || text.startsWith('<?', lt)) { const e = text.indexOf('>', lt); i = e < 0 ? n : e + 1; continue }
    if (text.startsWith('</', lt)) {
      CLOSE.lastIndex = lt
      const m = CLOSE.exec(text)
      if (!m) { i = lt + 2; continue }
      const name = m[1].toLowerCase()
      const at = stack.map((s) => s.tag).lastIndexOf(name)
      if (at >= 0) stack.length = at
      i = lt + m[0].length
      continue
    }
    OPEN.lastIndex = lt
    const nm = OPEN.exec(text)
    if (!nm) { i = lt + 1; continue }
    const tag = nm[1].toLowerCase()
    let j = lt + nm[0].length
    let selfClosed = false
    let classAttr = null
    // attributes
    while (j < n) {
      while (j < n && /\s/.test(text[j])) j++
      if (text[j] === '>') { j++; break }
      if (text[j] === '/' && text[j + 1] === '>') { selfClosed = true; j += 2; break }
      ATTR.lastIndex = j
      const an = ATTR.exec(text)
      if (!an) { j++; continue }
      const name = an[0].toLowerCase()
      j += an[0].length
      while (j < n && /\s/.test(text[j])) j++
      let vs = -1, ve = -1
      if (text[j] === '=') {
        j++
        while (j < n && /\s/.test(text[j])) j++
        const q = text[j]
        if (q === '"' || q === "'") { vs = j + 1; ve = text.indexOf(q, vs); if (ve < 0) ve = n; j = ve + 1 }
        else { vs = j; while (j < n && !/[\s>]/.test(text[j])) j++; ve = j }
      }
      if (name === 'class' && vs >= 0) classAttr = { vs, ve }
    }
    const classes = classAttr ? text.slice(classAttr.vs, classAttr.ve).split(/\s+/).filter(Boolean) : []
    const el = { tag, classes, classAttr, open: lt, ancestors: stack.map((s) => s.classes) }
    out.push(el)
    if (RAW.has(tag)) { const e = text.indexOf(`</${tag}`, j); j = e < 0 ? n : e }
    else if (!VOID.has(tag) && !selfClosed) stack.push({ tag, classes })
    i = j
  }
  return out
}

const has = (classes, want) => want.every((c) => classes.includes(c))
function matches(el, entry) {
  if (!has(el.classes, entry.parts.at(-1))) return false
  // remaining compounds, right to left, each on some strictly higher ancestor
  let top = el.ancestors.length
  for (let k = entry.parts.length - 2; k >= 0; k--) {
    let found = -1
    for (let a = top - 1; a >= 0; a--) if (has(el.ancestors[a], entry.parts[k])) { found = a; break }
    if (found < 0) return false
    top = found
  }
  return true
}

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? walk(path.join(dir, e.name)) : e.name.endsWith('.html') ? [path.join(dir, e.name)] : [])

/* ── --check: a build ──────────────────────────────────────────────────────────────────────────────────────── */
if (CHECK >= 0) {
  const dir = path.resolve(SRC, args[CHECK + 1] && !args[CHECK + 1].startsWith('--') ? args[CHECK + 1] : 'dist')
  const files = walk(dir)
  const rows = entries.map((e) => ({ ...e, matched: 0, withCombo: 0, extra: 0, pages: new Set() }))
  for (const f of files) {
    const els = scan(fs.readFileSync(f, 'utf8'))
    for (const r of rows) {
      for (const el of els) {
        const m = matches(el, r), c = el.classes.includes(r.combo)
        if (m) { r.matched++; r.pages.add(f); if (c) r.withCombo++ }
        else if (c) r.extra++
      }
    }
  }
  let bad = 0
  console.log(`${dir}: ${files.length} page(s)`)
  for (const r of rows) {
    const ok = r.matched > 0 && r.withCombo === r.matched && r.extra === 0
    if (!ok) bad++
    console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${r.selector.padEnd(46)} ${String(r.matched).padStart(4)} node(s) on ${String(r.pages.size).padStart(2)} page(s); with ${r.combo}: ${r.withCombo}; ${r.combo} elsewhere: ${r.extra}`)
  }
  console.log(bad ? `${bad} entry(ies) not fully applied` : 'every matched node carries its combo and no other node does')
  process.exit(bad ? 1 : 0)
}

/* ── dry run / apply on the source ─────────────────────────────────────────────────────────────────────────── */
const files = [...walk(path.join(SRC, 'pages')), ...walk(path.join(SRC, 'partials'))]
const perEntry = Object.fromEntries(entries.map((e) => [e.selector, { nodes: 0, files: new Set(), already: 0 }]))
let changed = 0
for (const f of files) {
  const text = fs.readFileSync(f, 'utf8')
  const edits = [] // { at, combo }
  for (const el of scan(text)) {
    for (const e of entries) {
      if (!matches(el, e)) continue
      const p = perEntry[e.selector]
      if (el.classes.includes(e.combo)) { p.already++; continue }
      p.nodes++; p.files.add(path.relative(SRC, f))
      edits.push({ at: el.classAttr.ve, combo: e.combo })
    }
  }
  if (!edits.length) continue
  changed++
  let out = text
  // several combos on one node share the insertion point: keep map order, insert from the end
  edits.sort((a, b) => b.at - a.at || 0)
  const grouped = new Map()
  for (const ed of edits) grouped.set(ed.at, [...(grouped.get(ed.at) ?? []), ed.combo])
  for (const [at, combos] of [...grouped.entries()].sort((a, b) => b[0] - a[0])) out = out.slice(0, at) + ' ' + combos.join(' ') + out.slice(at)
  if (APPLY) fs.writeFileSync(f, out)
}
console.log(`${APPLY ? 'applied' : 'DRY RUN'}: ${files.length} source file(s) scanned, ${changed} ${APPLY ? 'rewritten' : 'would change'}`)
for (const e of entries) {
  const p = perEntry[e.selector]
  console.log(`  ${e.selector.padEnd(46)} +${e.combo.padEnd(22)} ${String(p.nodes).padStart(4)} node(s) in ${p.files.size} file(s)${p.already ? `; ${p.already} already carried it` : ''}`)
}

/* css: the rule's selector becomes subject + combo, in place */
const cssDir = path.join(SRC, 'css')
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
let cssHits = 0
const cssPer = Object.fromEntries(entries.map((e) => [e.selector, 0]))
for (const f of fs.readdirSync(cssDir).filter((x) => x.endsWith('.css'))) {
  const file = path.join(cssDir, f)
  let css = fs.readFileSync(file, 'utf8')
  const before = css
  for (const e of entries) {
    const re = new RegExp(`^([ \\t]*)${esc(e.selector)}([ \\t]*\\{)`, 'gm')
    css = css.replace(re, (m, a, b) => { cssHits++; cssPer[e.selector]++; return `${a}${e.subject}.${e.combo}${b}` })
  }
  if (css !== before && APPLY) fs.writeFileSync(file, css)
}
console.log(`css: ${cssHits} rule selector(s) ${APPLY ? 'rewritten' : 'would be rewritten'}`)
for (const e of entries) if (!cssPer[e.selector]) console.log(`  WARN no css rule starts with ${e.selector}`)
if (!APPLY) console.log('re-run with --apply to write; then rebuild and `--check dist`')
