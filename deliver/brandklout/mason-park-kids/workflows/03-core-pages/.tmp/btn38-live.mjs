// BugHerd #38: photograph the live "Book online" pill at rest, hovered, and
// focused, and count the rows that are not the pill's own fill. The reviewer
// placed the pin ON the button, so whatever state their cursor left it in is
// part of the answer.
// node btn38-live.mjs > btn38-live.log
import { webkit } from 'playwright-core';

const URL = 'https://staging.masonparkpediatricdental.com/contacts/';
const browser = await webkit.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1512, height: 855 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.addInitScript(() => { document.documentElement.style.scrollBehavior = 'auto'; });
await page.goto(URL, { waitUntil: 'load', timeout: 60000 });
await page.waitForTimeout(1500);
await page.evaluate(async () => {
  for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 50)); }
});
await page.waitForTimeout(2000);

const btn = page.locator('#invitation .iv-actions a.button.is-sun').first();
await btn.scrollIntoViewIfNeeded();
await page.waitForTimeout(3000);

const read = async (tag) => {
  const m = await btn.evaluate((el) => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
  const clip = { x: Math.round(m.x), y: Math.round(m.y), width: Math.round(m.w), height: Math.round(m.h) };
  const shot = await page.screenshot({ clip });
  const res = await page.evaluate(async (b64) => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + b64;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, img.width, img.height).data;
    // average each row across the middle 60% of the width, skipping the glyphs
    // by taking the MEDIAN rather than the mean
    const rows = [];
    const x0 = Math.round(img.width * 0.08), x1 = Math.round(img.width * 0.30);
    for (let y = 0; y < img.height; y++) {
      const rs = [], gs = [], bs = [];
      for (let x = x0; x < x1; x++) { const o = (y * img.width + x) * 4; rs.push(d[o]); gs.push(d[o + 1]); bs.push(d[o + 2]); }
      const med = (a) => a.sort((p, q) => p - q)[a.length >> 1];
      rows.push([med(rs), med(gs), med(bs)]);
    }
    return { h: img.height, w: img.width, rows };
  }, shot.toString('base64'));

  const ref = res.rows[Math.round(res.h * 0.5)];
  const dist = (a, b) => Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[2] - b[2]));
  const odd = res.rows.map((p, y) => ({ y, d: dist(p, ref), p })).filter((r) => r.d > 18);
  console.log(`--- ${tag}  ${res.w}x${res.h}  fill ${ref.join(',')}`);
  console.log('    rows off the fill:', odd.length ? odd.map((r) => `${r.y}(${r.p.join(',')} d${r.d})`).join(' ') : 'none');
  await page.screenshot({ path: `btn38-live-${tag}.png`, clip: { x: clip.x - 12, y: clip.y - 12, width: clip.width + 24, height: clip.height + 24 } });
};

await read('rest');
await btn.hover();
await page.waitForTimeout(900);
await read('hovered');
await page.mouse.move(10, 10);
await page.waitForTimeout(250);
await read('leaving-250ms');
await browser.close();
