// Does the line in the reviewer's attachment stop at the pill, or run across the
// whole crop? If it runs edge to edge it is not the site at all: it is the
// accessibility widget's reading guide following their cursor.
// node att38-row.mjs > att38-row.log
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
  const res = {};
  for (const y of [86, 88, 90, 91, 92, 93, 95, 100]) {
    res['y' + y] = [0, 2, 5, 8, 12, 40, 80, 120, 160, 165, 170, 180, 190, 195]
      .filter((x) => x < img.width)
      .map((x) => `${x}:${at(x, y).join(',')}`)
      .join('  ');
  }
  // and the same row read right across, summarised
  const row = [];
  for (let x = 0; x < img.width; x++) row.push(at(x, 91));
  const ground = at(2, 2);
  const near = (a, b, t) => Math.abs(a[0] - b[0]) < t && Math.abs(a[1] - b[1]) < t && Math.abs(a[2] - b[2]) < t;
  res.y91_groundlike_outside_pill = [0, 1, 2, 3, 4, 5, 6, 7, 8, 168, 172, 180, 190, 196]
    .filter((x) => x < img.width)
    .map((x) => `${x}:${near(row[x], ground, 12) ? 'ground' : row[x].join(',')}`)
    .join('  ');
  return res;
}, uri);
console.log(JSON.stringify(out, null, 2));
await browser.close();
