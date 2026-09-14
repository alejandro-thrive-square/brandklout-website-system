/**
 * Step 1b (2026-09-14) — rebuild Sang's CSS as a CLASS SYSTEM the Instatic editor can edit.
 *
 * WHY. v11's CSS is 2,735 selectors in six patch-layer files, and most elements are styled by
 * contextual rules (`.reference-site .reference-hero .lead`, ~20 rules on the hero paragraph alone).
 * Instatic's Styles panel edits a CLASS, and an edit on `.lead` loses to every one of those
 * contextual rules, so editing a paragraph "didn't quite properly update it" (Alejandro). Shipped
 * verbatim (the v11 publish) the panel showed nothing at all.
 *
 * WHAT. For every element on every page this resolves, in Chrome, which of Sang's declarations
 * actually win for it (specificity, source order, media conditions), and writes the result onto a
 * class of its OWN:
 *   - a layout class (`hero-lead`, `ref-proof-top`, …) carrying everything but type;
 *   - a type class (`text-18`, `heading-60`, …) shared by every element with the same type style, so
 *     changing `text-18` changes that size site-wide;
 *   - the original classes the scripts need (`faq-item`, `active`, …), unstyled, kept as hooks.
 * Every class selector has the same specificity, so an edit on any chip applies. Elements with an
 * identical result share one class, which is what makes the classes reusable.
 * States and runtime context keep their own selectors on the new class (`.btn-primary:hover`,
 * `.motion-ready .card:not(.is-visible)`, `.x::before`). Rules for elements the scripts create
 * (slider dots, the video pop-up), for SVG internals (Instatic keeps an <svg> as raw markup), for
 * `html`/`:root` and for bare element selectors stay as written.
 *
 * FLUID. Every px length above 2px becomes rem, and the root font size is
 * `clamp(100%, 100vw / 90, 160%)`: exactly 16px up to 1440px wide, so nothing changes there, then
 * text, spacing and the content width grow together, to 1.6x at 2304px and beyond.
 *
 * BREAKPOINTS. Sang's fourteen max-width queries fold into five editor breakpoints (BREAKPOINTS);
 * everything else (min-width, compound, reduced motion, print) is a site condition.
 *
 *   in:  .tmp/site/final-site/**            (prepare-source.mjs, shared layout)
 *   out: .tmp/site/class-site/**            the same pages with the new classes, and an
 *                                            assets/site.css that renders the registry exactly the
 *                                            way Instatic will (for the local checks)
 *        .tmp/site/site-src/registry.json   { breakpoints, conditions, rules } for import-run.ts
 *        .tmp/site/site-src/code.css        what cannot be a registry rule (the fluid root, @keyframes)
 *        .tmp/site/site-src/class-report.json
 *
 * Usage: node class-system.mjs        (then class-parity.mjs to prove nothing moved)
 */
import fs from 'node:fs'
import path from 'node:path'
import http from 'node:http'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const SITE = path.join(HERE, '.tmp', 'site')
const FINAL = path.join(SITE, 'final-site')
const OUT = path.join(SITE, 'class-site')
const SRC = path.join(SITE, 'site-src')
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const refuse = (m) => {
  console.error('REFUSING: ' + m)
  process.exit(1)
}

/* --- configuration ------------------------------------------------------------------------ */
/* The editor's breakpoints. Sang's max-width queries fold into the nearest one at or ABOVE them
   (a rule written for ≤980 now starts at ≤991), except where the table says otherwise. Checked
   with class-parity.mjs at 1440, 1024, 820, 600, 390 and 360. */
const BREAKPOINTS = [
  { id: 'laptop', label: 'Laptop', width: 1190, mediaQuery: '(max-width: 1190px)', icon: 'monitor' },
  { id: 'laptop-s', label: 'Small laptop', width: 1050, mediaQuery: '(max-width: 1050px)', icon: 'monitor' },
  { id: 'tablet-l', label: 'Tablet landscape', width: 1000, mediaQuery: '(max-width: 1000px)', icon: 'tablet' },
  { id: 'tablet', label: 'Tablet', width: 800, mediaQuery: '(max-width: 800px)', icon: 'tablet' },
  { id: 'tablet-p', label: 'Tablet portrait', width: 760, mediaQuery: '(max-width: 760px)', icon: 'tablet' },
  { id: 'mobile-l', label: 'Large phone', width: 620, mediaQuery: '(max-width: 620px)', icon: 'smartphone' },
  { id: 'mobile', label: 'Phone', width: 480, mediaQuery: '(max-width: 480px)', icon: 'smartphone' },
  { id: 'mobile-s', label: 'Small phone', width: 400, mediaQuery: '(max-width: 400px)', icon: 'smartphone' },
  { id: 'mobile-xs', label: 'Extra small phone', width: 360, mediaQuery: '(max-width: 360px)', icon: 'smartphone' },
]
/* Where each of Sang's widths goes. Chosen so no common device width changes behaviour (1180, 1024,
   820, 768, 600, 430, 414, 390, 375, 360); every fold moves a boundary only across a range no device
   sits in. Learned the hard way (2026-09-14, class-parity.mjs): folding ≤1000 into 1050 collapsed the
   desktop nav at 1024; ≤520 into 620 moved the buttons at 600; ≤360 into 480 moved phones at 390;
   ≤1150 and ≤1050 into 1199 shrank every story hero at 1180 (iPad Air landscape).
     1150 -> 1050 (1051-1150 lose Sang's ≤1150 rules)   980 -> 1000 (981-1000)
     780 -> 800 (781-800)    720 -> 760 (721-760)    520 -> 480 (481-520) */
const BP_MAP = { 1190: 'laptop', 1150: 'laptop-s', 1050: 'laptop-s', 1000: 'tablet-l', 980: 'tablet-l', 800: 'tablet', 780: 'tablet', 760: 'tablet-p', 720: 'tablet-p', 620: 'mobile-l', 520: 'mobile', 480: 'mobile', 400: 'mobile-s', 360: 'mobile-xs' }
const bpFor = (w) => {
  if (BP_MAP[w]) return BREAKPOINTS.find((b) => b.id === BP_MAP[w])
  const exact = BREAKPOINTS.find((b) => b.width === w)
  return exact ?? null // a width nobody mapped stays a condition of its own, rather than being guessed
}
const FLUID_ROOT = 'clamp(100%, 100vw / 90, 160%)'
const MARK = String.fromCharCode(1) // a character no CSS value contains

// Classes the scripts add, remove or toggle (site.js, visual.js, stories-v10.js, agency/*.js, and
// push-site's `js`). Found by reading them; any other class the scripts add at runtime is found by
// diffing each element's classes before and after they run.
const STATE_CLASSES = new Set(['reduce-motion', 'motion-ready', 'is-visible', 'media-unavailable', 'active', 'open', 'show', 'error', 'is-complete', 'highlight', 'is-active', 'js'])
// Attributes the scripts set; a selector on one of these is state, kept as written.
const DYN_ATTRS = new Set(['aria-pressed', 'aria-expanded', 'aria-current', 'aria-label', 'hidden', 'inert', 'open', 'disabled', 'checked', 'data-playing', 'data-counted', 'data-submitting', 'data-submitted', 'data-state', 'data-online-attempted', 'data-visual-bound', 'data-bk-bound', 'data-key-bound', 'data-slider-bound'])
const STATE_PSEUDO = new Set(['hover', 'focus', 'focus-visible', 'focus-within', 'active', 'visited', 'checked', 'disabled', 'enabled', 'invalid', 'valid', 'user-invalid', 'placeholder-shown', 'target', 'indeterminate', 'autofill', '-webkit-autofill', 'open', 'popover-open', 'fullscreen', 'playing', 'paused'])
const LEGACY_PE = new Set(['before', 'after', 'first-line', 'first-letter'])
const LOGICAL = new Set(['not', 'is', 'where', 'has', 'matches', '-webkit-any'])
const TYPO = ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'textTransform', 'fontStyle']

/* --- CSS text -> rules ----------------------------------------------------------------------- */
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, ' ')
function blocks(text) {
  const out = []
  let i = 0
  let q = null
  for (let start = 0; i < text.length; ) {
    const open = (() => {
      for (let j = i; j < text.length; j++) {
        const c = text[j]
        if (q) { if (c === q && text[j - 1] !== '\\') q = null; continue }
        if (c === '"' || c === "'") q = c
        else if (c === '{') return j
      }
      return -1
    })()
    if (open < 0) break
    let depth = 0
    let close = -1
    for (let j = open; j < text.length; j++) {
      const c = text[j]
      if (q) { if (c === q && text[j - 1] !== '\\') q = null; continue }
      if (c === '"' || c === "'") q = c
      else if (c === '{') depth++
      else if (c === '}' && --depth === 0) { close = j; break }
    }
    if (close < 0) refuse('unbalanced braces')
    out.push({ sel: text.slice(start, open).trim(), body: text.slice(open + 1, close) })
    i = start = close + 1
  }
  return out
}
function splitTop(s, sep) {
  const parts = []
  let depth = 0
  let q = null
  let start = 0
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (q) { if (c === q && s[i - 1] !== '\\') q = null; continue }
    if (c === '"' || c === "'") q = c
    else if (c === '(' || c === '[') depth++
    else if (c === ')' || c === ']') depth--
    else if (c === sep && depth === 0) { parts.push(s.slice(start, i)); start = i + 1 }
  }
  parts.push(s.slice(start))
  return parts.map((p) => p.trim()).filter(Boolean)
}
const pxToRem = (v) =>
  v.replace(/url\([^)]*\)|(-?\d*\.?\d+)px\b/g, (m, n) => (n === undefined ? m : Math.abs(Number(n)) <= 2 ? m : `${+(Number(n) / 16).toFixed(6)}rem`))
function decls(body) {
  return splitTop(body, ';').flatMap((d) => {
    const c = d.indexOf(':')
    if (c < 1) return []
    const prop = d.slice(0, c).trim()
    let value = d.slice(c + 1).trim()
    const imp = /!\s*important\s*$/i.test(value)
    if (imp) value = value.replace(/!\s*important\s*$/i, '').trim()
    return [{ prop: prop.startsWith('--') ? prop : prop.toLowerCase(), value: pxToRem(value), imp }]
  })
}
const normQuery = (q) => q.toLowerCase().replace(/\s+/g, ' ').replace(/\(\s*/g, '(').replace(/\s*\)/g, ')').replace(/\s*:\s*/g, ': ').trim()

/* --- selectors ------------------------------------------------------------------------------ */
function parseComplex(s) {
  const compounds = []
  const combs = []
  let cur = []
  let i = 0
  const bal = (j) => {
    let depth = 0
    for (let k = j; k < s.length; k++) {
      if (s[k] === '(') depth++
      else if (s[k] === ')' && --depth === 0) return k
    }
    throw new Error('unbalanced ( in ' + s)
  }
  while (i < s.length) {
    const c = s[i]
    if (/[\s>+~]/.test(c)) {
      let comb = ' '
      while (i < s.length && /[\s>+~]/.test(s[i])) { if (!/\s/.test(s[i])) comb = s[i]; i++ }
      if (cur.length) { compounds.push(cur); combs.push(comb); cur = [] }
      continue
    }
    let tok
    const rest = s.slice(i)
    if (c === '.') { const m = rest.match(/^\.(-?[_a-zA-Z][\w-]*)/); if (!m) throw new Error('class in ' + s); tok = { t: 'class', name: m[1], text: m[0] } }
    else if (c === '#') { const m = rest.match(/^#(-?[_a-zA-Z][\w-]*)/); if (!m) throw new Error('id in ' + s); tok = { t: 'id', name: m[1], text: m[0] } }
    else if (c === '[') {
      let q = null
      let k = i + 1
      for (; k < s.length; k++) { if (q) { if (s[k] === q) q = null } else if (s[k] === '"' || s[k] === "'") q = s[k]; else if (s[k] === ']') break }
      const text = s.slice(i, k + 1)
      tok = { t: 'attr', name: text.match(/^\[\s*([\w:-]+)/)[1].toLowerCase(), text }
    } else if (c === ':') {
      const m = rest.match(/^(::?)(-?[_a-zA-Z][\w-]*)/)
      if (!m) throw new Error('pseudo in ' + s)
      let text = m[0]
      let arg = null
      if (s[i + text.length] === '(') { const end = bal(i + text.length); arg = s.slice(i + text.length + 1, end); text = s.slice(i, end + 1) }
      const name = m[2].toLowerCase()
      tok = m[1] === '::' || LEGACY_PE.has(name) ? { t: 'pe', name, arg, text: '::' + text.replace(/^::?/, '') } : { t: 'pc', name, arg, text }
    } else if (c === '*') tok = { t: 'type', name: '*', text: '*' }
    else { const m = rest.match(/^-?[_a-zA-Z][\w-]*/); if (!m) throw new Error(`cannot read "${rest.slice(0, 20)}" in ${s}`); tok = { t: 'type', name: m[0].toLowerCase(), text: m[0] } }
    cur.push(tok)
    i += s.slice(i).startsWith(tok.text) ? tok.text.length : rest.match(/^::?[\w-]+(\([^)]*\))?/)[0].length
  }
  if (cur.length) compounds.push(cur)
  return { compounds, combs }
}
function specOf(sel) {
  const { compounds } = parseComplex(sel)
  const sp = [0, 0, 0]
  for (const tok of compounds.flat()) {
    if (tok.t === 'id') sp[0]++
    else if (tok.t === 'class' || tok.t === 'attr') sp[1]++
    else if (tok.t === 'pe' || (tok.t === 'type' && tok.name !== '*')) sp[2]++
    else if (tok.t === 'pc') {
      if (tok.name === 'where') continue
      if (LOGICAL.has(tok.name) && tok.arg) {
        const best = splitTop(tok.arg, ',').map(specOf).sort((a, b) => b[0] - a[0] || b[1] - a[1] || b[2] - a[2])[0] ?? [0, 0, 0]
        sp[0] += best[0]; sp[1] += best[1]; sp[2] += best[2]
      } else sp[1]++
    }
  }
  return sp
}
let stateClasses = new Set(STATE_CLASSES)
function isDyn(tok) {
  if (tok.t === 'class') return stateClasses.has(tok.name)
  if (tok.t === 'attr') return DYN_ATTRS.has(tok.name)
  if (tok.t === 'pc') {
    if (STATE_PSEUDO.has(tok.name)) return true
    if (LOGICAL.has(tok.name) && tok.arg) {
      try { return splitTop(tok.arg, ',').some((a) => parseComplex(a).compounds.flat().some(isDyn)) } catch { return true }
    }
  }
  return false
}
const textOf = (compound) => compound.map((t) => t.text).join('')
function analyze(sel) {
  const { compounds, combs } = parseComplex(sel)
  const n = compounds.length
  const subject = compounds[n - 1]
  const pe = subject.filter((t) => t.t === 'pe').map((t) => t.text).join('')
  const dyn = subject.filter((t) => t.t !== 'pe' && isDyn(t)).map((t) => t.text).join('')
  const idOf = (c) => textOf(c.filter((t) => t.t !== 'pe' && !isDyn(t))) || '*'
  let skeleton = ''
  compounds.forEach((c, k) => { skeleton += (k ? (combs[k - 1] === ' ' ? ' ' : ` ${combs[k - 1]} `) : '') + idOf(c) })
  const ancStart = compounds.slice(0, n - 1).findIndex((c) => c.some(isDyn))
  let anc = ''
  if (ancStart >= 0) {
    for (let k = ancStart; k < n - 1; k++) anc += textOf(compounds[k]) + (combs[k] === ' ' ? ' ' : ` ${combs[k]} `)
  }
  const all = compounds.flat()
  const global = !all.some((t) => t.t === 'id' || t.t === 'class' || t.t === 'attr' || t.t === 'pc')
  const html = subject.some((t) => (t.t === 'type' && t.name === 'html') || (t.t === 'pc' && t.name === 'root'))
  const ancClasses = ancStart < 0 ? [] : compounds.slice(ancStart, n - 1).flat().filter((t) => t.t === 'class').map((t) => t.name)
  const nonSubjectClasses = compounds.slice(0, n - 1).flat().filter((t) => t.t === 'class').map((t) => t.name)
  // `*`, `[hidden]`, `.x *::before`: a subject with nothing of its own to match on
  const identityEmpty = idOf(subject) === '*'
  return { sel, skeleton, anc, suffix: dyn + pe, pe, dyn, spec: specOf(sel), global, html, identityEmpty, generic: identityEmpty && !!(dyn || anc || pe), ancClasses, nonSubjectClasses, subjectClasses: subject.filter((t) => t.t === 'class').map((t) => t.name) }
}

/* --- conditions ----------------------------------------------------------------------------- */
const MAXW = /^\(max-width: (\d+(?:\.\d+)?)px\)$/
const MINW = /^\(min-width: (\d+(?:\.\d+)?)px\)$/
const oneImplies = (a, b) => {
  // a ⇒ b  (whenever a holds, b holds)
  if (a.kind === b.kind && a.query === b.query) return true
  if (a.kind !== 'media' || b.kind !== 'media') return false
  const [ax, bx] = [a.query.match(MAXW), b.query.match(MAXW)]
  if (ax && bx) return Number(bx[1]) >= Number(ax[1])
  const [an, bn] = [a.query.match(MINW), b.query.match(MINW)]
  if (an && bn) return Number(bn[1]) <= Number(an[1])
  return false
}
// ctxA ⇒ ctxB: every condition of B follows from some condition of A (both are conjunctions)
const implies = (A, B) => B.every((b) => A.some((a) => oneImplies(a, b)))
const ctxKey = (ctx) => ctx.map((c) => c.kind + ':' + c.query).join(' && ')
function ctxId(ctx, conditions) {
  if (!ctx.length) return ''
  if (ctx.length === 1 && ctx[0].kind === 'media') {
    const m = ctx[0].query.match(MAXW)
    const bp = m && bpFor(Number(m[1]))
    if (bp) return bp.id
  }
  const kinds = new Set(ctx.map((c) => c.kind))
  const cond = kinds.size === 1 ? { kind: ctx[0].kind, query: ctx.map((c) => c.query).join(' and ') } : { kind: 'media', query: ctx.filter((c) => c.kind === 'media').map((c) => c.query).join(' and ') }
  const id = `${cond.kind}:${cond.query}`
  if (!conditions.has(id)) conditions.set(id, { id, label: cond.query, condition: cond })
  return id
}

/* --- read the stylesheet -------------------------------------------------------------------- */
const manifest = JSON.parse(fs.readFileSync(path.join(SRC, 'pages.json'), 'utf8'))
if (manifest.layout !== 'shared') refuse('class-system.mjs handles the shared layout (v11) only')
const cssText = stripComments(fs.readFileSync(path.join(FINAL, 'assets', 'site.css'), 'utf8'))
const jsText = fs.readFileSync(path.join(FINAL, 'assets', 'site.js'), 'utf8')
const rules = [] // { order, sel, list: [analysis], decls, ctx }
const raw = [] // at-rules carried as written into the code asset
{
  const walk = (text, ctx) => {
    for (const b of blocks(text)) {
      const at = b.sel.match(/^@([\w-]+)\s*([\s\S]*)$/)
      if (at) {
        const name = at[1].toLowerCase()
        if (name === 'media' || name === 'supports') walk(b.body, [...ctx, { kind: name, query: normQuery(at[2]) }])
        else if (/keyframes$/.test(name) || name === 'font-face' || name === 'page' || name === 'property') {
          const t = `${b.sel}{${pxToRem(b.body)}}`
          raw.push(ctx.length ? ctx.reduceRight((inner, c) => `@${c.kind} ${c.query}{${inner}}`, t) : t)
        } else refuse(`@${name} is not handled`)
        continue
      }
      const list = splitTop(b.sel, ',')
      rules.push({ order: rules.length, sel: b.sel, list, decls: decls(b.body), ctx })
    }
  }
  walk(cssText, [])
}
// Classes the scripts add, beyond the list above: any class named in classList.add/toggle/replace.
for (const m of jsText.matchAll(/classList\.(?:add|toggle|replace|remove)\(([^)]*)\)/g)) for (const s of m[1].matchAll(/['"]([\w-]+)['"]/g)) stateClasses.add(s[1])
// Hook classes: every class the scripts look up by selector or test with classList.contains.
const hookClasses = new Set()
for (const m of jsText.matchAll(/(['"`])((?:\\.|(?!\1).)*)\1/g)) for (const c of m[2].matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) hookClasses.add(c[1])
for (const m of jsText.matchAll(/classList\.contains\(\s*['"]([\w-]+)['"]/g)) hookClasses.add(m[1])

/* --- Chrome ----------------------------------------------------------------------------------- */
const STAMP = `<script>for (const [i, e] of [...document.querySelectorAll('*')].entries()) { e.setAttribute('data-cs-i', i); e.setAttribute('data-cs-c', e.getAttribute('class') || '') }</script>`
const MODULE = '<script type="module" src="/assets/site.js"></script>'
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif' }
function serve(root, stamp) {
  const server = http.createServer((req, res) => {
    let f = path.join(root, decodeURIComponent(req.url.split('?')[0]))
    if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html')
    if (!fs.existsSync(f)) { res.writeHead(404); return res.end() }
    let body = fs.readFileSync(f)
    if (stamp && f.endsWith('.html')) {
      const html = body.toString('utf8')
      if (!html.includes(MODULE)) { res.writeHead(500); return res.end('no module script') }
      body = html.replace(MODULE, STAMP + MODULE)
    }
    res.writeHead(200, { 'content-type': MIME[path.extname(f)] ?? 'application/octet-stream' })
    res.end(body)
  })
  return new Promise((r) => server.listen(0, () => r(server)))
}
const server = await serve(FINAL, true)
const BASE = `http://localhost:${server.address().port}`
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', protocolTimeout: 600000, args: ['--no-sandbox', '--hide-scrollbars'] })
const tab = await browser.newPage()
await tab.setViewport({ width: 1440, height: 1000 })

/* Every declaration, expanded to the longhands Chrome actually applies. A longhand keeps its
   written value; a shorthand takes Chrome's longhands; a shorthand whose value holds var() cannot
   be expanded before the variable resolves, so it is kept whole. A declaration Chrome rejects is
   dropped, exactly as Chrome drops it. */
{
  await tab.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded' })
  const unique = [...new Set(rules.flatMap((r) => r.decls.map((d) => `${d.prop}: ${d.value}`)))]
  const expanded = await tab.evaluate((list) => {
    const el = document.createElement('div')
    const out = {}
    for (const d of list) {
      el.removeAttribute('style')
      el.style.cssText = d
      const longs = []
      let pending = false
      for (let i = 0; i < el.style.length; i++) {
        const p = el.style[i]
        const v = el.style.getPropertyValue(p)
        // Empty: a var() the shorthand waits on. `x, initial`: a multi-layer background's implicit
        // layer, which Chrome serialises as `initial` INSIDE a list, where it is invalid, so the
        // longhand would be dropped (the growth-system gradient published as `none`).
        if (!v || (v !== 'initial' && /(^|,)\s*initial\s*(,|$)/.test(v))) pending = true
        longs.push([p, v])
      }
      out[d] = { longs, pending }
    }
    return out
  }, unique)
  for (const r of rules) {
    r.longs = []
    r.decls.forEach((d, k) => {
      const x = expanded[`${d.prop}: ${d.value}`]
      if (!x || !x.longs.length) return
      if (x.longs.length === 1 && x.longs[0][0] === d.prop) r.longs.push({ prop: d.prop, value: d.value, imp: d.imp, k, short: false })
      /* A var() SHORTHAND cannot be expanded before the variable resolves, but it still sets every
         longhand under it. Each longhand gets a marker naming the shorthand, so the cascade is
         resolved per longhand like any other; foldMarkers() writes the shorthand back, ahead of the
         longhands that outrank it. (First run: `.mark { background: var(--ink) }` was emitted after
         an earlier `background-color` and lost to it.) */
      else if (x.pending) for (const [p] of x.longs) r.longs.push({ prop: p, value: MARK + d.prop + MARK + d.value, imp: d.imp, k, short: false })
      else for (const [p, v] of x.longs) r.longs.push({ prop: p, value: v, imp: d.imp, k, short: true })
    })
  }
}

/* Selector analysis, once per selector. */
const analysis = new Map()
let unreadable = 0
for (const r of rules) {
  r.an = r.list.map((s) => {
    if (!analysis.has(s)) {
      try { analysis.set(s, analyze(s)) } catch (e) { unreadable++; analysis.set(s, null) }
    }
    return analysis.get(s)
  })
}
const skeletons = [...new Set([...analysis.values()].filter(Boolean).map((a) => a.skeleton))]
const globalProps = new Set(rules.filter((r) => r.an.some((a) => a && a.global)).flatMap((r) => r.longs.map((l) => l.prop)))

/* Per page: which elements each selector's skeleton matches, told apart as markup (stamped before
   the scripts run) or created by a script. */
const pageData = []
const runtimeSkeletons = new Set()
const matchedAnywhere = new Set()
for (const p of manifest.pages) {
  const errors = []
  const onErr = (e) => errors.push(String(e))
  tab.on('pageerror', onErr)
  await tab.goto(`${BASE}/${p.file}`, { waitUntil: 'networkidle0', timeout: 120000 })
  await new Promise((r) => setTimeout(r, 600))
  tab.off('pageerror', onErr)
  if (errors.length) console.warn(`WARN ${p.slug}: page error ${errors[0]}`)
  const d = await tab.evaluate((skels) => {
    const all = [...document.querySelectorAll('[data-cs-i]')]
    const els = all.map((e) => ({ i: Number(e.dataset.csI), tag: e.localName, cls: e.dataset.csC, svg: !!e.closest('svg'), head: !!e.closest('head') || e.localName === 'html', parent: e.parentElement ? Number(e.parentElement.dataset.csI ?? -1) : -1 }))
    const added = new Set()
    for (const e of all) {
      const orig = new Set((e.dataset.csC || '').split(/\s+/))
      for (const c of e.classList) if (!orig.has(c)) added.add(c)
    }
    const res = {}
    for (const s of skels) {
      let list
      try { list = document.querySelectorAll(s) } catch { res[s] = null; continue }
      const st = []
      let rt = 0
      for (const e of list) { if (e.hasAttribute('data-cs-i')) st.push(Number(e.dataset.csI)); else rt++ }
      if (st.length || rt) res[s] = [st, rt]
    }
    return { els, added: [...added], res }
  }, skeletons)
  for (const c of d.added) stateClasses.add(c)
  for (const [s, v] of Object.entries(d.res)) {
    if (!v) continue
    if (v[1]) runtimeSkeletons.add(s)
    if (v[0].length) matchedAnywhere.add(s)
  }
  pageData.push({ page: p, ...d, elById: new Map(d.els.map((e) => [e.i, e])) })
}
/* Selector analysis again: the runtime diff can add state classes, which changes what is state. */
for (const s of analysis.keys()) { try { analysis.set(s, analyze(s)) } catch { analysis.set(s, null) } }
for (const r of rules) r.an = r.list.map((s) => analysis.get(s))
{
  // skeletons that changed need matching; rare, so refuse rather than guess
  const missing = [...new Set([...analysis.values()].filter(Boolean).map((a) => a.skeleton))].filter((s) => !skeletons.includes(s))
  if (missing.length) refuse(`the runtime diff found new state classes (${[...stateClasses].filter((c) => !STATE_CLASSES.has(c)).join(', ')}); add them to STATE_CLASSES and re-run. Changed skeletons: ${missing.slice(0, 5).join(' | ')}`)
}

/* --- resolve every element -------------------------------------------------------------------- */
const conditions = new Map()
const condOrder = [] // [earlierId, laterId] pairs, for sorting the site conditions
const report = { dominatedStates: 0, partialOverlap: 0, bpBeforeCondition: 0, unreadable, verbatimRules: 0 }
const verbatim = new Set() // rule index: carried as written (ambient, original selector)
const verbatimSels = new Map() // rule index -> the selectors of it that are carried as written
const keepClasses = new Set()
for (const r of rules) {
  r.an.forEach((a, k) => {
    const carry = () => { verbatim.add(r.order); (verbatimSels.get(r.order) ?? verbatimSels.set(r.order, new Set()).get(r.order)).add(r.list[k]) }
    if (!a) { carry(); return }
    if (a.global || a.html) { carry(); return }
    /* GENERIC RULES STAY AS WRITTEN. `html.reduce-motion *`, `[hidden]` and `.visual-site *::before`
       match every element; resolved per element, the first run copied each of them onto all 769
       classes (5,064 state rules). They carry no element's own design, so they keep their selector
       and the classes it names stay on the markup. */
    if (a.generic) { carry(); for (const c of a.nonSubjectClasses) keepClasses.add(c); return }
    if (runtimeSkeletons.has(a.skeleton) || !matchedAnywhere.has(a.skeleton)) {
      carry()
      for (const c of a.nonSubjectClasses) keepClasses.add(c)
    }
    for (const c of a.ancClasses) keepClasses.add(c)
  })
}
const rank = (e) => [e.imp ? 1 : 0, e.spec[0], e.spec[1], e.spec[2], e.ord]
const after = (a, b) => { const x = rank(a); const y = rank(b); for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return x[i] > y[i]; return false }

const elements = [] // { page, i, info, result, sig }
for (const pd of pageData) {
  const bySkel = pd.res
  const entries = new Map() // element i -> entries
  const svgRuleHit = new Map()
  for (const r of rules) {
    r.an.forEach((a, k) => {
      if (!a || a.global || a.html || a.generic) return
      const hit = bySkel[a.skeleton]
      if (!hit) return
      for (const i of hit[0]) {
        const el = pd.elById.get(i)
        if (!el || el.head) continue
        /* SVG internals are raw markup in Instatic (base.svg), so their rules keep their selector,
           and the classes it names on the way down (`.network-node svg`) stay on the markup. */
        if (el.svg) {
          ;(svgRuleHit.get(r.order) ?? svgRuleHit.set(r.order, new Set()).get(r.order)).add(r.list[k])
          for (const c of a.nonSubjectClasses) keepClasses.add(c)
          continue
        }
        const list = entries.get(i) ?? entries.set(i, []).get(i)
        const key = a.anc + '|' + a.dyn + '|' + a.pe
        for (const l of r.longs) list.push({ key, anc: a.anc, dyn: a.dyn, pe: a.pe, prop: l.prop, value: l.value, imp: l.imp, short: l.short, keptShorthand: !!l.keptShorthand, spec: a.spec, ord: r.order * 1000 + l.k, ctx: r.ctx })
      }
    })
  }
  for (const [o, sels] of svgRuleHit) { verbatim.add(o); for (const sel of sels) (verbatimSels.get(o) ?? verbatimSels.set(o, new Set()).get(o)).add(sel) }
  for (const [i, list] of entries) {
    // group by (key, prop)
    const groups = new Map()
    for (const e of list) {
      const g = e.key + '\u0000' + e.prop
      ;(groups.get(g) ?? groups.set(g, []).get(g)).push(e)
    }
    const survivors = new Map() // g -> kept entries in rank order
    for (const [g, es] of groups) {
      es.sort((a, b) => (after(a, b) ? 1 : after(b, a) ? -1 : 0))
      const kept = []
      for (let k = es.length - 1; k >= 0; k--) if (!kept.some((f) => implies(es[k].ctx, f.ctx))) kept.unshift(es[k])
      survivors.set(g, kept)
    }
    // a state entry that a stronger static one always outranks is dead too
    for (const [g, kept] of survivors) {
      const [key, prop] = g.split('\u0000')
      const [anc, dyn, pe] = key.split('|')
      if (!anc && !dyn) continue
      const stat = survivors.get(`||${pe}\u0000${prop}`) ?? []
      survivors.set(
        g,
        kept.filter((e) => {
          const beats = stat.filter((f) => after(f, e))
          if (beats.some((f) => implies(e.ctx, f.ctx))) { report.dominatedStates++; return false }
          if (beats.length) report.partialOverlap++
          return true
        }),
      )
    }
    // into bags: key -> { styles, ctx: { id: {} }, prio }
    const result = {}
    for (const [g, kept] of survivors) {
      if (!kept.length) continue
      const [key, prop] = g.split('\u0000')
      const bag = (result[key] ??= { styles: {}, ctx: {}, prio: {}, ctxPrio: {} })
      let lastCond = null
      let sawBp = false
      for (const e of kept) {
        bag.ord = Math.max(bag.ord ?? -1, e.ord)
        if (e.short && e.value === 'initial' && !globalProps.has(prop)) continue
        const id = ctxId(e.ctx, conditions)
        const name = prop.startsWith('--') ? prop : prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
        if (!id) { bag.styles[name] = e.value; if (e.imp) bag.prio[name] = 'important'; else delete bag.prio[name]; continue }
        const isBp = BREAKPOINTS.some((b) => b.id === id)
        /* A CONDITION THAT MUST BEAT A BREAKPOINT. Instatic emits a rule's custom conditions BEFORE its
           breakpoints, so a `(min-width: 1000px)` declaration that outranks a `≤1050` one would lose to
           it. Such declarations go on a second rule for the same class, emitted after every class rule
           (found at 1024 by class-parity.mjs: the home story cards' text at 15px instead of 14px). */
        if (!isBp && sawBp) {
          report.bpBeforeCondition++
          ;((bag.late ??= {})[id] ??= {})[name] = e.value
          continue
        }
        ;(bag.ctx[id] ??= {})[name] = e.value
        if (e.imp) (bag.ctxPrio[id] ??= {})[name] = 'important'
        if (isBp) sawBp = true
        else {
          if (lastCond && lastCond !== id) condOrder.push([lastCond, id])
          lastCond = id
        }
      }
      if (!Object.keys(bag.styles).length && !Object.keys(bag.ctx).length) delete result[key]
    }
    for (const b of Object.values(result)) foldMarkers(b)
    const info = pd.elById.get(i)
    elements.push({ pd, i, info, result })
  }
}
report.verbatimRules = verbatim.size

/* --- classes ----------------------------------------------------------------------------------- */
const STATIC = '||'
const pick = (bag, keys, keep) => {
  const out = { styles: {}, ctx: {}, prio: {}, ctxPrio: {} }
  for (const [k, v] of Object.entries(bag.styles)) if (keys.includes(k) === keep) { out.styles[k] = v; if (bag.prio[k]) out.prio[k] = bag.prio[k] }
  for (const [id, b] of Object.entries(bag.ctx)) for (const [k, v] of Object.entries(b)) if (keys.includes(k) === keep) { (out.ctx[id] ??= {})[k] = v; if (bag.ctxPrio[id]?.[k]) (out.ctxPrio[id] ??= {})[k] = 'important' }
  for (const [id, b] of Object.entries(bag.late ?? {})) for (const [k, v] of Object.entries(b)) if (keys.includes(k) === keep) ((out.late ??= {})[id] ??= {})[k] = v
  return out
}
const empty = (b) => !b || (!Object.keys(b.styles).length && !Object.keys(b.ctx).length)
const canon = (o) => JSON.stringify(o, (k, v) => k === 'ord' ? undefined : (v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort()) : v))
for (const el of elements) {
  const stat = el.result[STATIC + ''] ?? el.result['||']
  const hasType = stat && ('fontSize' in stat.styles || Object.values(stat.ctx).some((b) => 'fontSize' in b))
  el.type = hasType ? pick(stat, TYPO, true) : null
  el.layout = { ...el.result }
  if (hasType) el.layout['||'] = pick(stat, TYPO, false)
  for (const k of Object.keys(el.layout)) if (empty(el.layout[k])) delete el.layout[k]
  el.typeSig = el.type && !empty(el.type) ? canon(el.type) : null
  el.layoutSig = Object.keys(el.layout).length ? canon(el.layout) : null
}
const ident = (s) => s.replace(/[^\w-]+/g, '-').replace(/^-+|-+$/g, '').replace(/^(\d)/, 'c$1') || 'el'
const reserved = new Set([...stateClasses, ...keepClasses, ...hookClasses])
const taken = new Set()
const claim = (want) => {
  let name = ident(want)
  if (reserved.has(name)) name += '-box'
  let n = name
  for (let k = 2; taken.has(n); k++) n = `${name}-${k}`
  taken.add(n)
  return n
}
// type classes: by base size, most used first
const typeNames = new Map()
{
  const count = new Map()
  for (const el of elements) if (el.typeSig) count.set(el.typeSig, (count.get(el.typeSig) ?? 0) + 1)
  const px = (v) => {
    if (!v) return 'x'
    const nums = [...String(v).matchAll(/(-?\d*\.?\d+)(rem|px)/g)].map((m) => Number(m[1]) * (m[2] === 'rem' ? 16 : 1))
    return nums.length ? String(Math.round(Math.max(...nums))) : 'x'
  }
  for (const [sig] of [...count].sort((a, b) => b[1] - a[1])) {
    const t = JSON.parse(sig)
    const size = t.styles.fontSize ?? Object.values(t.ctx).find((b) => b.fontSize)?.fontSize
    const family = /manrope/i.test(t.styles.fontFamily ?? '') ? 'heading' : 'text'
    typeNames.set(sig, claim(`${family}-${px(size)}`))
  }
}
// layout classes: named after the element's own first class, else its parent's name + tag
const layoutNames = new Map()
{
  const firstClass = (info) => (info.cls || '').split(/\s+/).filter((c) => c && !stateClasses.has(c))[0]
  const bySig = new Map()
  for (const el of elements) if (el.layoutSig) (bySig.get(el.layoutSig) ?? bySig.set(el.layoutSig, []).get(el.layoutSig)).push(el)
  const baseName = (el) => {
    const own = firstClass(el.info)
    if (own) return own
    const parent = el.pd.elById.get(el.info.parent)
    const pc = parent && firstClass(parent)
    return pc ? `${pc}-${el.info.tag}` : el.info.tag
  }
  const groups = new Map()
  for (const [sig, els] of bySig) {
    const b = baseName(els[0])
    ;(groups.get(b) ?? groups.set(b, []).get(b)).push([sig, els])
  }
  for (const [b, list] of groups) {
    list.sort((x, y) => y[1].length - x[1].length)
    list.forEach(([sig, els], k) => {
      if (k === 0) return layoutNames.set(sig, claim(b))
      // the less common variants are told apart by their nearest classed ancestor
      let anc = null
      for (let p = els[0].pd.elById.get(els[0].info.parent); p; p = els[0].pd.elById.get(p.parent)) {
        const c = firstClass(p)
        if (c) { anc = c; break }
      }
      layoutNames.set(sig, claim(anc ? `${anc}_${b}` : b))
    })
  }
}

/* --- the registry ---------------------------------------------------------------------------- */
const out = []
let order = 0
/* 0. INSTATIC'S RESET, UNDONE, AS THE FIRST REGISTRY RULES. `instatic-reset-revert.css` reverts
   the reset (`reset-*.css`) at zero specificity. In the verbatim layout it sat in the code asset in
   front of Sang's CSS; in the class system Sang's rules are in the registry, which loads BEFORE the
   code asset, so the reverts came last and won every zero-specificity tie. The first class-system
   publish (seq 18) lost `* { box-sizing: border-box }` site-wide: every live page 12% different and
   ~30px taller. Here they load after the reset and before everything of Sang's, as before. */
for (const b of blocks(stripComments(fs.readFileSync(path.join(HERE, 'instatic-reset-revert.css'), 'utf8')))) {
  const styles = Object.fromEntries(decls(b.body).map((d) => [d.prop.startsWith('--') ? d.prop : d.prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase()), d.value]))
  out.push({ name: b.sel, kind: 'ambient', selector: b.sel, order: order++, styles, contextStyles: {}, origin: 'verbatim' })
}
// 1. rules carried as written: bare elements, html/:root, script-made elements, SVG internals
for (const r of rules) {
  if (!verbatim.has(r.order) || !r.longs.length) continue
  const bag = { styles: {}, ctx: {}, prio: {}, ctxPrio: {} }
  const id = ctxId(r.ctx, conditions)
  for (const l of r.longs) {
    const name = l.prop.startsWith('--') ? l.prop : l.prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
    if (!id) { bag.styles[name] = l.value; if (l.imp) bag.prio[name] = 'important' }
    else { (bag.ctx[id] ??= {})[name] = l.value; if (l.imp) (bag.ctxPrio[id] ??= {})[name] = 'important' }
  }
  const sel = [...verbatimSels.get(r.order)].join(', ')
  out.push({ name: sel, kind: 'ambient', selector: sel, order: order++, ...toRule(foldMarkers(bag)), origin: 'verbatim' })
}
function foldMarkers(bag) {
  const fold = (b, prio = {}) => {
    const lead = {}
    const rest = {}
    const p = {}
    for (const [k, v] of Object.entries(b)) {
      if (typeof v === 'string' && v.startsWith(MARK)) {
        const [, s, val] = v.split(MARK)
        const sk = s.startsWith('--') ? s : s.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
        lead[sk] = val
        if (prio[k]) p[sk] = 'important'
      } else {
        rest[k] = v
        if (prio[k]) p[k] = prio[k]
      }
    }
    return [{ ...lead, ...rest }, p]
  }
  ;[bag.styles, bag.prio] = fold(bag.styles, bag.prio)
  for (const id of Object.keys(bag.ctx)) {
    const [c, cp] = fold(bag.ctx[id], bag.ctxPrio[id])
    bag.ctx[id] = c
    if (Object.keys(cp).length) bag.ctxPrio[id] = cp
    else delete bag.ctxPrio[id]
  }
  return bag
}
function toRule(bag) {
  return {
    styles: bag.styles,
    ...(Object.keys(bag.prio).length ? { stylePriorities: bag.prio } : {}),
    contextStyles: bag.ctx,
    ...(Object.keys(bag.ctxPrio).length ? { contextStylePriorities: bag.ctxPrio } : {}),
  }
}
// 2. type classes, 3. layout classes (static part)
const emitted = new Set()
for (const el of elements) {
  if (el.typeSig && !emitted.has('t' + el.typeSig)) {
    emitted.add('t' + el.typeSig)
    const name = typeNames.get(el.typeSig)
    out.push({ name, kind: 'class', selector: '.' + name, order: 0, ...toRule(el.type), origin: 'type' })
  }
}
for (const el of elements) {
  if (!el.layoutSig || emitted.has('l' + el.layoutSig)) continue
  emitted.add('l' + el.layoutSig)
  const name = layoutNames.get(el.layoutSig)
  const stat = el.layout['||']
  out.push({ name, kind: 'class', selector: '.' + name, order: 0, ...toRule(stat ?? { styles: {}, ctx: {}, prio: {}, ctxPrio: {} }), origin: 'layout' })
}
for (const r of out) if (r.order === 0 && r.origin !== 'verbatim') r.order = order++
// 4. states, pseudo-elements and runtime context, on the new class, in the order Sang wrote them
{
  const dyn = []
  const seen = new Set()
  for (const el of elements) {
    if (!el.layoutSig || seen.has(el.layoutSig)) continue
    seen.add(el.layoutSig)
    const name = layoutNames.get(el.layoutSig)
    for (const [key, bag] of Object.entries(el.layout)) {
      if (key === '||') continue
      const [anc, d, pe] = key.split('|')
      const sel = `${anc}.${name}${d}${pe}`
      dyn.push({ name: sel, kind: 'ambient', selector: sel, ...toRule(bag), origin: 'state', rank: bag.ord ?? 0 })
    }
  }
  dyn.sort((a, b) => a.rank - b.rank)
  // the conditions that must come after the class's breakpoints (see `late` above), last of all
  const late = new Set()
  for (const el of elements) {
    for (const [sig, bag, name] of [[el.layoutSig, el.layout['||'], el.layoutSig && layoutNames.get(el.layoutSig)], [el.typeSig, el.type, el.typeSig && typeNames.get(el.typeSig)]]) {
      if (!sig || !bag?.late || late.has(name)) continue
      late.add(name)
      dyn.push({ name: '.' + name, kind: 'ambient', selector: '.' + name, styles: {}, contextStyles: bag.late, origin: 'state', rank: Infinity })
    }
  }
  for (const r of dyn) { r.order = order++; delete r.rank; out.push(r) }
}

/* conditions, sorted: the order each rule needs, else widest max-width first, else as met */
const condList = [...conditions.values()]
{
  const idx = new Map(condList.map((c, i) => [c.id, i]))
  const w = (c) => {
    const m = c.condition.query.match(MAXW)
    return m ? -Number(m[1]) : 0
  }
  condList.sort((a, b) => w(a) - w(b) || idx.get(a.id) - idx.get(b.id))
  const pos = new Map(condList.map((c, i) => [c.id, i]))
  report.conditionOrderConflicts = condOrder.filter(([a, b]) => pos.get(a) > pos.get(b)).length
}

/* --- write the pages ------------------------------------------------------------------------- */
// original classes kept on the markup: script hooks, state classes present in the markup, and
// classes named in the context of a kept selector
for (const c of hookClasses) keepClasses.add(c)
fs.rmSync(OUT, { recursive: true, force: true })
fs.cpSync(FINAL, OUT, { recursive: true })
const noJs = await browser.newPage()
await noJs.setJavaScriptEnabled(false)
await noJs.setViewport({ width: 1440, height: 1000 })
const byPage = new Map()
for (const el of elements) (byPage.get(el.pd) ?? byPage.set(el.pd, []).get(el.pd)).push(el)
let classedEls = 0
for (const pd of pageData) {
  await noJs.goto(`${BASE}/${pd.page.file}`, { waitUntil: 'domcontentloaded' })
  const assign = {}
  const els = byPage.get(pd) ?? []
  for (const info of pd.els) {
    if (info.head || info.svg) continue
    const el = els.find((e) => e.i === info.i)
    const orig = (info.cls || '').split(/\s+/).filter(Boolean)
    const keep = orig.filter((c) => keepClasses.has(c) || stateClasses.has(c))
    const mine = el ? [el.layoutSig && layoutNames.get(el.layoutSig), el.typeSig && typeNames.get(el.typeSig)].filter(Boolean) : []
    const next = [...new Set([...mine, ...keep])]
    if (next.join(' ') !== orig.join(' ')) assign[info.i] = next.join(' ')
    if (mine.length) classedEls++
  }
  const html = await noJs.evaluate((assign) => {
    const all = [...document.querySelectorAll('*')]
    all.forEach((e, i) => {
      if (i in assign) { if (assign[i]) e.setAttribute('class', assign[i]); else e.removeAttribute('class') }
    })
    for (const s of document.querySelectorAll('script:not([src])')) if (s.textContent.includes('data-cs-i')) s.remove()
    return '<!DOCTYPE html>\n' + document.documentElement.outerHTML
  }, assign)
  fs.writeFileSync(path.join(OUT, pd.page.file), html)
}
await browser.close()
server.close()

/* --- the code asset and the local stylesheet -------------------------------------------------- */
const codeCss =
  `/* The fluid root (class-system.mjs): 16px up to 1440px wide, then everything sized in rem grows\n` +
  `   with the screen, to 1.6x at 2304px. Here, not in the registry: it is the one rule every size\n` +
  `   depends on, and nobody should change it by accident. */\n` +
  `html { font-size: ${FLUID_ROOT}; }\n\n` +
  `/* @keyframes and other at-rules, as Sang wrote them (px converted to rem). */\n` +
  raw.join('\n') +
  '\n'
const bpById = new Map(BREAKPOINTS.map((b) => [b.id, b]))
const condIdx = new Map(condList.map((c, i) => [c.id, i]))
const kebab = (k) => (k.startsWith('--') ? k : k.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase()))
const bagCss = (bag, prio = {}) => Object.entries(bag).map(([k, v]) => `  ${kebab(k)}: ${v}${prio[k] ? ' !important' : ''};`).join('\n')
// the same emission order as Instatic's generateClassCSS: by rule order; base, then conditions in
// site order, then breakpoints widest first
const registryCss = out
  .slice()
  .sort((a, b) => a.order - b.order)
  .flatMap((r) => {
    const blocks = []
    if (Object.keys(r.styles).length) blocks.push(`${r.selector} {\n${bagCss(r.styles, r.stylePriorities)}\n}`)
    const ctx = Object.entries(r.contextStyles)
    for (const [id, bag] of ctx.filter(([id]) => condIdx.has(id)).sort((a, b) => condIdx.get(a[0]) - condIdx.get(b[0]))) {
      const c = conditions.get(id).condition
      blocks.push(`@${c.kind} ${c.kind === 'supports' && !c.query.startsWith('(') ? `(${c.query})` : c.query} {\n  ${r.selector} {\n${bagCss(bag, r.contextStylePriorities?.[id])}\n  }\n}`)
    }
    for (const [id, bag] of ctx.filter(([id]) => bpById.has(id)).sort((a, b) => bpById.get(b[0]).width - bpById.get(a[0]).width)) {
      blocks.push(`@media ${bpById.get(id).mediaQuery} {\n  ${r.selector} {\n${bagCss(bag, r.contextStylePriorities?.[id])}\n  }\n}`)
    }
    return blocks
  })
  .join('\n\n')
fs.writeFileSync(path.join(OUT, 'assets', 'site.css'), `/* registry, as Instatic emits it */\n${registryCss}\n\n/* code asset */\n${codeCss}`)
fs.writeFileSync(path.join(SRC, 'code.css'), codeCss)
fs.writeFileSync(path.join(SRC, 'registry.json'), JSON.stringify({ breakpoints: BREAKPOINTS, conditions: condList, rules: out.map(({ origin, ...r }) => r) }, null, 1))
const counts = out.reduce((m, r) => ((m[r.origin] = (m[r.origin] ?? 0) + 1), m), {})
const widths = {}
for (const r of rules) for (const c of r.ctx) { const m = c.query.match(MAXW); if (m) widths[m[1]] = (widths[m[1]] ?? 0) + 1 }
Object.assign(report, { rules: counts, conditions: condList.map((c) => c.id), classedElements: classedEls, keptHookClasses: [...keepClasses].sort(), stateClasses: [...stateClasses].sort(), maxWidthBlocks: widths })
fs.writeFileSync(path.join(SRC, 'class-report.json'), JSON.stringify(report, null, 1))
manifest.css = 'classes'
manifest.classSite = 'class-site'
fs.writeFileSync(path.join(SRC, 'pages.json'), JSON.stringify(manifest, null, 2) + '\n')

console.log(`css      ${rules.length} rules, ${analysis.size} selectors (${unreadable} unreadable, kept as written)`)
console.log(`registry ${out.length} rules: ${JSON.stringify(counts)}; ${condList.length} conditions; breakpoints ${BREAKPOINTS.map((b) => b.width).join('/')}`)
console.log(`elements ${classedEls} carry a new class; ${typeNames.size} type classes, ${layoutNames.size} layout classes`)
console.log(`hooks    ${keepClasses.size} original classes kept for the scripts and kept selectors`)
console.log(`checks   ${report.dominatedStates} state declarations always outranked (dropped), ${report.partialOverlap} partly outranked, ${report.bpBeforeCondition} breakpoint-before-condition, ${report.conditionOrderConflicts} condition-order conflicts`)
console.log(`max-width blocks by width: ${JSON.stringify(widths)}`)
