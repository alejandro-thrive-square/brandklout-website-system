#!/usr/bin/env node
/**
 * shoot.mjs — screenshot a URL at Webflow's breakpoints, and report the two
 * things a screenshot alone will not tell you: horizontal overflow, and
 * elements that are still unstyled.
 *
 *   node shoot.mjs <url> <outDir> [widths=1440,991,767,479]
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';

const [url, outDir, widthArg] = process.argv.slice(2);
const widths = (widthArg || '1440,991,767,479').split(',').map(Number);
fs.mkdirSync(outDir, { recursive: true });

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
].find((p) => fs.existsSync(p));
if (!CHROME) { console.log('Chrome not found'); process.exit(1); }

const userDir = path.join(os.tmpdir(), 'wz-shoot-' + process.pid);
const port = 9400 + (process.pid % 400);
const chrome = spawn(CHROME, [
  '--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${userDir}`,
  '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--hide-scrollbars',
  'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function endpoint() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (r.ok) return (await r.json()).webSocketDebuggerUrl;
    } catch { /* not up yet */ }
    await sleep(250);
  }
  throw new Error('Chrome never opened its debugging port');
}

let nextId = 1;
function rpc(ws, method, params, sessionId) {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    const onMsg = (ev) => {
      const m = JSON.parse(ev.data);
      if (m.id !== id) return;
      ws.removeEventListener('message', onMsg);
      m.error ? reject(new Error(method + ': ' + m.error.message)) : resolve(m.result);
    };
    ws.addEventListener('message', onMsg);
    ws.send(JSON.stringify({ id, method, params, sessionId }));
  });
}

const report = {};
try {
  const wsUrl = await endpoint();
  const ws = new WebSocket(wsUrl);
  await new Promise((r) => ws.addEventListener('open', r, { once: true }));

  const { targetId } = await rpc(ws, 'Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await rpc(ws, 'Target.attachToTarget', { targetId, flatten: true });
  await rpc(ws, 'Page.enable', {}, sessionId);

  for (const w of widths) {
    await rpc(ws, 'Emulation.setDeviceMetricsOverride',
      { width: w, height: 1000, deviceScaleFactor: 1, mobile: w <= 767 }, sessionId);
    await rpc(ws, 'Page.navigate', { url }, sessionId);
    await sleep(4000);

    // Scroll the whole page first. Judging an image before it has been
    // scrolled to reports every lazy-loaded one as broken — a false alarm that
    // has cost this project two runs already.
    await rpc(ws, 'Runtime.evaluate', {
      expression: `(async () => {
        const step = window.innerHeight;
        for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
          window.scrollTo(0, y);
          await new Promise(r => setTimeout(r, 120));
        }
        window.scrollTo(0, 0);
        await Promise.all([...document.images].map(i => i.complete ? null :
          new Promise(r => { i.addEventListener('load', r, {once:true}); i.addEventListener('error', r, {once:true}); })));
      })()`,
      awaitPromise: true,
    }, sessionId);
    await sleep(1500);

    const probe = await rpc(ws, 'Runtime.evaluate', {
      expression: `(() => {
        const d = document.documentElement;
        const over = [...document.querySelectorAll('*')]
          .filter(e => e.getBoundingClientRect().right > d.clientWidth + 1)
          .slice(0, 8)
          .map(e => (e.className && e.className.baseVal !== undefined ? e.className.baseVal : e.className || e.tagName) + ' @' + Math.round(e.getBoundingClientRect().right));
        const camp = document.querySelectorAll('[class*="camp_"]').length;
        const imgs = [...document.images];
        return JSON.stringify({
          scrollWidth: d.scrollWidth, clientWidth: d.clientWidth,
          overflow: over,
          campElements: camp,
          images: imgs.length,
          brokenImages: imgs.filter(i => !i.complete || i.naturalWidth === 0).map(i => i.currentSrc || i.src).slice(0, 6),
          title: document.title,
          h1: (document.querySelector('h1') || {}).textContent || null,
          bodyFont: getComputedStyle(document.body).fontFamily,
          h1Size: document.querySelector('h1') ? getComputedStyle(document.querySelector('h1')).fontSize : null,
        });
      })()`,
      returnByValue: true,
    }, sessionId);

    if (probe?.exceptionDetails || typeof probe?.result?.value !== 'string') {
      // A probe that returns nothing must not be read as a clean page — that is
      // how a gate reports success while having checked nothing.
      console.log(`${String(w).padStart(5)}px  PROBE FAILED — result unusable, treat this width as unverified`);
      console.log('        ' + JSON.stringify(probe?.exceptionDetails || probe?.result || probe).slice(0, 300));
      report[w] = { probeFailed: true };
      continue;
    }
    report[w] = JSON.parse(probe.result.value);

    const shot = await rpc(ws, 'Page.captureScreenshot', { format: 'png', captureBeyondViewport: true }, sessionId);
    fs.writeFileSync(path.join(outDir, `${w}.png`), Buffer.from(shot.data, 'base64'));
    const r = report[w];
    console.log(`${String(w).padStart(5)}px  scroll ${r.scrollWidth}/${r.clientWidth}` +
      `${r.scrollWidth > r.clientWidth + 1 ? '  *** H-OVERFLOW ***' : ''}` +
      `  camp_ els ${r.campElements}  imgs ${r.images}${r.brokenImages.length ? ` (${r.brokenImages.length} BROKEN)` : ''}` +
      `  h1 ${r.h1Size}`);
    if (r.overflow.length) console.log('        overflowing: ' + r.overflow.join(' | '));
    if (r.brokenImages.length) console.log('        broken: ' + r.brokenImages.join(' | '));
  }
  fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 1));
  console.log(`\nwrote ${widths.length} screenshots + report.json to ${outDir}`);
} finally {
  chrome.kill();
}
