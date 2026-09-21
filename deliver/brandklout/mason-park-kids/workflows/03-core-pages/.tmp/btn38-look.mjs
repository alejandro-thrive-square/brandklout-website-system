// Look at the one button BugHerd #38 photographed, live and local, blown up,
// and print the pixel column down its left third so the artefact is a number.
// node btn38-look.mjs > btn38-look.log
import { webkit } from 'playwright-core';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(HERE, '..', 'home');
const targets = [
  ['live', 'https://staging.masonparkpediatricdental.com/contacts/'],
  ['local', 'file:///' + path.join(SITE, 'contacts', 'index.html').replace(/\\/g, '/')],
];

const browser = await webkit.launch({ headless: true });
for (const [name, url] of targets) {
  const ctx = await browser.newContext({ viewport: { width: 1512, height: 855 }, deviceScaleFactor: 3 });
  const page = await ctx.newPage();
  await page.addInitScript(() => { document.documentElement.style.scrollBehavior = 'auto'; });
  await page.goto(url, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(1200);
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); }
  });
  await page.waitForTimeout(2500);

  const btn = page.locator('#invitation .iv-actions a.button.is-sun').first();
  await btn.scrollIntoViewIfNeeded();
  await page.waitForTimeout(2000);
  const m = await btn.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { x: r.left, y: r.top, w: r.width, h: r.height };
  });
  console.log(`--- ${name}`, JSON.stringify(m));

  const shot = await page.screenshot({ clip: { x: Math.round(m.x), y: Math.round(m.y), width: Math.round(m.w), height: Math.round(m.h) } });
  const col = await page.evaluate(async (b64) => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + b64;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, img.width, img.height).data;
    const x = Math.round(img.width * 0.2);
    const rows = [];
    for (let y = 0; y < img.height; y++) { const o = (y * img.width + x) * 4; rows.push(`${y}:${d[o]},${d[o + 1]},${d[o + 2]}`); }
    return { h: img.height, w: img.width, rows };
  }, shot.toString('base64'));
  console.log(`    ${col.w}x${col.h}, column at 20% width, bottom 18 rows:`);
  console.log('    ' + col.rows.slice(-18).join('  '));

  await page.screenshot({
    path: `btn38-${name}.png`,
    clip: { x: Math.round(m.x) - 8, y: Math.round(m.y) - 8, width: Math.round(m.w) + 16, height: Math.round(m.h) + 16 },
  });
  await ctx.close();
}
await browser.close();
