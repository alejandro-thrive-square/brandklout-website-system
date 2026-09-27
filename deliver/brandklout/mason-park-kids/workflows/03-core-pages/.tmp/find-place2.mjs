// Confirm which ftid is the pediatric listing, and render the candidate embed so we can
// look at it before shipping (BugHerd #29 / #40).
// node find-place2.mjs > find-place2.log
import { chromium } from 'playwright-core';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const ctx = await browser.newContext({ locale: 'en-US', viewport: { width: 1200, height: 900 } });
const page = await ctx.newPage();

const ftids = ['0x86412740e7dd5def:0xfa1ab8c6e696e133', '0x8641277706112ec1:0x98941d027afdec7b'];
for (const f of ftids) {
  const u = `https://www.google.com/maps/place/?q=place_id:&ftid=${f}`;
  await page.goto(u, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(6000);
  const title = await page.title();
  const h1 = await page.locator('h1').allInnerTexts().catch(() => []);
  console.log(f);
  console.log('  title:', title);
  console.log('  h1:', JSON.stringify(h1.slice(0, 3)));
  console.log('  url:', page.url().slice(0, 200));
  const addr = await page.locator('button[data-item-id="address"]').first().innerText().catch(() => '(none)');
  console.log('  addr:', addr.replace(/\s+/g, ' '));
  const cat = await page.locator('button[jsaction*="category"]').first().innerText().catch(() => '(none)');
  console.log('  category:', cat.replace(/\s+/g, ' '));
  console.log('');
}
await browser.close();
