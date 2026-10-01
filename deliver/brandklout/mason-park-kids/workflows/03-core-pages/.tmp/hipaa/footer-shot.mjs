// The footer's legal row, live, at 1440 and 390: a crop per width plus each item's text and line.
//
//   node .tmp/hipaa/footer-shot.mjs https://masonparkpediatricdental.com/contacts
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const url = process.argv[2];
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" });
for (const width of [1440, 390]) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.goto(url, { waitUntil: "load", timeout: 60000 });
  await page.waitForTimeout(1500);
  // Termly's banner sits over the bottom of the viewport; hide it for the crop.
  await page.addStyleTag({ content: "#termly-code-snippet-support{display:none!important}" });
  const row = page.locator(".foot_legal");
  // The same row without the new link: how many lines it took before.
  const linesBefore = await row.evaluate((el) => {
    const a = el.querySelector('a[href="/hipaa-disclosure"]');
    const next = a.nextSibling; a.remove();
    const n = new Set([...el.children].map((c) => Math.round(c.getBoundingClientRect().top))).size;
    el.insertBefore(a, next);
    return n;
  });
  await row.scrollIntoViewIfNeeded();
  const items = await row.evaluate((el) => [...el.children].map((c) => {
    const r = c.getBoundingClientRect();
    return { t: c.textContent.trim(), top: Math.round(r.top), h: Math.round(r.height), w: Math.round(r.width) };
  }));
  const tops = [...new Set(items.map((i) => i.top))];
  console.log(`${width}px: ${items.length} items on ${tops.length} line(s) (${linesBefore} without the new link); any item wrapped inside itself: ${items.some((i) => i.h > 30) ? "YES" : "no"}`);
  console.log("  " + items.map((i) => `${i.t}@${tops.indexOf(i.top) + 1}`).join(" | "));
  const file = path.join(HERE, `footer-${new URL(url).hostname}-${width}.png`);
  await row.screenshot({ path: file });
  console.log(`  -> ${file}`);
  await page.close();
}
await browser.close();
