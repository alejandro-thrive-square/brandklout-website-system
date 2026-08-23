/**
 * The colour swap rewrote values GSAP tweens at runtime. A malformed rgba()
 * string does not fail a contrast check — it throws mid-timeline and silently
 * kills the rest of that chapter's animation. So: scroll the whole page with
 * motion ON, collect console errors and exceptions, and confirm the animated
 * elements actually reach a painted state.
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const FILES = process.argv.slice(2);
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => existsSync(p));
const PORT = 9800 + (process.pid % 150);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

spawn(CHROME, [`--remote-debugging-port=${PORT}`,
  '--user-data-dir=' + join(process.cwd(), '.chrome-runtime'),
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
let id = 0; const pend = new Map(); let sink = null;
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); }
  else if (sink) sink(m);
};
const send = (method, params = {}, sessionId) => { const i = ++id; ws.send(JSON.stringify({ id: i, method, params, sessionId })); return new Promise((res, rej) => pend.set(i, { res, rej })); };

for (const file of FILES) {
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  const errs = [];
  sink = (m) => {
    if (m.sessionId !== sessionId) return;
    if (m.method === 'Runtime.exceptionThrown') errs.push('EXC ' + (m.params.exceptionDetails.text || '') + ' ' + (m.params.exceptionDetails.exception?.description || '').slice(0, 160));
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errs.push('ERR ' + m.params.args.map((a) => a.description || a.value).join(' ').slice(0, 200));
  };
  await send('Runtime.enable', {}, sessionId);
  await send('Page.enable', {}, sessionId);
  await send('Emulation.setFocusEmulationEnabled', { enabled: true }, sessionId);
  await send('Page.bringToFront', {}, sessionId);
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId);
  // Motion ON. nosmooth keeps ScrollSmoother from transforming the document.
  await send('Page.navigate', { url: pathToFileURL(resolve(process.cwd(), file)).href + '?nosmooth=1' }, sessionId);

  const ev = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }, sessionId);
    return r.exceptionDetails ? null : r.result.value;
  };
  for (let i = 0; i < 80; i++) { if (await ev(`document.readyState==='complete'`)) break; await wait(250); }
  await wait(1500);

  // Walk the page slowly enough for every ScrollTrigger to fire.
  await ev(`(async function(){ var h=document.documentElement.scrollHeight;
    for(var y=0;y<h;y+=Math.round(innerHeight*0.5)){ window.scrollTo(0,y);
      await new Promise(function(r){setTimeout(r,220);}); }
    return 1; })()`);
  await wait(800);

  // Did the sweep-word spans actually get colour driven onto them?
  const words = await ev(`(function(){
    var w = document.querySelectorAll('[class*="wz-word"]');
    var painted = 0, colors = {};
    w.forEach(function(el){
      var c = getComputedStyle(el).color;
      colors[c] = (colors[c]||0)+1;
      if (el.style.color) painted++;
    });
    return { total: w.length, inlinePainted: painted, colors: colors };
  })()`);
  const gsap = await ev(`typeof gsap !== 'undefined' && gsap.globalTimeline ? gsap.globalTimeline.getChildren().length : -1`);

  console.log(`\n── ${file}`);
  console.log(`   gsap timelines: ${gsap}`);
  console.log(`   sweep words: ${JSON.stringify(words)}`);
  console.log(`   console errors/exceptions: ${errs.length}`);
  [...new Set(errs)].slice(0, 8).forEach((e) => console.log(`     ${e}`));
  await send('Target.closeTarget', { targetId });
}
process.exit(0);
