#!/usr/bin/env node
/**
 * verify_text.mjs — is the published COPY the same as the design's?
 *
 * verify_staging.mjs compares computed styles and tag names. It never looks at
 * text. A paste that dropped a sentence, truncated a heading, mangled an
 * entity or reordered a list would sail through every width at 0 differences,
 * because every surviving element would still be styled correctly. On a set of
 * paid-traffic landing pages carrying prices, a phone number and clinical
 * claims, that is the gap worth closing.
 *
 * Compares per section, using the same pairing as verify_staging.mjs so a
 * mismatch is reported against a named block rather than the whole page.
 *
 *   node verify_text.mjs [page ...]
 *
 * Exit 1 if any section's text differs.
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
const SLUG = {
  implants: 'dental-implants-ads-landing',
  aox: 'all-on-x-ads-landing',
  veneers: 'porcelain-veneers-ads-landing',
  emergency: 'emergency-dentist-ads-landing',
  'dentist-near-me': 'dentist-near-me-ads-landing',
  'next-door': 'next-door-family-ads-landing',
};
const PAGES = process.argv.filter((a) => SLUG[a]).length
  ? process.argv.filter((a) => SLUG[a]) : Object.keys(SLUG);

/**
 * The block's copy as the SEQUENCE OF ITS TEXT NODES, not one flat string.
 *
 * textContent is unusable here: the design's HTML is indented, so it has
 * whitespace text nodes between elements, and the pasted markup is minified,
 * so it has none. Flattening gives "Arrival Checking hours" against
 * "ArrivalChecking hours" and reports all 63 blocks as mismatched when every
 * word is identical. Comparing the ordered list of non-empty text nodes
 * ignores formatting entirely while still catching a dropped sentence, a
 * truncated heading, a mangled entity or a reordered list.
 *
 * <style>/<script> are removed — they carry CSS and JS, not copy.
 */
const TEXT = (rootSel) => `(function(){
  var root=document.querySelector(${JSON.stringify(rootSel)}); if(!root) return null;
  var c=root.cloneNode(true);
  c.querySelectorAll('style,script').forEach(function(n){n.remove()});
  var out=[], w=document.createTreeWalker(c, NodeFilter.SHOW_TEXT, null);
  var n;
  while((n=w.nextNode())){
    var t=n.textContent.replace(/\\s+/g,' ').trim();
    if(t) out.push(t);
  }
  return out;
})()`;

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => existsSync(p));
const DBG = 9200 + (process.pid % 700);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const proc = spawn(CHROME, [`--remote-debugging-port=${DBG}`,
  '--user-data-dir=' + join(HERE, '.tmp', '.chrome-text'), '--no-first-run', '--no-default-browser-check',
  '--allow-file-access-from-files', '--window-size=1440,900', '--window-position=-2400,0',
  'about:blank'], { stdio: 'ignore' });
let wsUrl;
for (let i = 0; i < 60; i++) {
  try { const r = await fetch(`http://127.0.0.1:${DBG}/json/version`); if (r.ok) { wsUrl = (await r.json()).webSocketDebuggerUrl; break; } } catch {}
  await wait(400);
}
if (!wsUrl) { console.error('Chrome did not expose a debugging port'); process.exit(1); }
const ws = new WebSocket(wsUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let msgId = 0; const pend = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { const { res, rej } = pend.get(m.id); pend.delete(m.id); m.error ? rej(new Error(m.error.message)) : res(m.result); } };
const send = (me, p = {}, s) => { const i = ++msgId; ws.send(JSON.stringify({ id: i, method: me, params: p, sessionId: s })); return new Promise((res, rej) => pend.set(i, { res, rej })); };

async function open(url, noScript) {
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  await send('Page.enable', {}, sessionId);
  await send('Network.enable', {}, sessionId);
  // sienna rewrites font sizes, not text, but blocking keeps this run identical
  // to the style gate's environment.
  await send('Network.setBlockedURLs', { urls: ['*sienna-accessibility*', '*elfsight*', '*googletagmanager*'] }, sessionId);
  if (noScript) await send('Emulation.setScriptExecutionDisabled', { value: true }, sessionId);
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId);
  await send('Page.navigate', { url }, sessionId);
  const ev = async (x) => {
    const r = await send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true }, sessionId);
    return r.exceptionDetails ? { __err: (r.exceptionDetails.exception?.description || '').split('\n')[0] } : r.result.value;
  };
  for (let i = 0; i < 90; i++) { if (await ev(`document.readyState==='complete'`) === true) break; await wait(200); }
  await wait(900);
  return { ev, targetId };
}

const SEP = String.fromCharCode(1);

/** First differing text node, with the neighbours either side for context. */
function firstDiff(a, b) {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  const ctx = (arr) => arr.slice(Math.max(0, i - 1), i + 2).map((s) => s.slice(0, 70));
  return { at: i, design: ctx(a), staging: ctx(b) };
}

const results = [];
for (const page of PAGES) {
  const manifest = JSON.parse(readFileSync(join(SECTIONS, page, 'manifest.json'), 'utf8'));
  // Scripts disabled on BOTH sides: chapter scripts write copy at runtime (the
  // quiz readout, the year timeline), and comparing one page mid-animation
  // against another is not a copy comparison.
  const A = await open(pathToFileURL(join(DESIGN, page, 'index.html')).href + '?nosmooth=1', true);
  const B = await open(`${STAGING}/${SLUG[page]}`, true);

  const bad = [];
  /**
   * Counts for EVERY block, not just mismatched ones. A comparison of two
   * empty arrays is equal, so an extractor that silently returned nothing
   * would report every page clean — the most dangerous way for a gate to
   * fail. Any block that yields no text on both sides is reported as empty
   * rather than counted as agreement.
   */
  const counts = [];
  for (const m of manifest) {
    const id = m.section;
    const designSel = id === 'nav' ? 'header#nav' : id === 'footer' ? 'footer.ftr'
      : id === 'actionbar' ? '.actionbar' : `section#${id}`;
    const a = await A.ev(TEXT(designSel));
    const b = await B.ev(TEXT(`.${m.rootClass}`));
    if (a == null || a.__err) { bad.push({ block: id, missing: `design ${designSel}` }); continue; }
    if (b == null || b.__err) { bad.push({ block: id, missing: `staging .${m.rootClass}` }); continue; }
    // Join on a control character, never a printable one: joining on "" or a
    // digit lets two different node splits alias to the same string.
    counts.push({ block: id, design: a.length, staging: b.length });
    if (!a.length && !b.length) { bad.push({ block: id, empty: 'no text extracted on either side' }); continue; }
    if (a.join(SEP) !== b.join(SEP)) {
      bad.push({ block: id, designLen: a.length, stagingLen: b.length, ...firstDiff(a, b) });
    }
  }
  await send('Target.closeTarget', { targetId: A.targetId });
  await send('Target.closeTarget', { targetId: B.targetId });

  results.push({ page, blocks: manifest.length, mismatches: bad.length, detail: bad, counts });
  console.log(`${page.padEnd(17)} blocks ${String(manifest.length).padStart(2)}  text mismatches ${bad.length}${bad.length ? '' : '  clean'}`);
  for (const d of bad.slice(0, 4)) {
    if (d.missing) { console.log(`    ${d.block}: ${d.missing}`); continue; }
    console.log(`    ${d.block}: lengths ${d.designLen} vs ${d.stagingLen}, first differ at ${d.at}`);
    console.log(`      design : …${d.design}…`);
    console.log(`      staging: …${d.staging}…`);
  }
}

writeFileSync(join(OUT, 'verify-text.json'), JSON.stringify(results, null, 2));
const total = results.reduce((n, r) => n + r.mismatches, 0);
console.log(`\n${'='.repeat(64)}\nblocks compared : ${results.reduce((n, r) => n + r.blocks, 0)}`);
console.log(`text mismatches : ${total}`);
const nodes = results.reduce((n, r) => n + r.counts.reduce((m, c) => m + c.design, 0), 0);
const emptyBlocks = results.flatMap((r) => r.counts.filter((c) => !c.design && !c.staging).map((c) => r.page + "/" + c.block));
console.log(`text nodes read : ${nodes} on the design side`);
console.log(`empty blocks    : ${emptyBlocks.length}${emptyBlocks.length ? " -> " + emptyBlocks.join(", ") : " (every block yielded copy, so \"clean\" means compared-and-equal)"}`);
try { await send('Browser.close'); } catch {}
proc.kill();
process.exit(total ? 1 : 0);
