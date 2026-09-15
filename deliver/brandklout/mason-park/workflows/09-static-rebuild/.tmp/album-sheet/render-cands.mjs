// Candidate album frames at a size that can be judged, labelled with number
// and orientation, for replacing repeated photographs.
//
//   node render-cands.mjs 13,80,89 > cands.log     -> cands-<k>.png
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright-core";

const here = import.meta.dirname;
const nums = process.argv[2].split(",").map(Number);
const urls = fs.readFileSync(path.join(here, "..", "album-urls.txt"), "utf8").split(/\r?\n/).filter(Boolean);

function jpegSize(buf) {
  let i = 2;
  while (i < buf.length) {
    const m = buf[i + 1], len = buf.readUInt16BE(i + 2);
    if (m >= 0xc0 && m <= 0xc3) return [buf.readUInt16BE(i + 7), buf.readUInt16BE(i + 5)];
    i += 2 + len;
  }
  return [0, 0];
}

const cells = [];
for (const n of nums) {
  const file = path.join(here, `cand-${n}.jpg`);
  if (!fs.existsSync(file)) {
    const r = await fetch(`${urls[n - 1]}=w900`);
    fs.writeFileSync(file, Buffer.from(await r.arrayBuffer()));
  }
  const buf = fs.readFileSync(file);
  const [w, h] = jpegSize(buf);
  cells.push(`<figure><img src="data:image/jpeg;base64,${buf.toString("base64")}"><b>${n} ${w > h ? "L" : "P"} ${w}x${h}</b></figure>`);
  console.log(`${n} ${w}x${h}`);
}
const CHROME = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage({ viewport: { width: 1500, height: 1300 } });
await page.setContent(`<style>body{margin:0}.g{display:grid;grid-template-columns:repeat(4,366px);gap:6px;padding:6px;align-items:start}figure{margin:0;position:relative}img{width:366px;display:block}b{position:absolute;left:0;top:0;background:#000;color:#fff;padding:3px 8px;font:15px sans-serif}</style><div class=g>${cells.join("")}</div>`);
await page.waitForTimeout(500);
const h = await page.evaluate(() => document.body.scrollHeight);
let k = 0;
for (let y = 0; y < h; y += 1300) {
  k++;
  await page.screenshot({ path: path.join(here, `cands-${k}.png`), fullPage: true, clip: { x: 0, y, width: 1500, height: Math.min(1300, h - y) } });
}
console.log(`${k} parts`);
await browser.close();
