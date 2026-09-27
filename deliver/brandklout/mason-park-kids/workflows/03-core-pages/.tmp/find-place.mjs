// Resolve the Google Maps place for "Mason Park Dental for Kids" so the embed stops
// pointing at the adult practice (BugHerd #29 / #40). Headless Chrome: maps.google.com
// needs JS, and a plain fetch returns an interstitial.
// node find-place.mjs > find-place.log
import { chromium } from 'playwright-core';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const ctx = await browser.newContext({ locale: 'en-US', viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const targets = [
  'https://www.google.com/maps/search/Mason+Park+Dental+for+Kids+21830+Kingsland+Blvd+Katy+TX/',
  'https://www.google.com/maps/search/Mason+Park+Dental+of+Katy+21830+Kingsland+Blvd+Katy+TX/',
];

for (const t of targets) {
  console.log('=== ', t);
  await page.goto(t, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(6000);
  console.log('  landed:', page.url());
  const html = await page.content();
  const ftid = [...new Set(html.match(/0x[0-9a-f]{16}:0x[0-9a-f]{16}/g) || [])];
  console.log('  ftid:', ftid.slice(0, 10).join(', ') || '(none)');
  const ll = [...new Set(page.url().match(/@-?\d+\.\d+,-?\d+\.\d+,\d+z/g) || [])];
  console.log('  ll:', ll.join(', ') || '(none)');
  const names = [...new Set(html.match(/Mason Park Dental[^"<>\\]{0,40}/g) || [])];
  console.log('  names:', names.slice(0, 10).join(' | ') || '(none)');
  const h1 = await page.locator('h1').allInnerTexts().catch(() => []);
  console.log('  h1:', JSON.stringify(h1.slice(0, 5)));
  await page.screenshot({ path: t.includes('for+Kids') ? 'place-kids.png' : 'place-adult.png' });
}

await browser.close();
