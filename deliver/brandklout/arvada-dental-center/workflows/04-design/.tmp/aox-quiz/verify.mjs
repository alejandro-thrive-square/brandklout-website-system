#!/usr/bin/env node
/**
 * verify.mjs — the gate for the three local pages. It serves this folder over
 * http (sessionStorage and the redirect need a real origin), drives Chrome
 * over CDP, and CLICKS: a gate that only reads markup passes a quiz whose
 * buttons are dead.
 *
 *   layout   no horizontal overflow, every image loaded, no console error,
 *            at 360 / 390 / 768 / 1024 / 1440 / 1920, on all three pages
 *   quiz     answer four questions, fail validation on purpose, submit, land
 *            on the thank-you page greeted by name (landing AND consult)
 *   video    a face tile opens the lightbox with a player, close removes it
 *   cta      "See if I qualify" brings the quiz into view; sticky bar shows
 *
 *   node verify.mjs            # everything, screenshots into shots/
 */
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { join, extname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const SHOTS = join(HERE, 'shots');
mkdirSync(SHOTS, { recursive: true });
const PAGES = { landing: 'all-on-x-quiz.html', consult: 'all-on-x-quiz-consult.html', thanks: 'all-on-x-quiz-thank-you.html' };
const WIDTHS = [360, 390, 768, 1024, 1440, 1920];
const SHOT_WIDTHS = [390, 1440];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---- static server ---- */
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript' };
const server = createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, '');
  const file = join(HERE, path);
  if (!file.startsWith(HERE) || !existsSync(file)) { res.writeHead(404); res.end('not found'); return; }
  res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
  res.end(readFileSync(file));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const ORIGIN = `http://127.0.0.1:${server.address().port}`;

/* ---- chrome ---- */
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => existsSync(p));
const PORT = 9200 + (process.pid % 700);
const PROFILE = join(tmpdir(), `aox-quiz-verify-${process.pid}`);
const proc = spawn(CHROME, [
  `--remote-debugging-port=${PORT}`, '--user-data-dir=' + PROFILE, '--headless=new',
  '--no-first-run', '--no-default-browser-check', '--hide-scrollbars',
  '--autoplay-policy=no-user-gesture-required', '--window-size=1440,900', 'about:blank',
], { stdio: 'ignore' });

let wsUrl;
for (let i = 0; i < 60 && !wsUrl; i++) {
  try { const r = await fetch(`http://127.0.0.1:${PORT}/json/version`); if (r.ok) wsUrl = (await r.json()).webSocketDebuggerUrl; }
  catch { await wait(300); }
}
if (!wsUrl) throw new Error('Chrome did not expose a debugging port');
const ws = new WebSocket(wsUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let msgId = 0; const pending = new Map(); let sink = null;
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { const { res, rej } = pending.get(m.id); pending.delete(m.id); m.error ? rej(new Error(m.error.message)) : res(m.result); }
  else if (sink) sink(m);
};
const send = (method, params = {}, sessionId) => {
  const id = ++msgId; ws.send(JSON.stringify({ id, method, params, sessionId }));
  return new Promise((res, rej) => pending.set(id, { res, rej }));
};

async function open(url, width, height = 900) {
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  const errs = [];
  sink = (m) => {
    if (m.sessionId !== sessionId) return;
    if (m.method === 'Runtime.exceptionThrown') errs.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errs.push(m.params.args.map((a) => a.description || a.value).join(' '));
  };
  await send('Runtime.enable', {}, sessionId);
  await send('Page.enable', {}, sessionId);
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width <= 430 }, sessionId);
  if (width <= 430) await send('Emulation.setTouchEmulationEnabled', { enabled: true }, sessionId);
  await send('Page.navigate', { url }, sessionId);
  const ev = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }, sessionId);
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result.value;
  };
  const ready = async () => {
    for (let i = 0; i < 80; i++) { try { if (await ev(`document.readyState === 'complete'`)) break; } catch { /* navigating */ } await wait(150); }
    await ev(`document.fonts.ready.then(() => 1)`);
  };
  await ready();
  /* A real click at the element's centre, through the input pipeline. */
  const click = async (selector) => {
    const box = await ev(`(function(){ var e = document.querySelector(${JSON.stringify(selector)}); if (!e) return null;
      e.scrollIntoView({ block: 'center', behavior: 'instant' }); var r = e.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height }; })()`);
    if (!box || !box.w || !box.h) throw new Error('not clickable: ' + selector);
    await wait(60);
    for (const type of ['mousePressed', 'mouseReleased'])
      await send('Input.dispatchMouseEvent', { type, x: box.x, y: box.y, button: 'left', clickCount: 1 }, sessionId);
  };
  const type = async (selector, text) => { await click(selector); await send('Input.insertText', { text }, sessionId); };
  const shot = async (name) => {
    await ev(`(async function(){ var h = document.documentElement.scrollHeight;
      for (var y = 0; y < h; y += Math.round(innerHeight * 0.7)) { window.scrollTo({ top: y, behavior: 'instant' }); await new Promise(function(r){ setTimeout(r, 80); }); }
      window.scrollTo({ top: 0, behavior: 'instant' }); return 1; })()`);
    await wait(500);
    const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true }, sessionId);
    writeFileSync(join(SHOTS, name), Buffer.from(data, 'base64'));
  };
  const close = () => send('Target.closeTarget', { targetId });
  return { ev, click, type, shot, close, ready, errs, sessionId };
}

const fails = [];
const ok = (cond, label) => { console.log(`${cond ? '  ok  ' : '  FAIL'} ${label}`); if (!cond) fails.push(label); };

/* ---- layout ---- */
console.log('\n-- layout');
for (const [key, file] of Object.entries(PAGES)) {
  for (const width of WIDTHS) {
    const p = await open(`${ORIGIN}/${file}`, width);
    await p.ev(`(async function(){ var h = document.documentElement.scrollHeight;
      for (var y = 0; y < h; y += Math.round(innerHeight * 0.7)) { window.scrollTo({ top: y, behavior: 'instant' }); await new Promise(function(r){ setTimeout(r, 120); }); }
      window.scrollTo({ top: 0, behavior: 'instant' }); return 1; })()`);
    await wait(700);
    const m = await p.ev(`(function(){
      var imgs = Array.prototype.slice.call(document.images);
      return { scrollW: document.documentElement.scrollWidth, inner: window.innerWidth,
        imgs: imgs.length, broken: imgs.filter(function(i){ return !i.complete || !i.naturalWidth; }).map(function(i){ return i.src; }),
        brand: (function(){
          function hex(c){ var p = c.match(/[\\d.]+/g).slice(0, 3); return '#' + p.map(function(n){ return ('0' + Math.round(n).toString(16)).slice(-2); }).join(''); }
          function cs(sel){ var e = document.querySelector(sel); return e ? getComputedStyle(e) : null; }
          var loaded = []; document.fonts.forEach(function(f){ if (f.status === 'loaded') loaded.push(f.family.replace(/["']/g, '') + ' ' + f.weight); });
          var h = cs('h1'), b = cs('body'), t = cs('.topbar'), g = cs('.btn-gold');
          return { loaded: loaded.sort().join(', '), h1: h.fontFamily.split(',')[0].replace(/["']/g, '') + ' ' + h.fontWeight + ' ' + h.textTransform,
            body: b.fontFamily.split(',')[0] + ' ' + b.fontSize, ground: hex(b.backgroundColor), ink: hex(b.color), dark: hex(t.backgroundColor),
            cta: g ? hex(g.backgroundColor) + ' ' + hex(g.color) + ' ' + g.borderRadius + ' ' + g.textTransform : '' }; })() }; })()`);
    ok(m.scrollW <= m.inner, `${key} ${width}: no horizontal overflow (${m.scrollW}/${m.inner})`);
    ok(m.broken.length === 0, `${key} ${width}: ${m.imgs} images loaded${m.broken.length ? ' — broken: ' + m.broken.join(', ') : ''}`);
    ok(p.errs.length === 0, `${key} ${width}: no console errors${p.errs.length ? ' — ' + p.errs.join(' | ') : ''}`);
    if (width === 1440) {
      // The brand, as the live site renders it (brand/*.json). A family that is
      // named but never loads falls back to Verdana or Tahoma and still "passes"
      // a computed-style check, so the loaded faces are asserted too.
      const b = m.brand;
      ok(b.loaded === 'Centurygothic 400, Centurygothic 700, area extended 700', `${key}: brand font files loaded (${b.loaded})`);
      ok(b.h1 === 'area extended 700 capitalize', `${key}: h1 is ${b.h1}`);
      ok(b.body === 'Centurygothic 17px', `${key}: body is ${b.body}`);
      ok(b.ground === '#fdf8ef' && b.ink === '#222222' && b.dark === '#5f5f5d', `${key}: grounds and ink ${b.ground} ${b.ink} ${b.dark}`);
      ok(b.cta === '#c8b282 #222222 0px uppercase', `${key}: primary button ${b.cta}`);
    }
    if (SHOT_WIDTHS.includes(width)) await p.shot(`${key}-${width}.png`);
    await p.close();
  }
}

/* ---- quiz, end to end, on both pages that carry it ---- */
for (const key of ['landing', 'consult']) {
  console.log(`\n-- quiz on ${key} (390)`);
  const p = await open(`${ORIGIN}/${PAGES[key]}?utm_source=verify`, 390, 844);
  ok(await p.ev(`document.querySelectorAll('#quiz-body .opt').length === 4`), 'question 1 renders four options');
  for (let q = 1; q <= 4; q++) {
    await p.click(`#quiz-body .opt:nth-of-type(${q === 2 ? 3 : 1})`);   // question 2: "Both upper and lower"
    await wait(420);
  }
  ok(await p.ev(`!!document.getElementById('lead-form')`), 'four clicks reach the contact step');
  ok(await p.ev(`document.querySelector('.est-n').textContent`) === '$37,590', 'both arches shows $37,590');
  await p.click('#quiz-body .back'); await wait(200);
  ok(await p.ev(`document.querySelectorAll('#quiz-body .opt[aria-pressed="true"]').length === 1`), 'Back returns to question 4 with the answer kept');
  await p.click('#quiz-body .opt[aria-pressed="true"]'); await wait(420);
  await p.click('#lead-form button[type="submit"]'); await wait(200);
  ok(await p.ev(`document.getElementById('f-name').getAttribute('aria-invalid') === 'true' && !document.getElementById('f-phone-err').hidden`), 'empty submit shows field errors');
  ok(await p.ev(`location.pathname`) === '/' + PAGES[key], 'empty submit does not leave the page');
  await p.type('#f-name', 'Dana');
  await p.type('#f-phone', '3035550123');
  await p.type('#f-email', 'dana@example.com');
  await p.click('#lead-form button[type="submit"]');
  for (let i = 0; i < 40; i++) { await wait(150); try { if ((await p.ev(`location.pathname`)) === '/' + PAGES.thanks) break; } catch { /* navigating */ } }
  await p.ready();
  ok(await p.ev(`location.pathname`) === '/' + PAGES.thanks, 'valid submit lands on the thank-you page');
  ok(await p.ev(`document.getElementById('ty-title').textContent`) === 'Request received, Dana.', 'thank-you greets by first name');
  ok(await p.ev(`!/Dana|3035550123|example\\.com/.test(location.href)`), 'no personal detail in the thank-you URL');
  if (key === 'landing') await p.shot('thanks-after-submit-390.png');
  await p.close();
}

/* ---- ad message match and quiz tracking ---- */
console.log('\n-- headline swap and tracking');
{
  const p = await open(`${ORIGIN}/${PAGES.landing}?utm_source=google&utm_campaign=aox&gclid=TESTGCLID&hl=price`, 1440);
  ok(await p.ev(`document.getElementById('hl').textContent`) === 'Full-arch implants for $18,795 per arch, in writing.', '?hl=price swaps the headline');
  for (let q = 1; q <= 4; q++) { await p.click('#quiz-body .opt:nth-of-type(1)'); await wait(420); }
  await p.type('#f-name', 'Dana'); await p.type('#f-phone', '(303) 555-0123');
  ok(await p.ev(`Array.isArray(window.dataLayer) && window.dataLayer.filter(function(e){ return e.event === 'quiz_step'; }).length === 4 && window.dataLayer.some(function(e){ return e.event === 'quiz_start'; })`), 'dataLayer has quiz_start and four quiz_step events');
  await p.close();
}

/* ---- video lightbox ---- */
for (const key of ['landing', 'thanks']) {
  console.log(`\n-- video lightbox on ${key} (1440)`);
  const p = await open(`${ORIGIN}/${PAGES[key]}`, 1440);
  ok(await p.ev(`document.querySelectorAll('iframe').length === 0`), 'no player exists on page load');
  await p.click('a.face[data-yt="n6pB30XJwng"]'); await wait(900);
  ok(await p.ev(`(function(){ var d = document.querySelector('dialog.vid'); var f = d && d.querySelector('iframe'); return !!(d && d.open && f && f.src.indexOf('/embed/n6pB30XJwng') > 0); })()`), 'a face tile opens the player for that video');
  ok(await p.ev(`location.pathname`) === '/' + PAGES[key], 'the visitor stays on the page');
  if (key === 'landing') { const { data } = await send('Page.captureScreenshot', { format: 'png' }, p.sessionId); writeFileSync(join(SHOTS, 'lightbox-1440.png'), Buffer.from(data, 'base64')); }
  await p.click('.vid-x'); await wait(300);
  ok(await p.ev(`(function(){ var d = document.querySelector('dialog.vid'); return !d.open && !d.querySelector('iframe'); })()`), 'close removes the player');
  ok(await p.ev(`window.dataLayer.some(function(e){ return e.event === 'video_click' && e.video_id === 'n6pB30XJwng'; })`), 'video_click is tracked');
  await p.close();
}

/* ---- calls to action ---- */
console.log('\n-- calls to action (landing, 390)');
{
  const p = await open(`${ORIGIN}/${PAGES.landing}`, 390, 844);
  ok(await p.ev(`!document.getElementById('sticky').classList.contains('show')`), 'sticky bar hidden while the quiz is on screen');
  await p.ev(`(function(){ document.getElementById('price').scrollIntoView({ behavior: 'instant' }); return 1; })()`); await wait(600);
  ok(await p.ev(`document.getElementById('sticky').classList.contains('show')`), 'sticky bar shows once the quiz is out of view');
  await p.click('#sticky .js-to-quiz'); await wait(1400);
  ok(await p.ev(`(function(){ var r = document.getElementById('quiz').getBoundingClientRect(); return r.top >= -2 && r.top < innerHeight / 2; })()`), '"See if I qualify" brings the quiz into view');
  const tels = await p.ev(`Array.prototype.slice.call(document.querySelectorAll('a[href^="tel:"]')).map(function(a){ return a.getAttribute('href'); })`);
  ok(tels.length >= 4 && tels.every((t) => t === 'tel:+17204193699'), `one phone number in every tel: link (${tels.length})`);
  await p.click('a.top-call'); await wait(150);
  ok(await p.ev(`window.dataLayer.some(function(e){ return e.event === 'phone_click' && e.cta_location === 'topbar'; })`), 'phone_click is tracked once per click') ;
  ok(await p.ev(`window.dataLayer.filter(function(e){ return e.event === 'phone_click'; }).length === 1`), 'phone_click does not fire twice');
  await p.close();
}

ws.close(); proc.kill(); server.close();
await wait(500);
try { rmSync(PROFILE, { recursive: true, force: true }); } catch { /* chrome still letting go */ }
console.log(fails.length ? `\n${fails.length} FAILED\n` + fails.map((f) => '  - ' + f).join('\n') : '\nall checks passed');
process.exit(fails.length ? 1 : 0);
