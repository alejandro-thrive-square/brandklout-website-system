import fs from 'node:fs'
import path from 'node:path'
import http from 'node:http'
import puppeteer from 'puppeteer-core'
const SITE = path.resolve('.tmp/site')
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg' }
const serve = (root) => new Promise((r) => { const s = http.createServer((req, res) => { let f = path.join(root, decodeURIComponent(req.url.split('?')[0])); if (!fs.existsSync(f)) { res.writeHead(404); return res.end() } res.writeHead(200, { 'content-type': mime[path.extname(f)] ?? 'text/plain' }); res.end(fs.readFileSync(f)) }); s.listen(0, () => r(s)) })
const A = await serve(path.join(SITE, 'final-site')), B = await serve(path.join(SITE, 'class-site'))
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] })
const probe = async (port, file, width, fn, arg) => { const p = await b.newPage(); await p.setViewport({ width, height: 900 }); await p.setJavaScriptEnabled(false); await p.goto(`http://127.0.0.1:${port}/${file}`, { waitUntil: 'load' }); const r = await p.evaluate(fn, arg); await p.close(); return r }
const whoWins = (sel) => { const el = document.querySelector(sel); const hits = []; const walk = (rules, media) => { for (const r of rules) { if (r.cssRules && r.media) walk(r.cssRules, r.media.mediaText); else if (r.style && (r.style.fontSize || r.style.font)) { try { if (el.matches(r.selectorText)) hits.push({ media, sel: r.selectorText, fontSize: r.style.fontSize, font: r.style.font }) } catch {} } } }; for (const s of document.styleSheets) { try { walk(s.cssRules, '') } catch {} } return { cls: el.className, computed: getComputedStyle(el).fontSize, hits } }
console.log('omnia class-site node-2:', JSON.stringify(await probe(B.address().port, 'customer-story-omnia-ai-search-growth.html', 1440, whoWins, '.network-visual_network-node-2')))
console.log('omnia class-site node-box:', JSON.stringify(await probe(B.address().port, 'customer-story-omnia-ai-search-growth.html', 1440, whoWins, '.network-node-box')))
const grid = () => { const g = document.querySelector('.offer-grid'); const w = g.closest('.wrap') || g.parentElement; const cs = getComputedStyle(g); const r = g.getBoundingClientRect(); const wr = w.getBoundingClientRect(); return { wrap: { cls: String(w.className).slice(0, 40), left: Math.round(wr.left), width: Math.round(wr.width), pad: getComputedStyle(w).paddingLeft, maxW: getComputedStyle(w).maxWidth }, grid: { left: Math.round(r.left), width: Math.round(r.width), cols: cs.gridTemplateColumns, gap: cs.columnGap, display: cs.display }, children: [...g.children].map((c) => ({ cls: String(c.className).slice(0, 30), w: Math.round(c.getBoundingClientRect().width, ), minW: getComputedStyle(c).minWidth })) } }
for (const [n, port] of [['sang', A.address().port], ['class', B.address().port]]) console.log(n, 'market 768', JSON.stringify(await probe(port, 'market-opportunity.html', 768, grid)))
await b.close(); A.close(); B.close()
