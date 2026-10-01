/**
 * Site push, step 2 — resolve the __WZM__ tokens and assemble what ship.sh and push.mjs send.
 * Generalised 2026-10-01 from workflows/21-instatic-upload/home/build-home.mjs.
 *
 *   in:  .tmp/{pages.json, pages/*.html, media-map.json} + ../site-src/dist/assets/{site.css, site.js, gsap/}
 *   out: .tmp/site.css               code asset src/styles/site.css  (the build's site.css, font urls resolved)
 *        .tmp/site.js                code asset src/scripts/site.js  (4 GSAP files, wrapped, + the build's site.js)
 *        .tmp/import-input.json.gz   { css: '', pages: [...] }  and .b64 for ship.sh
 *
 * `css` is EMPTY on purpose, as for the approved home: the registry conversion loses custom properties,
 * svh units and source order, and this stylesheet leans on all three. The importer still auto-creates a bare
 * class per class name, so an editor can select any element.
 *
 * THE VENDOR WRAP (build-home.mjs header): the script asset is bundled as CJS and served as
 * <script type="module">; each GSAP UMD runs inside a function that shadows exports/module/define, `this`
 * bound to a plain object, and what it hangs there is copied to window before the next file runs.
 *
 * Usage: node push/assemble.mjs > push/.tmp/assemble.log 2>&1
 */
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const TMP = path.join(HERE, '.tmp')
const DIST = path.resolve(HERE, '../site-src/dist')

const { map } = JSON.parse(fs.readFileSync(path.join(TMP, 'media-map.json'), 'utf8'))
const pages = JSON.parse(fs.readFileSync(path.join(TMP, 'pages.json'), 'utf8'))
const url = (p) => {
  if (!map[p]?.url) throw new Error(`not uploaded: ${p} (run upload-media.mjs)`)
  return map[p].url
}
const resolveTokens = (s) => s.replace(/__WZM__\[([^\]]+)\]__/g, (m, enc) => url(decodeURIComponent(enc)))

const siteCss = `/* src/styles/site.css — built by push/assemble.mjs from site-src (css/*.css via build.mjs). Edit site-src, not this. */\n` +
  fs.readFileSync(path.join(DIST, 'assets/site.css'), 'utf8')
    .replace(/url\('\.\.\/(fonts\/[^']+)'\)/g, (m, f) => `url('${url(f)}')`)
    .replace(/url\((['"]?)\/(media\/[^'")]+)\1\)/g, (m, q, f) => `url('${url(f)}')`)

const wrap = (file) => {
  const code = fs.readFileSync(path.join(DIST, 'assets/gsap', file), 'utf8')
  return `/* ${file} */\n(function () {\n  var shim = {};\n  (function (exports, module, define, self, globalThis) {\n${code}\n  }).call(shim, undefined, undefined, undefined, shim, shim);\n  var out = shim.window || shim;\n  for (var k in out) window[k] = out[k];\n})();\n`
}
const vendors = ['gsap.min.js', 'ScrollTrigger.min.js', 'ScrollSmoother.min.js', 'SplitText.min.js']
const guard = `if (!(window.gsap && window.ScrollTrigger && window.ScrollSmoother && window.SplitText)) console.error('site.js: a GSAP file did not reach window', typeof window.gsap, typeof window.ScrollTrigger, typeof window.ScrollSmoother, typeof window.SplitText);\n`
const siteJs = `/* src/scripts/site.js — built by push/assemble.mjs: GSAP 3.15 (wrapped) + site-src js/*.js. */\n${vendors.map(wrap).join('')}${guard}${fs.readFileSync(path.join(DIST, 'assets/site.js'), 'utf8')}`

const input = { css: '', pages: [] }
for (const p of pages) {
  const html = resolveTokens(fs.readFileSync(path.join(TMP, p.file), 'utf8'))
  if (/__WZM__/.test(html)) throw new Error(`unresolved token in ${p.slug}`)
  input.pages.push({ slug: p.slug, title: p.title, seoTitle: p.title, seoDescription: p.description, html })
}
fs.writeFileSync(path.join(TMP, 'site.css'), siteCss)
fs.writeFileSync(path.join(TMP, 'site.js'), siteJs)
const gz = zlib.gzipSync(Buffer.from(JSON.stringify(input)), { level: 9 })
fs.writeFileSync(path.join(TMP, 'import-input.json.gz'), gz)
fs.writeFileSync(path.join(TMP, 'import-input.b64'), gz.toString('base64'))
const raw = input.pages.reduce((n, p) => n + p.html.length, 0)
console.log(`pages      ${input.pages.length}, ${(raw / 1024).toFixed(0)} KB html, ${(gz.length / 1024).toFixed(1)} KB gzipped (${Math.ceil(gz.length * 4 / 3 / 6000)} ship chunks)`)
console.log(`site.css   ${(siteCss.length / 1024).toFixed(0)} KB`)
console.log(`site.js    ${(siteJs.length / 1024).toFixed(0)} KB`)
