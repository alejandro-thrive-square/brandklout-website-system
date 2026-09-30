#!/usr/bin/env node
/**
 * clips.mjs — readable review crops. A full-page capture of a long page is too
 * small to judge; this writes one viewport-sized crop per section instead.
 *
 *   node clips.mjs <page.html> <width> [selector ...]   # default: every section
 *   -> shots/clip-<page>-<width>-<n>.png
 */
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { join, extname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const [file, widthArg, ...sels] = process.argv.slice(2);
const width = Number(widthArg || 1440);
const SHOTS = join(HERE, 'shots'); mkdirSync(SHOTS, { recursive: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript' };
const server = createServer((req, res) => {
  const f = join(HERE, decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, ''));
  if (!existsSync(f)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': TYPES[extname(f)] ?? 'application/octet-stream' }); res.end(readFileSync(f));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));

const PORT = 9200 + (process.pid % 700);
const PROFILE = join(tmpdir(), `aox-quiz-clips-${process.pid}`);
const proc = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  `--remote-debugging-port=${PORT}`, '--user-data-dir=' + PROFILE, '--headless=new', '--no-first-run', '--hide-scrollbars', 'about:blank',
], { stdio: 'ignore' });
let wsUrl;
for (let i = 0; i < 60 && !wsUrl; i++) { try { const r = await fetch(`http://127.0.0.1:${PORT}/json/version`); if (r.ok) wsUrl = (await r.json()).webSocketDebuggerUrl; } catch { await wait(300); } }
const ws = new WebSocket(wsUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let id = 0; const pending = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); } };
const send = (method, params = {}, sessionId) => { const i = ++id; ws.send(JSON.stringify({ id: i, method, params, sessionId })); return new Promise((res, rej) => pending.set(i, { res, rej })); };

const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
await send('Page.enable', {}, sessionId);
await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width <= 430 }, sessionId);
await send('Page.navigate', { url: `http://127.0.0.1:${server.address().port}/${file}` }, sessionId);
const ev = async (expression) => (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, sessionId)).result.value;
for (let i = 0; i < 60; i++) { if (await ev(`document.readyState === 'complete'`)) break; await wait(150); }
await ev(`document.fonts.ready.then(() => 1)`);
await ev(`(async function(){ var h = document.documentElement.scrollHeight; for (var y = 0; y < h; y += 600) { window.scrollTo({ top: y, behavior: 'instant' }); await new Promise(function(r){ setTimeout(r, 120); }); } window.scrollTo({ top: 0, behavior: 'instant' }); return 1; })()`);
await wait(900);

const list = sels.length ? sels : ['header.aq-topbar, main > section, footer.aq-foot'];
const boxes = await ev(`Array.prototype.slice.call(document.querySelectorAll(${JSON.stringify(list.join(','))})).map(function(e){ var r = e.getBoundingClientRect(); return { y: r.top + scrollY, h: r.height }; })`);
const name = file.replace(/\.html$/, '');
let n = 0;
for (const b of boxes) {
  const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: b.y, width, height: Math.min(b.h, 2400), scale: 1 } }, sessionId);
  const out = `clip-${name}-${width}-${String(++n).padStart(2, '0')}.png`;
  writeFileSync(join(SHOTS, out), Buffer.from(data, 'base64')); console.log(out, Math.round(b.h));
}
ws.close(); proc.kill(); server.close(); await wait(400);
try { rmSync(PROFILE, { recursive: true, force: true }); } catch { /* still letting go */ }
