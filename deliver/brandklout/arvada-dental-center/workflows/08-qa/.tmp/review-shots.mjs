#!/usr/bin/env node
/**
 * review-shots.mjs — crops of just the areas revision r2 touched, at the
 * screen the client actually uses (1920x1080), plus 1440 and 390 for each.
 * A full-page capture at six breakpoints proves nothing is broken; these
 * prove the specific corrections landed.
 *
 *   node review-shots.mjs
 */
import { spawn } from 'node:child_process';
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const DESIGN = resolve(HERE, '../../04-design/.tmp');
const OUT = join(HERE, 'review-r2');
mkdirSync(OUT, { recursive: true });

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => existsSync(p));
const PORT = 9200 + (process.pid % 700);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const proc = spawn(CHROME, [
  `--remote-debugging-port=${PORT}`, '--user-data-dir=' + join(HERE, '.chrome-review'),
  '--no-first-run', '--no-default-browser-check', '--allow-file-access-from-files',
  '--disable-backgrounding-occluded-windows', '--disable-renderer-backgrounding',
  '--disable-background-timer-throttling',
  '--window-size=1440,900', '--window-position=-2400,0', 'about:blank',
], { stdio: 'ignore' });

let wsUrl;
for (let i = 0; i < 60; i++) {
  try { const r = await fetch(`http://127.0.0.1:${PORT}/json/version`); if (r.ok) { wsUrl = (await r.json()).webSocketDebuggerUrl; break; } }
  catch { /* not up */ }
  await wait(400);
}
const ws = new WebSocket(wsUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let msgId = 0; const pending = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { const { res, rej } = pending.get(m.id); pending.delete(m.id); m.error ? rej(new Error(m.error.message)) : res(m.result); } };
const send = (method, p = {}, s) => { const id = ++msgId; ws.send(JSON.stringify({ id, method, params: p, sessionId: s })); return new Promise((res, rej) => pending.set(id, { res, rej })); };

/* Each shot: the page, the element to frame, and how far through that
   element's own pinned scroll range to park before capturing. A pinned
   chapter photographed at scroll 0 is a chapter that has not started. */
const SHOTS = [
  { slug: 'emergency',       sel: '#arr911',   name: '911-note',        at: null },
  { slug: 'dentist-near-me', sel: '#pracPin',  name: 'practice-cards',  at: .35, pin: 'pracPin' },
  { slug: 'implants',        sel: '#anatPin',  name: 'anatomy-mid',     at: .55, pin: 'anatPin' },
  { slug: 'implants',        sel: '#anatPin',  name: 'anatomy-end',     at: 1,   pin: 'anatPin' },
  { slug: 'veneers',         sel: '#mirPin',   name: 'word-sweep-mid',  at: .5,  pin: 'mirPin' },
  { slug: 'veneers',         sel: '#mirPin',   name: 'word-sweep-end',  at: .95, pin: 'mirPin' },
  { slug: 'aox',             sel: '#invitation', name: 'tag-alignment', at: null },
  { slug: 'next-door',       sel: '#invitation', name: 'tag-alignment', at: null },
];

for (const width of [1920, 1440, 390]) {
  for (const s of SHOTS) {
    const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
    await send('Page.enable', {}, sessionId);
    await send('Emulation.setFocusEmulationEnabled', { enabled: true }, sessionId);
    await send('Page.bringToFront', {}, sessionId);
    await send('Emulation.setDeviceMetricsOverride', {
      width, height: width === 390 ? 844 : (width === 1920 ? 1080 : 900),
      deviceScaleFactor: 1, mobile: width === 390,
    }, sessionId);
    await send('Page.navigate', { url: pathToFileURL(join(DESIGN, s.slug, 'index.html')).href + '?nosmooth=1' }, sessionId);
    const ev = async (x) => {
      const r = await send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true }, sessionId);
      return r.exceptionDetails ? null : r.result.value;
    };
    for (let i = 0; i < 80; i++) { if (await ev(`document.documentElement.getAttribute('data-js')==='on'`)) break; await wait(250); }
    await ev(`document.fonts ? document.fonts.ready.then(()=>1) : 1`);
    await ev(`(async function(){var h=document.documentElement.scrollHeight;
      for(var y=0;y<h;y+=Math.round(innerHeight*.7)){window.scrollTo(0,y);await new Promise(function(r){setTimeout(r,70)})}
      window.scrollTo(0,0);return 1})()`);
    await wait(900);

    // Below 900px these chapters are no longer pinned (WZ.canPin), so there is
    // no pinned ScrollTrigger to seek through. Walk the section's own scroll
    // range instead — same fraction, same point in the choreography.
    const parked = s.pin && await ev(`(function(){
      var st=ScrollTrigger.getAll().filter(function(t){return t.pin&&t.pin.id==='${s.pin}'})[0];
      if(!st) return 0;
      window.scrollTo(0, Math.round(st.start+(st.end-st.start)*${s.at})); return 1})()`);
    if (s.pin && !parked) {
      await ev(`(function(){var el=document.getElementById('${s.pin}'); if(!el) return 0;
        var top=el.getBoundingClientRect().top+scrollY, h=el.offsetHeight;
        window.scrollTo(0, Math.round(top - innerHeight*0.25 + (h-innerHeight*0.5)*${s.at}));
        return 1})()`);
    }
    if (!s.pin) {
      // Centre the target. Aligning it to the top puts it under the fixed nav,
      // which is the one place a screenshot cannot show you anything.
      await ev(`(function(){var el=document.querySelector('${s.sel}');
        if(!el) return 0; var r=el.getBoundingClientRect();
        window.scrollTo(0, Math.max(0, r.top + scrollY - Math.max(140,(innerHeight - r.height)/2)));
        return 1})()`);
    }
    await wait(1500);

    const shot = await send('Page.captureScreenshot', { format: 'png' }, sessionId);
    writeFileSync(join(OUT, `${s.slug}-${s.name}-${width}.png`), Buffer.from(shot.data, 'base64'));
    console.log(`  ${s.slug}/${s.name} @${width}`);
    await send('Target.closeTarget', { targetId });
  }
}
console.log(`\nwrote ${OUT}`);
try { await send('Browser.close'); } catch { /* gone */ }
proc.kill();
