#!/usr/bin/env node
/**
 * scrub-proof.mjs — drives each page in a FOCUSED tab and proves the pinned
 * chapters are scrubbed rather than triggered.
 *
 * The check the standard actually cares about: step-scroll through a pinned
 * chapter's range and assert the content is at a DIFFERENT INTERMEDIATE STATE
 * at 25%, 50% and 75%. Anything that snaps between two states is a triggered
 * scene wearing a costume and fails here.
 *
 * Also asserted: pins engage and release cleanly at both ends, the reading
 * progress indicator tracks real document progress, prefers-reduced-motion
 * disables motion WITHOUT hiding content, and the console is clean.
 *
 * Focus matters: a background tab freezes transitions and timers, so a
 * backgrounded run reports broken animation that is actually fine. The browser
 * is launched headed, brought to front, and given focus emulation.
 *
 *   node scrub-proof.mjs [page-slug ...]
 */

import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const DESIGN = resolve(HERE, '../../04-design/.tmp');
const OUT = resolve(HERE, '.');
const PAGES = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ['implants', 'aox', 'veneers', 'emergency', 'dentist-near-me', 'next-door'];

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
].find((p) => { try { return require('node:fs').existsSync(p); } catch { return false; } })
  ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';

// A fixed port was the single biggest source of flakiness in this harness: if a
// previous run's Chrome has not fully exited, the next launch finds the port
// taken, exits, and the run dies with "did not expose a debugging port" — which
// looks like a page failure and is not. Derive a per-process port instead so two
// runs can never collide.
const PORT = 9200 + (process.pid % 700);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/* ------------------------------------------------------------------ CDP */
class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.pending = new Map(); this.handlers = []; }
  static async connect(url) {
    const ws = new WebSocket(url);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
    const c = new CDP(ws);
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && c.pending.has(msg.id)) {
        const { res, rej } = c.pending.get(msg.id);
        c.pending.delete(msg.id);
        msg.error ? rej(new Error(msg.error.message)) : res(msg.result);
      } else if (msg.method) c.handlers.forEach((h) => h(msg));
    };
    return c;
  }
  send(method, params = {}, sessionId) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params, sessionId }));
    return new Promise((res, rej) => this.pending.set(id, { res, rej }));
  }
  on(fn) { this.handlers.push(fn); }
}

/* ------------------------------------------------------------- launcher */
async function launch() {
  const proc = spawn(CHROME, [
    `--remote-debugging-port=${PORT}`,
    '--user-data-dir=' + join(OUT, '.chrome-profile'),
    '--no-first-run', '--no-default-browser-check',
    '--allow-file-access-from-files',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    '--disable-background-timer-throttling',
    '--window-size=1440,900',
    // Offscreen rather than headless: headless throttles differently and the
    // whole point of this run is that the tab is genuinely focused.
    '--window-position=-2400,0',
    'about:blank',
  ], { detached: false, stdio: 'ignore' });

  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (r.ok) return { proc, ws: (await r.json()).webSocketDebuggerUrl };
    } catch { /* not up yet */ }
    await wait(400);
  }
  throw new Error('Chrome did not expose a debugging port');
}

/* ------------------------------------------------------------ page work */
async function openPage(client, url, { reducedMotion = false } = {}) {
  const { targetId } = await client.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await client.send('Target.attachToTarget', { targetId, flatten: true });

  const errors = [];
  client.on((msg) => {
    if (msg.sessionId !== sessionId) return;
    if (msg.method === 'Runtime.exceptionThrown') {
      errors.push(msg.params.exceptionDetails.exception?.description
        || msg.params.exceptionDetails.text || 'exception');
    }
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      errors.push(msg.params.args.map((a) => a.description || a.value).join(' '));
    }
  });

  await client.send('Runtime.enable', {}, sessionId);
  await client.send('Page.enable', {}, sessionId);
  await client.send('Emulation.setFocusEmulationEnabled', { enabled: true }, sessionId);
  await client.send('Page.bringToFront', {}, sessionId);
  if (reducedMotion) {
    await client.send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
    }, sessionId);
  }
  await client.send('Page.navigate', { url }, sessionId);

  const evalIn = async (expr) => {
    const r = await client.send('Runtime.evaluate', {
      expression: expr, returnByValue: true, awaitPromise: true,
    }, sessionId);
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' :: ' + expr.slice(0, 90));
    // CDP serialises -0, NaN and +/-Infinity as `unserializableValue` with NO
    // `value` field. A perfectly held pin measures exactly -0, so reading
    // `value` alone reported "element missing" for the pins that were working
    // best. Fall back before trusting undefined.
    if (r.result.value === undefined && r.result.unserializableValue !== undefined) {
      return Number(r.result.unserializableValue);
    }
    return r.result.value;
  };

  // The boot script stamps data-js once the whole motion layer is live.
  for (let i = 0; i < 60; i++) {
    if (await evalIn(`document.documentElement.getAttribute('data-js')==='on'`)) break;
    await wait(250);
  }
  await evalIn(`document.fonts ? document.fonts.ready.then(()=>1) : 1`);
  await wait(700);
  return { sessionId, evalIn, errors, close: () => client.send('Target.closeTarget', { targetId }) };
}

/* A state signature for a chapter: every animated property of every
   descendant, rounded. Two signatures differ if ANYTHING moved. */
const SIGNATURE = `(function(sel){
  var root = document.querySelector(sel); if(!root) return '';
  var out = [];
  root.querySelectorAll('*').forEach(function(el, i){
    var cs = getComputedStyle(el);
    var t = cs.transform && cs.transform !== 'none' ? cs.transform.replace(/[\\d.]+/g, function(n){
      return (Math.round(parseFloat(n) * 100) / 100).toString(); }) : '0';
    // Leaf text is part of the state: a scrubbed counter changes its value
    // without changing a single computed style, and that still counts.
    var txt = el.childElementCount === 0 ? (el.textContent || '').trim().slice(0, 24) : '';
    out.push(i + ':' + Math.round(parseFloat(cs.opacity) * 1000) + ':' + t + ':' + cs.color
      + ':' + (cs.clipPath || '') + ':' + Math.round(el.getBoundingClientRect().top) + ':' + txt);
  });
  return out.join('|');
})`;

/* Null-safe rect read. A harness that throws on a missing node turns one flaky
   query into a dead run for every page after it; report it instead. */
async function topOf(evalIn, sel) {
  for (let i = 0; i < 3; i++) {
    // `| 0` normalises -0 to 0 as well, so the value round-trips cleanly.
    const v = await evalIn(`(function(){var e=document.querySelector(${JSON.stringify(sel)});`
      + `return e?(Math.round(e.getBoundingClientRect().top)|0):null;})()`);
    if (v !== null && v !== undefined) return v;
    await wait(500);
  }
  return null;
}

async function proveScrub(page, slug) {
  const { evalIn } = page;
  const report = { page: slug, pins: [], checks: [], errors: [] };

  const pins = await evalIn(`(function(){
    if(!window.ScrollTrigger) return [];
    return ScrollTrigger.getAll().filter(function(s){ return s.pin; }).map(function(s){
      var sec = s.trigger && s.trigger.closest ? s.trigger.closest('section[data-chapter]') : null;
      return { start: s.start, end: s.end,
        chapter: sec ? sec.getAttribute('data-chapter') : '?',
        name: sec ? sec.getAttribute('data-chapter-name') : '?',
        sel: sec ? ('#' + sec.id) : null,
        // ScrollTrigger pins the inner stage, not the <section> — the section
        // grows to hold the pin-spacer and keeps scrolling normally, so the
        // section's own rect is the wrong thing to measure for "is it pinned".
        pinSel: s.pin && s.pin.id ? ('#' + s.pin.id) : null };
    }).filter(function(p){ return p.sel && p.pinSel; });
  })()`);

  for (const pin of pins) {
    const span = pin.end - pin.start;
    const sigs = {}, progress = {}, tops = {};

    for (const p of [0.25, 0.5, 0.75]) {
      await evalIn(`window.scrollTo(0, ${Math.round(pin.start + span * p)})`);
      // Smoothing plus scrub .3 needs a moment to land; ScrollTrigger's own
      // progress is checked below so an under-wait cannot pass silently.
      await wait(1100);
      sigs[p] = await evalIn(`${SIGNATURE}(${JSON.stringify(pin.sel)})`);
      tops[p] = await topOf(evalIn, pin.pinSel);
      progress[p] = await evalIn(`(function(){
        var s = ScrollTrigger.getAll().filter(function(x){ return x.pin &&
          x.trigger && x.trigger.closest && x.trigger.closest(${JSON.stringify(pin.sel)}); })[0];
        return s ? Math.round(s.progress*100)/100 : null;
      })()`);
    }

    const distinct = new Set([sigs[0.25], sigs[0.5], sigs[0.75]]).size;
    const tracked = [0.25, 0.5, 0.75].every((p) => progress[p] !== null && Math.abs(progress[p] - p) < 0.2);

    // Pin engaged: the chapter's top stays put across the whole scrubbed range.
    const tv = Object.values(tops).filter((v) => v !== null);
    const held = tv.length === 3 && Math.max(...tv) - Math.min(...tv) < 12;

    // Clean release at both ends.
    // ScrollSmoother glides for ~1s and ScrollTrigger follows the SMOOTHED
    // position, while `scrollTo` moves native scroll instantly. Under-waiting
    // here reads a pin as still engaged after it has been scrolled clear.
    await evalIn(`window.scrollTo(0, ${Math.max(0, Math.round(pin.start - 400))})`); await wait(1500);
    const beforeTop = await topOf(evalIn, pin.pinSel);
    await evalIn(`window.scrollTo(0, ${Math.round(pin.end + 500)})`); await wait(1500);
    const afterTop = await topOf(evalIn, pin.pinSel);

    report.pins.push({
      chapter: pin.chapter, name: pin.name, sel: pin.sel,
      distinctStates: distinct, scrubbed: distinct === 3,
      progressTracked: tracked, progress,
      pinHeld: held, tops: tops, releaseBefore: beforeTop !== null && beforeTop > 60,
      releaseAfter: afterTop !== null && afterTop < -60,
      beforeTop, afterTop,
    });
  }

  // Reading progress tracks real document progress.
  const prog = [];
  for (const frac of [0.25, 0.55, 0.9]) {
    await evalIn(`window.scrollTo(0, Math.round((document.documentElement.scrollHeight - innerHeight) * ${frac}))`);
    // Same reason: the bar is driven by the smoothed position, the `doc`
    // figure by native scrollY. Compare them only once the glide has settled.
    await wait(1700);
    prog.push(await evalIn(`(function(){
      var i = document.getElementById('navProgress'); if(!i) return null;
      var m = new DOMMatrixReadOnly(getComputedStyle(i).transform);
      var doc = (document.documentElement.scrollHeight - innerHeight) || 1;
      return { bar: Math.round(m.a*100)/100, doc: Math.round((scrollY/doc)*100)/100 };
    })()`));
  }
  report.checks.push({
    name: 'reading progress tracks document',
    pass: prog.every((p) => p && Math.abs(p.bar - p.doc) < 0.18), detail: prog,
  });

  // Offer, phone and form reachable at every depth (mobile is the real traffic).
  report.checks.push({
    name: 'action bar armed past the fold',
    pass: await evalIn(`(function(){
      var b = document.querySelector('.actionbar');
      return !!b && b.classList.contains('is-on') && b.querySelectorAll('a[href^="tel:"],a[href^="#"]').length >= 2;
    })()`),
  });

  report.errors = page.errors.slice();
  return report;
}

async function proveReducedMotion(page, slug) {
  const { evalIn } = page;
  // Nothing may be left hidden, and nothing may be pinned.
  const hidden = await evalIn(`(function(){
    var bad = [];
    document.querySelectorAll('main *').forEach(function(el){
      if(!el.textContent || !el.textContent.trim()) return;
      if(el.children.length) return;                    // leaf text only
      var cs = getComputedStyle(el);
      if(parseFloat(cs.opacity) < 0.05 || cs.visibility === 'hidden')
        bad.push((el.tagName + '.' + el.className).slice(0,60));
    });
    return bad.slice(0, 12);
  })()`);
  const pinned = await evalIn(`window.ScrollTrigger ? ScrollTrigger.getAll().filter(function(s){return s.pin;}).length : -1`);
  const smoother = await evalIn(`!!(window.WZ && window.WZ.smoother)`);
  return { page: slug, hiddenLeafNodes: hidden, pinnedTriggers: pinned, smootherActive: smoother,
    pass: hidden.length === 0 && pinned === 0 && smoother === false, errors: page.errors.slice() };
}

/* ------------------------------------------------------------------ run */
const { proc, ws } = await launch();
const client = await CDP.connect(ws);
const results = { scrub: [], reduced: [] };

try {
  for (const slug of PAGES) {
    const url = pathToFileURL(join(DESIGN, slug, 'index.html')).href;
    process.stdout.write(`\n── ${slug}\n`);

    const p1 = await openPage(client, url);
    let r1;
    try { r1 = await proveScrub(p1, slug); }
    catch (e) { r1 = { page: slug, pins: [], checks: [{ name: 'harness completed', pass: false }],
      errors: [String(e.message || e)] }; }
    results.scrub.push(r1);
    await p1.close();

    for (const pin of r1.pins) {
      const ok = pin.scrubbed && pin.progressTracked && pin.pinHeld && pin.releaseBefore && pin.releaseAfter;
      console.log(`   ch${pin.chapter} ${pin.name.padEnd(18)} states@25/50/75: ${pin.distinctStates}/3` +
        `  pinned:${pin.pinHeld ? 'y' : 'n'}  release:${pin.releaseBefore && pin.releaseAfter ? 'y' : 'n'}` +
        `  ${ok ? 'PASS' : 'FAIL'}`);
    }
    r1.checks.forEach((c) => console.log(`   ${c.name.padEnd(34)} ${c.pass ? 'PASS' : 'FAIL'}`));
    console.log(`   console errors: ${r1.errors.length}`);
    if (r1.errors.length) r1.errors.slice(0, 4).forEach((e) => console.log(`     ! ${String(e).slice(0, 150)}`));

    const p2 = await openPage(client, url, { reducedMotion: true });
    const r2 = await proveReducedMotion(p2, slug);
    results.reduced.push(r2);
    await p2.close();
    console.log(`   reduced-motion: hidden=${r2.hiddenLeafNodes.length} pins=${r2.pinnedTriggers}` +
      ` smoother=${r2.smootherActive}  ${r2.pass ? 'PASS' : 'FAIL'}`);
    if (r2.hiddenLeafNodes.length) console.log(`     ! ${r2.hiddenLeafNodes.join(', ')}`);
  }
} finally {
  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, 'scrub-proof.json'), JSON.stringify(results, null, 2));
  try { await client.send('Browser.close'); } catch { /* already gone */ }
  proc.kill();
}

const pinFails = results.scrub.flatMap((r) => r.pins).filter((p) =>
  !(p.scrubbed && p.progressTracked && p.pinHeld && p.releaseBefore && p.releaseAfter));
const checkFails = results.scrub.flatMap((r) => r.checks).filter((c) => !c.pass);
const errCount = results.scrub.reduce((n, r) => n + r.errors.length, 0)
  + results.reduced.reduce((n, r) => n + r.errors.length, 0);
const rmFails = results.reduced.filter((r) => !r.pass);

console.log(`\n${'='.repeat(64)}`);
console.log(`pinned chapters proven scrubbed : ${results.scrub.flatMap(r=>r.pins).length - pinFails.length}/${results.scrub.flatMap(r=>r.pins).length}`);
console.log(`page-level checks               : ${results.scrub.flatMap(r=>r.checks).length - checkFails.length}/${results.scrub.flatMap(r=>r.checks).length}`);
console.log(`reduced-motion                  : ${results.reduced.length - rmFails.length}/${results.reduced.length}`);
console.log(`console errors                  : ${errCount}`);
process.exit(pinFails.length + checkFails.length + rmFails.length + errCount ? 1 : 0);
