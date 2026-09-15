// Shoot named elements, centred in the viewport, at the reviewer's Safari size.
//
//   node shot-sel.mjs <engine> <origin> <out-dir> <WxH> "<name>|<path>|<css selector>" ... > log
//   node shot-sel.mjs webkit https://staging.masonparkdental.com sel-live 1512x735 "5|/|.re-media"
import fs from "node:fs";
import { chromium, webkit } from "playwright-core";

const [engine, origin, out, size, ...specs] = process.argv.slice(2);
const [w, h] = size.split("x").map(Number);
fs.mkdirSync(out, { recursive: true });
const CHROME = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const browser = engine === "webkit" ? await webkit.launch() : await chromium.launch({ executablePath: CHROME });
const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
let at = "";
for (const spec of specs) {
  const [name, path, sel] = spec.split("|");
  if (path !== at) {
    await page.goto(origin + path, { waitUntil: "load" });
    await page.waitForTimeout(2500);
    at = path;
  }
  // Walk down in steps so scroll-triggered reveals fire on the way, as they do for a reader.
  const found = await page.evaluate(async (sel) => {
    document.documentElement.style.scrollBehavior = "auto";
    const el = document.querySelector(sel);
    if (!el) return null;
    const target = () => el.getBoundingClientRect().top + scrollY - Math.max(0, (innerHeight - el.getBoundingClientRect().height) / 2);
    const end = Math.max(0, target());
    for (let y = scrollY; Math.abs(y - end) > 200; y += Math.sign(end - y) * 200) {
      scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    scrollTo(0, end);
    const r = el.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top + scrollY) };
  }, sel);
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${out}/${name}.png` });
  const box = found && (await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    const r = el.getBoundingClientRect();
    const img = el.tagName === "IMG" ? el : el.querySelector("img");
    const cs = img && getComputedStyle(img);
    return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), img: img && img.currentSrc.split("/").pop(), fit: cs && `${cs.objectFit} ${cs.objectPosition}` };
  }, sel));
  console.log(`${name} ${path} ${sel} -> ${found ? JSON.stringify(box) : "NOT FOUND"}`);
}
await browser.close();
