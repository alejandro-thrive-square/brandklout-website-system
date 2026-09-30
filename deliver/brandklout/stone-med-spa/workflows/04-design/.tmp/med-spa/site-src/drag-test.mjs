// THE DRAG RAILS' ARROWS. Clicks next, then prev, on every rail on the site and
// asserts the rail's scrollLeft actually moved and came back.
//
// WHY THIS EXISTS. The arrows were bound by walking UP from the rail to
// `[data-drag-scope]`, but that attribute sat on the section's head, which is a
// SIBLING of the rail. Nothing was ever bound, on any page, from the second
// build (2026-09-03) until a client reported it on 2026-09-17. Every gate was
// green throughout: audit reads markup, all-pages checks overflow and console,
// probe captures scroll stops, compare-live diffs computed styles. NONE of them
// clicks anything. A control that does nothing is invisible to all of them.
//
// Usage: node drag-test.mjs [../final-site]
import puppeteer from 'puppeteer-core'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), process.argv[2] || '../final-site')
if (!fs.existsSync(path.join(ROOT, 'index.html'))) { console.error('no index.html under ' + ROOT); process.exit(1) }
const MIME = { '.html':'text/html','.css':'text/css','.js':'text/javascript','.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2','.png':'image/png','.jpg':'image/jpeg' }
const server = http.createServer((req,res)=>{ let p=decodeURIComponent(req.url.split('?')[0]); if(p==='/')p='/index.html'; const f=path.join(ROOT,p); if(!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.writeHead(404);return res.end('nf')} res.writeHead(200,{'Content-Type':MIME[path.extname(f).toLowerCase()]||'application/octet-stream'}); fs.createReadStream(f).pipe(res) })
await new Promise(r=>server.listen(0,r))
const PORT = server.address().port
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] })
let fails = []
// ONE RAIL LEFT. The home and /results review rails became the Elfsight widget on
// 2026-09-30 (its arrows are the vendor's, inside its own markup); /about's rooms
// are the last rail this site drags.
for (const [page_, sel] of [['about.html','.room_rail']]) {
  const pg = await browser.newPage()
  await pg.setViewport({ width: 1440, height: 900 })
  await pg.goto(`http://127.0.0.1:${PORT}/${page_}`, { waitUntil:'networkidle0', timeout:60000 })
  await pg.evaluate(() => { document.documentElement.style.scrollBehavior='auto' })
  const res = await pg.evaluate(async (sel) => {
    const rail = document.querySelector(sel)
    if (!rail) return { error: 'no rail' }
    rail.scrollIntoView({ block:'center' })
    const scope = rail.closest('[data-drag-scope]') || document
    const next = scope.querySelector('[data-drag-next]'), prev = scope.querySelector('[data-drag-prev]')
    if (!next || !prev) return { error: 'no arrows' }
    const start = rail.scrollLeft
    next.click(); await new Promise(r=>setTimeout(r,900))
    const after = rail.scrollLeft
    prev.click(); await new Promise(r=>setTimeout(r,900))
    const back = rail.scrollLeft
    return { start, after, back, max: rail.scrollWidth - rail.clientWidth }
  }, sel)
  const ok = !res.error && res.after > res.start && res.back < res.after
  console.log(`${page_.padEnd(14)} ${sel.padEnd(12)} ${ok ? 'PASS' : 'FAIL'}  ${JSON.stringify(res)}`)
  if (!ok) fails.push(page_)
  await pg.close()
}
await browser.close(); server.close()
console.log(fails.length ? `FAIL ${fails.join(', ')}` : 'all arrows move their rail')
process.exitCode = fails.length ? 1 : 0
