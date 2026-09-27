/* Screenshot every slide of the home hero slider: node .tmp/slider-shot.mjs <siteDir> <outDir> <width> [baseUrl] */
import fs from 'node:fs'
import path from 'node:path'
import http from 'node:http'
import puppeteer from 'puppeteer-core'

const [siteDir, outDir, width, remote] = process.argv.slice(2)
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' }
let server
let base = remote
if (!remote) {
  server = http.createServer((req, res) => {
    let f = path.join(siteDir, decodeURIComponent(req.url.split('?')[0]))
    if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html')
    if (!fs.existsSync(f)) { res.writeHead(404); return res.end() }
    res.writeHead(200, { 'content-type': MIME[path.extname(f)] ?? 'application/octet-stream' })
    res.end(fs.readFileSync(f))
  })
  await new Promise((r) => server.listen(0, r))
  base = `http://localhost:${server.address().port}/index.html`
}
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox', '--hide-scrollbars'] })
const tab = await browser.newPage()
await tab.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
await tab.setViewport({ width: Number(width), height: 1000 })
await tab.goto(base, { waitUntil: 'networkidle0', timeout: 90000 })
await tab.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, 0) })
fs.mkdirSync(outDir, { recursive: true })
const n = await tab.evaluate(() => document.querySelector('[data-slider-track]').children.length)
const dots = await tab.evaluate(() => document.querySelectorAll('[data-slider-dots] button').length)
console.log(`slides ${n}, dots ${dots}`)
for (let i = 0; i < n; i++) {
  await tab.evaluate((i) => {
    const t = document.querySelector('[data-slider-track]')
    document.querySelector('[data-slider-dots]').children[i].click()
    // headless does not paint an overflow container's scroll in a clip screenshot: show slide i alone
    t.style.display = 'block'
    ;[...t.children].forEach((c, n) => { c.style.display = n === i ? 'flex' : 'none' })
  }, i)
  await new Promise((r) => setTimeout(r, 500))
  const card = await tab.evaluateHandle(() => document.querySelector('[data-slider]').closest('[data-animate]') ?? document.querySelector('[data-slider]'))
  const file = path.join(outDir, `slide-${width}-${i + 1}.png`)
  const box = await card.asElement().boundingBox(); await tab.screenshot({ path: file, clip: box })
  console.log(file)
}
await browser.close()
server?.close()
