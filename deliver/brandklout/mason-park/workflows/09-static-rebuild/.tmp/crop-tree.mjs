// Crops the tree out of the practice's logo (Dentist-Katy-TX-Logo-2.webp,
// 406x156: the tree stands between MASON and PARK) into a transparent PNG,
// for the seal marks on About and Reviews. BugHerd #36 and #48 (2026-09-10):
// "change to the tree", "use the tree in the middle not the star".
//
//   node crop-tree.mjs            # writes ../home/assets/uploads/2026/09/mp-tree-mark.png
//   node crop-tree.mjs --probe    # writes tree-probe.png, the logo at 4x with a 10px grid, to find the box
//
// Rendered through Chrome at 4x rather than an image library: sharp is not in
// this workflow's node_modules and the logo is a webp with transparency, which
// Chrome decodes and re-encodes to PNG with the alpha intact (omitBackground).
// The logo is opened with page.goto(file://) and restyled in place — see the
// gotcha in frame.mjs.
import { chromium } from "playwright-core";
import path from "node:path";
import { pathToFileURL } from "node:url";

const CHROME = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const here = import.meta.dirname;
const LOGO = path.join(here, "..", "home", "assets", "uploads", "2023", "08", "Dentist-Katy-TX-Logo-2.webp");
const OUT = path.join(here, "..", "home", "assets", "uploads", "2026", "09", "mp-tree-mark.png");
const PROBE = process.argv.includes("--probe");
const SCALE = 4;
// The tree's box in the logo's own 406x156 pixels. Found with --probe.
const BOX = { x: 194, y: 0, w: 76, h: 116 };

const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage({ viewport: { width: 406 * SCALE, height: 156 * SCALE }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(LOGO).href);
await page.evaluate(([SCALE, PROBE]) => {
  document.body.style.cssText = `margin:0;overflow:hidden;background:${PROBE ? "#fff" : "transparent"}`;
  document.documentElement.style.background = "transparent";
  const i = document.querySelector("img");
  i.style.cssText = `position:absolute;left:0;top:0;width:${406 * SCALE}px;height:${156 * SCALE}px;display:block;max-width:none`;
  if (PROBE) {
    const g = document.createElement("div");
    g.style.cssText = `position:absolute;inset:0;background-image:linear-gradient(to right, rgba(255,0,0,.35) 1px, transparent 1px),linear-gradient(to bottom, rgba(255,0,0,.35) 1px, transparent 1px);background-size:${10 * SCALE}px ${10 * SCALE}px`;
    document.body.appendChild(g);
  }
}, [SCALE, PROBE]);
await page.waitForTimeout(300);
if (PROBE) {
  await page.screenshot({ path: path.join(here, "tree-probe.png") });
  console.log("wrote tree-probe.png (grid every 10 logo px)");
} else {
  await page.screenshot({ path: OUT, omitBackground: true, clip: { x: BOX.x * SCALE, y: BOX.y * SCALE, width: BOX.w * SCALE, height: BOX.h * SCALE } });
  console.log(`wrote ${OUT} (${BOX.w * SCALE}x${BOX.h * SCALE})`);
}
await browser.close();
