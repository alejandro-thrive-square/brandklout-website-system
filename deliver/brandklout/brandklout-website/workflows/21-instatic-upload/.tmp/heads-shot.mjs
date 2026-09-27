/* Seq 24 "the heading is wrong again": the restored headlines, live vs Sang's package-v16. */
import puppeteer from 'puppeteer-core'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
const ROOT = path.resolve('../../00-client-delivery-initialization/.tmp/client-handoff/package-v16')
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' }
const server = http.createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html'; const f = path.join(ROOT, p); if (!fs.existsSync(f)) { s.writeHead(404); return s.end() } s.writeHead(200, { 'content-type': types[path.extname(f)] ?? 'application/octet-stream' }); fs.createReadStream(f).pipe(s) }).listen(8767)
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' })
const out = []
const targets = [['why', '/', 'index.html', '#why-brandklout'], ['guar', '/guarantee', 'guarantee.html', 'h1']]
for (const [name, route, file, sel] of targets) for (const [label, url] of [['sang', `http://localhost:8767/${file}`], ['live', 'https://brandklout-production.up.railway.app' + route]]) for (const width of [1440, 1920, 390]) {
  const page = await browser.newPage()
  await page.setViewport({ width, height: 900 })
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 })
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto' })
  await page.evaluate((s) => document.querySelector(s)?.scrollIntoView(), sel)
  await new Promise((r) => setTimeout(r, 2500))
  const info = await page.evaluate((s) => {
    const root = document.querySelector(s); const h = root.matches('h1,h2') ? root : root.querySelector('h2')
    const cs = getComputedStyle(h), r = h.getBoundingClientRect()
    const sec = (root.closest('section') ?? root).getBoundingClientRect()
    return { text: h.textContent.replace(/\s+/g, ' ').trim(), fs: cs.fontSize, lh: cs.lineHeight, w: Math.round(r.width), h: Math.round(r.height), lines: Math.round(r.height / parseFloat(cs.lineHeight)), overflow: h.scrollWidth > h.clientWidth + 1, clip: { x: 0, y: sec.top + scrollY, width: innerWidth, height: Math.min(sec.height, 1100) } }
  }, sel)
  await page.screenshot({ path: `hs-${name}-${label}-${width}.png`, clip: info.clip })
  delete info.clip
  out.push({ name, label, width, ...info })
  await page.close()
}
await browser.close(); server.close()
for (const o of out) console.log(o.name.padEnd(5), o.label.padEnd(5), String(o.width).padEnd(5), o.fs, o.w + 'x' + o.h, o.lines + ' lines', o.overflow ? 'OVERFLOW' : '', '|', o.text.slice(0, 70))
