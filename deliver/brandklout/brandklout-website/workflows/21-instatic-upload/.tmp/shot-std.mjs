/* Eyeball the standard breakpoints + type: the first screen of a page, Sang's file vs the class site,
   at a few widths. PNGs go to argv[2] (a folder). */
import fs from 'node:fs'
import path from 'node:path'
import http from 'node:http'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'
const HERE = path.dirname(fileURLToPath(import.meta.url))
const SITE = path.join(HERE, 'site')
const OUT = process.argv[2]
const page = process.argv[3] || 'index.html'
const widths = (process.argv[4] || '1920,1024,768,390').split(',').map(Number)
fs.mkdirSync(OUT, { recursive: true })
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' }
const serve = (root) => new Promise((r) => {
  const s = http.createServer((req, res) => {
    let f = path.join(root, decodeURIComponent(req.url.split('?')[0]))
    if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html')
    if (!fs.existsSync(f)) { res.writeHead(404); return res.end() }
    res.writeHead(200, { 'content-type': MIME[path.extname(f)] ?? 'application/octet-stream' })
    res.end(fs.readFileSync(f))
  })
  s.listen(0, () => r(s))
})
const A = await serve(path.join(SITE, 'final-site'))
const B = await serve(path.join(SITE, 'class-site'))
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--hide-scrollbars'] })
for (const w of widths) {
  for (const [label, s] of [['sang', A], ['std', B]]) {
    const tab = await browser.newPage()
    await tab.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
    await tab.setViewport({ width: w, height: w < 800 ? 1400 : 1000 })
    await tab.goto(`http://localhost:${s.address().port}/${page}`, { waitUntil: 'networkidle0', timeout: 120000 })
    await new Promise((r) => setTimeout(r, 800))
    await tab.screenshot({ path: path.join(OUT, `${page.replace(/\.html$/, '')}-${w}-${label}.png`) })
    await tab.close()
  }
}
await browser.close()
A.close()
B.close()
console.log('done')
