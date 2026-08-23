/**
 * shoot.mjs — full-page PNG of a staging landing page, so its palette can be
 * counted off the pixels exactly the way the client scrape was.
 *
 *   node shoot.mjs <slug> [width]
 */
import { spawn } from 'node:child_process';
import { existsSync, writeFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const [slug, widthArg] = process.argv.slice(2);
const WIDTH = Number(widthArg || 1440);
const OUT = join(HERE, 'shots');
mkdirSync(OUT, { recursive: true });

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => existsSync(p));
const DBG = 9200 + (process.pid % 700);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const PROFILE = join(HERE, `.chrome-shot-${process.pid}`);
try {
  for (const d of readdirSync(HERE)) {
    if (d.startsWith('.chrome-shot-') && d !== `.chrome-shot-${process.pid}`) {
      try { rmSync(join(HERE, d), { recursive: true, force: true }); } catch {}
    }
  }
} catch {}
const proc = spawn(CHROME, [`--remote-debugging-port=${DBG}`, '--user-data-dir=' + PROFILE,
  '--no-first-run', '--no-default-browser-check',
  '--disable-background-timer-throttling', '--disable-renderer-backgrounding',
  `--window-size=${WIDTH},900`, '--window-position=-2400,0', 'about:blank'], { stdio: 'ignore' });
let wsUrl;
for (let i = 0; i < 60; i++) {
  try { const r = await fetch(`http://127.0.0.1:${DBG}/json/version`); if (r.ok) { wsUrl = (await r.json()).webSocketDebuggerUrl; break; } } catch {}
  await wait(400);
}
if (!wsUrl) { console.error('Chrome did not expose a debugging port'); process.exit(1); }
const ws = new WebSocket(wsUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let id = 0; const pend = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { const { res, rej } = pend.get(m.id); pend.delete(m.id); m.error ? rej(new Error(m.error.message)) : res(m.result); } };
const send = (me, p = {}, s) => { const i = ++id; ws.send(JSON.stringify({ id: i, method: me, params: p, sessionId: s })); return new Promise((res, rej) => pend.set(i, { res, rej })); };
const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
await send('Page.enable', {}, sessionId);
await send('Network.enable', {}, sessionId);
await send('Network.setBlockedURLs', { urls: ['*sienna-accessibility*', '*googletagmanager*'] }, sessionId);
await send('Emulation.setFocusEmulationEnabled', { enabled: true }, sessionId);
await send('Page.bringToFront', {}, sessionId);
await send('Emulation.setDeviceMetricsOverride', { width: WIDTH, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId);
await send('Page.navigate', { url: `https://arvadadentalcenter.webflow.io/${slug}` }, sessionId);
const ev = async (x) => (await send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true }, sessionId)).result?.value;
for (let i = 0; i < 120; i++) { if (await ev(`document.readyState==='complete'`) === true) break; await wait(200); }
await ev(`document.fonts ? document.fonts.ready.then(()=>1) : 1`);

// Walk the page so scroll-triggered reveals fire and lazy images load —
// otherwise the capture is a page of blank panels and the palette is a lie.
await ev(`(async function(){ var h=document.documentElement.scrollHeight;
  for (var y=0; y<h; y+=innerHeight*0.85){ window.scrollTo(0,y); await new Promise(r=>setTimeout(r,300)); }
  window.scrollTo(0,0); await new Promise(r=>setTimeout(r,600)); return 1; })()`);
await wait(1500);

const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true }, sessionId);
if (!shot?.data) { console.error('no image'); process.exit(1); }
const f = join(OUT, `${slug}-${WIDTH}.png`);
writeFileSync(f, Buffer.from(shot.data, 'base64'));
console.log(f);
try { await send('Browser.close'); } catch {}
proc.kill();
