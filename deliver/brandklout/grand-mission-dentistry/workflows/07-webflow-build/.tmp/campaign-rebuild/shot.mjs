#!/usr/bin/env node
// shot.mjs <url> <out.png> [width] — full-page screenshot over Chrome CDP.
// Static pages only (no ScrollSmoother): captureBeyondViewport is reliable here.
import { spawn, execSync } from 'node:child_process';
import fs from 'node:fs';

const [, , url, out, widthArg] = process.argv;
const width = Number(widthArg || 1440);
const height = 900;
const port = 9333 + Math.floor(Math.random() * 500);
const chrome = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe']
  .find(p => fs.existsSync(p));
const proc = spawn(chrome, [
  '--headless=new', `--remote-debugging-port=${port}`, '--no-first-run', '--no-default-browser-check',
  '--force-prefers-reduced-motion', '--allow-file-access-from-files',
  `--window-size=1500,1000`, '--hide-scrollbars', `--user-data-dir=${process.env.TEMP}\\gmc-shot-${port}`,
], { stdio: 'ignore' });

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function json(path) { return (await fetch(`http://127.0.0.1:${port}/json${path}`)).json(); }

try {
  let targets;
  for (let i = 0; i < 50; i++) { try { targets = await json('/list'); break; } catch { await sleep(200); } }
  const page = targets.find(t => t.type === 'page') || (await json('/new?about:blank'));
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0; const pend = new Map();
  const send = (method, params = {}) => new Promise((res, rej) => {
    const i = ++id; pend.set(i, { res, rej });
    ws.send(JSON.stringify({ id: i, method, params }));
  });
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pend.has(m.id)) { const { res, rej } = pend.get(m.id); pend.delete(m.id); m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result); }
  };
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 800 });
  await send('Page.navigate', { url });
  await sleep(6000);
  // wait until every image is complete (30s cap)
  for (let i = 0; i < 15; i++) {
    const r = await send('Runtime.evaluate', { expression: `[...document.images].filter(i=>!i.complete||i.naturalWidth===0).length`, returnByValue: true });
    if (r.result.value === 0) break;
    await sleep(2000);
  }
  const metrics = await send('Page.getLayoutMetrics');
  const full = Math.min(Math.ceil(metrics.cssContentSize.height), 16000);
  const shot = await send('Page.captureScreenshot', {
    format: 'png',
    clip: { x: 0, y: 0, width, height: full, scale: 1 },
    captureBeyondViewport: true,
  });
  fs.writeFileSync(out, Buffer.from(shot.data, 'base64'));
  // sanity readouts
  const evalJs = async (expr) => (await send('Runtime.evaluate', { expression: expr, returnByValue: true })).result.value;
  const info = await evalJs(`JSON.stringify({
    w: document.documentElement.scrollWidth, iw: innerWidth, h: document.body.scrollHeight,
    font: getComputedStyle(document.body).fontFamily.slice(0,40),
    heroBg: (document.querySelector('.campaign-hero') ? getComputedStyle(document.querySelector('.campaign-hero')).backgroundImage.slice(0,60) : 'n/a'),
    sticky: (document.querySelector('.campaign-header') ? getComputedStyle(document.querySelector('.campaign-header')).position : 'n/a'),
    imgs: [...document.images].filter(i=>!i.complete||i.naturalWidth===0).length,
  })`);
  console.log('captured', out, 'height', full, info);
} finally {
  proc.kill();
}
process.exit(0);
