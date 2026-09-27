/* Measure the hero slider in both builds: node .tmp/slider-debug.mjs */
import fs from 'node:fs'
import path from 'node:path'
import http from 'node:http'
import puppeteer from 'puppeteer-core'

const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' }
const serve = (root) =>
  new Promise((r) => {
    const s = http.createServer((req, res) => {
      let f = path.join(root, decodeURIComponent(req.url.split('?')[0]))
      if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html')
      if (!fs.existsSync(f)) { res.writeHead(404); return res.end() }
      res.writeHead(200, { 'content-type': MIME[path.extname(f)] ?? 'application/octet-stream' })
      res.end(fs.readFileSync(f))
    })
    s.listen(0, () => r(s))
  })
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] })
for (const dir of ['final-site', 'class-site']) {
  const s = await serve(path.join('.tmp/site', dir))
  const tab = await browser.newPage()
  await tab.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
  await tab.setViewport({ width: 1440, height: 1000 })
  await tab.goto(`http://localhost:${s.address().port}/index.html`, { waitUntil: 'networkidle0' })
  const measure = () =>
    tab.evaluate(() => {
      const t = document.querySelector('[data-slider-track]')
      const cs = getComputedStyle(t)
      return {
        track: { class: t.className, clientWidth: t.clientWidth, scrollWidth: t.scrollWidth, scrollLeft: t.scrollLeft, display: cs.display, overflowX: cs.overflowX, snap: cs.scrollSnapType, position: cs.position, offsetParent: t.children[0].offsetParent?.className },
        slides: [...t.children].map((c) => { const x = getComputedStyle(c); return { class: c.className, w: Math.round(c.getBoundingClientRect().width), offsetLeft: c.offsetLeft, flex: `${x.flexGrow} ${x.flexShrink} ${x.flexBasis}`, minW: x.minWidth, snapAlign: x.scrollSnapAlign, inert: c.inert } }),
      }
    })
  console.log(`== ${dir} at rest`, JSON.stringify(await measure(), null, 0))
  await tab.evaluate(() => document.querySelector('[data-slider-dots]').children[1].click())
  await new Promise((r) => setTimeout(r, 800))
  console.log(`== ${dir} after dot 2`, JSON.stringify((await measure()).track))
  await tab.close()
  s.close()
}
await browser.close()
