/**
 * Drive the interactive states whose colours the swap touched — the quiz
 * option's selected border/fill (GSAP tweens borderColor and backgroundColor
 * as rgba strings) and the FAQ open state — then read back what is painted.
 * A resting-state capture cannot see any of this.
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const FILES = process.argv.slice(2);
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => existsSync(p));
const PORT = 9950 + (process.pid % 40);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

spawn(CHROME, [`--remote-debugging-port=${PORT}`,
  '--user-data-dir=' + join(process.cwd(), '.chrome-interact'),
  '--no-first-run', '--no-default-browser-check', '--allow-file-access-from-files',
  '--disable-backgrounding-occluded-windows', '--disable-renderer-backgrounding',
  '--disable-background-timer-throttling',
  '--window-size=1440,900', '--window-position=-2400,0', 'about:blank'], { stdio: 'ignore' });

let wsUrl;
for (let i = 0; i < 60; i++) {
  try { const r = await fetch(`http://127.0.0.1:${PORT}/json/version`); if (r.ok) { wsUrl = (await r.json()).webSocketDebuggerUrl; break; } } catch {}
  await wait(400);
}
const ws = new WebSocket(wsUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let id = 0; const pend = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); } };
const send = (method, params = {}, sessionId) => { const i = ++id; ws.send(JSON.stringify({ id: i, method, params, sessionId })); return new Promise((res, rej) => pend.set(i, { res, rej })); };

for (const file of FILES) {
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  await send('Page.enable', {}, sessionId);
  await send('Runtime.enable', {}, sessionId);
  await send('Emulation.setFocusEmulationEnabled', { enabled: true }, sessionId);
  await send('Page.bringToFront', {}, sessionId);
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId);
  await send('Page.navigate', { url: pathToFileURL(resolve(process.cwd(), file)).href + '?nosmooth=1' }, sessionId);
  const ev = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }, sessionId);
    return r.exceptionDetails ? ('THREW: ' + r.exceptionDetails.text) : r.result.value;
  };
  for (let i = 0; i < 80; i++) { if (await ev(`document.readyState==='complete'`)) break; await wait(250); }
  await wait(1500);

  const out = await ev(`(async function(){
    var sleep = function(ms){ return new Promise(function(r){ setTimeout(r, ms); }); };
    var res = {};

    var opt = document.querySelector('button[class*="quiz__opt"]');
    if (opt) {
      opt.scrollIntoView({block:'center'}); await sleep(500);
      var before = getComputedStyle(opt);
      res.quizBefore = { border: before.borderTopColor, bg: before.backgroundColor };
      opt.click(); await sleep(900);
      var after = getComputedStyle(opt);
      res.quizAfter = { border: after.borderTopColor, bg: after.backgroundColor,
                        pressed: opt.getAttribute('aria-pressed') };
    } else res.quiz = 'none';

    var q = document.querySelector('button[class*="faq__q"], [class*="faq__q"][aria-expanded]');
    if (q) {
      q.scrollIntoView({block:'center'}); await sleep(400);
      var expBefore = q.getAttribute('aria-expanded');
      q.click(); await sleep(700);
      res.faq = { before: expBefore, after: q.getAttribute('aria-expanded'),
                  color: getComputedStyle(q).color };
    } else res.faq = 'none';

    // Primary CTA resting fill + its label colour.
    var btn = document.querySelector('a[class*="btn--primary"], a[class*="btn--offer"], button[class*="btn--primary"]');
    if (btn) { btn.scrollIntoView({block:'center'}); await sleep(300);
      var cs = getComputedStyle(btn);
      res.cta = { bg: cs.backgroundColor, color: cs.color }; }
    return JSON.stringify(res);
  })()`);
  console.log(`\n── ${file.split(/[\\/]/).pop()}\n   ${out}`);
  await send('Target.closeTarget', { targetId });
}
process.exit(0);
