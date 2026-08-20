#!/usr/bin/env node
/**
 * shots.mjs — capture the local funnel at desktop and phone widths.
 *
 *   node shots.mjs [page ...]     default: all three
 *
 * Paid dental traffic is mostly mobile, so 390 matters at least as much as
 * 1440. Every page is walked top to bottom before capture: `captureBeyondViewport`
 * does not load lazy images, and a tall screenshot with holes in it judges the
 * layout and never the photography.
 */
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const DESIGN = resolve(HERE, '../../04-design/.tmp/v1');
const OUT = join(HERE, 'shots');
const PAGES = process.argv.slice(2).length ? process.argv.slice(2) : ['emergency', 'emergency-consult', 'emergency-ty'];
const WIDTHS = [1440, 390];

mkdirSync(OUT, { recursive: true });
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => existsSync(p));
const PORT = 9200 + (process.pid % 700);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const proc = spawn(CHROME, [`--remote-debugging-port=${PORT}`, '--user-data-dir=' + join(HERE, '.chrome-shots'),
  '--no-first-run', '--no-default-browser-check', '--allow-file-access-from-files',
  '--disable-backgrounding-occluded-windows', '--disable-renderer-backgrounding', '--disable-background-timer-throttling',
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

for (const page of PAGES) {
  const url = pathToFileURL(join(DESIGN, page, 'index.html')).href;
  for (const width of WIDTHS) {
    const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
    await send('Runtime.enable', {}, sessionId);
    await send('Page.enable', {}, sessionId);
    await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width <= 430 }, sessionId);
    await send('Page.navigate', { url }, sessionId);
    await wait(1800);
    const ev = async (expression) => {
      const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, sessionId);
      return r.exceptionDetails ? null : r.result.value;
    };
    await ev(`document.fonts ? document.fonts.ready.then(function(){return 1;}) : 1`);
    await ev(`(async function(){ var h=document.documentElement.scrollHeight; for (var y=0;y<h;y+=500){ window.scrollTo(0,y); await new Promise(function(r){setTimeout(r,60);}); } window.scrollTo(0,0); return 1; })()`);
    await wait(900);
    const over = await ev(`({ scrollW: document.documentElement.scrollWidth, inner: window.innerWidth, h: document.documentElement.scrollHeight })`);
    const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true }, sessionId);
    writeFileSync(join(OUT, `${page}-${width}.png`), Buffer.from(shot.data, 'base64'));
    const bleeds = over && over.scrollW > over.inner + 1;
    console.log(`${page} @${width}  ${over ? over.h + 'px tall' : '?'}  ${bleeds ? 'HORIZONTAL OVERFLOW ' + over.scrollW + ' > ' + over.inner : 'no sideways scroll'}`);
    await send('Target.closeTarget', { targetId });
  }
}
ws.close(); proc.kill();
console.log('shots in', OUT);
