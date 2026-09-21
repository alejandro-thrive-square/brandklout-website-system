// Whose accessibility widget is on the staging site? The BugHerd selectors carry
// data-asw-org-font-size and inline font-size, which is a widget rewriting type
// at runtime, and the screenshots show a blue badge bottom-left. It is in none of
// the local source, so it arrives from the platform or a site script.
// node asw-probe.mjs > asw-probe.log
import { chromium } from 'playwright-core';

const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 1512, height: 855 } });
const scripts = [];
page.on('request', (r) => { if (r.resourceType() === 'script') scripts.push(r.url()); });
await page.goto('https://staging.masonparkpediatricdental.com/contacts/', { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(3000);

console.log('--- third-party scripts');
for (const u of [...new Set(scripts)]) if (!u.includes('masonparkpediatricdental.com')) console.log('   ', u);

console.log('\n--- nodes carrying data-asw-*');
console.log('   ', await page.evaluate(() => document.querySelectorAll('[data-asw-org-font-size]').length));

console.log('\n--- widget-looking roots');
console.log(await page.evaluate(() => {
  const out = [];
  for (const el of document.body.children) out.push(`${el.tagName.toLowerCase()}#${el.id || ''}.${(el.className || '').toString().slice(0, 60)}`);
  return out.join('\n');
}));

console.log('\n--- does anything underline the button?');
console.log(JSON.stringify(await page.evaluate(() => {
  const b = document.querySelector('#invitation .iv-actions a.button.is-sun');
  if (!b) return 'no button';
  const cs = getComputedStyle(b);
  return { line: cs.textDecorationLine, color: cs.textDecorationColor, style: cs.textDecorationStyle, thickness: cs.textDecorationThickness, borderBottom: cs.borderBottom, inline: b.getAttribute('style') };
}), null, 2));
await browser.close();
