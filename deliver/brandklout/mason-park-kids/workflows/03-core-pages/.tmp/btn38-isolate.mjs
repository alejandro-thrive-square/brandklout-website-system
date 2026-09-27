// BugHerd #38, isolated. Two pills on the site's dark ground, identical except
// for the one declaration that changed: the parked hover fill sized to the
// PADDING box (inset: 0, as shipped) against the BORDER box (inset: -2px).
// Prints the pixel column down each pill and says where the fill shows.
// node btn38-isolate.mjs > btn38-isolate.log
import { webkit } from 'playwright-core';

const CSS = `
:root { --ink: #333c3f; --sun-fill: #93644a; --on-sun: #fff; --pill: 999px; --ease: cubic-bezier(.22,.61,.36,1); }
body { margin: 0; background: #262d2f; display: flex; gap: 60px; padding: 60px; font: 800 14px/1.2 system-ui; }
.button {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 1.15rem 2.2rem; border: 2px solid var(--sun-fill); border-radius: var(--pill);
  background: var(--sun-fill); color: var(--on-sun); text-decoration: none;
  position: relative; overflow: hidden; isolation: isolate;
}
.button::after { content: ""; position: absolute; background: var(--ink); transform: translateY(101%); z-index: -1; }
.old::after { inset: 0; }
.new::after { inset: -2px; }
`;

const browser = await webkit.launch({ headless: true });
for (const dpr of [1, 2, 3]) {
  const ctx = await browser.newContext({ viewport: { width: 700, height: 220 }, deviceScaleFactor: dpr });
  const page = await ctx.newPage();
  await page.setContent(
    `<style>${CSS}</style><a class="button old" href="#">Book online</a><a class="button new" href="#">Book online</a>`,
    { waitUntil: 'load' }
  );
  await page.waitForTimeout(400);
  console.log(`=== dpr ${dpr}`);
  for (const cls of ['old', 'new']) {
    const m = await page.locator('.' + cls).evaluate((el) => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
    const shot = await page.screenshot({ clip: { x: Math.round(m.x), y: Math.round(m.y), width: Math.round(m.w), height: Math.round(m.h) } });
    const res = await page.evaluate(async (b64) => {
      const img = new Image();
      img.src = 'data:image/png;base64,' + b64;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = img.width; c.height = img.height;
      const g = c.getContext('2d');
      g.drawImage(img, 0, 0);
      const d = g.getImageData(0, 0, img.width, img.height).data;
      const x = Math.round(img.width / 2);
      const rows = [];
      for (let y = 0; y < img.height; y++) { const o = (y * img.width + x) * 4; rows.push([d[o], d[o + 1], d[o + 2]]); }
      // --ink is 51,60,63; the pill is 147,100,74. How many bottom rows are ink-ish?
      const inkish = (p) => Math.abs(p[0] - 51) < 26 && Math.abs(p[1] - 60) < 26 && Math.abs(p[2] - 63) < 26;
      let n = 0;
      for (let y = img.height - 1; y >= 0 && inkish(rows[y]); y--) n++;
      return { h: img.height, inkRows: n, tail: rows.slice(-6).map((p) => p.join(',')) };
    }, shot.toString('base64'));
    console.log(`  ${cls}: height ${res.h}px  ink rows at the bottom: ${res.inkRows}  [${res.tail.join(' | ')}]`);
    await page.screenshot({ path: `btn38-iso-${cls}-dpr${dpr}.png`, clip: { x: Math.round(m.x) - 10, y: Math.round(m.y) - 10, width: Math.round(m.w) + 20, height: Math.round(m.h) + 20 } });
  }
  await ctx.close();
}
await browser.close();
