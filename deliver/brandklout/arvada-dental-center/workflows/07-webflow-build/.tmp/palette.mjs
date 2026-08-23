/**
 * palette.mjs — what colours does a page ACTUALLY wear?
 *
 * Not what its stylesheet declares. A stylesheet full of brand tokens tells
 * you nothing about whether the brand is on screen: a token declared once and
 * used on a 40px underline is not the page's colour, and the journey.css
 * comment "sampled from the practice's own stylesheet" is exactly that kind of
 * claim — sampled values, no evidence of how the real site weights them.
 *
 * So measure paint. Every visible element contributes its background colour
 * weighted by its own box area MINUS the area its children cover (otherwise a
 * body background is counted once per descendant), and its text colour
 * weighted by an approximation of the glyph area. The result is a ranked
 * palette in the proportions a visitor sees.
 *
 *   node palette.mjs <url> [width]
 *   node palette.mjs https://arvadadentalcenter.com/ 1440
 */
import { spawn } from 'node:child_process';
import { existsSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const [url, widthArg] = process.argv.slice(2);
const WIDTH = Number(widthArg || 1440);

const PROBE = `(async function(){
  // Walk the whole document once, top to bottom, so lazy content paints.
  var h = document.documentElement.scrollHeight;
  for (var y = 0; y < h; y += innerHeight * 0.9) {
    window.scrollTo(0, y);
    await new Promise(function(r){ setTimeout(r, 260); });
  }
  window.scrollTo(0, 0);
  await new Promise(function(r){ setTimeout(r, 500); });

  function norm(c) {
    if (!c) return null;
    var m = /rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)(?:,\\s*([\\d.]+))?\\)/.exec(c);
    if (!m) return null;
    if (m[4] !== undefined && parseFloat(m[4]) < 0.12) return null;  // effectively invisible
    var hex = '#' + [m[1],m[2],m[3]].map(function(v){
      return ('0' + parseInt(v,10).toString(16)).slice(-2); }).join('');
    return hex.toUpperCase();
  }

  var bg = {}, fg = {};
  var all = document.querySelectorAll('*');
  all.forEach(function(e){
    var cs = getComputedStyle(e);
    if (cs.display === 'none' || cs.visibility === 'hidden') return;
    if (parseFloat(cs.opacity) < 0.12) return;
    var r = e.getBoundingClientRect();
    var w = r.width, ht = e.scrollHeight || r.height;
    if (w < 2 || ht < 2) return;
    var area = w * ht;

    /**
     * Subtract the area of children that themselves paint a background, or a
     * <section> and every wrapper inside it each claim the full band and one
     * colour is counted five times over.
     */
    var covered = 0;
    for (var i = 0; i < e.children.length; i++) {
      var c = e.children[i], ccs = getComputedStyle(c);
      if (ccs.display === 'none' || ccs.visibility === 'hidden') continue;
      var cb = norm(ccs.backgroundColor);
      if (!cb && !/url\\(/.test(ccs.backgroundImage)) continue;
      var cr = c.getBoundingClientRect();
      covered += Math.max(0, cr.width) * Math.max(0, c.scrollHeight || cr.height);
    }
    var own = Math.max(0, area - covered);

    var b = norm(cs.backgroundColor);
    if (b && own > 400) bg[b] = (bg[b] || 0) + own;

    // Text: only nodes with their own text, weighted by glyphs x size.
    var t = '';
    for (var j = 0; j < e.childNodes.length; j++) {
      if (e.childNodes[j].nodeType === 3) t += e.childNodes[j].nodeValue;
    }
    t = t.replace(/\\s+/g, ' ').trim();
    if (t.length > 1) {
      var f = norm(cs.color);
      var fs = parseFloat(cs.fontSize) || 16;
      if (f) fg[f] = (fg[f] || 0) + t.length * fs * fs * 0.42;
    }
  });
  var rank = function(o){
    var tot = 0; Object.keys(o).forEach(function(k){ tot += o[k]; });
    return Object.keys(o).map(function(k){ return { hex: k, pct: +(100*o[k]/tot).toFixed(1) }; })
      .sort(function(a,b){ return b.pct - a.pct; }).filter(function(x){ return x.pct >= 0.25; });
  };
  return { bg: rank(bg), fg: rank(fg),
    title: document.title, h: document.documentElement.scrollHeight };
})()`;

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => existsSync(p));
const DBG = 9200 + (process.pid % 700);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const PROFILE = join(HERE, `.chrome-pal-${process.pid}`);
try {
  for (const d of readdirSync(HERE)) {
    if (d.startsWith('.chrome-pal-') && d !== `.chrome-pal-${process.pid}`) {
      try { rmSync(join(HERE, d), { recursive: true, force: true }); } catch {}
    }
  }
} catch {}
const proc = spawn(CHROME, [`--remote-debugging-port=${DBG}`, '--user-data-dir=' + PROFILE,
  '--no-first-run', '--no-default-browser-check', '--allow-file-access-from-files',
  '--disable-background-timer-throttling', '--disable-renderer-backgrounding',
  `--window-size=${WIDTH},900`, '--window-position=-2400,0', 'about:blank'], { stdio: 'ignore' });
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
await send('Page.enable', {}, sessionId);
await send('Network.enable', {}, sessionId);
await send('Network.setBlockedURLs', { urls: ['*sienna-accessibility*', '*googletagmanager*', '*elfsight*'] }, sessionId);
await send('Emulation.setDeviceMetricsOverride', { width: WIDTH, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId);
await send('Page.navigate', { url }, sessionId);
const ev = async (x) => (await send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true }, sessionId)).result?.value;
for (let i = 0; i < 120; i++) { if (await ev(`document.readyState==='complete'`) === true) break; await wait(200); }
await ev(`document.fonts ? document.fonts.ready.then(()=>1) : 1`);
await wait(1800);

const p = await ev(PROBE);
if (!p) { console.error('probe returned nothing — the page did not load'); process.exit(1); }
console.log(`\n${url}  @${WIDTH}   "${p.title}"   ${p.h}px tall`);
console.log('\n  BACKGROUND (share of painted area)');
p.bg.slice(0, 12).forEach((c) => console.log(`    ${c.hex}  ${String(c.pct).padStart(5)}%  ${'#'.repeat(Math.max(1, Math.round(c.pct / 2)))}`));
console.log('\n  TEXT (share of glyph area)');
p.fg.slice(0, 12).forEach((c) => console.log(`    ${c.hex}  ${String(c.pct).padStart(5)}%  ${'#'.repeat(Math.max(1, Math.round(c.pct / 2)))}`));
console.log('\nJSON ' + JSON.stringify(p));
try { await send('Browser.close'); } catch {}
proc.kill();
