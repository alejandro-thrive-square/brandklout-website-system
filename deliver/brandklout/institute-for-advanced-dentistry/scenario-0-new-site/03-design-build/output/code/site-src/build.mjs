/**
 * build.mjs — the Institute for Advanced Dentistry site, from sources to dist/.
 *
 *   pages/**\/*.html    one file per page. First line is the page header:
 *                       <!--@page {"title": "...", "description": "...", "label": "..."}-->
 *                       The rest is the content of <main>. Route = the file path:
 *                       pages/index.html -> /, pages/dental-services/tmj-treatment.html -> /dental-services/tmj-treatment/
 *   partials/*.html     chrome. Used from a page as a void include  <!--@name {json}-->
 *                       or a block include                          <!--@name {json}--> ... <!--@/name-->
 *                       Inside a partial: {{key}} (escaped as written), {{content}} (the block body),
 *                       {{key|default text}}. Includes nest.
 *   css/*.css           concatenated in name order -> dist/assets/site.css
 *   js/*.js             concatenated in name order -> dist/assets/site.js (GSAP stays separate in dist/assets/gsap/)
 *   media/img, media/video, fonts   copied as referenced (root-relative: /media/img/x.jpg)
 *
 *   out: dist/<route>.html (index.html = home), dist/assets/, dist/media/, dist/fonts/, seo.json
 *
 * Refuses (exit 1) on: a reference to a file that is not on disk, an unknown include, an unresolved
 * {{key}}, a page without title/description or with other than one <h1>, an em dash in visible copy.
 *
 * Usage: node build.mjs > build.log 2>&1      (never pipe a Node script on Windows)
 *        node build.mjs --out <dir>            build somewhere else (parallel builders: never share dist/)
 *        node build.mjs --only a,b             only pages whose path under pages/ starts with a or b (index always)
 *                                              seo.json is only written by a full build into dist/
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.dirname(fileURLToPath(import.meta.url))
const argOf = (n) => { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : undefined }
const DIST = argOf('--out') ? path.resolve(argOf('--out')) : path.join(ROOT, 'dist')
const ONLY = argOf('--only') ? argOf('--only').split(',').map((x) => x.trim()).filter(Boolean) : null
const FULL = !ONLY && !argOf('--out')
const site = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/site.json'), 'utf8'))
// Third-party widgets: <div ... data-embed="key"></div> gets data/embeds.json[key] inside it for the local preview.
// The push turns the same marker into an Instatic Embed block with the same snippet (iframes and scripts never
// survive Instatic's importer as markup).
const embeds = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/embeds.json'), 'utf8'))
const problems = []

const walk = (dir, pre = '') => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? walk(path.join(dir, e.name), pre + e.name + '/') : e.name.endsWith('.html') ? [pre + e.name] : [])

const partials = Object.fromEntries(fs.readdirSync(path.join(ROOT, 'partials')).filter((f) => f.endsWith('.html'))
  .map((f) => [f.replace(/\.html$/, ''), fs.readFileSync(path.join(ROOT, 'partials', f), 'utf8')]))

const fill = (tpl, vars, where) => tpl.replace(/\{\{([a-zA-Z0-9_.]+)(?:\|([^}]*))?\}\}/g, (m, key, dflt) => {
  const v = key.split('.').reduce((o, k) => (o == null ? undefined : o[k]), vars)
  if (v !== undefined && v !== null) return String(v)
  if (dflt !== undefined) return dflt
  problems.push(`${where}: unresolved {{${key}}}`)
  return ''
})

// expand includes (block first, then void), repeatedly, so partials may include partials
function expand(html, vars, where, depth = 0) {
  if (depth > 8) { problems.push(`${where}: include depth > 8`); return html }
  let changed = false
  html = html.replace(/<!--@([a-z0-9-]+)(\s+\{[\s\S]*?\})?\s*-->([\s\S]*?)<!--@\/\1-->/g, (m, name, json, body) => {
    changed = true
    return render(name, json, vars, where, body)
  })
  // a name that still has a closing tag is a block opener nested in a block just expanded: next pass
  const blocks = new Set([...html.matchAll(/<!--@\/([a-z0-9-]+)-->/g)].map((x) => x[1]))
  html = html.replace(/<!--@([a-z0-9-]+)(\s+\{[\s\S]*?\})?\s*-->/g, (m, name, json) => {
    if (name === 'page' || blocks.has(name)) return m
    changed = true
    return render(name, json, vars, where, '')
  })
  return changed ? expand(html, vars, where, depth + 1) : html
}
function render(name, json, vars, where, body) {
  const tpl = partials[name]
  if (tpl === undefined) { problems.push(`${where}: unknown include @${name}`); return '' }
  let args = {}
  if (json && json.trim()) { try { args = JSON.parse(json) } catch (e) { problems.push(`${where}: bad JSON in @${name}: ${e.message}`) } }
  return fill(tpl, { ...vars, ...args, content: body }, `${where} @${name}`)
}

const routeOf = (rel) => rel === 'index.html' ? '/' : '/' + rel.replace(/\.html$/, '') + '/'
const pages = walk(path.join(ROOT, 'pages')).filter((rel) => !ONLY || rel === 'index.html' || ONLY.some((o) => rel.startsWith(o))).sort((a, b) => (a === 'index.html' ? -1 : b === 'index.html' ? 1 : a.localeCompare(b)))

fs.rmSync(DIST, { recursive: true, force: true })
fs.mkdirSync(path.join(DIST, 'assets/gsap'), { recursive: true })
const seo = { origin: site.origin, pages: {} }
const used = new Set()

for (const rel of pages) {
  const src = fs.readFileSync(path.join(ROOT, 'pages', rel), 'utf8')
  const m = src.match(/^\s*<!--@page\s+(\{[\s\S]*?\})\s*-->/)
  if (!m) { problems.push(`${rel}: no <!--@page {...}--> header`); continue }
  let meta
  try { meta = JSON.parse(m[1]) } catch (e) { problems.push(`${rel}: bad page header: ${e.message}`); continue }
  const route = routeOf(rel)
  const slug = rel === 'index.html' ? 'index' : rel.replace(/\.html$/, '')
  if (!meta.title || !meta.description) problems.push(`${rel}: title and description are required`)
  const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
  const vars = { site, page: { ...meta, route, slug, titleHtml: esc(meta.title), descriptionHtml: esc(meta.description) } }
  const main = expand(fill(src.slice(m[0].length), vars, rel), vars, rel)
  let doc = expand(fill(partials.layout, { ...vars, main }, rel + ' layout'), vars, rel)

  doc = doc.replace(/(<div[^>]*\sdata-embed="([a-z0-9-]+)"[^>]*>)(<\/div>)/g, (m, open, key, close) => {
    if (!embeds[key]) { problems.push(`${rel}: data-embed="${key}" is not in data/embeds.json`); return m }
    return open + embeds[key] + close
  })

  // the current page: aria-current on every chrome link that points at this route
  doc = doc.replace(/<a ([^>]*?)href="([^"#?]+)"/g, (whole, pre, href) =>
    href === route && !/aria-current/.test(pre) ? `<a ${pre}aria-current="page" href="${href}"` : whole)

  // checks on the finished page
  const visible = doc.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, ' ')
  if (/—/.test(visible) || /&mdash;/.test(doc)) problems.push(`${rel}: em dash in copy (house rule: none)`)
  const h1s = (doc.match(/<h1[\s>]/g) || []).length
  if (h1s !== 1) problems.push(`${rel}: ${h1s} <h1> (exactly one)`)
  for (const r of doc.matchAll(/(?:src|href|poster|data-src-lg|data-src-sm|data-story|data-full|data-before|data-after)="(\/(?:media|fonts)\/[^"]+)"/g)) {
    const file = path.join(ROOT, decodeURI(r[1]))
    if (!fs.existsSync(file)) problems.push(`${rel}: ${r[1]} is not on disk`)
    else used.add(r[1])
  }
  for (const r of doc.matchAll(/srcset="([^"]+)"/g)) problems.push(`${rel}: srcset is not supported by the push (${r[1].slice(0, 40)})`)

  const out = path.join(DIST, rel)
  fs.mkdirSync(path.dirname(out), { recursive: true })
  fs.writeFileSync(out, doc)
  seo.pages[slug] = { title: meta.title, description: meta.description, route, label: meta.label || meta.title }
}

// stylesheet and script
const cssFiles = fs.readdirSync(path.join(ROOT, 'css')).filter((f) => f.endsWith('.css')).sort()
const css = cssFiles.map((f) => `/* ==== ${f} ==== */\n` + fs.readFileSync(path.join(ROOT, 'css', f), 'utf8')).join('\n')
for (const r of css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/url\('\.\.\/(fonts\/[^']+)'\)/g)) {
  if (!fs.existsSync(path.join(ROOT, r[1]))) problems.push(`site.css: ${r[1]} is not on disk`)
  else used.add('/' + r[1])
}
for (const r of css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/url\(['"]?(\/media\/[^'")]+)['"]?\)/g)) {
  if (!fs.existsSync(path.join(ROOT, r[1]))) problems.push(`site.css: ${r[1]} is not on disk`)
  else used.add(r[1])
}
fs.writeFileSync(path.join(DIST, 'assets/site.css'), css)
const jsFiles = fs.readdirSync(path.join(ROOT, 'js')).filter((f) => f.endsWith('.js')).sort()
fs.writeFileSync(path.join(DIST, 'assets/site.js'), jsFiles.map((f) => `/* ==== ${f} ==== */\n` + fs.readFileSync(path.join(ROOT, 'js', f), 'utf8')).join('\n'))
for (const f of fs.readdirSync(path.join(ROOT, 'vendor/gsap'))) fs.copyFileSync(path.join(ROOT, 'vendor/gsap', f), path.join(DIST, 'assets/gsap', f))

for (const u of used) {
  const to = path.join(DIST, u)
  fs.mkdirSync(path.dirname(to), { recursive: true })
  fs.copyFileSync(path.join(ROOT, u), to)
}
fs.writeFileSync(path.join(ROOT, 'seo.json'), JSON.stringify(seo, null, 1) + '\n')

console.log(`pages  ${pages.length}`)
console.log(`media  ${used.size} files referenced`)
console.log(`css    ${cssFiles.length} files, ${(css.length / 1024).toFixed(0)} KB;  js ${jsFiles.length} files`)
if (problems.length) {
  console.error(`\n${problems.length} PROBLEM(S):\n  ` + problems.join('\n  '))
  process.exit(1)
}
console.log('ok')
