// Can the parked hover fill ever show? Sweep pill heights across the subpixel
// range and look for --ink at the bottom inside edge, at each device scale.
// If translateY(101%) is enough at every height this prints nothing, and the
// line in BugHerd #38 comes from somewhere else.
// node btn38-sweep.mjs [translatePercent] > btn38-sweep.log
import { webkit } from 'playwright-core';

const PCT = process.argv[2] || '101';
const CSS = (pct) => `
:root { --ink:#333c3f; --sun-fill:#93644a; --pill:999px; }
body { margin:0; background:#262d2f; }
.button { display:inline-flex; align-items:center; justify-content:center;
  border:2px solid var(--sun-fill); border-radius:var(--pill);
  background:var(--sun-fill); color:#fff; text-decoration:none;
  position:relative; overflow:hidden; isolation:isolate; font:800 14px/1.2 system-ui; }
.button::after { content:""; position:absolute; inset:0; background:var(--ink);
  transform:translateY(${pct}%); z-index:-1; }
`;

const browser = await webkit.launch({ headless: true });
let found = 0, tested = 0;
for (const dpr of [1, 1.25, 1.27, 1.5, 1.75, 2, 2.5, 3]) {
  const ctx = await browser.newContext({ viewport: { width: 400, height: 200 }, deviceScaleFactor: dpr });
  const page = await ctx.newPage();
  for (let pad = 14; pad <= 22; pad += 0.0625) {
    tested++;
    await page.setContent(
      `<style>${CSS(PCT)}</style><a class="button" style="padding:${pad}px 35px" href="#">Book online</a>`,
      { waitUntil: 'load' }
    );
    const hit = await page.evaluate(async () => {
      const el = document.querySelector('.button');
      const r = el.getBoundingClientRect();
      return { x: r.left, y: r.top, w: r.width, h: r.height };
    });
    const shot = await page.screenshot({ clip: { x: 0, y: 0, width: Math.ceil(hit.w) + 2, height: Math.ceil(hit.h) + 2 } });
    const ink = await page.evaluate(async (b64) => {
      const img = new Image();
      img.src = 'data:image/png;base64,' + b64;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = img.width; c.height = img.height;
      const g = c.getContext('2d');
      g.drawImage(img, 0, 0);
      const d = g.getImageData(0, 0, img.width, img.height).data;
      const x = Math.round(img.width / 2);
      let n = 0;
      for (let y = 0; y < img.height; y++) {
        const o = (y * img.width + x) * 4;
        // --ink is 51,60,63; the page ground is 38,45,47; the pill is 147,100,74
        if (Math.abs(d[o] - 51) < 8 && Math.abs(d[o + 1] - 60) < 8 && Math.abs(d[o + 2] - 63) < 8) n++;
      }
      return n;
    }, shot.toString('base64'));
    if (ink > 0) {
      found++;
      if (found <= 12) console.log(`dpr ${dpr}  padding ${pad.toFixed(4)}  height ${hit.h.toFixed(5)}  ink rows ${ink}`);
    }
  }
  await ctx.close();
}
await browser.close();
console.log(`\ntranslateY(${PCT}%): ${found} of ${tested} heights leak the parked fill`);
process.exitCode = found ? 1 : 0;
