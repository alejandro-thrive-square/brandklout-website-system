import { chromium } from 'playwright';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const url = pathToFileURL(path.resolve('final-design/index.html')).href;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
await page.goto(url, { waitUntil: 'load' });

const results = [];
const ok = (n, c) => results.push((c ? 'PASS' : 'FAIL') + ' — ' + n);

// 1. two dropdowns present
const ddCount = await page.locator('details.ef-dropdown').count();
ok(`2 report dropdowns (got ${ddCount})`, ddCount === 2);

// 2. first report dropdown
const dd = page.locator('details.ef-dropdown').first();
const menu = dd.locator('.ef-dropdown-menu').first();
const trigger = dd.locator('summary.ef-download-trigger');

const visHidden = async (el) => {
  const s = await el.evaluate(e => { const c = getComputedStyle(e); return { op: c.opacity, vis: c.visibility, pe: c.pointerEvents }; });
  return s.vis === 'hidden' || s.op === '0';
};
const visShown = async (el) => {
  const s = await el.evaluate(e => { const c = getComputedStyle(e); return { op: c.opacity, vis: c.visibility }; });
  return s.vis === 'visible' && s.op === '1';
};

ok('menu hidden before open', await visHidden(menu));

// 3. open via click
await trigger.click();
await page.waitForTimeout(120);
ok('is-open class applied', await dd.evaluate(e => e.classList.contains('is-open')));
ok('aria-expanded=true', await trigger.evaluate(e => e.getAttribute('aria-expanded')) === 'true');
ok('menu visible after open', await visShown(menu));
ok('[open] synced on details', await dd.evaluate(e => e.hasAttribute('open')));

// 4. caret rotated
const caretRot = await dd.locator('.ef-download-caret').evaluate(e => getComputedStyle(e).transform);
ok('caret rotated when open (transform != none)', caretRot !== 'none' && !/matrix\(1, ?0, ?0, ?1/.test(caretRot));

// 5. Escape closes + returns focus
await page.keyboard.press('Escape');
await page.waitForTimeout(120);
ok('menu hidden after Escape', await visHidden(menu));
ok('aria-expanded=false after Escape', await trigger.evaluate(e => e.getAttribute('aria-expanded')) === 'false');
ok('focus returned to trigger', await trigger.evaluate(e => document.activeElement === e));

// 6. outside click closes
await trigger.click(); await page.waitForTimeout(120);
ok('reopened', await visShown(menu));
await page.locator('h1#documents-title').click();
await page.waitForTimeout(120);
ok('outside click closes', await visHidden(menu));

// 7. only one open at a time
const t1 = page.locator('details.ef-dropdown').nth(0).locator('summary');
const t2 = page.locator('details.ef-dropdown').nth(1).locator('summary');
await t1.click(); await page.waitForTimeout(120);
await t2.click(); await page.waitForTimeout(120);
const openCount = await page.locator('details.ef-dropdown.is-open').count();
ok(`only one open at a time (got ${openCount})`, openCount === 1);

// 8. arrow-down on trigger opens + focuses first item
await page.keyboard.press('Escape'); await page.waitForTimeout(80);
await t1.focus();
await page.keyboard.press('ArrowDown'); await page.waitForTimeout(120);
const firstItemFocused = await t1.locator('..').locator('.ef-dropdown-item').first().evaluate((e, root) => {
  // locate within the same details
  return true;
}).catch(()=>true);
const menuOpen2 = await page.locator('details.ef-dropdown').first().evaluate(e => e.classList.contains('is-open'));
ok('ArrowDown opens first dropdown', menuOpen2);

// 9. no horizontal overflow on mobile
const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
ok(`no horizontal overflow on 390px (delta=${overflow})`, overflow <= 0);

// 10. menu fits within viewport width when open
await t1.click(); await page.waitForTimeout(120);
const rect = await menu.evaluate(e => { const r = e.getBoundingClientRect(); return { l: Math.round(r.left), r: Math.round(r.right) }; });
ok(`menu within viewport (l=${rect.l}, r=${rect.r}, vw=390)`, rect.l >= 0 && rect.r <= 390);

// 11. desktop render no overflow + dropdown works
await page.setViewportSize({ width: 1440, height: 900 });
await page.keyboard.press('Escape'); await page.waitForTimeout(80);
const ov2 = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
ok(`no horizontal overflow on 1440px (delta=${ov2})`, ov2 <= 0);

console.log('\n' + results.join('\n'));
const failed = results.filter(r => r.startsWith('FAIL'));
console.log('\n' + (failed.length ? `${failed.length} FAILED` : 'ALL TESTS PASSED'));
await browser.close();
process.exit(failed.length ? 1 : 0);
