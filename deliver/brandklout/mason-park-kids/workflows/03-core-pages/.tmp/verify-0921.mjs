// Did this round actually land on staging? Ask the published pages, not the
// publish log. node verify-0921.mjs > verify-0921.log
import { chromium } from 'playwright-core';

const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SITE = 'https://staging.masonparkpediatricdental.com';
const KIDS = '0x8641277706112ec1';
const ADULT = '0x86412740e7dd5def';

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.addInitScript(() => { document.documentElement.style.scrollBehavior = 'auto'; });

let bad = 0;
const check = (label, ok, detail = '') => { if (!ok) bad++; console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label}${detail ? '  ' + detail : ''}`); };

for (const path of ['/', '/contacts/', '/about-us/', '/blog/']) {
  console.log('---', path);
  await page.goto(SITE + path, { waitUntil: 'load', timeout: 60000 });
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 450) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(3000);
  const html = await page.content();
  const text = (await page.locator('body').innerText()).replace(/\s+/g, ' ');

  check('map is the pediatric listing', html.includes(KIDS) && !html.includes(ADULT));
  check('hours Mon to Thu 9am to 6pm', /Mon to Thu\s*9am to 6pm/.test(text), text.match(/Mon to Thu[^|]{0,40}/)?.[0] || '');
  check('no Tue and Thu 8am to 5pm', !/8am to 5pm/.test(text));
  // Read the top bar's own node. It is in the chrome that the journey layer
  // slides away on scroll, so after a walk down the page `body.innerText` no
  // longer contains it and a text search reports a fault that is not there.
  const topline = await page.locator('.topline_note').first().evaluate((el) => el.textContent.replace(/\s+/g, ' ').trim()).catch(() => '');
  check('top bar says Mon to Thu 9-6', /Mon to Thu 9-6/.test(topline), JSON.stringify(topline));
  check('footer Tuesday is 9am - 6pm', /Tuesday\s*9am - 6pm/.test(text));
  check('phone is not "578 to 7100"', !/578 to 7100/.test(text));
  check('no stray schema text', !/"@context"|telePhone/.test(text));
}

console.log('--- /');
await page.goto(SITE + '/', { waitUntil: 'load', timeout: 60000 });
await page.waitForTimeout(2500);
const sticker = await page.locator('.ft-sticker').first().evaluate((el) => getComputedStyle(el).color);
check('sticker ink is white', sticker === 'rgb(255, 255, 255)', sticker);
const card = await page.locator('#comfort .cf-card').first().innerText();
check('comfort card copy', /during the first visit and at checkups/.test(card.replace(/\s+/g, ' ')));
const parked = await page.locator('a.button.is-sun').first().evaluate((el) => getComputedStyle(el, '::after').transform);
check('button fill parked further out', /matrix\(1, 0, 0, 1, 0, (\d+)/.test(parked), parked);

console.log('--- /contacts/');
await page.goto(SITE + '/contacts/', { waitUntil: 'load', timeout: 60000 });
await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 450) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); } });
await page.waitForTimeout(2500);
const ths = await page.locator('#hours .fi-matrix thead th').allInnerTexts();
check('hours table has two columns', ths.length === 2, JSON.stringify(ths));
const w = await page.locator('#hours .fi-matrix').evaluate((el) => Math.round(el.getBoundingClientRect().width));
check('hours table is narrow', w > 300 && w < 600, w + 'px');
const comeIn = await page.locator('#ways .sq-card').last().innerHTML();
check('address links to navigation', /maps\/dir\/\?api=1/.test(comeIn));
check('get directions arrow', /Get directions/.test(comeIn));
const lede = await page.locator('.ar-lede').first().innerText();
check('lede rephrased', /whichever is easiest/.test(lede));

await browser.close();
console.log(bad ? `\n${bad} check(s) failed` : '\nevery check passed');
process.exitCode = bad ? 1 : 0;
