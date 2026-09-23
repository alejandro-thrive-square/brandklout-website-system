#!/usr/bin/env node
/**
 * verify_fidelity.mjs — does the packaged page still look like the design?
 *
 * Everything else in this folder proves the payload is well-formed, scoped and
 * alive. None of it proves the obvious thing: that tree-shaking journey.css
 * per block, renaming every class and re-scoping every selector did not
 * quietly drop a rule. A missing gradient or a lost max-width does not throw,
 * does not leak, and does not strand anything — it just makes the page wrong,
 * and the only way to catch it is to compare against the original.
 *
 * Both pages are opened at the same width. For each block, the two subtrees
 * are walked in parallel by child index — the packaged markup preserves
 * structure inside a block, so position is a reliable pairing — and the
 * computed styles that carry the design are compared.
 *
 * Colours, spacing and type are compared as rendered pixels, so a `clamp()`
 * that survived and a `clamp()` that got flattened to its floor both show up.
 *
 *   node verify_fidelity.mjs [page ...]
 */
import { spawn } from 'node:child_process';
import { readFileSync, existsSync, readdirSync, mkdirSync, writeFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { join, resolve, extname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const SECTIONS = join(HERE, '.tmp', 'sections');
const DESIGN = resolve(HERE, '../04-design/.tmp');
const OUT = join(HERE, '.tmp', 'verify-pages');
mkdirSync(OUT, { recursive: true });

const PAGES = process.argv.slice(2).length ? process.argv.slice(2)
  : readdirSync(SECTIONS).filter((d) => {
      try { return statSync(join(SECTIONS, d)).isDirectory() && existsSync(join(SECTIONS, d, 'page.html')); }
      catch { return false; } });

const PROPS = ['color', 'backgroundColor', 'backgroundImage', 'fontSize', 'fontFamily',
  'fontWeight', 'lineHeight', 'letterSpacing', 'textTransform', 'textAlign',
  'display', 'flexDirection', 'gridTemplateColumns', 'justifyContent', 'alignItems',
  'marginTop', 'marginBottom', 'paddingTop', 'paddingBottom', 'paddingLeft',
  'maxWidth', 'borderRadius', 'borderTopWidth', 'borderTopColor', 'opacity'];

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.json': 'application/json' };
let hostPage = '';
const server = createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  if (url === '/host') { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); return res.end(hostPage); }
  for (const [p, dir] of [['/gsap/', join(DESIGN, '_shared', 'vendor', 'gsap')],
                          ['/assets/', join(DESIGN, '_shared', 'assets')]]) {
    if (url.startsWith(p)) {
      const f = join(dir, url.slice(p.length));
      if (existsSync(f)) { res.writeHead(200, { 'Content-Type': MIME[extname(f)] || 'application/octet-stream' }); return res.end(readFileSync(f)); }
    }
  }
  res.writeHead(404); res.end();
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const PORT = server.address().port;

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => existsSync(p));
const DBG = 9200 + (process.pid % 700);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const proc = spawn(CHROME, [
  `--remote-debugging-port=${DBG}`, '--user-data-dir=' + join(HERE, '.tmp', '.chrome-fid'),
  '--no-first-run', '--no-default-browser-check', '--allow-file-access-from-files',
  '--disable-backgrounding-occluded-windows', '--disable-renderer-backgrounding',
  '--disable-background-timer-throttling',
  '--window-size=1440,900', '--window-position=-2400,0', 'about:blank'], { stdio: 'ignore' });

let wsUrl;
for (let i = 0; i < 60; i++) {
  try { const r = await fetch(`http://127.0.0.1:${DBG}/json/version`); if (r.ok) { wsUrl = (await r.json()).webSocketDebuggerUrl; break; } }
  catch { /* not up */ }
  await wait(400);
}
const ws = new WebSocket(wsUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let msgId = 0; const pend = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { const { res, rej } = pend.get(m.id); pend.delete(m.id); m.error ? rej(new Error(m.error.message)) : res(m.result); } };
const send = (me, p = {}, s) => { const i = ++msgId; ws.send(JSON.stringify({ id: i, method: me, params: p, sessionId: s })); return new Promise((res, rej) => pend.set(i, { res, rej })); };

/* Reduced motion on BOTH sides. The comparison is of the design, not of where
   two independent scroll animations happened to be at the same instant. */
async function open(url, width, inject) {
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  await send('Page.enable', {}, sessionId);
  await send('Emulation.setFocusEmulationEnabled', { enabled: true }, sessionId);
  await send('Page.bringToFront', {}, sessionId);
  await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId);
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] }, sessionId);
  await send('Page.navigate', { url }, sessionId);
  const ev = async (x) => {
    const r = await send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true }, sessionId);
    return r.exceptionDetails ? { __err: (r.exceptionDetails.exception?.description || '').split('\n')[0] } : r.result.value;
  };
  if (inject) {
    for (let i = 0; i < 80; i++) { if (await ev(`!!document.getElementById('slot')`)) break; await wait(150); }
    await ev(`(function(){document.getElementById('slot').innerHTML=${JSON.stringify(inject)};
      document.querySelectorAll('#slot script').forEach(function(o){var s=document.createElement('script');
        s.textContent=o.textContent;o.parentNode.replaceChild(s,o);});return 1})()`);
  }
  for (let i = 0; i < 60; i++) { if (await ev(`document.readyState==='complete'`)) break; await wait(200); }
  await ev(`document.fonts ? document.fonts.ready.then(()=>1) : 1`);
  await ev(`(async function(){var h=document.documentElement.scrollHeight;
    for(var y=0;y<h;y+=Math.round(innerHeight*.8)){window.scrollTo(0,y);
      await new Promise(function(r){setTimeout(r,60)})}window.scrollTo(0,0);return 1})()`);
  await wait(1400);
  return { ev, targetId };
}

/* Snapshot a block: walk it depth-first by child index and record the styles
   that carry the design, keyed by structural path so the two sides pair up. */
const SNAP = (rootSel, props) => `(function(){
  var root=document.querySelector(${JSON.stringify(rootSel)}); if(!root) return null;
  var out={}, PROPS=${JSON.stringify(props)};
  (function walk(el, path, depth){
    if(depth>7) return;
    var cs=getComputedStyle(el), o={};
    PROPS.forEach(function(p){o[p]=cs[p]});
    o._tag=el.tagName;
    out[path]=o;
    var kids=Array.prototype.filter.call(el.children, function(c){
      return c.tagName!=='STYLE' && c.tagName!=='SCRIPT'; });
    kids.forEach(function(c,i){ walk(c, path+'/'+i, depth+1); });
  })(root,'',0);
  return out;})()`;

const results = [];
for (const page of PAGES) {
  const manifest = JSON.parse(readFileSync(join(SECTIONS, page, 'manifest.json'), 'utf8'));
  const full = readFileSync(join(SECTIONS, page, 'page.html'), 'utf8');
  const body = full.slice(full.indexOf('<body>') + 6, full.lastIndexOf('</body>'))
    .replaceAll('src="', `src="http://127.0.0.1:${PORT}/assets/`)
    .replaceAll(`src="http://127.0.0.1:${PORT}/assets/http`, 'src="http');

  hostPage = `<!doctype html><html><head><meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <script>window.WZSR_CDN='http://127.0.0.1:${PORT}/gsap/';</script>
    <style>body{margin:0}</style></head><body><div id="slot"></div></body></html>`;

  const A = await open(pathToFileURL(join(DESIGN, page, 'index.html')).href + '?nosmooth=1', 1440, null);
  const B = await open(`http://127.0.0.1:${PORT}/host`, 1440, body);

  let compared = 0; const diffs = [];
  // The design's selectors, and the packaged page's equivalents.
  const pairs = manifest.map((m) => {
    const id = m.section;
    const design = id === 'nav' ? 'header#nav'
      : id === 'footer' ? 'footer.ftr'
      : id === 'actionbar' ? '.actionbar'
      : `section#${id}`;
    return { id, design, packaged: `.${m.rootClass}` };
  });

  for (const p of pairs) {
    const a = await A.ev(SNAP(p.design, PROPS));
    const b = await B.ev(SNAP(p.packaged, PROPS));
    if (!a || !b || a.__err || b.__err) { diffs.push({ block: p.id, missing: true }); continue; }
    for (const path of Object.keys(a)) {
      const ea = a[path], eb = b[path];
      if (!eb) { diffs.push({ block: p.id, path, missing: 'no counterpart', tag: ea._tag }); continue; }
      if (ea._tag !== eb._tag) { diffs.push({ block: p.id, path, tagMismatch: `${ea._tag} vs ${eb._tag}` }); continue; }
      compared++;
      for (const prop of PROPS) {
        if (ea[prop] === eb[prop]) continue;
        // Sub-pixel rounding is not a design change.
        const na = parseFloat(ea[prop]), nb = parseFloat(eb[prop]);
        if (Number.isFinite(na) && Number.isFinite(nb) && Math.abs(na - nb) < 1.0
            && /px$/.test(ea[prop] || '')) continue;
        diffs.push({ block: p.id, path, tag: ea._tag, prop, design: ea[prop], packaged: eb[prop] });
      }
    }
  }
  await send('Target.closeTarget', { targetId: A.targetId });
  await send('Target.closeTarget', { targetId: B.targetId });

  const byProp = {};
  diffs.forEach((d) => { if (d.prop) byProp[d.prop] = (byProp[d.prop] || 0) + 1; });
  results.push({ page, compared, diffs: diffs.length, byProp, sample: diffs.slice(0, 12) });
  console.log(`${page.padEnd(17)} elements ${String(compared).padStart(4)}  diffs ${String(diffs.length).padStart(4)}` +
    (diffs.length ? '  ' + Object.entries(byProp).sort((x, y) => y[1] - x[1]).slice(0, 5)
      .map(([k, v]) => `${k}:${v}`).join(' ') : '  clean'));
  diffs.slice(0, 6).forEach((d) => console.log(`    ${d.block}${d.path || ''} ${d.tag || ''} ` +
    (d.prop ? `${d.prop}: ${String(d.design).slice(0, 46)}  ->  ${String(d.packaged).slice(0, 46)}`
            : JSON.stringify(d).slice(0, 110))));
}

writeFileSync(join(OUT, 'verify-fidelity.json'), JSON.stringify(results, null, 2));
const total = results.reduce((n, r) => n + r.diffs, 0);
console.log(`\n${'='.repeat(64)}`);
console.log(`elements compared : ${results.reduce((n, r) => n + r.compared, 0)}`);
console.log(`style differences : ${total}`);
try { await send('Browser.close'); } catch { /* gone */ }
proc.kill(); server.close();
process.exit(total ? 1 : 0);
