/**
 * Step 2 — resolve every __WZM__[path]__ token prepare-wp.mjs left against the media map, and
 * assemble what ship.sh and push-wp.mjs send.
 *
 *   in:  .tmp/wp/{pages.json, pages/*.html, site.css, scripts.json}, .tmp/media-map-wp.json
 *   out: .tmp/site.css                 the code asset src/styles/site.css
 *        .tmp/site.js                  the code asset src/scripts/site.js (dictionary + runtime.js)
 *        .tmp/import-input.json.gz     { css: '', pages: [{slug, title, seoTitle, seoDescription, html}] }
 *        .tmp/import-input.b64         the same, base64, for ship.sh
 *
 * `css` is EMPTY on purpose: nothing goes through the style registry (see prepare-wp.mjs). The
 * importer still auto-creates a bare class for every class name, which is what lets an editor
 * select and restyle an element in the Styles panel later.
 *
 * A token with no uploaded file (a type the library refuses, e.g. a PDF) falls back to the file
 * on the live WordPress site and is listed; a missing video or poster is an error.
 *
 * Usage: node build-wp.mjs > .tmp/build.log 2>&1
 */
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const TMP = path.join(HERE, '.tmp')
const WP = path.join(TMP, 'wp')
const ORIGIN = 'https://www.ifadentistry.com'

const { map } = JSON.parse(fs.readFileSync(path.join(TMP, 'media-map-wp.json'), 'utf8'))
const fallback = new Set()
const resolveTokens = (s) =>
  s.replace(/__WZM__\[([^\]]+)\]__/g, (m, enc) => {
    const p = decodeURIComponent(enc)
    const hit = map[p]
    if (hit?.url) return hit.url
    if (p.startsWith('/__vimeo__/')) throw new Error(`video or poster not uploaded: ${p}`)
    fallback.add(p)
    return ORIGIN + p.split('/').map(encodeURIComponent).join('/')
  })

const pages = JSON.parse(fs.readFileSync(path.join(WP, 'pages.json'), 'utf8'))
const input = { css: '', pages: [] }
for (const p of pages) {
  const html = resolveTokens(fs.readFileSync(path.join(WP, p.file), 'utf8'))
  if (/__WZM__/.test(html)) throw new Error(`${p.slug}: unresolved token`)
  input.pages.push({ slug: p.slug, title: p.title || p.slug, seoTitle: p.title, seoDescription: p.description, html })
}

// light-page-header.css: the header bar on pages whose first section is white (2026-09-28).
const siteCss = resolveTokens(fs.readFileSync(path.join(WP, 'site.css'), 'utf8')) + '\n\n' +
  fs.readFileSync(path.join(HERE, 'light-page-header.css'), 'utf8').replace(/\r\n/g, '\n').trim() + '\n'
const { dict } = JSON.parse(fs.readFileSync(path.join(WP, 'scripts.json'), 'utf8'))
const dictJson = resolveTokens(JSON.stringify(dict))
  // U+2028/2029 are legal in JSON and were line terminators in older JS parsers.
  .replace(/\u2028/g, '\\u2028')
  .replace(/\u2029/g, '\\u2029')
const runtime = fs.readFileSync(path.join(HERE, 'runtime.js'), 'utf8')
const siteJs = `/* src/scripts/site.js — built by build-wp.mjs from runtime.js + the WordPress scripts. */\n(function () {\nvar D = ${dictJson};\n${runtime}\n})();\n`

fs.writeFileSync(path.join(TMP, 'site.css'), siteCss)
fs.writeFileSync(path.join(TMP, 'site.js'), siteJs)
const gz = zlib.gzipSync(Buffer.from(JSON.stringify(input)), { level: 9 })
fs.writeFileSync(path.join(TMP, 'import-input.json.gz'), gz)
fs.writeFileSync(path.join(TMP, 'import-input.b64'), gz.toString('base64'))

console.log(`pages      ${input.pages.length}, ${(JSON.stringify(input).length / 1048576).toFixed(1)} MB html, ${(gz.length / 1024).toFixed(0)} KB gzipped`)
console.log(`site.css   ${(siteCss.length / 1024).toFixed(0)} KB`)
console.log(`site.js    ${(siteJs.length / 1024).toFixed(0)} KB`)
console.log(`fallback   ${fallback.size} file(s) left on the live site${fallback.size ? ':\n  ' + [...fallback].join('\n  ') : ''}`)
