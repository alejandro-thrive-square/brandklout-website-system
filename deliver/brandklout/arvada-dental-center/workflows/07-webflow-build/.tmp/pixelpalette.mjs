/**
 * pixelpalette.mjs — the palette a visitor's EYE gets, counted off the pixels.
 *
 * Everything upstream of this is inference: a stylesheet's tokens, a count of
 * how many ELEMENTS carry a colour, a computed-style walk that has to guess at
 * glyph area. None of them answer "how much of the screen is this colour",
 * which is the only question that matters when someone says the colours are
 * wrong.
 *
 * So count pixels. Feed it the full-page screenshots from the client scrape
 * and the same for the new pages, and the two histograms are directly
 * comparable.
 *
 *   node pixelpalette.mjs <png> [<png> …]
 */
import { spawn } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const files = process.argv.slice(2);
if (!files.length) { console.error('usage: pixelpalette.mjs <png> …'); process.exit(1); }

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => existsSync(p));
const DBG = 9200 + (process.pid % 700);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const PROFILE = join(HERE, `.chrome-px-${process.pid}`);
try {
  for (const d of readdirSync(HERE)) {
    if (d.startsWith('.chrome-px-') && d !== `.chrome-px-${process.pid}`) {
      try { rmSync(join(HERE, d), { recursive: true, force: true }); } catch {}
    }
  }
} catch {}
const proc = spawn(CHROME, [`--remote-debugging-port=${DBG}`, '--user-data-dir=' + PROFILE,
  '--no-first-run', '--no-default-browser-check',
  '--window-size=800,600', '--window-position=-2400,0', 'about:blank'], { stdio: 'ignore' });
let wsUrl;
for (let i = 0; i < 60; i++) {
  try { const r = await fetch(`http://127.0.0.1:${DBG}/json/version`); if (r.ok) { wsUrl = (await r.json()).webSocketDebuggerUrl; break; } } catch {}
  await wait(400);
}
if (!wsUrl) { console.error('Chrome did not expose a debugging port'); process.exit(1); }
const ws = new WebSocket(wsUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let id = 0; const pend = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { const { res, rej } = pend.get(m.id); pend.delete(m.id); m.error ? rej(new Error(m.error.message)) : res(m.result); } };
const send = (me, p = {}, s) => { const i = ++id; ws.send(JSON.stringify({ id: i, method: me, params: p, sessionId: s })); return new Promise((res, rej) => pend.set(i, { res, rej })); };
const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
const ev = async (x) => (await send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true }, sessionId)).result?.value;

/**
 * Two histograms per image. EXACT keeps full 8-bit values, so flat brand fills
 * come back as themselves rather than as a smear. BUCKET quantises to 24 steps
 * per channel so photographs and gradients collapse into recognisable families
 * instead of ten thousand near-identical entries.
 */
const HIST = (dataUrl) => `(async function(){
  var img = new Image();
  img.src = ${JSON.stringify(dataUrl)};
  await img.decode();
  var W = Math.min(img.naturalWidth, 900);
  var scale = W / img.naturalWidth;
  var H = Math.round(img.naturalHeight * scale);
  var cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  var cx = cv.getContext('2d', { willReadFrequently: true });
  cx.drawImage(img, 0, 0, W, H);
  var d = cx.getImageData(0, 0, W, H).data;
  var exact = {}, bucket = {}, n = 0;
  for (var i = 0; i < d.length; i += 4) {
    if (d[i+3] < 128) continue;
    n++;
    var r = d[i], g = d[i+1], b = d[i+2];
    var k = (r<<16 | g<<8 | b);
    exact[k] = (exact[k] || 0) + 1;
    var q = ((Math.round(r/24)*24)<<16 | (Math.round(g/24)*24)<<8 | (Math.round(b/24)*24));
    bucket[q] = (bucket[q] || 0) + 1;
  }
  var top = function(o, m){
    return Object.keys(o).map(function(k){ return [ +k, o[k] ]; })
      .sort(function(a,b){ return b[1]-a[1]; }).slice(0, m)
      .map(function(p){
        var v = p[0];
        var hex = '#' + ('000000' + v.toString(16)).slice(-6).toUpperCase();
        return { hex: hex, pct: +(100*p[1]/n).toFixed(2) };
      }).filter(function(x){ return x.pct >= 0.2; });
  };
  return { w: img.naturalWidth, h: img.naturalHeight, px: n,
    exact: top(exact, 22), bucket: top(bucket, 14) };
})()`;

for (const f of files) {
  if (!existsSync(f)) { console.log(`${f}: missing`); continue; }
  const b64 = readFileSync(f).toString('base64');
  const r = await ev(HIST(`data:image/png;base64,${b64}`));
  if (!r) { console.log(`${basename(f)}: decode failed`); continue; }
  console.log(`\n=== ${basename(f)}  ${r.w}x${r.h} ===`);
  console.log('  FLAT FILLS (exact pixel values)');
  r.exact.slice(0, 12).forEach((c) => console.log(`    ${c.hex}  ${String(c.pct).padStart(6)}%  ${'#'.repeat(Math.max(1, Math.round(c.pct / 2)))}`));
  console.log('  FAMILIES (quantised, photos included)');
  r.bucket.slice(0, 8).forEach((c) => console.log(`    ${c.hex}  ${String(c.pct).padStart(6)}%`));
}
try { await send('Browser.close'); } catch {}
proc.kill();
