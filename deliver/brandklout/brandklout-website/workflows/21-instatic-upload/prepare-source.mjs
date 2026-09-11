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

const walk = (rel = '') =>
  fs.readdirSync(path.join(PKG, rel), { withFileTypes: true }).flatMap((d) => {
    const r = rel ? `${rel}/${d.name}` : d.name
    return d.isDirectory() ? walk(r) : [r]
  })
const read = (rel) => fs.readFileSync(path.join(PKG, rel), 'utf8')
const all = walk()
const htmlFiles = all.filter((f) => /\.html?$/i.test(f)).sort()
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
  const html = read(file)

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
  JSON.stringify({ package: path.basename(PKG), aliases, pages: pages.map(({ slug, file, scope }) => ({ slug, file, scope })) }, null, 2) + '\n',
)

console.log(`package  ${path.basename(PKG)}: ${htmlFiles.length} html, ${pages.length} page(s), aliases ${JSON.stringify(aliases)}`)
for (const p of pages) console.log(`  ${p.slug.padEnd(42)} ${p.file.padEnd(52)} ${p.scope}`)
console.log(`css      ${[...cssByScope].map(([s, v]) => `${s} ${(v.css.length / 1024).toFixed(1)}KB`).join(' · ')}`)
console.log(`js       ${[...jsByScope].map(([s, v]) => `${s} ${v.js.length}B`).join(' · ')}`)
for (const [scope, lost] of repairsByScope) {
  console.log(`repairs  ${scope}: ${lost.length} element(s)`)
  for (const [sel, nth, attrs] of lost) console.log(`    ${sel}${nth ? `[${nth}]` : ''}  ${JSON.stringify(attrs)}`)
}
console.log(`images   ${remote.size} remote -> assets/: ${[...remote.values()].join(', ')}`)
