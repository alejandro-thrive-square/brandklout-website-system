// Drive a live page under CDP and keep what the static HTML does not carry:
// the rendered DOM (third-party widgets fill in at runtime) and the JSON those
// widgets fetch. Node 24 has WebSocket built in.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const url = process.argv[2];
const outDir = process.argv[3];
const settleMs = Number(process.argv[4] || 12000);
const capturePattern = /elfsight|reviews|feedify|universe-static/i;

fs.mkdirSync(outDir, { recursive: true });
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'ldp-cdp-'));
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const port = 9333;

const chrome = spawn(CHROME, [
  '--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check', '--disable-gpu',
  '--window-size=1440,2400', 'about:blank',
], { stdio: 'ignore' });

const sleep = ms => new Promise(r => setTimeout(r, ms));
async function targetWs() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' });
      if (r.ok) return (await r.json()).webSocketDebuggerUrl;
    } catch {}
    await sleep(500);
  }
  throw new Error('chrome did not come up');
}

const ws = new WebSocket(await targetWs());
await new Promise(r => ws.addEventListener('open', r, { once: true }));

let id = 0; const pending = new Map(); const events = [];
ws.addEventListener('message', e => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  else if (m.method) events.push(m);
});
const send = (method, params = {}) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });

await send('Network.enable');
await send('Page.enable');
await send('Runtime.enable');
await sleep(settleMs);

// scroll the whole page so lazy widgets and images actually boot
await send('Runtime.evaluate', { expression: `(async()=>{const h=document.body.scrollHeight;for(let y=0;y<h;y+=600){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,120));}window.scrollTo(0,0);})()`, awaitPromise: true });
await sleep(6000);

const bodies = [];
for (const ev of events) {
  if (ev.method !== 'Network.responseReceived') continue;
  const u = ev.params.response.url;
  if (!capturePattern.test(u)) continue;
  if (!/json|javascript/i.test(ev.params.response.mimeType) ) continue;
  const r = await send('Network.getResponseBody', { requestId: ev.params.requestId });
  if (r?.result?.body && r.result.body.length < 900000) bodies.push({ url: u, mime: ev.params.response.mimeType, body: r.result.body });
}

const dom = await send('Runtime.evaluate', { expression: 'document.documentElement.outerHTML', returnByValue: true });
const text = await send('Runtime.evaluate', { expression: 'document.body.innerText', returnByValue: true });

const slug = new URL(url).pathname.replace(/\W+/g, '-').replace(/^-|-$/g, '') || 'index';
fs.writeFileSync(path.join(outDir, `${slug}.rendered.html`), dom.result.result.value || '');
fs.writeFileSync(path.join(outDir, `${slug}.rendered.txt`), text.result.result.value || '');
fs.writeFileSync(path.join(outDir, `${slug}.network.json`), JSON.stringify(bodies, null, 2));
console.log(`${slug}: dom ${(dom.result.result.value||'').length}b  text ${(text.result.result.value||'').length}b  captured ${bodies.length} responses`);

ws.close(); chrome.kill();
try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
process.exit(0);
