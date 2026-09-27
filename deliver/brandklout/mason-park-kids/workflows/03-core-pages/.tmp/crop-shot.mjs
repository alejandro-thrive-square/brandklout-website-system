// Crop a region out of a BugHerd screenshot and blow it up, so a colour complaint
// can be judged. node crop-shot.mjs <in> <out> <x> <y> <w> <h> [scale]
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const [inp, outp, x, y, w, h, s] = process.argv.slice(2);
const scale = Number(s || 3);
const ext = path.extname(inp).slice(1).replace('jpg', 'jpeg');
const uri = `data:image/${ext};base64,${fs.readFileSync(inp).toString('base64')}`;

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: Math.round(w * scale), height: Math.round(h * scale) } });
await page.setContent(
  `<body style="margin:0;overflow:hidden"><img src="${uri}" style="position:absolute;left:${-x * scale}px;top:${-y * scale}px;width:auto;transform-origin:0 0;transform:scale(${scale})"></body>`,
  { waitUntil: 'load' }
);
await page.waitForTimeout(800);
await page.screenshot({ path: outp });
await browser.close();
console.log('wrote', outp);
