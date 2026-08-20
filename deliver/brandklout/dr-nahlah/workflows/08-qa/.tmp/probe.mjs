/* probe.mjs — run one expression against one URL under CDP.
 *   node probe.mjs <url> "<js expression>"
 * Kept separate from audit-site.mjs so a finding can be chased without
 * re-running the whole sweep. */
import { spawn } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import http from 'node:http';
let [URL_, EXPR] = process.argv.slice(2);
/* `@file` reads the expression from disk. A 46KB expression as an argv entry is
   ENAMETOOLONG on Windows long before CDP would mind it. */
if (EXPR && EXPR.startsWith('@')) EXPR = fs.readFileSync(EXPR.slice(1), 'utf8');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9600 + Math.floor(Math.random() * 90);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'cdp-probe-'));
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars',
  '--remote-debugging-port=' + PORT, '--remote-allow-origins=*', '--window-size=1440,900',
  '--no-first-run', '--no-default-browser-check', '--autoplay-policy=no-user-gesture-required',
  '--user-data-dir=' + profile, 'about:blank']);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const gj = (p) => new Promise((res, rej) => { http.get({ host: '127.0.0.1', port: PORT, path: p }, (r) => { let d = ''; r.on('data', (c) => (d += c)); r.on('end', () => res(JSON.parse(d))); }).on('error', rej); });
let wsu; for (let i = 0; i < 200; i++) { try { const v = await gj('/json/version'); if (v.webSocketDebuggerUrl) { wsu = v.webSocketDebuggerUrl; break; } } catch { /* not up */ } await wait(300); }
const sock = new WebSocket(wsu); let id = 0; const pend = new Map();
sock.addEventListener('message', async (e) => { const raw = typeof e.data === 'string' ? e.data : await e.data.text(); const m = JSON.parse(raw); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } });
await new Promise((r) => sock.addEventListener('open', r, { once: true }));
const send = (method, params = {}, sid) => new Promise((res, rej) => { const mid = ++id; const t = setTimeout(() => rej(new Error('timeout ' + method)), 90000); pend.set(mid, (m) => { clearTimeout(t); m.error ? rej(new Error(m.error.message)) : res(m.result); }); sock.send(JSON.stringify({ id: mid, method, params, sessionId: sid })); });
const tg = (await gj('/json/list')).find((t) => t.type === 'page');
const { sessionId } = await send('Target.attachToTarget', { targetId: tg.id, flatten: true });
const S = (m, p = {}) => send(m, p, sessionId);
await S('Page.enable'); await S('Runtime.enable');
const ev = async (x) => (await S('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true })).result.value;
await S('Page.navigate', { url: URL_ });
await wait(4500);
await ev('(async()=>{const H=document.documentElement.scrollHeight;for(let y=0;y<H;y+=700){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,45));}window.scrollTo(0,0);await new Promise(r=>setTimeout(r,700));})()');
await wait(1200);
console.log(JSON.stringify(await ev(EXPR), null, 1));
sock.close(); chrome.kill();
