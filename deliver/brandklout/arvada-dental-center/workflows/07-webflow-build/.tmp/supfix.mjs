#!/usr/bin/env node
/**
 * supfix.mjs — try candidate rules for the offer-price w-embed and report
 * whether the $ and the number end up on one line.
 *
 * display:contents leaves the number on a second line even though the wrapper
 * generates no box and every computed style matches the design, so the fix has
 * to be chosen by measurement rather than by reasoning about the cascade.
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const URL_ = 'https://arvadadentalcenter.webflow.io/next-door-family-ads-landing';

const VARIANTS = [
  { name: 'as published (contents)', css: '' },
  { name: 'wrapper display:inline', css: '.nxd-offer__price > div.w-embed{display:inline}' },
  { name: 'wrapper inline + sup inline', css: '.nxd-offer__price > div.w-embed{display:inline}.nxd-offer__price sup{display:inline}' },
  { name: 'wrapper display:inline-block', css: '.nxd-offer__price > div.w-embed{display:inline-block}' },
  { name: 'price flex row', css: '.nxd-offer__price{display:flex;align-items:baseline}' },
];

const PROBE = `(function(){
  var p=document.querySelector('.nxd-offer__price');
  var sup=p.querySelector('sup'), num=p.querySelector('span:not(.w-embed)');
  var a=sup.getBoundingClientRect(), b=num.getBoundingClientRect(), c=p.getBoundingClientRect();
  return {priceH:Math.round(c.height), supTop:Math.round(a.top), numTop:Math.round(b.top),
    numLeft:Math.round(b.left), supLeft:Math.round(a.left),
    sameLine: b.left > a.left + a.width - 2};
})()`;

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => existsSync(p));
const DBG = 9200 + (process.pid % 700);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const proc = spawn(CHROME, [`--remote-debugging-port=${DBG}`,
  '--user-data-dir=' + join(HERE, '.chrome-supfix'), '--no-first-run', '--no-default-browser-check',
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

for (const v of VARIANTS) {
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  await send('Page.enable', {}, sessionId);
  await send('Network.enable', {}, sessionId);
  await send('Network.setBlockedURLs', { urls: ['*sienna-accessibility*', '*elfsight*', '*googletagmanager*'] }, sessionId);
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId);
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] }, sessionId);
  await send('Page.navigate', { url: URL_ }, sessionId);
  const ev = async (x) => (await send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true }, sessionId)).result?.value;
  for (let i = 0; i < 90; i++) { if (await ev(`document.readyState==='complete'`) === true) break; await wait(200); }
  if (v.css) await ev(`(function(){var s=document.createElement('style');s.textContent=${JSON.stringify(v.css)};document.head.appendChild(s);return 1})()`);
  await ev(`(async function(){var h=document.documentElement.scrollHeight;
    for(var y=0;y<h;y+=Math.round(innerHeight*.8)){window.scrollTo(0,y);await new Promise(function(r){setTimeout(r,50)})}window.scrollTo(0,0);return 1})()`);
  await wait(1200);
  console.log(v.name.padEnd(30), JSON.stringify(await ev(PROBE)));
  await send('Target.closeTarget', { targetId });
}
console.log('\nDESIGN reference: priceH 83, sup/num share a line (num.left > sup.right)');
try { await send('Browser.close'); } catch {}
proc.kill();
