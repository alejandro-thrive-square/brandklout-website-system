// Pull the pediatric listing's place_id, and render the candidate embed + links so the
// new map is looked at before it ships (BugHerd #29 / #40 / #36).
// node verify-place.mjs > verify-place.log
import { chromium } from 'playwright-core';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const FTID = '0x8641277706112ec1:0x98941d027afdec7b';
const EMBED =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3463.0585305167815!2d-95.7490312!3d29.7759444' +
  '!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8641277706112ec1%3A0x98941d027afdec7b' +
  '!2sMason%20Park%20Dental%20for%20Kids%20-%20Pediatric%20Dentist%20Katy%20TX!5e0!3m2!1sen!2sus!4v1638807674675!5m2!1sen!2sus';
const PLACE =
  'https://www.google.com/maps/place/Mason+Park+Dental+for+Kids+-+Pediatric+Dentist+Katy+TX/' +
  '@29.7759444,-95.7490312,17z/data=!4m6!3m5!1s0x8641277706112ec1:0x98941d027afdec7b!8m2!3d29.7759444!4d-95.7490312!16s%2Fg%2F11sff9c67k';
const DIR =
  'https://www.google.com/maps/dir/?api=1&destination=' +
  encodeURIComponent('Mason Park Dental for Kids - Pediatric Dentist Katy TX, 21830 Kingsland Blvd #104B, Katy, TX 77450');

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const ctx = await browser.newContext({ locale: 'en-US', viewport: { width: 900, height: 700 } });
const page = await ctx.newPage();

// place_id, if Maps will hand it over
await page.goto(`https://www.google.com/maps/place/?q=place_id:&ftid=${FTID}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(6000);
const html = await page.content();
const pid = [...new Set(html.match(/ChIJ[A-Za-z0-9_-]{15,40}/g) || [])];
console.log('place_id candidates:', pid.slice(0, 5).join(', ') || '(none)');

for (const [name, u] of [['embed', EMBED], ['place', PLACE], ['dir', DIR]]) {
  await page.goto(u, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(7000);
  console.log(`--- ${name}`);
  console.log('  title:', await page.title());
  console.log('  landed:', page.url().slice(0, 170));
  const txt = (await page.locator('body').innerText().catch(() => '')).replace(/\s+/g, ' ');
  console.log('  says kids:', /for Kids/i.test(txt), '| says of Katy:', /of Katy/i.test(txt), '| 104B:', /104B/i.test(txt), '| 104A:', /104A/i.test(txt));
  await page.screenshot({ path: `place-${name}.png` });
}
await browser.close();
