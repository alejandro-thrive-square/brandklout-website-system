#!/usr/bin/env node
/**
 * inline_styles.mjs — recover the inline styles Webflow dropped on paste.
 *
 * The design pages carry 8-10 `style="..."` attributes each: the footer
 * paragraphs' .9rem, the eyebrow's --cyan-ink, the hero image's
 * object-position, `margin:0` on figures. Webflow's paste keeps only ONE style
 * attribute on the whole page, so every one of those overrides is lost — which
 * is 52 of the residual footer rows and the whole rgb(5,107,128) -> #03c5ec
 * colour family.
 *
 * They cannot be restored as inline styles through the API, so each becomes a
 * CSS rule in the page's head code. Two things make that faithful:
 *
 *  - SELECTOR. Computed in the DESIGN's own DOM: the element's id if it has
 *    one, else its full class stack, else the nearest classed ancestor plus
 *    tag plus :nth-of-type. Then mapped into the published page's namespace.
 *    Every selector is CHECKED against the published DOM before it is emitted:
 *    if it does not match exactly the same number of elements there as in the
 *    design, it is reported and dropped rather than guessed at.
 *
 *  - WEIGHT. An inline style outranks every author rule, so a plain class rule
 *    in <head> would lose to the chapter CSS in <body> that the inline style
 *    was written to override. The selector is repeated three times
 *    (`.x.x.x`, the house pattern) to raise specificity without !important,
 *    so a genuine !important elsewhere still wins.
 *
 *   node inline_styles.mjs            # report + write inline-styles.json
 */
import { spawn } from 'node:child_process';
import { writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const DESIGN = resolve(HERE, '../../04-design/.tmp');
const STAGING = 'https://arvadadentalcenter.webflow.io';
const PAGES = {
  implants: { slug: 'dental-implants-ads-landing', prefix: 'imp' },
  aox: { slug: 'all-on-x-ads-landing', prefix: 'aox' },
  veneers: { slug: 'porcelain-veneers-ads-landing', prefix: 'vnr' },
  emergency: { slug: 'emergency-dentist-ads-landing', prefix: 'emg' },
  'dentist-near-me': { slug: 'dentist-near-me-ads-landing', prefix: 'dnm' },
  'next-door': { slug: 'next-door-family-ads-landing', prefix: 'nxd' },
};

/**
 * Runs in the page: every element with a style attribute, plus a selector that
 * matches it and NOTHING THAT DOES NOT SHARE ITS STYLE.
 *
 * The cheap selector (id, else class stack) is tried first, but it is only
 * accepted if every element it matches carries the identical style attribute.
 * Without that test `.tel` looks fine — the same 14 elements exist on both
 * sides — while only ONE of the 14 actually carried
 * `color:var(--amber);font-weight:700`, so restoring it repaints all 14 and
 * makes the page worse. Measured: emergency went 17 -> 34 differences before
 * this check existed. When the cheap selector over-matches, fall back to a
 * positional path anchored on the parent.
 */
const COLLECT = `(function(){
  function cheap(el){
    if(el.id) return '#'+CSS.escape(el.id);
    var cls=(el.getAttribute('class')||'').trim().split(/\\s+/).filter(Boolean);
    if(cls.length) return '.'+cls.map(function(c){return CSS.escape(c)}).join('.');
    return null;
  }
  /* A compound selector must lead with the TAG: 'p.eyebrow:nth-of-type(1)'.
     Appending the class stack to the tag the other way round yields
     '.eyebrowp:nth-of-type(1)', which parses as a class named "eyebrowp" and
     silently matches nothing. */
  function nth(el){
    var n=1, sib=el;
    while((sib=sib.previousElementSibling)) if(sib.tagName===el.tagName) n++;
    var cls=(el.getAttribute('class')||'').trim().split(/\\s+/).filter(Boolean);
    return el.tagName.toLowerCase()
      + cls.map(function(c){return '.'+CSS.escape(c)}).join('')
      + ':nth-of-type('+n+')';
  }
  function pure(sel, el){
    if(!sel) return false;
    var m;
    try { m=document.querySelectorAll(sel); } catch(e){ return false; }
    if(!m.length) return false;
    var want=el.getAttribute('style');
    return [].every.call(m, function(x){ return x.getAttribute('style')===want; });
  }
  function path(el, depth){
    if(!el || el===document.body || depth>6) return null;
    var c=cheap(el);
    if(c && pure(c, el)) return c;
    var parent=el.parentElement;
    var ps=parent ? (cheap(parent) || path(parent, depth+1)) : null;
    var self=nth(el);
    return ps ? ps+' > '+self : self;
  }
  return [].map.call(document.querySelectorAll('[style]'), function(el){
    var c=cheap(el), s;
    if(c && pure(c, el)) s=c; else s=path(el,0);
    var count=0, ok=false;
    try { var m=document.querySelectorAll(s); count=m.length;
      ok=m.length>0 && [].every.call(m,function(x){return x.getAttribute('style')===el.getAttribute('style')});
    } catch(e){}
    return { style: el.getAttribute('style'), selector: s, tag: el.tagName.toLowerCase(),
      count: count, exact: ok };
  });
})()`;

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => existsSync(p));
const DBG = 9200 + (process.pid % 700);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const proc = spawn(CHROME, [`--remote-debugging-port=${DBG}`,
  '--user-data-dir=' + join(HERE, '.chrome-inline'), '--no-first-run', '--no-default-browser-check',
  '--allow-file-access-from-files', '--window-size=1440,900', '--window-position=-2400,0',
  'about:blank'], { stdio: 'ignore' });
let wsUrl;
for (let i = 0; i < 60; i++) {
  try { const r = await fetch(`http://127.0.0.1:${DBG}/json/version`); if (r.ok) { wsUrl = (await r.json()).webSocketDebuggerUrl; break; } } catch {}
  await wait(400);
}
const ws = new WebSocket(wsUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let id = 0; const pend = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { const { res, rej } = pend.get(m.id); pend.delete(m.id); m.error ? rej(new Error(m.error.message)) : res(m.result); } };
const send = (me, p = {}, s) => { const i = ++id; ws.send(JSON.stringify({ id: i, method: me, params: p, sessionId: s })); return new Promise((res, rej) => pend.set(i, { res, rej })); };

/**
 * noScript is essential on the DESIGN side. GSAP writes inline styles onto
 * .wz-line, .wz-mask-line-mask and every .pin-spacer at runtime, and those are
 * choreography state, not authored overrides — collecting them yields 20+
 * phantom "lost inline styles" per page that do not exist in the source at
 * all. With scripts disabled the DOM is the authored HTML.
 */
async function evalOn(url, expr, noScript) {
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  await send('Page.enable', {}, sessionId);
  if (noScript) await send('Emulation.setScriptExecutionDisabled', { value: true }, sessionId);
  await send('Page.navigate', { url }, sessionId);
  const ev = async (x) => (await send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true }, sessionId)).result?.value;
  for (let i = 0; i < 90; i++) { if (await ev(`document.readyState==='complete'`) === true) break; await wait(200); }
  await wait(900);
  const out = await ev(expr);
  await send('Target.closeTarget', { targetId });
  return out;
}

const result = {};
for (const [page, { slug, prefix }] of Object.entries(PAGES)) {
  const found = await evalOn(pathToFileURL(join(DESIGN, page, 'index.html')).href + '?nosmooth=1', COLLECT, true);
  // Map design selectors into the published namespace.
  const mapped = found.map((f) => ({
    ...f,
    mapped: f.selector && f.selector
      .replace(/\.([A-Za-z_][\w-]*)/g, `.${prefix}-$1`)
      .replace(/#([A-Za-z_][\w-]*)/g, `#${prefix}-$1`),
  }));
  const counts = await evalOn(`${STAGING}/${slug}`,
    `(function(){var S=${JSON.stringify(mapped.map((m) => m.mapped))};
      return S.map(function(s){ try { return s?document.querySelectorAll(s).length:-1 } catch(e){ return -2 } });})()`);

  const keep = [], drop = [];
  mapped.forEach((m, i) => {
    const n = counts[i];
    // Two independent conditions, both required:
    //  exact — in the DESIGN the selector matches only elements sharing this
    //          style, so restoring it cannot repaint an unstyled sibling;
    //  n===count — the published page agrees on how many elements that is, so
    //          the rule lands on the same set it was measured against.
    if (m.mapped && m.exact && n === m.count && n > 0) keep.push({ ...m, stagingCount: n });
    else drop.push({ ...m, stagingCount: n });
  });
  result[page] = { prefix, keep, drop };
  console.log(`${page.padEnd(17)} design ${String(found.length).padStart(2)}  restorable ${String(keep.length).padStart(2)}  unmatched ${drop.length}`);
  for (const d of drop) console.log(`    DROP  ${String(d.selector).slice(0, 52).padEnd(54)} design ${d.count} vs staging ${d.stagingCount}`);
}
writeFileSync(join(HERE, 'inline-styles.json'), JSON.stringify(result, null, 1));
console.log(`\nwrote inline-styles.json`);
try { await send('Browser.close'); } catch {}
proc.kill();
