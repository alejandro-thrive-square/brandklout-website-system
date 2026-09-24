// BugHerd #170-#187 on staging: each swap and insert from bugherd-0924b.py, the copy, and #172's tick list.
//   node verify-0924b.mjs [origin] > log
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
const here = path.dirname(fileURLToPath(import.meta.url));
const ORIGIN = process.argv[2] || 'https://staging.masonparkpediatricdental.com';
const py = fs.readFileSync(path.join(here, 'bugherd-0924b.py'), 'utf8');
const swaps = [...py.matchAll(/^\s*\((\d+), "([^"]+)", "([^"]+)", "([^"]+)", "(rv-[^"]+)"\),/gm)].map(m => ({ n: +m[1], page: m[2], sec: m[3], key: m[5] }));
const inserts = [...py.matchAll(/^\s*\((\d+), "([^"]+)", (\d), "([^"]+)", "[^"]+"\),/gm)].map(m => ({ n: +m[1], page: m[2], sec: 'path', key: m[4] }));
const TEXT = {
  'about-us': ['Crafted with your whole family in mind', 'Parents welcome', 'Sedation is available if needed', 'Amazing care under one roof', 'A brushing lesson, mid visit', 'The screen in the ceiling, from the chair'],
};
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
let fails = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const go = async (p) => { await page.goto(`${ORIGIN}/${p === 'index' ? '' : p}`, { waitUntil: 'domcontentloaded', timeout: 60000 }); await page.waitForTimeout(1500); };
const pages = [...new Set([...swaps, ...inserts].map(x => x.page).concat(Object.keys(TEXT)))];
for (const p of pages) {
  await go(p);
  for (const s of [...swaps, ...inserts].filter(x => x.page === p)) {
    const srcs = await page.$$eval(`section#${s.sec} img`, els => els.map(e => e.getAttribute('src') + ' ' + (e.getAttribute('srcset') || '')));
    ok(srcs.some(x => x.includes(s.key)), `#${s.n} ${p} #${s.sec}: ${s.key}`);
  }
  if (TEXT[p]) { const t = (await page.content()).replace(/&rsquo;/g, '\u2019'); for (const w of TEXT[p]) ok(t.includes(w), `${p}: "${w}"`); }
  if (p === 'about-us') ok(!(await page.content()).includes('Parents welcome in the room'), '#185 "in the room" gone');
}
await go('services/comprehensive-pediatric-dentistry');
const shots = await page.$$eval('section#path article.pa-card:not(.is-cta) .pa-shot', e => e.length);
const cards = await page.$$eval('section#path article.pa-card:not(.is-cta)', e => e.length);
ok(shots === cards - 1, `#174 path: ${shots} of ${cards} step cards have a photo (step 1 waits on #176)`);
const li = await page.$eval('section#fluoride .lf-ticks li', e => [getComputedStyle(e).display, e.querySelector('b').getClientRects().length]);
ok(li[0] !== 'flex' && li[1] === 1, `#172 tick item is ${li[0]}, "Fluoride." on ${li[1]} line(s)`);
await browser.close();
console.log(fails ? `${fails} FAILED` : 'all passed');
