// How many lines did SplitText actually make, and against which font did it
// measure them? Run on both sides to tell a real difference from a timing one.
//   node split-count.mjs ../home/index.html
//   node split-count.mjs https://mason-park-kids.up.railway.app/
import { chromium } from "playwright-core";
import path from "node:path";
import { settle } from "./settle.mjs";

const CHROME = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const t = process.argv[2] || "../home/index.html";
const url = /^https?:\/\//.test(t) ? t : "file:///" + path.resolve(t).split(path.sep).join("/");

const browser = await chromium.launch({ executablePath: CHROME, args: ["--allow-file-access-from-files"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

// When did each face finish loading, relative to when the split ran?
await page.addInitScript(() => {
  window.__marks = [];
  document.addEventListener("DOMContentLoaded", () => window.__marks.push(["domready", performance.now()]));
  if (document.fonts) document.fonts.ready.then(() => window.__marks.push(["fontsready", performance.now()]));
});

await page.goto(url, { waitUntil: "load", timeout: 60000 });
await page.waitForTimeout(2500);
await settle(page);

const out = await page.evaluate(() => {
  const h1 = document.querySelector(".ar-title");
  return {
    marks: window.__marks,
    fontStatus: document.fonts ? document.fonts.status : "?",
    totalLines: document.querySelectorAll(".jr-line").length,
    h1Lines: h1 ? h1.querySelectorAll(".jr-line").length : null,
    h1Height: h1 ? +h1.getBoundingClientRect().height.toFixed(1) : null,
    h1Width: h1 ? +h1.getBoundingClientRect().width.toFixed(1) : null,
    h1Text: h1 ? Array.from(h1.querySelectorAll(".jr-line")).map((l) => (l.textContent || "").trim()) : null,
  };
});
console.log(url);
console.log(JSON.stringify(out, null, 2));
await browser.close();
