// The header at 2x on a page's first screen, motion on, fonts loaded: what the
// logo actually looks like against the arrival (BugHerd #3, "the bottom of the
// logo is being cut off"). Writes header-<slug>.png beside this file.
//   node shot-header.mjs ../../home/index.html ../../home/about-us/index.html
import { chromium } from "playwright-core";
import path from "node:path";
import { pathToFileURL } from "node:url";

const CHROME = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const browser = await chromium.launch({ executablePath: CHROME });
for (const file of process.argv.slice(2)) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  await page.goto(/^https?:/.test(file) ? file : pathToFileURL(path.resolve(file)).href, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1800);
  const slug = /^https?:/.test(file) ? "live-" + (new URL(file).pathname.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "") || "home") : path.basename(path.dirname(path.resolve(file))) || "home";
  await page.screenshot({ path: path.join(import.meta.dirname, `header-${slug}.png`), clip: { x: 0, y: 0, width: 720, height: 240 } });
  await page.screenshot({ path: path.join(import.meta.dirname, `first-${slug}.png`), clip: { x: 0, y: 0, width: 1440, height: 900 } });
  console.log(`header-${slug}.png, first-${slug}.png`);
  await page.close();
}
await browser.close();
