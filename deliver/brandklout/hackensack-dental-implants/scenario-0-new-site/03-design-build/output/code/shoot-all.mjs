// Client script, 2026-10-09. Full-page screenshots of every built page (or the slugs given) at the QA
// widths, reduced motion (the only state where a scroll-driven page renders complete), one browser.
// Lands in output/look/pages/<slug with / as ~>/<width>.png plus a half-size preview, for reading by eye
// (DESIGN-STANDARD, "Responsive QA").
//
// Usage (from the step's output/ folder; never pipe Node on Windows):
//   node code/shoot-all.mjs [--widths 1440,390] [slug ...] > shoot.log
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
const argv = process.argv.slice(2);
const wi = argv.indexOf('--widths');
const WIDTHS = wi >= 0 ? argv.splice(wi, 2)[1].split(',').map(Number) : [1440, 390];
const walk = (d, pre = '') => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? (/^(assets|media|fonts)$/.test(e.name) ? [] : walk(path.join(d, e.name), pre + e.name + '/')) : e.name.endsWith('.html') ? [pre + e.name.slice(0, -5)] : []);
const slugs = argv.length ? argv : walk(DIST).sort();
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.mp4': 'video/mp4' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index';
  let f = path.join(DIST, p);
  if (!path.extname(f)) f += '.html';
  if (!f.startsWith(DIST) || !fs.existsSync(f)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'], protocolTimeout: 300000 });
try {
  for (const slug of slugs) {
    for (const w of WIDTHS) {
      const pg = await browser.newPage();
      await pg.setRequestInterception(true);
      pg.on('request', (r) => (/leadconnectorhq|msgsndr|elfsight|challenges[.]cloudflare|google[.]com\/maps/.test(r.url()) ? r.abort() : r.continue()));
      await pg.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
      await pg.setViewport({ width: w, height: w < 700 ? 844 : 900, isMobile: w < 700, hasTouch: w < 700 });
      await pg.goto(`${base}/${slug === 'index' ? '' : slug}`, { waitUntil: 'networkidle2', timeout: 90000 });
      await pg.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); } window.scrollTo(0, 0); });
      await new Promise((r) => setTimeout(r, 800));
      const dir = path.join(OUT, 'look', 'pages', slug.replace(/\//g, '~'));
      fs.mkdirSync(dir, { recursive: true });
      const file = path.join(dir, `${w}.png`);
      await pg.screenshot({ path: file, fullPage: true, captureBeyondViewport: true });
      const h = await pg.evaluate(() => document.documentElement.scrollHeight);
      console.log(`${slug.padEnd(60)} ${w}  ${h}px`);
      await pg.close();
    }
  }
} finally {
  await browser.close();
  server.close();
}
