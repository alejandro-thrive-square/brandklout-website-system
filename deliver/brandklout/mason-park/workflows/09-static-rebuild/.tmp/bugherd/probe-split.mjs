// After the reveals: no heading should still be split into frozen lines
// (2026-09-16: live, lines measured before the display face loaded broke the
// home hero mid-sentence). Scrolls the page through, then counts .jr-line.
//   node probe-split.mjs <url> [engine] > log
import { chromium, webkit } from "playwright-core";
const [url, engine = "webkit"] = process.argv.slice(2);
const b = engine === "webkit" ? await webkit.launch() : await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
const p = await b.newPage({ viewport: { width: 1512, height: 652 } });
p.on("pageerror", (e) => console.log(`pageerror ${e.message}`));
await p.goto(url, { waitUntil: "load" });
await p.waitForTimeout(2500);
const H = await p.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; return document.documentElement.scrollHeight; });
for (let y = 0; y < H; y += 400) { await p.evaluate((y) => window.scrollTo(0, y), y); await p.waitForTimeout(120); }
await p.waitForTimeout(2000);
const r = await p.evaluate(() => ({
  lines: document.querySelectorAll(".jr-line").length,
  split: [...document.querySelectorAll("[data-split]")].length,
  h1: document.querySelector(".ar-title")?.getBoundingClientRect().height,
  h1text: document.querySelector(".ar-title")?.innerText.replace(/\n/g, " / "),
}));
console.log(url, JSON.stringify(r));
await b.close();
