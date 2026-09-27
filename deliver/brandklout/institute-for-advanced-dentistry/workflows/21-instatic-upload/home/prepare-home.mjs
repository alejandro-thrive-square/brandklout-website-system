/**
 * Home redesign, step 0 — the approved local prototype -> what Instatic's importer can take.
 *
 *   in:  ../../04-design/.tmp/prototypes/home/{index.html, home.css, home.js, fonts/, vendor/, media/}
 *   out: ../.tmp/home/page.html          the <body>, transformed
 *        ../.tmp/home/embeds.json        snippet per x-wz-embed placeholder
 *        ../.tmp/home/media-needed.json  every local file the page, the CSS or the JS points at
 *        ../.tmp/home/meta.json          title + description
 *
 * The same mechanics as prepare-wp.mjs (read its header and traps 15, 38, 41, 43, 45, 48, 51):
 *   - form controls, buttons, <video>/<source> and <img> become x-wz-<tag>, so importHtml keeps
 *     every attribute and child on a base.container; push-home.mjs names them back.
 *   - the design's form is the DESIGN OF THE SLOT. On Instatic the slot holds the practice's
 *     GoHighLevel form in an Embed block (iframes are a forbidden custom tag).
 *   - local files become __WZM__[path]__ tokens, resolved against the media map by build-home.mjs.
 *   - edge whitespace is hoisted out of inline elements, &nbsp; is parked at U+E000, and a
 *     newline-only text node between two elements becomes one space.
 *   - <script> is dropped: the importer strips it anyway, and everything ships in site.js.
 *
 * Usage: node home/prepare-home.mjs > .tmp/home/prepare.log 2>&1
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const SRC = path.resolve(HERE, '../../04-design/.tmp/prototypes/home')
const OUT = path.resolve(HERE, '../.tmp/home')
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
fs.mkdirSync(OUT, { recursive: true })

// The practice's GoHighLevel "Contact Form", exactly as prepare-wp.mjs carries it (supplied 2026-09-11).
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

function transform({ html }) {
  const tok = (p) => `__WZM__[${encodeURIComponent(p)}]__`
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const body = doc.body
  const counts = { renamed: 0, assets: 0, hoisted: 0, nbsp: 0, spaces: 0, embeds: 0, scripts: 0 }
  const needed = new Set()
  const asset = (v) => {
    if (!v || /^(https?:|data:|#|\/|tel:|mailto:)/.test(v)) return v
    needed.add(v)
    counts.assets++
    return tok(v)
  }
  const rename = (el, tag) => {
    const n = doc.createElement(tag)
    for (const a of Array.from(el.attributes)) n.setAttribute(a.name, a.value)
    while (el.firstChild) n.appendChild(el.firstChild)
    el.replaceWith(n)
    return n
  }

  for (const s of Array.from(body.querySelectorAll('script'))) { s.remove(); counts.scripts++ }

  /* the form slot -> title, line, Embed placeholder. It keeps .ask and [data-ask]: home.js measures
     that box for the call bar and pins it beside the copy. */
  const form = body.querySelector('[data-ghl-slot]')
  const slot = doc.createElement('div')
  slot.className = 'ask ask--live'
  slot.setAttribute('data-ask', '')
  slot.setAttribute('id', 'request')
  for (const sel of ['.ask__title', '.ask__sub']) slot.appendChild(form.querySelector(sel))
  const holder = doc.createElement('x-wz-embed')
  holder.className = 'ask__embed'
  holder.setAttribute('data-wz-e', '0')
  slot.appendChild(holder)
  form.replaceWith(slot)
  counts.embeds++

  /* local files */
  for (const el of body.querySelectorAll('[src], [poster], [data-src-lg], [data-src-sm], [data-story]')) {
    for (const k of ['src', 'poster', 'data-src-lg', 'data-src-sm', 'data-story']) if (el.hasAttribute(k)) el.setAttribute(k, asset(el.getAttribute(k)))
  }

  /* lossy typed modules -> containers */
  for (const tag of ['source', 'video', 'img', 'form', 'input', 'select', 'option', 'textarea', 'label', 'button']) {
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

  return {
    body: body.innerHTML,
    bodyClass: body.className,
    title: (doc.querySelector('title')?.textContent || '').trim(),
    description: doc.querySelector('meta[name="description"]')?.getAttribute('content') || '',
    needed: [...needed],
    counts,
  }
}

const html = fs.readFileSync(path.join(SRC, 'index.html'), 'utf8')
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' })
const tab = await browser.newPage()
const r = await tab.evaluate(transform, { html })
await browser.close()

// Files the stylesheet and the script point at: the faces in fonts/fonts.css.
const fontsCss = fs.readFileSync(path.join(SRC, 'fonts/fonts.css'), 'utf8')
const fonts = [...fontsCss.matchAll(/url\('([^')]+)'\)/g)].map((m) => 'fonts/' + m[1])
const needed = [...new Set([...r.needed, ...fonts])]
const missing = needed.filter((p) => !fs.existsSync(path.join(SRC, p)))
if (missing.length) throw new Error('not on disk (run prototypes/build-media.py): ' + missing.join(', '))
if (!r.description) throw new Error('no meta description in the prototype')

fs.writeFileSync(path.join(OUT, 'page.html'), `<body class="${r.bodyClass}">${r.body}</body>`)
fs.writeFileSync(path.join(OUT, 'embeds.json'), JSON.stringify({ 0: GHL_FORM }, null, 1))
fs.writeFileSync(path.join(OUT, 'media-needed.json'), JSON.stringify({ root: SRC, files: needed }, null, 1))
fs.writeFileSync(path.join(OUT, 'meta.json'), JSON.stringify({ slug: 'index', title: r.title, description: r.description }, null, 1))
console.log(JSON.stringify({ ...r.counts, needed: needed.length, fonts: fonts.length, bytes: r.body.length }, null, 1))
