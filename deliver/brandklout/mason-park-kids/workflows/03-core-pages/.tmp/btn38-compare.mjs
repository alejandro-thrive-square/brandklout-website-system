// The reviewer's attachment is a 1:1 capture (pill 158x58, matching the live
// 153.8x57.5 CSS box). Render the live button at dpr 1 in WebKit and measure it
// exactly the way att38-measure.mjs measures the attachment, so "is this a bug
// or is this what the pill looks like" stops being a matter of opinion.
// node btn38-compare.mjs > btn38-compare.log
import { webkit } from 'playwright-core';

const browser = await webkit.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1512, height: 855 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.addInitScript(() => { document.documentElement.style.scrollBehavior = 'auto'; });
await page.goto('https://staging.masonparkpediatricdental.com/contacts/', { waitUntil: 'load', timeout: 60000 });
await page.waitForTimeout(2000);
await page.evaluate(async () => {
  for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 50)); }
});
await page.waitForTimeout(2000);
const btn = page.locator('#invitation .iv-actions a.button.is-sun').first();
await btn.scrollIntoViewIfNeeded();
await page.waitForTimeout(2500);
const m = await btn.evaluate((el) => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
console.log('box', JSON.stringify(m));
const shot = await page.screenshot({ clip: { x: Math.round(m.x) - 9, y: Math.round(m.y) - 36, width: 197, height: 129 } });
await page.screenshot({ path: 'btn38-live-dpr1.png', clip: { x: Math.round(m.x) - 9, y: Math.round(m.y) - 36, width: 197, height: 129 } });

const out = await page.evaluate(async (b64) => {
  const img = new Image();
  img.src = 'data:image/png;base64,' + b64;
  await img.decode();
  const c = document.createElement('canvas');
  c.width = img.width; c.height = img.height;
  const g = c.getContext('2d');
  g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, img.width, img.height).data;
  const at = (x, y) => { const o = (y * img.width + x) * 4; return [d[o], d[o + 1], d[o + 2]]; };
  const copperish = (p) => p[0] > 110 && p[0] < 190 && p[1] > 70 && p[1] < 130 && p[2] > 45 && p[2] < 110;
  let top = -1, bot = -1;
  for (let y = 0; y < img.height; y++) {
    let n = 0;
    for (let x = 0; x < img.width; x++) if (copperish(at(x, y))) n++;
    if (n > img.width * 0.2) { if (top < 0) top = y; bot = y; }
  }
  const mid = Math.round((top + bot) / 2);
  let left = -1, right = -1;
  for (let x = 0; x < img.width; x++) if (copperish(at(x, mid))) { if (left < 0) left = x; right = x; }
  const rows = [];
  for (let y = top; y <= bot; y++) {
    let n = 0;
    for (let x = left; x <= right; x++) if (!copperish(at(x, y))) n++;
    rows.push({ y, off: n, sample: at(Math.round((left + right) / 2), y).join(',') });
  }
  // the label sits in the middle rows; report only rows in the bottom quarter
  const lowest = rows.filter((r) => r.y > top + (bot - top) * 0.75);
  return { size: [img.width, img.height], pill: { top, bot, left, right, h: bot - top + 1, w: right - left + 1 }, bottomRows: lowest.map((r) => `y${r.y} off${r.off} [${r.sample}]`) };
}, shot.toString('base64'));
console.log(JSON.stringify(out, null, 2));
await browser.close();
