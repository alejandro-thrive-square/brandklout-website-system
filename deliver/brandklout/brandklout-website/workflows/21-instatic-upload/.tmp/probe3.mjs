import fs from 'node:fs'
import path from 'node:path'
import http from 'node:http'
import puppeteer from 'puppeteer-core'
const SITE = path.resolve('.tmp/site')
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg' }
const serve = (root) => new Promise((r) => { const s = http.createServer((req, res) => { let f = path.join(root, decodeURIComponent(req.url.split('?')[0])); if (!fs.existsSync(f)) { res.writeHead(404); return res.end() } res.writeHead(200, { 'content-type': mime[path.extname(f)] ?? 'text/plain' }); res.end(fs.readFileSync(f)) }); s.listen(0, () => r(s)) })
const B = await serve(path.join(SITE, 'class-site'))
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] })
const p = await b.newPage(); await p.setViewport({ width: 768, height: 900 }); await p.setJavaScriptEnabled(false)
await p.goto(`http://127.0.0.1:${B.address().port}/market-opportunity.html`, { waitUntil: 'load' })
await new Promise((r) => setTimeout(r, 500))
const r = await p.evaluate(() => { const el = document.querySelector('.section_wrap-10'); const cs = getComputedStyle(el); const hits = []; const walk = (rules, media) => { for (const r of rules) { if (r.cssRules && r.media) walk(r.cssRules, r.media.mediaText); else if (r.style && (r.style.width || r.style.boxSizing || r.style.getPropertyValue('--max'))) { try { if (el.matches(r.selectorText)) hits.push({ media, sel: r.selectorText, width: r.style.width, box: r.style.boxSizing, max: r.style.getPropertyValue('--max') }) } catch {} } } }; for (const s of document.styleSheets) { try { walk(s.cssRules, '') } catch {} } return { width: cs.width, box: cs.boxSizing, max: cs.getPropertyValue('--max'), rootMax: getComputedStyle(document.documentElement).getPropertyValue('--max'), rect: Math.round(el.getBoundingClientRect().width), hits } })
console.log(JSON.stringify(r, null, 0))
await b.close(); B.close()
