// BugHerd #169 on the live homepage: six step photos, each the planned frame, each actually decoded.
import { chromium } from 'playwright-core';
const url = process.argv[2] || 'https://staging.masonparkpediatricdental.com/';
const want = ['rv-desk-phone-2', 'rv-building', 'smile', 'rv-tv-chair', 'rv-tablet-consult', 'rv-anticavity-kids'];
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
const imgs = page.locator('section#path .pa-shot img');
let fails = 0;
const n = await imgs.count();
for (let i = 0; i < n; i++) {
  const el = imgs.nth(i);
  await el.evaluate(e => { e.loading = 'eager'; });
  await el.evaluate(e => e.decode().catch(() => {}));
  const [src, w, pos] = await el.evaluate(e => [e.currentSrc.split('/').pop(), e.naturalWidth, getComputedStyle(e).objectPosition]);
  const good = src.includes(want[i]) && w > 0;
  if (!good) fails++;
  console.log(good ? 'PASS' : 'FAIL', i + 1, src, w + 'px', pos);
}
if (n !== 6) { fails++; console.log('FAIL count', n); }
await browser.close();
console.log(fails ? `${fails} FAILED` : 'all passed');
