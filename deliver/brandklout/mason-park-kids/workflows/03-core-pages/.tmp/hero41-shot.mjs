// BugHerd #41: the /special-offers hero at the reviewer's width and the usual ones.
// node hero41-shot.mjs [url]   (default: the local file)
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';
const here = path.dirname(fileURLToPath(import.meta.url));
const url = process.argv[2] || pathToFileURL(path.join(here, '..', 'home', 'special-offers', 'index.html')).href;
const tag = process.argv[2] ? 'live' : 'local';
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
for (const [w, h] of [[2560, 1305], [1512, 735], [1440, 900], [390, 844]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(2500);
  const info = await page.evaluate(() => { const i = document.querySelector('.ar-bg img'); return { src: i.currentSrc.split('/').pop(), pos: getComputedStyle(i).objectPosition, box: [i.clientWidth, i.clientHeight] }; });
  console.log(w, h, JSON.stringify(info));
  await page.screenshot({ path: path.join(here, `hero41-${tag}-${w}.png`) });
  await page.close();
}
await browser.close();
