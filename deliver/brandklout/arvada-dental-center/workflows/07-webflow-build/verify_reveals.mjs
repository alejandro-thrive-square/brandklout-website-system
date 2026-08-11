#!/usr/bin/env node
/**
 * verify_reveals.mjs — is any content stuck invisible for a REAL visitor?
 *
 * Every other gate here runs under prefers-reduced-motion: reduce, because
 * comparing two independently-animating pages is meaningless. But the design
 * ships
 *     @media (prefers-reduced-motion: reduce){
 *       [data-rv],[data-anim="hide"]{opacity:1!important;visibility:visible!important}
 *     }
 * so reduced motion FORCES every reveal visible. The style gate therefore
 * cannot, by construction, see a reveal that fails to arm — and the failure
 * mode is not subtle: `.js-motion [data-rv]{opacity:0}` is applied by script,
 * so if GSAP arms the pre-reveal state and then never runs the tween, the copy
 * sits at opacity 0 forever while every gate reports the page perfect.
 *
 * This runs with motion ENABLED, scrolls each reveal-marked element into view,
 * lets it settle, and reports anything still invisible.
 *
 *   node verify_reveals.mjs [page ...]
 *
 * Exit 1 if any reveal-marked element with text is still invisible.
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const OUT = join(HERE, '.tmp', 'verify-staging');
mkdirSync(OUT, { recursive: true });
const STAGING = 'https://arvadadentalcenter.webflow.io';
const SLUG = {
  implants: 'dental-implants-ads-landing', aox: 'all-on-x-ads-landing',
  veneers: 'porcelain-veneers-ads-landing', emergency: 'emergency-dentist-ads-landing',
  'dentist-near-me': 'dentist-near-me-ads-landing', 'next-door': 'next-door-family-ads-landing',
};
const argv = process.argv.slice(2);
const WIDTH = argv.includes('--width') ? Number(argv[argv.indexOf('--width') + 1]) : 1440;
const PAGES = argv.filter((a) => SLUG[a]).length ? argv.filter((a) => SLUG[a]) : Object.keys(SLUG);

/**
 * Scroll each reveal-marked element into view, settle, and measure.
 *
 * Judged in the element's own right, not by a global sweep: a reveal that has
 * simply not been scrolled to yet is legitimately at opacity 0, and the
 * runbook already records two runs lost to "broken images" that were only ever
 * off-screen. Scroll first, then judge.
 */
const SWEEP = `(async function(){
  var marked = Array.prototype.slice.call(
    document.querySelectorAll('[data-rv],[data-anim="hide"]'));
  var bad = [], checked = 0;
  for (var i = 0; i < marked.length; i++) {
    var el = marked[i];
    var text = (el.textContent || '').replace(/\\s+/g,' ').trim();
    if (!text) continue;                       // decorative marker, nothing to lose
    el.scrollIntoView({ block: 'center' });
    await new Promise(function(r){ setTimeout(r, 650); });
    checked++;
    var cs = getComputedStyle(el);
    var r = el.getBoundingClientRect();
    var op = parseFloat(cs.opacity);
    var invisible = op < 0.05 || cs.visibility === 'hidden' ||
      (r.width < 1 && r.height < 1);
    if (invisible) {
      bad.push({ text: text.slice(0, 60), opacity: cs.opacity,
        visibility: cs.visibility, w: Math.round(r.width), h: Math.round(r.height),
        cls: String(el.className || '').slice(0, 40) });
    }
  }
  window.scrollTo(0, 0);
  return { marked: marked.length, checked: checked, bad: bad };
})()`;

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => existsSync(p));
const DBG = 9200 + (process.pid % 700);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const PROFILE = join(HERE, '.tmp', `.chrome-rev-${process.pid}`);
try {
  for (const d of readdirSync(join(HERE, '.tmp'))) {
    if (d.startsWith('.chrome-rev-') && d !== `.chrome-rev-${process.pid}`) {
      try { rmSync(join(HERE, '.tmp', d), { recursive: true, force: true }); } catch {}
    }
  }
} catch {}
const proc = spawn(CHROME, [`--remote-debugging-port=${DBG}`, '--user-data-dir=' + PROFILE,
  '--no-first-run', '--no-default-browser-check', '--disable-backgrounding-occluded-windows',
  '--disable-renderer-backgrounding', '--disable-background-timer-throttling',
  `--window-size=${WIDTH},900`, '--window-position=-2400,0', 'about:blank'], { stdio: 'ignore' });
let wsUrl;
for (let i = 0; i < 60; i++) {
  try { const r = await fetch(`http://127.0.0.1:${DBG}/json/version`); if (r.ok) { wsUrl = (await r.json()).webSocketDebuggerUrl; break; } } catch {}
  await wait(400);
}
if (!wsUrl) { console.error('Chrome did not expose a debugging port'); process.exit(1); }
const ws = new WebSocket(wsUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let id = 0; const pend = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { const { res, rej } = pend.get(m.id); pend.delete(m.id); m.error ? rej(new Error(m.error.message)) : res(m.result); } };
const send = (me, p = {}, s) => { const i = ++id; ws.send(JSON.stringify({ id: i, method: me, params: p, sessionId: s })); return new Promise((res, rej) => pend.set(i, { res, rej })); };

const results = [];
for (const page of PAGES) {
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  await send('Page.enable', {}, sessionId);
  await send('Network.enable', {}, sessionId);
  await send('Network.setBlockedURLs', { urls: ['*sienna-accessibility*', '*elfsight*', '*googletagmanager*'] }, sessionId);
  await send('Emulation.setFocusEmulationEnabled', { enabled: true }, sessionId);
  await send('Page.bringToFront', {}, sessionId);
  await send('Emulation.setDeviceMetricsOverride', { width: WIDTH, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId);
  // NOTE: motion deliberately NOT reduced. That is the whole point.
  await send('Page.navigate', { url: `${STAGING}/${SLUG[page]}` }, sessionId);
  const ev = async (x) => (await send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true }, sessionId)).result?.value;
  for (let i = 0; i < 90; i++) { if (await ev(`document.readyState==='complete'`) === true) break; await wait(200); }
  await ev(`document.fonts ? document.fonts.ready.then(()=>1) : 1`);
  await wait(2500);                                   // let GSAP load and arm

  const r = await ev(SWEEP);
  /**
   * ZERO MARKERS IS A FAILURE, NOT A PASS. Every one of these pages carries
   * 6-12 data-rv attributes plus ~22 data-anim="hide". A sweep that finds none
   * has measured a page that did not load — which is exactly what happened to
   * implants on the first run of this gate: it reported "clean" having checked
   * nothing, the same trap this suite already documents for the copy gate.
   * Retry once, then report loudly rather than silently passing.
   */
  if (r.marked === 0) {
    await wait(3000);
    const again = await ev(SWEEP);
    if (again.marked === 0) {
      console.log(`${page.padEnd(17)} NO REVEAL MARKERS FOUND — page did not load, result is meaningless`);
      results.push({ page, ...again, loadFailure: true });
      await send('Target.closeTarget', { targetId });
      continue;
    }
    Object.assign(r, again);
  }
  results.push({ page, ...r });
  console.log(`${page.padEnd(17)} reveal-marked ${String(r.marked).padStart(3)}  with text ${String(r.checked).padStart(3)}  STUCK INVISIBLE ${r.bad.length}${r.bad.length ? '' : '  clean'}`);
  r.bad.slice(0, 6).forEach((b) => console.log(`    opacity=${b.opacity} vis=${b.visibility} ${b.w}x${b.h}  "${b.text}"`));
  await send('Target.closeTarget', { targetId });
}

writeFileSync(join(OUT, `verify-reveals-${WIDTH}.json`), JSON.stringify(results, null, 2));
const failures = results.filter((r) => r.loadFailure);
const total = results.reduce((n, r) => n + r.bad.length, 0) + failures.length;
console.log(`\n${'='.repeat(64)}`);
console.log(`reveal elements checked : ${results.reduce((n, r) => n + r.checked, 0)}`);
console.log(`stuck invisible         : ${results.reduce((n, r) => n + r.bad.length, 0)}`);
console.log(`pages that failed to load: ${failures.length}${failures.length ? " -> " + failures.map((f) => f.page).join(", ") : ""}`);
try { await send('Browser.close'); } catch {}
proc.kill();
process.exit(total ? 1 : 0);
