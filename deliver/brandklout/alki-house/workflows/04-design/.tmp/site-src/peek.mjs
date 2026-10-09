// Viewport captures at named scroll positions, motion ON, so a chapter can be
// judged at real scale mid-animation. Usage:
//   node peek.mjs index.html 1440 "#arrival:0" "#rail:0.5" "#stage:0.3" "#promise:0.2" ...
//   a spec is "<selector>:<fraction of the trigger's pin range or of the section height>"
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
// playwright-core is not a dependency: `npm i --no-save playwright-core` at the worktree root (or PLAYWRIGHT_DIR).
// It used to resolve from a session scratchpad, which Windows temp cleanup half-deletes.
const require = createRequire(process.env.PLAYWRIGHT_DIR ? path.join(process.env.PLAYWRIGHT_DIR, 'x.js') : import.meta.url);
const { chromium } = require('playwright-core');
const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(HERE, '..', 'final-site');
const OUT = path.resolve(HERE, '..', '..', '..', '08-qa', '.tmp', 'screenshots', 'peek');
const [page, wStr, ...specs] = process.argv.slice(2);
const w = Number(wStr || 1440);
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const ctx = await browser.newContext({ viewport: { width: w, height: w < 500 ? 844 : 900 }, reducedMotion: 'no-preference' });
const pg = await ctx.newPage();
const errors = [];
pg.on('pageerror', (e) => errors.push(e.message));
pg.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await pg.goto('file:///' + path.join(SITE, page).replace(/\\/g, '/'), { waitUntil: 'load' });
await pg.waitForTimeout(2600);
for (const spec of specs) {
  const [sel, fStr] = spec.split(':'); const f = Number(fStr || 0);
  await pg.evaluate(async ({ sel, f }) => {
    const el = document.querySelector(sel);
    const t = ScrollTrigger.getAll().find((x) => x.pin && (x.trigger === el || el.contains(x.trigger) || x.trigger.contains(el)));
    let y;
    if (t) y = t.start + (t.end - t.start) * f;
    else { const r = el.getBoundingClientRect(); const cur = WZ.smoother ? WZ.smoother.scrollTop() : window.scrollY; y = cur + r.top + r.height * f; }
    if (WZ.smoother) WZ.smoother.scrollTo(y, false); else window.scrollTo(0, y);
  }, { sel, f });
  await pg.waitForTimeout(1800);
  const name = `${page.replace(/\.html$/, '').replace(/\//g, '_')}-${w}-${sel.replace(/[^a-z0-9]/gi, '')}-${f}.png`;
  await pg.screenshot({ path: path.join(OUT, name) });
  console.log('shot', name);
}
if (errors.length) console.log('ERRORS', errors);
await browser.close();
