/**
 * Screen-by-screen screenshots of a page, so a full-page PNG can actually be
 * LOOKED at rather than only measured.
 *
 * WHY THIS EXISTS. `shot.mjs` produces one PNG of the whole page. At 1440 the
 * neck lift page is 9,400px tall and the home page is 15,000px; opened at any
 * size that fits on a monitor, a defect the height of a line of type is two
 * pixels. Every layout bug found on this build so far was found by looking at
 * a screenshot at 1:1, and the assertion suites did not catch any of them
 * (see HANDOFF.md, "the widths I had only TESTED, never looked at").
 *
 * So this cuts the page into viewport-sized slices at 1:1 and writes them
 * numbered. Reduced motion is forced, exactly as in shot.mjs: the still state
 * is what has to be correct, and a half-played reveal in a screenshot is not a
 * finding, it is a race.
 *
 * The page is scrolled all the way down and back before the first slice, so
 * every lazy image has loaded and every IntersectionObserver reveal has fired.
 * Without that pass the lower slices are pictures of empty boxes.
 *
 * SLICES OVERLAP BY THE HEIGHT OF THE NAVBAR, and that is not a nicety. The bar
 * is fixed, so it covers the top ~90px of every slice after the first. Stepping
 * by exactly the viewport height means a band of the page that is that tall is
 * never visible in any slice, and the first run of this script duly reported the
 * ledger as an empty row of four boxes: it was not empty, it was behind the
 * navbar in slice 01 and above the fold in slice 00.
 *
 * Usage:
 *   node slices.mjs <root> <page.html> <outdir> [width] [height]
 */
import puppeteer from 'puppeteer-core'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'

const root = process.argv[2]
const page = process.argv[3] || 'index.html'
const outdir = process.argv[4]
const width = Number(process.argv[5] || 1440)
const height = Number(process.argv[6] || 900)

const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.avif': 'image/avif', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' }
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0])
  if (p === '/') p = '/index.html'
  const f = path.join(root, p)
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('nf') }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream' })
  fs.createReadStream(f).pipe(res)
})
await new Promise((r) => srv.listen(8801, r))

fs.mkdirSync(outdir, { recursive: true })
const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--hide-scrollbars'],
})
const pg = await browser.newPage()
await pg.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
await pg.setViewport({ width, height, deviceScaleFactor: 1 })
await pg.goto(`http://127.0.0.1:8801/${page}`, { waitUntil: 'networkidle0', timeout: 60000 })

// Wake every lazy image and every reveal, then return to the top.
await pg.evaluate(async () => {
  await new Promise((r) => {
    let y = 0
    const t = setInterval(() => {
      window.scrollBy(0, 500)
      y += 500
      if (y > document.body.scrollHeight) { clearInterval(t); r() }
    }, 30)
  })
  window.scrollTo(0, 0)
})
await new Promise((r) => setTimeout(r, 1200))

const total = await pg.evaluate(() => document.documentElement.scrollHeight)
// The fixed bar's own height, measured rather than assumed.
const overlap = await pg.evaluate(() => {
  const nav = document.querySelector('.navbar_component')
  return nav ? Math.ceil(nav.getBoundingClientRect().height) + 8 : 0
})
const step = height - overlap
const n = Math.max(1, Math.ceil((total - height) / step) + 1)
const stem = page.replace(/\.html$/, '')
for (let i = 0; i < n; i++) {
  const y = Math.max(0, Math.min(i * step, total - height))
  await pg.evaluate((v) => window.scrollTo(0, v), y)
  await new Promise((r) => setTimeout(r, 350))
  const file = path.join(outdir, `${stem}-${width}-${String(i).padStart(2, '0')}.png`)
  await pg.screenshot({ path: file })
}
console.log(`${stem} ${width}x${height}: ${total}px, ${n} slices, ${overlap}px overlap -> ${outdir}`)
await browser.close()
srv.close()
