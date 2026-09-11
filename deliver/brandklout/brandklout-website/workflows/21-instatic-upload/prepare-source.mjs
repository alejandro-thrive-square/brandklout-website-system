/**
 * Step 0 — turn Sang's single ChatGPT HTML file into the `final-site/` shape the rest of this
 * toolkit was written against (it came from Stone Med Spa, whose source was a multi-file build).
 *
 *   in:  ../00-client-delivery-initialization/.tmp/client-handoff/<the one .html>   (never edited)
 *   out: .tmp/site/final-site/index.html          the page, <style> -> assets/site.css link,
 *                                                  inline <script> -> assets/site.js
 *        .tmp/site/final-site/assets/site.css     the inline <style>, verbatim
 *        .tmp/site/final-site/assets/site.js      the inline <script>, verbatim
 *        .tmp/site/site-src/css/10-site.css       same CSS, where push-site.mjs harvests tokens
 *                                                  and lossy declarations from
 *        .tmp/site/site-src/seo.json              <title> + meta description of the page
 *
 * Nothing in the markup or copy is changed. Phase 1 publishes the page as Sang wrote it.
 *
 * Usage: node prepare-source.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const HANDOFF = path.resolve(HERE, '../00-client-delivery-initialization/.tmp/client-handoff')
const SITE = path.join(HERE, '.tmp', 'site')
const FINAL = path.join(SITE, 'final-site')

const sources = fs.readdirSync(HANDOFF).filter((n) => /\.html?$/i.test(n))
if (sources.length !== 1) {
  console.error(`REFUSING: expected exactly one .html in client-handoff, found ${sources.length}: ${sources.join(', ')}`)
  process.exit(1)
}
const html = fs.readFileSync(path.join(HANDOFF, sources[0]), 'utf8')

const styles = [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)]
// Inline scripts only: not the JSON-LD block, not anything with a src.
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
if (styles.length !== 1 || scripts.length !== 1) {
  console.error(`REFUSING: expected one <style> and one plain <script>, found ${styles.length} and ${scripts.length}. The source changed shape; read it before adapting this.`)
  process.exit(1)
}

const title = html.match(/<title>([\s\S]*?)<\/title>/)?.[1].trim()
const description = html.match(/<meta\s+name="description"\s+content="([^"]*)"/)?.[1]
if (!title || !description) {
  console.error('REFUSING: the source has no <title> or no meta description')
  process.exit(1)
}

const css = styles[0][1].replace(/^\n/, '')
const js = scripts[0][1].replace(/^\n/, '')
const page = html
  .replace(styles[0][0], '<link rel="stylesheet" href="assets/site.css">')
  .replace(scripts[0][0], '<script src="assets/site.js"></script>')

fs.mkdirSync(path.join(FINAL, 'assets'), { recursive: true })
fs.mkdirSync(path.join(SITE, 'site-src', 'css'), { recursive: true })
fs.writeFileSync(path.join(FINAL, 'index.html'), page)
fs.writeFileSync(path.join(FINAL, 'assets', 'site.css'), css)
fs.writeFileSync(path.join(FINAL, 'assets', 'site.js'), js)
fs.writeFileSync(path.join(SITE, 'site-src', 'css', '10-site.css'), css)
fs.writeFileSync(
  path.join(SITE, 'site-src', 'seo.json'),
  JSON.stringify({ pages: { index: { title, description } } }, null, 2) + '\n',
)

console.log(`source   ${sources[0]} (${(html.length / 1024).toFixed(1)}KB)`)
console.log(`css      ${(css.length / 1024).toFixed(1)}KB   js ${js.length}B`)
console.log(`seo      "${title}"`)
