/**
 * Step 0 — turn the WordPress mirror into what the rest of this toolkit imports, keeping the site
 * EXACTLY as WordPress served it. The input is the scrape in 01-content-intake; it is never edited.
 *
 *   in:  ../01-content-intake/.tmp/current-site-scrape/{site/, raw-html/, site-data.json, vimeo.json}
 *   out: .tmp/wp/pages/<slug>.html   one body per page, cleaned for Instatic's importHtml
 *        .tmp/wp/pages.json          slug, route, title, description, body attributes per page
 *        .tmp/wp/site.css            the site's whole cascade as ONE code asset (see CSS below)
 *        .tmp/wp/scripts.json        every <script> and head tag, replayed by runtime.js (see JS)
 *        .tmp/wp/embeds.json         the iframes that become Embed blocks (Google Maps)
 *        .tmp/wp/media-needed.json   every local file a page, stylesheet or head tag points at
 *        .tmp/wp/report.json         per-page counts and warnings
 *
 * Local paths are written as tokens, __WZM__[<encoded site path>]__, which build-wp.mjs replaces
 * with the media-library URL once upload-media-wp.mjs has uploaded the file.
 *
 * WHY CHROME PARSES THE PAGES. The live site is whatever tree a browser built from WordPress's
 * markup, including its error recovery (a <div> inside a <p> closes the <p>). Parsing with
 * Chrome's own DOMParser and serialising the result hands the importer a tree that is already
 * normalised, so happy-dom on the container cannot build a different one.
 *
 * CSS. Instatic's style registry is lossy (custom properties, clamp(), multi-layer backgrounds,
 * cascade order — traps 1, 21, 32, 20 in the directive), and Bricks keeps its CSS in @layer. So
 * none of it goes through the registry. Every page's stylesheets and <style> blocks, in document
 * order, are split into top-level rules; the 59 sequences are merged into one supersequence that
 * preserves each page's own order; a rule every page has is emitted once, and any other rule is
 * scoped to exactly the pages that had it with `:where(body.wzgN, body.wzgN *)` on its leftmost
 * compound. :where() adds zero specificity, so each page sees its original cascade: same rules,
 * same order, same specificity. The NEUTRALIZER comes first: Instatic injects an unlayered reset
 * (`:where(*){margin:0;padding:0}` …) that would beat every rule inside Bricks' @layer, so each of
 * its declarations is answered with `revert-layer`, which hands the property back to the layers.
 *
 * JS. importHtml strips every <script>. Each one is replaced IN PLACE by a hidden
 * <x-wz-script data-wz-s="id"> placeholder; runtime.js swaps each placeholder for a real classic
 * <script> with the original code, in document order, so scripts run in global scope with
 * document.currentScript set, as WordPress ran them. Instatic's own asset is a module and runs
 * before DOMContentLoaded, so every listener Motion.page and Bricks register still fires.
 * Google tag / Site Kit items are gated to the production host.
 *
 * Usage: node prepare-wp.mjs > .tmp/prepare.log 2>&1
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const SCRAPE = path.resolve(HERE, '../01-content-intake/.tmp/current-site-scrape')
const SITE = path.join(SCRAPE, 'site')
const RAW = path.join(SCRAPE, 'raw-html')
const OUT = path.join(HERE, '.tmp', 'wp')
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const ORIGIN = 'https://www.ifadentistry.com'
// Redirects the WordPress site answers (seen while crawling). Links to them go to the target.
const REDIRECTS = { '/contact/': '/contact-us/', '/about/': '/about-our-practice/' }
// WordPress core version the site runs (<meta name="generator">), and the emoji script at a host
// that outlives the WordPress server. See the wp-emoji-settings branch below.
const WP_VERSION = '7.1'
const WP_EMOJI_SRC = `https://cdn.jsdelivr.net/gh/WordPress/WordPress@${WP_VERSION}/wp-includes/js/wp-emoji-release.min.js`
// The practice's GoHighLevel "Contact Form", as GHL hands it out (supplied 2026-09-11). It replaces
// the Fluent Forms listed in GHL_REPLACES; see the contact-forms branch below.
const GHL_REPLACES = new Set(['1', '6'])
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

fs.rmSync(path.join(OUT, 'pages'), { recursive: true, force: true })
fs.mkdirSync(path.join(OUT, 'pages'), { recursive: true })

const siteData = JSON.parse(fs.readFileSync(path.join(SCRAPE, 'site-data.json'), 'utf8'))
const vimeo = JSON.parse(fs.readFileSync(path.join(SCRAPE, 'vimeo.json'), 'utf8'))
const vimeoFiles = Object.fromEntries((Array.isArray(vimeo) ? vimeo : Object.values(vimeo)).map((v) => [v.id, v.file]))

const slugOf = (route) => route.replace(/^\/|\/$/g, '').replace(/\//g, '-') || 'index'
const pages = siteData.pages
  .filter((p) => p.status === 'ok' && p.rel && p.rel.endsWith('index.html'))
  .map((p) => {
    const route = new URL(p.url).pathname
    return { url: p.url, route, rel: p.rel, slug: slugOf(route) }
  })
  .sort((a, b) => (a.route === '/' ? -1 : b.route === '/' ? 1 : a.route.localeCompare(b.route)))
const routes = Object.fromEntries(pages.map((p) => [p.route, p.slug]))
for (const [from, to] of Object.entries(REDIRECTS)) if (routes[to]) routes[from] = routes[to]
if (!pages.length) throw new Error('no pages in site-data.json')
{
  const slugs = new Set()
  for (const p of pages) {
    if (slugs.has(p.slug)) throw new Error(`two routes flatten to the slug "${p.slug}"`)
    slugs.add(p.slug)
  }
}

/* ============================================================================================
 * In-browser transform. Self-contained: it is serialised into the page by page.evaluate.
 * ========================================================================================== */
function transform({ html, raw, rel, routes, redirects, origin, vimeoFiles, ghlForm, ghlReplaces }) {
  const HOST = 'wz.local'
  const BASE = `http://${HOST}/` + rel.replace(/index\.html$/, '')
  const warnings = []
  const tok = (p) => `__WZM__[${encodeURIComponent(p)}]__`
  const FILE_RE = /\.(png|jpe?g|gif|webp|avif|svg|ico|mp4|webm|pdf|woff2?|ttf|otf)$/i
  const INLINE = new Set(['a', 'abbr', 'b', 'bdi', 'bdo', 'cite', 'code', 'data', 'dfn', 'em', 'i', 'img', 'kbd', 'label', 'mark', 'q', 's', 'samp', 'small', 'span', 'strong', 'sub', 'sup', 'time', 'u', 'var', 'svg', 'x-wz-label'])

  const doc = new DOMParser().parseFromString(html, 'text/html')
  const baseEl = doc.createElement('base')
  baseEl.href = BASE
  doc.head.prepend(baseEl)

  const resolve = (v) => {
    try {
      return new URL(v, BASE)
    } catch {
      return null
    }
  }
  // A local (mirrored) path, or a path on the live WordPress host, as a site path.
  const sitePathOf = (u) => {
    if (!u) return null
    if (u.host === HOST) return decodeURIComponent(u.pathname)
    if (/^(www\.)?ifadentistry\.com$/i.test(u.host)) return decodeURIComponent(u.pathname)
    return null
  }
  const routeOf = (p) => {
    let r = p.replace(/index\.html?$/i, '')
    if (!r.endsWith('/')) r += '/'
    return r
  }
  const linkFor = (value) => {
    const v = value.trim()
    if (!v || v.startsWith('#') || /^(mailto:|tel:|sms:|javascript:|data:)/i.test(v)) return value
    const u = resolve(v)
    const p = sitePathOf(u)
    if (p === null) return value
    const hash = u.hash || ''
    if (FILE_RE.test(p)) return tok(p) + hash
    const r = redirects[routeOf(p)] || routeOf(p)
    if (routes[r] !== undefined) return (routes[r] === 'index' ? '/' : '/' + routes[r]) + hash
    // A WordPress URL this clone does not carry (feeds, author pages, wp-json): the live site.
    return origin + p + (u.search || '') + hash
  }
  const assetFor = (value) => {
    const u = resolve(value.trim())
    const p = sitePathOf(u)
    if (p === null) return value
    return tok(p)
  }

  /* --- the page's stylesheets and <style> blocks, in document order ----------------------- */
  const styles = []
  for (const el of doc.querySelectorAll('link[rel~="stylesheet"], style')) {
    if (el.closest('noscript')) continue // scripting is on for every visitor: noscript never applies
    const media = (el.getAttribute('media') || 'all').trim()
    if (el.tagName === 'LINK') {
      const u = resolve(el.getAttribute('href') || '')
      const p = sitePathOf(u)
      if (p === null) warnings.push(`remote stylesheet left out: ${el.getAttribute('href')}`)
      else styles.push({ kind: 'link', path: p, media, id: el.id || '' })
    } else {
      styles.push({ kind: 'style', css: el.textContent || '', media, id: el.id || '', base: BASE })
    }
    if (el.closest('body')) el.remove()
  }

  /* --- scripts: head ones listed, body ones replaced by placeholders ------------------------ */
  const scripts = []
  let sn = 0
  for (const el of Array.from(doc.querySelectorAll('script'))) {
    if (el.closest('noscript')) continue
    const attrs = {}
    for (const a of Array.from(el.attributes)) attrs[a.name] = a.value
    let src = null
    if (attrs.src) {
      const u = resolve(attrs.src)
      const p = sitePathOf(u)
      src = p !== null && u.host === HOST ? { local: p } : { remote: u ? u.href : attrs.src }
      delete attrs.src
    }
    const inHead = !el.closest('body')
    const entry = { n: sn++, inHead, attrs, src, text: el.textContent || '' }
    scripts.push(entry)
    if (!inHead) {
      const ph = doc.createElement('x-wz-script')
      ph.setAttribute('hidden', '')
      ph.setAttribute('data-wz-s', `__S${entry.n}__`)
      el.replaceWith(ph)
    }
  }

  const body = doc.body
  const counts = { forms: 0, renamed: 0, vimeo: 0, embeds: 0, ghl: 0, videos: 0, emails: 0, nbsp: 0, spaces: 0, links: 0, imgs: 0 }

  /* noscript in the body only applies with scripting off; every visitor has it on. */
  for (const el of Array.from(body.querySelectorAll('noscript'))) el.remove()

  /* --- Cloudflare email obfuscation: the decoder lives on Cloudflare's edge, not here ------- */
  const cfDecode = (hex) => {
    const key = parseInt(hex.slice(0, 2), 16)
    let out = ''
    for (let i = 2; i < hex.length; i += 2) out += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16) ^ key)
    return out
  }
  for (const el of Array.from(body.querySelectorAll('[data-cfemail]'))) {
    el.replaceWith(doc.createTextNode(cfDecode(el.getAttribute('data-cfemail'))))
    counts.emails++
  }
  for (const a of Array.from(body.querySelectorAll('a[href*="/cdn-cgi/l/email-protection"]'))) {
    const hex = (a.getAttribute('href').split('#')[1] || '').trim()
    if (hex) a.setAttribute('href', 'mailto:' + cfDecode(hex))
    counts.emails++
  }

  /* --- iframes: Vimeo becomes a local <video>; anything else becomes an Embed block ------- */
  const embeds = []
  const rename = (el, tag) => {
    const n = doc.createElement(tag)
    for (const a of Array.from(el.attributes)) n.setAttribute(a.name, a.value)
    while (el.firstChild) n.appendChild(el.firstChild)
    el.replaceWith(n)
    return n
  }
  for (const f of Array.from(body.querySelectorAll('iframe'))) {
    const src = f.getAttribute('src') || ''
    const m = src.match(/player\.vimeo\.com\/video\/(\d+)/)
    if (m) {
      const file = vimeoFiles[m[1]]
      if (!file) {
        warnings.push(`vimeo ${m[1]} has no local file`)
        continue
      }
      const q = new URL(src.replace(/&#0?38;/g, '&'), 'https://x').searchParams
      const v = doc.createElement('x-wz-video')
      for (const a of Array.from(f.attributes)) {
        if (!/^(src|allow|frameborder|allowfullscreen|mozallowfullscreen|webkitallowfullscreen|loading)$/i.test(a.name)) v.setAttribute(a.name, a.value)
      }
      v.setAttribute('src', tok('/__vimeo__/' + file))
      v.setAttribute('poster', tok(`/__vimeo__/${m[1]}-poster.jpg`))
      v.setAttribute('playsinline', '')
      v.setAttribute('preload', 'metadata')
      if (q.get('autoplay') === '1' || q.get('background') === '1') {
        v.setAttribute('autoplay', '')
        v.setAttribute('muted', '')
      }
      if (q.get('loop') === '1' || q.get('background') === '1') v.setAttribute('loop', '')
      if (q.get('background') !== '1') v.setAttribute('controls', '')
      v.setAttribute('data-wz-vimeo', m[1])
      f.replaceWith(v)
      counts.vimeo++
      continue
    }
    const holder = doc.createElement('x-wz-embed')
    holder.setAttribute('data-wz-e', String(embeds.length))
    embeds.push(f.outerHTML)
    f.replaceWith(holder)
    counts.embeds++
  }

  /* --- the contact forms become the practice's GoHighLevel form ---------------------------- */
  /* Fluent Forms posts to WordPress's admin-ajax.php, which dies with the WordPress hosting.
     Forms #1 (the contact form, 57 pages) and #6 (its short variant on dental-implants) are the
     patient contact form, so their whole .fluentform wrapper becomes an Embed block carrying the
     GHL snippet verbatim. #3 (Refer a Patient, for dentists) is a different form and is left. */
  for (const f of Array.from(body.querySelectorAll('form.frm-fluent-form'))) {
    if (!ghlReplaces.includes(f.getAttribute('data-form_id'))) continue
    const holder = doc.createElement('x-wz-embed')
    holder.setAttribute('data-wz-e', String(embeds.length))
    embeds.push(ghlForm)
    ;(f.closest('.fluentform') || f).replaceWith(holder)
    counts.ghl++
  }

  /* --- video/source keep every attribute as containers (base.video keeps six) ------------- */
  for (const v of Array.from(body.querySelectorAll('video'))) {
    const n = rename(v, 'x-wz-video')
    for (const s of Array.from(n.querySelectorAll('source'))) rename(s, 'x-wz-source')
    counts.videos++
  }
  for (const v of body.querySelectorAll('x-wz-video, x-wz-source')) {
    for (const k of ['src', 'poster']) if (v.hasAttribute(k) && !v.getAttribute(k).startsWith('__WZM__')) v.setAttribute(k, assetFor(v.getAttribute(k)))
  }

  /* --- form controls and buttons keep every attribute and child as containers ------------- */
  const LOSSY = ['form', 'input', 'select', 'option', 'optgroup', 'textarea', 'label', 'button']
  counts.forms = body.querySelectorAll('form').length
  for (const tag of LOSSY) {
    for (const el of Array.from(body.querySelectorAll(tag))) {
      rename(el, 'x-wz-' + tag)
      counts.renamed++
    }
  }

  /* --- links and file references ---------------------------------------------------------- */
  for (const a of body.querySelectorAll('a[href]')) {
    const next = linkFor(a.getAttribute('href'))
    if (next !== a.getAttribute('href')) counts.links++
    a.setAttribute('href', next)
  }
  /* Images keep WordPress's own <img>: src, srcset (every size variant is uploaded), sizes,
     width, height, loading and the alt of THIS usage. base.image rewrites srcset/sizes from its own
     variants, and the `sizes="auto, 100vw"` it emits changes the natural width of an image in a
     shrink-to-fit box: a 451px portrait published 595px wide and pushed its section 140px down
     (trap 51). As an x-wz-img container every attribute is WordPress's. */
  for (const img of Array.from(body.querySelectorAll('img'))) {
    const src = img.getAttribute('src')
    if (src && !src.startsWith('data:')) img.setAttribute('src', assetFor(src))
    const ss = img.getAttribute('srcset')
    if (ss) {
      img.setAttribute(
        'srcset',
        ss
          .split(',')
          .map((c) => {
            const [u, ...d] = c.trim().split(/\s+/)
            return [assetFor(u), ...d].join(' ')
          })
          .join(', '),
      )
    }
    rename(img, 'x-wz-img')
    counts.imgs++
  }
  for (const el of body.querySelectorAll('*')) {
    for (const a of Array.from(el.attributes)) {
      if (!/^data-/.test(a.name) || a.name === 'data-wz-s') continue
      const v = a.value.trim()
      if (v && !/\s/.test(v) && FILE_RE.test(v.replace(/[?#].*$/, ''))) {
        const t = assetFor(v)
        if (t !== v) el.setAttribute(a.name, t)
      }
    }
  }

  /* --- edge whitespace inside inline elements ---------------------------------------------
     The importer trims a text-only leaf (normalizeImportedText), so WordPress's
     `What is a<span> Prosthodontist?</span>` published as "What is aProsthodontist?" (trap 48).
     Move ordinary edge whitespace just outside each inline element, deepest first so it bubbles
     through nesting; between siblings the importer keeps it as one significant space. A
     non-breaking space is not moved: it is parked below and stays inside. */
  counts.hoisted = 0
  const HOIST = 'a, span, strong, em, b, i, u, small, sub, sup, abbr, cite, code, mark, q, s, time, x-wz-label'
  for (const el of Array.from(body.querySelectorAll(HOIST)).reverse()) {
    if (el.closest('pre, svg, x-wz-textarea') || !/\S/.test(el.textContent)) continue
    const f = el.firstChild
    if (f && f.nodeType === 3 && /^[ \t\n\r\f]/.test(f.data)) {
      f.data = f.data.replace(/^[ \t\n\r\f]+/, '')
      el.before(doc.createTextNode(' '))
      counts.hoisted++
    }
    const l = el.lastChild
    if (l && l.nodeType === 3 && /[ \t\n\r\f]$/.test(l.data)) {
      l.data = l.data.replace(/[ \t\n\r\f]+$/, '')
      el.after(doc.createTextNode(' '))
      counts.hoisted++
    }
  }
  body.normalize()

  /* --- text the importer would change ------------------------------------------------------
     normalizeImportedText collapses \s — which includes U+00A0 — so a &nbsp; becomes a plain
     space and edge ones vanish. Park it in a private-use character; push-wp.mjs restores it.
     A whitespace-only text node that contains a newline is DROPPED as indentation, so between
     two inline elements it has to become a plain space to keep the gap the browser drew. */
  const walker = doc.createTreeWalker(body, NodeFilter.SHOW_TEXT)
  const texts = []
  while (walker.nextNode()) texts.push(walker.currentNode)
  for (const t of texts) {
    if (t.parentElement && t.parentElement.closest('pre, svg, x-wz-textarea')) continue
    if (t.data.includes('\u00a0')) {
      t.data = t.data.replace(/\u00a0/g, '\ue000')
      counts.nbsp++
    }
    if (/^\s*$/.test(t.data) && /[\n\r]/.test(t.data)) {
      const p = t.previousSibling
      const n = t.nextSibling
      // Between ANY two elements, not only inline ones: WordPress had whitespace there, and scripts
      // read it — Bricks' reading time counts words in textContent, and "Implants</h2>\n<p>In"
      // without it is one word ("8 minutes" where WordPress says 7). Between blocks it renders
      // nothing, exactly as the newline did.
      if (p && n && p.nodeType === 1 && n.nodeType === 1) {
        t.data = ' '
        counts.spaces++
      }
    }
  }

  /* --- <head> tags Instatic cannot emit, from the UNTOUCHED server HTML --------------------- */
  const rdoc = new DOMParser().parseFromString(raw, 'text/html')
  const title = (rdoc.querySelector('title')?.textContent || '').trim()
  const description = rdoc.querySelector('meta[name="description"]')?.getAttribute('content') || ''
  const head = []
  const liveResolve = (v) => {
    try {
      return new URL(v, origin + '/' + rel.replace(/index\.html$/, ''))
    } catch {
      return null
    }
  }
  for (const el of Array.from(rdoc.head.children)) {
    const tag = el.localName
    if (tag === 'meta') {
      const name = (el.getAttribute('name') || el.getAttribute('property') || '').toLowerCase()
      if (!name || el.hasAttribute('charset') || /^(viewport|description|generator)$/.test(name)) continue
      if (/^(og:image|og:image:secure_url|twitter:image|msapplication-tileimage)$/.test(name)) {
        const u = liveResolve(el.getAttribute('content') || '')
        const p = sitePathOf(u)
        if (p) el.setAttribute('content', tok(p))
      }
      head.push(el.outerHTML)
    } else if (tag === 'link') {
      const relv = (el.getAttribute('rel') || '').toLowerCase()
      if (/^(icon|apple-touch-icon|shortcut icon)$/.test(relv)) {
        const p = sitePathOf(liveResolve(el.getAttribute('href') || ''))
        if (p) el.setAttribute('href', tok(p))
        head.push(el.outerHTML)
      } else if (relv === 'canonical') {
        head.push(el.outerHTML)
      }
    } else if (tag === 'script' && (el.getAttribute('type') || '') === 'application/ld+json') {
      head.push(el.outerHTML)
    }
  }

  return {
    body: body.innerHTML,
    bodyClass: body.getAttribute('class') || '',
    styles,
    scripts,
    embeds,
    head,
    title,
    description,
    counts,
    warnings,
  }
}

/* ============================================================================================
 * CSS: tokenizer, url() rebasing, scoping, merge
 * ========================================================================================== */

/** Top-level units of a stylesheet: qualified rules, at-rule blocks, at-rule statements. */
function splitUnits(css) {
  const units = []
  let i = 0
  const n = css.length
  while (i < n) {
    const c = css[i]
    if (/\s/.test(c)) {
      i++
      continue
    }
    if (c === '/' && css[i + 1] === '*') {
      const e = css.indexOf('*/', i + 2)
      i = e < 0 ? n : e + 2
      continue
    }
    if (c === '}' || c === ';') {
      i++ // stray, as a browser would drop it
      continue
    }
    // scan the prelude to the first top-level `{` or `;`
    let j = i
    let depth = 0
    let quote = null
    let end = -1
    let kind = null
    for (; j < n; j++) {
      const d = css[j]
      if (quote) {
        if (d === '\\') j++
        else if (d === quote) quote = null
        continue
      }
      if (d === '"' || d === "'") quote = d
      else if (d === '\\') j++
      else if (d === '/' && css[j + 1] === '*') {
        const e = css.indexOf('*/', j + 2)
        j = e < 0 ? n : e + 1
      } else if (d === '(' || d === '[') depth++
      else if (d === ')' || d === ']') depth--
      else if (depth <= 0 && d === ';' && c === '@') {
        end = j + 1
        kind = 'statement'
        break
      } else if (depth <= 0 && d === '{') {
        kind = 'block'
        break
      }
    }
    if (kind === 'statement') {
      units.push(css.slice(i, end).trim())
      i = end
      continue
    }
    if (kind !== 'block') break // trailing garbage
    // match the block's closing brace
    let k = j
    let bd = 0
    quote = null
    for (; k < n; k++) {
      const d = css[k]
      if (quote) {
        if (d === '\\') k++
        else if (d === quote) quote = null
        continue
      }
      if (d === '"' || d === "'") quote = d
      else if (d === '\\') k++
      else if (d === '/' && css[k + 1] === '*') {
        const e = css.indexOf('*/', k + 2)
        k = e < 0 ? n : e + 1
      } else if (d === '{') bd++
      else if (d === '}' && --bd === 0) break
    }
    units.push(css.slice(i, Math.min(k + 1, n)).trim())
    i = k + 1
  }
  return units.filter((u) => u && !/^@charset\b/i.test(u))
}

/** Split on top-level commas (not inside (), [] or quotes). */
function splitTop(s) {
  const out = []
  let depth = 0
  let quote = null
  let start = 0
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (quote) {
      if (c === '\\') i++
      else if (c === quote) quote = null
      continue
    }
    if (c === '"' || c === "'") quote = c
    else if (c === '\\') i++
    else if (c === '(' || c === '[') depth++
    else if (c === ')' || c === ']') depth--
    else if (c === ',' && depth === 0) {
      out.push(s.slice(start, i))
      start = i + 1
    }
  }
  out.push(s.slice(start))
  return out
}

const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '')

/** Put `where` on the leftmost compound of one complex selector, before any pseudo-element. */
function scopeSelector(sel, group) {
  const s = stripComments(sel).trim()
  if (!s) return s
  if (/^[>+~]/.test(s)) return `:where(body.${group},body.${group} *) ${s}`
  let i = 0
  let depth = 0
  let quote = null
  for (; i < s.length; i++) {
    const c = s[i]
    if (quote) {
      if (c === '\\') i++
      else if (c === quote) quote = null
      continue
    }
    if (c === '"' || c === "'") quote = c
    else if (c === '\\') i++
    else if (c === '(' || c === '[') depth++
    else if (c === ')' || c === ']') depth--
    else if (depth === 0 && (/\s/.test(c) || c === '>' || c === '+' || c === '~')) break
  }
  const compound = s.slice(0, i)
  const rest = s.slice(i)
  // first top-level pseudo-element in the compound
  let pos = compound.length
  depth = 0
  for (let j = 0; j < compound.length; j++) {
    const c = compound[j]
    if (c === '\\') {
      j++
      continue
    }
    if (c === '(' || c === '[') depth++
    else if (c === ')' || c === ']') depth--
    else if (depth === 0 && c === ':' && (compound[j + 1] === ':' || /^:(before|after|first-line|first-letter)(?![\w-])/i.test(compound.slice(j)))) {
      pos = j
      break
    }
  }
  const isRoot = /^(html|:root)(?![\w-])/i.test(compound)
  const where = isRoot ? `:where(:has(>body.${group}))` : `:where(body.${group},body.${group} *)`
  return compound.slice(0, pos) + where + compound.slice(pos) + rest
}

const GROUPING_AT = /^@(media|supports|layer|container|document|-moz-document|scope|starting-style)\b/i

function scopeUnit(unit, group, warn) {
  if (unit.startsWith('@')) {
    const brace = unit.indexOf('{')
    if (brace < 0 || !GROUPING_AT.test(unit)) {
      if (/^@keyframes|^@-webkit-keyframes|^@font-face/i.test(unit) === false && brace >= 0) warn(`unscoped at-rule ${unit.slice(0, 40)}`)
      return unit // @font-face, @keyframes, @property, statements: global by nature
    }
    const inner = unit.slice(brace + 1, unit.lastIndexOf('}'))
    return unit.slice(0, brace + 1) + splitUnits(inner).map((u) => scopeUnit(u, group, warn)).join('') + '}'
  }
  const brace = (() => {
    let depth = 0
    let quote = null
    for (let i = 0; i < unit.length; i++) {
      const c = unit[i]
      if (quote) {
        if (c === '\\') i++
        else if (c === quote) quote = null
        continue
      }
      if (c === '"' || c === "'") quote = c
      else if (c === '(' || c === '[') depth++
      else if (c === ')' || c === ']') depth--
      else if (c === '{' && depth === 0) return i
    }
    return -1
  })()
  if (brace < 0) return unit
  const prelude = unit.slice(0, brace)
  return splitTop(prelude).map((p) => scopeSelector(p, group)).join(',') + unit.slice(brace)
}

/** Rebase every url() in `css` from `baseUrl` to a token, leaving data: and remote URLs alone. */
function rebaseUrls(css, baseUrl, warn) {
  const conv = (v) => {
    const q = v.trim().replace(/^['"]|['"]$/g, '')
    if (!q || /^(data:|#|about:)/i.test(q)) return null
    let u
    try {
      u = new URL(q, baseUrl)
    } catch {
      return null
    }
    if (u.host === 'wz.local' || /^(www\.)?ifadentistry\.com$/i.test(u.host)) {
      const p = decodeURIComponent(u.pathname)
      return `__WZM__[${encodeURIComponent(p)}]__`
    }
    warn(`remote url() kept: ${u.href.slice(0, 90)}`)
    return null
  }
  return css
    .replace(/url\(\s*("[^"]*"|'[^']*'|[^)]*?)\s*\)/g, (m, v) => {
      const t = conv(v)
      return t ? `url("${t}")` : m
    })
    .replace(/@import\s+(["'])([^"']+)\1/g, (m, q, v) => {
      warn(`@import in CSS: ${v}`)
      return m
    })
}

/** Merge sequence `p` (ids) into `merged` (entries {id, pages:Set}) keeping both orders. */
function mergeInto(merged, p, pageIx) {
  const a = merged.map((e) => e.id)
  let pre = 0
  while (pre < a.length && pre < p.length && a[pre] === p[pre]) pre++
  let suf = 0
  while (suf < a.length - pre && suf < p.length - pre && a[a.length - 1 - suf] === p[p.length - 1 - suf]) suf++
  const A = a.slice(pre, a.length - suf)
  const B = p.slice(pre, p.length - suf)
  const out = []
  for (let i = 0; i < pre; i++) {
    merged[i].pages.add(pageIx)
    out.push(merged[i])
  }
  const n = A.length
  const m = B.length
  if (n * m > 400_000_000) throw new Error(`merge too large: ${n} x ${m}`)
  // suffix LCS table
  const W = m + 1
  const L = new Uint16Array((n + 1) * W)
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      L[i * W + j] = A[i] === B[j] ? L[(i + 1) * W + j + 1] + 1 : Math.max(L[(i + 1) * W + j], L[i * W + j + 1])
    }
  }
  let i = 0
  let j = 0
  while (i < n || j < m) {
    if (i < n && j < m && A[i] === B[j]) {
      const e = merged[pre + i]
      e.pages.add(pageIx)
      out.push(e)
      i++
      j++
    } else if (j >= m || (i < n && L[(i + 1) * W + j] >= L[i * W + j + 1])) {
      out.push(merged[pre + i])
      i++
    } else {
      out.push({ id: B[j], pages: new Set([pageIx]) })
      j++
    }
  }
  for (let k = merged.length - suf; k < merged.length; k++) {
    merged[k].pages.add(pageIx)
    out.push(merged[k])
  }
  return out
}

/* ============================================================================================
 * Instatic's reset, answered declaration by declaration. Taken from the published
 * `reset-*.css` of this image (2026-09-11). verify-live-wp.mjs re-reads the live reset and fails
 * if it declares anything this does not answer.
 * ========================================================================================== */
export const INSTATIC_RESET = `:where(*, *::before, *::after) { box-sizing: border-box; }
:where(*) { margin: 0; padding: 0; }
:where(body) { line-height: 1.5; font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
:where(img, picture, video, canvas, svg) { display: block; max-width: 100%; height: auto; }
:where(input, button, textarea, select) { font: inherit; color: inherit; }
:where(button) { background: none; border: 0; cursor: pointer; }
:where(p, h1, h2, h3, h4, h5, h6) { overflow-wrap: break-word; }
:where(ol, ul, menu) { list-style: none; }
:where(a) { color: inherit; text-decoration: inherit; }
:where(table) { border-collapse: collapse; }`
export function neutralize(reset) {
  return splitUnits(reset)
    .map((u) => {
      const b = u.indexOf('{')
      const props = u
        .slice(b + 1, u.lastIndexOf('}'))
        .split(';')
        .map((d) => d.split(':')[0].trim())
        .filter(Boolean)
      return `${u.slice(0, b).trim()} { ${props.map((p) => `${p}: revert-layer;`).join(' ')} }`
    })
    .join('\n')
}

/* ============================================================================================
 * main
 * ========================================================================================== */
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] })
const tab = await browser.newPage()
await tab.goto('about:blank')

const results = []
const report = { pages: {}, warnings: [] }
for (const p of pages) {
  const html = fs.readFileSync(path.join(SITE, ...p.rel.split('/')), 'utf8')
  const rawFile = path.join(RAW, ...p.rel.split('/'))
  const raw = fs.existsSync(rawFile) ? fs.readFileSync(rawFile, 'utf8') : html
  if (!fs.existsSync(rawFile)) report.warnings.push(`${p.route}: no raw-html copy, head tags taken from the mirror`)
  const r = await tab.evaluate(transform, { html, raw, rel: p.rel, routes, redirects: REDIRECTS, origin: ORIGIN, vimeoFiles, ghlForm: GHL_FORM, ghlReplaces: [...GHL_REPLACES] })
  results.push({ ...p, ...r })
  report.pages[p.slug] = { route: p.route, ...r.counts, styles: r.styles.length, scripts: r.scripts.length, warnings: r.warnings }
  console.log(`page ${p.slug.padEnd(48)} styles ${String(r.styles.length).padStart(2)} scripts ${String(r.scripts.length).padStart(2)} renamed ${String(r.counts.renamed).padStart(3)} vimeo ${r.counts.vimeo} embeds ${r.counts.embeds} ghl ${r.counts.ghl}${r.warnings.length ? '  WARN ' + r.warnings.join('; ') : ''}`)
}
await browser.close()

/* --- CSS ----------------------------------------------------------------------------------- */
const unitIds = new Map()
const unitText = []
const idOf = (t) => {
  let id = unitIds.get(t)
  if (id === undefined) {
    id = unitText.length
    unitIds.set(t, id)
    unitText.push(t)
  }
  return id
}
const fileCache = new Map()
const cssWarn = new Set()
const warn = (m) => cssWarn.add(m)
const seqs = results.map((r) => {
  const seq = []
  for (const s of r.styles) {
    let css
    let base
    if (s.kind === 'link') {
      const file = path.join(SITE, ...s.path.split('/').filter(Boolean))
      if (!fs.existsSync(file)) {
        warn(`missing stylesheet ${s.path}`)
        continue
      }
      if (!fileCache.has(file)) fileCache.set(file, fs.readFileSync(file, 'utf8'))
      css = fileCache.get(file)
      base = 'http://wz.local' + s.path
    } else {
      css = s.css
      base = s.base
    }
    let units = splitUnits(rebaseUrls(css, base, warn))
    if (s.media && s.media !== 'all') units = units.map((u) => `@media ${s.media}{${u}}`)
    for (const u of units) seq.push(idOf(u))
  }
  return seq
})
let merged = []
seqs.forEach((seq, ix) => {
  merged = mergeInto(merged, seq, ix)
})
const ALL = results.length
const groups = new Map() // "0,3,5" -> wzgN
const pageGroups = results.map(() => [])
const cssOut = []
let scopedRules = 0
for (const e of merged) {
  const text = unitText[e.id]
  if (e.pages.size === ALL) {
    cssOut.push(text)
    continue
  }
  const key = [...e.pages].sort((a, b) => a - b).join(',')
  let g = groups.get(key)
  if (!g) {
    g = 'wzg' + (groups.size + 1)
    groups.set(key, g)
    for (const ix of e.pages) pageGroups[ix].push(g)
  }
  cssOut.push(scopeUnit(text, g, warn))
  scopedRules++
}
const neutralizer =
  '/* Instatic reset, answered with revert-layer so Bricks\' @layer and the browser defaults decide,\n' +
  '   exactly as on WordPress. Generated by prepare-wp.mjs from INSTATIC_RESET. */\n' +
  neutralize(INSTATIC_RESET)
/* Two shims, both for elements this clone had to change:
   - Embed blocks wrap the Google Maps iframe in .wz-embed; the iframe is height:100% of its
     Bricks box, so the wrapper has to pass that height through.
   - Vimeo iframes became <video>; they fill their Bricks video box the way the iframe did. */
const shims =
  '\n/* prepare-wp.mjs shims for elements the clone replaced */\n' +
  '.wz-embed:has(>iframe[src*="google.com/maps"]){height:100%}\n' +
  /* The embed plugin sets its iframe display:block. WordPress's map iframe is inline (the UA
     default), so it sits on a line box with descender space under it: its Bricks code block is
     157px on WordPress and was 150px here, moving everything below it 7px on every page at 390. */
  '.wz-embed:has(>iframe[src*="google.com/maps"])>iframe{display:inline}\n' +
  'video[data-wz-vimeo]{display:block;width:100%;height:100%;object-fit:cover;background:#000}\n'
const siteCss = neutralizer + '\n' + cssOut.join('\n') + shims
fs.writeFileSync(path.join(OUT, 'site.css'), siteCss)

/* --- JS ------------------------------------------------------------------------------------ */
const dict = {}
const hash = (o) => crypto.createHash('sha1').update(JSON.stringify(o)).digest('base64url').slice(0, 10)
const GATED = /googletagmanager\.com|google-analytics\.com|googlesitekit|google_gtagjs/i
const put = (item) => {
  const id = hash(item)
  dict[id] = item
  return id
}
const localJs = new Map()
const headLists = {}
const skipped = {}
for (const r of results) {
  const ids = []
  for (const h of r.head) ids.push(put({ t: 'html', h }))
  const bodyIds = {}
  for (const s of r.scripts) {
    const type = (s.attrs.type || '').toLowerCase()
    const why =
      type === 'speculationrules'
        ? 'speculationrules (prefetches WordPress URLs)'
        : s.src?.local?.startsWith('/cdn-cgi/')
          ? 'Cloudflare edge script (emails are decoded statically above)'
          : /cdn\.userway\.org/i.test(`${s.src?.remote || ''} ${s.text || ''}`)
            ? 'UserWay (Sienna is site-wide via brandklout.embed-origins since 2026-09-12; both showed two widgets)'
            : null
    if (why) {
      skipped[why] = (skipped[why] || 0) + 1
      if (!s.inHead) bodyIds[s.n] = null
      continue
    }
    const attrs = { ...s.attrs }
    // `s.text` is in the test on purpose. A tag's INLINE bootstrap — the classic
    // `(function(w,d,s,l,i){…})(window,document,'script','dataLayer','GTM-…')` — has no src and no
    // id, so a gate reading only those two fields never sees it. That is how GTM-K8N3JK3Q reached
    // the staging clone and reported into the practice's analytics (found 2026-09-18).
    const gate = GATED.test(`${attrs.id || ''} ${s.src?.remote || ''} ${s.src?.local || ''} ${s.text || ''}`) ? 1 : 0
    let item
    if (s.src?.remote) item = { t: 'src', u: s.src.remote, a: attrs, g: gate }
    else if (s.src?.local) {
      const file = path.join(SITE, ...s.src.local.split('/').filter(Boolean))
      if (!fs.existsSync(file)) {
        report.warnings.push(`${r.route}: missing script ${s.src.local}`)
        continue
      }
      if (!localJs.has(file)) localJs.set(file, fs.readFileSync(file, 'utf8'))
      item = { t: 'js', c: localJs.get(file), a: attrs, g: gate, f: s.src.local }
    } else if (attrs.id === 'wp-emoji-settings') {
      /* WordPress's emoji loader (the inline module script) feature-tests the browser and, where
         emoji are not fully supported (Windows Chrome lacks flags), loads wp-emoji-release.min.js
         and swaps every emoji for a Twemoji image. The file lives on WordPress, which is going
         away; jsDelivr's mirror of WordPress core serves the identical 7.1 file (22,752 bytes,
         checked 2026-09-11) and the page CSP allows https scripts. */
      item = { t: 'data', c: s.text.replace(/"concatemoji":"[^"]*"/, `"concatemoji":"${WP_EMOJI_SRC}"`), a: attrs }
    } else if (type && !/^(text|application)\/(javascript|ecmascript)$|^module$/.test(type)) item = { t: 'data', c: s.text, a: attrs }
    else item = { t: 'js', c: s.text, a: attrs, g: gate }
    const id = put(item)
    if (s.inHead) ids.push(id)
    else bodyIds[s.n] = id
  }
  headLists[r.slug] = ids
  r.body = r.body.replace(/(<x-wz-script hidden="" data-wz-s=")__S(\d+)__("><\/x-wz-script>)/g, (m, a, n, b) => {
    const id = bodyIds[n]
    return id ? a + id + b : ''
  })
  if (/__S\d+__/.test(r.body)) throw new Error(`${r.slug}: an unresolved script placeholder`)
}
fs.writeFileSync(path.join(OUT, 'scripts.json'), JSON.stringify({ dict, head: headLists, skipped }))

/* --- per-usage alt text ---------------------------------------------------------------------
   Instatic keeps alt on the library ASSET (trap 28); WordPress keeps it on each <img>, and 40
   files carry different alts on different pages. Each distinct alt of a file gets its own asset:
   the most-used alt keeps the plain path, the others become `<path>#a1`, `#a2`… (same bytes,
   separate uploads). .tmp/wp/alts.json maps every image key to the alt it must carry, including
   "" for a decorative usage. */
const ALT_RE = /__WZM__\[([^\]]+?)~ALT~([^\]]*)\]__/g
const altUse = new Map()
for (const r of results) {
  for (const m of r.body.matchAll(ALT_RE)) {
    const p = decodeURIComponent(m[1])
    const a = decodeURIComponent(m[2]).trim()
    if (!altUse.has(p)) altUse.set(p, new Map())
    altUse.get(p).set(a, (altUse.get(p).get(a) || 0) + 1)
  }
}
const altKey = new Map()
const alts = {}
let altVariants = 0
for (const [p, uses] of altUse) {
  const ranked = [...uses].sort((x, y) => y[1] - x[1] || y[0].length - x[0].length)
  ranked.forEach(([a], i) => {
    const key = i === 0 ? p : `${p}#a${i}`
    if (i) altVariants++
    altKey.set(p + '|' + a, key)
    alts[key] = a
  })
}
for (const r of results) {
  r.body = r.body.replace(ALT_RE, (m, ep, ea) => `__WZM__[${encodeURIComponent(altKey.get(decodeURIComponent(ep) + '|' + decodeURIComponent(ea).trim()))}]__`)
}
fs.writeFileSync(path.join(OUT, 'alts.json'), JSON.stringify(alts, null, 1))

/* --- pages --------------------------------------------------------------------------------- */
const embeds = {}
const pagesOut = []
results.forEach((r, ix) => {
  let body = r.body
  body = body.replace(/<x-wz-embed data-wz-e="(\d+)"><\/x-wz-embed>/g, (m, n) => {
    const key = `${r.slug}:${n}`
    embeds[key] = r.embeds[Number(n)]
    return `<x-wz-embed data-wz-e="${key}"></x-wz-embed>`
  })
  const cls = [r.bodyClass, `wz-p-${r.slug}`, ...pageGroups[ix]].join(' ').replace(/\s+/g, ' ').trim()
  const html = `<body class="${cls}" data-wz-embed="page" data-wz-head="${headLists[r.slug].join(' ')}">${body}</body>`
  const file = `pages/${r.slug}.html`
  fs.writeFileSync(path.join(OUT, file), html)
  pagesOut.push({ slug: r.slug, route: r.route, url: r.url, rel: r.rel, title: r.title, description: r.description, file })
})
fs.writeFileSync(path.join(OUT, 'pages.json'), JSON.stringify(pagesOut, null, 1))
fs.writeFileSync(path.join(OUT, 'embeds.json'), JSON.stringify(embeds, null, 1))

/* --- media --------------------------------------------------------------------------------- */
const needed = new Set()
const collect = (s) => {
  for (const m of s.matchAll(/__WZM__\[([^\]]+)\]__/g)) needed.add(decodeURIComponent(m[1]))
}
collect(siteCss)
for (const r of results) collect(r.body)
collect(JSON.stringify(dict))
const missing = [...needed].filter((p) => !p.startsWith('/__vimeo__/') && !fs.existsSync(path.join(SITE, ...p.replace(/#a\d+$/, '').split('/').filter(Boolean))))
console.log(`alt        ${Object.keys(alts).length} image keys, ${altVariants} extra asset(s) for images WordPress shows with different alts`)
fs.writeFileSync(path.join(OUT, 'media-needed.json'), JSON.stringify({ files: [...needed].sort(), missing }, null, 1))

report.css = {
  bytes: siteCss.length,
  units: unitText.length,
  merged: merged.length,
  scopedRules,
  groups: groups.size,
  warnings: [...cssWarn],
}
report.js = { items: Object.keys(dict).length, bytes: JSON.stringify(dict).length, skipped }
report.media = { needed: needed.size, missing }
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 1))

console.log(`\npages      ${results.length}`)
console.log(`css        ${(siteCss.length / 1024).toFixed(0)}KB, ${merged.length} rules (${scopedRules} page-scoped, ${groups.size} page groups)`)
console.log(`js         ${Object.keys(dict).length} items, ${(JSON.stringify(dict).length / 1024).toFixed(0)}KB; skipped ${JSON.stringify(skipped)}`)
console.log(`media      ${needed.size} files needed, ${missing.length} missing${missing.length ? ': ' + missing.slice(0, 5).join(', ') : ''}`)
console.log(`embeds     ${Object.keys(embeds).length}`)
if (cssWarn.size) console.log(`css warnings:\n  ${[...cssWarn].slice(0, 30).join('\n  ')}`)
if (report.warnings.length) console.log(`warnings:\n  ${report.warnings.join('\n  ')}`)
