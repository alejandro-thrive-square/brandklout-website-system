/* "The heading is not right on the published version": the home hero h1 (and the prequal h2),
   live with the site-wide widget, live with it blocked, and the local class-site build. */
import puppeteer from 'puppeteer-core'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
const ROOT = path.resolve('site/class-site')
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' }
const server = http.createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html'; const f = path.join(ROOT, p); if (!fs.existsSync(f)) { s.writeHead(404); return s.end() } s.writeHead(200, { 'content-type': types[path.extname(f)] ?? 'application/octet-stream' }); fs.createReadStream(f).pipe(s) }).listen(8765)
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' })
const out = []
for (const [label, url, block] of [['live+widget', 'https://brandklout-production.up.railway.app/', false], ['live-nowidget', 'https://brandklout-production.up.railway.app/', true], ['local', 'http://localhost:8765/index.html', false]]) {
  for (const width of [1440, 390]) {
    const page = await browser.newPage()
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36')
    await page.setViewport({ width, height: 900 })
    await page.setRequestInterception(true)
    page.on('request', (r) => (block && /sienna|jsdelivr/.test(r.url()) ? r.abort() : r.continue()))
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 })
    await new Promise((r) => setTimeout(r, 3000))
    const info = await page.evaluate(() => {
      const pick = (el) => {
        if (!el) return null
        const cs = getComputedStyle(el), r = el.getBoundingClientRect()
        return { cls: el.className, inline: el.getAttribute('style'), asw: el.getAttribute('data-asw-org-font-size'), fontSize: cs.fontSize, lineHeight: cs.lineHeight, letterSpacing: cs.letterSpacing, weight: cs.fontWeight, family: cs.fontFamily.slice(0, 40), w: Math.round(r.width), h: Math.round(r.height),
          spans: [...el.querySelectorAll('span')].map((s) => ({ cls: s.className, inline: s.getAttribute('style'), fontSize: getComputedStyle(s).fontSize, color: getComputedStyle(s).color, bgClip: getComputedStyle(s).webkitBackgroundClip || getComputedStyle(s).backgroundClip, bgImage: getComputedStyle(s).backgroundImage.slice(0, 60) })) }
      }
      return { h1: pick(document.querySelector('h1')), prequalH2: pick(document.querySelector('#market-prequalification h2')), inlineFontEls: document.querySelectorAll('[data-asw-org-font-size]').length }
    })
    const r = await page.evaluate(() => { const h = document.querySelector('h1').closest('section').getBoundingClientRect(); return { x: 0, y: h.top + scrollY, width: innerWidth, height: Math.min(h.height, 900) } })
    await page.screenshot({ path: `heading-${label}-${width}.png`, clip: r })
    out.push({ label, width, ...info })
    await page.close()
  }
}
await browser.close(); server.close()
fs.writeFileSync('heading-check.json', JSON.stringify(out, null, 1))
