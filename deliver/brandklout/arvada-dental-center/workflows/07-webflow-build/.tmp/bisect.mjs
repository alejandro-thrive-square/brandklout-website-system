#!/usr/bin/env node
/**
 * bisect.mjs — load one staging page repeatedly with different candidate CSS
 * and report a probe expression for each, to find which rule regresses what.
 *
 *   node bisect.mjs <slug> <probe.js>
 */
import { spawn } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const [slug, probeFile] = process.argv.slice(2);
const expr = readFileSync(probeFile, 'utf8');
const full = readFileSync(join(HERE, 'page-code', 'implants.css'), 'utf8');

const S = '[class*="imp-"]';
const VARIANTS = [
  { name: 'none', css: '' },
  { name: 'full candidate', css: full },
  { name: 'full minus w-embed', css: full.replace(/\[class\*="imp-"\] div\.w-embed\{display:contents\}/, '') },
  { name: 'only w-embed contents', css: `${S} div.w-embed{display:contents}` },
  { name: 'only img/video/svg', css: `${S} img,${S} video,${S} svg{max-width:100%;display:block}` },
  { name: 'only box-sizing', css: `${S},${S} *,${S} *::before,${S} *::after{box-sizing:border-box}` },
  { name: 'only ul/ol/li reset', css: `${S} :where(ul,ol,li){margin:0;padding:0}` },
];

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => existsSync(p));
const DBG = 9200 + (process.pid % 700);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const proc = spawn(CHROME, [`--remote-debugging-port=${DBG}`,
  '--user-data-dir=' + join(HERE, '.chrome-bisect'), '--no-first-run', '--no-default-browser-check',
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
  await send('Page.navigate', { url: `https://arvadadentalcenter.webflow.io/${slug}` }, sessionId);
  const ev = async (x) => (await send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true }, sessionId)).result?.value;
  for (let i = 0; i < 90; i++) { if (await ev(`document.readyState==='complete'`) === true) break; await wait(200); }
  if (v.css) await ev(`(function(){var s=document.createElement('style');s.textContent=${JSON.stringify(v.css)};document.head.appendChild(s);return 1})()`);
  await ev(`(async function(){var h=document.documentElement.scrollHeight;
    for(var y=0;y<h;y+=Math.round(innerHeight*.8)){window.scrollTo(0,y);await new Promise(function(r){setTimeout(r,50)})}window.scrollTo(0,0);return 1})()`);
  await wait(1400);
  console.log(v.name.padEnd(22), JSON.stringify(await ev(expr)));
  await send('Target.closeTarget', { targetId });
}
try { await send('Browser.close'); } catch {}
proc.kill();
