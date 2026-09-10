// Scrape Unsplash search results (SSR) with the installed Chrome via playwright-core.
// usage: node unsplash-scrape.mjs out.json "query one" "query two" ...
import { chromium } from "playwright-core";
import fs from "node:fs";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const [out, ...queries] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const ctx = await browser.newContext({
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  locale: "en-US",
  viewport: { width: 1400, height: 900 },
});
const page = await ctx.newPage();
const result = {};
for (const q of queries) {
  const url = "https://unsplash.com/s/photos/" + encodeURIComponent(q.replace(/\s+/g, "-")) + "?orientation=landscape";
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForSelector('img[srcset*="images.unsplash.com/photo-"]', { timeout: 30000 });
    await page.waitForTimeout(1500);
    const items = await page.evaluate(() => {
      const seen = new Map();
      for (const i of document.querySelectorAll('img[srcset*="images.unsplash.com/photo-"], img[src*="images.unsplash.com/photo-"]')) {
        const m = (i.srcset || i.src).match(/photo-[A-Za-z0-9_-]+/);
        if (!m || seen.has(m[0])) continue;
        const a = i.closest("a");
        seen.set(m[0], { id: m[0], alt: i.alt, href: a ? a.getAttribute("href") : null });
      }
      return [...seen.values()].slice(0, 14);
    });
    result[q] = { url: page.url(), items };
    console.log(q, "->", items.length);
  } catch (e) {
    result[q] = { url, error: String(e).slice(0, 200) };
    console.log(q, "FAILED", String(e).slice(0, 120));
  }
}
await browser.close();
fs.writeFileSync(out, JSON.stringify(result, null, 2));
