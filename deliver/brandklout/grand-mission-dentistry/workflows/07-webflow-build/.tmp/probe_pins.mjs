/**
 * probe_pins.mjs — why does a live page report 0 pinned scenes?
 *
 *   node probe_pins.mjs <url>
 *
 * staging-verify says "0 pinned" and stops there. This asks the page itself:
 * what did ScrollTrigger actually build, which media query is matching, and —
 * for each trigger — whether it carries a pin and what it is pinned to. A
 * chapter that bailed on a missing anchor and a chapter that took the mobile
 * branch look identical from outside; here they do not.
 */
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import http from 'node:http'; import { spawn } from 'node:child_process';

const URL_ = process.argv[2];
if (!URL_) { console.error('usage: node probe_pins.mjs <url>'); process.exit(2); }
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9700 + Math.floor(Math.random() * 300);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'cdp-pins-'));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars',
  `--remote-debugging-port=${PORT}`, '--remote-allow-origins=*', '--window-size=1440,900',
  '--force-device-scale-factor=1', '--no-first-run', '--no-default-browser-check',
  `--user-data-dir=${profile}`, 'about:blank']);
const getJSON = (p) => new Promise((res, rej) => {
  http.get({ host: '127.0.0.1', port: PORT, path: p }, (r) => {
    let d = ''; r.on('data', (c) => (d += c)); r.on('end', () => res(JSON.parse(d)));
  }).on('error', rej);
});
let wsUrl; for (let i = 0; i < 150 && !wsUrl; i++) { try { wsUrl = (await getJSON('/json/version')).webSocketDebuggerUrl; } catch {} if (!wsUrl) await wait(300); }
const ws = new WebSocket(wsUrl); let mid = 0; const pending = new Map(); const errs = [];
ws.addEventListener('message', async (ev) => {
  const raw = typeof ev.data === 'string' ? ev.data : await ev.data.text();
  const m = JSON.parse(raw);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  else if (m.method === 'Runtime.exceptionThrown') errs.push((m.params?.exceptionDetails?.exception?.description || '?').split('\n')[0]);
});
await new Promise((r) => ws.addEventListener('open', r, { once: true }));
const send = (method, params = {}, sessionId) => new Promise((res, rej) => {
  const i = ++mid; const t = setTimeout(() => rej(new Error('timeout ' + method)), 60000);
  pending.set(i, (m) => { clearTimeout(t); m.error ? rej(new Error(m.error.message)) : res(m.result); });
  ws.send(JSON.stringify({ id: i, method, params, sessionId }));
});
const { targetInfos } = await send('Target.getTargets');
const pt = targetInfos.find((t) => t.type === 'page') || { targetId: (await send('Target.createTarget', { url: 'about:blank' })).targetId };
const { sessionId } = await send('Target.attachToTarget', { targetId: pt.targetId, flatten: true });
await send('Runtime.enable', {}, sessionId); await send('Page.enable', {}, sessionId);
await send('Page.navigate', { url: URL_ }, sessionId); await wait(10000);
const ev = async (fn) => {
  const r = await send('Runtime.evaluate', { expression: `(${fn.toString()})()`, returnByValue: true, awaitPromise: true }, sessionId);
  return r.exceptionDetails ? { __err: r.exceptionDetails.text } : r.result.value;
};

const out = await ev(() => {
  const ST = window.ScrollTrigger;
  const all = ST ? ST.getAll() : [];
  const anchors = {};
  for (const id of ['workPin', 'workMarker', 'pillarsPin', 'pillarList', 'proofPin', 'ribbonRail',
    'pathPin', 'pathRail', 'prepPin', 'placePin', 'lossPin', 'answerPin', 'optionsPin'])
    if (document.getElementById(id)) anchors[id] = true;
  return {
    innerWidth: window.innerWidth,
    matches760: window.matchMedia('(min-width: 760px)').matches,
    prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    hasWZ: !!window.WZ,
    hasSmoother: !!(window.WZ && window.WZ.smoother),
    smoothWrapper: !!document.getElementById('smooth-wrapper'),
    wzStatic: document.documentElement.className + ' | body:' + document.body.className,
    triggers: all.length,
    pinned: all.filter((t) => !!t.pin).length,
    anchors: Object.keys(anchors),
    sample: all.slice(0, 40).map((t) => ({
      trig: t.trigger && (t.trigger.id || t.trigger.className || '').toString().slice(0, 34),
      pin: !!t.pin, start: Math.round(t.start), end: Math.round(t.end),
    })),
  };
});
console.log(JSON.stringify(out, null, 1));

/* Measure AGAIN after a settle. staging-verify samples later than this probe
   does, and reported 0 triggers on a page this probe had just measured at 59 —
   so "do the triggers still exist a few seconds on" is a real question, not a
   formality. A matchMedia revert that double-kills its own context empties
   ScrollTrigger without raising anything. */
await wait(14000);
const later = await ev(() => {
  const all = window.ScrollTrigger ? window.ScrollTrigger.getAll() : [];
  return { triggers: all.length, pinned: all.filter((t) => !!t.pin).length,
           pinIds: all.filter((t) => !!t.pin).map((t) => t.pin.id || '(no id)') };
});
console.log('after +14s: ' + JSON.stringify(later));
if (errs.length) console.log('page errors:\n  ' + errs.join('\n  '));
try { await send('Browser.close'); } catch {}
ws.close(); chrome.kill();
