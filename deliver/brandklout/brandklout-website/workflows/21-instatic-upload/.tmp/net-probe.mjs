import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
import path from 'node:path'
import http from 'node:http'
const SITE = path.resolve('.tmp/site')
const serve = (root) => new Promise((r) => { const s = http.createServer((req, res) => { const f = path.join(root, decodeURIComponent(req.url.split('?')[0])); if (!fs.existsSync(f)) { res.writeHead(404); return res.end() } res.writeHead(200, { 'content-type': f.endsWith('.css') ? 'text/css' : f.endsWith('.js') ? 'text/javascript' : 'text/html' }); res.end(fs.readFileSync(f)) }); s.listen(0, () => r(s)) })
const A = await serve(path.join(SITE, 'final-site'))
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] })
const fn = () => [...document.querySelectorAll('span')].filter((e) => /^(Local SEO|Paid growth)$/.test(e.textContent.trim())).map((e) => ({ text: e.textContent.trim(), fs: getComputedStyle(e).fontSize, parent: String(e.parentElement.className).slice(0, 40), inNet: !!e.closest('.network-node') }))
for (const [name, url] of [['sang', `http://127.0.0.1:${A.address().port}/index.html`], ['live', 'https://brandklout-production.up.railway.app/?_=' + Date.now()]]) {
  const p = await b.newPage(); await p.setViewport({ width: 1440, height: 900 }); await p.setJavaScriptEnabled(name === 'live'); await p.goto(url, { waitUntil: 'load' }); await new Promise((r) => setTimeout(r, 800))
  console.log(name, JSON.stringify(await p.evaluate(fn))); await p.close()
}
await b.close(); A.close()
