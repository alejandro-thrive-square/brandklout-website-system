/**
 * Step 0 — turn Sang's package into the `final-site/` shape the rest of this toolkit reads.
 *
 * v1 (2026-09-11) was one HTML file. v2 (same day) is a FOLDER: a home page, a survey and five
 * customer stories, with three different stylesheets (the home page's inline <style>,
 * `survey/styles.css`, `customer-stories/story.css`). That changes what this step has to do:
 *
 *   in:  ../00-client-delivery-initialization/.tmp/client-handoff/<package dir>   (never edited;
 *        default `package-v2`, the zip unpacked beside itself)
 *   out: .tmp/site/final-site/<same relative path>.html   every page, at the path it has in the
 *                                                         package, so its relative links still work
 *        .tmp/site/final-site/assets/site.css             every stylesheet, SCOPED (below), joined
 *        .tmp/site/final-site/assets/site.js              attribute repairs (below) + every inline
 *                                                         <script>, each guarded to its own pages
 *        .tmp/site/final-site/assets/<image>              remote <img>s, downloaded (upload-media)
 *        .tmp/site/site-src/css/NN-<scope>.css            the scoped CSS per stylesheet, which
 *                                                         push-site.mjs harvests tokens and lossy
 *                                                         declarations from
 *        .tmp/site/site-src/seo.json                      <title> + description per route
 *        .tmp/site/site-src/pages.json                    slug -> file -> scope, and the aliases.
 *                                                         Every other script reads this
 *
 * WHY SCOPED. Instatic has ONE style registry for the whole site. Sang's three stylesheets
 * disagree about the same selectors — `body` background, `h1`, `section` padding, `.btn`,
 * `.nav` (fixed on the home page, static on a story), `.promise`, `.success`, `--max` — so
 * merged as written, every page would get a blend of all three. Each stylesheet is instead
 * prefixed with a class on <body> (`body.pg-home …`); Instatic renders body-node classes onto
 * <body> (modules/base/body). `:root` and `body` become `body.pg-x` itself, so the tokens are
 * declared where the page can inherit them. The prefix adds the same (0,1,1) to every selector
 * of a stylesheet, so the order of Sang's own rules against each other does not change.
 * `html { … }` rules stay global and must agree across stylesheets (refused otherwise).
 *
 * The body class is the only markup this adds. Nothing in the copy is changed: phase 1 publishes
 * Sang's pages as he wrote them.
 *
 * Usage: node prepare-source.mjs [package dir name]
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const HANDOFF = path.resolve(HERE, '../00-client-delivery-initialization/.tmp/client-handoff')
const PKG = path.join(HANDOFF, process.argv[2] || 'package-v2')
const SITE = path.join(HERE, '.tmp', 'site')
const FINAL = path.join(SITE, 'final-site')
const CSS_SRC = path.join(SITE, 'site-src', 'css')
const IMG_CACHE = path.join(HERE, '.tmp', 'remote-images')

const refuse = (msg) => {
  console.error('REFUSING: ' + msg)
  process.exit(1)
}
if (!fs.existsSync(PKG)) refuse(`no package at ${PKG}. Unzip Sang's zip into a sibling folder (never over it).`)

/* OVERLAY. `21-instatic-upload/overlay/<path>` replaces (or adds) the package file at the same
   path, so a page we authored can ship without editing Sang's package, which stays as received.
   First use, 2026-09-11: `overlay/survey/index.html`, the rebuild of his Netlify 21-point
   assessment (https://bk21question.netlify.app/), in place of the package's own survey. */
const OVERLAY = path.join(HERE, 'overlay')
const walkDir = (root, rel = '') =>
  !fs.existsSync(path.join(root, rel))
    ? []
    : fs.readdirSync(path.join(root, rel), { withFileTypes: true }).flatMap((d) => {
        const r = rel ? `${rel}/${d.name}` : d.name
        return d.isDirectory() ? walkDir(root, r) : [r]
      })
const overlaid = new Set(walkDir(OVERLAY))
// PATCHES: small find/replace edits on top of a package page (patches.mjs). Applied to pages only.
const { loadPatches, applyPatches } = await import('./patches.mjs')
const patches = await loadPatches()
const read = (rel) => fs.readFileSync(path.join(overlaid.has(rel) ? OVERLAY : PKG, rel), 'utf8')
const all = [...new Set([...walkDir(PKG), ...overlaid])]
/* NOT PAGES. v11 ships `OPEN-ME.html`, a 1.3MB self-contained preview that Sang's own
   `tools/build_preview.py` builds by inlining every page, stylesheet and image into one file (his
   README: "It deliberately excludes OPEN-ME.html and START-HERE.html from the page registry"). It is a
   viewer for the package, not a page of the site. */
const NOT_PAGES = new Set(['OPEN-ME.html', 'START-HERE.html'])
const htmlFiles = all.filter((f) => /\.html?$/i.test(f) && !NOT_PAGES.has(f)).sort()
if (!htmlFiles.includes('index.html')) refuse('the package has no top-level index.html')

/* ALIASES. v2 ships `preview (1).html` BYTE-IDENTICAL to `index.html`, and every story and the
   survey link back to `../preview%20(1).html`. It is the home page under a second name, not a
   page: it maps to `/`. A top-level file that is NOT identical to index.html is a real page and
   gets a route like any other. */
const aliases = {}
const pageFiles = []
for (const f of htmlFiles) {
  if (f !== 'index.html' && !f.includes('/') && read(f) === read('index.html')) {
    aliases[f] = 'index.html'
    continue
  }
  pageFiles.push(f)
}
/* DUPLICATE PAGES (v11, 2026-09-14). `revenue-attribution.html` is byte-identical to
   `lead-to-collection.html` (same <title>, same copy) and no page links to it. Published, that is
   two pages under one title. A top-level page identical to another one is an alias of whichever of
   the two the rest of the package links to, the same way `preview (1).html` is an alias of `/`. */
{
  const byText = new Map()
  for (const f of pageFiles) byText.set(read(f), [...(byText.get(read(f)) ?? []), f])
  for (const group of byText.values()) {
    if (group.length < 2) continue
    if (group.some((f) => f.includes('/'))) refuse(`identical nested pages, alias them by hand: ${group.join(', ')}`)
    const linkedFrom = (f) => pageFiles.filter((p) => !group.includes(p) && read(p).includes(`href="${f}`)).length
    const keep = [...group].sort((a, b) => linkedFrom(b) - linkedFrom(a) || a.localeCompare(b))[0]
    for (const f of group) {
      if (f === keep) continue
      aliases[f] = keep
      pageFiles.splice(pageFiles.indexOf(f), 1)
    }
  }
}

/* FLAT SLUGS (trap 39). `core/page-tree/slugs.ts` accepts `customer-stories/omnia-ai-search-growth`
   and the save stores it in `cells.slug` — but the pages TABLE derives its routing slug with `-`
   for `/`, and that is the one the public router serves. The first v2 publish put all five stories
   at `/customer-stories-<name>` and every link to `/customer-stories/<name>` 404'd, while the
   save, the SEO pass and `{"publishedPages":7}` all said ok. So the folder path is flattened here,
   once, and every later step (the links, the gates, push-site's id reuse) uses the same string. */
const SLUG_OK = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const routeOf = (f) => (f === 'index.html' ? 'index' : f.replace(/\/index\.html?$/i, '').replace(/\.html?$/i, '').replace(/\//g, '-'))

const GENERIC_STEMS = new Set(['style', 'styles', 'main', 'site', 'index', 'app'])
const scopeOf = (route, cssRel) => {
  if (!cssRel) return 'pg-' + (route === 'index' ? 'home' : route.replace(/\//g, '-'))
  const stem = path.posix.basename(cssRel, '.css')
  const dir = path.posix.basename(path.posix.dirname(cssRel))
  return 'pg-' + (GENERIC_STEMS.has(stem) && dir !== '.' ? dir : stem)
}

/* --- CSS scoping ------------------------------------------------------------------------- */
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
      else if (text[j] === '}' && --depth === 0) {
        close = j
        break
      }
    }
    if (close < 0) refuse('unbalanced braces in a stylesheet')
    found.push({ sel: text.slice(i, open).trim(), body: text.slice(open + 1, close) })
    i = close + 1
  }
  if (text.slice(i).trim()) refuse(`trailing CSS after the last rule: ${text.slice(i).trim().slice(0, 60)}`)
  return found
}
const splitTop = (s) => {
  const parts = []
  let depth = 0
  let start = 0
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (c === '(' || c === '[') depth++
    else if (c === ')' || c === ']') depth--
    else if (c === ',' && depth === 0) {
      parts.push(s.slice(start, i))
      start = i + 1
    }
  }
  parts.push(s.slice(start))
  return parts.map((p) => p.trim()).filter(Boolean)
}

const htmlRules = new Map() // body text -> scope, to prove the global `html` rules agree
function scopeCss(css, scope) {
  const S = `body.${scope}`
  const one = (sel) => {
    if (sel === ':root' || sel === 'body') return S
    if (/^body(?=[.#:[\s>+~])/.test(sel)) return S + sel.slice(4)
    if (/^html\b/.test(sel)) return null // handled by the caller
    if (/^:root\b/.test(sel)) refuse(`a compound :root selector (${sel}); scope it by hand`)
    return `${S} ${sel}`
  }
  const walkBlock = (text) =>
    rules(text)
      .map((r) => {
        if (/^@(media|supports|container)\b/.test(r.sel)) return `${r.sel}{${walkBlock(r.body)}}`
        if (r.sel.startsWith('@')) refuse(`${r.sel.split(/\s/)[0]} in ${scope}: not handled by the scoper`)
        const parts = splitTop(r.sel)
        const html = parts.filter((p) => /^html\b/.test(p))
        if (html.length) {
          if (html.length !== parts.length) refuse(`html mixed with other selectors: ${r.sel}`)
          const key = r.sel + '{' + r.body.trim() + '}'
          htmlRules.set(key, [...(htmlRules.get(key) ?? []), scope])
          return key
        }
        return `${parts.map(one).join(',')}{${r.body}}`
      })
      .join('\n')
  return walkBlock(css.replace(/\/\*[\s\S]*?\*\//g, ' '))
}

/* --- attributes the importer drops from form controls, put back at boot --------------------
   FOUND 2026-09-11 reading the importer (core/htmlImport/rules.ts, walkAndMap.ts) before the
   survey was ever imported. Instatic's form-control modules keep a FIXED prop list and render
   nothing else — `walkAndMap` only carries arbitrary attributes for containers, text, links,
   buttons, images and the form itself:
     base.input              name id value required disabled placeholder readonly autocomplete
                             min max minlength maxlength pattern — and `type` only when it is a
                             text type (trap 22: `range` becomes `text`)
     base.checkbox / radio   name id value required disabled checked
     base.select / textarea  name id required disabled (+ placeholder rows min/maxlength readonly)
     base.label (text only)  for
     base.submit             disabled, form
   On the survey that loses the 21 numbered badges (`content: attr(data-number)` on
   `.question-label`), the 1–10 slider, and `id="submitButton"`, which the survey script
   dereferences at boot, so without it the whole survey throws before it can show step 1.
   Everything outside those lists is recorded here per page and restored by site.js before
   Sang's own script runs. On the local build it is a no-op: nothing was taken away. */
const TEXT_TYPES = new Set(['text', 'email', 'password', 'search', 'tel', 'url', 'number', 'date', 'time', 'datetime-local', 'file', 'hidden'])
const OWN_TYPES = new Set([...TEXT_TYPES, 'checkbox', 'radio', 'submit', 'button', 'reset'])
const KEPT = {
  input: new Set(['type', 'name', 'id', 'value', 'required', 'disabled', 'placeholder', 'readonly', 'autocomplete', 'min', 'max', 'minlength', 'maxlength', 'pattern', 'checked']),
  select: new Set(['name', 'id', 'required', 'disabled', 'multiple']),
  textarea: new Set(['name', 'id', 'required', 'disabled', 'readonly', 'placeholder', 'rows', 'minlength', 'maxlength']),
  label: new Set(['for']),
  submit: new Set(['type', 'form', 'disabled']),
}
const ALWAYS_KEPT = new Set(['class', 'style']) // classes ride as classIds; inline style is harvested
const attrsOf = (tag) =>
  Object.fromEntries(
    [...tag.replace(/^<\w+/, '').matchAll(/\s([a-zA-Z][\w:-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g)].map((m) => [
      m[1].toLowerCase(),
      m[2] ?? m[3] ?? m[4] ?? '',
    ]),
  )
function droppedAttributes(html, file) {
  const out = []
  const seen = new Map()
  const record = (sel, kind, attrs) => {
    const lost = Object.fromEntries(
      Object.entries(attrs).filter(([k, v]) => {
        if (ALWAYS_KEPT.has(k)) return false
        if (k === 'type' && kind === 'input') return !OWN_TYPES.has(v.toLowerCase())
        return !KEPT[kind].has(k)
      }),
    )
    const i = seen.get(sel) ?? 0
    seen.set(sel, i + 1)
    if (Object.keys(lost).length) out.push([sel, i, lost])
  }
  const locate = (a) => (a.id ? `#${a.id}` : a.name ? `[name="${a.name}"]${a.value && /checkbox|radio/i.test(a.type ?? '') ? `[value="${a.value}"]` : ''}` : null)
  for (const m of html.matchAll(/<(input|select|textarea)\b[^>]*>/gi)) {
    const a = attrsOf(m[0])
    const sel = locate(a)
    if (sel) record(sel, m[1].toLowerCase(), a)
    else if (Object.keys(a).some((k) => !KEPT[m[1].toLowerCase()].has(k) && !ALWAYS_KEPT.has(k))) console.warn(`WARN ${file}: a <${m[1]}> with no id or name loses attributes and cannot be repaired: ${m[0].slice(0, 90)}`)
  }
  for (const m of html.matchAll(/<label\b[^>]*>([\s\S]*?)<\/label>/gi)) {
    if (/</.test(m[1])) continue // wraps elements: imported as a container, which keeps its attributes
    const a = attrsOf(m[0].match(/^<label\b[^>]*>/i)[0])
    if (a.for) record(`label[for="${a.for}"]`, 'label', a)
    else if (Object.keys(a).some((k) => !ALWAYS_KEPT.has(k))) console.warn(`WARN ${file}: a <label> with no \`for\` loses attributes and cannot be repaired`)
  }
  for (const f of html.matchAll(/<form\b[^>]*>([\s\S]*?)<\/form>/gi)) {
    const formId = attrsOf(f[0].match(/^<form\b[^>]*>/i)[0]).id
    for (const b of f[1].matchAll(/<button\b[^>]*>/gi)) {
      const a = attrsOf(b[0])
      if (a.type && a.type.toLowerCase() !== 'submit') continue // plain buttons keep their attributes
      if (formId) record(`#${formId} button[type="submit"]`, 'submit', a)
      else if (Object.keys(a).some((k) => !KEPT.submit.has(k) && !ALWAYS_KEPT.has(k))) console.warn(`WARN ${file}: a submit button in a form with no id loses attributes and cannot be repaired`)
    }
  }
  return out
}

/* --- SHARED LAYOUT (v11, 2026-09-14) --------------------------------------------------------
   v11 is 33 flat pages that all link the SAME six stylesheets in the same order and the same three
   `<script src>` files, with no inline <style> or <script>. Nothing disagrees between pages, so
   nothing is scoped (the v2 path below stays for a package with per-page stylesheets).

   AND THE CSS SKIPS THE STYLE REGISTRY ALTOGETHER. It ships VERBATIM as a code asset (push-site.mjs),
   because this CSS is exactly what the registry conversion cannot carry: `min-width`, compound,
   `prefers-reduced-motion` and `print` queries (trap 40 orders conditions site-wide, and the v2
   media sort refuses anything but one max-width), `@keyframes`, `html.reduce-motion …` selectors, and
   six stylesheets that override one another in source order (`preview-fix`, `update-v6`,
   `stories-v10` are patch layers over the first three). Verbatim keeps Sang's cascade exactly as he
   wrote it, and traps 1, 19, 21, 32, 34 and 35 (the registry's lossy values) cannot happen. Text,
   links and images stay editable as page nodes; the cost is that the Styles panel shows no rules.

   Images: local `assets/…` files are copied into final-site/assets; every `data-online-src` photo
   (Sang's pages carry a data: placeholder that visual.js swaps for the online original when it loads)
   is downloaded and becomes the real `src`, with its `data-online-alt`. That is what a visitor sees
   anyway, and it stops the site depending on brandklout.com's Webflow CDN, which goes away when the
   domain moves here. */
const sheetsOf = (html) =>
  [...html.matchAll(/<link\b[^>]*>/gi)]
    .map((m) => m[0])
    .filter((t) => /rel=["']?stylesheet/i.test(t))
    .map((tag) => ({ tag, href: (tag.match(/href=["']([^"']+)["']/i) ?? [])[1] }))
    .filter((l) => l.href && !/^(https?:)?\/\//i.test(l.href))
const scriptsOf = (html) => [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].filter((m) => !/type=["']?application\/(ld\+)?json/i.test(m[1]))
const srcOf = (attrs) => (attrs.match(/\bsrc=["']([^"']+)["']/i) ?? [])[1]
const layoutOf = (html) => {
  if (/<style\b/i.test(html)) return null
  const scripts = scriptsOf(html)
  if (scripts.some((m) => !srcOf(m[1]))) return null
  const sheets = sheetsOf(html)
  if (!sheets.length) return null
  return sheets.map((s) => s.href).join(',') + ' | ' + scripts.map((m) => srcOf(m[1])).join(',')
}
const layouts = new Set(pageFiles.map((f) => layoutOf(read(f))))
if (pageFiles.length > 1 && layouts.size === 1 && !layouts.has(null)) {
  await buildShared()
  process.exit(0)
}

function decodeEntities(s) {
  return s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
}

async function buildShared() {
  const first = read(pageFiles[0])
  const sheetRels = sheetsOf(first).map((s) => path.posix.normalize(s.href))
  const scriptRels = scriptsOf(first).map((m) => path.posix.normalize(srcOf(m[1])))
  const patched = (rel) => {
    try {
      return applyPatches(rel, read(rel), patches)
    } catch (e) {
      refuse(e.message)
    }
  }

  let css = sheetRels.map((rel) => `/* ===== ${rel} (Sang, ${patches.has(rel) ? `patched by patches/${rel}.mjs` : 'verbatim'}) ===== */\n${patched(rel)}\n`).join('\n')
  const agencyCss = path.join(HERE, 'agency', 'site.css')
  if (fs.existsSync(agencyCss)) css += '\n' + fs.readFileSync(agencyCss, 'utf8')
  const bare = css.replace(/\/\*[\s\S]*?\*\//g, ' ')
  // The asset is served from /_instatic/…, so a relative url() would 404 there, silently (trap 14).
  for (const m of bare.matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g)) {
    if (!/^(data:|https?:)/.test(m[2])) refuse(`a relative url(${m[2]}) in the CSS; map it to the media library before shipping it verbatim`)
  }
  if (/@import\b/.test(bare)) refuse('@import in the CSS: inline it')

  const remoteName = (src) => {
    const u = new URL(src)
    if (u.hostname === 'i.ytimg.com') return localImageName(src)
    if (u.hostname === 'cdn.prod.website-files.com') {
      // `<24-hex id>_<name>`: drop the id, keep a filename the media library will accept.
      return 'wf-' + decodeURIComponent(path.posix.basename(u.pathname)).replace(/^[0-9a-f]{24}_/, '').replace(/[^A-Za-z0-9._-]+/g, '-').replace(/-+/g, '-')
    }
    /* Our own Instatic's media library (2026-09-14): the practice logos Sang uploaded in the admin
       (`/uploads/<21-char id>-<name>`), which exist nowhere else. The id is dropped. */
    if (u.hostname === 'brandklout-production.up.railway.app' && u.pathname.startsWith('/uploads/')) {
      return 'bk-' + decodeURIComponent(path.posix.basename(u.pathname)).replace(/^[A-Za-z0-9_-]{21}-/, '').replace(/[^A-Za-z0-9._-]+/g, '-').replace(/-+/g, '-')
    }
    refuse(`remote image from a host this step does not know how to name: ${src}`)
  }
  const localAssets = new Map() // package path -> asset name
  const remote = new Map() // url -> asset name
  const claim = (map, key, name) => {
    for (const m of [localAssets, remote]) for (const [k, v] of m) if (v === name && k !== key) refuse(`two images would both be assets/${name}: ${k} and ${key}`)
    map.set(key, name)
    return name
  }

  const out = []
  const repairs = {}
  const seo = { pages: {} }
  let placeholders = 0
  for (const file of pageFiles) {
    const route = routeOf(file)
    if (!SLUG_OK.test(route)) refuse(`${file} -> slug "${route}" is not a valid Instatic page slug`)
    const html = patched(file)
    let page = html
    const sheets = sheetsOf(page)
    // The same two tags the v2 path writes (LINK / SCRIPT below, not yet initialised at this point).
    page = page.replace(sheets[0].tag, () => '<link rel="stylesheet" href="/assets/site.css">')
    for (const s of sheets.slice(1)) page = page.replace(s.tag, '')
    for (const m of scriptsOf(page)) page = page.replace(m[0], '')
    page = page.replace(/<\/body>/i, '<script type="module" src="/assets/site.js"></script>\n</body>')
    // The favicon is a <head> tag the import drops (trap 31), and its relative href is not a page.
    page = page.replace(/<link\b[^>]*\brel="icon"[^>]*>/gi, '')
    page = page.replace(/<img\b[^>]*>/gi, (tag) => {
      const a = attrsOf(tag)
      if (a['data-online-src']) {
        const name = claim(remote, a['data-online-src'], remoteName(a['data-online-src']))
        let t = tag.replace(/\sdata-online-(?:src|alt)="[^"]*"/g, '').replace(/\ssrc="[^"]*"/, () => ` src="/assets/${name}"`)
        if (a['data-online-alt'] !== undefined) t = t.replace(/\salt="[^"]*"/, () => ` alt="${a['data-online-alt']}"`)
        return t
      }
      const src = a.src ?? ''
      /* A data: URI IMAGE IS DROPPED BY THE IMPORTER. FOUND 2026-09-14 by visual-diff.mjs: the six
         specialty pages' hero illustrations (inline data: images with no online original) published
         as `<img src="#" alt="">`, alt and size gone. So each is decoded into a real file, named by
         its content hash, and goes through the media library like any other image. */
      if (src.startsWith('data:')) {
        placeholders++
        const m = src.match(/^data:(image\/[a-z0-9.+-]+)(;[^,]*)?,(.*)$/is)
        if (!m) refuse(`${file}: a data: image that is not image/*: ${src.slice(0, 60)}`)
        const ext = { 'image/svg+xml': 'svg', 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' }[m[1].toLowerCase()]
        if (!ext) refuse(`${file}: a data: image of type ${m[1]}, which upload-media.mjs does not handle`)
        const bytes = /;base64/i.test(m[2] ?? '') ? Buffer.from(m[3], 'base64') : Buffer.from(decodeURIComponent(m[3]), 'utf8')
        const name = `inline-${crypto.createHash('sha256').update(bytes).digest('hex').slice(0, 10)}.${ext}`
        fs.mkdirSync(IMG_CACHE, { recursive: true })
        if (!fs.existsSync(path.join(IMG_CACHE, name))) fs.writeFileSync(path.join(IMG_CACHE, name), bytes)
        claim(remote, src, name) // copied from the cache into final-site/assets with the downloads
        return tag.replace(`src="${src}"`, () => `src="/assets/${name}"`)
      }
      if (/^https?:/i.test(src)) return tag.replace(`src="${src}"`, () => `src="/assets/${claim(remote, src, remoteName(src))}"`)
      const rel = path.posix.normalize(path.posix.join(path.posix.dirname(file), src))
      if (!fs.existsSync(path.join(PKG, rel))) refuse(`${file}: image ${src} is not in the package`)
      return tag.replace(`src="${src}"`, () => `src="/assets/${claim(localAssets, rel, path.posix.basename(rel))}"`)
    })
    if (/<(?:img|source)\b[^>]*\ssrcset=/i.test(page)) refuse(`${file}: srcset is not handled`)

    const lost = droppedAttributes(html, file)
    if (lost.length) repairs[route === 'index' ? '/' : `/${route}`] = lost

    const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1].trim()
    const descTag = html.match(/<meta\b[^>]*\bname=["']description["'][^>]*>/i)?.[0]
    const description = descTag ? attrsOf(descTag).content : undefined
    if (!title || !description) refuse(`${file}: no <title> or no meta description`)
    seo.pages[route] = { title: decodeEntities(title), description: decodeEntities(description) }
    out.push({ slug: route, file, out: page })
  }

  const jsParts = []
  if (Object.keys(repairs).length) {
    jsParts.push(
      `/* ---- import repairs, generated by prepare-source.mjs: the attributes Instatic's form-control\n` +
        `   modules drop (trap 41), put back per page before any page script runs. A no-op locally. ---- */\n` +
        `{\n` +
        `  const lost = ${JSON.stringify(repairs)}\n` +
        `  const here = location.pathname.replace(/\\.html$/, '').replace(/\\/index$/, '/') || '/'\n` +
        `  for (const [sel, nth, attrs] of lost[here] ?? []) {\n` +
        `    const el = document.querySelectorAll(sel)[nth]\n` +
        `    if (!el) { console.warn('import repair: nothing matches', sel, nth); continue }\n` +
        `    for (const [k, v] of Object.entries(attrs)) if (el.getAttribute(k) !== v) el.setAttribute(k, v)\n` +
        `  }\n` +
        `}`,
    )
  }
  for (const rel of scriptRels) {
    jsParts.push(`/* ---- ${rel} (Sang, ${patches.has(rel) ? `patched by patches/${rel}.mjs` : 'verbatim'}). Instatic has one script asset (trap 17); order kept. ---- */\n${patched(rel)}`)
  }
  // Agency scripts (agency/*.js, e.g. the home slider), after Sang's, in name order.
  const agencyDir = path.join(HERE, 'agency')
  for (const f of fs.readdirSync(agencyDir).filter((n) => n.endsWith('.js')).sort()) {
    jsParts.push(fs.readFileSync(path.join(agencyDir, f), 'utf8'))
  }

  fs.rmSync(SITE, { recursive: true, force: true })
  fs.mkdirSync(path.join(FINAL, 'assets'), { recursive: true })
  fs.mkdirSync(CSS_SRC, { recursive: true }) // empty: nothing for push-site to harvest, the CSS is verbatim
  fs.mkdirSync(IMG_CACHE, { recursive: true })
  for (const p of out) fs.writeFileSync(path.join(FINAL, p.file), p.out)
  fs.writeFileSync(path.join(FINAL, 'assets', 'site.css'), css)
  fs.writeFileSync(path.join(FINAL, 'assets', 'site.js'), jsParts.join('\n\n') + '\n')
  for (const [rel, name] of localAssets) fs.copyFileSync(path.join(PKG, rel), path.join(FINAL, 'assets', name))
  for (const [src, name] of remote) {
    const cached = path.join(IMG_CACHE, name)
    if (!fs.existsSync(cached)) {
      const r = await fetch(src)
      const type = r.headers.get('content-type') ?? ''
      if (!r.ok || !type.startsWith('image/')) refuse(`${src} -> ${r.status} ${type}`)
      fs.writeFileSync(cached, Buffer.from(await r.arrayBuffer()))
    }
    fs.copyFileSync(cached, path.join(FINAL, 'assets', name))
  }
  fs.writeFileSync(path.join(SITE, 'site-src', 'seo.json'), JSON.stringify(seo, null, 2) + '\n')
  fs.writeFileSync(
    path.join(SITE, 'site-src', 'pages.json'),
    JSON.stringify(
      { package: path.basename(PKG), layout: 'shared', css: 'verbatim', overlay: [...overlaid], aliases, notPages: [...NOT_PAGES].filter((f) => all.includes(f)), pages: out.map(({ slug, file }) => ({ slug, file, scope: null })) },
      null,
      2,
    ) + '\n',
  )

  console.log(`package  ${path.basename(PKG)}: SHARED layout, ${out.length} page(s), not pages: ${[...NOT_PAGES].filter((f) => all.includes(f)).join(', ') || '-'}`)
  for (const [rel, list] of patches) if (all.includes(rel)) console.log(`patches  ${rel}: ${list.length} applied`)
  console.log(`css      ${sheetRels.join(' + ')}${fs.existsSync(agencyCss) ? ' + agency/site.css' : ''} = ${(css.length / 1024).toFixed(1)}KB, verbatim`)
  console.log(`js       ${scriptRels.join(' + ')} = ${(jsParts.join('').length / 1024).toFixed(1)}KB`)
  for (const [route, lost] of Object.entries(repairs)) {
    console.log(`repairs  ${route}: ${lost.length} element(s)`)
    for (const [sel, nth, attrs] of lost.slice(0, 6)) console.log(`    ${sel}${nth ? `[${nth}]` : ''}  ${JSON.stringify(attrs)}`)
    if (lost.length > 6) console.log(`    … and ${lost.length - 6} more`)
  }
  console.log(`images   ${localAssets.size} local, ${remote.size} downloaded (${[...remote.values()].join(', ')}), ${placeholders} data: image(s) decoded into inline-<hash> files (the importer drops data: srcs)`)
  for (const p of out) console.log(`  ${p.slug.padEnd(40)} ${seo.pages[p.slug].title}`)
}

/* --- pages --------------------------------------------------------------------------------- */
const repairsByScope = new Map() // scope -> [[selector, nth, {attr: value}]]
const pages = []
const cssByScope = new Map() // scope -> { source, css }
const jsByScope = new Map() // scope -> { files: [], js }
const remote = new Map() // remote src -> local asset name
const seo = { pages: {} }

const LINK = '<link rel="stylesheet" href="/assets/site.css">'
// A module, because that is how Instatic serves the script asset (strict mode, deferred), so the
// local page runs Sang's code under the same rules the published one does.
const SCRIPT = '<script type="module" src="/assets/site.js"></script>'

function localImageName(src) {
  const u = new URL(src)
  const m = u.hostname === 'i.ytimg.com' && u.pathname.match(/^\/vi\/([A-Za-z0-9_-]{11})\/([a-z0-9_]+\.(?:jpg|jpeg|png|webp))$/i)
  if (!m) refuse(`remote image from a host this step does not know how to name: ${src}`)
  return `yt-${m[1]}-${m[2]}`
}

for (const file of pageFiles) {
  const route = routeOf(file)
  if (!SLUG_OK.test(route)) refuse(`${file} -> slug "${route}" is not a valid Instatic page slug`)
  let html
  try {
    html = applyPatches(file, read(file), patches)
  } catch (e) {
    refuse(e.message)
  }

  const styleBlocks = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)]
  const cssLinks = [...html.matchAll(/<link\b[^>]*>/gi)]
    .map((m) => m[0])
    .filter((t) => /rel=["']?stylesheet/i.test(t))
    .map((tag) => ({ tag, href: (tag.match(/href=["']([^"']+)["']/i) ?? [])[1] }))
    .filter((l) => l.href && !/^(https?:)?\/\//i.test(l.href))
  if (styleBlocks.length + cssLinks.length !== 1) {
    refuse(`${file}: expected one inline <style> OR one local stylesheet, found ${styleBlocks.length} and ${cssLinks.length}`)
  }
  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
  if (scripts.some((m) => /\bsrc=/i.test(m[1]))) refuse(`${file}: a <script src>. It has to go into the bundle as a module (see the directive)`)
  const inline = scripts.filter((m) => !/type=["']?application\/(ld\+)?json/i.test(m[1]))
  if (inline.length > 1) refuse(`${file}: ${inline.length} inline scripts`)

  const cssRel = cssLinks.length ? path.posix.normalize(path.posix.join(path.posix.dirname(file), cssLinks[0].href)) : null
  const scope = scopeOf(route, cssRel)
  const rawCss = styleBlocks.length ? styleBlocks[0][1] : read(cssRel)
  const source = cssRel ?? `${file} <style>`
  const prior = cssByScope.get(scope)
  if (prior && prior.source !== source) refuse(`scope ${scope} is claimed by both ${prior.source} and ${source}`)
  if (!prior) cssByScope.set(scope, { source, css: scopeCss(rawCss, scope) })

  const lost = droppedAttributes(html, file)
  if (lost.length) {
    const had = repairsByScope.get(scope)
    if (had && JSON.stringify(had) !== JSON.stringify(lost)) refuse(`two pages in ${scope} need different attribute repairs`)
    repairsByScope.set(scope, lost)
  }

  if (inline.length) {
    const js = inline[0][2].replace(/^\n/, '').replace(/\s+$/, '')
    const had = jsByScope.get(scope)
    if (had && had.js !== js) refuse(`two pages in ${scope} carry different scripts`)
    jsByScope.set(scope, { files: [...(had?.files ?? []), file], js })
  }

  let out = html
  out = styleBlocks.length ? out.replace(styleBlocks[0][0], LINK) : out.replace(cssLinks[0].tag, LINK)
  if (inline.length) out = out.replace(inline[0][0], '')
  out = out.replace(/<\/body>/i, `  ${SCRIPT}\n</body>`)
  out = out.replace(/<body\b([^>]*)>/i, (_w, attrs) => {
    if (/\bclass=/i.test(attrs)) refuse(`${file}: <body> already has a class; merge it by hand`)
    return `<body class="${scope}"${attrs}>`
  })
  for (const m of out.matchAll(/<img\b[^>]*?\bsrc="([^"]+)"/gi)) {
    if (!/^https?:/i.test(m[1])) refuse(`${file}: a relative image (${m[1]}). Copy it into assets/ here before adapting the rest`)
    remote.set(m[1], localImageName(m[1]))
  }
  for (const [src, name] of remote) out = out.split(`src="${src}"`).join(`src="/assets/${name}"`)

  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1].trim()
  const description = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i)?.[1]
  if (!title || !description) refuse(`${file}: no <title> or no meta description`)
  seo.pages[route] = { title, description }

  pages.push({ slug: route, file, scope, out })
}

/* html { } rules are global: fine only while every stylesheet says the same thing. */
for (const [rule, scopes] of htmlRules) {
  if (scopes.length !== cssByScope.size) refuse(`an html rule only some stylesheets declare, which would leak onto the others: ${rule}`)
}

/* --- write ---------------------------------------------------------------------------------- */
fs.rmSync(SITE, { recursive: true, force: true })
fs.mkdirSync(path.join(FINAL, 'assets'), { recursive: true })
fs.mkdirSync(CSS_SRC, { recursive: true })
fs.mkdirSync(IMG_CACHE, { recursive: true })

for (const p of pages) {
  fs.mkdirSync(path.dirname(path.join(FINAL, p.file)), { recursive: true })
  fs.writeFileSync(path.join(FINAL, p.file), p.out)
}

for (const [src, name] of remote) {
  const cached = path.join(IMG_CACHE, name)
  if (!fs.existsSync(cached)) {
    const r = await fetch(src)
    const type = r.headers.get('content-type') ?? ''
    if (!r.ok || !type.startsWith('image/')) refuse(`${src} -> ${r.status} ${type}`)
    fs.writeFileSync(cached, Buffer.from(await r.arrayBuffer()))
  }
  fs.copyFileSync(cached, path.join(FINAL, 'assets', name))
}

/* MEDIA ORDER (trap 40). FOUND 2026-09-11 by compare-live.mjs at 390 on the home page: the
   operator card, the boundary grid and the footer stayed two columns on a phone. Instatic
   registers media conditions SITE-WIDE in the order it first meets them and emits every rule's
   conditional styles in that order. Joined story-first, the order was 900, 620, 980 — so the
   home page's ≤980 rules came after its ≤620 rules and beat them. One stylesheet alone never
   shows this; two with different breakpoints always can.
   So the joined stylesheet is every stylesheet's unconditioned rules, then every @media block,
   widest max-width first (the order a max-width cascade needs), source order within a width.
   Scopes never share an element, so moving one stylesheet's media past another's base rules
   changes nothing; within a stylesheet it is safe only while its media blocks already come last,
   which is asserted. Anything but a single max-width query is refused rather than guessed at. */
let n = 10
const base = []
const media = []
for (const [scope, { source, css }] of cssByScope) {
  fs.writeFileSync(path.join(CSS_SRC, `${n}-${scope}.css`), css + '\n')
  n += 10
  base.push(`/* ===== ${source}, scoped to body.${scope} by prepare-source.mjs ===== */`)
  let seenMedia = false
  for (const r of rules(css)) {
    const text = `${r.sel}{${r.body}}`
    if (r.sel.startsWith('@media')) {
      const m = r.sel.match(/^@media\s*\(\s*max-width\s*:\s*(\d+)px\s*\)$/)
      if (!m) refuse(`${source}: ${r.sel} is not a single max-width query; order it by hand`)
      media.push({ width: Number(m[1]), text, order: media.length, source })
      seenMedia = true
    } else {
      if (seenMedia) refuse(`${source}: an unconditioned rule after an @media block, which moving the media would reorder`)
      base.push(text)
    }
  }
}
media.sort((a, b) => b.width - a.width || a.order - b.order)
fs.writeFileSync(
  path.join(FINAL, 'assets', 'site.css'),
  base.join('\n') +
    '\n\n/* ===== every @media block of every stylesheet, widest first (trap 40) ===== */\n' +
    media.map((m) => `/* ${m.source} */\n${m.text}`).join('\n') +
    '\n',
)

const jsParts = []
if (repairsByScope.size) {
  jsParts.push(
    `/* ---- import repairs, generated by prepare-source.mjs: the attributes Instatic's form-control\n` +
      `   modules drop, put back before any page script runs. A no-op where nothing was dropped. ---- */\n` +
      `{\n` +
      `  const lost = ${JSON.stringify(Object.fromEntries(repairsByScope))}\n` +
      `  const scope = [...document.body.classList].find((c) => c in lost)\n` +
      `  for (const [sel, nth, attrs] of lost[scope] ?? []) {\n` +
      `    const el = document.querySelectorAll(sel)[nth]\n` +
      `    if (!el) { console.warn('import repair: nothing matches', sel, nth); continue }\n` +
      `    for (const [k, v] of Object.entries(attrs)) if (el.getAttribute(k) !== v) el.setAttribute(k, v)\n` +
      `  }\n` +
      `}`,
  )
}
for (const [scope, { files, js }] of jsByScope) {
  jsParts.push(
    `/* ---- the inline <script> of ${files.join(', ')}, verbatim. Guarded by the body class: Instatic has\n` +
      `   one script asset for every page (trap 17), and this code throws on a page without its elements. ---- */\n` +
      `if (document.body.classList.contains('${scope}')) {\n${js}\n}`,
  )
}
fs.writeFileSync(path.join(FINAL, 'assets', 'site.js'), jsParts.join('\n\n') + '\n')

fs.writeFileSync(path.join(SITE, 'site-src', 'seo.json'), JSON.stringify(seo, null, 2) + '\n')
fs.writeFileSync(
  path.join(SITE, 'site-src', 'pages.json'),
  JSON.stringify(
    { package: path.basename(PKG), overlay: [...overlaid], aliases, pages: pages.map(({ slug, file, scope }) => ({ slug, file, scope })) },
    null,
    2,
  ) + '\n',
)

console.log(`package  ${path.basename(PKG)}: ${htmlFiles.length} html, ${pages.length} page(s), aliases ${JSON.stringify(aliases)}`)
if (overlaid.size) console.log(`overlay  ${[...overlaid].join(', ')} (replaces the package's copy)`)
for (const [rel, list] of patches) console.log(`patches  ${rel}: ${list.length} applied`)
for (const p of pages) console.log(`  ${p.slug.padEnd(42)} ${p.file.padEnd(52)} ${p.scope}`)
console.log(`css      ${[...cssByScope].map(([s, v]) => `${s} ${(v.css.length / 1024).toFixed(1)}KB`).join(' · ')}`)
console.log(`js       ${[...jsByScope].map(([s, v]) => `${s} ${v.js.length}B`).join(' · ')}`)
for (const [scope, lost] of repairsByScope) {
  console.log(`repairs  ${scope}: ${lost.length} element(s)`)
  for (const [sel, nth, attrs] of lost) console.log(`    ${sel}${nth ? `[${nth}]` : ''}  ${JSON.stringify(attrs)}`)
}
console.log(`images   ${remote.size} remote -> assets/: ${[...remote.values()].join(', ')}`)
