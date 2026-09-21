// Look at what this round changed, on the files as they stand: the hours table
// without its Note column, the "Come in" card with its directions link, the
// comfort card's new sentence, and the sticker's ink.
// node look-0921.mjs > look-0921.log
import path from 'node:path';
import { chromium } from 'playwright-core';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(HERE, '..', 'home');
const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const url = (p) => 'file:///' + path.join(SITE, p).replace(/\\/g, '/');

const SHOTS = [
  ['contacts/index.html', '#ways .sq-grid', 'look-ways'],
  ['contacts/index.html', '#hours .fi-matrix', 'look-hours'],
  ['contacts/index.html', '#invitation .iv-facts', 'look-facts'],
  ['index.html', '#comfort .cf-grid', 'look-comfort'],
  ['index.html', '#first .ft-media', 'look-sticker'],
];

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.addInitScript(() => { document.documentElement.style.scrollBehavior = 'auto'; });

let current = '';
for (const [file, sel, name] of SHOTS) {
  if (file !== current) {
    await page.goto(url(file), { waitUntil: 'load', timeout: 60000 });
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(2500);
    current = file;
  }
  const el = page.locator(sel).first();
  await el.scrollIntoViewIfNeeded().catch(() => {});
  await page.waitForTimeout(1500);
  const box = await el.boundingBox();
  if (!box) { console.log(`${name}: ${sel} has no box`); continue; }
  const vp = page.viewportSize();
  const clip = {
    x: Math.max(0, box.x - 10), y: Math.max(0, box.y - 10),
    width: Math.min(vp.width - Math.max(0, box.x - 10), box.width + 20),
    height: Math.min(vp.height - Math.max(0, box.y - 10), box.height + 20),
  };
  await page.screenshot({ path: `${name}.png`, clip });
  console.log(`${name}.png  ${sel}  ${Math.round(clip.width)}x${Math.round(clip.height)}`);
}
await browser.close();
