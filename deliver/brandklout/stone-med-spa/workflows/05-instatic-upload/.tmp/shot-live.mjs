/** Full-page captures of the PUBLISHED site. node shot-live.mjs <route> <out.png> [width] */
import puppeteer from 'puppeteer-core';

const BASE = 'https://stone-med-spa-production.up.railway.app';
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const [route, out, w = '1440'] = process.argv.slice(2);

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--hide-scrollbars'] });
const p = await browser.newPage();
await p.setViewport({ width: Number(w), height: 1000 });
// Reduced motion so a full-page capture is honest rather than mid-animation.
await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
// The route arrives WITHOUT a leading slash: Git Bash rewrites a bare `/x`
// argument into a Windows path before node ever sees it.
await p.goto(BASE + '/' + route.replace(/^\/+/, ''), { waitUntil: 'networkidle0', timeout: 120000 });
await p.evaluate(async () => {
  await new Promise((r) => { let y = 0; const t = setInterval(() => { window.scrollBy(0, 900); y += 900; if (y > document.body.scrollHeight) { clearInterval(t); r(); } }, 30); });
  window.scrollTo({ top: 0, behavior: 'instant' });
});
await new Promise((r) => setTimeout(r, 2000));
await p.screenshot({ path: out, fullPage: true });
console.log(out, await p.evaluate(() => [document.title, document.body.scrollHeight].join(' | ')));
await browser.close();
