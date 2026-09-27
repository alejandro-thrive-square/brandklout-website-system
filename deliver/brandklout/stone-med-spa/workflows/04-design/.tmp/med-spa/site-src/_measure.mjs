/* What width can the navbar logo actually be, at every width the bar changes
   shape? Prints the spare room in the navbar row with the logo set to zero, so
   the answer is read off the bar rather than guessed. */
import puppeteer from 'puppeteer-core'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'

const root = process.argv[2]
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.woff2': 'font/woff2', '.json': 'application/json', '.svg': 'image/svg+xml' }
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

const widths = []
for (let w = 320; w <= 991; w += 8) widths.push(w)
for (const w of widths) {
  const pg = await browser.newPage()
  await pg.setViewport({ width: w, height: 900, deviceScaleFactor: 1 })
  await pg.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'networkidle0', timeout: 60000 })
  const clipped = await pg.evaluate(() => {
    const vw = document.documentElement.clientWidth
    return [...document.querySelectorAll('.navbar_component a, .navbar_component button')]
      .filter(e => getComputedStyle(e).display !== 'none')
      .filter(e => e.getBoundingClientRect().right > vw + 0.5)
      .map(e => e.textContent.trim().slice(0, 24) + ' by ' + Math.round(e.getBoundingClientRect().right - vw))
  })
  const r = await pg.evaluate(() => {
    const row = document.querySelector('.navbar_container')
    const logo = document.querySelector('.navbar_logo-link')
    const cs = getComputedStyle(row)
    const gap = parseFloat(cs.columnGap) || 0
    // everything in the row except the logo, plus the gaps between them
    const kids = [...row.children].filter(k => k !== logo && getComputedStyle(k).display !== 'none')
    const others = kids.reduce((n, k) => n + k.getBoundingClientRect().width, 0)
    const gaps = gap * ([...row.children].filter(k => getComputedStyle(k).display !== 'none').length - 1)
    const inner = row.getBoundingClientRect().width
    return { inner: Math.round(inner), logo: Math.round(logo.getBoundingClientRect().width), others: Math.round(others), gaps: Math.round(gaps), room: Math.round(inner - others - gaps) }
  })
  const rem = await pg.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize))
  console.log(
    `${String(w).padStart(4)}  logo ${String(r.logo).padStart(4)}px   others ${String(r.others).padStart(4)}  gaps ${String(r.gaps).padStart(3)}` +
    `  ROOM FOR LOGO ${String(r.room).padStart(4)}px  (= ${(r.room / rem).toFixed(2)}rem at root ${rem.toFixed(2)}px)` +
    (clipped.length ? `  CLIPPED: ${clipped.join('; ')}` : '  ok')
  )
  await pg.close()
}
await browser.close()
srv.close()
