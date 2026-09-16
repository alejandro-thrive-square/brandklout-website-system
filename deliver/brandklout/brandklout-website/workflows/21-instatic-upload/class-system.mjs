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
 * FLUID TYPE, THE HOUSE STANDARD (2026-09-15). Every px length above 2px becomes rem, the root is
 * the house fluid root (scripts/fluid-root.mjs: 12px at 320, 16px from 479 to 1440, 18px at 1920,
 * 20px at 2400), and no font-size is a clamp(): each is a plain rem per breakpoint (the standard
 * type scale pass, after the registry is built).
 *
 * BREAKPOINTS, THE STANDARD FOUR (2026-09-15): Laptop 1279, Tablet 991, Mobile landscape 767,
 * Mobile portrait 479. Every width in Sang's media queries snaps to them as the CSS is read
 * (snapQuery), so no package can add a breakpoint. Min-width and range queries, and what is not a
 * width (reduced motion, print, height), stay site conditions, their widths snapped the same way.
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
import { generate as fluidRootCss, rootPxAt } from '../../../../../scripts/fluid-root.mjs'

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
/* The editor's breakpoints: the standard four, identical on every build and every package
   (Alejandro, 2026-09-15: "no matter the new versions we should be using the standardize font
   scaling and regular breakpoints"). Until then they were derived from Sang's own widths, and every
   package that brought a new width brought a breakpoint or a condition ("too many mobile
   breakpoints", said twice). */
const BREAKPOINTS = [
  { id: 'laptop', label: 'Laptop', width: 1279, mediaQuery: '(max-width: 1279px)', icon: 'monitor' },
  { id: 'tablet', label: 'Tablet', width: 991, mediaQuery: '(max-width: 991px)', icon: 'tablet' },
  { id: 'mobile-l', label: 'Mobile landscape', width: 767, mediaQuery: '(max-width: 767px)', icon: 'smartphone' },
  { id: 'mobile', label: 'Mobile portrait', width: 479, mediaQuery: '(max-width: 479px)', icon: 'smartphone' },
]
/* Where each of Sang's widths goes. Chosen so no common device width changes behaviour (1180, 1024,
   820, 768, 600, 430, 414, 390, 375, 360); every fold moves a boundary only across a range no device
   sits in. Learned the hard way (2026-09-14, class-parity.mjs): folding ≤1000 into 1050 collapsed the
   desktop nav at 1024; ≤520 into 620 moved the buttons at 600; ≤360 into 480 moved phones at 390;
   ≤1150 and ≤1050 into 1199 shrank every story hero at 1180 (iPad Air landscape).
     1150 -> 1050 (1051-1150 lose Sang's ≤1150 rules)   980 -> 1000 (981-1000)
     780 -> 800 (781-800)    720 -> 760 (721-760)    520 -> 480 (481-520)
   TWO PHONE BREAKPOINTS ONLY (Alejandro, 2026-09-14: "too many mobile breakpoints"). Sang's ≤400 and
   ≤360 tweaks fold into Mobile portrait (480), so they now apply on every phone up to 480px: a
   deliberate trade, and the one place class-parity.mjs is expected to differ (430, 414, 390, 375). */
/* 900, 680 and 600 arrived with Sang's v16 CSS (calendly, the guarantee card) and first published as
   three extra site conditions beside the breakpoints: "the breakpoint problem again" (Alejandro,
   2026-09-15). Each folds UP into the next editor breakpoint, so every gated device width at 768 and
   above, and every phone, keeps its styles; only 900-1000, 680-760 and 600-620 change. */
/* snapQuery: every width in a media query snaps to the nearest standard boundary as the CSS is
   read, so no width of Sang's, in this package or the next, can become a breakpoint or a condition
   of its own. A max-width goes to the nearest breakpoint (≤1050 -> ≤991, ≤620 -> ≤479, ≤1150 ->
   ≤1279); a min-width to the first width above the nearest boundary (min-width 1000 -> 992), with
   1439 and 1919 also open to it. A snap never crosses 1440, the width the design is approved at, so
   1440 renders exactly as Sang's file: class-parity.mjs 1440 must stay identical, and below it the
   class site differs by design (standard-check.mjs gates that). A range the snap empties widens its
   max-width to the next boundary up. */
const DESIGN_WIDTH = 1440
const MAX_BOUNDS = BREAKPOINTS.map((b) => b.width)
const MIN_BOUNDS = [...MAX_BOUNDS, 1439, 1919]
const nearestOf = (w, pool) => pool.reduce((best, b) => (Math.abs(b - w) < Math.abs(best - w) ? b : best))
const WIDTH_PART = /^\((min|max)-width: (\d+(?:\.\d+)?)px\)$/
function snapQuery(q) {
  const parts = q.split(' and ').filter((p) => p !== 'screen' && p !== 'all').map((p) => {
    const m = p.match(WIDTH_PART)
    if (!m) return { p }
    const w = Number(m[2])
    if (m[1] === 'max') {
      const pool = MAX_BOUNDS.filter((b) => (b >= DESIGN_WIDTH) === (w >= DESIGN_WIDTH))
      return pool.length ? { kind: 'max', w: nearestOf(w, pool) } : { p }
    }
    const pool = MIN_BOUNDS.filter((b) => (b < DESIGN_WIDTH) === (w - 1 < DESIGN_WIDTH))
    return pool.length ? { kind: 'min', w: nearestOf(w - 1, pool) + 1 } : { p }
  })
  const min = parts.find((x) => x.kind === 'min')
  const max = parts.find((x) => x.kind === 'max')
  if (min && max && min.w > max.w) max.w = [...MIN_BOUNDS].sort((a, b) => a - b).find((b) => b >= min.w) ?? max.w
  return [...new Set(parts.map((x) => x.p ?? `(${x.kind}-width: ${x.w}px)`))].join(' and ') || 'all'
}
const bpFor = (w) => BREAKPOINTS.find((b) => b.width === w) ?? null
/* 16px up to 1440px, then a gentle line to 18.4px (1.15x) at 2560px, and no further. It was
   `clamp(100%, 100vw / 90, 160%)` (1.33x at 1920, 1.6x from 2304) until 2026-09-14: on wide screens
   the hero heading reached 96-115px against Sang's 72px, "the heading is not right". Alejandro chose
   gentle scaling. Slope 2.4px / 1120px = 0.2143vw; intercept 16 - 1440 x 0.002143 = 12.914px. */
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
        if (name === 'media' || name === 'supports') walk(b.body, [...ctx, { kind: name, query: name === 'media' ? snapQuery(normQuery(at[2])) : normQuery(at[2]) }])
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

/* --- the standard type scale ------------------------------------------------------------------- */
/* House standard (deliver/process/04-design/fluid-root.md): the fluid root does the scaling, and a
   font-size is a plain rem per breakpoint, never a clamp() (its vw term scales on top of the
   root's). Each selector's font-size is read off its own cascade, as Instatic emits it, at one
   reference width per breakpoint: 1440 (the approved design), 1024, 768 and 600, all on the flat
   16px root, so Sang's sizes hold exactly at those widths. Below 479 the root shrinks (13px at
   360): text is held at its 360 size there; display type (28px and up) follows the root down and
   takes a Mobile portrait value only where Sang's is smaller still (no step up at the 479/480 seam). */
const typeReport = { converted: 0, skipped: [] }
{
  const REF = { '': 1440, laptop: 1024, tablet: 768, 'mobile-l': 600, mobile: 360 }
  const BANDS = Object.keys(REF)
  const DISPLAY_PX = 28
  const rem = (x) => `${+x.toFixed(6)}rem`
  const condById = new Map(condList.map((c) => [c.id, c.condition]))
  const condPos = new Map(condList.map((c, i) => [c.id, i]))
  const bpW = new Map(BREAKPOINTS.map((b) => [b.id, b.width]))
  const widthOnly = (c) => c.kind === 'media' && c.query.split(' and ').every((p) => WIDTH_PART.test(p))
  const holds = (c, w) => c.query.split(' and ').every((p) => { const m = p.match(WIDTH_PART); return m[1] === 'min' ? w >= Number(m[2]) : w <= Number(m[2]) })
  const evaluable = (id) => bpW.has(id) || (condById.has(id) && widthOnly(condById.get(id)))
  // a font-size at viewport width w on a 16px root, in px; null for a keyword (inherit) or a unit it cannot resolve
  const toPx = (v, w) => {
    if (/var\(|%|\d(?:em|ex|ch)\b/.test(v)) return null
    const js = v
      .replace(/(-?\d*\.?\d+)(rem|px|vw)\b/g, (_, n, u) => `(${n}*${u === 'rem' ? 16 : u === 'px' ? 1 : w / 100})`)
      .replace(/\bclamp\(/g, 'C(').replace(/\bmin\(/g, 'L(').replace(/\bmax\(/g, 'G(').replace(/\bcalc\(/g, '(')
    if (/[^\d\s.+\-*\/(),CLG]/.test(js)) return null
    try { return Function('C', 'L', 'G', `return ${js}`)((a, b, c) => Math.min(Math.max(a, b), c), Math.min, Math.max) } catch { return null }
  }
  const groups = new Map()
  for (const r of out) {
    const has = 'fontSize' in r.styles || Object.entries(r.contextStyles).some(([id, b]) => 'fontSize' in b && evaluable(id))
    if (has) (groups.get(r.selector) ?? groups.set(r.selector, []).get(r.selector)).push(r)
  }
  const emptied = new Set()
  for (const [sel, rs] of groups) {
    rs.sort((a, b) => a.order - b.order)
    // the winning declaration at viewport width w, as [value, important], in Instatic's emission
    // order (base, conditions in site order, breakpoints widest first); !important beats a later normal one
    const at = (w) => {
      let v
      let imp = false
      const take = (value, i) => { if (i || !imp) { v = value; imp = i } }
      for (const r of rs) {
        if ('fontSize' in r.styles) take(r.styles.fontSize, !!r.stylePriorities?.fontSize)
        const ids = Object.keys(r.contextStyles).filter((id) => 'fontSize' in r.contextStyles[id] && evaluable(id))
        const pri = (id) => !!r.contextStylePriorities?.[id]?.fontSize
        for (const id of ids.filter((id) => !bpW.has(id)).sort((a, b) => condPos.get(a) - condPos.get(b))) if (holds(condById.get(id), w)) take(r.contextStyles[id].fontSize, pri(id))
        for (const id of ids.filter((id) => bpW.has(id)).sort((a, b) => bpW.get(b) - bpW.get(a))) if (w <= bpW.get(id)) take(r.contextStyles[id].fontSize, pri(id))
      }
      return v === undefined ? undefined : [v, imp]
    }
    const win = Object.fromEntries(BANDS.map((b) => [b, at(REF[b])]))
    const defined = BANDS.map((b) => win[b] !== undefined)
    if (defined.some((d, k) => !d && defined.slice(0, k).some(Boolean))) {
      /* Set only above some width (a min-width condition), unset below it: no breakpoint can say
         "unset", so the structure stays as it is, and a vw value is frozen at the widest reference
         width where it applies, as 1440 is everywhere else. */
      let frozen = 0
      for (const r of rs) {
        for (const [id, bag] of [[null, r.styles], ...Object.entries(r.contextStyles).filter(([id]) => evaluable(id))]) {
          if (!('fontSize' in bag) || !/vw/.test(bag.fontSize)) continue
          const w = BANDS.map((b) => REF[b]).find((w) => id === null || (bpW.has(id) ? w <= bpW.get(id) : holds(condById.get(id), w)))
          const x = w && toPx(bag.fontSize, w)
          if (x != null) { bag.fontSize = rem(x / 16); frozen++ }
        }
      }
      typeReport.skipped.push(`${sel}: set above a width only${frozen ? ', vw frozen at its widest width' : ''}`)
      continue
    }
    const raw = Object.fromEntries(BANDS.map((b) => [b, win[b]?.[0]]))
    const px =Object.fromEntries(BANDS.map((b) => [b, raw[b] === undefined ? undefined : toPx(raw[b], REF[b])]))
    const bad = BANDS.find((b) => px[b] === null && /\d/.test(raw[b]))
    if (bad !== undefined) { typeReport.skipped.push(`${sel}: ${raw[bad]}`); continue }
    const val = {}
    for (const b of BANDS) if (raw[b] !== undefined) val[b] = px[b] === null ? raw[b] : rem(px[b] / 16)
    if (px.mobile != null) {
      const widest = BANDS.map((b) => px[b]).find((x) => x != null)
      const held = px.mobile / rootPxAt(REF.mobile)
      const above = parseFloat(val['mobile-l'])
      val.mobile = widest < DISPLAY_PX || !(above > 0) || held < above ? rem(held) : val['mobile-l']
    }
    for (const r of rs) {
      delete r.styles.fontSize
      if (r.stylePriorities) { delete r.stylePriorities.fontSize; if (!Object.keys(r.stylePriorities).length) delete r.stylePriorities }
      for (const [id, bag] of Object.entries(r.contextStyles)) {
        if (!('fontSize' in bag) || !evaluable(id)) continue
        delete bag.fontSize
        if (!Object.keys(bag).length) delete r.contextStyles[id]
        const p = r.contextStylePriorities?.[id]
        if (p) { delete p.fontSize; if (!Object.keys(p).length) delete r.contextStylePriorities[id] }
      }
      if (r.contextStylePriorities && !Object.keys(r.contextStylePriorities).length) delete r.contextStylePriorities
    }
    let prev
    for (const b of BANDS) {
      if (val[b] === undefined || (prev && val[b] === prev[0] && win[b][1] === prev[1])) continue
      const important = win[b][1]
      if (b === '') { rs[0].styles.fontSize = val[b]; if (important) (rs[0].stylePriorities ??= {}).fontSize = 'important' }
      else { (rs[0].contextStyles[b] ??= {}).fontSize = val[b]; if (important) ((rs[0].contextStylePriorities ??= {})[b] ??= {}).fontSize = 'important' }
      prev = [val[b], important]
    }
    for (const r of rs.slice(1)) if (!Object.keys(r.styles).length && !Object.keys(r.contextStyles).length) emptied.add(r)
    typeReport.converted++
  }
  for (let k = out.length - 1; k >= 0; k--) if (emptied.has(out[k])) out.splice(k, 1)
  // a condition that only carried font sizes is gone with them
  const used = new Set(out.flatMap((r) => Object.keys(r.contextStyles)))
  for (let k = condList.length - 1; k >= 0; k--) if (!used.has(condList[k].id)) condList.splice(k, 1)
}

/* --- Client-First type roles (2026-09-15) ------------------------------------------------------ */
/* Alejandro, after Sang's demo of a paragraph whose font-size edit never published: "reusable classes,
   client-first and relume approach, for example text-regular, text-medium, text-large, and we apply
   those throughout the site so we can make updates very easy". What went wrong is measured in the
   runbook: font sizes lived on 305 generated classes named `text-18-7`, each with its own tablet and
   phone overrides, so an edit on the base breakpoint changed nothing below 992px and an edit on a
   breakpoint tab changed nothing on desktop. Here every one of them becomes a ROLE class from a short
   scale, the same chip on every element that plays that role:
     text-size-{micro 6, mini 8, tiny 10, xsmall 12, small 14, regular 16, medium 18, large 22,
     xlarge 28, display 40, display-medium 56, display-large 64, display-xlarge 80}
     heading-style-{h6 26, h5 30, h4 36, h3 44, h2 56, h1 64, display 72} (Manrope h1-h6 tags, 24px and
     up; a level is a STYLE, not a tag: Sang's 43px <h2> is heading-style-h3, his 64px hero <h1> is h1;
     a big stat number in a <strong> is text-size-display*, because it holds its size on phones)
   Font-size exists NOWHERE else in the registry. A role carries its size, the members' modal
   line-height, and (headings) family, weight and tracking when every member has them; its
   responsive sizes are the members' modal ratios at each breakpoint, written on the same chip (the
   Webflow model: edit the size on the breakpoint tab you are looking at). Everything else typographic
   an element had is a one-property utility class stacked after the role, Client-First style:
   text-weight-700, text-style-allcaps, text-family-heading, text-tracking-n02, text-lh-1-65. The
   custom (layout) class carries no type at all, so no edit on it can fight one. Sang's sizes snap to
   the scale: the deviation per element is reported in site-src/type-roles.md and gated by
   type-roles-check.mjs (≤2px for text, ≤12% for display type at 1440). */
const typeClasses = new Map() // typeSig -> [class names] (role + utilities); absent = the old single name
const typeRoles = { roles: {}, utilities: {}, skipped: [], deviations: [], droppedResponsive: 0, mapping: {} }
{
  const pxOf = (v) => {
    const m = String(v ?? '').match(/^(-?\d*\.?\d+)(rem|px)$/)
    return m ? Number(m[1]) * (m[2] === 'rem' ? 16 : 1) : null
  }
  const rem = (x) => `${+(x / 16).toFixed(4)}rem`
  const TEXT = [[6.5, 'micro', 6], [8.5, 'mini', 8], [10.5, 'tiny', 10], [12.5, 'xsmall', 12], [14.5, 'small', 14], [16.5, 'regular', 16], [19, 'medium', 18], [24, 'large', 22], [32, 'xlarge', 28], [48, 'display', 40], [60.5, 'display-medium', 56], [72, 'display-large', 64], [Infinity, 'display-xlarge', 80]]
  const HEAD = [[28, 'h6', 26], [33, 'h5', 30], [40, 'h4', 36], [50.5, 'h3', 44], [60.5, 'h2', 56], [68.5, 'h1', 64], [Infinity, 'display', 72]]
  const BANDS = ['', 'laptop', 'tablet', 'mobile-l', 'mobile']
  const countByName = new Map()
  const sigByName = new Map()
  const tagsByName = new Map() // type class -> { tag: count }, to tell a heading from a big number
  for (const el of elements) if (el.typeSig) { const n = typeNames.get(el.typeSig); countByName.set(n, (countByName.get(n) ?? 0) + 1); sigByName.set(n, el.typeSig); const t = tagsByName.get(n) ?? tagsByName.set(n, {}).get(n); t[el.info.tag] = (t[el.info.tag] ?? 0) + 1 }
  const mostlyHeadingTag = (n) => { const t = tagsByName.get(n) ?? {}; const all = Object.values(t).reduce((a, b) => a + b, 0); const h = Object.entries(t).filter(([k]) => /^h[1-6]$/.test(k)).reduce((a, [, v]) => a + v, 0); return all > 0 && h * 2 >= all }
  const hasLate = new Set()
  for (const el of elements) if (el.typeSig && el.type?.late) hasLate.add(typeNames.get(el.typeSig))
  const roles = new Map() // role name -> { target, kind, members: [{ r, n, base, bands }] }
  for (const r of out) {
    if (r.origin !== 'type') continue
    const base = pxOf(r.styles.fontSize)
    if (base == null || hasLate.has(r.name)) { typeRoles.skipped.push(`${r.name}: ${r.styles.fontSize ?? 'no base size'}`); continue }
    // a heading role is for heading TAGS (Manrope, 20px and up); a big stat number in a <strong> is display text,
    // whose phone behaviour (it holds its size) differs from a hero h1's (it shrinks) and must not share a role
    const heading = /manrope/i.test(r.styles.fontFamily ?? '') && base >= 24 && mostlyHeadingTag(r.name)
    const [, role, target] = (heading ? HEAD : TEXT).find(([max]) => base <= max)
    const name = heading ? `heading-style-${role}` : `text-size-${role}`
    // the member's effective size per band (a band without its own value holds the previous one)
    const bands = {}
    let prev = base
    for (const b of BANDS) { const v = b === '' ? base : pxOf(r.contextStyles[b]?.fontSize); bands[b] = v ?? prev; prev = bands[b] }
    ;(roles.get(name) ?? roles.set(name, { target, heading, members: [] }).get(name)).members.push({ r, n: countByName.get(r.name) ?? 0, base, bands })
  }
  const modal = (pairs) => { // [[value, weight]] -> the value with the most weight
    const m = new Map()
    for (const [v, w] of pairs) if (v !== undefined) m.set(v, (m.get(v) ?? 0) + w)
    return [...m].sort((a, b) => b[1] - a[1])[0]?.[0]
  }
  // "Manrope,system-ui" and '"Manrope", system-ui' are one family: canonical form before naming or comparing
  const canonFamily = (v) => String(v).split(',').map((f) => f.trim().replace(/^["']|["']$/g, '')).map((f) => (/\s/.test(f) ? `"${f}"` : f)).join(', ')
  for (const r of out) if (r.origin === 'type' && r.styles.fontFamily) r.styles.fontFamily = canonFamily(r.styles.fontFamily)
  const utilName = (prop, v) => {
    const s = String(v)
    if (prop === 'fontWeight') return `text-weight-${s}`
    if (prop === 'fontFamily') return /manrope/i.test(s) ? 'text-family-heading' : /dm sans/i.test(s) ? 'text-family-body' : `text-family-${ident(s.split(',')[0].replace(/["']/g, '').toLowerCase())}`
    if (prop === 'letterSpacing') return `text-tracking-${s.replace(/^-/, 'n').replace(/^(n?)0?\./, '$1').replace(/em$|px$|rem$/, '').replace(/\./g, '-')}`
    if (prop === 'lineHeight') return `text-lh-${s.replace(/\./g, '-').replace(/[^\w-]/g, '')}`
    if (prop === 'textTransform') return s === 'uppercase' ? 'text-style-allcaps' : `text-style-${ident(s)}`
    if (prop === 'fontStyle') return `text-style-${ident(s)}`
    return `text-${ident(prop)}-${ident(s)}`
  }
  const utilities = new Map() // name -> { prop, value }
  const utilByValue = new Map() // `${prop}|${value}` -> name
  const ROLE_PROPS = { text: ['lineHeight'], heading: ['lineHeight', 'fontFamily', 'fontWeight', 'letterSpacing'] }
  const retired = new Set()
  const pushed = []
  for (const [name, role] of roles) {
    const total = role.members.reduce((s, m) => s + m.n, 0) || 1
    const styles = { fontSize: rem(role.target) }
    const prio = {}
    // a prop rides on the role only when EVERY member sets it (a member without it inherits
    // something this class must not override)
    for (const prop of ROLE_PROPS[role.heading ? 'heading' : 'text']) {
      if (!role.members.every((m) => m.r.styles[prop] !== undefined)) continue
      styles[prop] = modal(role.members.map((m) => [m.r.styles[prop], m.n]))
    }
    // responsive sizes: the modal ratio per band, on the role
    const ctx = {}
    let prevRatio = 1
    for (const b of BANDS.slice(1)) {
      const pairs = role.members.map((m) => [+(m.bands[b] / m.base).toFixed(3), m.n])
      let ratio = Number(modal(pairs))
      // on phones, the SMALLEST ratio any group of >=15% of the members had: a nowrap button that Sang
      // shrank to 13px must not come back at 14.8px and push the page sideways
      // (display type and headings wrap instead of overflowing, and shrinking a stat number to the smallest
      // group's size halves it on a phone: they keep the modal)
      if ((b === 'mobile-l' || b === 'mobile') && role.target < 24) {
        const w = new Map()
        for (const [v, n] of pairs) w.set(v, (w.get(v) ?? 0) + n)
        const big = [...w].filter(([, n]) => n >= 0.15 * total).map(([v]) => v)
        if (big.length) ratio = Math.min(...big)
      }
      typeRoles.roles[name] ??= {}
      ;(typeRoles.ratios ??= {})[`${name} ${b}`] = Object.fromEntries([...pairs.reduce((m, [v, n]) => m.set(v, (m.get(v) ?? 0) + n), new Map())].sort((x, y) => y[1] - x[1]).slice(0, 6))
      if (ratio !== prevRatio) ctx[b] = { fontSize: rem(role.target * ratio) }
      prevRatio = ratio
      for (const m of role.members) if (Math.abs(m.bands[b] - role.target * ratio) > 1.5) typeRoles.droppedResponsive += m.n
    }
    pushed.push({ name, kind: 'class', selector: '.' + name, order: 0, styles, ...(Object.keys(prio).length ? { stylePriorities: prio } : {}), contextStyles: ctx, origin: 'type' })
    typeRoles.roles[name] = { px: role.target, elements: total, responsive: Object.fromEntries(Object.entries(ctx).map(([b, v]) => [b, v.fontSize])), from: {} }
    for (const m of role.members) {
      const key = `${m.base}px`
      typeRoles.roles[name].from[key] = (typeRoles.roles[name].from[key] ?? 0) + m.n
      typeRoles.mapping[m.r.name] = name
      if (Math.abs(m.base - role.target) > 0) typeRoles.deviations.push({ was: m.base, now: role.target, elements: m.n, role: name })
      // utilities for what the role does not carry, one property each
      const names = [name]
      for (const prop of TYPO) {
        if (prop === 'fontSize') continue
        const v = m.r.styles[prop]
        if (v === undefined || v === styles[prop]) continue
        // one utility per (property, value); a second value under the same name gets a numbered name
        const key = `${prop}|${v}`
        let u = utilByValue.get(key)
        if (!u) {
          u = utilName(prop, v)
          if (utilities.has(u)) u = claim(u)
          utilities.set(u, { prop, value: v, prio: m.r.stylePriorities?.[prop] })
          utilByValue.set(key, u)
        }
        names.push(u)
      }
      // per-breakpoint values other than the size do not travel (rare; counted)
      for (const [b, bag] of Object.entries(m.r.contextStyles)) for (const k of Object.keys(bag)) if (k !== 'fontSize') typeRoles.droppedResponsive += m.n
      typeClasses.set(sigByName.get(m.r.name), names)
      retired.add(m.r)
    }
  }
  for (const [u, { prop, value, prio }] of utilities) {
    pushed.push({ name: u, kind: 'class', selector: '.' + u, order: 0, styles: { [prop]: value }, ...(prio ? { stylePriorities: { [prop]: prio } } : {}), contextStyles: {}, origin: 'type' })
    typeRoles.utilities[u] = `${prop}: ${value}`
  }
  for (let k = out.length - 1; k >= 0; k--) if (retired.has(out[k])) out.splice(k, 1)
  // roles, then utilities, after every other rule. Only THESE get an order here: the reset revert's
  // rules sit at order 0 on purpose (the registry's first rules), and renumbering them once moved
  // `:where(*){box-sizing:revert}` behind `*{box-sizing:border-box}` and widened every wrap.
  for (const r of pushed) { r.order = order++; out.push(r) }
  for (const u of [...utilities.keys(), ...roles.keys()]) taken.add(u)
  // the report
  const lines = [`# Type roles (Client-First) — generated by class-system.mjs`, '', `Font-size lives only on these classes. Sang's sizes snap to the scale; "from" lists his sizes (elements) each role replaced.`, '', '| role | px at 1440 | elements | responsive (laptop/tablet/mobile-l/mobile) | from |', '| :-- | --: | --: | :-- | :-- |']
  for (const [n, r] of Object.entries(typeRoles.roles).sort((a, b) => a[1].px - b[1].px)) lines.push(`| \`${n}\` | ${r.px} | ${r.elements} | ${Object.entries(r.responsive).map(([b, v]) => `${b} ${v}`).join(', ') || '-'} | ${Object.entries(r.from).sort((a, b) => parseFloat(a[0]) - parseFloat(b[0])).map(([k, v]) => `${k} (${v})`).join(', ')} |`)
  lines.push('', `## Responsive ratios per role and band (ratio: elements), the chosen one first on desktop bands, the smallest sizeable one on phones`, '', ...Object.entries(typeRoles.ratios ?? {}).map(([k, v]) => `- \`${k}\`: ${Object.entries(v).map(([r, n]) => `${r}: ${n}`).join(', ')}`))
  lines.push('', `## Utilities (one property each, stacked after the role)`, '', ...Object.entries(typeRoles.utilities).sort().map(([u, d]) => `- \`${u}\`: ${d}`))
  const dev = typeRoles.deviations
  const devEls = dev.reduce((s, d) => s + d.elements, 0)
  const worst = dev.slice().sort((a, b) => Math.abs(b.was - b.now) - Math.abs(a.was - a.now))[0]
  lines.push('', `## Deviations from Sang's sizes at 1440`, '', `- ${devEls} element(s) changed size; worst ${worst ? `${worst.was}px -> ${worst.now}px (${worst.role}, ${worst.elements} el)` : 'none'}`, `- ${typeRoles.droppedResponsive} element-breakpoint value(s) not carried (a bespoke responsive size or a per-breakpoint line-height/tracking; the role's applies)`, `- left as written: ${typeRoles.skipped.join('; ') || 'none'}`, '', '## Version Control', '', 'Generated; regenerate, never edit.', '')
  fs.writeFileSync(path.join(SRC, 'type-roles.md'), lines.join('\n'))
  typeRoles.summary = `${Object.keys(typeRoles.roles).length} roles + ${utilities.size} utilities replace ${retired.size} type classes; ${devEls} elements snapped (worst ${worst ? `${worst.was}->${worst.now}px` : '-'})`
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
    // the layout class, then the type role and its utilities (or the old single type class where a rule was left as written)
    const mine = el ? [el.layoutSig && layoutNames.get(el.layoutSig), ...(el.typeSig ? (typeClasses.get(el.typeSig) ?? [typeNames.get(el.typeSig)]) : [])].filter(Boolean) : []
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
  `/* The house fluid root (scripts/fluid-root.mjs), the same on every build: 12px at 320, 16px from 479\n` +
  `   to 1440, 18px at 1920, 20px at 2400. Here, not in the registry: every size depends on it, its custom\n` +
  `   properties would not survive the registry (trap 1), and nobody should change it by accident. */\n` +
  fluidRootCss() + '\n' +
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
console.log(`roles    ${typeRoles.summary} (site-src/type-roles.md)`)
console.log(`type     ${typeReport.converted} font-size cascades re-based to rem per breakpoint; ${typeReport.skipped.length} left as written${typeReport.skipped.length ? ': ' + typeReport.skipped.slice(0, 10).join(' | ') : ''}`)
