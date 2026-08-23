/**
 * tokenprobe.mjs — where do the design tokens actually live on the PUBLISHED
 * page, and what would a head-code override have to outrank?
 *
 * The paste rewrote the design's `:root` and `[data-theme]` blocks into
 * `:scope{…}` and `:scope[data-theme="light"]{…}`, and `:scope` resolves to
 * something different from `:root`. Reasoning about which selector wins from
 * reading the CSS has already cost a wasted cycle once on this build; ask the
 * browser instead.
 *
 * Reports every element that DECLARES a custom property (not merely inherits
 * one), with its selector path and the values that matter.
 *
 *   node tokenprobe.mjs <slug>
 */
import { spawn } from 'node:child_process';
import { existsSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const slug = process.argv[2] || 'dental-implants-ads-landing';

const PROBE = `(function(){
  var WANT = ['--ink-900','--ink-950','--paper','--cyan','--amber','--bg','--fg','--fg-body','--accent'];
  function path(e){
    var out = [];
    while (e && e.nodeType === 1 && out.length < 5) {
      var s = e.tagName.toLowerCase();
      if (e.id) s += '#' + e.id;
      var c = (e.getAttribute('class') || '').trim().split(/\\s+/).filter(Boolean).slice(0,2);
      if (c.length) s += '.' + c.join('.');
      if (e.hasAttribute('data-theme')) s += '[data-theme=' + e.getAttribute('data-theme') + ']';
      out.unshift(s); e = e.parentElement;
    }
    return out.join(' > ');
  }
  // An element DECLARES a property if its own value differs from its parent's.
  var rows = [];
  var all = [document.documentElement, document.body].concat(
    Array.prototype.slice.call(document.querySelectorAll('*')));
  all.forEach(function(e){
    var cs = getComputedStyle(e);
    var pcs = e.parentElement ? getComputedStyle(e.parentElement) : null;
    var own = {};
    WANT.forEach(function(p){
      var v = cs.getPropertyValue(p).trim();
      var pv = pcs ? pcs.getPropertyValue(p).trim() : '';
      if (v && v !== pv) own[p] = v;
    });
    if (Object.keys(own).length) rows.push({ path: path(e), own: own,
      bg: cs.backgroundColor, color: cs.color,
      theme: e.getAttribute('data-theme') || null });
  });
  return { rows: rows.slice(0, 24),
    themed: document.querySelectorAll('[data-theme]').length,
    bodyBg: getComputedStyle(document.body).backgroundColor,
    mainExists: !!document.getElementById('main') };
})()`;

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => existsSync(p));
const DBG = 9200 + (process.pid % 700);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
try {
  for (const d of readdirSync(HERE)) {
    if (d.startsWith('.chrome-tok-') && d !== `.chrome-tok-${process.pid}`) {
      try { rmSync(join(HERE, d), { recursive: true, force: true }); } catch {}
    }
  }
} catch {}
const proc = spawn(CHROME, [`--remote-debugging-port=${DBG}`,
  '--user-data-dir=' + join(HERE, `.chrome-tok-${process.pid}`),
  '--no-first-run', '--no-default-browser-check',
  '--window-size=1440,900', '--window-position=-2400,0', 'about:blank'], { stdio: 'ignore' });
let wsUrl;
for (let i = 0; i < 60; i++) {
  try { const r = await fetch(`http://127.0.0.1:${DBG}/json/version`); if (r.ok) { wsUrl = (await r.json()).webSocketDebuggerUrl; break; } } catch {}
  await wait(400);
}
const ws = new WebSocket(wsUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let id = 0; const pend = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { const { res, rej } = pend.get(m.id); pend.delete(m.id); m.error ? rej(new Error(m.error.message)) : res(m.result); } };
const send = (me, p = {}, s) => { const i = ++id; ws.send(JSON.stringify({ id: i, method: me, params: p, sessionId: s })); return new Promise((res, rej) => pend.set(i, { res, rej })); };
const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
await send('Page.enable', {}, sessionId);
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId);
await send('Page.navigate', { url: `https://arvadadentalcenter.webflow.io/${slug}` }, sessionId);
const ev = async (x) => (await send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true }, sessionId)).result?.value;
for (let i = 0; i < 120; i++) { if (await ev(`document.readyState==='complete'`) === true) break; await wait(200); }
await wait(1600);

const r = await ev(PROBE);
console.log(`${slug}   [data-theme] elements: ${r.themed}   #main: ${r.mainExists}   body bg: ${r.bodyBg}`);
for (const row of r.rows) {
  console.log(`\n  ${row.path}${row.theme ? '   theme=' + row.theme : ''}`);
  console.log(`     bg ${row.bg}   color ${row.color}`);
  for (const [k, v] of Object.entries(row.own)) console.log(`     ${k.padEnd(12)} ${v}`);
}
try { await send('Browser.close'); } catch {}
proc.kill();
