/** Crop a y-band out of a PNG so a diff band can actually be looked at.
 *  node crop.mjs <in.png> <out.png> <y0> <y1> [scale]
 *  Also accepts several inputs stacked side by side: node crop.mjs a.png,b.png out.png y0 y1
 */
import fs from 'node:fs';
import puppeteer from 'puppeteer-core';

const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const [inArg, out, y0, y1, scale = '1'] = process.argv.slice(2);
const files = inArg.split(',');

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const p = await browser.newPage();
await p.goto('about:blank');
const srcs = files.map((f) => 'data:image/png;base64,' + fs.readFileSync(f).toString('base64'));
const png = await p.evaluate(
  async (srcs, a, b, s) => {
    const load = (src) => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = src; });
    const ims = await Promise.all(srcs.map(load));
    const h = Math.round((b - a) * s);
    const w = Math.round(ims.reduce((n, im) => n + im.width, 0) * s) + (ims.length - 1) * 8;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const x = c.getContext('2d');
    x.fillStyle = '#111'; x.fillRect(0, 0, w, h);
    let dx = 0;
    for (const im of ims) {
      x.drawImage(im, 0, a, im.width, b - a, dx, 0, Math.round(im.width * s), h);
      dx += Math.round(im.width * s) + 8;
    }
    return c.toDataURL('image/png');
  },
  srcs, Number(y0), Number(y1), Number(scale),
);
fs.writeFileSync(out, Buffer.from(png.split(',')[1], 'base64'));
console.log(out);
await browser.close();
