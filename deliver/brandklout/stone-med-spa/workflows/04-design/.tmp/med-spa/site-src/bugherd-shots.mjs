// Element screenshots of every section the 2026-09-28 BugHerd round touched,
// at the reviewer's width (1920) and a phone (390), plus the two hover states
// (the Treatments dropdown, a concern chip's description).
//   node bugherd-shots.mjs [baseUrl] [outDir]
// Without a base URL it serves ../final-site locally.
import puppeteer from 'puppeteer-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = process.argv[3] || path.join(HERE, '../shots/bugherd-2026-09-28');
fs.mkdirSync(OUT, { recursive: true });
let base = process.argv[2];
let srv;
if (!base) {
  const root = path.join(HERE, '../final-site');
  const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
  srv = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p === '/') p = '/index.html';
    if (!path.extname(p)) p += '.html';
    const f = path.join(root, p);
    if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(res);
  });
  await new Promise((r) => srv.listen(0, r));
  base = `http://127.0.0.1:${srv.address().port}`;
}
const url = (p) => `${base}/${p}`;

const SHOTS = [
  ['index', ['.section_surgeon', '.words_section', '.section_place', '.footer_component']],
  ['treatments', ['.section_cover', '.section_concern']],
  ['results', ['.section_cover', '.section_wall', '.section_room', '.proof_faq']],
  ['membership', ['.section_faces']],
  ['about', ['.section_cover', '.section_line', '.section_rules', '.section_room']],
  ['book', ['.section_cover', '.section_book', '.book_call']],
  ['meet-the-doctor', ['.doctor_rules', '.doctor_rule']],
  ['botox', ['.section_why', '.section_care', '.detail_faq', '.section_related']],
  ['dysport-jeuveau', ['.section_why', '.section_care']],
];

const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox', '--hide-scrollbars'] });
const pg = await browser.newPage();
await pg.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
async function load(p, width) {
  await pg.setViewport({ width, height: 1000 });
  await pg.goto(url(p), { waitUntil: 'networkidle0', timeout: 90000 });
  await pg.evaluate(async () => {
    document.documentElement.style.scrollBehavior = 'auto';
    for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
    window.scrollTo(0, 0);
  });
  await new Promise((r) => setTimeout(r, 1500));
}
for (const width of [1920, 390]) {
  for (const [p, sels] of SHOTS) {
    await load(p, width);
    for (const sel of sels) {
      const el = await pg.$(sel);
      if (!el) { console.log('MISSING', p, sel); continue; }
      await el.screenshot({ path: path.join(OUT, `${width}-${p}${sel.replace(/[^a-z_-]/gi, '_')}.png`) });
    }
  }
}
// Hover states at 1920.
await load('treatments', 1920);
await pg.evaluate(() => window.scrollTo(0, 0));
await pg.hover('.navbar_dropdown .navbar_link');
await new Promise((r) => setTimeout(r, 600));
await pg.screenshot({ path: path.join(OUT, '1920-hover-dropdown.png'), clip: { x: 0, y: 0, width: 1920, height: 520 } });
const chip = await pg.$('[data-concern="volume"]');
await chip.evaluate((e) => e.scrollIntoView({ block: 'center' }));
await new Promise((r) => setTimeout(r, 400));
await chip.hover();
await new Promise((r) => setTimeout(r, 500));
const box = await (await pg.$('.section_concern')).boundingBox();
await pg.screenshot({ path: path.join(OUT, '1920-hover-concern.png'), clip: { x: 0, y: Math.max(0, box.y), width: 1920, height: Math.min(box.height, 1000) } });
await browser.close();
srv?.close();
console.log('shots in', OUT);
