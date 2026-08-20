/* shot-at.mjs — capture the VIEWPORT at a given scroll position and width.
 *
 *   node shot-at.mjs <url> <out.png> <width> <height> <scrollY>
 *
 * A pinned ScrollTrigger cannot be seen in a full-page capture: pinning works by
 * pulling the section out of flow behind a spacer, so `captureBeyondViewport`
 * renders the spacer and the chapter comes out blank. The only way to photograph
 * a pinned section is to scroll to it and shoot the viewport.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import http from 'node:http';

const [URL_, OUT, W = '1440', H = '900', Y = '0'] = process.argv.slice(2);
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9300 + Math.floor(Math.random() * 90);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'cdp-shotat-'));
spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars',
  '--remote-debugging-port=' + PORT, '--remote-allow-origins=*', '--force-device-scale-factor=1',
  '--window-size=' + W + ',' + H, '--no-first-run', '--no-default-browser-check',
  '--autoplay-policy=no-user-gesture-required', '--user-data-dir=' + profile, 'about:blank']);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const gj = (p) => new Promise((res, rej) => {
  http.get({ host: '127.0.0.1', port: PORT, path: p }, (r) => {
    let d = ''; r.on('data', (c) => (d += c)); r.on('end', () => res(JSON.parse(d)));
  }).on('error', rej);
});
let wsu;
for (let i = 0; i < 200; i++) {
  try { const v = await gj('/json/version'); if (v.webSocketDebuggerUrl) { wsu = v.webSocketDebuggerUrl; break; } } catch { /* not up */ }
  await wait(300);
}
const sock = new WebSocket(wsu); let id = 0; const pend = new Map();
sock.addEventListener('message', async (e) => {
  const raw = typeof e.data === 'string' ? e.data : await e.data.text();
  const m = JSON.parse(raw);
  if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); }
});
await new Promise((r) => sock.addEventListener('open', r, { once: true }));
const send = (method, params = {}, sid) => new Promise((res, rej) => {
  const mid = ++id;
  const t = setTimeout(() => rej(new Error('timeout ' + method)), 90000);
  pend.set(mid, (m) => { clearTimeout(t); m.error ? rej(new Error(m.error.message)) : res(m.result); });
  sock.send(JSON.stringify({ id: mid, method, params, sessionId: sid }));
});
const tg = (await gj('/json/list')).find((t) => t.type === 'page');
const { sessionId } = await send('Target.attachToTarget', { targetId: tg.id, flatten: true });
const S = (m, p = {}) => send(m, p, sessionId);
await S('Page.enable'); await S('Runtime.enable');
await S('Emulation.setDeviceMetricsOverride', { width: Number(W), height: Number(H), deviceScaleFactor: 1, mobile: false });
await S('Page.navigate', { url: URL_ });
await wait(4000);
await S('Runtime.evaluate', { expression: 'document.fonts.ready', awaitPromise: true });

/* Step to the target rather than jumping: ScrollSmoother interpolates, and a
   single scrollTo lands the pin mid-transition. */
await S('Runtime.evaluate', {
  expression: `(async()=>{const target=${Number(Y)};for(let y=0;y<=target;y+=400){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,60));}window.scrollTo(0,target);await new Promise(r=>setTimeout(r,2500));})()`,
  awaitPromise: true,
});
await wait(800);
const { data } = await S('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync(OUT, Buffer.from(data, 'base64'));
console.log('wrote', OUT, 'at', W + 'x' + H, 'scrollY', Y);
process.exit(0);
