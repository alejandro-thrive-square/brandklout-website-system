// Upscale a small image so a thin artefact is readable. Chrome is the image tool here.
// node zoom.mjs <in.png> <out.png> [scale]
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const [inp, outp, scaleArg] = process.argv.slice(2);
const scale = Number(scaleArg || 5);
const ext = path.extname(inp).slice(1).replace('jpg', 'jpeg');
const uri = `data:image/${ext};base64,${fs.readFileSync(inp).toString('base64')}`;

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage();
await page.setContent(`<body style="margin:0"><img id="i" src="${uri}" style="image-rendering:pixelated"></body>`);
await page.waitForFunction(() => { const i = document.getElementById('i'); return i.complete && i.naturalWidth; });
const { w, h } = await page.evaluate(() => { const i = document.getElementById('i'); return { w: i.naturalWidth, h: i.naturalHeight }; });
console.log('natural', w, h, '->', w * scale, h * scale);
await page.setViewportSize({ width: Math.round(w * scale), height: Math.round(h * scale) });
await page.evaluate((s) => { const i = document.getElementById('i'); i.style.width = i.naturalWidth * s + 'px'; i.style.height = i.naturalHeight * s + 'px'; }, scale);
await page.screenshot({ path: outp });
await browser.close();
console.log('wrote', outp);
