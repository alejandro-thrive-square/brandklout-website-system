/* navfit.mjs — does the nav row fit on one line, and from what width?
 *
 * The links are hidden below the `.nav-slot` breakpoint, so that breakpoint is
 * the tightest width they are ever laid out at, and it has to be a width where
 * they actually fit. Adding a sixth item (Journal) put the row over at 1080.
 *
 * Measure the requirement with wrapping OFF. While a flex row is wrapped its
 * items stretch, so summing their widths measures the wrapped layout, not what
 * one line needs — the total then moves when the gap changes for reasons that
 * have nothing to do with the gap.
 *
 *   node navfit.mjs http://127.0.0.1:8902/veneers.html
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import http from 'node:http';

const URL_ = process.argv[2];
const WIDTHS = process.argv[3] ? process.argv[3].split(',').map(Number)
  : [1080, 1100, 1120, 1150, 1180, 1200, 1280, 1440, 1920];
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9700 + Math.floor(Math.random() * 90);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'cdp-navfit-'));
spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars',
  '--remote-debugging-port=' + PORT, '--remote-allow-origins=*', '--no-first-run',
  '--user-data-dir=' + profile, 'about:blank']);
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
  const m = JSON.parse(raw); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); }
});
await new Promise((r) => sock.addEventListener('open', r, { once: true }));
const send = (m, p = {}, s) => new Promise((res, rej) => {
  const mid = ++id; const t = setTimeout(() => rej(new Error('timeout ' + m)), 60000);
  pend.set(mid, (x) => { clearTimeout(t); x.error ? rej(new Error(x.error.message)) : res(x.result); });
  sock.send(JSON.stringify({ id: mid, method: m, params: p, sessionId: s }));
});
const tg = (await gj('/json/list')).find((t) => t.type === 'page');
const { sessionId } = await send('Target.attachToTarget', { targetId: tg.id, flatten: true });
const S = (m, p = {}) => send(m, p, sessionId);
await S('Page.enable'); await S('Runtime.enable');
const ev = async (x) => (await S('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true })).result.value;

const PROBE = String.raw`(() => {
  const ul = document.querySelector('.nav-links');
  const slot = document.querySelector('.nav-slot');
  const inn = document.querySelector('.nav-in');
  const logo = document.querySelector('.nav-logo');
  const cta = document.querySelector('.nav-cta');
  if (!ul || !slot) return { slotVisible: false };
  const box = (el) => (el ? el.getBoundingClientRect() : { width: 0, top: 0 });
  const links = Array.from(ul.querySelectorAll('a'));

  const prevWrap = ul.style.flexWrap, prevWidth = ul.style.width;
  ul.style.flexWrap = 'nowrap'; ul.style.width = 'max-content';
  const need = Math.round(box(ul).width);
  ul.style.flexWrap = prevWrap; ul.style.width = prevWidth;

  const innGap = parseFloat(getComputedStyle(inn).columnGap) || 0;
  const avail = Math.round(box(inn).width - box(logo).width - box(cta).width - innGap * 2);
  return {
    slotVisible: getComputedStyle(slot).display !== 'none',
    wrapped: new Set(links.map((a) => Math.round(box(a).top))).size > 1,
    need, avail, spare: avail - need,
    gap: Math.round(parseFloat(getComputedStyle(ul).columnGap)),
    overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth
  };
})()`;

for (const w of WIDTHS) {
  await S('Emulation.setDeviceMetricsOverride', { width: w, height: 900, deviceScaleFactor: 1, mobile: false });
  await S('Page.navigate', { url: URL_ });
  await wait(2200);
  await ev('document.fonts.ready');
  const r = await ev(PROBE);
  const verdict = !r.slotVisible ? 'drawer' : (r.wrapped ? 'WRAPPED' : 'ok');
  console.log(String(w).padStart(5), verdict.padEnd(8),
    'need', String(r.need).padStart(4), 'avail', String(r.avail).padStart(4),
    'spare', String(r.spare).padStart(5), 'gap', r.gap);
}
sock.close(); process.exit(0);
