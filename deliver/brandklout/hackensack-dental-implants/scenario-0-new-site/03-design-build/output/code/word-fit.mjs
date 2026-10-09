// Client script, 2026-10-09. Finds text that does not fit its box on a phone: a heading whose longest
// word is wider than its column (clipped silently where a section hides overflow, so the overflow
// gate cannot see it), and any element whose content is wider than the viewport.
// Usage (from the step's output/ folder; never pipe Node on Windows):
//   node code/word-fit.mjs [--widths 360,390] > word-fit.txt
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
const WIDTHS = wi >= 0 ? argv.splice(wi, 2)[1].split(',').map(Number) : [360, 390];
const walk = (d, pre = '') => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? (/^(assets|media|fonts)$/.test(e.name) ? [] : walk(path.join(d, e.name), pre + e.name + '/')) : e.name.endsWith('.html') ? [pre + e.name.slice(0, -5)] : []);
const slugs = argv.length ? argv : walk(DIST).sort();
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
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
const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] });
let problems = 0;
try {
  for (const w of WIDTHS) {
    const pg = await browser.newPage();
    await pg.setRequestInterception(true);
    pg.on('request', (r) => (/^http:\/\/127\.0\.0\.1/.test(r.url()) ? r.continue() : r.abort()));
    await pg.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await pg.setViewport({ width: w, height: 844, isMobile: true, hasTouch: true });
    for (const slug of slugs) {
      await pg.goto(`${base}/${slug === 'index' ? '' : slug}`, { waitUntil: 'load', timeout: 60000 });
      await pg.evaluate(() => document.fonts.ready);
      const found = await pg.evaluate(() => {
        const out = [];
        for (const el of document.querySelectorAll('h1, h2, h3, h4, p, a, li, span, dd, dt, summary, blockquote')) {
          const cs = getComputedStyle(el);
          if (cs.display === 'none' || cs.visibility === 'hidden' || !el.offsetParent) continue;
          if (el.scrollWidth > el.clientWidth + 1 && cs.overflowX !== 'visible' && el.clientWidth > 0) out.push(`clipped ${el.tagName.toLowerCase()}.${el.className.split(' ')[0]} "${el.textContent.trim().slice(0, 40)}" ${el.scrollWidth}>${el.clientWidth}`);
          const r = el.getBoundingClientRect();
          if (/^H[1-4]$/.test(el.tagName) || /heading|title|name/.test(el.className)) {
            const range = document.createRange();
            range.selectNodeContents(el);
            const rects = [...range.getClientRects()];
            const over = rects.some((q) => q.right > r.right + 2 || q.right > document.documentElement.clientWidth + 1);
            if (over) out.push(`word past its box ${el.tagName.toLowerCase()}.${el.className.split(' ')[0]} "${el.textContent.trim().slice(0, 50)}"`);
          }
        }
        return [...new Set(out)];
      });
      for (const f of found) { console.log(`${w} ${slug.padEnd(50)} ${f}`); problems++; }
    }
    await pg.close();
  }
} finally {
  await browser.close();
  server.close();
}
console.log(problems ? `${problems} problem(s)` : 'every word fits');
process.exitCode = problems ? 1 : 0;
