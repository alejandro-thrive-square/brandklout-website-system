// One chapter of one page, as a picture: the way a BugHerd note is about one section.
//   node bh-shot.mjs [--live] [--w 1440] [--motion] <page>#<section> ... > log
// <page> is the path under home/ ("index" for the homepage, "services/bonding").
// Writes bh-<page>-<section>-<w>.png into shots/bh/. Reduced motion by default, so
// every reveal is at rest and the picture shows layout, not an animation mid-flight.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';
import { settle } from './settle.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const live = args.includes('--live');
const motion = args.includes('--motion');
const wi = args.indexOf('--w');
const W = wi >= 0 ? +args[wi + 1] : 1440;
const specs = args.filter((a, i) => a.includes('#') && args[i - 1] !== '--w');
const out = path.join(here, 'shots', 'bh');
fs.mkdirSync(out, { recursive: true });
const LIVE = 'https://staging.masonparkpediatricdental.com';

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await browser.newPage({ viewport: { width: W, height: 900 }, reducedMotion: motion ? 'no-preference' : 'reduce' });
for (const spec of specs) {
  const [pg, sec] = spec.split('#');
  const url = live
    ? `${LIVE}/${pg === 'index' ? '' : pg}`
    : pathToFileURL(path.join(here, '..', 'home', pg === 'index' ? '' : pg, 'index.html')).href;
  // live: third-party tags can hold the load event; the DOM is what we photograph
  await page.goto(url, live ? { waitUntil: 'domcontentloaded', timeout: 60000 } : { waitUntil: 'load' });
  if (live) await page.waitForTimeout(2500);
  await settle(page);
  const el = page.locator(`section#${sec}`).first();
  if (!(await el.count())) { console.log(spec, 'NO SECTION'); continue; }
  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(motion ? 2500 : 600);
  const file = path.join(out, `bh-${pg.replace(/\//g, '_')}-${sec}-${W}${live ? '-live' : ''}.png`);
  const box = await el.boundingBox();
  await el.screenshot({ path: file });
  console.log(spec, Math.round(box.height), path.basename(file));
}
await browser.close();
