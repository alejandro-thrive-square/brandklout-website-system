#!/usr/bin/env node
/**
 * probe.mjs — open one staging page and run an arbitrary expression against it.
 * Scratch tool for diagnosing what verify_staging.mjs reports.
 *
 *   node probe.mjs <staging-slug> <file-with-js-expression>
 */
import { spawn } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const [target, exprFile] = process.argv.slice(2);
const expr = readFileSync(exprFile, 'utf8');
const url = target.startsWith('http') || target.startsWith('file:')
  ? target : `https://arvadadentalcenter.webflow.io/${target}`;

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => existsSync(p));
const DBG = 9200 + (process.pid % 700);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const proc = spawn(CHROME, [`--remote-debugging-port=${DBG}`,
  '--user-data-dir=' + join(HERE, '.chrome-probe'), '--no-first-run', '--no-default-browser-check',
  '--allow-file-access-from-files', '--disable-backgrounding-occluded-windows',
  '--disable-renderer-backgrounding', '--disable-background-timer-throttling',
  '--window-size='+(process.env.PW||1440)+',900', '--window-position=-2400,0', 'about:blank'], { stdio: 'ignore' });

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
/**
 * Block the same third parties verify_staging.mjs blocks. Without this a probe
 * measures sienna-accessibility's rounded font sizes (15px where the design has
 * 15.36px) while the harness measures the unrounded ones — so probe numbers and
 * harness numbers disagree for reasons that have nothing to do with the page,
 * and a chase for a phantom layout difference follows. Set PROBE_3P=1 to keep
 * them, e.g. when investigating the widget itself.
 */
if (!process.env.PROBE_3P) {
  await send('Network.enable', {}, sessionId);
  await send('Network.setBlockedURLs', {
    urls: ['*sienna-accessibility*', '*elfsight*', '*googletagmanager*'] }, sessionId);
}
await send('Emulation.setFocusEmulationEnabled', { enabled: true }, sessionId);
await send('Page.bringToFront', {}, sessionId);
await send('Emulation.setDeviceMetricsOverride', { width: Number(process.env.PW||1440), height: 900, deviceScaleFactor: 1, mobile: false }, sessionId);
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] }, sessionId);
await send('Page.navigate', { url }, sessionId);
const ev = async (x) => {
  const r = await send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true }, sessionId);
  if (r.exceptionDetails) return { __err: (r.exceptionDetails.exception?.description || '').split('\n')[0] };
  return r.result.value;
};
for (let i = 0; i < 90; i++) { if (await ev(`document.readyState==='complete'`) === true) break; await wait(200); }
await ev(`document.fonts ? document.fonts.ready.then(()=>1) : 1`);
await ev(`(async function(){var h=document.documentElement.scrollHeight;
  for(var y=0;y<h;y+=Math.round(innerHeight*.8)){window.scrollTo(0,y);
    await new Promise(function(r){setTimeout(r,60)})}window.scrollTo(0,0);return 1})()`);
await wait(1500);

console.log(JSON.stringify(await ev(expr), null, 1));
try { await send('Browser.close'); } catch {}
proc.kill();
