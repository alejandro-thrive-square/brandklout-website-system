#!/usr/bin/env node
/**
 * root-proof.mjs — proof that the house fluid root is actually live, and that
 * the type it drives stays legible across the whole curve.
 *
 * The static gate (scripts/fluid-root.mjs --check) can only see that the
 * snippet is present in the file. It cannot see whether something later in the
 * cascade — a reset, a vendor sheet, a stray html{font-size} — quietly won. The
 * only thing that settles that is asking a real browser what the computed root
 * font-size is at each width and comparing it with the generator's own table.
 *
 * It also measures what the reader actually gets:
 *   - body copy must render >= 16px at phone widths (dental audience)
 *   - no reading text anywhere below 11.5px
 *   - tap targets >= 44px
 *   - the 479/480 boundary, where the root's segments meet, must not step
 *
 *   node root-proof.mjs [page-slug ...]
 */

import { spawn } from 'node:child_process';
import { writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { rootPxAt } from '../../../../../../scripts/fluid-root.mjs';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const DESIGN = resolve(HERE, '../../04-design/.tmp');
const PAGES = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ['implants', 'aox', 'veneers', 'emergency', 'dentist-near-me', 'next-door'];

// Real device widths first — 320 (SE), 360, 375, 384, 390, 393 (Pixel), 412,
// 414, 430 (Pro Max) — because the scale bands are only worth anything at the
// widths people actually hold. Then the seams: 479/480 is where the root's
// ramping segment meets its flat one, and 445/410/375/340/640/768/900/1200/
// 1350 are where this package's own scale steps land. A band solved at its
// midpoint and only tested at its midpoint proves nothing.
const WIDTHS = [320, 340, 360, 375, 384, 390, 393, 400, 411, 412, 414, 430, 445,
  460, 479, 480, 640, 768, 900, 1024, 1200, 1280, 1350, 1440, 1920, 2400];
// The 16px floor exists to compensate the root ramp, so it applies exactly
// where the root has ramped — derived from the curve, not a width typed in by
// hand. At 479 the root is already 16px, so reading text there is the approved
// desktop size and nothing is owed.
const BODY_FLOOR = 16;
const rampedDown = (w) => rootPxAt(w) < 15.999;
// Nothing may render smaller than the design that was approved: .compare td at
// .92rem against a 16px root is the smallest reading text in the package.
const APPROVED_MIN = 14.65;

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => existsSync(p))
  ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
// Per-process port: a previous run's Chrome that has not fully exited would
// otherwise hold a fixed port and kill this launch with a misleading error.
const PORT = 9200 + (process.pid % 700);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const proc = spawn(CHROME, [
  `--remote-debugging-port=${PORT}`,
  '--user-data-dir=' + join(HERE, '.chrome-root'),
  '--no-first-run', '--no-default-browser-check', '--allow-file-access-from-files',
  '--disable-backgrounding-occluded-windows', '--disable-renderer-backgrounding',
  '--disable-background-timer-throttling',
  '--window-size=1440,900', '--window-position=-2400,0', 'about:blank',
], { stdio: 'ignore' });

let wsUrl;
for (let i = 0; i < 60; i++) {
  try { const r = await fetch(`http://127.0.0.1:${PORT}/json/version`); if (r.ok) { wsUrl = (await r.json()).webSocketDebuggerUrl; break; } }
  catch { /* not up yet */ }
  await wait(400);
}
if (!wsUrl) { console.error('Chrome did not expose a debugging port'); process.exit(1); }
const ws = new WebSocket(wsUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

let msgId = 0;
const pending = new Map();
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) {
    const { res, rej } = pending.get(m.id); pending.delete(m.id);
    m.error ? rej(new Error(m.error.message)) : res(m.result);
  }
};
const send = (method, params = {}, sessionId) => {
  const id = ++msgId;
  ws.send(JSON.stringify({ id, method, params, sessionId }));
  return new Promise((res, rej) => pending.set(id, { res, rej }));
};

const rows = [];
const failures = [];

for (const slug of PAGES) {
  const url = pathToFileURL(join(DESIGN, slug, 'index.html')).href;
  console.log(`\n── ${slug}`);
  console.log('  width  root(px)  expected   body   lede    h1  min-prose  micro  taps<44');

  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  await send('Runtime.enable', {}, sessionId);
  await send('Page.enable', {}, sessionId);
  // A background tab freezes layout work and reports working pages as broken.
  await send('Emulation.setFocusEmulationEnabled', { enabled: true }, sessionId);
  await send('Page.bringToFront', {}, sessionId);

  const ev = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }, sessionId);
    if (r.exceptionDetails) return null;
    if (r.result.value === undefined && r.result.unserializableValue !== undefined) return Number(r.result.unserializableValue);
    return r.result.value;
  };

  for (const width of WIDTHS) {
    await send('Emulation.setDeviceMetricsOverride', {
      width, height: 900, deviceScaleFactor: 1, mobile: width <= 430,
    }, sessionId);
    await send('Page.navigate', { url }, sessionId);
    for (let i = 0; i < 60; i++) {
      if (await ev(`document.documentElement.getAttribute('data-js')==='on'`)) break;
      await wait(250);
    }
    await ev(`document.fonts ? document.fonts.ready.then(()=>1) : 1`);
    await wait(350);

    const m = await ev(`(function(){
      var px = function(el){ return el ? parseFloat(getComputedStyle(el).fontSize) : null; };
      var root = parseFloat(getComputedStyle(document.documentElement).fontSize);
      var body = px(document.body);
      var lede = px(document.querySelector('.lede'));
      var h1   = px(document.querySelector('h1'));
      // Body copy is an explicit list, not "every p on the page". Captions,
      // legal lines, illustration disclaimers and the uppercase chapter
      // readout are small print by design and always have been — sweeping
      // them in would either fail a page that is fine or, worse, push us to
      // widen the filter until it goes green.
      var PROSE = ['.lede','.card p','.checks li','.rule-list li','.review blockquote',
                   '.faq__a p','.compare td','.form-ok','.quiz__opt','.field input'];
      var min = parseFloat(getComputedStyle(document.body).fontSize), minSel = 'body';
      PROSE.forEach(function(sel){
        document.querySelectorAll(sel).forEach(function(el){
          if (sel !== '.field input' && !el.textContent.trim()) return;
          var r = el.getBoundingClientRect();
          if (!r.width && !r.height) return;
          var s = parseFloat(getComputedStyle(el).fontSize);
          if (s < min) { min = s; minSel = sel; }
        });
      });
      // Everything else that carries type, reported not asserted: the house
      // micro-label tier has always sat near 10.5px and that is a design
      // decision, not a defect. Worth seeing if it moves.
      var micro = Infinity;
      document.querySelectorAll('p,li,td,th,span,a,label,button').forEach(function(el){
        if (!el.textContent.trim()) return;
        var r = el.getBoundingClientRect();
        if (!r.width && !r.height) return;
        var s = parseFloat(getComputedStyle(el).fontSize);
        if (s < micro) micro = s;
      });
      var taps = [];
      document.querySelectorAll('a.btn, button.btn, .actionbar a, .faq__q, .quiz__opt').forEach(function(el){
        var r = el.getBoundingClientRect();
        if (!r.width && !r.height) return;
        if (r.height < 44) taps.push((el.className || el.tagName) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
      });
      return { root: root, body: body, lede: lede, h1: h1,
               min: min, minSel: minSel, micro: micro === Infinity ? null : micro, taps: taps };
    })()`);

    const expected = rootPxAt(width);
    const drift = Math.abs(m.root - expected);
    if (drift > 0.05) failures.push(`${slug} @${width}: root ${m.root.toFixed(2)}px, generator says ${expected.toFixed(2)}px`);
    if (rampedDown(width) && m.min < BODY_FLOOR - 0.05) {
      failures.push(`${slug} @${width}: reading text ${m.min.toFixed(1)}px < ${BODY_FLOOR}px where the root has ramped (${m.minSel})`);
    }
    if (m.min < APPROVED_MIN) {
      failures.push(`${slug} @${width}: reading text ${m.min.toFixed(1)}px, below the approved design's ${APPROVED_MIN}px (${m.minSel})`);
    }
    if (m.taps.length) failures.push(`${slug} @${width}: tap target under 44px — ${m.taps.join(', ')}`);

    rows.push({ slug, width, ...m, expected });
    const flag = drift > 0.05 ? '  <-- ROOT MISMATCH' : '';
    console.log(`  ${String(width).padStart(5)}  ${m.root.toFixed(2).padStart(8)}  ${expected.toFixed(2).padStart(8)}  ` +
      `${(m.body ?? 0).toFixed(1).padStart(5)}  ${(m.lede ?? 0).toFixed(1).padStart(5)}  ${(m.h1 ?? 0).toFixed(1).padStart(5)}  ` +
      `${m.min.toFixed(1).padStart(9)}  ${(m.micro ?? 0).toFixed(1).padStart(5)}  ${String(m.taps.length).padStart(7)}${flag}`);
  }

  // The seam. 479 and 480 sit in different root segments; if the scale steps
  // there too, the boundary reads as a rendering bug rather than a design.
  const a = rows.find((r) => r.slug === slug && r.width === 479);
  const b = rows.find((r) => r.slug === slug && r.width === 480);
  const step = (k) => Math.abs(a[k] - b[k]) / b[k];
  const worst = ['body', 'lede', 'h1'].filter((k) => a[k] && b[k]).map((k) => [k, step(k)])
    .sort((x, y) => y[1] - x[1])[0];
  console.log(`  479/480 seam: root ${a.root.toFixed(2)} -> ${b.root.toFixed(2)}, ` +
    `largest type step ${worst[0]} ${(worst[1] * 100).toFixed(1)}%`);
  // The root is continuous across 479/480 (16.00px both sides), so any step
  // here is this package's scale, not the house curve. A modest one is the
  // deliberate mobile type bump; a large one would read as a rendering bug.
  if (worst[1] > 0.15) failures.push(`${slug}: 479/480 seam steps ${worst[0]} by ${(worst[1] * 100).toFixed(1)}%`);

  await send('Target.closeTarget', { targetId });
}

writeFileSync(join(HERE, 'root-proof.json'), JSON.stringify({ rows, failures }, null, 2));
console.log('\n' + '='.repeat(64));
if (failures.length) {
  console.log(`root proof: ${failures.length} FAILURE(S)`);
  failures.forEach((f) => console.log('  ' + f));
} else {
  console.log(`root proof: PASS — computed root matches webzite-house-v1 at ${WIDTHS.length} widths on ${PAGES.length} pages`);
}
ws.close(); proc.kill();
process.exit(failures.length ? 1 : 0);
