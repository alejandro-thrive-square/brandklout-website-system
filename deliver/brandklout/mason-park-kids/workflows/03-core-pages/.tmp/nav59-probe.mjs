// BugHerd #59/#76/#132: the Services menu's second level, driven the way a visitor uses it.
//   node nav59-probe.mjs [url] > log
// Desktop: hover Services, then hover a category - its treatments must show and be clickable.
// Phone: open the drawer, tap a category once (it opens), tap a treatment (it navigates).
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';
const here = path.dirname(fileURLToPath(import.meta.url));
const url = process.argv[2] || pathToFileURL(path.join(here, '..', 'home', 'index.html')).href;
const tag = process.argv[2] ? 'live' : 'local';
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
let fails = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };

{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  const svc = page.locator('#masthead-menu > ul > li.has-sub', { hasText: 'Services' }).first();
  await svc.locator('> a').hover();
  await page.waitForTimeout(400);
  const cats = await svc.locator('> ul > li > a').allTextContents();
  ok(cats.includes('Cosmetic and gum care'), `categories: ${cats.join(' | ')}`);
  const prev = svc.locator('> ul > li.has-sub', { hasText: 'Preventive dentistry' }).first();
  await prev.locator('> a').hover();
  await page.waitForTimeout(400);
  const sealants = prev.locator('> ul a', { hasText: 'Sealants' });
  ok(await sealants.isVisible(), 'desktop: Sealants visible after hovering Preventive dentistry');
  const box = await sealants.boundingBox();
  const hit = await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.textContent, [box.x + box.width / 2, box.y + box.height / 2]);
  ok(hit === 'Sealants', `desktop: nothing covers the Sealants link (hit "${hit}")`);
  await page.screenshot({ path: path.join(here, 'shots', 'bh', `nav59-desktop-${tag}.png`), clip: { x: 300, y: 0, width: 1000, height: 560 } });
  await sealants.click();
  await page.waitForURL(/sealants/, { timeout: 10000 }).catch(() => {});
  ok(/services\/sealants/.test(page.url()), `desktop: click lands on ${page.url().split('/').slice(-3).join('/')}`);
  await page.close();
}
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  await page.locator('.masthead_toggle').tap();
  await page.waitForTimeout(500);
  const svc = page.locator('#masthead-menu > ul > li.has-sub', { hasText: 'Services' }).first();
  await svc.locator('> a').tap();
  await page.waitForTimeout(300);
  const cat = svc.locator('> ul > li.has-sub', { hasText: 'Cosmetic and gum care' }).first();
  await cat.locator('> a').tap();
  await page.waitForTimeout(300);
  ok(/cosmetic/.test(page.url()) === false, 'phone: first tap on a category opens it instead of navigating');
  const bonding = cat.locator('> ul a', { hasText: 'Bonding' });
  ok(await bonding.isVisible(), 'phone: Bonding visible under Cosmetic and gum care');
  await page.screenshot({ path: path.join(here, 'shots', 'bh', `nav59-phone-${tag}.png`) });
  await bonding.tap();
  await page.waitForURL(/bonding/, { timeout: 10000 }).catch(() => {});
  ok(/services\/bonding/.test(page.url()), `phone: tap lands on ${page.url().split('/').slice(-3).join('/')}`);
  await page.close();
}
await browser.close();
console.log(fails ? `${fails} FAILED` : 'all passed');
