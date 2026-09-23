/**
 * crop.mjs — top slice of a full-page capture, for looking at rather than
 * measuring. A 11,000px screenshot downscales to an unreadable smear.
 */
import { spawn } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = fileURLToPath(new URL('.', import.meta.url));
const AT = Number(process.env.AT || 0);
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe'].find((p) => existsSync(p));
const DBG = 9200 + (process.pid % 700);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const proc = spawn(CHROME, [`--remote-debugging-port=${DBG}`, '--user-data-dir=' + join(HERE, `.chrome-crop-${process.pid}`),
  '--no-first-run', '--no-default-browser-check', '--window-position=-2400,0', 'about:blank'], { stdio: 'ignore' });
let wsUrl;
for (let i = 0; i < 60; i++) { try { const r = await fetch(`http://127.0.0.1:${DBG}/json/version`); if (r.ok) { wsUrl = (await r.json()).webSocketDebuggerUrl; break; } } catch {} await wait(400); }
const ws = new WebSocket(wsUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let id = 0; const pend = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { const { res, rej } = pend.get(m.id); pend.delete(m.id); m.error ? rej(new Error(m.error.message)) : res(m.result); } };
const send = (me, p = {}, s) => { const i = ++id; ws.send(JSON.stringify({ id: i, method: me, params: p, sessionId: s })); return new Promise((res, rej) => pend.set(i, { res, rej })); };
const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
const ev = async (x) => (await send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true }, sessionId)).result?.value;
for (const f of process.argv.slice(2)) {
  const b64 = readFileSync(f).toString('base64');
  const out = await ev(`(async function(){
    var img=new Image(); img.src=${JSON.stringify(`data:image/png;base64,${b64}`)}; await img.decode();
    var W=720, s=W/img.naturalWidth, H=Math.min(Math.round(img.naturalHeight*s), 1500), OFF=Math.round(img.naturalHeight*${AT});
    var cv=document.createElement('canvas'); cv.width=W; cv.height=H;
    cv.getContext('2d').drawImage(img,0,OFF,img.naturalWidth,Math.round(H/s),0,0,W,H);
    return cv.toDataURL('image/png').split(',')[1];
  })()`);
  const dest = f.replace(/\.png$/, `-at${AT}.png`);
  writeFileSync(dest, Buffer.from(out, 'base64'));
  console.log(dest);
}
try { await send('Browser.close'); } catch {}
proc.kill();
