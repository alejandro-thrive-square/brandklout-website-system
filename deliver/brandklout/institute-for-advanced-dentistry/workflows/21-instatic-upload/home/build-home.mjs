/**
 * Home redesign, step 2 — resolve the __WZM__ tokens and assemble what ship.sh and push-home.mjs send.
 *
 *   in:  ../.tmp/home/{page.html, meta.json, media-map.json} + the prototype's css, js, fonts.css, vendor/
 *   out: ../.tmp/home/site.css               code asset src/styles/site.css  (faces + home.css, verbatim)
 *        ../.tmp/home/site.js                code asset src/scripts/site.js  (4 GSAP files, wrapped, + home.js)
 *        ../.tmp/home/import-input.json.gz   { css: '', pages: [index] }  and .b64 for ship.sh
 *
 * `css` is EMPTY on purpose, as on the WordPress clone: the registry conversion loses custom
 * properties, svh units and source order, and this stylesheet leans on all three. The importer
 * still auto-creates a bare class per class name, so an editor can select any element.
 *
 * THE VENDOR WRAP. The script asset is bundled as CJS and served as <script type="module">. A UMD
 * that tests `exports`/`module`/`define` takes the wrong branch there and never reaches window —
 * on West LA Implants SplitText and Observer published undefined while the pins scrubbed fine. Each
 * GSAP file therefore runs inside a function that shadows those names, with `this` bound to a plain
 * object; whatever it hangs on that object is copied to window before the next file runs (the
 * plugins look gsap up on window). Never pass window itself as the shim: a UMD's
 * `global.window = global.window || {}` throws in module strict mode and kills the whole bundle.
 *
 * Usage: node home/build-home.mjs > .tmp/home/build.log 2>&1
 */
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const SRC = path.resolve(HERE, '../../04-design/.tmp/prototypes/home')
const TMP = path.resolve(HERE, '../.tmp/home')

const { map } = JSON.parse(fs.readFileSync(path.join(TMP, 'media-map.json'), 'utf8'))
const meta = JSON.parse(fs.readFileSync(path.join(TMP, 'meta.json'), 'utf8'))
const url = (p) => {
  if (!map[p]?.url) throw new Error(`not uploaded: ${p} (run upload-media-home.mjs)`)
  return map[p].url
}
const resolveTokens = (s) => s.replace(/__WZM__\[([^\]]+)\]__/g, (m, enc) => url(decodeURIComponent(enc)))

const html = resolveTokens(fs.readFileSync(path.join(TMP, 'page.html'), 'utf8'))
if (/__WZM__/.test(html)) throw new Error('unresolved token in page.html')

const faces = fs.readFileSync(path.join(SRC, 'fonts/fonts.css'), 'utf8').replace(/url\('([^')]+)'\)/g, (m, f) => `url('${url('fonts/' + f)}')`)
const siteCss = `/* src/styles/site.css — built by home/build-home.mjs from the prototype's fonts.css + home.css. Edit the prototype, not this. */\n${faces}\n${fs.readFileSync(path.join(SRC, 'home.css'), 'utf8')}`

const wrap = (file) => {
  const code = fs.readFileSync(path.join(SRC, 'vendor', file), 'utf8')
  return `/* ${file} */\n(function () {\n  var shim = {};\n  (function (exports, module, define, self, globalThis) {\n${code}\n  }).call(shim, undefined, undefined, undefined, shim, shim);\n  var out = shim.window || shim;\n  for (var k in out) window[k] = out[k];\n})();\n`
}
const vendors = ['gsap.min.js', 'ScrollTrigger.min.js', 'ScrollSmoother.min.js', 'SplitText.min.js']
const guard = `if (!(window.gsap && window.ScrollTrigger && window.ScrollSmoother && window.SplitText)) console.error('site.js: a GSAP file did not reach window', typeof window.gsap, typeof window.ScrollTrigger, typeof window.ScrollSmoother, typeof window.SplitText);\n`
const siteJs = `/* src/scripts/site.js — built by home/build-home.mjs: GSAP 3.15 (wrapped, see the header there) + the prototype's home.js. */\n${vendors.map(wrap).join('')}${guard}${fs.readFileSync(path.join(SRC, 'home.js'), 'utf8')}`

const input = { css: '', pages: [{ slug: meta.slug, title: meta.title, seoTitle: meta.title, seoDescription: meta.description, html }] }
fs.writeFileSync(path.join(TMP, 'site.css'), siteCss)
fs.writeFileSync(path.join(TMP, 'site.js'), siteJs)
const gz = zlib.gzipSync(Buffer.from(JSON.stringify(input)), { level: 9 })
fs.writeFileSync(path.join(TMP, 'import-input.json.gz'), gz)
fs.writeFileSync(path.join(TMP, 'import-input.b64'), gz.toString('base64'))
console.log(`page       ${(html.length / 1024).toFixed(0)} KB html, ${(gz.length / 1024).toFixed(1)} KB gzipped`)
console.log(`site.css   ${(siteCss.length / 1024).toFixed(0)} KB`)
console.log(`site.js    ${(siteJs.length / 1024).toFixed(0)} KB`)
