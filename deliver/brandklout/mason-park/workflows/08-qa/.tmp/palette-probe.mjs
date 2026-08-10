// Two old-palette rules survive in the published stylesheet as bare one-class
// selectors the API cannot address by name (`.btn--sand`, `.ch-hesitation`).
// Reasoning says the three-class combos outrank them. This measures it: read
// the COMPUTED colour of every element that carries either class.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'https://mason-park-dental.webflow.io';
const PAGES = ['invisalign', 'new-patient-special', 'thank-you'];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const PROBE = `(function(){
  var out = [];
  ['btn--sand','ch-hesitation','btn--ghost'].forEach(function(cls){
    document.querySelectorAll('.' + cls).forEach(function(el, i){
      var cs = getComputedStyle(el);
      out.push({
        cls: cls, i: i,
        classes: el.className,
        backgroundColor: cs.backgroundColor,
        color: cs.color,
        borderTopColor: cs.borderTopColor
      });
    });
  });
  return out;
})()`;

let port = 9950;
for (const page of PAGES) {
  const PORT = port++;
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'cdp-palette-'));
  const chrome = spawn(CHROME, [
    '--headless=new', '--use-gl=angle', '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader', '--hide-scrollbars', '--window-size=1440,900',
    `--remote-debugging-port=${PORT}`, '--remote-allow-origins=*',
    '--force-device-scale-factor=1', '--no-first-run',
    `--user-data-dir=${profile}`, 'about:blank',
  ]);
  const getJSON = (p) => new Promise((res, rej) => {
    http.get({ host: '127.0.0.1', port: PORT, path: p }, (r) => {
      let d = ''; r.on('data', (c) => (d += c)); r.on('end', () => res(JSON.parse(d)));
    }).on('error', rej);
  });
  let wsUrl = null;
  for (let i = 0; i < 80 && !wsUrl; i++) {
    try { wsUrl = (await getJSON('/json/version')).webSocketDebuggerUrl; } catch {}
    if (!wsUrl) await wait(200);
  }
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const pend = new Map();
  ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result); pend.delete(m.id); }
  });
  await new Promise((r) => ws.addEventListener('open', r, { once: true }));
  const send = (m, p = {}, s) => new Promise((res) => {
    const i = ++id; pend.set(i, res);
    ws.send(JSON.stringify({ id: i, method: m, params: p, sessionId: s }));
  });
  const { targetInfos } = await send('Target.getTargets');
  const t = targetInfos.find((x) => x.type === 'page');
  const { sessionId } = await send('Target.attachToTarget', { targetId: t.targetId, flatten: true });
  await send('Page.enable', {}, sessionId);
  await send('Runtime.enable', {}, sessionId);
  await send('Page.navigate', { url: `${BASE}/${page}` }, sessionId);
  await wait(3200);
  const r = await send('Runtime.evaluate',
    { expression: PROBE, returnByValue: true }, sessionId);
  const rows = r?.result?.value ?? [];
  console.log(`== ${page} (${rows.length} elements)`);
  const OLD = { 'rgb(168, 135, 95)': '#a8875f', 'rgb(251, 249, 247)': '#fbf9f7',
                'rgb(223, 228, 230)': '#dfe4e6', 'rgb(27, 34, 36)': '#1b2224' };
  let bad = 0;
  for (const row of rows) {
    const hits = [row.backgroundColor, row.color, row.borderTopColor].filter((v) => OLD[v]);
    if (hits.length) { bad++; console.log(`   OLD PALETTE  .${row.cls}[${row.i}] ${JSON.stringify(row)}`); }
  }
  console.log(`   ${bad === 0 ? 'clean — no element computes an old-palette colour' : `${bad} element(s) painting the old palette`}`);
  if (rows.length) console.log(`   sample: ${JSON.stringify(rows[0])}`);
  ws.close();
  chrome.kill();
  await wait(400);
}
