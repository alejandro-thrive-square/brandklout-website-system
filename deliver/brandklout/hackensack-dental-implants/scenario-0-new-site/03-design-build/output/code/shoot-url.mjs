// Client script. Screenshots a live URL: one viewport at a time while scrolling (what a visitor
// sees, motion on) and one full page with reduced motion. Also dumps the rendered text and the
// computed style of the elements that define a design (fonts, sizes, colours, radii).
// Usage (from the step's output/ folder):
//   node code/shoot-url.mjs <url> <out dir> [--width 1440] [--height 900] > shoot.log
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.resolve(here, '../../../../scenario-1-migration/01-old-site-capture/scripts/package.json'));
const puppeteer = require('puppeteer-core');
const url = process.argv[2];
const out = path.resolve(process.argv[3]);
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : d; };
const width = Number(arg('width', 1440));
const height = Number(arg('height', width < 700 ? 844 : 900));
fs.mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox', '--hide-scrollbars', '--autoplay-policy=no-user-gesture-required'] });
const pg = await browser.newPage();
await pg.setViewport({ width, height, isMobile: width < 700, hasTouch: width < 700 });
await pg.goto(url, { waitUntil: 'networkidle2', timeout: 120000 });
await sleep(2500);
await pg.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });

const total = await pg.evaluate(() => document.documentElement.scrollHeight);
let n = 0;
for (let y = 0; y < total; y += Math.round(height * 0.92)) {
  await pg.evaluate((y) => window.scrollTo(0, y), y);
  await sleep(1300);
  await pg.screenshot({ path: path.join(out, `${width}-${String(n++).padStart(2, '0')}.png`) });
}
console.log(`${n} viewport steps of ${total}px at ${width}`);

const style = await pg.evaluate(() => {
  const pick = (el) => { const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); return { tag: el.tagName.toLowerCase(), cls: String(el.className).slice(0, 60), text: el.textContent.trim().replace(/\s+/g, ' ').slice(0, 70), font: cs.fontFamily.slice(0, 50), size: cs.fontSize, weight: cs.fontWeight, lh: cs.lineHeight, ls: cs.letterSpacing, tt: cs.textTransform, color: cs.color, bg: cs.backgroundColor, radius: cs.borderRadius, pad: cs.padding, w: Math.round(r.width), h: Math.round(r.height) }; };
  const out = { body: pick(document.body), headings: [], text: [], buttons: [], sections: [], vars: {} };
  document.querySelectorAll('h1, h2, h3, h4').forEach((el) => out.headings.push(pick(el)));
  [...document.querySelectorAll('p')].slice(0, 14).forEach((el) => out.text.push(pick(el)));
  [...document.querySelectorAll('a[class*="button"], a[class*="btn"], .w-button, button')].slice(0, 14).forEach((el) => out.buttons.push(pick(el)));
  document.querySelectorAll('section, header, footer, nav, [class*="section"]').forEach((el) => { const p = pick(el); if (p.h > 60) out.sections.push({ tag: p.tag, cls: p.cls, bg: p.bg, h: p.h, pad: p.pad, bgImg: getComputedStyle(el).backgroundImage.slice(0, 90) }); });
  const rs = getComputedStyle(document.documentElement);
  for (const sheet of document.styleSheets) { try { for (const rule of sheet.cssRules) if (rule.selectorText === ':root' || rule.selectorText === 'body') for (const p of rule.style) if (p.startsWith('--')) out.vars[p] = rs.getPropertyValue(p).trim(); } catch {} }
  out.images = [...document.images].map((i) => ({ src: i.currentSrc, alt: i.alt, w: Math.round(i.getBoundingClientRect().width), h: Math.round(i.getBoundingClientRect().height) })).filter((i) => i.w > 40);
  out.videos = [...document.querySelectorAll('video source, video')].map((v) => v.src || v.currentSrc).filter(Boolean);
  out.innerText = document.body.innerText;
  return out;
});
fs.writeFileSync(path.join(out, `style-${width}.json`), JSON.stringify(style, null, 1));

await pg.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
await pg.evaluate(() => window.scrollTo(0, 0));
await sleep(800);
await pg.screenshot({ path: path.join(out, `${width}-full.png`), fullPage: true, captureBeyondViewport: true });
console.log(`full page and style-${width}.json written to ${out}`);
await browser.close();
