// The map embed was repointed from the adult listing to the pediatric one
// (BugHerd #29 / #40). Confirm every page now asks for the new ftid, and that
// the frame really draws the pediatric pin on a page served from disk.
// node map-check.mjs > map-check.log
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(HERE, '..', 'home');
const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const KIDS = '0x8641277706112ec1';
const ADULT = '0x86412740e7dd5def';

const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? walk(path.join(d, e.name)) : e.name === 'index.html' ? [path.join(d, e.name)] : []);

let kids = 0, adult = 0, none = 0;
const stragglers = [];
for (const f of walk(SITE)) {
  const s = fs.readFileSync(f, 'utf8');
  if (s.includes(ADULT)) { adult++; stragglers.push(path.relative(SITE, f)); }
  else if (s.includes(KIDS)) kids++;
  else none++;
}
console.log(`pages with the pediatric ftid: ${kids}`);
console.log(`pages still on the adult ftid: ${adult}${adult ? '  ' + stragglers.slice(0, 8).join(', ') : ''}`);
console.log(`pages with no map: ${none}`);

// And does it draw? site.js swaps data-src in on idle, so give it a moment.
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('file:///' + path.join(SITE, 'contacts', 'index.html').replace(/\\/g, '/'), { waitUntil: 'load', timeout: 60000 });
await page.evaluate(async () => {
  for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); }
});
await page.waitForTimeout(8000);
const frame = page.locator('#invitation .iv-map iframe');
const src = await frame.getAttribute('src');
console.log('\niframe src on /contacts:', src ? src.slice(0, 130) + '...' : '(data-src never swapped in)');
console.log('  carries the pediatric ftid:', !!src && src.includes(encodeURIComponent(KIDS).toLowerCase().replace('%3a', '') || KIDS) || (!!src && src.includes(KIDS)));
const box = await frame.boundingBox();
if (box) await page.screenshot({ path: 'map-check.png', clip: { x: box.x, y: box.y, width: box.width, height: box.height } });
console.log('  wrote map-check.png');
await browser.close();
