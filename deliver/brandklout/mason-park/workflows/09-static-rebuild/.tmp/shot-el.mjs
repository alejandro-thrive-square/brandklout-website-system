/**
 * One element of one page, after the page has settled on it.
 *
 *   node shot-el.mjs <page.html|url> <selector> <out.png> [width] [height] [--reduce]
 *
 * shot.mjs walks the whole page and photographs it on the move, which shoots a
 * mask reveal or a lazy image mid-arrival. This scrolls the selector to the
 * top of the window, waits for it to finish, and reports what every image
 * inside it actually loaded.
 */
import { chromium } from "playwright-core";
import nodePath from "node:path";

const CHROME = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const [target, selector, out, w = "1440", h = "900"] = args;
if (!target || !selector || !out) throw new Error("usage: node shot-el.mjs <page> <selector> <out.png> [width] [height] [--reduce]");
const url = /^https?:\/\//.test(target) ? target : "file:///" + nodePath.resolve(target).split("\\").join("/");

const browser = await chromium.launch({ executablePath: CHROME, args: ["--allow-file-access-from-files"] });
const context = await browser.newContext({
  viewport: { width: +w, height: +h },
  reducedMotion: process.argv.includes("--reduce") ? "reduce" : "no-preference",
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(url, { waitUntil: "load", timeout: 60000 });
await page.bringToFront();
await page.waitForTimeout(1200);
const offset = Number(process.env.OFFSET || 0);
await page.evaluate(([sel, off]) => {
  document.documentElement.style.scrollBehavior = "auto";
  const el = document.querySelector(sel);
  if (!el) throw new Error("no element " + sel);
  window.scrollTo(0, el.getBoundingClientRect().top + window.pageYOffset - 110 + off);
}, [selector, offset]);
await page.waitForTimeout(2600);
const report = await page.evaluate((sel) => {
  const el = document.querySelector(sel);
  return [...el.querySelectorAll("img")].map((im) => {
    const r = im.getBoundingClientRect();
    const cs = getComputedStyle(im);
    return { src: (im.currentSrc || im.src).split("/").pop(), natural: im.naturalWidth, box: `${Math.round(r.width)}x${Math.round(r.height)}`, opacity: cs.opacity, clip: getComputedStyle(im.closest("[data-el]") || im).clipPath };
  });
}, selector);
for (const r of report) console.log(JSON.stringify(r));
for (const e of errors) console.log("pageerror:", e);
await page.screenshot({ path: out });
await browser.close();
