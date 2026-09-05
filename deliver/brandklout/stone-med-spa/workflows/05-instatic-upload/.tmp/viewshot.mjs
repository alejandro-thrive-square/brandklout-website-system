/** Viewport capture at a scroll position, local and live side by side.
 *  node viewshot.mjs <page> <selector> <out.png> [width] [motion=on|off]
 *  Scrolls the selector into view like a visitor does, then shoots the VIEWPORT
 *  (not fullPage — a full-page capture resizes the viewport to the document and
 *  re-runs every scroll-driven effect at a size no visitor ever has).
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import puppeteer from 'puppeteer-core';

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const LOCAL_ROOT = path.resolve(HERE, '../../04-design/.tmp/med-spa/final-site');
const REMOTE = 'https://stone-med-spa-production.up.railway.app';
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const [page, selector, out, w = '1440', motion = 'on'] = process.argv.slice(2);
const width = Number(w);

const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const f = path.join(LOCAL_ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) return res.writeHead(404).end();
  res.writeHead(200, { 'content-type': MIME[path.extname(f)] ?? 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const port = server.address().port;
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', protocolTimeout: 300000, args: ['--no-sandbox', '--hide-scrollbars'] });

async function shot(u, file) {
  const p = await browser.newPage();
  await p.setViewport({ width, height: 900 });
  if (motion === 'off') await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await p.goto(u, { waitUntil: 'networkidle0', timeout: 120000 });
  await p.evaluate(async (sel) => {
    document.documentElement.style.scrollBehavior = 'auto';
    const el = document.querySelector(sel);
    const target = el ? el.getBoundingClientRect().top + window.scrollY - 80 : 0;
    // Walk down in steps so lazy images and scroll-driven effects fire in order.
    for (let y = 0; y < target; y += 500) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 40));
    }
    window.scrollTo(0, target);
  }, selector);
  await new Promise((r) => setTimeout(r, 2500));
  await p.screenshot({ path: file });
  await p.close();
}

await shot(`http://127.0.0.1:${port}/${page}.html`, out.replace('.png', '-local.png'));
await shot(`${REMOTE}/${page === 'index' ? '' : page}`, out.replace('.png', '-live.png'));

// Stack them.
const p = await browser.newPage();
await p.goto('about:blank');
const a = 'data:image/png;base64,' + fs.readFileSync(out.replace('.png', '-local.png')).toString('base64');
const b = 'data:image/png;base64,' + fs.readFileSync(out.replace('.png', '-live.png')).toString('base64');
const png = await p.evaluate(async (aSrc, bSrc) => {
  const load = (src) => new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.src = src; });
  const [ia, ib] = await Promise.all([load(aSrc), load(bSrc)]);
  const c = document.createElement('canvas');
  c.width = ia.width; c.height = ia.height + ib.height + 10;
  const x = c.getContext('2d');
  x.fillStyle = '#e11'; x.fillRect(0, 0, c.width, c.height);
  x.drawImage(ia, 0, 0);
  x.drawImage(ib, 0, ia.height + 10);
  return c.toDataURL('image/png');
}, a, b);
fs.writeFileSync(out, Buffer.from(png.split(',')[1], 'base64'));
console.log(out, '(local on top, live below)');
await browser.close();
server.close();
