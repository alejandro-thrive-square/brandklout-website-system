// Client script, 2026-09-30 (rewritten for the concept-04 build). Drives the built page and asserts
// behaviour a screenshot cannot show: anchors travel, every pin holds and scrubs through three
// different states, the FAQ opens one answer at a time, reduced motion pins nothing and hides
// nothing, text contrast holds with motion ON, and nothing a visitor can press is cut off.
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
  pg.errors = [];
  pg.on('pageerror', (e) => pg.errors.push(e.message));
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

/* ---------- desktop, motion on ---------- */
let pg = await open(1440, 900);
await pg.click('.hero-actions .btn');
await sleep(3000);
const y1 = await pg.evaluate(() => ({ y: window.scrollY, top: Math.round(document.getElementById('consult').getBoundingClientRect().top) }));
say(y1.y > 1000 && Math.abs(y1.top - 12) < 120, 'hero button travels to the consultation', `scrollY ${Math.round(y1.y)}, section top at ${y1.top}px`);
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
      const r = el.getBoundingClientRect();
      return { top: Math.round(r.top), fits: r.top >= -1 && r.bottom <= window.innerHeight + 1, fp: fp.join('|') };
    }, p.id));
  }
  const held = states.every((s) => Math.abs(s.top - states[0].top) <= 2);
  const differs = states[0].fp !== states[1].fp && states[1].fp !== states[2].fp;
  say(held && differs && states.every((s) => s.fits), `pin ${p.id} holds, fits the viewport and scrubs`, `top ${states.map((s) => s.top).join('/')}px at 25/50/75%, the three states ${differs ? 'differ' : 'are IDENTICAL'}`);
}
const max = await pg.evaluate(() => ScrollTrigger.maxScroll(window));
await go(pg, max * 0.5);
await sleep(600);
const prog = await pg.evaluate(() => new DOMMatrix(getComputedStyle(document.getElementById('navProgress')).transform).a);
say(Math.abs(prog - 0.5) < 0.04, 'reading progress tracks the document', `scaleX ${prog.toFixed(3)} at 50%`);

await pg.evaluate(() => { const d = document.querySelectorAll('[data-faq] details')[2]; const st = WZ.smoother.scrollTop(); WZ.smoother.scrollTo(d.getBoundingClientRect().top + st - 400, false); });
await sleep(900);
await pg.click('[data-faq] details:nth-child(3) summary'); await sleep(500);
const faq = await pg.evaluate(() => [...document.querySelectorAll('[data-faq] details')].map((d) => d.open));
say(faq[2] && !faq[0] && faq.filter(Boolean).length === 1, 'FAQ opens one answer at a time', JSON.stringify(faq));
say(pg.errors.length === 0, 'no page errors on desktop', pg.errors.join(' | '));
await pg.close();

/* ---------- the scenes at the reviewer's short laptop ---------- */
pg = await open(1512, 735);
const pins2 = await pg.evaluate(() => ScrollTrigger.getAll().filter((t) => t.pin).map((t) => ({ id: t.trigger.id, start: t.start, end: t.end })));
const fit2 = [];
for (const p of pins2) {
  await go(pg, p.start + (p.end - p.start) * 0.5);
  fit2.push(await pg.evaluate((id) => { const r = document.getElementById(id).getBoundingClientRect(); return `${id} ${Math.round(r.top)}..${Math.round(r.bottom)}`; }, p.id));
}
say(fit2.every((f) => { const [a, b] = f.split(' ')[1].split('..').map(Number); return a >= -1 && b <= 736; }), 'every pinned scene fits 1512x735', fit2.join(', '));
await pg.close();

/* ---------- contrast with motion ON, after the whole page has been scrolled ---------- */
pg = await open(1440, 900);
const total = await pg.evaluate(() => ScrollTrigger.maxScroll(window));
for (let y = 0; y <= total; y += 600) { await pg.evaluate((y) => WZ.smoother.scrollTo(y, false), y); await sleep(260); }
await sleep(1200);
const low = await pg.evaluate(() => {
  const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  const lum = (c) => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
  const parse = (c) => { const m = c.match(/[\d.]+/g).map(Number); return { r: m[0], g: m[1], b: m[2], a: m[3] === undefined ? 1 : m[3] }; };
  const bgOf = (el) => { for (let n = el; n && n !== document.documentElement; n = n.parentElement) { const c = parse(getComputedStyle(n).backgroundColor); if (c.a > 0.9) return c; } return { r: 251, g: 250, b: 247 }; };
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
    if (el.closest('[aria-hidden="true"], .sr-only, script, style, details:not([open]) p, .skip, .mobile-cta')) continue;
    const fg = parse(cs.color);
    if (fg.a < 0.99) continue;
    const bg = bgOf(el);
    const a = lum(fg), b = lum(bg);
    const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    const px = parseFloat(cs.fontSize);
    const large = px >= 24 || (px >= 18.66 && parseInt(cs.fontWeight, 10) >= 700);
    if (ratio < (large ? 3 : 4.5)) out.push(`${ratio.toFixed(2)}:1 ${Math.round(px)}px <${el.tagName.toLowerCase()} class="${String(el.className).slice(0, 30)}"> "${t.textContent.trim().slice(0, 36)}" ${cs.color} on rgb(${bg.r},${bg.g},${bg.b})`);
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
  hidden: [...document.querySelectorAll('main h1, main h2, main h3, main p, main img, main li, main blockquote, main b')].filter((el) => {
    if (el.closest('details:not([open])') && !el.closest('summary')) return false;
    const cs = getComputedStyle(el);
    return cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.99 || el.getBoundingClientRect().height === 0;
  }).map((el) => el.tagName + '.' + String(el.className).slice(0, 30)).slice(0, 8),
}));
say(!red.motion && red.ok && red.pins === 0 && red.hidden.length === 0, 'reduced motion: runtime armed, zero pins, nothing hidden', red.hidden.join(' | '));
await pg.close();

/* ---------- between the breakpoints: nothing a visitor can press may be cut off ---------- */
for (const w of [1920, 1366, 1280, 1100, 1024, 992, 991, 768, 767]) {
  pg = await open(w, 800, { reduce: true });
  const c = await pg.evaluate(() => ({
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    clipped: [...document.querySelectorAll('a, button, summary')].filter((el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && (r.right > innerWidth + 1 || r.left < -1) && !el.closest('.skip'); }).map((el) => el.textContent.trim().slice(0, 28)),
    overlap: (() => { const h = document.querySelector('.hero h1').getBoundingClientRect(); const v = document.querySelector('.hero-visual').getBoundingClientRect(); return innerWidth > 767 && h.right > v.left + 1 ? Math.round(h.right - v.left) : 0; })(),
  }));
  say(c.overflow <= 0 && c.clipped.length === 0 && c.overlap === 0, `${w}: no overflow, no control cut off, headline clear of the photograph`, c.clipped.join(' | ') + (c.overflow > 0 ? ` overflow ${c.overflow}px` : '') + (c.overlap ? ` headline over photo by ${c.overlap}px` : ''));
  await pg.close();
}

/* ---------- phone ---------- */
pg = await open(390, 844);
const m = await pg.evaluate(() => ({
  overflow: document.documentElement.scrollWidth - 390,
  pins: ScrollTrigger.getAll().filter((t) => t.pin).length,
  smoother: !!WZ.smoother,
  clipped: [...document.querySelectorAll('a, button, summary')].filter((el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && r.right > 391 && !el.closest('.skip'); }).map((el) => el.textContent.trim().slice(0, 30)),
  small: [...document.querySelectorAll('main a, main summary, .mobile-cta a, nav a, footer a, .topbar a')].filter((el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && r.height < 43.5; }).map((el) => `${el.textContent.trim().slice(0, 24)} ${Math.round(el.getBoundingClientRect().height)}px`).slice(0, 12),
  body: parseFloat(getComputedStyle(document.querySelector('.hero-copy > p')).fontSize),
  smallest: (() => { let min = 99, who = ''; document.querySelectorAll('body *').forEach((el) => { if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) return; const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') return; const px = parseFloat(cs.fontSize); if (px < min) { min = px; who = el.tagName + '.' + String(el.className).slice(0, 20); } }); return `${min.toFixed(1)}px ${who}`; })(),
  callbar: getComputedStyle(document.querySelector('.mobile-cta')).display,
}));
say(m.overflow <= 0, 'phone: no horizontal overflow against the device width', `${m.overflow}px`);
say(m.clipped.length === 0, 'phone: no control past the right edge', m.clipped.join(' | '));
say(m.small.length === 0, 'phone: tap targets at least 44px tall', m.small.join(' | '));
say(m.body >= 16 && parseFloat(m.smallest) >= 11.5, 'phone: body copy at 16px or over, nothing under 12px', `body ${m.body.toFixed(1)}px, smallest ${m.smallest}`);
say(!m.smoother && m.callbar !== 'none' && m.pins === 0, 'phone: no pins, no smoother, call bar present', `${m.pins} pins`);
const before = await pg.evaluate(() => getComputedStyle(document.querySelector('.result__after')).clipPath);
await pg.evaluate(() => { const c = document.querySelector('[data-case]'); window.scrollTo(0, c.getBoundingClientRect().top + window.scrollY - 60); });
await sleep(1200);
const after = await pg.evaluate(() => getComputedStyle(document.querySelector('.result__after')).clipPath);
say(before !== after && /inset\(0(px)? 0(%|px)?/.test(after.replace('0px 0%', '0 0%')), 'phone: scroll wipes the first case from before to after', `${before} -> ${after}`);
say(pg.errors.length === 0, 'no page errors on the phone', pg.errors.join(' | '));
await pg.close();

await browser.close();
server.close();
console.log(failed ? `\n${failed} FAILED` : '\nall passed');
process.exitCode = failed ? 1 : 0;
