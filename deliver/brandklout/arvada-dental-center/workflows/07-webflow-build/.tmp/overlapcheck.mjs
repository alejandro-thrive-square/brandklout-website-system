/**
 * overlapcheck.mjs — does fixed UI cover content?
 *
 * The runbook's own warning: "position:fixed UI is invisible to every layout
 * gate. The sticky action bar cost the pinned chapters nothing in layout and
 * covered ~60px of each on screen. Overflow, interaction and screenshot gates
 * all passed while a card's closing line sat permanently under it."
 *
 * verify_staging.mjs compares COMPUTED STYLES, so it sees that the bar is
 * position:fixed with the right height — and cannot see that it sits on top of
 * a paragraph. This walks the page at several scroll depths and reports text
 * that is underneath fixed UI.
 *
 * Run against BOTH sides: the design was explicitly fixed for this, so the
 * question is whether staging still behaves the same, not whether overlap
 * exists in the abstract.
 *
 *   node overlapcheck.mjs <slug|file-url> [width]
 */
import { spawn } from 'node:child_process';
import { existsSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const [target, widthArg] = process.argv.slice(2);
const WIDTH = Number(widthArg || 390);
const url = /^(https?|file):/.test(target) ? target : `https://arvadadentalcenter.webflow.io/${target}`;

/**
 * At each depth: find every position:fixed/sticky element that is actually
 * painted, then any text-bearing element whose box it covers by more than a
 * sliver. A 2px kiss is normal overlap of a border; 12px+ is a line of text.
 */
const PROBE = `(async function(){
  var out = [], vis = [];
  var h = document.documentElement.scrollHeight;
  for (var f = 0; f <= 1.0001; f += 0.125) {
    window.scrollTo(0, Math.round((h - innerHeight) * f));
    await new Promise(function(r){ setTimeout(r, 700); });

    var fixed = [];
    document.querySelectorAll('*').forEach(function(e){
      var cs = getComputedStyle(e);
      if (cs.position !== 'fixed' && cs.position !== 'sticky') return;
      if (cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.05) return;
      var r = e.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) return;
      if (r.bottom < 0 || r.top > innerHeight) return;
      fixed.push({ el: e, r: r });
    });
    if (!fixed.length) continue;

    document.querySelectorAll('p,h1,h2,h3,h4,li,span,a,button,label').forEach(function(t){
      var txt = (t.textContent || '').replace(/\\s+/g,' ').trim();
      if (!txt || txt.length < 8) return;
      var cs = getComputedStyle(t);
      if (cs.position === 'fixed' || cs.position === 'sticky') return;
      if (cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.05) return;
      var r = t.getBoundingClientRect();
      if (r.height < 4 || r.bottom < 0 || r.top > innerHeight) return;
      vis.push({ key: txt.slice(0, 46) });
      for (var i = 0; i < fixed.length; i++) {
        var F = fixed[i];
        if (F.el.contains(t)) continue;            // its own child, not a cover
        var ov = Math.min(r.bottom, F.r.bottom) - Math.max(r.top, F.r.top);
        var ox = Math.min(r.right, F.r.right) - Math.max(r.left, F.r.left);
        if (ov > 12 && ox > 20) {
          out.push({ at: f.toFixed(3), overlapPx: Math.round(ov),
            fixedCls: String(F.el.className||'').slice(0,28),
            text: txt.slice(0, 46) });
        }
      }
    });
  }
  window.scrollTo(0,0);
  /**
   * TRAPPED, not merely overlapped. Fixed UI covers content momentarily at
   * every scroll position — that is what fixed UI does, and counting those
   * gives 11 hits on the DESIGN, which is known-good. The defect the runbook
   * describes is different: a line that is covered at EVERY depth where it is
   * on screen, so a reader can never get it out from under the bar.
   *
   * So: only report text that was visible at 2+ depths and covered at all of
   * them.
   */
  var seenAt = {}, coveredAt = {}, meta = {};
  vis.forEach(function(v){ seenAt[v.key] = (seenAt[v.key]||0) + 1; });
  out.forEach(function(o){
    var k = o.text;
    coveredAt[k] = (coveredAt[k]||0) + 1;
    meta[k] = o;
  });
  var trapped = [];
  Object.keys(coveredAt).forEach(function(k){
    var seen = seenAt[k] || 0;
    if (seen >= 2 && coveredAt[k] >= seen) trapped.push(
      Object.assign({ seenDepths: seen, coveredDepths: coveredAt[k] }, meta[k]));
  });
  return { overlapEvents: out.length, trapped: trapped };
})()`;

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => existsSync(p));
const DBG = 9200 + (process.pid % 700);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const PROFILE = join(HERE, `.chrome-ovl-${process.pid}`);
try {
  for (const d of readdirSync(HERE)) {
    if (d.startsWith('.chrome-ovl-') && d !== `.chrome-ovl-${process.pid}`) {
      try { rmSync(join(HERE, d), { recursive: true, force: true }); } catch {}
    }
  }
} catch {}
const proc = spawn(CHROME, [`--remote-debugging-port=${DBG}`, '--user-data-dir=' + PROFILE,
  '--no-first-run', '--no-default-browser-check', '--allow-file-access-from-files',
  '--disable-backgrounding-occluded-windows', '--disable-renderer-backgrounding',
  '--disable-background-timer-throttling',
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
await send('Network.setBlockedURLs', { urls: ['*sienna-accessibility*', '*elfsight*', '*googletagmanager*'] }, sessionId);
await send('Emulation.setFocusEmulationEnabled', { enabled: true }, sessionId);
await send('Page.bringToFront', {}, sessionId);
await send('Emulation.setDeviceMetricsOverride', { width: WIDTH, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId);
await send('Page.navigate', { url }, sessionId);
const ev = async (x) => (await send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true }, sessionId)).result?.value;
for (let i = 0; i < 90; i++) { if (await ev(`document.readyState==='complete'`) === true) break; await wait(200); }
await ev(`document.fonts ? document.fonts.ready.then(()=>1) : 1`);
await wait(2200);

const hits = await ev(PROBE);
console.log(`${url.split('/').pop()}  @${WIDTH}  overlap events ${hits.overlapEvents}  PERMANENTLY TRAPPED ${hits.trapped.length}`);
hits.trapped.slice(0, 12).forEach((h) => console.log(`   ${String(h.overlapPx).padStart(3)}px under .${h.fixedCls}  seen ${h.seenDepths}x covered ${h.coveredDepths}x  "${h.text}"`));
try { await send('Browser.close'); } catch {}
proc.kill();
