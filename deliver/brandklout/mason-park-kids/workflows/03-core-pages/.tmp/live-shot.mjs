// A full-page capture of a LIVE url at one width, with the overflow and
// small-text checks shot.mjs runs on local files.
//
//   node live-shot.mjs https://mason-park-kids.up.railway.app/ 390
import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CHROME = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const HERE = path.dirname(fileURLToPath(import.meta.url));
const url = process.argv[2];
const width = +(process.argv[3] || 390);
const mobile = width < 700;
const browser = await chromium.launch({ executablePath: CHROME });
const ctx = await browser.newContext({ viewport: { width, height: mobile ? 844 : 900 }, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
const page = await ctx.newPage();
const problems = [];
page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource|cloudflare/.test(m.text())) problems.push(m.text().slice(0, 140)); });
page.on("pageerror", (e) => problems.push("pageerror: " + e.message.slice(0, 140)));
await page.goto(url, { waitUntil: "load", timeout: 120000 });
await page.waitForTimeout(2000);
const total = await page.evaluate(() => document.body.scrollHeight);
for (let y = 0; y < total; y += 500) { await page.evaluate((n) => window.scrollTo({ top: n, behavior: "instant" }), y); await page.waitForTimeout(120); }
await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
await page.waitForTimeout(800);
const r = await page.evaluate(() => {
  const de = document.documentElement;
  const tiny = [];
  for (const el of document.querySelectorAll("p, li, span, cite, dd, dt, summary, figcaption, small, b, a")) {
    if (!el.textContent.trim()) continue;
    const px = parseFloat(getComputedStyle(el).fontSize);
    if (px < 12 && tiny.length < 5) tiny.push(el.tagName.toLowerCase() + "." + String(el.className || "").split(" ")[0] + " " + px.toFixed(1) + "px");
  }
  return { overflow: de.scrollWidth - de.clientWidth, height: document.body.scrollHeight, tiny, root: getComputedStyle(de).fontSize };
});
const out = path.join(HERE, "shots", "live", `${(new URL(url).pathname.replace(/\//g, "_").replace(/^_$/, "home").replace(/^_/, "")) || "home"}-${width}.png`);
fs.mkdirSync(path.dirname(out), { recursive: true });
await page.screenshot({ path: out, fullPage: true });
console.log(`${url} @ ${width}: height ${r.height}px, root ${r.root}, overflow ${r.overflow}px${r.tiny.length ? ", TEXT UNDER 12px: " + r.tiny.join(", ") : ""}${problems.length ? "\n  " + problems.join("\n  ") : ""}`);
console.log("-> " + out);
await browser.close();
process.exit(r.overflow > 1 || r.tiny.length || problems.length ? 1 : 0);
