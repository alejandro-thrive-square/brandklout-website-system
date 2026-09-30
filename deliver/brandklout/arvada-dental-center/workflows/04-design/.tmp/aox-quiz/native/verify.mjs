#!/usr/bin/env node
/**
 * native/verify.mjs — the gate for the native pages. It CLICKS.
 *
 *   layout   no horizontal overflow, every image loaded, no script error, at
 *            360 / 390 / 768 / 1024 / 1440 / 1920; brand fonts and colours
 *   quiz     four answers, a deliberately failed submit, a real one, the
 *            thank-you page greeting by name (landing AND consult)
 *   lead     the JSON a webhook receives, captured by a local endpoint
 *   guard    with no webhook and a production hostname, the quiz refuses
 *   video    a face tile opens the dialog with a player; close removes it
 *   cta      "See if I qualify" brings the quiz into view; sticky bar shows
 *
 *   node native/verify.mjs             # the local pages (out/)
 *   node native/verify.mjs --staging   # the published webflow.io pages
 *
 * On staging the page shares the document with the site's own scripts, so the
 * consent banner is dismissed first (it covers the sticky bar), console errors
 * are listed rather than failed, and the phone links only have to agree with
 * each other because call tracking swaps the number. Each staging run takes a
 * call-tracking pool number: run it once per publish, not in a loop.
 */
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { join, extname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(HERE, 'out');
const SHOTS = join(HERE, '..', 'shots');
mkdirSync(SHOTS, { recursive: true });
const LIVE = process.argv.includes('--staging');
const SLUGS = { landing: 'all-on-x-quiz', consult: 'all-on-x-quiz-consult', thanks: 'all-on-x-quiz-thank-you' };
const WIDTHS = [360, 390, 768, 1024, 1440, 1920];
const SHOT_WIDTHS = [390, 1440];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---- static server, with an endpoint that records what a webhook would get ---- */
const hooks = [];
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript' };
const server = createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, '');
  if (path === 'hook') {
    res.setHeader('access-control-allow-origin', '*'); res.setHeader('access-control-allow-headers', 'content-type');
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
    let body = ''; req.on('data', (c) => { body += c; }); req.on('end', () => { hooks.push(body); res.writeHead(200); res.end('ok'); });
    return;
  }
  const file = join(ROOT, path);
  if (!file.startsWith(ROOT) || !existsSync(file)) { res.writeHead(404); res.end('not found'); return; }
  res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
  res.end(readFileSync(file));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const LOCAL = `http://127.0.0.1:${server.address().port}`;
const ORIGIN = LIVE ? 'https://arvadadentalcenter.webflow.io/ads-landing-pages' : LOCAL;
const URL_OF = (key) => `${ORIGIN}/${SLUGS[key]}${LIVE ? '' : '.html'}`;
const PATH = (key) => new URL(URL_OF(key)).pathname;
const TAG = LIVE ? 'native-staging-' : 'native-';

/* ---- chrome ---- */
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => existsSync(p));
const PORT = 9200 + (process.pid % 700);
const PROFILE = join(tmpdir(), `aox-native-verify-${process.pid}`);
const proc = spawn(CHROME, [`--remote-debugging-port=${PORT}`, '--user-data-dir=' + PROFILE, '--headless=new', '--no-first-run', '--no-default-browser-check',
  '--hide-scrollbars', '--autoplay-policy=no-user-gesture-required', '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' });
let wsUrl;
for (let i = 0; i < 60 && !wsUrl; i++) { try { const r = await fetch(`http://127.0.0.1:${PORT}/json/version`); if (r.ok) wsUrl = (await r.json()).webSocketDebuggerUrl; } catch { await wait(300); } }
if (!wsUrl) throw new Error('Chrome did not expose a debugging port');
const ws = new WebSocket(wsUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let msgId = 0; const pending = new Map(); let sink = null;
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { const { res, rej } = pending.get(m.id); pending.delete(m.id); m.error ? rej(new Error(m.error.message)) : res(m.result); }
  else if (sink) sink(m);
};
const send = (method, params = {}, sessionId) => { const id = ++msgId; ws.send(JSON.stringify({ id, method, params, sessionId })); return new Promise((res, rej) => pending.set(id, { res, rej })); };

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
  if (LIVE) {
    for (let i = 0; i < 20; i++) {
      const hit = await ev(`(function(){ var b = Array.prototype.slice.call(document.querySelectorAll('button')).filter(function(x){ return x.textContent.trim() === 'Decline' && x.getBoundingClientRect().width; })[0]; if (b) { b.click(); return true; } return false; })()`);
      if (hit) { await wait(400); break; }
      await wait(250);
    }
  }
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
  const walk = () => ev(`(async function(){ var h = document.documentElement.scrollHeight;
      for (var y = 0; y < h; y += Math.round(innerHeight * 0.7)) { window.scrollTo({ top: y, behavior: 'instant' }); await new Promise(function(r){ setTimeout(r, 110); }); }
      window.scrollTo({ top: 0, behavior: 'instant' }); return 1; })()`);
  const shot = async (name) => {
    await walk(); await wait(500);
    const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true }, sessionId);
    writeFileSync(join(SHOTS, name), Buffer.from(data, 'base64'));
  };
  const close = () => send('Target.closeTarget', { targetId });
  return { ev, click, type, shot, walk, close, ready, errs, sessionId };
}

const fails = [];
const ok = (cond, label) => { console.log(`${cond ? '  ok  ' : '  FAIL'} ${label}`); if (!cond) fails.push(label); };
const OPT = (n) => `#quiz-body .aq-qstep.is-active .aq-opt:nth-of-type(${n})`;
const answerFour = async (p, second = 1) => { for (let q = 1; q <= 4; q++) { await p.click(OPT(q === 2 ? second : 1)); await wait(430); } };

/* ---- layout and brand ---- */
console.log('\n-- layout');
for (const key of Object.keys(SLUGS)) {
  for (const width of WIDTHS) {
    const p = await open(URL_OF(key), width);
    await p.walk(); await wait(700);
    const m = await p.ev(`(function(){
      function hex(c){ var p = c.match(/[\\d.]+/g).slice(0, 3); return '#' + p.map(function(n){ return ('0' + Math.round(n).toString(16)).slice(-2); }).join(''); }
      function cs(sel){ var e = document.querySelector(sel); return e ? getComputedStyle(e) : null; }
      var imgs = Array.prototype.slice.call(document.querySelectorAll('.aq-page img'));
      var loaded = []; document.fonts.forEach(function(f){ if (f.status === 'loaded') loaded.push(f.family.replace(/["']/g, '') + ' ' + f.weight); });
      var h = cs('h1'), b = cs('.aq-page'), t = cs('.aq-topbar'), g = cs('.aq-btn-gold');
      var steps = document.querySelectorAll('#quiz-body .aq-qstep'), shown = 0;
      for (var i = 0; i < steps.length; i++) if (getComputedStyle(steps[i]).display !== 'none') shown++;
      return { scrollW: document.documentElement.scrollWidth, inner: window.innerWidth, imgs: imgs.length,
        broken: imgs.filter(function(i){ return !i.complete || !i.naturalWidth; }).map(function(i){ return i.src; }),
        loaded: loaded, steps: steps.length, shown: shown,
        h1: h.fontFamily.split(',')[0].replace(/["']/g, '') + ' ' + h.fontWeight + ' ' + h.textTransform,
        body: b.fontFamily.split(',')[0].replace(/["']/g, '') + ' ' + b.fontSize, ground: hex(b.backgroundColor), ink: hex(b.color), dark: hex(t.backgroundColor),
        cta: g ? hex(g.backgroundColor) + ' ' + hex(g.color) + ' ' + g.borderTopLeftRadius + ' ' + g.textTransform : 'none' }; })()`);
    ok(m.scrollW <= m.inner, `${key} ${width}: no horizontal overflow (${m.scrollW}/${m.inner})`);
    ok(m.broken.length === 0, `${key} ${width}: ${m.imgs} images loaded${m.broken.length ? ' — broken: ' + m.broken.join(', ') : ''}`);
    if (LIVE) { if (p.errs.length && width === 1440) console.log(`  info ${key}: console errors on staging — ${[...new Set(p.errs)].join(' | ').slice(0, 400)}`); }
    else ok(p.errs.length === 0, `${key} ${width}: no console errors${p.errs.length ? ' — ' + p.errs.join(' | ') : ''}`);
    if (m.steps) ok(m.shown === 1, `${key} ${width}: one quiz step showing of ${m.steps}`);
    if (width === 1440) {
      // A family that is named but never loads falls back and still "passes" a computed-style check.
      ok(['Centurygothic 400', 'Centurygothic 700', 'area extended 700'].every((f) => m.loaded.includes(f)), `${key}: brand font files loaded`);
      ok(m.h1 === 'area extended 700 capitalize', `${key}: h1 is ${m.h1}`);
      ok(m.body === 'Centurygothic 17px', `${key}: body is ${m.body}`);
      ok(m.ground === '#fdf8ef' && m.ink === '#222222' && m.dark === '#5f5f5d', `${key}: grounds and ink ${m.ground} ${m.ink} ${m.dark}`);
      ok(m.cta === '#c8b282 #222222 0px uppercase', `${key}: primary button ${m.cta}`);
    }
    if (SHOT_WIDTHS.includes(width)) await p.shot(`${TAG}${key}-${width}.png`);
    await p.close();
  }
}

/* ---- quiz, end to end, on both pages that carry it ---- */
for (const key of ['landing', 'consult']) {
  console.log(`\n-- quiz on ${key} (390)`);
  const p = await open(URL_OF(key) + '?utm_source=verify', 390, 844);
  ok(await p.ev(`document.querySelectorAll('#quiz-body .aq-qstep.is-active .aq-opt').length === 4`), 'question 1 shows four options');
  await answerFour(p, 3);                                                   // question 2: "Both upper and lower"
  ok(await p.ev(`document.querySelector('#quiz-body .aq-qstep.is-active').getAttribute('data-step') === 'contact'`), 'four clicks reach the contact step');
  ok(await p.ev(`document.querySelector('.aq-est-n').textContent`) === '$37,590', 'both arches shows $37,590');
  ok(await p.ev(`document.querySelector('.aq-est-l').textContent`) === 'Published fee, both arches', 'and says so');
  await p.click('.aq-back'); await wait(250);
  ok(await p.ev(`document.querySelectorAll('#quiz-body .aq-qstep.is-active .aq-opt.is-selected').length === 1`), 'Back returns to question 4 with the answer kept');
  await p.click('#quiz-body .aq-qstep.is-active .aq-opt.is-selected'); await wait(430);
  await p.click('#lead-form [type="submit"]'); await wait(250);
  ok(await p.ev(`document.getElementById('f-name').getAttribute('aria-invalid') === 'true' && document.getElementById('f-phone-err').classList.contains('is-shown')`), 'empty submit shows field errors');
  ok(await p.ev(`location.pathname`) === PATH(key), 'empty submit does not leave the page');
  await p.type('#f-name', 'Dana'); await p.type('#f-phone', '3035550123'); await p.type('#f-email', 'dana@example.com');
  await p.click('#lead-form [type="submit"]');
  for (let i = 0; i < 40; i++) { await wait(150); try { if ((await p.ev(`location.pathname`)) === PATH('thanks')) break; } catch { /* navigating */ } }
  await p.ready();
  ok(await p.ev(`location.pathname`) === PATH('thanks'), 'valid submit lands on the thank-you page');
  ok(await p.ev(`document.getElementById('ty-title').textContent`) === 'Request received, Dana.', 'thank-you greets by first name');
  ok(await p.ev(`location.search === '' && !/Dana|3035550123|example/.test(location.href)`), 'no form data in the thank-you URL');
  if (key === 'landing') await p.shot(TAG + 'thanks-after-submit-390.png');
  await p.close();
}

/* ---- the lead a webhook receives; the production guard ---- */
if (!LIVE) {
  console.log('\n-- lead payload');
  const p = await open(URL_OF('landing') + '?utm_source=google&utm_campaign=aox&gclid=TESTGCLID&hl=price', 1440);
  ok(await p.ev(`document.getElementById('hl').textContent`) === 'Full-arch implants for $18,795 per arch, in writing.', '?hl=price swaps the headline');
  await p.ev(`(function(){ document.getElementById('quiz').setAttribute('data-lead-webhook', ${JSON.stringify(LOCAL + '/hook')}); return 1; })()`);
  await answerFour(p, 1);
  await p.type('#f-name', 'Dana'); await p.type('#f-phone', '(303) 555-0123');
  await p.click('#f-sms'); await p.click('#lead-form [type="submit"]');
  for (let i = 0; i < 40 && !hooks.length; i++) await wait(150);
  let lead = null; try { lead = JSON.parse(hooks[0]); } catch { /* checked below */ }
  ok(hooks.length === 1 && !!lead, `one POST reached the webhook (${hooks.length})`);
  if (lead) {
    ok(lead.situation === 'I’m missing most or all of my teeth' && lead.arch === 'My upper teeth' && lead.timeline === 'As soon as possible' && lead.payment === 'Monthly payments', 'the four answers, by name');
    ok(lead.first_name === 'Dana' && lead.phone === '3035550123' && lead.email === '' && lead.sms_consent === true, `contact fields: ${lead.first_name} ${lead.phone} sms ${lead.sms_consent}`);
    ok(lead.utm_source === 'google' && lead.utm_campaign === 'aox' && lead.gclid === 'TESTGCLID' && lead.hl === 'price' && /all-on-x-quiz/.test(lead.landing_page) && !!lead.submitted_at, 'attribution, landing page and timestamp');
  }
  await p.close();

  console.log('\n-- no webhook on a production hostname');
  const g = await open(URL_OF('landing'), 1440);
  // The guard reads location.hostname; a production host is simulated by making the preview test fail.
  await g.ev(`(function(){ var t = RegExp.prototype.test; RegExp.prototype.test = function(s){ return t.call(/webflow/, this.source) && s === location.hostname ? false : t.call(this, s); }; return 1; })()`);
  await answerFour(g, 1);
  await g.type('#f-name', 'Dana'); await g.type('#f-phone', '3035550123');
  await g.click('#lead-form [type="submit"]'); await wait(900);
  ok(await g.ev(`location.pathname`) === PATH('landing'), 'the visitor is not sent to the thank-you page');
  ok(await g.ev(`document.getElementById('form-err').classList.contains('is-shown') && getComputedStyle(document.getElementById('form-err')).display !== 'none'`), 'and is told to call instead');
  ok(await g.ev(`!document.querySelector('#lead-form [type="submit"]').disabled`), 'the button is usable again');
  await g.close();
}

/* ---- tracking ---- */
console.log('\n-- tracking');
{
  const p = await open(URL_OF('landing'), 1440);
  await answerFour(p, 1);
  ok(await p.ev(`window.dataLayer.filter(function(e){ return e.event === 'quiz_step'; }).length === 4 && window.dataLayer.filter(function(e){ return e.event === 'quiz_start'; }).length === 1`), 'dataLayer has one quiz_start and four quiz_step events');
  await p.close();
}

/* ---- video dialog ---- */
for (const key of ['landing', 'thanks']) {
  console.log(`\n-- video dialog on ${key} (1440)`);
  const p = await open(URL_OF(key), 1440);
  ok(await p.ev(`document.querySelectorAll('.aq-page iframe, dialog.aq-vid iframe').length === 0`), 'no player exists on page load');
  await p.click('a.aq-face[data-yt="n6pB30XJwng"]'); await wait(900);
  ok(await p.ev(`(function(){ var d = document.querySelector('dialog.aq-vid'); var f = d && d.querySelector('iframe'); return !!(d && d.open && f && f.src.indexOf('/embed/n6pB30XJwng') > 0); })()`), 'a face tile opens the player for that video');
  ok(await p.ev(`location.pathname`) === PATH(key), 'the visitor stays on the page');
  if (key === 'landing') { const { data } = await send('Page.captureScreenshot', { format: 'png' }, p.sessionId); writeFileSync(join(SHOTS, TAG + 'dialog-1440.png'), Buffer.from(data, 'base64')); }
  await p.click('.aq-vid-x'); await wait(300);
  ok(await p.ev(`(function(){ var d = document.querySelector('dialog.aq-vid'); return !d.open && !d.querySelector('iframe'); })()`), 'close removes the player');
  ok(await p.ev(`window.dataLayer.filter(function(e){ return e.event === 'video_click' && e.video_id === 'n6pB30XJwng'; }).length === 1`), 'video_click is tracked once');
  await p.close();
}

/* ---- calls to action ---- */
console.log('\n-- calls to action (landing, 390)');
{
  const p = await open(URL_OF('landing'), 390, 844);
  ok(await p.ev(`!document.getElementById('sticky').classList.contains('is-visible')`), 'sticky bar hidden while the quiz is on screen');
  await p.ev(`(function(){ document.getElementById('price').scrollIntoView({ behavior: 'instant' }); return 1; })()`); await wait(700);
  ok(await p.ev(`document.getElementById('sticky').classList.contains('is-visible') && getComputedStyle(document.getElementById('sticky')).visibility === 'visible'`), 'sticky bar shows once the quiz is out of view');
  await p.click('#sticky .aq-sticky-cta'); await wait(1400);
  ok(await p.ev(`(function(){ var r = document.getElementById('quiz').getBoundingClientRect(); return r.top >= -2 && r.top < innerHeight / 2; })()`), '"See if I qualify" brings the quiz into view');
  const tels = await p.ev(`Array.prototype.slice.call(document.querySelectorAll('.aq-page a[href^="tel:"]')).map(function(a){ return a.getAttribute('href'); })`);
  ok(tels.length >= 4 && tels.every((t) => t === (LIVE ? tels[0] : 'tel:+17204193699')), `one phone number in every tel: link (${tels.length}, ${tels[0]})`);
  // The page is still settling from the smooth scroll on staging; let it finish before clicking at a coordinate.
  await wait(900); await p.click('a.aq-top-call'); await wait(500);
  ok(await p.ev(`window.dataLayer.filter(function(e){ return e.event === 'phone_click' && e.cta_location === 'topbar'; }).length === 1`), 'phone_click is tracked once per click');
  await p.close();
}

ws.close(); proc.kill(); server.close();
await wait(500);
try { rmSync(PROFILE, { recursive: true, force: true }); } catch { /* chrome still letting go */ }
console.log(fails.length ? `\n${fails.length} FAILED\n` + fails.map((f) => '  - ' + f).join('\n') : '\nall checks passed');
process.exit(fails.length ? 1 : 0);
