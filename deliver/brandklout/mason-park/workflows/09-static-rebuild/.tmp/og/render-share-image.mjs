// The fallback share image (2026-09-25): 1200x630, the ratio every network crops link
// previews to, cut from the Contact hero (the front desk on a call). Used only by pages
// with no picture of their own; every other page shares its own hero.
//   node og/render-share-image.mjs  -> ../home/assets/uploads/2026/09/mp-share-default-1200x630.jpg
import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "home", "assets", "uploads", "2026", "09");
const src = "data:image/jpeg;base64," + fs.readFileSync(path.join(DIR, "mp-n166-front-desk-call-hero-1536x865.jpg")).toString("base64");
const br = await chromium.launch({ channel: "chrome" });
const p = await br.newPage({ viewport: { width: 1200, height: 630 } });
await p.setContent(`<body style="margin:0"><img src="${src}" style="display:block;width:1200px;height:630px;object-fit:cover;object-position:50% 40%"></body>`);
await p.waitForFunction(() => document.querySelector("img").complete);
await p.screenshot({ path: path.join(DIR, "mp-share-default-1200x630.jpg"), type: "jpeg", quality: 86, clip: { x: 0, y: 0, width: 1200, height: 630 } });
await br.close();
console.log("mp-share-default-1200x630.jpg");
