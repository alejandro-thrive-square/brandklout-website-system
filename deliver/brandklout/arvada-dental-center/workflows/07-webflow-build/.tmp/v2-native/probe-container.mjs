#!/usr/bin/env node
/** probe-container.mjs — why .camp_container centres differently local vs live. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const LOCAL = 'file:///' + path.resolve(HERE, '../../../04-design/.tmp/v2/implants/index.html').replace(/\\/g, '/');
const LIVE = 'https://arvadadentalcenter.webflow.io/dental-implants-ads-landing-v2';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const dir = path.join(os.tmpdir(), 'wz-q-' + process.pid);
const port = 9660;
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${dir}`,
  '--no-first-run', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files', 'about:blank'], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let nextId = 1;
const rpc = (ws, method, params, sessionId) => new Promise((resolve, reject) => {
  const id = nextId++;
  const h = (ev) => { const m = JSON.parse(ev.data); if (m.id !== id) return; ws.removeEventListener('message', h); m.error ? reject(new Error(m.error.message)) : resolve(m.result); };
  ws.addEventListener('message', h);
  ws.send(JSON.stringify({ id, method, params, sessionId }));
});

const EXPR = `JSON.stringify({
  htmlFont: getComputedStyle(document.documentElement).fontSize,
  bodyMargin: getComputedStyle(document.body).marginLeft,
  bodyWidth: document.body.clientWidth,
  boxSizing: getComputedStyle(document.querySelector('.camp_container')).boxSizing,
  containers: [...document.querySelectorAll('.camp_container')].slice(0, 4).map(e => ({
    cls: e.getAttribute('class'),
    w: Math.round(e.getBoundingClientRect().width),
    maxW: getComputedStyle(e).maxWidth,
    padL: getComputedStyle(e).paddingLeft,
    parentW: Math.round(e.parentElement.getBoundingClientRect().width),
  })),
})`;

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

  for (const [label, url] of [['LOCAL', LOCAL], ['LIVE ', LIVE]]) {
    await rpc(ws, 'Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false }, sessionId);
    await rpc(ws, 'Page.navigate', { url }, sessionId);
    await sleep(url.startsWith('file') ? 2500 : 7000);
    const r = await rpc(ws, 'Runtime.evaluate', { expression: EXPR, returnByValue: true }, sessionId);
    const v = JSON.parse(r.result.value);
    console.log(`\n=== ${label} ===`);
    console.log(`html font-size ${v.htmlFont}   body margin-left ${v.bodyMargin}   body width ${v.bodyWidth}   box-sizing ${v.boxSizing}`);
    for (const c of v.containers) console.log(`  w ${String(c.w).padStart(5)}  maxW ${String(c.maxW).padStart(8)}  padL ${String(c.padL).padStart(6)}  parent ${String(c.parentW).padStart(5)}  .${c.cls}`);
  }
} finally { chrome.kill(); }
