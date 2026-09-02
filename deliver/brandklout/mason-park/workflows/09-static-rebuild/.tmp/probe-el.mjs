// ===========================================================================
// Look at ONE element, motion on, the way a visitor would: load the page at
// a width, scroll the element into the middle of the window, wait for the
// reveals, screenshot it, and report every <img> inside it (loaded or not,
// natural size, the classes on its frame). A full-page capture cannot tell
// "the mask never opened" from "the image never loaded" from "the image is
// fine"; this can.
//
//   node probe-el.mjs ../home/about-us/index.html ".el-mosaic" [width] [out.png]
// ===========================================================================
import { chromium } from "playwright-core";
import path from "node:path";

const CHROME = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const [target, selector, wArg, outArg] = process.argv.slice(2);
if (!target || !selector) { console.error("usage: node probe-el.mjs <page> <selector> [width] [out.png]"); process.exit(1); }
const url = /^https?:\/\//.test(target) ? target : "file:///" + path.resolve(target).split(path.sep).join("/");
const width = +(wArg || 1440);
const out = path.resolve(outArg || "probe-el.png");

const browser = await chromium.launch({ executablePath: CHROME, args: ["--allow-file-access-from-files"] });
const page = await browser.newPage({ viewport: { width, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 160)); });
// every request that did not come back 2xx/3xx, by URL: a console "Failed to
// load resource" line never says which one
page.on("response", (r) => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
await page.goto(url, { waitUntil: "load" });
await page.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; });
// walk the page once so lazy images and observers wake, then park on the target
const total = await page.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0; y < total; y += 700) { await page.evaluate((v) => window.scrollTo(0, v), y); await page.waitForTimeout(60); }
await page.evaluate((sel) => {
  const el = document.querySelector(sel);
  if (!el) return;
  const r = el.getBoundingClientRect();
  window.scrollTo(0, window.scrollY + r.top - Math.max(0, (window.innerHeight - r.height) / 2));
}, selector);
await page.waitForTimeout(1800);
const report = await page.evaluate((sel) => {
  const el = document.querySelector(sel);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  const imgs = Array.from(el.querySelectorAll("img")).map((im) => {
    const f = im.closest("[data-el], [data-parallax], figure") || im.parentElement;
    const cs = getComputedStyle(im);
    return {
      src: (im.currentSrc || im.src).split("/").slice(-1)[0],
      complete: im.complete, natural: im.naturalWidth + "x" + im.naturalHeight,
      box: Math.round(im.getBoundingClientRect().width) + "x" + Math.round(im.getBoundingClientRect().height),
      opacity: cs.opacity, transform: cs.transform, frame: f ? f.className : "",
      clip: f ? getComputedStyle(f).clipPath : "",
    };
  });
  return { box: Math.round(r.width) + "x" + Math.round(r.height), top: Math.round(r.top), imgs };
}, selector);
if (!report) { console.log("no element matches " + selector); await browser.close(); process.exit(1); }
console.log(`${selector}: ${report.box} at y=${report.top}`);
for (const im of report.imgs) console.log(`  ${im.src.padEnd(44)} ${im.complete ? "loaded" : "PENDING"} ${im.natural.padEnd(10)} box ${im.box.padEnd(9)} op ${im.opacity} clip ${im.clip} [${im.frame}]`);
if (errors.length) console.log("console: " + errors.join(" | "));
const handle = await page.$(selector);
await handle.screenshot({ path: out });
console.log("-> " + out);
await browser.close();
