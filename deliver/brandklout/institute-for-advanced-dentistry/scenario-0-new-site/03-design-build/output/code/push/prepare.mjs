/**
 * Site push, step 0 — every page in site-src/dist/ -> what Instatic's importer can take.
 * Generalised 2026-10-01 from workflows/21-instatic-upload/home/prepare-home.mjs (one page) to the whole site.
 *
 *   in:  ../site-src/dist/**\/*.html, ../site-src/seo.json, ../site-src/data/embeds.json
 *   out: .tmp/pages/<slug>.html   each <body>, transformed. slug = the dist path with every / as - (index,
 *                                 dental-services-dental-implants, 404 ...): THIS INSTANCE CANNOT ROUTE A NESTED
 *                                 SLUG (JSON 404, checked 2026-10-01), and the zone-wide Cloudflare rewrites
 *                                 (docs/dns/URL-RULES.md) already map /dental-services/x/ -> /dental-services-x on
 *                                 every host, staging included. Links in the pages keep the WordPress URLs.
 *        .tmp/pages.json          [{ slug, file, title, description }] in push order (index first)
 *        .tmp/embeds.json         { key: snippet } for every x-wz-embed placeholder
 *        .tmp/media-needed.json   every local file a page, the CSS or the JS points at
 *
 * The same mechanics as prepare-wp.mjs / prepare-home.mjs (their headers, traps 15, 38, 41, 43, 45, 48, 51):
 *   - form controls, buttons, <video>/<source>, <img>, <details>/<summary> and table parts become
 *     x-wz-<tag>, so importHtml keeps every attribute and child on a base.container; push.mjs names them back.
 *   - the design's form ([data-ghl-slot]) is the DESIGN OF THE SLOT: on Instatic it holds the practice's
 *     GoHighLevel form in an Embed block (iframes are a forbidden custom tag).
 *   - [data-embed="key"] widgets (Elfsight reviews, the Google map) keep their wrapper; its preview children
 *     are replaced by an Embed placeholder carrying data/embeds.json[key].
 *   - /media/... and /fonts/... become __WZM__[path]__ tokens, resolved against the media map by assemble.mjs.
 *   - edge whitespace is hoisted out of inline elements, &nbsp; is parked at U+E000, and a newline-only
 *     text node between two elements becomes one space. <script> is dropped (everything ships in site.js).
 *
 * Usage: node push/prepare.mjs > push/.tmp/prepare.log 2>&1      (from output/code)
 */
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const SITE = path.resolve(HERE, '../site-src')
const DIST = path.join(SITE, 'dist')
const OUT = path.join(HERE, '.tmp')
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const require = createRequire(path.resolve(HERE, '../../../../../../../../package.json'))
const puppeteer = require('puppeteer-core')
fs.mkdirSync(path.join(OUT, 'pages'), { recursive: true })

// The practice's GoHighLevel "Contact Form", exactly as prepare-wp.mjs / prepare-home.mjs carry it (supplied 2026-09-11).
const GHL_FORM = `<iframe
    src="https://api.leadconnectorhq.com/widget/form/cxtQ5q29TfUr3cYlMmDB"
    style="width:100%;height:100%;border:none;border-radius:8px"
    id="inline-cxtQ5q29TfUr3cYlMmDB"
    data-layout="{'id':'INLINE'}"
    data-trigger-type="alwaysShow"
    data-trigger-value=""
    data-activation-type="alwaysActivated"
    data-activation-value=""
    data-deactivation-type="neverDeactivate"
    data-deactivation-value=""
    data-form-name="Contact Form"
    data-height="537"
    data-layout-iframe-id="inline-cxtQ5q29TfUr3cYlMmDB"
    data-form-id="cxtQ5q29TfUr3cYlMmDB"
    data-cookie-consent="true"
    data-cookie-consent-provider="auto"
    title="Contact Form"
></iframe>
<script src="https://link.msgsndr.com/js/form_embed.js"></script>`

const embeds = { 'ghl-form': GHL_FORM, ...JSON.parse(fs.readFileSync(path.join(SITE, 'data/embeds.json'), 'utf8')) }
const seo = JSON.parse(fs.readFileSync(path.join(SITE, 'seo.json'), 'utf8')).pages

function transform({ html }) {
  const tok = (p) => `__WZM__[${encodeURIComponent(p)}]__`
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const body = doc.body
  const counts = { renamed: 0, assets: 0, hoisted: 0, nbsp: 0, spaces: 0, embeds: 0, scripts: 0 }
  const needed = new Set(), keys = []
  const asset = (v) => {
    if (!v || !/^\/(media|fonts)\//.test(v)) return v
    needed.add(v.slice(1))
    counts.assets++
    return tok(v.slice(1))
  }
  const rename = (el, tag) => {
    const n = doc.createElement(tag)
    for (const a of Array.from(el.attributes)) n.setAttribute(a.name, a.value)
    while (el.firstChild) n.appendChild(el.firstChild)
    el.replaceWith(n)
    return n
  }
  const holder = (key, cls) => {
    const h = doc.createElement('x-wz-embed')
    if (cls) h.className = cls
    h.setAttribute('data-wz-e', key)
    keys.push(key)
    counts.embeds++
    return h
  }

  /* the form slot -> title, line, Embed placeholder. It keeps .form_component and [data-ask]: the core measures that
     box for the call bar. */
  for (const form of Array.from(body.querySelectorAll('[data-ghl-slot]'))) {
    const slot = doc.createElement('div')
    slot.className = 'form_component is-embedded'
    slot.setAttribute('data-ask', '')
    slot.setAttribute('id', 'request')
    for (const sel of ['.form_title', '.form_subtitle']) { const t = form.querySelector(sel); if (t) slot.appendChild(t) }
    slot.appendChild(holder('ghl-form', 'form_embed'))
    form.replaceWith(slot)
  }
  /* widgets: the wrapper stays (it carries the layout class), its preview children become the placeholder */
  for (const w of Array.from(body.querySelectorAll('[data-embed]'))) {
    const key = w.getAttribute('data-embed')
    while (w.firstChild) w.firstChild.remove()
    w.removeAttribute('data-embed')
    w.appendChild(holder(key))
  }
  for (const s of Array.from(body.querySelectorAll('script'))) { s.remove(); counts.scripts++ }
  const stray = body.querySelectorAll('iframe').length

  /* local files */
  const ATTRS = ['src', 'poster', 'data-src-lg', 'data-src-sm', 'data-story', 'data-before', 'data-after', 'href']
  for (const el of body.querySelectorAll(ATTRS.map((a) => `[${a}]`).join(','))) {
    for (const k of ATTRS) if (el.hasAttribute(k)) el.setAttribute(k, asset(el.getAttribute(k)))
  }

  /* lossy typed modules -> containers */
  for (const tag of ['source', 'video', 'img', 'form', 'input', 'select', 'option', 'textarea', 'label', 'button', 'details', 'summary', 'table', 'thead', 'tbody', 'tr', 'th', 'td']) {
    for (const el of Array.from(body.querySelectorAll(tag))) { rename(el, 'x-wz-' + tag); counts.renamed++ }
  }

  /* edge whitespace out of inline elements, deepest first (trap 48) */
  const HOIST = 'a, span, strong, em, b, i, u, small, sub, sup, abbr, cite, code, mark, q, s, time, x-wz-label'
  for (const el of Array.from(body.querySelectorAll(HOIST)).reverse()) {
    if (el.closest('pre, svg') || !/\S/.test(el.textContent)) continue
    const f = el.firstChild
    if (f && f.nodeType === 3 && /^[ \t\n\r\f]/.test(f.data)) { f.data = f.data.replace(/^[ \t\n\r\f]+/, ''); el.before(doc.createTextNode(' ')); counts.hoisted++ }
    const l = el.lastChild
    if (l && l.nodeType === 3 && /[ \t\n\r\f]$/.test(l.data)) { l.data = l.data.replace(/[ \t\n\r\f]+$/, ''); el.after(doc.createTextNode(' ')); counts.hoisted++ }
  }
  body.normalize()

  /* &nbsp; parked (trap 45); newline-only text between two elements -> one space */
  const walker = doc.createTreeWalker(body, NodeFilter.SHOW_TEXT)
  const texts = []
  while (walker.nextNode()) texts.push(walker.currentNode)
  for (const t of texts) {
    if (t.parentElement && t.parentElement.closest('pre, svg')) continue
    if (t.data.includes('\u00a0')) { t.data = t.data.replace(/\u00a0/g, '\ue000'); counts.nbsp++ }
    if (/^\s*$/.test(t.data) && /[\n\r]/.test(t.data)) {
      const p = t.previousSibling, n = t.nextSibling
      if (p && n && p.nodeType === 1 && n.nodeType === 1) { t.data = ' '; counts.spaces++ }
    }
  }
  return { body: body.innerHTML, bodyClass: body.className, needed: [...needed], keys, stray, counts }
}

const walk = (dir, pre = '') => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? (/^(assets|media|fonts)$/.test(e.name) ? [] : walk(path.join(dir, e.name), pre + e.name + '/')) : e.name.endsWith('.html') ? [pre + e.name] : [])
const files = walk(DIST).sort((a, b) => (a === 'index.html' ? -1 : b === 'index.html' ? 1 : a.localeCompare(b)))
if (files[0] !== 'index.html') throw new Error('dist/index.html is missing: build first')

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' })
const tab = await browser.newPage()
const pages = [], needed = new Set(), usedKeys = new Set(), problems = []
const totals = {}
for (const file of files) {
  const key = file.replace(/\.html$/, '')
  const slug = key.replace(/\//g, '-')
  const meta = seo[key]
  if (!meta) { problems.push(`${key}: not in seo.json (run a full build: node build.mjs)`); continue }
  const r = await tab.evaluate(transform, { html: fs.readFileSync(path.join(DIST, file), 'utf8') })
  if (r.stray) problems.push(`${slug}: ${r.stray} <iframe> outside a data-embed wrapper`)
  for (const k of r.keys) { if (!embeds[k]) problems.push(`${slug}: no snippet for embed "${k}"`); usedKeys.add(k) }
  r.needed.forEach((n) => needed.add(n))
  for (const [k, v] of Object.entries(r.counts)) totals[k] = (totals[k] || 0) + v
  const out = path.join(OUT, 'pages', slug + '.html')
  fs.mkdirSync(path.dirname(out), { recursive: true })
  fs.writeFileSync(out, `<body class="${r.bodyClass}">${r.body}</body>`)
  pages.push({ slug, file: 'pages/' + slug + '.html', title: meta.title, description: meta.description, label: meta.label })
}
await browser.close()

// Files the stylesheet points at: the faces (url('../fonts/x.woff2') in site.css).
const css = fs.readFileSync(path.join(DIST, 'assets/site.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
for (const m of css.matchAll(/url\('\.\.\/(fonts\/[^']+)'\)/g)) needed.add(m[1])
for (const m of css.matchAll(/url\(['"]?\/(media\/[^'")]+)['"]?\)/g)) needed.add(m[1])
const missing = [...needed].filter((p) => !fs.existsSync(path.join(DIST, p)))
if (missing.length) problems.push('not in dist: ' + missing.join(', '))

if (problems.length) { console.error('REFUSING:\n  ' + problems.join('\n  ')); process.exit(1) }
fs.writeFileSync(path.join(OUT, 'pages.json'), JSON.stringify(pages, null, 1))
fs.writeFileSync(path.join(OUT, 'embeds.json'), JSON.stringify(Object.fromEntries([...usedKeys].map((k) => [k, embeds[k]])), null, 1))
fs.writeFileSync(path.join(OUT, 'media-needed.json'), JSON.stringify({ root: DIST, files: [...needed].sort() }, null, 1))
console.log(JSON.stringify({ pages: pages.length, media: needed.size, embeds: [...usedKeys], ...totals }, null, 1))
