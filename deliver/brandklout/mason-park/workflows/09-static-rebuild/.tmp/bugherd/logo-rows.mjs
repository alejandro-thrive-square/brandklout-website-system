// How close to the bottom edge does the logo artwork run? (BugHerd #3)
//   node logo-rows.mjs > logo-rows.log
import fs from "node:fs";
import { chromium } from "playwright-core";
const files = ["Dentist-Katy-TX-Logo-2.webp", "Dentist-Katy-TX-Logo-2-370x142.webp", "Dentist-Katy-TX-Logo-2-300x115.webp"];
const b = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
const p = await b.newPage();
for (const f of files) {
  const uri = "data:image/webp;base64," + fs.readFileSync(`../../home/assets/uploads/2023/08/${f}`).toString("base64");
  const r = await p.evaluate(async (uri) => {
    const im = new Image(); im.src = uri; await im.decode();
    const c = document.createElement("canvas"); c.width = im.naturalWidth; c.height = im.naturalHeight;
    const x = c.getContext("2d"); x.drawImage(im, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height).data;
    let last = -1, first = -1;
    for (let y = 0; y < c.height; y++) { let on = false; for (let i = 0; i < c.width; i++) if (d[(y * c.width + i) * 4 + 3] > 20) { on = true; break; } if (on) { if (first < 0) first = y; last = y; } }
    return { w: c.width, h: c.height, firstInkRow: first, lastInkRow: last, bottomGap: c.height - 1 - last };
  }, uri);
  console.log(f, JSON.stringify(r));
}
await b.close();
