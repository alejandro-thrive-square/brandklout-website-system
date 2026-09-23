#!/usr/bin/env node
/**
 * avif-to-jpeg.mjs — re-encode the practice photographs so Instatic will take them.
 *
 * Webflow serves this gallery as AVIF and that is what the local package uses.
 * Instatic's `media_upload` accepts JPEG, PNG, GIF, WebP and SVG only, and it
 * sniffs the type from the BYTES, so renaming the file does not help. Chrome
 * decodes AVIF natively, so it is the converter: draw each image to a canvas at
 * its natural size and read back a JPEG.
 *
 * Usage: node avif-to-jpeg.mjs <url-of-a-page-serving-the-files> <out-dir> <name...>
 * The files must be reachable over http; a file:// canvas read is tainted and
 * toDataURL throws a security error.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';

const [baseUrl, outDir, ...names] = process.argv.slice(2);
if (!baseUrl || !outDir || !names.length) {
  console.error('usage: avif-to-jpeg.mjs <baseUrl> <outDir> <name...>');
  process.exit(2);
}
fs.mkdirSync(outDir, { recursive: true });

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9400 + Math.floor(Math.random() * 200);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'cdp-avif-'));
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu',
  `--remote-debugging-port=${PORT}`, '--remote-allow-origins=*',
  '--no-first-run', '--no-default-browser-check',
  `--user-data-dir=${profile}`, 'about:blank']);

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const getJSON = (p) => new Promise((res, rej) => {
  http.get({ host: '127.0.0.1', port: PORT, path: p }, (r) => {
    let d = ''; r.on('data', (c) => (d += c)); r.on('end', () => res(JSON.parse(d)));
  }).on('error', rej);
});

let wsUrl;
for (let i = 0; i < 150; i++) {
  try { const v = await getJSON('/json/version'); if (v.webSocketDebuggerUrl) { wsUrl = v.webSocketDebuggerUrl; break; } } catch {}
  await wait(300);
}
const ws = new WebSocket(wsUrl);
let id = 0; const pending = new Map();
ws.addEventListener('message', async (ev) => {
  const raw = typeof ev.data === 'string' ? ev.data : await ev.data.text();
  const m = JSON.parse(raw);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
});
await new Promise((r) => ws.addEventListener('open', r));
const send = (method, params = {}, sessionId) => new Promise((res) => {
  const mid = ++id;
  pending.set(mid, res);
  ws.send(JSON.stringify({ id: mid, method, params, sessionId }));
});

const { result: target } = await send('Target.createTarget', { url: 'about:blank' });
const { result: att } = await send('Target.attachToTarget', { targetId: target.targetId, flatten: true });
const S = att.sessionId;
await send('Page.enable', {}, S);
await send('Runtime.enable', {}, S);
await send('Page.navigate', { url: baseUrl }, S);
await wait(2500);

for (const name of names) {
  const expr = `(async () => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = ${JSON.stringify(name)};
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    c.getContext('2d').drawImage(img, 0, 0);
    return c.toDataURL('image/jpeg', 0.86);
  })()`;
  const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }, S);
  const val = r.result?.result?.value;
  if (!val || !val.startsWith('data:image/jpeg')) {
    console.error(`  FAIL ${name}: ${JSON.stringify(r.result?.exceptionDetails?.text || r.result?.result?.value || '').slice(0, 120)}`);
    continue;
  }
  const out = path.join(outDir, path.basename(name).replace(/\.[a-z0-9]+$/i, '.jpg'));
  fs.writeFileSync(out, Buffer.from(val.split(',')[1], 'base64'));
  console.log(`  ${name} -> ${path.basename(out)}  ${fs.statSync(out).size} bytes`);
}

ws.close();
chrome.kill();
