#!/usr/bin/env node
/**
 * blockprobe.mjs — load a staging page with certain URLs blocked and report a
 * computed style, to find which third-party script is distorting the page.
 *
 *   node blockprobe.mjs <slug> <selector> <cssProp>
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const [target, selector, prop] = process.argv.slice(2);
const url = `https://arvadadentalcenter.webflow.io/${target}`;

const TRIALS = [
  { name: 'baseline (nothing blocked)', block: [] },
  { name: 'sienna-accessibility blocked', block: ['*sienna-accessibility*'] },
  { name: 'elfsight blocked', block: ['*elfsight*'] },
  { name: 'swiper blocked', block: ['*swiper*'] },
  { name: 'gtm blocked', block: ['*googletagmanager*'] },
  { name: 'ALL third-party blocked', block: ['*sienna-accessibility*', '*elfsight*', '*swiper*', '*googletagmanager*'] },
];

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => existsSync(p));
const DBG = 9200 + (process.pid % 700);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const proc = spawn(CHROME, [`--remote-debugging-port=${DBG}`,
  '--user-data-dir=' + join(HERE, '.chrome-block'), '--no-first-run', '--no-default-browser-check',
  '--disable-backgrounding-occluded-windows', '--disable-renderer-backgrounding',
  '--disable-background-timer-throttling',
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

for (const t of TRIALS) {
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  await send('Page.enable', {}, sessionId);
  await send('Network.enable', {}, sessionId);
  await send('Network.setBlockedURLs', { urls: t.block }, sessionId);
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId);
  await send('Page.navigate', { url }, sessionId);
  const ev = async (x) => (await send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true }, sessionId)).result?.value;
  for (let i = 0; i < 90; i++) { if (await ev(`document.readyState==='complete'`) === true) break; await wait(200); }
  await wait(2500);
  const out = await ev(`(function(){var e=document.querySelector(${JSON.stringify(selector)});
    if(!e) return {missing:true};
    return {computed:getComputedStyle(e)[${JSON.stringify(prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase()))}],
            attr:e.getAttribute('style')};})()`);
  console.log(`${t.name.padEnd(32)} ${JSON.stringify(out)}`);
  await send('Target.closeTarget', { targetId });
}
try { await send('Browser.close'); } catch {}
proc.kill();
