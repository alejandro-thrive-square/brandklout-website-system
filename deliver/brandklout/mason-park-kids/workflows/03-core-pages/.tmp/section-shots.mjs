// ===========================================================================
// VIEWPORT CROPS OF THE HOMEPAGE'S CHAPTERS, the way a reviewer sees them.
//
//   node section-shots.mjs local [width]    ../home/index.html from disk
//   node section-shots.mjs live  [width]    https://staging.masonparkpediatricdental.com/
//   (redirect stdout to a file; never pipe a Node script on this machine)
//
// Written for BugHerd round one (2026-09-15). The full-page PNGs from
// shot.mjs are 16,000px tall and show a pinned scene as empty ground; a
// BugHerd note is about what one viewport looks like at one scroll position.
// This scrolls to each chapter, lets the scrubbed scenes catch up, and
// photographs the window. It also answers the two motion questions a PNG
// cannot: does the review rail move by itself, and does it stop on hover.
// ===========================================================================
import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CHROME = (fs.readFileSync(path.join(HERE, "shot.mjs"), "utf8").match(/const CHROME\s*=\s*["'`]([^"'`]+)["'`]/) || [])[1]
  || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const mode = process.argv[2] || "local";
const W = parseInt(process.argv[3] || "1440", 10);
const H = W < 500 ? 844 : 900;
const url = mode === "live"
  ? "https://staging.masonparkpediatricdental.com/"
  : "file:///" + path.resolve(HERE, "..", "home", "index.html").split(path.sep).join("/");
const OUT = path.join(HERE, "shots", `bh-${mode}-${W}`);
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: CHROME, args: ["--allow-file-access-from-files"] });
const page = await browser.newPage({ viewport: { width: W, height: H } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
await page.goto(url, { waitUntil: "load", timeout: 60000 });
await page.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; });
const wait = (ms) => page.waitForTimeout(ms);

async function at(name, fn, ms = 2200) {
  await page.evaluate(fn);
  await wait(ms);
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
  console.log("shot", name);
}
const center = (sel) => `(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return; const r = el.getBoundingClientRect(); window.scrollTo(0, window.scrollY + r.top + r.height / 2 - innerHeight / 2); })()`;

await wait(3000);
await at("01-hero", "window.scrollTo(0, 0)", 1500);
const pill = await page.evaluate(() => {
  const a = document.querySelector('.masthead_link[aria-current="page"]');
  if (!a) return null;
  const s = getComputedStyle(a);
  return { text: a.textContent, color: s.color, bg: s.backgroundColor };
});
console.log("current pill over hero:", JSON.stringify(pill));
await at("02-first", center(".ft-media"));
await at("03-grow-sdf", center(".gr-stage:nth-of-type(3)"));
await at("04-grow-teen", center(".gr-stage:nth-of-type(5)"));
await at("05-comfort", center(".cf-shot"));
await at("06-people", center(".pe-copy"));
await at("07-band", center(".pe-band"));
// The path is pinned: walk through the pin by fractions of its spacer.
for (const [i, k] of [[0, 0.05], [1, 0.4], [2, 0.75], [3, 1.0]]) {
  await at(`08-path-${i}`, `(() => { const s = document.querySelector('#path'); const sp = s.querySelector('.pin-spacer') || s; const top = window.scrollY + sp.getBoundingClientRect().top; const run = Math.max(0, sp.offsetHeight - innerHeight); window.scrollTo(0, top + run * ${k}); })()`, 1800);
}
await at("09-proof-head", center("#proof h2"));
// The write-on must be finished once the quote's middle is at mid-window.
await at("10-quote", center(".pr-quote"), 2500);
const grey = await page.evaluate(() => {
  const words = [...document.querySelectorAll(".pr-quote .jr-word")];
  const lit = words.filter((w) => { const c = getComputedStyle(w).color.match(/\d+/g).map(Number); return c[0] < 90; }).length;
  return `${lit}/${words.length} words written`;
});
console.log("quote at mid-window:", grey);
await at("11-rail", center(".pr-rail"), 1000);
const tx = () => page.evaluate(() => { const r = document.querySelector("[data-rail]"); return r ? new DOMMatrix(getComputedStyle(r).transform).m41 : null; });
const a = await tx(); await wait(2000); const b = await tx();
console.log(`rail drift in 2s, pointer away: ${a} -> ${b}`);
const box = await page.locator(".pr-rail").boundingBox();
if (box) await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
await wait(400);
const c = await tx(); await wait(2000); const d = await tx();
console.log(`rail drift in 2s, pointer on it: ${c} -> ${d}`);
await page.mouse.move(5, 5);
await at("12-invite", center(".iv-shot"));
console.log("page errors:", errors.length ? errors.join(" | ") : "none");
await browser.close();
