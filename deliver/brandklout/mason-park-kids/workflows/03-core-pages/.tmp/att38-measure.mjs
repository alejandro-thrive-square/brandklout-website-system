// Measure the line in the reviewer's attachment instead of eyeballing it:
// where is the pill, where is the line, how far does it run, what colour.
// node att38-measure.mjs > att38-measure.log
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(HERE, '..', '..', '.tmp', 'bugherd', 'shots', '38-att0.png');
const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const uri = 'data:image/png;base64,' + fs.readFileSync(FILE).toString('base64');

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage();
await page.setContent('<body></body>', { waitUntil: 'load' });
const out = await page.evaluate(async (src) => {
  const img = new Image();
  img.src = src;
  await img.decode();
  const c = document.createElement('canvas');
  c.width = img.width; c.height = img.height;
  const g = c.getContext('2d');
  g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, img.width, img.height).data;
  const at = (x, y) => { const o = (y * img.width + x) * 4; return [d[o], d[o + 1], d[o + 2]]; };
  const copperish = (p) => p[0] > 110 && p[0] < 190 && p[1] > 70 && p[1] < 130 && p[2] > 45 && p[2] < 110;

  // the pill: rows that are mostly copper
  let top = -1, bot = -1;
  for (let y = 0; y < img.height; y++) {
    let n = 0;
    for (let x = 0; x < img.width; x++) if (copperish(at(x, y))) n++;
    if (n > img.width * 0.2) { if (top < 0) top = y; bot = y; }
  }
  // the pill's horizontal extent, measured at its middle
  const mid = Math.round((top + bot) / 2);
  let left = -1, right = -1;
  for (let x = 0; x < img.width; x++) if (copperish(at(x, mid))) { if (left < 0) left = x; right = x; }

  // rows inside the pill that are NOT copper across its middle third
  const rows = [];
  for (let y = top; y <= bot; y++) {
    let n = 0, first = -1, last = -1;
    for (let x = left; x <= right; x++) {
      if (!copperish(at(x, y))) { n++; if (first < 0) first = x; last = x; }
    }
    rows.push({ y, off: n, first, last, sample: at(Math.round((left + right) / 2), y).join(',') });
  }
  const label = rows.filter((r) => r.off > 4);
  return {
    size: [img.width, img.height],
    pill: { top, bot, left, right, h: bot - top + 1, w: right - left + 1 },
    ground: at(2, 2).join(','),
    fill: at(left + 8, mid).join(','),
    oddRows: label.map((r) => `y${r.y} off${r.off} x${r.first}..${r.last} [${r.sample}]`),
  };
}, uri);
console.log(JSON.stringify(out, null, 2));
await browser.close();
