#!/usr/bin/env node
/**
 * slices.mjs — viewport-sized captures at chosen scroll depths.
 *
 * A 12,000px full-page PNG downscales to something no one can judge type or
 * colour from. These are 1:1.
 *
 *   node slices.mjs <page> [width] [y ...]
 */
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const DESIGN = resolve(HERE, '../../04-design/.tmp/v1');
const OUT = join(HERE, 'shots');
mkdirSync(OUT, { recursive: true });

const LIVE = process.argv.includes('--live');
const STAGING = 'https://marvel-dental-main.webflow.io/ads-landing-pages/';
const LIVE_SLUG = { emergency: 'emergency-dentist', 'emergency-consult': 'emergency-dentist-consult', 'emergency-ty': 'emergency-dentist-thank-you' };
const ARGV = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const page = ARGV[0] || 'emergency';
const width = Number(ARGV[1] || 1440);
const ys = ARGV.slice(2).map(Number);
const YS = ys.length ? ys : [0, 900, 1800, 2700];

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => existsSync(p));
const PORT = 9200 + (process.pid % 700);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const proc = spawn(CHROME, [`--remote-debugging-port=${PORT}`, '--user-data-dir=' + join(HERE, '.chrome-slices'),
  '--no-first-run', '--no-default-browser-check', '--allow-file-access-from-files',
  '--window-size=1440,900', '--window-position=-2400,0', 'about:blank'], { stdio: 'ignore' });

let wsUrl;
for (let i = 0; i < 60; i++) {
  try { const r = await fetch(`http://127.0.0.1:${PORT}/json/version`); if (r.ok) { wsUrl = (await r.json()).webSocketDebuggerUrl; break; } } catch {}
  await wait(400);
}
const ws = new WebSocket(wsUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let id = 0; const pending = new Map();
ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { const { res, rej } = pending.get(m.id); pending.delete(m.id); m.error ? rej(new Error(m.error.message)) : res(m.result); } };
const send = (method, params = {}, sessionId) => { const i = ++id; ws.send(JSON.stringify({ id: i, method, params, sessionId })); return new Promise((res, rej) => pending.set(i, { res, rej })); };

const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
await send('Runtime.enable', {}, sessionId);
await send('Page.enable', {}, sessionId);
await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width <= 430 }, sessionId);
await send('Page.navigate', { url: LIVE ? STAGING + LIVE_SLUG[page] : pathToFileURL(join(DESIGN, page, 'index.html')).href }, sessionId);
await wait(2000);
const ev = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, sessionId);
  return r.exceptionDetails ? null : r.result.value;
};
await ev(`document.fonts ? document.fonts.ready.then(function(){return 1;}) : 1`);
await ev(`(async function(){ var h=document.documentElement.scrollHeight; for (var y=0;y<h;y+=500){ window.scrollTo(0,y); await new Promise(function(r){setTimeout(r,50);}); } return 1; })()`);
for (const y of YS) {
  await ev(`window.scrollTo(0, ${y}); 1`);
  await wait(500);
  const shot = await send('Page.captureScreenshot', { format: 'png' }, sessionId);
  writeFileSync(join(OUT, `${page}${LIVE ? '-live' : ''}-${width}-y${y}.png`), Buffer.from(shot.data, 'base64'));
  console.log('slice', page, width, y);
}
ws.close(); proc.kill();
