// BugHerd #169: each homepage step photo at the size the pinned row gives it (a 24rem card,
// the image 24svh tall), one picture per card, at the reviewer-like heights 900 and 735.
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';
const here = path.dirname(fileURLToPath(import.meta.url));
const url = process.argv[2] || pathToFileURL(path.join(here, '..', 'home', 'index.html')).href;
const tag = process.argv[2] ? 'live' : 'local';
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
for (const [w, h] of [[1440, 900], [1512, 735]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, reducedMotion: 'reduce' });
  await page.goto(url, process.argv[2] ? { waitUntil: 'domcontentloaded', timeout: 60000 } : { waitUntil: 'load' });
  await page.waitForTimeout(2500);
  // the pinned card size, without the pin
  await page.addStyleTag({ content: '.ch-path.is-static .pa-track{display:flex!important;flex-wrap:wrap}.ch-path.is-static .pa-card{width:clamp(17rem,27vw,24rem)!important;flex:none!important}.ch-path.is-static .pa-shot img{aspect-ratio:auto!important;height:clamp(9rem,24svh,15rem)!important}.masthead_component{display:none!important}' });
  const shots = page.locator('section#path .pa-shot');
  const n = await shots.count();
  for (let i = 0; i < n; i++) {
    const s = shots.nth(i);
    await s.scrollIntoViewIfNeeded();
    const box = await s.boundingBox();
    await s.screenshot({ path: path.join(here, 'shots', 'bh', `pa169-${tag}-${h}-${i + 1}.png`) });
    console.log(h, i + 1, Math.round(box.width), 'x', Math.round(box.height));
  }
  await page.close();
}
await browser.close();
