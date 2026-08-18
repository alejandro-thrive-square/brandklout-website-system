#!/usr/bin/env node
/**
 * shoot-section.mjs — viewport screenshots scrolled to named sections.
 *
 * A full-page capture cannot judge images (captureBeyondViewport never loads
 * lazy ones), and these new sections are mostly photographs. So: scroll each
 * one into view, wait for its images to finish, then capture the viewport.
 *
 *   node shoot-section.mjs <url> <outDir> <class> [class …]
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const [url, outDir, ...classes] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const dir = path.join(os.tmpdir(), 'wz-sec-' + process.pid);
const port = 9700 + (process.pid % 200);
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${dir}`,
  '--no-first-run', '--disable-gpu', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let nextId = 1;
const rpc = (ws, method, params, sessionId) => new Promise((resolve, reject) => {
  const id = nextId++;
  const h = (ev) => { const m = JSON.parse(ev.data); if (m.id !== id) return; ws.removeEventListener('message', h); m.error ? reject(new Error(m.error.message)) : resolve(m.result); };
  ws.addEventListener('message', h);
  ws.send(JSON.stringify({ id, method, params, sessionId }));
});

try {
  let wsUrl;
  for (let i = 0; i < 60; i++) {
    try { const r = await fetch(`http://127.0.0.1:${port}/json/version`); if (r.ok) { wsUrl = (await r.json()).webSocketDebuggerUrl; break; } } catch { }
    await sleep(250);
  }
  const ws = new WebSocket(wsUrl);
  await new Promise((r) => ws.addEventListener('open', r, { once: true }));
  const { targetId } = await rpc(ws, 'Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await rpc(ws, 'Target.attachToTarget', { targetId, flatten: true });
  await rpc(ws, 'Page.enable', {}, sessionId);
  await rpc(ws, 'Emulation.setDeviceMetricsOverride', { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false }, sessionId);
  await rpc(ws, 'Page.navigate', { url }, sessionId);
  await sleep(9000);

  for (const cls of classes) {
    const scroll = await rpc(ws, 'Runtime.evaluate', {
      expression: `(async () => {
        const el = document.querySelector('.${cls}');
        if (!el) return 'MISSING';
        el.scrollIntoView({ block: 'center' });
        await new Promise(r => setTimeout(r, 2500));
        const imgs = [...el.querySelectorAll('img')];
        await Promise.all(imgs.map(i => i.complete ? null : new Promise(r => {
          i.addEventListener('load', r, {once:true}); i.addEventListener('error', r, {once:true});
        })));
        await new Promise(r => setTimeout(r, 800));
        const bad = imgs.filter(i => !i.naturalWidth).length;
        const r = el.getBoundingClientRect();
        return JSON.stringify({ imgs: imgs.length, broken: bad, h: Math.round(r.height) });
      })()`,
      awaitPromise: true, returnByValue: true,
    }, sessionId);
    const info = scroll?.result?.value;
    if (info === 'MISSING') { console.log(`${cls}: NOT ON PAGE`); continue; }
    const shot = await rpc(ws, 'Page.captureScreenshot', { format: 'png' }, sessionId);
    fs.writeFileSync(path.join(outDir, `${cls}.png`), Buffer.from(shot.data, 'base64'));
    console.log(`${cls}: ${info}`);
  }
} finally { chrome.kill(); }
