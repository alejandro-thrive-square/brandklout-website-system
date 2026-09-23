#!/usr/bin/env node
/**
 * mobile-bar-check.mjs — is the sticky call bar actually reachable on a phone?
 *
 * The site injects a Google-review badge bottom-right on every page, and it
 * lands on top of the campaign call bar. A screenshot shows the overlap; only a
 * hit test tells you whether a thumb on "CALL NOW" reaches the tel: link or the
 * badge. This asserts the element under both halves of the bar.
 *
 *   node mobile-bar-check.mjs [url]
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const PAGE_URL = process.argv[2] || 'https://marvel-dental-main.webflow.io/ads-landing-pages/emergency-dentist';
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => existsSync(p));
const PORT = 9200 + (process.pid % 700);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const proc = spawn(CHROME, [`--remote-debugging-port=${PORT}`, '--user-data-dir=' + join(HERE, '.chrome-bar'),
  '--no-first-run', '--no-default-browser-check', '--window-size=430,900', '--window-position=-2400,0', 'about:blank'], { stdio: 'ignore' });

let wsUrl;
for (let i = 0; i < 60; i++) {
  try { const r = await fetch(`http://127.0.0.1:${PORT}/json/version`); if (r.ok) { wsUrl = (await r.json()).webSocketDebuggerUrl; break; } } catch {}
  await wait(400);
}
const ws = new WebSocket(wsUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let id = 0; const pend = new Map();
ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pend.has(m.id)) { const { res, rej } = pend.get(m.id); pend.delete(m.id); m.error ? rej(new Error(m.error.message)) : res(m.result); } };
const send = (method, params = {}, sessionId) => { const i = ++id; ws.send(JSON.stringify({ id: i, method, params, sessionId })); return new Promise((res, rej) => pend.set(i, { res, rej })); };

const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
await send('Runtime.enable', {}, sessionId);
await send('Page.enable', {}, sessionId);
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true }, sessionId);
await send('Page.navigate', { url: PAGE_URL }, sessionId);
await wait(6000);

const ev = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, sessionId);
  return r.exceptionDetails ? { error: r.exceptionDetails.text } : r.result.value;
};

const out = await ev(`(function(){
  var bar = document.querySelector('.camp_mobile-bar');
  if (!bar) return { error: 'no mobile bar' };
  var r = bar.getBoundingClientRect();
  var cs = getComputedStyle(bar);
  var probe = function (x, y) {
    var el = document.elementFromPoint(x, y);
    if (!el) return 'nothing';
    var link = el.closest('a');
    return { tag: el.tagName.toLowerCase(), cls: (el.className || '').toString().slice(0, 40),
      href: link ? link.getAttribute('href') : null,
      inBar: !!(link && link.closest('.camp_mobile-bar')) };
  };
  return {
    bar: { top: Math.round(r.top), height: Math.round(r.height), z: cs.zIndex, position: cs.position, display: cs.display },
    left: probe(Math.round(r.width * 0.25), Math.round(r.top + r.height / 2)),
    right: probe(Math.round(r.width * 0.75), Math.round(r.top + r.height / 2)),
  };
})()`);

console.log(JSON.stringify(out, null, 1));
const ok = out && out.left && out.right && out.left.inBar && out.right.inBar;
console.log(ok ? '\nPASS  both halves of the call bar are reachable' : '\nFAIL  something is covering the call bar');
ws.close(); proc.kill();
process.exit(ok ? 0 : 1);
