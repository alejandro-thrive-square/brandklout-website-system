// Client script, 2026-10-02. Proves each BugHerd 544349 pin of the 2026-10-01 round on the LIVE
// staging page, one assertion per pin, at the reviewer's 1512x735 (and 390 for the phone pin), and
// saves a viewport shot of each pinned spot to output/bugherd/2026-10-01/verify/<task>.png. Read-only.
// Usage (from the step folder): node output/code/bugherd-verify.mjs [url] > output/bugherd/2026-10-01/verify.txt
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(path.resolve(process.cwd(), '../../scenario-1-migration/01-old-site-capture/scripts/package.json'));
const puppeteer = require('puppeteer-core');
const URL_ = (process.argv[2] || 'https://hackensack-dental-implants-staging.up.railway.app').replace(/\/$/, '') + '/';
const OUT = path.resolve('output/bugherd/2026-10-01/verify');
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
let failed = 0;
const say = (task, ok, name, detail = '') => { if (!ok) failed++; console.log(`${ok ? 'PASS' : 'FAIL'}  #${task}  ${name}${detail ? '  ' + detail : ''}`); };

const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] });

const open = async (w, h) => {
  const pg = await browser.newPage();
  pg.errors = [];
  pg.on('pageerror', (e) => pg.errors.push(e.message));
  await pg.setUserAgent(UA);
  await pg.setViewport({ width: w, height: h, isMobile: w < 500, hasTouch: w < 500 });
  await pg.goto(URL_, { waitUntil: 'networkidle2', timeout: 90000 });
  await sleep(3500);
  return pg;
};
/* bring an element to a place in the window (the smoother when there is one), let motion settle */
const goTo = async (pg, sel, where = 'top 15%', wait = 2200) => {
  await pg.evaluate((sel, where) => {
    const el = document.querySelector(sel);
    if (!el) return;
    if (window.WZ && WZ.smoother) WZ.smoother.scrollTo(el, false, where);
    else { const pct = parseFloat(where.split(' ')[1]) / 100; window.scrollTo(0, el.getBoundingClientRect().top + scrollY - innerHeight * pct); }
  }, sel, where);
  await sleep(wait);
};
const rect = (pg, sel) => pg.evaluate((sel) => { const e = document.querySelector(sel); if (!e) return null; const b = e.getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height }; }, sel);
/* a viewport shot with the pinned spot on screen (a clip fights the smoother's transform) */
const shot = async (pg, task, sel) => {
  const r = await rect(pg, sel);
  if (!r) return;
  const vh = pg.viewport().height;
  if (r.y + r.h < 40 || r.y > vh - 40) await goTo(pg, sel, 'top 10%', 1800);
  await pg.screenshot({ path: path.join(OUT, `${task}.png`), captureBeyondViewport: false });
};

/* ================= desktop, as the reviewer sees it ================= */
let pg = await open(1512, 735);

// #1, #4: no cursor follower, no "View" label
await pg.mouse.move(700, 400); await sleep(300); await pg.mouse.move(760, 430); await sleep(300);
const cur = await pg.evaluate(() => ({ cursor: document.querySelectorAll('.cursor, .cursor__ring, .cursor__label').length, view: [...document.querySelectorAll('body *')].some((e) => e.children.length === 0 && e.textContent.trim() === 'View'), heroVisual: !!document.querySelector('.hero-visual') }));
say(1, cur.cursor === 0, 'no cursor follower after the pointer moves', JSON.stringify(cur));
say(4, cur.cursor === 0 && !cur.view && !cur.heroVisual, 'no "View" label anywhere; the old hero photo is gone', JSON.stringify(cur));

// #2: the Drive logo in the nav
const logo = await pg.evaluate(() => { const i = document.querySelector('.brand img'); return i ? { src: i.currentSrc.split('/').pop(), w: i.naturalWidth, h: Math.round(i.getBoundingClientRect().height), text: document.querySelector('.brand').innerText.trim() } : null; });
say(2, !!logo && /logo-stacked/.test(logo.src) && logo.w > 0 && logo.h >= 44, 'nav shows the stacked Drive logo, loaded', JSON.stringify(logo));
await shot(pg, 2, '.nav .brand', 16);

// #3
const top = await pg.evaluate(() => document.querySelector('.topbar span').textContent.trim());
say(3, top === 'Dedicated implant care in Bergen County, New Jersey', 'top bar text', top);
await shot(pg, 3, '.topbar', 0);

// #16: doctor card at the foot of the film
await goTo(pg, '.hero-film', 'top 10%');
const doc = await pg.evaluate(() => { const f = document.querySelector('.hero-frame').getBoundingClientRect(); const d = document.querySelector('.hero-doctor').getBoundingClientRect(); return { gapToFoot: Math.round(f.bottom - d.bottom), inFrame: d.top > f.top + f.height / 2 }; });
say(16, doc.gapToFoot >= 0 && doc.gapToFoot < 80 && doc.inFrame, 'doctor card sits at the bottom of the video', JSON.stringify(doc));
await shot(pg, 16, '.hero-frame', 0);

// #24: rating is the office's 5.0
const rate = await pg.evaluate(() => document.querySelector('.hero-doctor__rating').innerText.replace(/\s+/g, ' ').trim());
await goTo(pg, '.stats', 'top 40%', 3200);
const stat = await pg.evaluate(() => document.querySelector('.stat strong').textContent.trim() + ' / ' + document.querySelector('.stat span').textContent.trim());
say(24, /^5\.0/.test(rate) && /^5\.0 \//.test(stat), 'rating updated to the office listing (5.0) in the hero card and the numbers', `${rate} | ${stat}`);
await shot(pg, 24, '.stats', 16);

// #12: surgeons link to their profiles
const links = await pg.evaluate(() => [...document.querySelectorAll('.specialist-grid > a')].map((a) => a.getAttribute('href')));
say(12, links.join(' ') === '/dr-won-sang-lee-dds /dr-maurice-srour-dds /dr-dmitriy-klass-dds-msd', 'each surgeon links to his profile', links.join(' ') + '  (profile pages not built on staging yet)');
await shot(pg, 12, '.specialists', 16);

// #11: portrait fills the arch, head whole
await goTo(pg, '.doc-portrait', 'top 8%');
const por = await pg.evaluate(() => { const i = document.querySelector('.doc-portrait img'); const cs = getComputedStyle(i); return { fit: cs.objectFit, pos: cs.objectPosition, box: Math.round(document.querySelector('.doc-portrait').getBoundingClientRect().height) }; });
say(11, por.fit === 'cover' && /100%$/.test(por.pos), 'portrait fills its arch, anchored at the shoulders so the head is never cut (see crop)', JSON.stringify(por));
await shot(pg, 11, '.doc-portrait', 8);

// #18: the patient quote scene is shorter
const story = await pg.evaluate(() => { const t = ScrollTrigger.getAll().find((x) => x.trigger && x.trigger.id === 'story-scene'); return t ? { pin: !!t.pin, length: Math.round(t.end - t.start), vh: innerHeight } : null; });
say(18, !!story && (!story.pin || story.length <= story.vh * 0.6), 'patient quote scene plays in about half a screen of scroll (was 110%)', JSON.stringify(story));

// #5: All-on-4 on its own line, unbroken
await goTo(pg, '.solution:nth-of-type(3)', 'top 40%', 2600);
const aon = await pg.evaluate(() => { const h = document.querySelector('.solution:nth-of-type(3) h3'); const s = h.querySelector('.nowrap'); const hb = h.getBoundingClientRect(); const sb = s ? s.getBoundingClientRect() : null; return s ? { text: s.textContent, lines: s.getClientRects().length, inside: sb.right <= hb.right + 1 && sb.left >= hb.left - 1, br: !!h.querySelector('br') } : null; });
say(5, !!aon && aon.text === 'All-on-4®' && aon.lines === 1 && aon.inside && aon.br, '"All-on-4®" is on its own line and not cut off', JSON.stringify(aon));
await shot(pg, 5, '.solution:nth-of-type(3)', 8);

// #19, #20: full-arch heading and photo
await goTo(pg, '.feature-copy h2', 'top 25%', 2800);
const clipCheck = (sel) => pg.evaluate((sel) => {
  const h = document.querySelector(sel);
  const masks = [...h.querySelectorAll('.ln-mask')];
  const pt = masks.length ? parseFloat(getComputedStyle(masks[0]).paddingTop) : 0;
  const fs = parseFloat(getComputedStyle(h).fontSize);
  // capitals rise ~0.72em above the baseline; the mask must start at least that far above it
  const bad = masks.filter((m) => { const w = m.querySelector('.wh'); if (!w) return false; const mb = m.getBoundingClientRect(); const wb = w.getBoundingClientRect(); return wb.top - mb.top < 0.1 * fs; }).length;
  return { masks: masks.length, paddingTopEm: +(pt / fs).toFixed(2), tightMasks: bad };
}, sel);
const f19 = await clipCheck('.feature-copy h2');
say(19, f19.masks > 0 && f19.paddingTopEm >= 0.15 && f19.tightMasks === 0, 'full-arch heading lines have room above the capitals (the F)', JSON.stringify(f19));
await shot(pg, 19, '.feature-copy h2', 16);
const f20 = await pg.evaluate(() => getComputedStyle(document.querySelector('.feature-photo img')).objectPosition);
say(20, f20 === '56% 85%', 'full-arch photo framed lower, less headroom (see crop)', f20);
await shot(pg, 20, '.feature-photo .photo', 8);

// #21, #22: journey heading
await goTo(pg, '#process-scene', 'top 10%', 2800);
const f21 = await clipCheck('.process-head h2');
say(21, f21.masks > 0 && f21.paddingTopEm >= 0.15 && f21.tightMasks === 0, 'journey heading: room above the C', JSON.stringify(f21));
say(22, f21.masks > 0 && f21.paddingTopEm >= 0.15 && f21.tightMasks === 0, 'journey heading: room above the second line', JSON.stringify(f21));
await shot(pg, 21, '.process-head h2', 16);

// #23: no scan line on the technology photo
await goTo(pg, '.tech-image', 'top 20%', 2400);
const scan = await pg.evaluate(() => document.querySelectorAll('.scanline').length);
say(23, scan === 0, 'no brown scan line on the CBCT photo', `${scan} scan line(s)`);
await shot(pg, 23, '.tech-image', 8);

// #8, #9: subtitles gone
const subs = await pg.evaluate(() => ({ gallery: document.querySelectorAll('#results > .wrap > .results-top > p').length, reviews: document.querySelectorAll('#reviews .results-top > p').length }));
say(8, subs.gallery === 0, 'gallery subtitle removed', JSON.stringify(subs));
say(9, subs.reviews === 0, 'reviews subtitle removed', JSON.stringify(subs));
await goTo(pg, '#results', 'top 5%', 2000);
await shot(pg, 8, '#results .results-top', 16);
await goTo(pg, '#reviews', 'top 10%', 2000);
await shot(pg, 9, '#reviews .results-top', 16);

// #13, #25: the closing section is not pinned and starts at once
const fin = await pg.evaluate(() => ({ pinned: ScrollTrigger.getAll().some((t) => t.pin && t.trigger && t.trigger.id === 'final-scene'), spacer: !!document.querySelector('#invitation .pin-spacer') }));
await goTo(pg, '#invitation', 'top 0%', 2500);
const finView = await pg.evaluate(() => { const h = document.querySelector('#invitation h2').getBoundingClientRect(); return { headingTop: Math.round(h.top), vh: innerHeight }; });
say(13, !fin.pinned && !fin.spacer && finView.headingTop < finView.vh * 0.6, 'closing section is not held; its heading is on screen as soon as the section arrives', JSON.stringify({ ...fin, ...finView }));
say(25, !fin.pinned && !fin.spacer, 'no extra scrolling to start the closing animation', JSON.stringify(fin));
await shot(pg, 13, '#invitation', 0);

// #14, #15: footer lines gone
const foot = await pg.evaluate(() => ({ tagline: document.querySelectorAll('.footergrid > div:nth-of-type(1) > p').length, bottom: [...document.querySelectorAll('.footer-bottom span')].map((s) => s.textContent.trim()), adc: /Aesthetic Dental Centers/i.test(document.querySelector('.footer').innerText) }));
say(14, foot.tagline === 0, 'footer tagline removed', JSON.stringify(foot));
say(15, foot.bottom.length === 1 && !foot.adc, '"By Aesthetic Dental Centers" removed from the footer', JSON.stringify(foot.bottom));
await goTo(pg, '.footer', 'top 30%', 1500);
await shot(pg, 14, '.footer', 0);
say('-', pg.errors.length === 0, 'desktop: no page errors', pg.errors.join(' | '));
await pg.close();

/* ================= phone ================= */
pg = await open(390, 844);
await goTo(pg, '.doc-grid', 'top 20%', 2000);
const mark = await pg.evaluate(() => { const m = document.querySelector('.team-mark'); const b = m.getBoundingClientRect(); const p = document.querySelector('.doc-portrait').getBoundingClientRect(); return { left: Math.round(b.left), right: Math.round(b.right), vw: innerWidth, text: m.textContent, coveredBy: Math.round(Math.max(0, b.bottom - p.top)), h: Math.round(b.height) }; });
say(17, mark.left >= 0 && mark.right <= mark.vw && mark.coveredBy < mark.h * 0.35, 'phone: "Meskin" fits the screen and sits clear of the arch', JSON.stringify(mark));
await shot(pg, 17, '.doc-grid', 0);
say('-', pg.errors.length === 0, 'phone: no page errors', pg.errors.join(' | '));
await pg.close();

await browser.close();
console.log('\n#10 not checked: the reviews widget account is waiting on a decision.');
console.log(failed ? `\n${failed} FAILED` : '\nall passed');
process.exitCode = failed ? 1 : 0;
