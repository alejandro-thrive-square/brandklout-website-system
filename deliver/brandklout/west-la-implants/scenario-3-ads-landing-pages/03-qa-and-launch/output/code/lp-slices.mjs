#!/usr/bin/env node
/**
 * Viewport slices of an ads page, local dist or published, for the visual pass
 * (03-qa-and-launch.md step 8). A full-page capture resizes the viewport to the
 * whole document and lies about anything scroll-driven (21-instatic-upload.md
 * trap 33), so this scrolls a real viewport and saves one PNG per screen.
 *
 * Reduced motion is ON by default so every reveal is in its finished state;
 * --motion walks with motion on (pins, scrubs) instead.
 *
 * Usage: node lp-slices.mjs <slug> [width=1440] [--base=https://host] [--motion] [--out=dir]
 *        slug is dist-relative without .html, e.g. ads-landing-pages/all-on-6
 */
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import http from 'node:http'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '../../../..') // deliver/brandklout/west-la-implants
const REPO = path.resolve(ROOT, '../../..')
const puppeteer = createRequire(process.env.PUPPETEER_DIR || path.join(REPO, 'node_modules') + path.sep)('puppeteer-core')
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const DIST = path.join(ROOT, 'workflows/04-design/.tmp/site-src/dist')

const args = process.argv.slice(2)
const flag = (n) => (args.find((a) => a.startsWith(`--${n}=`)) || '').slice(n.length + 3)
const [slug, w = '1440'] = args.filter((a) => !a.startsWith('--'))
const width = Number(w), height = width < 700 ? 844 : 900
const base = flag('base').replace(/\/$/, '')
const motion = args.includes('--motion')
const out = flag('out') || path.join(HERE, '..', 'assets', 'slices', `${slug.replace(/\//g, '__')}-${width}${base ? '-live' : ''}${motion ? '-motion' : ''}`)
if (!slug) { console.error('usage: node lp-slices.mjs <slug> [width] [--base=url] [--motion] [--out=dir]'); process.exit(2) }

const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.mp4': 'video/mp4', '.woff2': 'font/woff2' }
const server = http.createServer((req, res) => {
  const f = path.join(DIST, decodeURIComponent(req.url.split('?')[0]))
  if (!f.startsWith(DIST) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return }
  res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' })
  fs.createReadStream(f).pipe(res)
})
await new Promise((r) => server.listen(0, '127.0.0.1', r))
const url = base ? `${base}/${slug}` : `http://127.0.0.1:${server.address().port}/${slug}.html`
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

fs.rmSync(out, { recursive: true, force: true })
fs.mkdirSync(out, { recursive: true })
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--disable-gpu', '--autoplay-policy=no-user-gesture-required'] })
const page = await browser.newPage()
if (!motion) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
if (base) { await page.setRequestInterception(true); page.on('request', (r) => (/sienna-accessibility/.test(r.url()) ? r.abort() : r.continue())) }
await page.setViewport({ width, height })
await page.goto(url, { waitUntil: 'networkidle0', timeout: 90000 })
await sleep(2500)
const total = await page.evaluate(() => Math.max(document.documentElement.scrollHeight, document.body.scrollHeight, (document.getElementById('smooth-content') || document.body).scrollHeight))
const step = Math.round(height * 0.9)
let n = 0
for (let y = 0; y < total; y += step) {
  await page.evaluate((y) => { if (window.WZ && WZ.smoother) WZ.smoother.scrollTo(y, false); else window.scrollTo(0, y) }, y)
  await sleep(motion ? 1100 : 450)
  await page.screenshot({ path: path.join(out, String(n++).padStart(2, '0') + '.png') })
}
await browser.close(); server.close()
console.log(`${n} slices of ${slug} @${width} -> ${out}`)
