import fs from 'node:fs'
import path from 'node:path'
import http from 'node:http'
import puppeteer from 'puppeteer-core'
const SITE = path.resolve('.tmp/site')
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg' }
const serve = (root) => new Promise((r) => { const s = http.createServer((req, res) => { let f = path.join(root, decodeURIComponent(req.url.split('?')[0])); if (!fs.existsSync(f)) { res.writeHead(404); return res.end() } res.writeHead(200, { 'content-type': mime[path.extname(f)] ?? 'text/plain' }); res.end(fs.readFileSync(f)) }); s.listen(0, () => r(s)) })
const A = await serve(path.join(SITE, 'final-site')), B = await serve(path.join(SITE, 'class-site'))
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] })
const probe = async (port, file, width, fn) => { const p = await b.newPage(); await p.setViewport({ width, height: 900 }); await p.setJavaScriptEnabled(false); await p.goto(`http://127.0.0.1:${port}/${file}`, { waitUntil: 'load' }); const r = await p.evaluate(fn); await p.close(); return r }
// 1. market-opportunity at 768: the widest descendants of the offer grid, both sites
const widest = () => { const vw = innerWidth; const out = []; for (const e of document.querySelectorAll('.offer-grid, .offer-grid *')) { const r = e.getBoundingClientRect(); if (r.right > vw + 1) out.push({ tag: e.localName, cls: String(e.className).slice(0, 50), right: Math.round(r.right), w: Math.round(r.width), fs: getComputedStyle(e).fontSize, ws: getComputedStyle(e).whiteSpace, text: e.textContent.trim().slice(0, 30) }) } return { scrollW: document.documentElement.scrollWidth, vw, out: out.slice(0, 12) } }
for (const [name, port] of [['sang', A.address().port], ['class', B.address().port]]) console.log(name, 768, JSON.stringify(await probe(port, 'market-opportunity.html', 768, widest)))
// 2. index at 390: the two CTA buttons
const ctas = () => [...document.querySelectorAll('a.btn')].filter((e) => /See All Customer Stories|Check My Market/.test(e.textContent)).map((e) => { const r = e.getBoundingClientRect(); return { text: e.textContent.trim().slice(0, 26), left: Math.round(r.left), right: Math.round(r.right), fs: getComputedStyle(e).fontSize, pad: getComputedStyle(e).paddingLeft, ws: getComputedStyle(e).whiteSpace } })
for (const [name, port] of [['sang', A.address().port], ['class', B.address().port]]) console.log(name, 390, JSON.stringify(await probe(port, 'index.html', 390, ctas)))
// 3. omnia: the "Website" span vs "Reputation" span
const spans = () => [...document.querySelectorAll('.network-node span')].map((e) => ({ text: e.textContent, fs: getComputedStyle(e).fontSize, parentFs: getComputedStyle(e.parentElement).fontSize, cls: e.className, pcls: String(e.parentElement.className).slice(0, 60) }))
for (const [name, port] of [['sang', A.address().port], ['class', B.address().port]]) console.log(name, 'omnia', JSON.stringify(await probe(port, 'customer-story-omnia-ai-search-growth.html', 1440, spans)))
await b.close(); A.close(); B.close()
