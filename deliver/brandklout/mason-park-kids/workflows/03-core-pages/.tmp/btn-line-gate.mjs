// BugHerd #38: a dark line across the "Book online" pill. It is the sliding
// hover fill (--ink) parked at translateY(101%) of the PADDING box while
// `overflow: hidden` clips to the BORDER box, so a sliver sits inside the
// bottom border. It only shows where --ink contrasts with the pill: `is-sun`
// on a dark ground, at the reviewer's retina scale.
//
//   node btn-line-gate.mjs local            # the files on disk
//   node btn-line-gate.mjs live             # staging, i.e. what is published
//
// Reads ONE pixel column down each button and compares the bottom strip with
// the pill's own fill. The column is taken well left of centre: down the middle
// it runs through the label, and white glyphs read as a line in every button on
// the site (they did, on the first cut of this gate). Retina and WebKit,
// because that is what photographed it.
import { webkit } from 'playwright-core';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(HERE, '..', 'home');
const mode = process.argv[2] || 'local';
const PAGES = ['contacts/index.html', 'index.html', 'appointment/index.html', 'new-patients/index.html'];
const url = (p) =>
  mode === 'live'
    ? 'https://staging.masonparkpediatricdental.com/' + p.replace(/index\.html$/, '')
    : 'file:///' + path.join(SITE, p).replace(/\\/g, '/');

const browser = await webkit.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1512, height: 855 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.addInitScript(() => { document.documentElement.style.scrollBehavior = 'auto'; });

const out = path.join(HERE, 'btn-line');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
let bad = 0, checked = 0;

for (const p of PAGES) {
  await page.goto(url(p), { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(1200);
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(2500);

  const n = await page.locator('a.button, button.button').count();
  for (let i = 0; i < n; i++) {
    const btn = page.locator('a.button, button.button').nth(i);
    if (!(await btn.isVisible().catch(() => false))) continue;
    await btn.scrollIntoViewIfNeeded().catch(() => {});
    await page.waitForTimeout(600);
    const meta = await btn.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { x: r.left, y: r.top, w: r.width, h: r.height, label: (el.textContent || '').trim().slice(0, 24), cls: el.className };
    });
    const vp = page.viewportSize();
    if (meta.w < 40 || meta.h < 20) continue;
    if (meta.y < 0 || meta.y + meta.h > vp.height || meta.x < 0 || meta.x + meta.w > vp.width) continue;
    checked++;

    // A column 15% in from the left: inside the pill, clear of the round end
    // and clear of the label.
    const colX = Math.round(meta.x + meta.w * 0.15);
    const shot = await page.screenshot({ clip: { x: colX, y: Math.round(meta.y), width: 2, height: Math.round(meta.h) } });
    const col = await page.evaluate(async (b64) => {
      const img = new Image();
      img.src = 'data:image/png;base64,' + b64;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = img.width; c.height = img.height;
      const g = c.getContext('2d');
      g.drawImage(img, 0, 0);
      const d = g.getImageData(0, 0, img.width, img.height).data;
      const rows = [];
      for (let y = 0; y < img.height; y++) { const o = y * img.width * 4; rows.push([d[o], d[o + 1], d[o + 2]]); }
      return rows;
    }, shot.toString('base64'));

    if (col.length < 16) continue;
    const ref = col[Math.round(col.length * 0.45)];
    const dist = (a, b) => Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[2] - b[2]));
    let worst = 0, worstY = -1;
    for (let y = Math.round(col.length * 0.6); y < col.length - 1; y++) {
      const d = dist(col[y], ref);
      if (d > worst) { worst = d; worstY = y; }
    }
    if (worst > 30) {
      bad++;
      const name = `${p.replace(/[\\/]/g, '_')}-${i}.png`;
      await page.screenshot({
        path: path.join(out, name),
        clip: { x: Math.max(0, meta.x - 20), y: Math.max(0, meta.y - 20), width: Math.min(vp.width - Math.max(0, meta.x - 20), meta.w + 40), height: Math.min(vp.height - Math.max(0, meta.y - 20), meta.h + 40) },
      }).catch(() => {});
      console.log(`LINE  ${p} btn#${i} "${meta.label}" [${meta.cls}]  delta ${worst} at row ${worstY}/${col.length}  -> btn-line/${name}`);
    }
  }
}
await browser.close();
console.log(`\n${mode}: ${checked} buttons checked, ${bad} with a line across the bottom`);
process.exitCode = bad ? 1 : 0;
