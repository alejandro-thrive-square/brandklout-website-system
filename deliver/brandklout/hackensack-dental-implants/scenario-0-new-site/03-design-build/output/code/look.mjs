// Client script, 2026-09-30. Looks at the built page the way a visitor sees it: motion ON, one
// viewport at a time (ScrollSmoother breaks full-page captures), plus a reduced-motion full page.
//
// Usage (from the step's output/ folder; never pipe Node on Windows):
//   node code/look.mjs --width 1440 --height 900 > look.log            every viewport step, motion on
//   node code/look.mjs --width 390 --height 844 --at 0,0.2,0.5          chosen fractions of the scroll range
//   node code/look.mjs --width 1440 --full                              reduced motion, one full-page image
//   node code/look.mjs --width 1440 --sel "#tx" --frac 0.1,0.5,0.9      through one pinned scene
// Images land in output/look/<width>[-full]/NN.png (gitignored).
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

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : d; };
const has = (n) => process.argv.includes(`--${n}`);
const width = Number(arg('width', 1440));
const height = Number(arg('height', width < 700 ? 844 : 900));
const page = arg('page', 'index');
const full = has('full');

const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.mp4': 'video/mp4' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const f = path.join(DIST, p);
  if (!f.startsWith(DIST) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/${page === 'index' ? '' : page + '.html'}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const dir = path.join(OUT, 'look', `${width}${full ? '-full' : ''}${arg('sel') ? '-scene' : ''}`);
fs.rmSync(dir, { recursive: true, force: true });
fs.mkdirSync(dir, { recursive: true });

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--hide-scrollbars'] });
const pg = await browser.newPage();
const errors = [];
pg.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));
pg.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ' ' + m.text().slice(0, 200)); });
pg.on('response', (r) => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url().slice(0, 140)}`); });
if (full) await pg.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
await pg.setViewport({ width, height, deviceScaleFactor: 1, isMobile: width < 700, hasTouch: width < 700 });
await pg.goto(url, { waitUntil: 'networkidle2', timeout: 90000 });
await sleep(2500);

const go = async (y) => {
  await pg.evaluate((y) => { if (window.WZ && WZ.smoother) WZ.smoother.scrollTo(y, false); else window.scrollTo(0, y); }, y);
  await sleep(1100);
};
const info = await pg.evaluate(() => ({
  ok: !!(window.WZ && WZ.ok), active: window.WZ ? WZ.active : [], smoother: !!(window.WZ && WZ.smoother),
  max: window.ScrollTrigger ? ScrollTrigger.maxScroll(window) : document.documentElement.scrollHeight - innerHeight,
  root: getComputedStyle(document.documentElement).fontSize,
  overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  pins: window.ScrollTrigger ? ScrollTrigger.getAll().filter((t) => t.pin).map((t) => ({ id: t.trigger.id, start: Math.round(t.start), end: Math.round(t.end) })) : [],
}));
console.log(JSON.stringify(info));

if (full) {
  await pg.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); } window.scrollTo(0, 0); });
  await sleep(900);
  await pg.screenshot({ path: path.join(dir, 'full.png'), fullPage: true, captureBeyondViewport: true });
  console.log(`full page -> ${path.join(dir, 'full.png')}`);
} else {
  let ys;
  if (arg('sel')) {
    const pin = info.pins.find((p) => '#' + p.id === arg('sel'));
    if (!pin) throw new Error(`no pin with trigger ${arg('sel')}`);
    ys = arg('frac', '0.1,0.5,0.9').split(',').map((f) => pin.start + (pin.end - pin.start) * Number(f));
  } else if (arg('at')) ys = arg('at').split(',').map((f) => info.max * Number(f));
  else { ys = []; for (let y = 0; y <= info.max; y += Math.round(height * 0.92)) ys.push(y); ys.push(info.max); }
  let n = 0;
  for (const y of ys) {
    await go(Math.round(y));
    const file = path.join(dir, String(n++).padStart(2, '0') + '.png');
    await pg.screenshot({ path: file });
    console.log(`${path.basename(file)} y=${Math.round(y)}`);
  }
}
console.log(errors.length ? 'ERRORS\n  ' + [...new Set(errors)].join('\n  ') : 'no console errors');
await browser.close();
server.close();
