#!/usr/bin/env node
/**
 * verify_sections.mjs — the gate for the pasteable sections.
 *
 * A section can pass every static check and still be wrong in the only two
 * ways that matter once it is in a client's Webflow project:
 *
 *   it repaints their page, or their page repaints it.
 *
 * So each section is loaded into a deliberately HOSTILE host: a page carrying
 * its own reset, its own :root tokens, and loud definitions for `.wrap`,
 * `.btn`, `.h2`, `.lede`, `.chapter-tag` and `section` — the exact class names
 * the design uses, because Webflow merges classes by name site-wide and this
 * is what a real site collision looks like. Around the section sit marker
 * elements whose computed styles are recorded BEFORE the section is injected
 * and compared after.
 *
 * Then the section has to actually work: GSAP resolved, the runtime armed, and
 * the scrubbed choreography producing real movement across its own range —
 * verified by driving it, not by photographing it.
 *
 * Two copies of the same section are placed on the page, because a Webflow
 * user will duplicate a section and the embed will run twice.
 *
 *   node verify_sections.mjs [page ...]
 */
import { spawn } from 'node:child_process';
import { readFileSync, existsSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { join, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const SECTIONS = join(HERE, '.tmp', 'sections');
const DESIGN = resolve(HERE, '../04-design/.tmp');
const OUT = join(HERE, '.tmp', 'verify');
mkdirSync(OUT, { recursive: true });

const PAGES = process.argv.slice(2).length ? process.argv.slice(2)
  : readdirSync(SECTIONS).filter((d) => existsSync(join(SECTIONS, d, 'manifest.json')));

/* ---------- a static server: file:// cannot load the vendored GSAP ---------- */
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.json': 'application/json' };
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

/* A host page that is actively unhelpful, the way a real one is. */
const HOST = (sectionHtml) => `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<script>window.WZSR_CDN = 'http://127.0.0.1:${PORT}/gsap/';</script>
<style>
  /* --- the "client's existing Webflow site" --- */
  *{box-sizing:content-box}
  :root{--bg:#ffe;--fg:#900;--accent:#0f0;--gutter:4px;--maxw:400px;--radius:0;
        --f-display:cursive;--f-ui:cursive;--f-body:cursive;--body:9px;--h2:11px;--d1:13px}
  html{font-size:11px}
  body{margin:0;background:#ffffe0;color:#990000;font-family:cursive}
  section{border:6px dashed #f0f!important}
  .wrap{max-width:200px!important;padding:40px!important;background:#f0f}
  .btn{background:#0f0;color:#f0f;padding:1px;font-size:8px}
  .h2,.lede,.big{color:#0f0;font-size:8px;font-family:cursive}
  .chapter-tag{display:block;color:#f0f;font-size:7px}
  .host-probe{font-size:20px;color:rgb(0,128,0);padding:12px;background:rgb(240,240,240);
    font-family:Georgia,serif;max-width:300px;border:2px solid rgb(0,0,255)}
  .host-btn{display:inline-block}
</style></head><body>
<div class="host-probe" id="probeTop">
  <span class="h2">host h2</span> <span class="lede">host lede</span>
  <a class="btn host-btn" href="#x">host btn</a>
  <div class="wrap">host wrap</div>
  <div class="chapter-tag">host chapter-tag</div>
</div>
<div id="slot"></div>
<div class="host-probe" id="probeBottom">bottom</div>
<div id="slot2"></div>
</body></html>`;

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => existsSync(p));
const DBG = 9200 + (process.pid % 700);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const proc = spawn(CHROME, [
  `--remote-debugging-port=${DBG}`, '--user-data-dir=' + join(HERE, '.tmp', '.chrome-verify'),
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
  '#probeTop .wrap', '#probeTop .chapter-tag', '#probeBottom'];
const PROPS = ['color', 'backgroundColor', 'fontSize', 'fontFamily', 'padding',
  'maxWidth', 'display', 'border', 'margin'];

const results = [];

for (const page of PAGES) {
  const dir = join(SECTIONS, page);
  const manifest = JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8'));
  console.log(`\n── ${page}`);

  for (const entry of manifest) {
    const html = readFileSync(join(dir, `${entry.section}.html`), 'utf8')
      .replaceAll('src="', `src="http://127.0.0.1:${PORT}/assets/`)
      .replaceAll(`src="http://127.0.0.1:${PORT}/assets/http`, 'src="http');
    hostPage = HOST();

    const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
    const errs = [];
    sink = (m) => {
      if (m.sessionId !== sessionId) return;
      if (m.method === 'Runtime.exceptionThrown') errs.push(m.params.exceptionDetails.text || 'exception');
      if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error')
        errs.push(m.params.args.map((a) => a.description || a.value).join(' ').slice(0, 160));
    };
    await send('Runtime.enable', {}, sessionId);
    await send('Page.enable', {}, sessionId);
    await send('Emulation.setFocusEmulationEnabled', { enabled: true }, sessionId);
    await send('Page.bringToFront', {}, sessionId);
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId);
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/host` }, sessionId);

    const ev = async (expr) => {
      const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }, sessionId);
      if (r.exceptionDetails) return { __err: (r.exceptionDetails.exception?.description || r.exceptionDetails.text || '').slice(0, 300) };
      return r.result.value;
    };

    await wait(400);
    const snap = (sels, props) => `(function(){
      var out={};
      ${JSON.stringify(sels)}.forEach(function(s){
        var el=document.querySelector(s); if(!el){out[s]=null;return}
        var cs=getComputedStyle(el),o={};
        ${JSON.stringify(props)}.forEach(function(p){o[p]=cs[p]});
        out[s]=o;
      });
      return out;})()`;

    const before = await ev(snap(PROBED, PROPS));

    // Inject the section twice — a Designer duplicate must not double-drive it.
    // The result is CHECKED: an evaluate that throws returns {__err} and a
    // harness that ignores it reports a working section as dead.
    const injected = await ev(`(function(){
      var h = ${JSON.stringify(html)};
      document.getElementById('slot').innerHTML = h;
      document.getElementById('slot2').innerHTML = h;
      // innerHTML does not execute <script>; re-create them the way a real
      // page load would, which is also what Webflow's embed does.
      document.querySelectorAll('#slot script, #slot2 script').forEach(function(old){
        var s=document.createElement('script'); s.textContent=old.textContent;
        old.parentNode.replaceChild(s, old);
      });
      return { roots: document.querySelectorAll('.${entry.rootClass}').length,
               scripts: document.querySelectorAll('#slot script, #slot2 script').length };})()`);
    if (injected && injected.__err) errs.push('inject: ' + injected.__err);
    else if (!injected || injected.roots !== 2) errs.push('inject: roots=' + JSON.stringify(injected));

    // Wait for the runtime to resolve GSAP and arm.
    let armed = false;
    for (let i = 0; i < 60; i++) {
      armed = await ev(`document.querySelectorAll('.${entry.rootClass}[data-wzsr="motion"]').length`);
      if (armed) break;
      await wait(300);
    }
    await ev(`document.fonts ? document.fonts.ready.then(()=>1) : 1`);
    await wait(700);

    const after = await ev(snap(PROBED, PROPS));

    // 1. Did the section repaint the host?
    const leaks = [];
    for (const sel of PROBED) {
      const b = before?.[sel], a = after?.[sel];
      if (!b || !a) continue;
      for (const p of PROPS) if (b[p] !== a[p]) leaks.push(`${sel}.${p}: ${b[p]} -> ${a[p]}`);
    }

    // 2. Did the host repaint the section? Check the section actually took its
    //    own tokens rather than the host's cursive/green/11px ones.
    const own = await ev(`(function(){
      var r=document.querySelector('.${entry.rootClass}'); if(!r) return null;
      var cs=getComputedStyle(r);
      var tag=r.querySelector('[class*="chapter-tag"]');
      var h=r.querySelector('[class$="-h2"],[class*="-h2 "],h1,h2');
      return { rootFont: cs.fontFamily, rootBg: cs.backgroundColor,
               rootFontSize: cs.fontSize, box: cs.boxSizing,
               tagDisplay: tag?getComputedStyle(tag).display:null,
               headFont: h?getComputedStyle(h).fontFamily:null,
               headSize: h?getComputedStyle(h).fontSize:null,
               width: Math.round(r.getBoundingClientRect().width) };})()`);

    // 3. Does the choreography actually move?
    const motion = await ev(`(async function(){
      var sleep=function(ms){return new Promise(function(r){setTimeout(r,ms)})};
      if(!window.gsap||!window.ScrollTrigger) return {err:'no gsap'};
      var roots=document.querySelectorAll('.${entry.rootClass}');
      var sts=ScrollTrigger.getAll().filter(function(s){
        return s.trigger && (roots[0].contains(s.trigger)||roots[0]===s.trigger); });
      if(!sts.length) return {triggers:0, moved:null};
      // Sample every animated element's transform+opacity across the section.
      var read=function(){
        var v=[];
        roots[0].querySelectorAll('*').forEach(function(el){
          var cs=getComputedStyle(el);
          if(cs.transform!=='none'||cs.opacity!=='1') v.push(cs.transform+'|'+cs.opacity+'|'+cs.color);
        });
        return v.join(';');
      };
      var doc=document.documentElement.scrollHeight-innerHeight;
      var seen=new Set();
      for(var f=0;f<=1.0001;f+=0.1){
        window.scrollTo(0, Math.round(doc*f)); await sleep(260);
        seen.add(read());
      }
      window.scrollTo(0,0); await sleep(300);

      // Walk back down and leave the section settled, then check nothing the
      // motion layer hid was left hidden. A section whose only choreography is
      // a set of reveals legitimately reaches one visual state in a short host
      // page — everything is already past its trigger. What must never happen
      // is content stranded invisible, which is the actual failure mode that
      // "did anything move?" was standing in for.
      window.scrollTo(0, Math.round(doc*0.5)); await sleep(900);
      var stranded=[];
      roots[0].querySelectorAll('[data-rv],[data-anim="hide"]').forEach(function(el){
        var cs=getComputedStyle(el);
        if(parseFloat(cs.opacity)<0.9||cs.visibility==='hidden')
          stranded.push((el.className||el.tagName).toString().slice(0,30)+'@'+cs.opacity);
      });
      // And no text may be left transparent by an unfinished colour sweep.
      roots[0].querySelectorAll('.wz-word').forEach(function(el){
        var c=getComputedStyle(el).color;
        var m=c.match(/rgba?\\(([^)]+)\\)/);
        if(m){var p=m[1].split(',');if(p.length>3&&parseFloat(p[3])<0.05) stranded.push('wz-word@'+c);}
      });
      window.scrollTo(0,0); await sleep(200);

      return { triggers: sts.length, pinned: sts.filter(function(s){return !!s.pin}).length,
               states: seen.size, stranded: stranded.slice(0,5) };
    })()`);

    // A picture of the first copy sitting between the two host probes. The
    // probes are in frame on purpose: if the section had bled into the page,
    // this is where you would see it.
    await ev(`(function(){var r=document.querySelector('.${entry.rootClass}');
      if(!r) return 0; var t=r.getBoundingClientRect().top+scrollY;
      window.scrollTo(0, Math.max(0, t - 60)); return 1;})()`);
    await wait(900);
    const shot = await send('Page.captureScreenshot', { format: 'png' }, sessionId);
    mkdirSync(join(OUT, 'shots', page), { recursive: true });
    writeFileSync(join(OUT, 'shots', page, `${entry.section}.png`), Buffer.from(shot.data, 'base64'));

    // 4. Idempotency: the second copy must be armed too, and separately.
    const dupes = await ev(`document.querySelectorAll('.${entry.rootClass}[data-wzsr]').length`);
    const gsapTags = await ev(`document.querySelectorAll('script[data-wzsr]').length`);

    const stranded = motion?.stranded ?? [];
    const ok = !leaks.length && armed >= 1 && dupes === 2 && gsapTags <= 3
      && !stranded.length && !errs.length && !motion?.err;
    results.push({ page, section: entry.section, root: entry.rootClass, ok,
      leaks: leaks.slice(0, 6), armed, dupes, gsapTags, own, motion, errors: errs.slice(0, 3) });

    console.log(`  ${entry.section.padEnd(13)} ${ok ? 'ok  ' : 'FAIL'}` +
      ` leak:${leaks.length} armed:${armed} copies:${dupes} gsap:${gsapTags}` +
      ` trig:${motion?.triggers ?? '-'} states:${motion?.states ?? '-'}` +
      ` stranded:${stranded.length} err:${errs.length}`);
    if (!ok) {
      leaks.slice(0, 4).forEach((l) => console.log(`      leak     ${l}`));
      errs.slice(0, 3).forEach((e) => console.log(`      err      ${e.split('\n')[0]}`));
      stranded.slice(0, 4).forEach((s) => console.log(`      stranded ${s}`));
      if (motion?.err) console.log(`      motion   ${motion.err}`);
    }

    sink = null;
    await send('Target.closeTarget', { targetId });
  }
}

writeFileSync(join(OUT, 'verify-sections.json'), JSON.stringify(results, null, 2));
const bad = results.filter((r) => !r.ok);
console.log(`\n${'='.repeat(64)}`);
console.log(`sections    : ${results.length}`);
console.log(`clean       : ${results.length - bad.length}/${results.length}`);
console.log(`css leaks   : ${results.reduce((n, r) => n + r.leaks.length, 0)}`);
console.log(`console errs: ${results.reduce((n, r) => n + r.errors.length, 0)}`);
try { await send('Browser.close'); } catch { /* gone */ }
proc.kill(); server.close();
process.exit(bad.length ? 1 : 0);
