/**
 * probe_lists.mjs — did wrapping loose list copy in a Text Block move anything?
 *
 * parity.mjs compares whole-section heights, which drift for unrelated reasons
 * (font load, an intervening head-block change) and so cannot answer "did MY
 * edit change the layout". This measures the list rows themselves — the only
 * boxes the repair touches — in the LOCAL DESIGN and on the LIVE page at the
 * same viewport, and prints them side by side.
 *
 *   node probe_lists.mjs <designDir> <liveUrl> [width]
 *
 * Carries the CSS sentinel: `.gm-header` computes `position: fixed` only when
 * the stylesheet is in force. An unstyled load yields a full set of plausible
 * numbers that are all wrong, so every reading here is void without it.
 */
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import http from 'node:http'; import { spawn } from 'node:child_process';

const [DESIGN_DIR, LIVE_URL, W = '1440'] = process.argv.slice(2);
if (!DESIGN_DIR || !LIVE_URL) { console.error('usage: node probe_lists.mjs <designDir> <liveUrl> [width]'); process.exit(2); }
const VW = parseInt(W, 10);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp4': 'video/mp4', '.svg': 'image/svg+xml' };
const srv = http.createServer((q, r) => {
  const rel = decodeURIComponent(q.url.split('?')[0]).replace(/^\//, '') || 'index.html';
  const fp = path.join(DESIGN_DIR, rel);
  if (!fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { r.writeHead(404).end(); return; }
  r.writeHead(200, { 'content-type': MIME[path.extname(fp)] || 'application/octet-stream' });
  fs.createReadStream(fp).pipe(r);
});
const PORT = 8800 + Math.floor(Math.random() * 90);
await new Promise((r) => srv.listen(PORT, '127.0.0.1', r));

const CDP = 9300 + Math.floor(Math.random() * 300);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'cdp-lists-'));
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${CDP}`,
  '--remote-allow-origins=*', `--window-size=${VW},900`, '--force-device-scale-factor=1',
  '--no-first-run', '--no-default-browser-check', `--user-data-dir=${profile}`, 'about:blank']);
const getJSON = (p) => new Promise((res, rej) => {
  http.get({ host: '127.0.0.1', port: CDP, path: p }, (r) => {
    let d = ''; r.on('data', (c) => (d += c)); r.on('end', () => res(JSON.parse(d)));
  }).on('error', rej);
});
let wsUrl; for (let i = 0; i < 150 && !wsUrl; i++) { try { wsUrl = (await getJSON('/json/version')).webSocketDebuggerUrl; } catch { /* not up yet */ } if (!wsUrl) await wait(300); }
const ws = new WebSocket(wsUrl);
let mid = 0; const pending = new Map();
ws.addEventListener('message', async (e) => {
  const raw = typeof e.data === 'string' ? e.data : await e.data.text();
  const m = JSON.parse(raw);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
});
await new Promise((r) => ws.addEventListener('open', r, { once: true }));
const send = (m, p = {}, s) => new Promise((res, rej) => {
  const i = ++mid;
  const t = setTimeout(() => rej(new Error('timeout ' + m)), 90000);
  pending.set(i, (x) => { clearTimeout(t); x.error ? rej(new Error(x.error.message)) : res(x.result); });
  ws.send(JSON.stringify({ id: i, method: m, params: p, sessionId: s }));
});

/* Attach to the tab Chrome already opened and reuse ONE session for both pages.
   A freshly created target never applied the stylesheet here — the sentinel
   failed three times running on a page parity.mjs measures without trouble. */
const { targetInfos } = await send('Target.getTargets');
const pt = targetInfos.find((t) => t.type === 'page')
  || { targetId: (await send('Target.createTarget', { url: 'about:blank' })).targetId };
const { sessionId } = await send('Target.attachToTarget', { targetId: pt.targetId, flatten: true });
await send('Emulation.setDeviceMetricsOverride', { width: VW, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId);

/* The measurement, run identically against both pages. */
const MEASURE = `(() => {
  const styled = getComputedStyle(document.querySelector('.gm-header') || document.body).position === 'fixed';
  const rows = (sel) => [...document.querySelectorAll(sel)].map((n) => {
    const r = n.getBoundingClientRect();
    const cs = getComputedStyle(n);
    return { h: +r.height.toFixed(2), w: +r.width.toFixed(2), display: cs.display,
             cols: cs.gridTemplateColumns, gap: cs.gap, text: (n.textContent || '').trim().slice(0, 34) };
  });
  const probe = (sel) => { const n = document.querySelector(sel); if (!n) return null;
    const cs = getComputedStyle(n);
    return { family: cs.fontFamily, size: cs.fontSize, lh: cs.lineHeight,
             loaded: document.fonts.check(cs.fontSize + ' Montserrat') }; };
  return { styled,
    fonts: { body: probe('body'), tick: probe('.ticks li'), h1: probe('h1'),
             faces: [...document.fonts].map((f) => f.family + ' ' + f.weight + ' ' + f.status).slice(0, 12) },
    ticks: rows('.ticks li'),
    checklist: rows('.checklist li'),
    hours: rows('.hours div'),
    ticksBox: rows('.ticks'), checklistBox: rows('.checklist'), hoursBox: rows('.hours') };
})()`;

async function measure(url, label) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    await send('Page.navigate', { url: url + (url.includes('webflow.io') ? `?cb=${Date.now()}${attempt}` : '') }, sessionId);
    await wait(9000);
    const r = await send('Runtime.evaluate', { expression: MEASURE, returnByValue: true }, sessionId);
    const v = r.result?.value;
    if (v?.styled) return v;
    console.error(`  [sentinel] ${label} loaded unstyled, retry ${attempt}/3`);
  }
  throw new Error(`stylesheet never applied for ${label}`);
}

const design = await measure(`http://127.0.0.1:${PORT}/index.html`, 'design');
const live = await measure(LIVE_URL, 'live');

console.log('DESIGN fonts:', JSON.stringify(design.fonts, null, 1));
console.log('LIVE   fonts:', JSON.stringify(live.fonts, null, 1));

let bad = 0;
for (const key of ['ticks', 'checklist', 'hours', 'ticksBox', 'checklistBox', 'hoursBox']) {
  const d = design[key], l = live[key];
  if (!d.length && !l.length) continue;
  console.log(`\n--- ${key} --- design ${d.length} rows, live ${l.length} rows`);
  if (d.length !== l.length) { console.log('  ROW COUNT MISMATCH'); bad++; continue; }
  d.forEach((row, i) => {
    const o = l[i];
    const dh = Math.abs(row.h - o.h);
    const flag = dh > 1.5 ? 'DIFF' : '  ok';
    if (dh > 1.5) bad++;
    console.log(`  ${flag} h ${String(row.h).padStart(8)} vs ${String(o.h).padStart(8)}  (${row.display}/${o.display})  "${row.text}"`);
  });
}
console.log(`\n${bad === 0 ? 'PASS' : 'FAIL'} — ${bad} list boxes differ from the design by more than 1.5px`);

ws.close(); chrome.kill(); srv.close();
process.exit(bad === 0 ? 0 : 1);
