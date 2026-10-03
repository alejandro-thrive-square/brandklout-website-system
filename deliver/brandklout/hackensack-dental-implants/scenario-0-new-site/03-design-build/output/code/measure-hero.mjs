// Client script. Counts the lines of the hero headline at each width: the longest line must fit.
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
const here = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(here, 'site-src', 'dist');
const require = createRequire(path.resolve(here, '../../../../scenario-1-migration/01-old-site-capture/scripts/package.json'));
const puppeteer = require('puppeteer-core');
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => { let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html'; const f = path.join(DIST, p); if (!fs.existsSync(f)) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res); });
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const widths = (process.argv[2] || '2560,1920,1440,1366,1280,1279,1100,1024,992,991,768,767,480,479,414,390,360,320').split(',').map(Number);
for (const w of widths) {
  const pg = await browser.newPage();
  await pg.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await pg.setViewport({ width: w, height: w < 700 ? 844 : 900 });
  await pg.goto(`http://127.0.0.1:${server.address().port}/`, { waitUntil: 'networkidle2' });
  await pg.evaluate(() => document.fonts.load('800 1rem "Nunito Sans"'));
  await new Promise((r) => setTimeout(r, 300));
  const m = await pg.evaluate(() => {
    const h = document.querySelector('h1'); const cs = getComputedStyle(h);
    const r = document.createRange(); r.selectNodeContents(h);
    const rects = [...r.getClientRects()]; const tops = [...new Set(rects.map((x) => Math.round(x.top)))]; const widest = Math.max(...rects.map((x) => x.right)) - h.getBoundingClientRect().left;
    const body = document.querySelector('.arrival__lead');
    return { px: parseFloat(cs.fontSize).toFixed(1), lines: tops.length, widest: Math.round(widest), ratio: (widest / parseFloat(cs.fontSize)).toFixed(2), w: Math.round(h.getBoundingClientRect().width), sw: h.scrollWidth, body: parseFloat(getComputedStyle(body).fontSize).toFixed(1), t: parseFloat(getComputedStyle(document.querySelector('.t-body')).fontSize).toFixed(1), over: document.documentElement.scrollWidth - document.documentElement.clientWidth };
  });
  console.log(String(w).padStart(5), `h1 ${m.px}px ${m.lines} lines, widest line ${m.widest} of box ${m.w} (${m.ratio} em)  lead ${m.body}px body ${m.t}px  overflow ${m.over}`);
  await pg.close();
}
await browser.close(); server.close();
