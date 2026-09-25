// The favicon set (2026-09-25): the practice's tree mark in white on the site's
// copper (#8c6349, the theme-color). Chrome is the image tool here (no sharp).
//   node favicon/render-favicon.mjs   -> ../home/assets/uploads/2026/09/mp-favicon-<size>.png
import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, "..", "..", "home", "assets", "uploads", "2026", "09");
const mark = "data:image/png;base64," + fs.readFileSync(path.join(OUT, "mp-tree-mark.png")).toString("base64");
const SIZES = [512, 192, 180, 48, 32];
const br = await chromium.launch({ channel: "chrome" });
const page = await br.newPage({ viewport: { width: 600, height: 600 } });
for (const s of SIZES) {
  // Small sizes get a fatter stroke (a white drop-shadow ring) so the branches survive.
  const ring = s <= 48 ? Math.max(0.6, s / 40) : 0;
  const shadow = ring ? `filter: brightness(0) invert(1) drop-shadow(0 0 ${ring}px #fff) drop-shadow(0 0 ${ring / 2}px #fff);` : "filter: brightness(0) invert(1);";
  await page.setContent(`<html><body style="margin:0;background:transparent">
    <div id="b" style="width:${s}px;height:${s}px;background:#8c6349;display:grid;place-items:center;${s === 180 ? "" : `border-radius:${Math.round(s * 0.2)}px;`}">
      <img src="${mark}" style="height:${Math.round(s * 0.8)}px;${shadow}">
    </div></body></html>`);
  await page.waitForFunction(() => document.querySelector("img").complete);
  await page.screenshot({ path: path.join(OUT, `mp-favicon-${s}.png`), clip: { x: 0, y: 0, width: s, height: s }, omitBackground: true });
  console.log(`mp-favicon-${s}.png`);
}
await br.close();
