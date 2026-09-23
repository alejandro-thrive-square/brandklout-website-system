#!/usr/bin/env node
/**
 * verify_selectors.mjs — do the scripts' selectors still match anything?
 *
 * The packager renames every class to a page-prefixed one and rewrites the
 * selector strings inside the chapter scripts to match. Where it MISSES one,
 * nothing throws: `querySelectorAll('.faq__q')` on a page whose buttons are
 * `.imp-faq__q` returns an empty list, `forEach` over it does nothing, and the
 * feature is silently dead. The style gate passes (the markup is styled
 * correctly), the copy gate passes (the words are all there), the link gate
 * passes — and the accordion does not open.
 *
 * This extracts every string-literal selector from the page's own scripts and
 * asks the browser how many elements each one matches. Zero is the finding.
 *
 *   node verify_selectors.mjs [page ...]
 *
 * Exit 1 if any selector matches nothing.
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const OUT = join(HERE, '.tmp', 'verify-staging');
mkdirSync(OUT, { recursive: true });
const STAGING = 'https://arvadadentalcenter.webflow.io';
const SLUG = {
  implants: 'dental-implants-ads-landing', aox: 'all-on-x-ads-landing',
  veneers: 'porcelain-veneers-ads-landing', emergency: 'emergency-dentist-ads-landing',
  'dentist-near-me': 'dentist-near-me-ads-landing', 'next-door': 'next-door-family-ads-landing',
};
const PAGES = process.argv.filter((a) => SLUG[a]).length
  ? process.argv.filter((a) => SLUG[a]) : Object.keys(SLUG);

/**
 * Pull selector literals out of the page's inline scripts and count matches.
 *
 * Only CLASS selectors are judged. Attribute selectors (`[data-quiz]`) and ids
 * survive the rename, and a tag selector matching nothing is usually a
 * legitimate optional hook — but a `.class` that matches nothing on a page
 * whose classes were all renamed is the signature of a missed rewrite.
 */
const SCAN = `(function(){
  var calls = /\\.(?:querySelectorAll|querySelector|closest|matches)\\(\\s*(['"])([^'"]+)\\1\\s*\\)/g;
  var seen = Object.create(null);
  document.querySelectorAll('script').forEach(function(s){
    var src = s.textContent || '';
    var m;
    while ((m = calls.exec(src))) {
      var sel = m[2];
      if (sel.indexOf('.') < 0) continue;              // ids/attrs survive renaming
      if (!seen[sel]) seen[sel] = 0;
    }
  });
  return Object.keys(seen).map(function(sel){
    var n = -1;
    try { n = document.querySelectorAll(sel).length; } catch (e) { n = -2; }
    return { sel: sel, n: n };
  });
})()`;

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => existsSync(p));
const DBG = 9200 + (process.pid % 700);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const proc = spawn(CHROME, [`--remote-debugging-port=${DBG}`,
  '--user-data-dir=' + join(HERE, '.tmp', '.chrome-sel'), '--no-first-run', '--no-default-browser-check',
  '--window-size=1440,900', '--window-position=-2400,0', 'about:blank'], { stdio: 'ignore' });
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

const results = [];
for (const page of PAGES) {
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  await send('Page.enable', {}, sessionId);
  await send('Network.enable', {}, sessionId);
  await send('Network.setBlockedURLs', { urls: ['*sienna-accessibility*', '*elfsight*', '*googletagmanager*'] }, sessionId);
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId);
  await send('Page.navigate', { url: `${STAGING}/${SLUG[page]}` }, sessionId);
  const ev = async (x) => (await send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true }, sessionId)).result?.value;
  for (let i = 0; i < 90; i++) { if (await ev(`document.readyState==='complete'`) === true) break; await wait(200); }
  await wait(1500);

  const all = await ev(SCAN);
  const dead = all.filter((x) => x.n === 0);
  results.push({ page, scanned: all.length, dead });
  console.log(`${page.padEnd(17)} selectors ${String(all.length).padStart(3)}  matching nothing ${dead.length}${dead.length ? '' : '  clean'}`);
  dead.forEach((d) => console.log(`    DEAD  ${d.sel}`));
  await send('Target.closeTarget', { targetId });
}

writeFileSync(join(OUT, 'verify-selectors.json'), JSON.stringify(results, null, 2));
const total = results.reduce((n, r) => n + r.dead.length, 0);
console.log(`\n${'='.repeat(64)}`);
console.log(`selectors scanned : ${results.reduce((n, r) => n + r.scanned, 0)}`);
console.log(`matching nothing  : ${total}`);
try { await send('Browser.close'); } catch {}
proc.kill();
process.exit(total ? 1 : 0);
