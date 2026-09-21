// BugHerd #33: the sticker's ink is dark on the live site though site.css says --on-sun.
// Find out which rule actually wins, live and locally.
// node sticker-probe.mjs > sticker-probe.log
import { chromium } from 'playwright-core';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const targets = [
  ['live', 'https://staging.masonparkpediatricdental.com/'],
  ['local', 'file:///' + path.join(here, '..', 'home', 'index.html').replace(/\\/g, '/')],
];

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
for (const [name, url] of targets) {
  const page = await browser.newPage({ viewport: { width: 1512, height: 855 } });
  await page.goto(url, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(2000);
  const el = page.locator('.ft-sticker').first();
  const n = await el.count();
  console.log(`--- ${name}  .ft-sticker count=${n}`);
  if (!n) { await page.close(); continue; }
  const out = await el.evaluate((e) => {
    const cs = getComputedStyle(e);
    const rules = [];
    for (const sheet of document.styleSheets) {
      let list;
      try { list = sheet.cssRules; } catch { continue; }
      const walk = (rs) => {
        for (const r of rs) {
          if (r.cssRules) { walk(r.cssRules); continue; }
          if (!r.selectorText) continue;
          let m = false;
          try { m = e.matches(r.selectorText); } catch { }
          if (m && (r.style.color || r.style.getPropertyValue('--on-sun') || r.style.background || r.style.backgroundColor || r.style.transform)) {
            rules.push({ sel: r.selectorText, color: r.style.color, bg: r.style.background || r.style.backgroundColor, transform: r.style.transform, href: sheet.href ? sheet.href.split('/').pop() : 'inline' });
          }
        }
      };
      walk(list);
    }
    return {
      color: cs.color, bg: cs.backgroundColor, transform: cs.transform, font: cs.fontFamily,
      onSun: getComputedStyle(document.documentElement).getPropertyValue('--on-sun'),
      sunFill: getComputedStyle(document.documentElement).getPropertyValue('--sun-fill'),
      onSunHere: cs.getPropertyValue('--on-sun'),
      inlineStyle: e.getAttribute('style'),
      cls: e.className,
      rules,
    };
  });
  console.log(JSON.stringify(out, null, 2));
  await page.close();
}
await browser.close();
