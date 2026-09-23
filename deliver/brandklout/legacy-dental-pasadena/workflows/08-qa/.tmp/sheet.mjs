/* sheet.mjs — screenshot an arbitrary local HTML file, full page.
   Exists because judging "is this photo any good for a hero" from alt text is
   how a clinical intraoral close-up ends up at the top of an ad landing page. */
import { spawn } from 'node:child_process';
import { writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const HERE = fileURLToPath(new URL('.', import.meta.url));
const file = resolve(process.argv[2]);
const out = resolve(process.argv[3] || join(HERE, 'shots', 'sheet.png'));
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => existsSync(p));
const PORT = 9300 + (process.pid % 600);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const proc = spawn(CHROME, [`--remote-debugging-port=${PORT}`, '--user-data-dir=' + join(HERE, '.chrome-sheet'),
  '--headless=new', '--allow-file-access-from-files', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
const kill = () => { try { spawn('taskkill', ['/PID', String(proc.pid), '/T', '/F'], { stdio: 'ignore' }); } catch {} };
process.on('exit', kill);
let ws;
for (let i = 0; i < 60 && !ws; i++) {
  await wait(250);
  try { ws = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find((t) => t.type === 'page')?.webSocketDebuggerUrl; } catch {}
}
if (!ws) { console.log('chrome did not come up'); process.exit(1); }
const sock = new WebSocket(ws); await new Promise((r) => sock.onopen = r);
let id = 0; const pending = new Map();
sock.onmessage = (e) => { const m = JSON.parse(e.data); if (pending.has(m.id)) pending.get(m.id)(m.result); };
const send = (method, params) => new Promise((r) => { const n = ++id; pending.set(n, r); sock.send(JSON.stringify({ id: n, method, params })); });
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1400, height: 900, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: pathToFileURL(file).href });
await wait(9000);
const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
writeFileSync(out, Buffer.from(data, 'base64'));
console.log('wrote ' + out);
kill(); process.exit(0);
