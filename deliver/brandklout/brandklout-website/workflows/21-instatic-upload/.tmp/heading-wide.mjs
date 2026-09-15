/* The hero heading on wide screens: Sang's v16 package as he sent it vs the live site. */
import puppeteer from 'puppeteer-core'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
const ROOT = path.resolve('../../00-client-delivery-initialization/.tmp/client-handoff/package-v16')
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' }
const server = http.createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html'; const f = path.join(ROOT, p); if (!fs.existsSync(f)) { s.writeHead(404); return s.end() } s.writeHead(200, { 'content-type': types[path.extname(f)] ?? 'application/octet-stream' }); fs.createReadStream(f).pipe(s) }).listen(8766)
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' })
const out = []
for (const [label, url] of [['sang', 'http://localhost:8766/index.html'], ['live', 'https://brandklout-production.up.railway.app/']]) {
  for (const width of [1280, 1536, 1920, 2560]) {
    const page = await browser.newPage()
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36')
    await page.setViewport({ width, height: 1000 })
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 })
    await new Promise((r) => setTimeout(r, 2500))
    const i = await page.evaluate(() => { const h = document.querySelector('h1'), cs = getComputedStyle(h), r = h.getBoundingClientRect(); const lines = Math.round(r.height / parseFloat(cs.lineHeight)); return { fs: cs.fontSize, lh: cs.lineHeight, w: Math.round(r.width), h: Math.round(r.height), lines, root: getComputedStyle(document.documentElement).fontSize, inline: h.getAttribute('style') } })
    await page.screenshot({ path: `hw-${label}-${width}.png`, clip: { x: 0, y: 0, width, height: 1000 } })
    out.push({ label, width, ...i })
    await page.close()
  }
}
await browser.close(); server.close()
for (const o of out) console.log(o.label.padEnd(5), String(o.width).padEnd(5), 'root', o.root, '| h1', o.fs, 'lh', o.lh, o.w + 'x' + o.h, o.lines, 'lines', o.inline ?? '')
