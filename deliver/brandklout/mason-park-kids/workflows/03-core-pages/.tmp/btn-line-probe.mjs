// BugHerd #38: "There is a line on the Book online button" on /contacts.
// The reviewer is Safari 1512x735, so reproduce in WebKit, and in Chrome for contrast.
// node btn-line-probe.mjs [local|live] > btn-line-probe.log
import { webkit, chromium } from 'playwright-core';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const mode = process.argv[2] || 'local';
const url =
  mode === 'live'
    ? 'https://staging.masonparkpediatricdental.com/contacts/'
    : 'file:///' + path.join(here, '..', 'home', 'contacts', 'index.html').replace(/\\/g, '/');

for (const [name, launcher, opts] of [
  ['webkit', webkit, {}],
  ['chrome', chromium, { executablePath: CHROME }],
]) {
  const browser = await launcher.launch({ headless: true, ...opts });
  const page = await browser.newPage({ viewport: { width: 1512, height: 735 } });
  await page.addInitScript(() => {
    document.documentElement.style.scrollBehavior = 'auto';
  });
  await page.goto(url, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(1500);
  // walk the whole page so every reveal fires, then come back to the invitation
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 400) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 40));
    }
  });
  await page.waitForTimeout(2500);
  const btn = page.locator('#invitation .iv-actions a.button.is-sun').first();
  await btn.scrollIntoViewIfNeeded();
  await page.waitForTimeout(2500);

  const box = await btn.boundingBox();
  console.log(`--- ${name} ${mode}  box:`, JSON.stringify(box));
  const info = await btn.evaluate((el) => {
    const cs = getComputedStyle(el);
    const be = getComputedStyle(el, '::before');
    const af = getComputedStyle(el, '::after');
    const pick = (s) => ({
      content: s.content, bg: s.backgroundImage, bgc: s.backgroundColor, z: s.zIndex,
      pos: s.position, inset: [s.top, s.right, s.bottom, s.left].join(' '),
      h: s.height, w: s.width, transform: s.transform, border: s.border, boxShadow: s.boxShadow,
    });
    return {
      self: { ...pick(cs), isolation: cs.isolation, overflow: cs.overflow, textDecoration: cs.textDecorationLine, bgClip: cs.backgroundClip, bgSize: cs.backgroundSize, bgRepeat: cs.backgroundRepeat, bgPos: cs.backgroundPosition },
      before: pick(be),
      after: pick(af),
    };
  });
  console.log(JSON.stringify(info, null, 2));

  if (box) {
    await page.screenshot({
      path: `btn-line-${name}-${mode}.png`,
      clip: { x: Math.max(0, box.x - 30), y: Math.max(0, box.y - 30), width: box.width + 260, height: box.height + 60 },
    });
  }
  await browser.close();
}
