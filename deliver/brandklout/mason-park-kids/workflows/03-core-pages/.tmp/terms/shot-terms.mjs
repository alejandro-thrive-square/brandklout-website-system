// /terms-of-service, live, at 1440 and 390: the arrival (one viewport) and the whole page, plus
// horizontal overflow and the chapter count.
//
//   node .tmp/terms/shot-terms.mjs https://staging.masonparkpediatricdental.com/terms-of-service/
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const url = process.argv[2];
const host = new URL(url).hostname;
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" });
for (const width of [1440, 390]) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.goto(url, { waitUntil: "load", timeout: 60000 });
  await page.addStyleTag({ content: "html{scroll-behavior:auto!important}#termly-code-snippet-support{display:none!important}" });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(HERE, `shot-${host}-${width}-top.png`) });
  // Walk down the page so every scroll-driven reveal has run, then back to the top.
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 400) { await page.evaluate((yy) => window.scrollTo(0, yy), y); await page.waitForTimeout(120); }
  await page.waitForTimeout(1200);
  const info = await page.evaluate(() => ({
    overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    chapters: document.querySelectorAll("main [data-chapter]").length,
    h1: document.querySelector("h1")?.textContent.trim(),
  }));
  console.log(`${width}px: height ${h}, horizontal overflow ${info.overflowX}px, ${info.chapters} chapters, h1 "${info.h1}"`);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
  const file = path.join(HERE, `shot-${host}-${width}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`  -> ${file}`);
  await page.close();
}
await browser.close();
