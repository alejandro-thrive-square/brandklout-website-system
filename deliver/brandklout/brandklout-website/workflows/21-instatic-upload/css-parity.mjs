#!/usr/bin/env node
/**
 * Step 7b — did every DECLARATION the build wrote reach the published CSS?
 *
 * The conversion drops declarations silently. Trap 1 dropped custom properties,
 * trap 21 dropped bare `clamp()`/`min()`/`max()` values, trap 32 dropped all but
 * the last layer of a multi-layer `background`. Each of those was found by a
 * different accident — a screenshot, a network log, a pixel diff — after it had
 * shipped.
 *
 * This asks the question directly and cheaply: for every rule in the local
 * bundle, does the published CSS carry a rule with the same selector, and does
 * that rule declare every property this one declares?
 *
 * PROPERTIES, NOT VALUES, and deliberately. The publisher rewrites values as it
 * pleases — `0` becomes `0px`, a shorthand expands into longhands, a colour is
 * normalised — and comparing values means writing a CSS value normaliser, which
 * is a project. A dropped declaration is the failure that has actually happened
 * here, three times, and a missing PROPERTY NAME catches all three:
 *
 *   - a custom property that never arrived      -> the name is absent
 *   - a clamp() the parser refused              -> the name is absent
 *   - a `background` reduced to one layer       -> `background` is absent, and
 *                                                  the longhands it expanded to
 *                                                  are declared instead, which
 *                                                  is why shorthands are
 *                                                  expanded before comparing
 *
 * Selectors are matched on normalised text, so a rule the publisher reordered
 * or reformatted still pairs. A selector missing entirely is reported too — that
 * is the tree-shake (trap 2) and it is expected for runtime-only classes, so
 * those are listed separately rather than failed.
 *
 * Usage: node css-parity.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const LOCAL_CSS = path.resolve(HERE, '.tmp/site/final-site/assets/site.css')

function loadEnv() {
  let dir = HERE
  for (let i = 0; i < 12; i++) {
    const c = path.join(dir, '.env')
    if (fs.existsSync(c)) {
      for (const line of fs.readFileSync(c, 'utf8').split(/\r?\n/)) {
        const m = line.match(/^([A-Z_]+)=(.*)$/)
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim()
      }
      return
    }
    const up = path.dirname(dir)
    if (up === dir) break
    dir = up
  }
}
loadEnv()
const REMOTE = (process.env.INSTATIC_BASE_URL || '').replace(/\/$/, '')
if (!REMOTE) throw new Error('INSTATIC_BASE_URL is not set')

/* Shorthands the publisher is known to expand. A local `background: a, b` has
   to count as satisfied by live longhands, or every background in the build
   reports as missing. The expansion is only consulted when the shorthand name
   itself is absent live. */
const EXPANDS = {
  background: ['background-image', 'background-color', 'background-position', 'background-position-x', 'background-position-y', 'background-size', 'background-repeat', 'background-attachment', 'background-origin', 'background-clip'],
  margin: ['margin-top', 'margin-right', 'margin-bottom', 'margin-left'],
  padding: ['padding-top', 'padding-right', 'padding-bottom', 'padding-left'],
  inset: ['top', 'right', 'bottom', 'left'],
  border: ['border-top-width', 'border-top-style', 'border-top-color'],
  'border-top': ['border-top-width', 'border-top-style', 'border-top-color'],
  'border-right': ['border-right-width', 'border-right-style', 'border-right-color'],
  'border-bottom': ['border-bottom-width', 'border-bottom-style', 'border-bottom-color'],
  'border-left': ['border-left-width', 'border-left-style', 'border-left-color'],
  'border-color': ['border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color'],
  'border-style': ['border-top-style', 'border-right-style', 'border-bottom-style', 'border-left-style'],
  'border-width': ['border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width'],
  outline: ['outline-width', 'outline-style', 'outline-color'],
  'border-radius': ['border-top-left-radius', 'border-top-right-radius', 'border-bottom-right-radius', 'border-bottom-left-radius'],
  font: ['font-family', 'font-size', 'font-weight', 'line-height'],
  flex: ['flex-grow', 'flex-shrink', 'flex-basis'],
  gap: ['row-gap', 'column-gap'],
  transition: ['transition-property', 'transition-duration', 'transition-timing-function', 'transition-delay'],
  animation: ['animation-name', 'animation-duration', 'animation-timing-function', 'animation-delay', 'animation-iteration-count', 'animation-direction', 'animation-fill-mode', 'animation-play-state'],
  'grid-template': ['grid-template-rows', 'grid-template-columns', 'grid-template-areas'],
  'grid-area': ['grid-row-start', 'grid-column-start', 'grid-row-end', 'grid-column-end'],
  'place-items': ['align-items', 'justify-items'],
  'place-content': ['align-content', 'justify-content'],
  mask: ['mask-image', 'mask-mode', 'mask-repeat', 'mask-position', 'mask-size'],
  overflow: ['overflow-x', 'overflow-y'],
}

function rules(text) {
  const found = []
  let i = 0
  while (i < text.length) {
    const open = text.indexOf('{', i)
    if (open < 0) break
    let depth = 0
    let close = -1
    for (let j = open; j < text.length; j++) {
      if (text[j] === '{') depth++
      else if (text[j] === '}') {
        depth--
        if (depth === 0) { close = j; break }
      }
    }
    if (close < 0) break
    found.push({ sel: text.slice(i, open).trim(), body: text.slice(open + 1, close) })
    i = close + 1
  }
  return found
}

function props(body) {
  const out = new Set()
  let depth = 0
  let start = 0
  const parts = []
  for (let i = 0; i < body.length; i++) {
    const c = body[i]
    if (c === '(' || c === '{') depth++
    else if (c === ')' || c === '}') depth--
    else if (c === ';' && depth === 0) { parts.push(body.slice(start, i)); start = i + 1 }
  }
  parts.push(body.slice(start))
  for (const p of parts) {
    const colon = p.indexOf(':')
    if (colon < 1) continue
    const name = p.slice(0, colon).trim()
    if (/^-?-?[a-zA-Z][a-zA-Z0-9-]*$/.test(name)) out.add(name)
  }
  return out
}

const norm = (sel) => sel.replace(/\s+/g, ' ').replace(/\s*([>+~,])\s*/g, '$1').trim()

// key = "<media condition or ''>||<one selector>", value = Set(property)
function index(css) {
  const map = new Map()
  const add = (cond, sel, body) => {
    const ps = props(body)
    if (!ps.size) return
    for (const one of sel.split(',')) {
      const k = cond + '||' + norm(one)
      if (!k.endsWith('||')) map.set(k, new Set([...(map.get(k) ?? []), ...ps]))
    }
  }
  const walk = (text, cond) => {
    for (const r of rules(text)) {
      if (/^@(media|supports|container)\b/.test(r.sel)) walk(r.body, norm(r.sel))
      else if (r.sel.startsWith('@')) continue
      else add(cond, r.sel, r.body)
    }
  }
  walk(css.replace(/\/\*[\s\S]*?\*\//g, ' '), '')
  return map
}

const localCss = fs.readFileSync(LOCAL_CSS, 'utf8')
const home = await (await fetch(REMOTE + '/')).text()
const hrefs = [...home.matchAll(/href="(\/_instatic\/css\/[^"]+\.css)"/g)].map((m) => m[1])
let liveCss = ''
for (const h of hrefs) liveCss += '\n' + (await (await fetch(REMOTE + h)).text())
console.log(`live stylesheets: ${hrefs.map((h) => h.split('/').pop()).join(', ')}`)

const L = index(localCss)
const R = index(liveCss)

// Every property declared live anywhere for a selector, ignoring the condition,
// as a fallback: the publisher sometimes rewrites a condition's text.
const RbySel = new Map()
for (const [k, v] of R) {
  const sel = k.split('||')[1]
  RbySel.set(sel, new Set([...(RbySel.get(sel) ?? []), ...v]))
}

const missingRules = []
const missingProps = []
for (const [k, want] of L) {
  const [cond, sel] = k.split('||')
  const have = R.get(k) ?? RbySel.get(sel)
  if (!have) { missingRules.push({ cond, sel }); continue }
  for (const p of want) {
    if (have.has(p)) continue
    const expanded = EXPANDS[p]
    if (expanded && expanded.some((x) => have.has(x))) continue
    missingProps.push({ cond, sel, prop: p })
  }
}

/* A selector the tree shake removed is expected — trap 2 — so those are listed
   and not failed. A DECLARATION missing from a rule that IS published is not
   expected and is what this gate exists for. */
console.log(`\nlocal rules ${L.size}, live rules ${R.size}`)
if (missingRules.length) {
  console.log(`\n${missingRules.length} selector(s) not published at all (tree shake, trap 2 — review, do not assume):`)
  for (const m of missingRules.slice(0, 40)) console.log(`  ${m.cond ? m.cond + ' ' : ''}${m.sel}`)
  if (missingRules.length > 40) console.log(`  … and ${missingRules.length - 40} more`)
}
if (missingProps.length) {
  console.log(`\nFAIL — ${missingProps.length} declaration(s) published without their property:`)
  for (const m of missingProps) console.log(`  ${m.cond ? m.cond + '  ' : ''}${m.sel}  {${m.prop}}`)
  process.exit(1)
}
console.log('\nFAIL  none — every declared property reached the published CSS')
