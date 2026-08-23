#!/usr/bin/env node
/**
 * verify_pages.mjs — the gate for the whole-page payloads.
 *
 * verify_sections.mjs proves each block survives on its own. This proves the
 * thing that actually ships: the whole page, in one paste, on a page that is
 * already carrying somebody else's CSS.
 *
 * The host is deliberately hostile — its own reset, its own :root, and loud
 * definitions for the class names the design uses — with probe elements above
 * and below whose computed styles are recorded before the page is injected and
 * compared after. Webflow merges classes by NAME site-wide, so this is what a
 * real collision looks like, not a theoretical one.
 *
 * Then the page has to work: every block armed, GSAP fetched exactly once for
 * the whole page rather than once per block, the chrome devices live, nothing
 * left stranded invisible, and no horizontal overflow at any of six widths.
 *
 *   node verify_pages.mjs [page ...]
 */
import { spawn } from 'node:child_process';
import { readFileSync, existsSync, readdirSync, mkdirSync, writeFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { join, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const SECTIONS = join(HERE, '.tmp', 'sections');
const DESIGN = resolve(HERE, '../04-design/.tmp');
const OUT = join(HERE, '.tmp', 'verify-pages');
mkdirSync(join(OUT, 'shots'), { recursive: true });

const PAGES = process.argv.slice(2).length ? process.argv.slice(2)
  : readdirSync(SECTIONS).filter((d) => {
      try { return statSync(join(SECTIONS, d)).isDirectory() && existsSync(join(SECTIONS, d, 'page.html')); }
      catch { return false; }
    });

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json' };
let hostPage = '';
const server = createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  if (url === '/host') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(hostPage);
  }
  const roots = { '/gsap/': join(DESIGN, '_shared', 'vendor', 'gsap'),
                  '/assets/': join(DESIGN, '_shared', 'assets') };
  for (const [p, dir] of Object.entries(roots)) {
    if (url.startsWith(p)) {
      const f = join(dir, url.slice(p.length));
      if (existsSync(f)) {
        res.writeHead(200, { 'Content-Type': MIME[extname(f)] || 'application/octet-stream' });
        return res.end(readFileSync(f));
      }
    }
  }
  res.writeHead(404); res.end('nope');
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const PORT = server.address().port;

const HOST = () => `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<script>window.WZSR_CDN='http://127.0.0.1:${PORT}/gsap/';</script>
<style>
  *{box-sizing:content-box}
  :root{--bg:#ffe;--fg:#900;--accent:#0f0;--gutter:4px;--maxw:400px;--radius:0;
        --f-display:cursive;--f-ui:cursive;--f-body:cursive;--body:9px;--h2:11px;--d1:13px}
  html{font-size:11px}
  body{margin:0;background:#ffffe0;color:#900;font-family:cursive}
  section,header,footer{border:6px dashed #f0f!important}
  .wrap{max-width:200px!important;padding:40px!important;background:#f0f}
  .btn{background:#0f0;color:#f0f;padding:1px;font-size:8px}
  .h2,.lede,.big{color:#0f0;font-size:8px;font-family:cursive}
  .chapter-tag{display:block;color:#f0f;font-size:7px}
  .nav,.ftr,.actionbar{position:static!important;background:#0ff!important}
  .host-probe{font-size:20px;color:rgb(0,128,0);padding:12px;background:rgb(240,240,240);
    font-family:Georgia,serif;max-width:300px;border:2px solid rgb(0,0,255)}
</style></head><body>
<div class="host-probe" id="probeTop">
  <span class="h2">host h2</span> <span class="lede">host lede</span>
  <a class="btn" href="#x">host btn</a><div class="wrap">host wrap</div>
  <div class="chapter-tag">host tag</div><div class="nav">host nav</div>
</div>
<div id="slot"></div>
<div class="host-probe" id="probeBottom">bottom</div>
</body></html>`;

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => existsSync(p));
const DBG = 9200 + (process.pid % 700);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const proc = spawn(CHROME, [
  `--remote-debugging-port=${DBG}`, '--user-data-dir=' + join(HERE, '.tmp', '.chrome-vpages'),
  '--no-first-run', '--no-default-browser-check',
  '--disable-backgrounding-occluded-windows', '--disable-renderer-backgrounding',
  '--disable-background-timer-throttling',
  '--window-size=1440,900', '--window-position=-2400,0', 'about:blank',
], { stdio: 'ignore' });

let wsUrl;
for (let i = 0; i < 60; i++) {
  try { const r = await fetch(`http://127.0.0.1:${DBG}/json/version`); if (r.ok) { wsUrl = (await r.json()).webSocketDebuggerUrl; break; } }
  catch { /* not up */ }
  await wait(400);
}
const ws = new WebSocket(wsUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let msgId = 0; const pend = new Map(); let sink = null;
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pend.has(m.id)) { const { res, rej } = pend.get(m.id); pend.delete(m.id); m.error ? rej(new Error(m.error.message)) : res(m.result); }
  else if (sink) sink(m);
};
const send = (method, p = {}, s) => { const id = ++msgId; ws.send(JSON.stringify({ id, method, params: p, sessionId: s })); return new Promise((res, rej) => pend.set(id, { res, rej })); };

const PROBED = ['#probeTop', '#probeTop .h2', '#probeTop .lede', '#probeTop .btn',
  '#probeTop .wrap', '#probeTop .chapter-tag', '#probeTop .nav', '#probeBottom'];
const PROPS = ['color', 'backgroundColor', 'fontSize', 'fontFamily', 'padding',
  'maxWidth', 'display', 'border', 'position'];
const WIDTHS = [1920, 1440, 1024, 768, 390, 360];

const results = [];

for (const page of PAGES) {
  const manifest = JSON.parse(readFileSync(join(SECTIONS, page, 'manifest.json'), 'utf8'));
  const full = readFileSync(join(SECTIONS, page, 'page.html'), 'utf8');
  const body = full.slice(full.indexOf('<body>') + 6, full.lastIndexOf('</body>'))
    .replaceAll('src="', `src="http://127.0.0.1:${PORT}/assets/`)
    .replaceAll(`src="http://127.0.0.1:${PORT}/assets/http`, 'src="http');
  console.log(`\n── ${page}  (${manifest.length} blocks)`);

  const overflow = [];
  let row = null;

  for (const width of WIDTHS) {
    hostPage = HOST();
    const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
    const errs = [];
    sink = (m) => {
      if (m.sessionId !== sessionId) return;
      if (m.method === 'Runtime.exceptionThrown') errs.push((m.params.exceptionDetails.text || 'exception').split('\n')[0]);
      if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error')
        errs.push(m.params.args.map((a) => a.description || a.value).join(' ').split('\n')[0].slice(0, 150));
    };
    await send('Runtime.enable', {}, sessionId);
    await send('Page.enable', {}, sessionId);
    await send('Emulation.setFocusEmulationEnabled', { enabled: true }, sessionId);
    await send('Page.bringToFront', {}, sessionId);
    await send('Emulation.setDeviceMetricsOverride', {
      width, height: width <= 430 ? 844 : 900, deviceScaleFactor: 1, mobile: width <= 430 }, sessionId);
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/host` }, sessionId);

    const ev = async (expr) => {
      const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }, sessionId);
      if (r.exceptionDetails) return { __err: (r.exceptionDetails.exception?.description || r.exceptionDetails.text || '').split('\n')[0].slice(0, 240) };
      return r.result.value;
    };
    // Page.navigate resolves when the navigation COMMITS, not when the
    // document has parsed. Injecting on a fixed 350ms sleep raced the parser
    // and got a null #slot on two of six pages — which reads as "the page
    // never armed" and is nothing of the sort.
    for (let i = 0; i < 80; i++) {
      if (await ev(`!!document.getElementById('slot')`)) break;
      await wait(150);
    }

    const snap = (sels, props) => `(function(){var out={};${JSON.stringify(sels)}.forEach(function(s){
      var el=document.querySelector(s); if(!el){out[s]=null;return}
      var cs=getComputedStyle(el),o={};${JSON.stringify(props)}.forEach(function(p){o[p]=cs[p]});
      out[s]=o;});return out;})()`;
    const before = width === WIDTHS[0] ? await ev(snap(PROBED, PROPS)) : null;

    const injected = await ev(`(function(){
      document.getElementById('slot').innerHTML = ${JSON.stringify(body)};
      document.querySelectorAll('#slot script').forEach(function(old){
        var s=document.createElement('script'); s.textContent=old.textContent;
        old.parentNode.replaceChild(s, old); });
      return document.querySelectorAll('#slot [data-chapter-name]').length;})()`);
    if (injected && injected.__err) errs.push('inject: ' + injected.__err);

    const roots = manifest.map((m) => m.rootClass);
    let armed = 0;
    for (let i = 0; i < 70; i++) {
      armed = await ev(`${JSON.stringify(roots)}.filter(function(c){
        return document.querySelector('.'+c+'[data-wzsr]'); }).length`);
      if (armed >= roots.length) break;
      await wait(300);
    }
    await ev(`document.fonts ? document.fonts.ready.then(()=>1) : 1`);
    await ev(`(async function(){var h=document.documentElement.scrollHeight;
      for(var y=0;y<h;y+=Math.round(innerHeight*.7)){window.scrollTo(0,y);
        await new Promise(function(r){setTimeout(r,90)})}
      window.scrollTo(0,0);return 1})()`);
    await wait(1100);

    const ov = await ev(`({ scrollW: document.documentElement.scrollWidth, inner: window.innerWidth })`);
    overflow.push({ width, ok: ov && ov.scrollW <= ov.inner + 1, scrollW: ov?.scrollW, inner: ov?.inner });

    if (width === WIDTHS[0]) {
      const after = await ev(snap(PROBED, PROPS));
      const leaks = [];
      for (const sel of PROBED) {
        const b = before?.[sel], a = after?.[sel];
        if (!b || !a) continue;
        for (const p of PROPS) if (b[p] !== a[p]) leaks.push(`${sel}.${p}: ${b[p]} -> ${a[p]}`);
      }
      const gsapTags = await ev(`document.querySelectorAll('script[data-wzsr]').length`);
      const chrome = await ev(`(function(){
        var n=document.querySelector('#slot [class$="-nav"]');
        var ab=document.querySelector('#slot [class*="-actionbar"]');
        return { navSolidWired: !!n, actionbar: !!ab,
                 chapterName: (document.querySelector('#slot [id$="navChName"]')||{}).textContent };})()`);
      /* Stranded content: anything the motion layer hid and never brought
         back. Two things this must NOT mistake for a defect —

         an element still mid-reveal (the entrance tween is 0.95s, and after a
         jump-scroll it starts from zero), and an element only just entering,
         whose trigger has legitimately not fired yet. The first version
         sampled 800ms after the jump and flagged `imp-fin` at opacity 0.3
         while it was animating perfectly well.

         So: settle for longer than the tween, and only judge elements that
         are WELL inside the viewport, whose trigger ('top 88%') fired a while
         ago. Anything still hidden at that point is genuinely stuck. */
      const stranded = await ev(`(async function(){
        var sleep=function(ms){return new Promise(function(r){setTimeout(r,ms)})};
        var doc=document.documentElement.scrollHeight-innerHeight, bad=[];
        for(var f=0.15;f<=0.9;f+=0.25){
          window.scrollTo(0,Math.round(doc*f)); await sleep(1700);
          document.querySelectorAll('#slot [data-rv],#slot [data-anim="hide"]').forEach(function(el){
            var r=el.getBoundingClientRect();
            if(r.bottom<40 || r.top>innerHeight*0.6) return;   // off-screen, or only just arriving
            var cs=getComputedStyle(el);
            if(parseFloat(cs.opacity)<0.9||cs.visibility==='hidden')
              bad.push((el.className||el.tagName).toString().slice(0,28)+'@'+cs.opacity);
          });
        }
        window.scrollTo(0,0); await sleep(200);
        return Array.from(new Set(bad)).slice(0,6);})()`);

      row = { page, blocks: manifest.length, armed, expected: roots.length,
              leaks: leaks.slice(0, 8), gsapTags, chrome, stranded, errors: errs.slice(0, 4) };
    }

    mkdirSync(join(OUT, 'shots', page), { recursive: true });
    const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }, sessionId);
    writeFileSync(join(OUT, 'shots', page, `${width}.png`), Buffer.from(shot.data, 'base64'));

    if (width !== WIDTHS[0] && errs.length && row) row.errors.push(...errs.slice(0, 2));
    sink = null;
    await send('Target.closeTarget', { targetId });
  }

  row.overflow = overflow;
  const badOv = overflow.filter((o) => !o.ok);
  row.ok = !row.leaks.length && row.armed === row.expected && !row.stranded.length
    && !row.errors.length && !badOv.length && row.gsapTags <= 3;
  results.push(row);

  console.log(`  armed ${row.armed}/${row.expected}  leaks ${row.leaks.length}  gsapTags ${row.gsapTags}` +
    `  stranded ${row.stranded.length}  overflow-clean ${overflow.length - badOv.length}/${overflow.length}` +
    `  err ${row.errors.length}   ${row.ok ? 'ok' : 'FAIL'}`);
  row.leaks.slice(0, 5).forEach((l) => console.log(`    leak     ${l}`));
  row.stranded.slice(0, 4).forEach((s) => console.log(`    stranded ${s}`));
  badOv.forEach((o) => console.log(`    overflow ${o.width}: ${o.scrollW}/${o.inner}`));
  row.errors.slice(0, 4).forEach((e) => console.log(`    err      ${e}`));
}

writeFileSync(join(OUT, 'verify-pages.json'), JSON.stringify(results, null, 2));
const bad = results.filter((r) => !r.ok);
console.log(`\n${'='.repeat(64)}`);
console.log(`pages        : ${results.length}`);
console.log(`clean        : ${results.length - bad.length}/${results.length}`);
console.log(`css leaks    : ${results.reduce((n, r) => n + r.leaks.length, 0)}`);
console.log(`stranded     : ${results.reduce((n, r) => n + r.stranded.length, 0)}`);
console.log(`console errs : ${results.reduce((n, r) => n + r.errors.length, 0)}`);
try { await send('Browser.close'); } catch { /* gone */ }
proc.kill(); server.close();
process.exit(bad.length ? 1 : 0);
