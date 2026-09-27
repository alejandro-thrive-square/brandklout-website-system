// ===========================================================================
// Recompress the album JPEGs. Google serves the frames at a quality that
// puts a 1536px portrait at 600-800 KB; a page carrying eight of them would
// weigh more than the rest of the site. There is no sharp in this folder and
// nothing native is wanted, so Chrome does it: each file is drawn onto a
// canvas at its own size and exported at quality .8, and the result replaces
// the original only when it is smaller. Dimensions never change, so the
// -<w>x<h> names and every srcset stay true.
//
//   node recompress.mjs [dir]     default ../home/assets/uploads/2026/09
// ===========================================================================
import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.resolve(process.argv[2] || path.join(HERE, "..", "home", "assets", "uploads", "2026", "09"));
const CHROME = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const QUALITY = 0.8;

const files = fs.readdirSync(DIR).filter((f) => /\.jpe?g$/i.test(f)).sort();
const browser = await chromium.launch({ executablePath: CHROME, args: ["--allow-file-access-from-files"] });
const page = await browser.newPage();
await page.goto("file:///" + DIR.split(path.sep).join("/") + "/");
let before = 0, after = 0;
for (const f of files) {
  const abs = path.join(DIR, f);
  const was = fs.statSync(abs).size;
  const dataUrl = await page.evaluate(async ([src, q]) => {
    const img = new Image();
    img.src = src;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    c.getContext("2d").drawImage(img, 0, 0);
    return c.toDataURL("image/jpeg", q);
  }, ["file:///" + abs.split(path.sep).join("/"), QUALITY]);
  const buf = Buffer.from(dataUrl.split(",")[1], "base64");
  before += was;
  if (buf.length < was) { fs.writeFileSync(abs, buf); after += buf.length; }
  else after += was;
}
await browser.close();
console.log(`${files.length} files: ${(before / 1048576).toFixed(1)} MB -> ${(after / 1048576).toFixed(1)} MB`);
