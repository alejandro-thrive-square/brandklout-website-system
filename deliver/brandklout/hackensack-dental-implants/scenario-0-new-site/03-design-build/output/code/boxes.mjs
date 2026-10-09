// Client script, 2026-10-09. Serves dist/ and prints the box (and chosen computed styles) of every
// element matching each selector: a measurement before a fix, never a guess.
//
// Usage (from the step's output/ folder; never pipe Node on Windows):
//   node code/boxes.mjs --page services/all-on-x --width 1440 ".navbar_list" ".navbar_item" > boxes.txt
//   options: --props fontSize,lineHeight   --reduced   --height 900
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(here, '..');
const DIST = path.join(here, 'site-src', 'dist');
const require = createRequire(path.resolve(OUT, '../../../scenario-1-migration/01-old-site-capture/scripts/package.json'));
const puppeteer = require('puppeteer-core');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf(`--${n}`); if (i < 0) return d; const v = argv[i + 1]; argv.splice(i, 2); return v; };
const flag = (n) => { const i = argv.indexOf(`--${n}`); if (i < 0) return false; argv.splice(i, 1); return true; };
const page = opt('page', 'index');
const width = Number(opt('width', 1440));
const height = Number(opt('height', width < 700 ? 844 : 900));
const props = opt('props', 'display,position,fontSize,lineHeight,marginTop,marginBottom').split(',');
const reduced = flag('reduced');
const sels = argv;

const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.mp4': 'video/mp4' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  let f = path.join(DIST, p);
  if (!path.extname(f) && fs.existsSync(f + '.html')) f += '.html';
  if (!f.startsWith(DIST) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/${page === 'index' ? '' : page}`;
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
try {
  const tab = await browser.newPage();
  await tab.setRequestInterception(true);
  tab.on('request', (r) => (/leadconnectorhq|msgsndr|elfsight|cloudflare/.test(r.url()) ? r.abort() : r.continue()));
  if (reduced) await tab.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await tab.setViewport({ width, height });
  await tab.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 1500));
  const out = await tab.evaluate((sels, props) => sels.map((s) => {
    const els = Array.from(document.querySelectorAll(s)).slice(0, 12);
    return { s, n: document.querySelectorAll(s).length, els: els.map((e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return { x: Math.round(r.left), y: Math.round(r.top + window.scrollY), w: Math.round(r.width), h: Math.round(r.height), text: (e.textContent || '').trim().slice(0, 40), css: Object.fromEntries(props.map((p) => [p, cs[p]])) }; }) };
  }), sels, props);
  for (const o of out) {
    console.log(`${o.s}  (${o.n})`);
    for (const e of o.els) console.log(`   ${String(e.x).padStart(5)} ${String(e.y).padStart(6)}  ${String(e.w).padStart(5)}x${String(e.h).padEnd(5)} ${JSON.stringify(e.css)}  "${e.text}"`);
  }
} finally {
  await browser.close();
  server.close();
}
