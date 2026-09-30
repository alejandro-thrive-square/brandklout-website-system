// Client script, 2026-09-30. Drives the built page and asserts behaviour a screenshot cannot show:
// anchors travel, tabs switch, the FAQ opens, a film mounts its player, the drawer opens at 390,
// every pin holds and scrubs through three different states, reduced motion pins nothing and
// hides nothing, and no text falls under 4.5:1 (3:1 for large type) with motion ON.
// Usage (from the step's output/ folder; never pipe Node on Windows): node code/probe.mjs > probe.txt
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const here = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(here, 'site-src', 'dist');
const require = createRequire(path.resolve(here, '../../../../scenario-1-migration/01-old-site-capture/scripts/package.json'));
const puppeteer = require('puppeteer-core');
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const f = path.join(DIST, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const URL_ = `http://127.0.0.1:${server.address().port}/`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] });
let failed = 0;
const say = (ok, name, detail = '') => { if (!ok) failed++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  ' + detail : ''}`); };

const open = async (w, h, opts = {}) => {
  const pg = await browser.newPage();
  const errors = [];
  pg.on('pageerror', (e) => errors.push(e.message));
  pg.errors = errors;
  // The GoHighLevel survey answers 401 to Turnstile on localhost; it is not what is proved here.
  await pg.setRequestInterception(true);
  pg.on('request', (r) => (/leadconnectorhq|msgsndr|challenges[.]cloudflare/.test(r.url()) ? r.abort() : r.continue()));
  if (opts.reduce) await pg.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await pg.setViewport({ width: w, height: h, isMobile: w < 700, hasTouch: w < 700 });
  await pg.goto(URL_, { waitUntil: 'networkidle2' });
  await sleep(2200);
  return pg;
};
const go = async (pg, y) => {
  await pg.evaluate((y) => { if (window.WZ && WZ.smoother) WZ.smoother.scrollTo(y, false); else window.scrollTo(0, y); }, y);
  await sleep(900);
};
const centre = async (pg, sel) => {
  const y = await pg.evaluate((sel) => {
    const el = document.querySelector(sel);
    const st = window.WZ && WZ.smoother ? WZ.smoother.scrollTop() : window.scrollY;
    return el.getBoundingClientRect().top + st - window.innerHeight / 2;
  }, sel);
  await go(pg, Math.max(0, y));
};

/* ---------- desktop, motion on ---------- */
let pg = await open(1440, 900);
const y0 = await pg.evaluate(() => window.scrollY);
await pg.click('.arrival__actions .btn');
await sleep(3000);
const y1 = await pg.evaluate(() => ({ y: window.scrollY, top: Math.round(document.getElementById('invitation').getBoundingClientRect().top) }));
say(y1.y > y0 + 1000 && Math.abs(y1.top - 96) < 140, 'hero call to action travels to the invitation', `scrollY ${y0} -> ${Math.round(y1.y)}, chapter top at ${y1.top}px`);
await go(pg, 0);

const pins = await pg.evaluate(() => ScrollTrigger.getAll().filter((t) => t.pin).map((t) => ({ id: t.trigger.id, start: t.start, end: t.end })));
say(pins.length >= 3, 'pinned scenes', pins.map((p) => `${p.id} ${Math.round(p.end - p.start)}px`).join(', '));
for (const p of pins) {
  const states = [];
  for (const f of [0.25, 0.5, 0.75]) {
    await go(pg, p.start + (p.end - p.start) * f);
    states.push(await pg.evaluate((id) => {
      const el = document.getElementById(id);
      const fp = [];
      el.querySelectorAll('*').forEach((n, i) => { if (i > 700) return; const cs = getComputedStyle(n); fp.push(cs.opacity + cs.transform + cs.clipPath + cs.color + cs.left); });
      return { top: Math.round(el.getBoundingClientRect().top), fp: fp.join('|') };
    }, p.id));
  }
  const held = states.every((s) => Math.abs(s.top) <= 2);
  const differs = states[0].fp !== states[1].fp && states[1].fp !== states[2].fp;
  say(held && differs, `pin ${p.id} holds and scrubs`, `top ${states.map((s) => s.top).join('/')}px at 25/50/75%, the three states ${differs ? 'differ' : 'are IDENTICAL'}`);
}
/* magnitude, not presence */
const pathPin = pins.find((p) => p.id === 'path-scene');
await go(pg, pathPin.start);
const xa = await pg.evaluate(() => document.querySelector('[data-path-track]').getBoundingClientRect().left);
await go(pg, pathPin.end);
const xb = await pg.evaluate(() => document.querySelector('[data-path-track]').getBoundingClientRect().left);
say(xa - xb > 400, 'the path travels sideways', `${Math.round(xa - xb)}px (floor 400)`);
const geo = await pg.evaluate(() => { const s = document.getElementById('path-scene'); const sp = s.parentElement; return { scene: s.offsetHeight, spacer: sp.classList.contains('pin-spacer') ? sp.offsetHeight : -1 }; });
say(Math.abs(geo.spacer - (geo.scene + (pathPin.end - pathPin.start))) < 4, 'path section height = scene + travel', `${geo.spacer} = ${geo.scene} + ${Math.round(pathPin.end - pathPin.start)}`);
const max = await pg.evaluate(() => ScrollTrigger.maxScroll(window));
await go(pg, max * 0.5);
await sleep(600);
const prog = await pg.evaluate(() => new DOMMatrix(getComputedStyle(document.getElementById('navProgress')).transform).a);
say(Math.abs(prog - 0.5) < 0.04, 'reading progress tracks the document', `scaleX ${prog.toFixed(3)} at 50%`);
const fits = [];
for (const id of ['tx', 'cases-scene', 'path-scene', 'difference-stage']) {
  const p = pins.find((x) => x.id === id);
  await go(pg, p.start + (p.end - p.start) * 0.5);
  fits.push(await pg.evaluate((id) => {
    const el = document.getElementById(id);
    let worst = 0;
    el.querySelectorAll('h2, h3, p, a, img, svg, figure').forEach((n) => { const r = n.getBoundingClientRect(); if (r.height && getComputedStyle(n).visibility !== 'hidden' && parseFloat(getComputedStyle(n).opacity) > 0.05) worst = Math.max(worst, r.bottom - window.innerHeight); });
    return `${id} ${Math.round(worst)}`;
  }, id));
}
say(fits.every((f) => Number(f.split(' ')[1]) <= 0), 'every pinned scene fits 1440x900', fits.join(', ') + ' (px past the bottom edge)');

/* controls */
await centre(pg, '#dr-tab-2');
await pg.click('#dr-tab-2'); await sleep(900);
say(await pg.evaluate(() => getComputedStyle(document.getElementById('dr-panel-2')).display !== 'none' && getComputedStyle(document.getElementById('dr-panel-1')).display === 'none' && document.getElementById('dr-tab-2').getAttribute('aria-selected') === 'true'), 'doctor tabs switch');
await centre(pg, '#visit-tab-3');
await pg.click('#visit-tab-3'); await sleep(1400);
say(await pg.evaluate(() => { const p = document.getElementById('visit-panel-3'); const img = p.querySelector('img'); return getComputedStyle(p).display !== 'none' && img.complete && img.naturalWidth > 0 && img.getBoundingClientRect().height > 100; }), 'visit tabs switch and the photograph is painted');
await centre(pg, '#faq-q-2');
await pg.click('#faq-q-2'); await sleep(1000);
const faqA = await pg.evaluate(() => document.getElementById('faq-2').getBoundingClientRect().height);
await pg.click('#faq-q-3'); await sleep(1000);
const faqB = await pg.evaluate(() => [document.getElementById('faq-2').getBoundingClientRect().height, document.getElementById('faq-3').getBoundingClientRect().height]);
say(faqA > 60 && faqB[0] < 2 && faqB[1] > 60, 'FAQ opens one answer at a time', `answer 2 ${Math.round(faqA)}px then ${Math.round(faqB[0])}px; answer 3 ${Math.round(faqB[1])}px`);
await centre(pg, '[data-vimeo]');
await pg.click('[data-vimeo]'); await sleep(800);
say(await pg.evaluate(() => !!document.querySelector('.film.is-playing iframe[src*="player.vimeo.com/video/1198870167"]')), 'a film mounts its Vimeo player on click');
await go(pg, 0);
await pg.hover('.nav__group:nth-child(2) .nav__top'); await sleep(600);
say(await pg.evaluate(() => getComputedStyle(document.getElementById('menu-services')).visibility === 'visible'), 'services menu opens on hover');
say(pg.errors.length === 0, 'no page errors on desktop', pg.errors.join(' | '));
await pg.close();

/* ---------- contrast with motion ON, after the whole page has been scrolled ---------- */
pg = await open(1440, 900);
const total = await pg.evaluate(() => ScrollTrigger.maxScroll(window));
for (let y = 0; y <= total; y += 700) { await pg.evaluate((y) => WZ.smoother.scrollTo(y, false), y); await sleep(260); }
await sleep(1200);
const low = await pg.evaluate(() => {
  const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  const lum = (c) => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
  const parse = (c) => { const m = c.match(/[\d.]+/g).map(Number); return { r: m[0], g: m[1], b: m[2], a: m[3] === undefined ? 1 : m[3] }; };
  const bgOf = (el) => {
    for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
      const c = parse(getComputedStyle(n).backgroundColor);
      if (c.a > 0.9) return c;
    }
    return { r: 245, g: 240, b: 230 };
  };
  const out = [];
  const seen = new Set();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const t = walker.currentNode;
    if (!t.textContent.trim()) continue;
    const el = t.parentElement;
    if (seen.has(el)) continue;
    seen.add(el);
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    if (el.closest('[aria-hidden="true"], .sr-only, script, style, .tabs__panel:not(.is-active), .visit__panel:not(.is-active), .faq__a:not(.is-open), .drawer, .nav__menu, .chip, .arrival__proof, .film__btn, svg, .skip, .callbar')) continue;
    const fg = parse(cs.color);
    if (fg.a < 0.99) continue;
    const bg = bgOf(el);
    const a = lum(fg), b = lum(bg);
    const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    const px = parseFloat(cs.fontSize);
    const large = px >= 24 || (px >= 18.66 && parseInt(cs.fontWeight, 10) >= 700);
    if (ratio < (large ? 3 : 4.5)) out.push(`${ratio.toFixed(2)}:1 ${Math.round(px)}px <${el.tagName.toLowerCase()} class="${String(el.className).slice(0, 40)}"> "${t.textContent.trim().slice(0, 40)}" ${cs.color} on rgb(${bg.r},${bg.g},${bg.b})`);
  }
  return { checked: seen.size, out };
});
say(low.out.length === 0, 'text contrast with motion on', `${low.checked} text elements, ${low.out.length} under the floor`);
low.out.slice(0, 20).forEach((l) => console.log('      ' + l));
await pg.close();

/* ---------- reduced motion: a branch, not a shorter duration ---------- */
pg = await open(1440, 900, { reduce: true });
const red = await pg.evaluate(() => ({
  motion: document.documentElement.classList.contains('motion'),
  ok: !!(window.WZ && WZ.ok),
  pins: window.ScrollTrigger ? ScrollTrigger.getAll().filter((t) => t.pin).length : 0,
  hidden: [...document.querySelectorAll('main h1, main h2, main h3, main p, main img, main li')].filter((el) => {
    if (el.closest('.tabs__panel:not(.is-active), .visit__panel:not(.is-active), .faq__a:not(.is-open), .sr-only')) return false;
    if (el.closest('details:not([open])') && !el.closest('summary')) return false;
    const cs = getComputedStyle(el);
    return cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.99 || el.getBoundingClientRect().height === 0;
  }).map((el) => el.tagName + '.' + String(el.className).slice(0, 30)).slice(0, 8),
  panels: [...document.querySelectorAll('[data-tx-panel]')].every((p) => p.getBoundingClientRect().height > 40 && getComputedStyle(p).visibility === 'visible'),
}));
say(!red.motion && red.ok && red.pins === 0 && red.hidden.length === 0 && red.panels, 'reduced motion: runtime armed, zero pins, nothing hidden, all three treatments readable', red.hidden.join(' | '));
await pg.click('#faq-q-1'); await sleep(400);
say(await pg.evaluate(() => document.getElementById('faq-1').classList.contains('is-open')), 'reduced motion: the FAQ still opens');
await pg.close();

/* ---------- the widths between the breakpoints: nothing a visitor can press may be cut off ---------- */
for (const w of [1920, 1366, 1280, 1279, 1024, 992, 768]) {
  pg = await open(w, 800, { reduce: true });
  const c = await pg.evaluate(() => ({
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    clipped: [...document.querySelectorAll('a, button')].filter((el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && (r.right > innerWidth + 1 || r.left < -1) && !el.closest('.path__rail, .path__track, .cases__track, .drawer, .nav__menu, .life__marquee, .skip'); }).map((el) => el.textContent.trim().slice(0, 28)),
  }));
  say(c.overflow <= 0 && c.clipped.length === 0, `${w}: no overflow, no control cut off`, c.clipped.join(' | ') + (c.overflow > 0 ? ` overflow ${c.overflow}px` : ''));
  await pg.close();
}

/* ---------- phone ---------- */
pg = await open(390, 844);
const m = await pg.evaluate(() => ({
  overflow: document.documentElement.scrollWidth - 390,
  pins: ScrollTrigger.getAll().filter((t) => t.pin).length,
  smoother: !!WZ.smoother,
  clipped: [...document.querySelectorAll('a, button, input')].filter((el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && cs.visibility !== 'hidden' && r.right > 391 && !el.closest('.path__rail, .cases__track, .drawer, .nav__links, .life__marquee'); }).map((el) => el.textContent.trim().slice(0, 30)),
  small: [...document.querySelectorAll('main a, main button, .callbar a, .nav__burger, footer a')].filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && getComputedStyle(el).visibility !== 'hidden' && r.height < 43.5 && !el.closest('.tabs__panel:not(.is-active), .visit__panel:not(.is-active)'); }).map((el) => `${el.textContent.trim().slice(0, 24)} ${Math.round(el.getBoundingClientRect().height)}px`).slice(0, 12),
  body: parseFloat(getComputedStyle(document.querySelector('.t-body')).fontSize),
  smallText: [...document.querySelectorAll('main p, main li, main a, main dd, main figcaption, footer a, footer p')].map((el) => parseFloat(getComputedStyle(el).fontSize)).reduce((a, b) => Math.min(a, b), 99),
  callbar: getComputedStyle(document.querySelector('.callbar')).display,
}));
say(m.overflow <= 0, 'phone: no horizontal overflow against the device width', `${m.overflow}px`);
say(m.clipped.length === 0, 'phone: no control past the right edge', m.clipped.join(' | '));
say(m.small.length === 0, 'phone: tap targets at least 44px tall', m.small.join(' | '));
say(m.body >= 16 && m.smallText >= 13.5, 'phone: body copy at 16px or over, nothing under 14px', `body ${m.body.toFixed(1)}px, smallest ${m.smallText.toFixed(1)}px`);
say(m.pins >= 3 && !m.smoother && m.callbar !== 'none', 'phone: pins survive, no smoother, call bar present', `${m.pins} pins`);
await pg.click('#burger'); await sleep(900);
say(await pg.evaluate(() => { const d = document.getElementById('drawer'); const b = document.getElementById('burger').getBoundingClientRect(); const top = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2); return d.classList.contains('is-open') && getComputedStyle(d).visibility === 'visible' && !!top.closest('#burger'); }), 'phone: drawer opens and its close button stays on top');
await pg.click('#burger'); await sleep(900);
say(await pg.evaluate(() => !document.getElementById('drawer').classList.contains('is-open')), 'phone: drawer closes');
const rail = await pg.evaluate(async () => {
  const r = document.querySelector('.path__rail');
  r.scrollIntoView({ block: 'center' });
  await new Promise((x) => setTimeout(x, 600));
  return { first: Math.round(document.querySelector('.step').getBoundingClientRect().left), swipe: r.scrollWidth - r.clientWidth };
});
say(rail.first >= 12 && rail.swipe > 400, 'phone: the path is a swipe rail that keeps its gutter', `first step at ${rail.first}px, ${rail.swipe}px to swipe`);
say(pg.errors.length === 0, 'no page errors on the phone', pg.errors.join(' | '));
await pg.close();

await browser.close();
server.close();
console.log(failed ? `\n${failed} FAILED` : '\nall passed');
process.exitCode = failed ? 1 : 0;
