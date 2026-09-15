/* agency/widget-fluid.js, locally, with the real sienna widget injected the way the plugin loads it.
   Opens at 1440, then resizes to 390 and 1920: the headings must follow (scale 1), and at a widget
   text scale of 1.2 they must be 1.2x the stylesheet's size at every width. */
import puppeteer from 'puppeteer-core'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'site/class-site')
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' }
const server = http
  .createServer((q, s) => {
    let p = decodeURIComponent(q.url.split('?')[0])
    if (p === '/') p = '/index.html'
    const f = path.join(ROOT, p)
    if (!fs.existsSync(f)) {
      s.writeHead(404)
      return s.end()
    }
    s.writeHead(200, { 'content-type': types[path.extname(f)] ?? 'application/octet-stream' })
    fs.createReadStream(f).pipe(s)
  })
  .listen(8768)
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' })
const m = (page) =>
  page.evaluate(() => {
    const h = document.querySelector('h1')
    return {
      h1: getComputedStyle(h).fontSize,
      h1Inline: h.style.fontSize || '-',
      aswEls: document.querySelectorAll('[data-asw-org-font-size]').length,
      inlineSized: [...document.querySelectorAll('[data-asw-org-font-size]')].filter((e) => e.style.fontSize).length,
      widget: !!document.querySelector('.asw-menu-btn, .asw-widget'),
    }
  })
for (const s of [null, 1.2]) {
  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900 })
  await page.goto('http://localhost:8768/index.html', { waitUntil: 'networkidle2' })
  if (s) {
    await page.evaluate((v) => localStorage.setItem('asw-user-settings', JSON.stringify({ states: { fontSize: v } })), s)
    await page.reload({ waitUntil: 'networkidle2' })
  }
  await page.addScriptTag({ url: 'https://cdn.jsdelivr.net/npm/sienna-accessibility/dist/sienna-accessibility.umd.js' })
  await new Promise((r) => setTimeout(r, 3000))
  const out = { 1440: await m(page) }
  for (const w of [390, 1920]) {
    await page.setViewport({ width: w, height: 900 })
    await new Promise((r) => setTimeout(r, 1500))
    out[w] = await m(page)
  }
  console.log(`scale ${s ?? 1}: ${JSON.stringify(out)}`)
  await page.close()
}
await browser.close()
server.close()
