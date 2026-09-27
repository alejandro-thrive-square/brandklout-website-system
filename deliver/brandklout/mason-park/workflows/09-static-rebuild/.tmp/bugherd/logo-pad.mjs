// BugHerd #3 (reopened 2026-09-15): the header logo's artwork runs to every
// edge of its file (bottomGap 0 in logo-rows.log), so a scaled, filtered
// layer in Safari can shave the foot of DENTAL. Re-export the same artwork
// with transparent margin inside the file, lossless.
//   node logo-pad.mjs > logo-pad.log
import fs from "node:fs";
import { chromium } from "playwright-core";
const SRC = "../../home/assets/uploads/2023/08/Dentist-Katy-TX-Logo-2.webp";
const OUT = "../../home/assets/uploads/2026/09/mp-logo-nav-422x180.png";
const PAD_X = 8, PAD_Y = 12;
const b = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
const p = await b.newPage();
const uri = "data:image/webp;base64," + fs.readFileSync(SRC).toString("base64");
const data = await p.evaluate(async ([uri, px, py]) => {
  const im = new Image(); im.src = uri; await im.decode();
  const c = document.createElement("canvas");
  c.width = im.naturalWidth + 2 * px; c.height = im.naturalHeight + 2 * py;
  c.getContext("2d").drawImage(im, px, py);
  return { url: c.toDataURL("image/png"), w: c.width, h: c.height };
}, [uri, PAD_X, PAD_Y]);
fs.writeFileSync(OUT, Buffer.from(data.url.split(",")[1], "base64"));
console.log(`wrote ${OUT} ${data.w}x${data.h} ${fs.statSync(OUT).size} bytes`);
await b.close();
