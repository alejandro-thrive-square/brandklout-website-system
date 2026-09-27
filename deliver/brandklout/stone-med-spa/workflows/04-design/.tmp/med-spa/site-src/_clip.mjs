/* Clip specific elements from the built site. Scratch tool, not a gate.
   Screenshots the VIEWPORT and crops from getBoundingClientRect, because a
   puppeteer `clip` is in page coordinates and a position:fixed navbar on a
   scrolled page is not where the page thinks it is. */
import puppeteer from 'puppeteer-core'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'

const root = process.argv[2]
const out = process.argv[3]
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.json': 'application/json' }
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0])
  if (p === '/') p = '/index.html'
  const f = path.join(root, p)
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('nf') }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream' })
  fs.createReadStream(f).pipe(res)
})
await new Promise(r => srv.listen(0, r))
const PORT = srv.address().port
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox', '--hide-scrollbars'] })
const SCALE = 2

async function shot(page, width, file, sel, prep, pad = 0) {
  const pg = await browser.newPage()
  await pg.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
  await pg.setViewport({ width, height: 900, deviceScaleFactor: SCALE })
  await pg.goto(`http://127.0.0.1:${PORT}/${page}`, { waitUntil: 'networkidle0', timeout: 60000 })
  await pg.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto' })
  if (prep) await prep(pg)
  await new Promise(r => setTimeout(r, 1000))
  const buf = await pg.screenshot({ encoding: 'binary' })
  const r = await pg.evaluate((s) => { const b = document.querySelector(s).getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height } }, sel)
  fs.writeFileSync(path.join(out, file), buf)
  fs.appendFileSync(path.join(out, 'rects.json'), JSON.stringify({ file, ...r, scale: SCALE }) + '\n')
  console.log(file, JSON.stringify(r))
  await pg.close()
}

fs.rmSync(path.join(out, 'rects.json'), { force: true })
const scrollTo = y => async pg => { await pg.evaluate(v => window.scrollTo(0, v), y); await new Promise(r => setTimeout(r, 800)) }

await shot('index.html', 1440, 'nav-photo.png', '.navbar_component', null)
await shot('index.html', 1440, 'nav-solid.png', '.navbar_component', scrollTo(1400))
await shot('privacy-policy.html', 1440, 'nav-solid-legal.png', '.navbar_component', scrollTo(900))
await shot('index.html', 1440, 'foot-brand.png', '.footer_brand', async pg => {
  await pg.evaluate(() => document.querySelector('.footer_brand').scrollIntoView({ block: 'center' }))
  await new Promise(r => setTimeout(r, 800))
})
await shot('index.html', 390, 'drawer.png', '.drawer_panel', async pg => {
  await pg.evaluate(() => document.querySelector('.navbar_burger').click())
  await new Promise(r => setTimeout(r, 900))
})
await shot('index.html', 390, 'nav-390.png', '.navbar_component', null)
await shot('index.html', 390, 'nav-390-solid.png', '.navbar_component', scrollTo(900))
await shot('index.html', 1024, 'nav-1024.png', '.navbar_component', scrollTo(900))
await shot('index.html', 1280, 'nav-1280.png', '.navbar_component', scrollTo(900))
await shot('index.html', 1200, 'nav-1200.png', '.navbar_component', scrollTo(900))
await shot('index.html', 992, 'nav-992.png', '.navbar_component', scrollTo(900))

await browser.close()
srv.close()
