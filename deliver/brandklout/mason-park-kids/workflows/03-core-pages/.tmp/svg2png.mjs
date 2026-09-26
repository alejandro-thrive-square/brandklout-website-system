// Rasterise an SVG with the installed Chrome: node svg2png.mjs in.svg out.png <width>
import fs from "node:fs";
import { chromium } from "playwright-core";
const [, , inp, out, w] = process.argv;
const svg = fs.readFileSync(inp, "utf8");
const b = await chromium.launch({ channel: "chrome" });
const p = await b.newPage({ deviceScaleFactor: 1 });
const W = +w, H = Math.round(W * 479.25 / 299.25);
await p.setViewportSize({ width: W, height: H });
await p.setContent(`<html><body style="margin:0;background:transparent"><img style="display:block;width:${W}px;height:${H}px" src="data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}"></body></html>`);
await p.waitForTimeout(500);
await p.screenshot({ path: out, omitBackground: true });
await b.close();
console.log("wrote", out, W, H);
