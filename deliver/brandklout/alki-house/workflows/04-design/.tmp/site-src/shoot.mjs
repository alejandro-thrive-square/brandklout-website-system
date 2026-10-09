// Drives the built site in the installed Chrome and reports what a screenshot
// cannot: console errors, which modules ran, horizontal overflow, the root
// font-size, and whether the pinned chapters really scrub (three different
// intermediate states). Also writes screenshots per breakpoint.
//
// Usage: node shoot.mjs [page=index.html] [widths=1440,390] [--full] [--motion]
//   default is prefers-reduced-motion so the page renders complete for layout
//   captures; --motion runs the scrub proof with animation on.
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
const OUT = path.resolve(HERE, '..', '..', '..', '08-qa', '.tmp', 'screenshots');
const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const page = args[0] || 'index.html';
const widths = (args[1] || '1440,390').split(',').map(Number);
const full = process.argv.includes('--full');
const motion = process.argv.includes('--motion');

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
for (const w of widths) {
  const ctx = await browser.newContext({ viewport: { width: w, height: w < 500 ? 844 : 900 }, reducedMotion: motion ? 'no-preference' : 'reduce', deviceScaleFactor: 1 });
  const pg = await ctx.newPage();
  const errors = [];
  pg.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text()}`); });
  pg.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  await pg.goto('file:///' + path.join(SITE, page).replace(/\\/g, '/'), { waitUntil: 'load' });
  await pg.waitForTimeout(1500);
  const info = await pg.evaluate(() => ({
    root: getComputedStyle(document.documentElement).fontSize,
    overflow: document.documentElement.scrollWidth - window.innerWidth,
    active: window.WZ ? WZ.active : null, registered: window.WZ ? WZ.registered : null,
    chapters: [...document.querySelectorAll('section[data-chapter]')].map((s) => s.dataset.chapterName),
    height: document.documentElement.scrollHeight,
    wrapOverflow: [...document.querySelectorAll('.wrap')].map((e) => e.scrollWidth - e.clientWidth).filter((x) => x > 1),
  }));
  console.log(`\n== ${page} @ ${w}px  root ${info.root}  overflow ${info.overflow}px  height ${info.height}px`);
  console.log('   chapters:', info.chapters.join(' > '));
  console.log('   active:', (info.active || []).join(', '));
  if (info.wrapOverflow.length) console.log('   .wrap overflow:', info.wrapOverflow);
  if (errors.length) console.log('   CONSOLE:', errors.slice(0, 12));

  if (motion) {
    // Scrub proof: step scroll through each pinned chapter and read a state.
    const probe = await pg.evaluate(async () => {
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      const out = {};
      const pins = ScrollTrigger.getAll().filter((t) => t.pin);
      for (const t of pins) {
        const name = t.trigger.dataset.chapterName || t.trigger.className;
        const states = [];
        for (const f of [0.25, 0.5, 0.75]) {
          const y = t.start + (t.end - t.start) * f;
          if (WZ.smoother) WZ.smoother.scrollTo(y, false); else window.scrollTo(0, y);
          await sleep(700);
          const s = t.trigger.querySelector('#stageNum, #railBar, #wayPath, .ct-status');
          states.push(s ? (s.id === 'railBar' ? getComputedStyle(s).getPropertyValue('--p') : s.id === 'wayPath' ? getComputedStyle(s).strokeDashoffset : s.textContent) : t.progress.toFixed(2));
        }
        out[name] = states;
      }
      return out;
    });
    console.log('   scrub proof:', JSON.stringify(probe));
  }

  if (full) {
    // Capture per viewport step and stitch, because ScrollSmoother transforms the content.
    await pg.emulateMedia({ reducedMotion: 'reduce' });
    await pg.evaluate(async () => {
      if (window.WZ && WZ.smoother) { WZ.smoother.kill(); }
      document.documentElement.style.scrollBehavior = 'auto';
      const h = document.documentElement.scrollHeight;
      for (let y = 0; y < h; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
      window.scrollTo(0, 0);
    });
    await pg.waitForTimeout(800);
    const dir = path.join(OUT, page.replace(/\.html$/, '').replace(/\//g, '_'));
    fs.mkdirSync(dir, { recursive: true });
    await pg.screenshot({ path: path.join(dir, `${w}.png`), fullPage: true });
    console.log('   shot ->', path.join(dir, `${w}.png`));
  } else {
    const dir = path.join(OUT, page.replace(/\.html$/, '').replace(/\//g, '_'));
    fs.mkdirSync(dir, { recursive: true });
    await pg.screenshot({ path: path.join(dir, `${w}-fold.png`) });
    console.log('   shot ->', path.join(dir, `${w}-fold.png`));
  }
  await ctx.close();
}
await browser.close();
