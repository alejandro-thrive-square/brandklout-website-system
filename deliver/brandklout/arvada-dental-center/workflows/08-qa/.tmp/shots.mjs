#!/usr/bin/env node
/**
 * shots.mjs — six-breakpoint responsive capture, and the horizontal-overflow
 * assertion that goes with it.
 *
 *   screenshots/<page-slug>/<width>.png        full page, every breakpoint
 *   screenshots/<page-slug>/motion/<width>.png the shipped motion state, mid-journey
 *
 * Why the required <width>.png files are captured under prefers-reduced-motion:
 * a full-page capture photographs the document at scroll 0, and this build is
 * scroll-driven — the pinned chapters are deliberately mid-assembly until you
 * scroll them. Capturing them cold would photograph empty stages and tell you
 * nothing about layout. Reduced motion is the one state where every chapter
 * renders complete and in normal flow, so it is the honest full-page view — and
 * it doubles as evidence that reduced motion hides nothing.
 *
 * ScrollSmoother is off in both passes (?nosmooth=1 for the motion pass): it
 * transforms the content instead of scrolling it, which breaks captureBeyondViewport.
 * That flag is a capture-time URL parameter and is never shipped in the markup.
 *
 * Overflow is asserted in BOTH states, because it is the shipped page that has
 * to not scroll sideways.
 *
 *   node shots.mjs [page-slug ...]
 */

import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const DESIGN = resolve(HERE, '../../04-design/.tmp');
const SHOTS = join(HERE, 'screenshots');
const PAGES = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ['implants', 'aox', 'veneers', 'emergency', 'dentist-near-me', 'next-door'];

// Paid dental traffic is mostly mobile, so 360 and 390 matter more than 1920.
const WIDTHS = [360, 390, 768, 1024, 1440, 1920];

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => existsSync(p))
  ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
// A fixed port was the single biggest source of flakiness in this harness: if a
// previous run's Chrome has not fully exited, the next launch finds the port
// taken, exits, and the run dies with "did not expose a debugging port" — which
// looks like a page failure and is not. Derive a per-process port instead so two
// runs can never collide.
const PORT = 9200 + (process.pid % 700);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const proc = spawn(CHROME, [
  `--remote-debugging-port=${PORT}`,
  '--user-data-dir=' + join(HERE, '.chrome-shots'),
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

let msgId = 0;
const pending = new Map();
let sink = null;
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) {
    const { res, rej } = pending.get(m.id); pending.delete(m.id);
    m.error ? rej(new Error(m.error.message)) : res(m.result);
  } else if (sink) sink(m);
};
const send = (method, params = {}, sessionId) => {
  const id = ++msgId;
  ws.send(JSON.stringify({ id, method, params, sessionId }));
  return new Promise((res, rej) => pending.set(id, { res, rej }));
};

const report = [];

for (const slug of PAGES) {
  const dir = join(SHOTS, slug);
  mkdirSync(join(dir, 'motion'), { recursive: true });
  const base = pathToFileURL(join(DESIGN, slug, 'index.html')).href;
  console.log(`\n── ${slug}`);

  for (const mode of ['layout', 'motion']) {
    const url = mode === 'motion' ? base + '?nosmooth=1' : base;

    for (const width of WIDTHS) {
      const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
      const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
      const errs = [];
      sink = (m) => {
        if (m.sessionId !== sessionId) return;
        if (m.method === 'Runtime.exceptionThrown') errs.push(m.params.exceptionDetails.text || 'exception');
        if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error')
          errs.push(m.params.args.map((a) => a.description || a.value).join(' '));
      };

      await send('Runtime.enable', {}, sessionId);
      await send('Page.enable', {}, sessionId);
      await send('Emulation.setFocusEmulationEnabled', { enabled: true }, sessionId);
      await send('Page.bringToFront', {}, sessionId);
      await send('Emulation.setDeviceMetricsOverride', {
        width, height: 900, deviceScaleFactor: 1, mobile: width <= 430,
      }, sessionId);
      if (mode === 'layout') {
        await send('Emulation.setEmulatedMedia', {
          features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
        }, sessionId);
      }
      await send('Page.navigate', { url }, sessionId);

      const ev = async (expr) => {
        const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }, sessionId);
        if (r.exceptionDetails) return null;
        if (r.result.value === undefined && r.result.unserializableValue !== undefined) return Number(r.result.unserializableValue);
        return r.result.value;
      };

      for (let i = 0; i < 60; i++) {
        if (await ev(`document.documentElement.getAttribute('data-js')==='on'`)) break;
        await wait(250);
      }
      await ev(`document.fonts ? document.fonts.ready.then(()=>1) : 1`);

      // Lazy images half-paint unless the page has been walked first.
      await ev(`(async function(){
        var h = document.documentElement.scrollHeight;
        for (var y = 0; y < h; y += Math.round(innerHeight * 0.7)) {
          window.scrollTo(0, y);
          await new Promise(function(r){ setTimeout(r, 90); });
        }
        window.scrollTo(0, 0);
        return 1;
      })()`);
      await wait(900);

      const overflow = await ev(`(function(){
        return { scrollW: document.documentElement.scrollWidth, inner: window.innerWidth,
                 bodyW: document.body.scrollWidth };
      })()`);
      const brokenImgs = await ev(`Array.from(document.images)
        .filter(function(i){ return i.complete && i.naturalWidth === 0; })
        .map(function(i){ return i.currentSrc || i.src; }).slice(0, 6)`);
      const tiny = await ev(`(function(){
        var bad = 0;
        document.querySelectorAll('p,li,span,a,td,th,label').forEach(function(el){
          if (!el.textContent.trim()) return;
          if (parseFloat(getComputedStyle(el).fontSize) < 11.5) bad++;
        });
        return bad;
      })()`);
      const smallTap = await ev(`(function(){
        var bad = [];
        document.querySelectorAll('a.btn, button, .actionbar a, .faq__q, .quiz__opt').forEach(function(el){
          var r = el.getBoundingClientRect();
          if (r.width === 0 && r.height === 0) return;
          if (r.height < 40 || r.width < 40) bad.push((el.className || el.tagName) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
        });
        return bad.slice(0, 5);
      })()`);

      // Interaction is verified once per page, at the width most of the paid
      // traffic actually arrives on. A screenshot cannot tell you whether the
      // accordion opens or the offer is still reachable at the bottom of the page.
      let interaction = null;
      if (mode === 'motion' && width === 390) {
        interaction = await ev(`(async function(){
          var out = {};
          var sleep = function(ms){ return new Promise(function(r){ setTimeout(r, ms); }); };

          // Offer, phone and form reachable at every scroll depth.
          var doc = document.documentElement.scrollHeight - innerHeight;
          out.reachable = true;
          for (var f = 0; f <= 1.0001; f += 0.25) {
            window.scrollTo(0, Math.round(doc * f));
            await sleep(500);
            var bar = document.querySelector('.actionbar');
            var barOn = bar && bar.classList.contains('is-on') &&
              bar.getBoundingClientRect().top < innerHeight;
            var telVisible = Array.from(document.querySelectorAll('a[href^="tel:"]')).some(function(a){
              var r = a.getBoundingClientRect();
              return r.width > 0 && r.top < innerHeight && r.bottom > 0;
            });
            if (!(barOn || telVisible)) { out.reachable = false; out.reachFailAt = f; break; }
          }
          window.scrollTo(0, 0); await sleep(400);

          // FAQ opens and reports its state to assistive tech.
          var q = document.querySelector('.faq__q');
          if (q) {
            var panel = document.getElementById(q.getAttribute('aria-controls'));
            var before = panel.getBoundingClientRect().height;
            q.click(); await sleep(700);
            out.faqOpens = panel.getBoundingClientRect().height > before + 8
              && q.getAttribute('aria-expanded') === 'true';
            q.click(); await sleep(500);
          } else out.faqOpens = null;

          // Stepped qualifier advances (implants and aox only).
          var opt = document.querySelector('.quiz__opt');
          if (opt) {
            opt.click(); await sleep(500);
            var steps = document.querySelectorAll('.quiz__step');
            out.quizAdvances = steps[1] && steps[1].getAttribute('data-active') === 'true';
          } else out.quizAdvances = null;

          // Lead form: rejects empty, accepts complete, and confirms in place.
          var form = document.querySelector('form[data-lead]');
          if (form) {
            form.querySelector('button[type=submit]').click(); await sleep(300);
            out.formRejectsEmpty = !!form.querySelector('.field.is-bad');
            form.querySelectorAll('[required]').forEach(function(i){
              i.value = i.type === 'tel' ? '3035550147' : (i.type === 'email' ? 'a@b.co' : 'QA Test');
            });
            form.querySelector('button[type=submit]').click(); await sleep(400);
            out.formConfirms = !!document.querySelector('.form-ok');
            out.leadCaptured = !!(window.__arvadaLeads && window.__arvadaLeads.length);
          }
          return out;
        })()`);
      }

      if (interaction) {
        // The interaction pass submitted the form and replaced it with the
        // confirmation. Reload so the capture shows the page, not the receipt.
        await send('Page.navigate', { url }, sessionId);
        for (let i = 0; i < 60; i++) {
          if (await ev(`document.documentElement.getAttribute('data-js')==='on'`)) break;
          await wait(250);
        }
        await ev(`(async function(){ var h=document.documentElement.scrollHeight;
          for (var y=0;y<h;y+=Math.round(innerHeight*0.7)){ window.scrollTo(0,y);
            await new Promise(function(r){setTimeout(r,80);}); }
          window.scrollTo(0,0); return 1; })()`);
        await wait(800);
      }

      if (mode === 'motion') {
        // Park mid-journey so the capture shows the page as a visitor meets it,
        // rather than a hero and a column of not-yet-scrubbed stages.
        await ev(`window.scrollTo(0, Math.round((document.documentElement.scrollHeight - innerHeight) * 0.42))`);
        await wait(1400);
      }

      const shot = await send('Page.captureScreenshot', {
        format: 'png',
        captureBeyondViewport: mode === 'layout',
        optimizeForSpeed: false,
      }, sessionId);

      const file = mode === 'layout' ? join(dir, `${width}.png`) : join(dir, 'motion', `${width}.png`);
      writeFileSync(file, Buffer.from(shot.data, 'base64'));

      const ok = overflow && overflow.scrollW <= overflow.inner + 1;
      report.push({
        page: slug, mode, width, overflowOk: ok,
        scrollW: overflow?.scrollW, inner: overflow?.inner,
        brokenImages: brokenImgs || [], tinyText: tiny, smallTapTargets: smallTap || [],
        consoleErrors: errs.length, interaction,
      });
      if (interaction) console.log('   interaction  ' + JSON.stringify(interaction));
      console.log(`   ${mode.padEnd(6)} ${String(width).padStart(4)}  overflow:${ok ? 'ok ' : 'FAIL'}` +
        ` (${overflow?.scrollW}/${overflow?.inner})  imgs:${(brokenImgs || []).length}` +
        ` tiny:${tiny} tap:${(smallTap || []).length} err:${errs.length}`);

      sink = null;
      await send('Target.closeTarget', { targetId });
    }
  }
}

writeFileSync(join(HERE, 'shots-report.json'), JSON.stringify(report, null, 2));
try { await send('Browser.close'); } catch { /* gone */ }
proc.kill();

const badInteraction = report.filter((r) => r.interaction && Object.entries(r.interaction)
  .some(([k, v]) => v === false && k !== 'reachFailAt'));
const fails = report.filter((r) => !r.overflowOk || r.brokenImages.length || r.consoleErrors)
  .concat(badInteraction);
console.log(`\n${'='.repeat(64)}`);
console.log(`captures        : ${report.length}`);
console.log(`overflow clean  : ${report.filter((r) => r.overflowOk).length}/${report.length}`);
console.log(`broken images   : ${report.reduce((n, r) => n + r.brokenImages.length, 0)}`);
console.log(`console errors  : ${report.reduce((n, r) => n + r.consoleErrors, 0)}`);
console.log(`tap targets <40 : ${report.reduce((n, r) => n + r.smallTapTargets.length, 0)}`);
console.log(`interaction      : ${report.filter((r) => r.interaction).length - badInteraction.length}/${report.filter((r) => r.interaction).length} pages clean`);
if (fails.length) fails.slice(0, 10).forEach((f) =>
  console.log(`  ! ${f.page} ${f.mode} ${f.width}: ${f.scrollW}/${f.inner} imgs=${f.brokenImages.length} err=${f.consoleErrors}`));
process.exit(fails.length ? 1 : 0);
