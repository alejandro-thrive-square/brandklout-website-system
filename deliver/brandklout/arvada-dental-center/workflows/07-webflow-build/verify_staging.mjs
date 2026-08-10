#!/usr/bin/env node
/**
 * verify_staging.mjs — does the PUBLISHED Webflow page still look like the
 * local design?
 *
 * verify_fidelity.mjs compares the design against the packaged payload on
 * disk. That proves the packager is faithful; it says nothing about what
 * survived the trip through the Designer's clipboard, Webflow's own class
 * reconciliation, and the published stylesheet. This is the same comparison
 * with side B replaced by the live staging URL, so it is the only gate that
 * can see paste-time and publish-time drift.
 *
 * Both sides run under prefers-reduced-motion, so the comparison is of the
 * design and not of where two independent scroll animations happened to be at
 * the same instant.
 *
 *   node verify_staging.mjs [page ...] [--width 1440]
 *
 * Writes .tmp/verify-staging/verify-staging.json. Exit 1 if anything differs.
 */
import { spawn } from 'node:child_process';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';


const HERE = fileURLToPath(new URL('.', import.meta.url));
const SECTIONS = join(HERE, '.tmp', 'sections');
const DESIGN = resolve(HERE, '../04-design/.tmp');
const OUT = join(HERE, '.tmp', 'verify-staging');
mkdirSync(OUT, { recursive: true });

const STAGING = 'https://arvadadentalcenter.webflow.io';
/** local design dir -> published slug */
const SLUG = {
  implants: 'dental-implants-ads-landing',
  aox: 'all-on-x-ads-landing',
  veneers: 'porcelain-veneers-ads-landing',
  emergency: 'emergency-dentist-ads-landing',
  'dentist-near-me': 'dentist-near-me-ads-landing',
  'next-door': 'next-door-family-ads-landing',
};

const argv = process.argv.slice(2);
const wi = argv.indexOf('--width');
const WIDTH = wi >= 0 ? Number(argv[wi + 1]) : 1440;
const PAGES = argv.filter((a) => !a.startsWith('--') && SLUG[a]).length
  ? argv.filter((a) => SLUG[a]) : Object.keys(SLUG);

const PROPS = ['color', 'backgroundColor', 'backgroundImage', 'fontSize', 'fontFamily',
  'fontWeight', 'lineHeight', 'letterSpacing', 'textTransform', 'textAlign',
  'display', 'flexDirection', 'gridTemplateColumns', 'justifyContent', 'alignItems',
  'marginTop', 'marginBottom', 'paddingTop', 'paddingBottom', 'paddingLeft',
  'maxWidth', 'borderRadius', 'borderTopWidth', 'borderTopColor', 'opacity'];

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => existsSync(p));
// Never a fixed port: a previous run's Chrome that has not fully exited keeps it.
const DBG = 9200 + (process.pid % 700);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const proc = spawn(CHROME, [
  `--remote-debugging-port=${DBG}`, '--user-data-dir=' + join(HERE, '.tmp', '.chrome-stg'),
  '--no-first-run', '--no-default-browser-check', '--allow-file-access-from-files',
  '--disable-backgrounding-occluded-windows', '--disable-renderer-backgrounding',
  '--disable-background-timer-throttling',
  `--window-size=${WIDTH},900`, '--window-position=-2400,0', 'about:blank'], { stdio: 'ignore' });

let wsUrl;
for (let i = 0; i < 60; i++) {
  try { const r = await fetch(`http://127.0.0.1:${DBG}/json/version`); if (r.ok) { wsUrl = (await r.json()).webSocketDebuggerUrl; break; } }
  catch { /* not up yet */ }
  await wait(400);
}
if (!wsUrl) { console.error('Chrome did not expose a debugging port'); process.exit(1); }

const ws = new WebSocket(wsUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let msgId = 0; const pend = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { const { res, rej } = pend.get(m.id); pend.delete(m.id); m.error ? rej(new Error(m.error.message)) : res(m.result); } };
const send = (me, p = {}, s) => { const i = ++msgId; ws.send(JSON.stringify({ id: i, method: me, params: p, sessionId: s })); return new Promise((res, rej) => pend.set(i, { res, rej })); };

/**
 * The site's own sienna-accessibility widget rewrites every text element's
 * font-size to a rounded integer px inline, which flattens this design's fluid
 * type scale. --block-3p isolates that: run both ways to separate "the paste
 * lost something" from "a site-wide third-party script is reshaping the page".
 */
const BLOCK_3P = process.argv.includes('--block-3p');
const THIRD_PARTY = ['*sienna-accessibility*', '*elfsight*', '*googletagmanager*'];

/**
 * --reset injects the candidate scoped reset into staging at head position, so
 * its effect can be measured BEFORE it is written to the live pages.
 */
const WITH_RESET = process.argv.includes('--reset');
const candidateCss = (page) => {
  if (!WITH_RESET) return null;
  const f = join(OUT, '..', 'page-code', `${page}.css`);
  if (!existsSync(f)) throw new Error(`no generated page code for ${page} — run build_page_code.mjs`);
  return readFileSync(f, 'utf8');
};

async function open(url, block, css) {
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  await send('Page.enable', {}, sessionId);
  await send('Runtime.enable', {}, sessionId);
  if (block && block.length) {
    await send('Network.enable', {}, sessionId);
    await send('Network.setBlockedURLs', { urls: block }, sessionId);
  }
  await send('Emulation.setFocusEmulationEnabled', { enabled: true }, sessionId);
  await send('Page.bringToFront', {}, sessionId);
  await send('Emulation.setDeviceMetricsOverride', { width: WIDTH, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId);
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] }, sessionId);
  const errors = [];
  ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    if (m.sessionId !== sessionId) return;
    if (m.method === 'Runtime.exceptionThrown') errors.push((m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text || '').split('\n')[0]);
  });
  await send('Page.navigate', { url }, sessionId);
  const ev = async (x) => {
    const r = await send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true }, sessionId);
    return r.exceptionDetails ? { __err: (r.exceptionDetails.exception?.description || '').split('\n')[0] } : r.result.value;
  };
  // Page.navigate resolves on COMMIT, not on parse — poll readyState, never sleep.
  for (let i = 0; i < 90; i++) { if (await ev(`document.readyState==='complete'`) === true) break; await wait(200); }
  // Candidate head code, placed where Webflow puts it: in <head>, after the
  // site stylesheet, but BEFORE the per-section <style> blocks in <body>. A
  // sheet appended to the end of <body> would outrank chapter CSS at equal
  // specificity and flatter itself.
  if (css) {
    await ev(`(function(){var s=document.createElement('style');
      s.setAttribute('data-wz-candidate','1');s.textContent=${JSON.stringify(css)};
      document.head.appendChild(s);return 1})()`);
  }
  await ev(`document.fonts ? document.fonts.ready.then(()=>1) : 1`);
  // Scroll the whole page so every IntersectionObserver reveal has fired; an
  // element that was never scrolled to is not a defect.
  await ev(`(async function(){var h=document.documentElement.scrollHeight;
    for(var y=0;y<h;y+=Math.round(innerHeight*.8)){window.scrollTo(0,y);
      await new Promise(function(r){setTimeout(r,60)})}window.scrollTo(0,0);return 1})()`);
  await wait(1600);
  return { ev, targetId, errors };
}

/**
 * Walk a block and record the styles that carry the design, keyed by
 * structural path so the two sides pair up by position.
 *
 * `div.w-embed` is TRANSPARENT here. Webflow wraps every pasted HtmlEmbed in
 * one, and this build uses embeds for three things: the per-section <style>,
 * the per-section <script>, and — for most of them — real rendered content
 * (inline SVG icons, the quiz buttons). Counting the wrapper as a node shifts
 * every following sibling by one, which turns the whole comparison into
 * tag-mismatch noise: the first run paired 30 elements and reported 490
 * "differences", none of them real. Style/script-only embeds are dropped;
 * content-bearing ones are spliced through so the child lines up with the bare
 * element the design has in that position. Whether the wrapper itself distorts
 * layout is a separate question, answered by WRAPPERS below.
 */
const SNAP = (rootSel, props) => `(function(){
  var root=document.querySelector(${JSON.stringify(rootSel)}); if(!root) return null;
  var out={}, PROPS=${JSON.stringify(props)};
  function invisible(c){
    return c.tagName==='STYLE' || c.tagName==='SCRIPT';
  }
  function isBrLine(c){
    return c.classList && Array.prototype.some.call(c.classList, function(n){
      return /(^|-)br-line$/.test(n); });
  }
  function kidsOf(el){
    var out=[];
    Array.prototype.forEach.call(el.children, function(c){
      if(invisible(c)) return;
      if(c.classList && c.classList.contains('w-embed')){
        var inner=Array.prototype.filter.call(c.children, function(g){ return !invisible(g); });
        if(!inner.length) return;              // style/script-only carrier
        out.push.apply(out, kidsOf(c));        // splice real content through
        return;
      }
      out.push(c);
      /* The converter renders the design's <br> as a display:block span that
         WRAPS the rest of the line (html_to_webflow.py _add_line_span), so
         A<br><span>B</span> becomes A<span class=br-line><span>B</span></span>.
         The line break is real — .<pfx>-br-line{display:block} is in the site
         stylesheet — but the span that followed the <br> in the design is now
         a CHILD rather than a sibling. Lift its children back up so the two
         sides line up; otherwise every element after a <br> reports as missing
         (15 rows on implants alone) for a page that renders correctly. */
      if(isBrLine(c)) out.push.apply(out, kidsOf(c));
    });
    return out;
  }
  (function walk(el, path, depth){
    if(depth>7) return;
    var cs=getComputedStyle(el), o={};
    PROPS.forEach(function(p){o[p]=cs[p]});
    o._tag=el.tagName;
    o._cls=String(el.className&&el.className.baseVal!==undefined?el.className.baseVal:(el.className||''));
    out[path]=o;
    kidsOf(el).forEach(function(c,i){ walk(c, path+'/'+i, depth+1); });
  })(root,'',0);
  return out;})()`;

/**
 * Does any content-bearing w-embed wrapper actually change layout? A wrapper
 * that is display:contents, or whose box matches its child's box exactly, is
 * inert. One that adds padding, a different display, or a different width is
 * a real defect the paired walk above deliberately looks past.
 */
const WRAPPERS = (rootSel) => `(function(){
  var root=document.querySelector(${JSON.stringify(rootSel)}); if(!root) return [];
  var bad=[];
  root.querySelectorAll('.w-embed').forEach(function(w){
    var kids=Array.prototype.filter.call(w.children,function(c){
      return c.tagName!=='STYLE' && c.tagName!=='SCRIPT'; });
    if(kids.length!==1) return;
    var cs=getComputedStyle(w);
    // display:contents is the FIX, not a defect: the wrapper is out of the
    // layout tree and its own rect is meaningless (zero-sized), so comparing
    // it against the child would report every repaired wrapper as broken.
    if(cs.display==='contents') return;
    var a=w.getBoundingClientRect(), b=kids[0].getBoundingClientRect();
    var pad=[cs.paddingTop,cs.paddingRight,cs.paddingBottom,cs.paddingLeft].filter(function(p){
      return parseFloat(p)>0.5; });
    var dw=Math.abs(a.width-b.width), dh=Math.abs(a.height-b.height);
    if(pad.length || dw>1 || dh>1){
      bad.push({tag:kids[0].tagName, cls:(kids[0].className||'').toString().slice(0,40),
        display:cs.display, padding:cs.padding, dw:Math.round(dw), dh:Math.round(dh)});
    }
  });
  return bad;})()`;

const results = [];
for (const page of PAGES) {
  const manifest = JSON.parse(readFileSync(join(SECTIONS, page, 'manifest.json'), 'utf8'));
  const A = await open(pathToFileURL(join(DESIGN, page, 'index.html')).href + '?nosmooth=1', null, null);
  const B = await open(`${STAGING}/${SLUG[page]}`, BLOCK_3P ? THIRD_PARTY : null, candidateCss(page));

  let compared = 0; const diffs = []; const wrappers = [];
  const pairs = manifest.map((m) => {
    const id = m.section;
    const design = id === 'nav' ? 'header#nav'
      : id === 'footer' ? 'footer.ftr'
      : id === 'actionbar' ? '.actionbar'
      : `section#${id}`;
    return { id, design, staging: `.${m.rootClass}` };
  });

  for (const p of pairs) {
    const a = await A.ev(SNAP(p.design, PROPS));
    const b = await B.ev(SNAP(p.staging, PROPS));
    if (!a || a.__err) { diffs.push({ block: p.id, missing: `design ${p.design}` }); continue; }
    if (!b || b.__err) { diffs.push({ block: p.id, missing: `staging ${p.staging}` }); continue; }
    const w = await B.ev(WRAPPERS(p.staging));
    if (Array.isArray(w) && w.length) {
      wrappers.push({ block: p.id, offenders: w });
      // A wrapper that is a few px taller than its icon is inline box metrics
      // inside a grid cell — benign, and the paired style comparison stays
      // clean. A wrapper materially wider or taller than its child has BROKEN
      // the line: next-door's offer price wrapped <sup>$</sup> in a block div
      // inside a span, putting the dollar sign on its own line above the 109
      // at the 5.2rem price size, and the style diff could not see it because
      // the walk splices w-embed through. That must fail the gate.
      // WIDTH is the discriminator, not height. A wrapper wider than its child
      // is taking horizontal space the design does not have, which is what
      // "broke the line" looks like — the offer-price wrapper measured dw 528.
      // Height alone does not mean displacement: an inline-block wrapper's line
      // box is sized by the PARENT's font metrics, so the repaired offer-price
      // wrapper is legitimately ~32px taller than the 51px sup while the
      // rendered geometry matches the design exactly (verified in supfix.mjs).
      // Heights stay in the report as a warning; only width fails the gate.
      for (const o of w) {
        if (o.dw > 8) {
          diffs.push({ block: p.id, wrapperBreaksLayout: `${o.tag} ${o.cls}`.trim(), dw: o.dw, dh: o.dh });
        }
      }
    }
    for (const path of Object.keys(a)) {
      const ea = a[path], eb = b[path];
      if (!eb) { diffs.push({ block: p.id, path, missing: 'no counterpart', tag: ea._tag }); continue; }
      // The converter deliberately rewrites the design's <br> as a
      // <span class="<prefix>-br-line"> so the line break can be styled and
      // suppressed per breakpoint. Documented transform, not drift.
      const brLine = ea._tag === 'BR' && eb._tag === 'SPAN' && /-br-line\b/.test(eb._cls || '');
      if (ea._tag !== eb._tag && !brLine) { diffs.push({ block: p.id, path, tagMismatch: `${ea._tag} vs ${eb._tag}` }); continue; }
      if (brLine) continue;
      compared++;
      // An element that renders nothing on BOTH sides cannot look different.
      // The last 8 differences were all `<input type="hidden">`: the client's
      // stylesheet gives it a font-family the bare design page does not, on an
      // element with a 0x0 box and display:none. `display` is itself compared
      // below, so an element hidden on only ONE side still fails here.
      if (ea.display === 'none' && eb.display === 'none') continue;
      for (const prop of PROPS) {
        if (ea[prop] === eb[prop]) continue;
        const na = parseFloat(ea[prop]), nb = parseFloat(eb[prop]);
        // Ignore genuine sub-pixel rounding, but NOT a small absolute gap on a
        // small value: 10.945px -> 10px is 8.6% of the type size, and a flat
        // "< 1px is rounding" rule hid exactly that across 59 elements.
        if (Number.isFinite(na) && Number.isFinite(nb) && /px$/.test(ea[prop] || '')) {
          const d = Math.abs(na - nb);
          if (d < 0.5 || (d < 1 && d / Math.max(Math.abs(na), Math.abs(nb), 1) < 0.02)) continue;
        }
        // The design loads assets from ../_shared/assets, staging from the CDN.
        // Compare only whether an image is present, not where it came from.
        if (prop === 'backgroundImage'
            && /^url\(/.test(ea[prop] || '') && /^url\(/.test(eb[prop] || '')) continue;
        diffs.push({ block: p.id, path, tag: ea._tag, prop, design: ea[prop], staging: eb[prop] });
      }
    }
  }
  await send('Target.closeTarget', { targetId: A.targetId });
  await send('Target.closeTarget', { targetId: B.targetId });

  const byProp = {};
  diffs.forEach((d) => { if (d.prop) byProp[d.prop] = (byProp[d.prop] || 0) + 1; });
  results.push({ page, slug: SLUG[page], width: WIDTH, compared, diffs: diffs.length, byProp, wrappers,
    stagingErrors: [...new Set(B.errors)].slice(0, 10), designErrors: [...new Set(A.errors)].slice(0, 10),
    sample: diffs });
  console.log(`${page.padEnd(17)} elements ${String(compared).padStart(4)}  diffs ${String(diffs.length).padStart(4)}` +
    (diffs.length ? '  ' + Object.entries(byProp).sort((x, y) => y[1] - x[1]).slice(0, 5)
      .map(([k, v]) => `${k}:${v}`).join(' ') : '  clean'));
  diffs.slice(0, 8).forEach((d) => console.log(`    ${d.block}${d.path || ''} ${d.tag || ''} ` +
    (d.prop ? `${d.prop}: ${String(d.design).slice(0, 44)}  ->  ${String(d.staging).slice(0, 44)}`
            : JSON.stringify(d).slice(0, 110))));
  if (B.errors.length) console.log(`    !! ${[...new Set(B.errors)].length} JS error(s) on staging: ${[...new Set(B.errors)][0]}`);
  if (wrappers.length) {
    const n = wrappers.reduce((s, w) => s + w.offenders.length, 0);
    console.log(`    !! ${n} w-embed wrapper(s) changing layout: ` +
      wrappers[0].block + ' ' + JSON.stringify(wrappers[0].offenders[0]));
  }
}

writeFileSync(join(OUT, `verify-staging-${WIDTH}${BLOCK_3P ? '-no3p' : ''}.json`), JSON.stringify(results, null, 2));
const total = results.reduce((n, r) => n + r.diffs, 0);
console.log(`\n${'='.repeat(64)}`);
console.log(`width             : ${WIDTH}`);
console.log(`elements compared : ${results.reduce((n, r) => n + r.compared, 0)}`);
console.log(`style differences : ${total}`);
try { await send('Browser.close'); } catch { /* already gone */ }
proc.kill();
process.exit(total ? 1 : 0);
