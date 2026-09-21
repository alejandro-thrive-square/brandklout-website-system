// BugHerd #38. The staging site carries the Sienna accessibility widget, which
// rewrites type inline (data-asw-org-font-size, 192 nodes) and has a
// "highlight/underline links" profile. `.button` is an <a> and an inline-flex
// box, so an underline on it paints a rule the full width of the pill --
// exactly the line in the reviewer's attachment. Find the class Sienna toggles,
// turn it on, and photograph it.
// node sienna-underline.mjs > sienna-underline.log
import { webkit } from 'playwright-core';

const BUNDLE = 'https://cdn.jsdelivr.net/npm/sienna-accessibility/dist/sienna-accessibility.umd.js';
const src = await (await fetch(BUNDLE)).text();
console.log('bundle', src.length, 'bytes');
const hits = [...new Set(src.match(/[a-z-]*underline[a-z-]*/gi) || [])];
console.log('underline tokens:', hits.join(', ') || '(none)');
const classes = [...new Set(src.match(/asw-[a-z0-9-]+/gi) || [])];
console.log('asw classes:', classes.slice(0, 60).join(' '));

const browser = await webkit.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1512, height: 855 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.addInitScript(() => { document.documentElement.style.scrollBehavior = 'auto'; });
await page.goto('https://staging.masonparkpediatricdental.com/contacts/', { waitUntil: 'load', timeout: 60000 });
await page.waitForTimeout(2500);
await page.evaluate(async () => {
  for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 50)); }
});
await page.waitForTimeout(2000);

const btn = page.locator('#invitation .iv-actions a.button.is-sun').first();
await btn.scrollIntoViewIfNeeded();
await page.waitForTimeout(2500);

for (const cls of process.argv.slice(2).length ? process.argv.slice(2) : ['asw-underline-links', 'asw-highlight-links', 'asw-links-underline']) {
  await page.evaluate((c) => { document.documentElement.className = ''; document.body.className = document.body.className.replace(/asw-\S+/g, '') + ' ' + c; document.documentElement.classList.add(c); }, cls);
  await page.waitForTimeout(600);
  const cs = await btn.evaluate((el) => getComputedStyle(el).textDecorationLine);
  const m = await btn.evaluate((el) => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
  console.log(`${cls}: text-decoration-line = ${cs}`);
  await page.screenshot({ path: `sienna-${cls}.png`, clip: { x: m.x - 12, y: m.y - 12, width: m.w + 24, height: m.h + 24 } });
}
await browser.close();
