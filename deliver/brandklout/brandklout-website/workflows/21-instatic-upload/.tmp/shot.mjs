/* Preview screenshots of prepared pages, one PNG per selector.
   node .tmp/shot.mjs <siteDir> <outDir> <page.html> <width> <selector> [selector…]
   Reduced motion is emulated, so reveals are settled and the slider does not autoplay. */
import fs from 'node:fs'
import path from 'node:path'
import http from 'node:http'
import puppeteer from 'puppeteer-core'

const [siteDir, outDir, page, width, ...selectors] = process.argv.slice(2)
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' }
const server = http.createServer((req, res) => {
  let f = path.join(siteDir, decodeURIComponent(req.url.split('?')[0]))
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html')
  if (!fs.existsSync(f)) { res.writeHead(404); return res.end() }
  res.writeHead(200, { 'content-type': MIME[path.extname(f)] ?? 'application/octet-stream' })
  res.end(fs.readFileSync(f))
})
await new Promise((r) => server.listen(0, r))
const port = server.address().port
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox', '--hide-scrollbars'] })
const tab = await browser.newPage()
await tab.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
await tab.setViewport({ width: Number(width), height: 1000 })
const errors = []
tab.on('pageerror', (e) => errors.push(String(e)))
tab.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
await tab.goto(`http://localhost:${port}/${page}`, { waitUntil: 'networkidle0', timeout: 60000 })
await tab.evaluate(async () => { document.documentElement.style.scrollBehavior = 'auto'; await document.fonts.ready })
fs.mkdirSync(outDir, { recursive: true })
for (const sel of selectors) {
  const el = await tab.$(sel)
  if (!el) { console.log('MISSING', sel); continue }
  await el.evaluate((e) => e.scrollIntoView({ block: 'start' }))
  await new Promise((r) => setTimeout(r, 400))
  const file = path.join(outDir, `${page.replace(/\W+/g, '_')}-${width}-${sel.replace(/\W+/g, '_')}.png`)
  await el.screenshot({ path: file })
  const box = await el.boundingBox()
  console.log(file, Math.round(box.width) + 'x' + Math.round(box.height))
}
if (errors.length) console.log('PAGE ERRORS:\n  ' + errors.join('\n  '))
await browser.close()
server.close()
