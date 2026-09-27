// Renders album-sheet/picks.html (212 numbered thumbnails of the client's
// Google Photos album) to PNG parts, so the frames can be eyeballed when a
// review asks for "the photo with X in it". Numbers match album-urls.txt lines.
//   node render-sheet.mjs
import { chromium } from "playwright-core";
import path from "node:path";
import { pathToFileURL } from "node:url";

const CHROME = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const here = import.meta.dirname;
const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage({ viewport: { width: 1500, height: 1300 } });
await page.goto(pathToFileURL(path.join(here, "picks.html")).href);
await page.waitForTimeout(3000);
const h = await page.evaluate(() => document.body.scrollHeight);
let k = 0;
for (let y = 0; y < h; y += 1300) {
  k++;
  await page.screenshot({ path: path.join(here, `picks-${k}.png`), fullPage: true, clip: { x: 0, y, width: 1500, height: Math.min(1300, h - y) } });
}
console.log(`height ${h}, ${k} parts`);
await browser.close();
