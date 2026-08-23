#!/usr/bin/env node
/**
 * diag.mjs — measures the six reported defects rather than guessing at them.
 *
 * Screenshots say "this looks wrong". They cannot say WHY a scrubbed timeline
 * is out of order, because the order only exists across scroll positions. So
 * each probe here walks the relevant pin through its own scroll range and
 * reports the state at each step.
 *
 *   node diag.mjs
 */
import { spawn } from 'node:child_process';
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const DESIGN = resolve(HERE, '../../04-design/.tmp');
const OUT = join(HERE, 'diag');
mkdirSync(OUT, { recursive: true });

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => existsSync(p));
const PORT = 9200 + (process.pid % 700);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const proc = spawn(CHROME, [
  `--remote-debugging-port=${PORT}`, '--user-data-dir=' + join(HERE, '.chrome-diag'),
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
let msgId = 0; const pending = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { const { res, rej } = pending.get(m.id); pending.delete(m.id); m.error ? rej(new Error(m.error.message)) : res(m.result); } };
const send = (method, params = {}, sessionId) => { const id = ++msgId; ws.send(JSON.stringify({ id, method, params, sessionId })); return new Promise((res, rej) => pending.set(id, { res, rej })); };

async function open(slug, width, height) {
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  await send('Page.enable', {}, sessionId);
  await send('Emulation.setFocusEmulationEnabled', { enabled: true }, sessionId);
  await send('Page.bringToFront', {}, sessionId);
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false }, sessionId);
  const url = pathToFileURL(join(DESIGN, slug, 'index.html')).href + '?nosmooth=1';
  await send('Page.navigate', { url }, sessionId);
  const ev = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }, sessionId);
    if (r.exceptionDetails) return { __err: r.exceptionDetails.text + ' ' + (r.exceptionDetails.exception?.description || '') };
    return r.result.value;
  };
  for (let i = 0; i < 80; i++) { if (await ev(`document.documentElement.getAttribute('data-js')==='on'`)) break; await wait(250); }
  await ev(`document.fonts ? document.fonts.ready.then(()=>1) : 1`);
  await ev(`(async function(){var h=document.documentElement.scrollHeight;
    for(var y=0;y<h;y+=Math.round(innerHeight*.7)){window.scrollTo(0,y);await new Promise(function(r){setTimeout(r,70)})}
    window.scrollTo(0,0);return 1})()`);
  await wait(1200);
  return { ev, sessionId, targetId, shot: async (name) => {
    const s = await send('Page.captureScreenshot', { format: 'png' }, sessionId);
    writeFileSync(join(OUT, name), Buffer.from(s.data, 'base64'));
  } };
}
const close = (t) => send('Target.closeTarget', { targetId: t.targetId });

const R = {};

/* ── 1. chapter-tag alignment: does the tag start where its content starts? ── */
console.log('\n── chapter-tag alignment (1920)');
R.tagAlign = {};
for (const slug of ['implants', 'aox', 'veneers', 'emergency', 'dentist-near-me', 'next-door']) {
  const t = await open(slug, 1920, 1080);
  // The reference is the tag's NEXT SIBLING — the block it actually
  // introduces. Reaching deeper with querySelector found headings inside
  // narrower or centred descendants and reported offsets that are simply how
  // those blocks are laid out. Centred tags are skipped for the same reason:
  // comparing left edges of two centred boxes of different widths measures
  // nothing.
  R.tagAlign[slug] = await t.ev(`Array.from(document.querySelectorAll('.chapter-tag')).map(function(tag){
    var sec = tag.closest('section');
    if (tag.classList.contains('center')) return { sec: sec && sec.id, skipped: 'centred' };
    var next = tag.nextElementSibling;
    while (next && next.getBoundingClientRect().width === 0) next = next.nextElementSibling;
    var a = tag.getBoundingClientRect(), b = next ? next.getBoundingClientRect() : null;
    // A centred child block (margin-inline:auto) is its own choice, not a
    // misplaced tag — detect it and report the tag against the block's own
    // content box rather than flagging the centring itself.
    var centredChild = false;
    if (next) { var cs = getComputedStyle(next);
      centredChild = cs.marginLeft === cs.marginRight && parseFloat(cs.marginLeft) > 2; }
    return { sec: sec && sec.id, next: next ? (next.className || next.tagName) : null,
             tag: Math.round(a.left), tagW: Math.round(a.width),
             head: b ? Math.round(b.left) : null, delta: b ? Math.round(a.left - b.left) : null,
             centredChild: centredChild, label: tag.textContent.trim().slice(0, 34) };
  })`);
  const bad = (R.tagAlign[slug] || []).filter((r) => r.delta != null && Math.abs(r.delta) > 2);
  console.log(`  ${slug.padEnd(17)} ${bad.length
    ? 'MISALIGNED ' + bad.map((b) => `${b.sec}(${b.delta}px vs .${String(b.next).split(' ')[0]})`).join(' ')
    : 'ok'}`);
  await close(t);
}

/* ── 2. practice pin: do the cards fit the pin at real desktop sizes? ── */
console.log('\n── practice card overflow');
R.pracFit = [];
for (const [w, h] of [[1920, 1080], [1920, 950], [1680, 1050], [1440, 900], [1366, 768], [1280, 720]]) {
  const t = await open('dentist-near-me', w, h);
  const m = await t.ev(`(function(){
    var pin=document.getElementById('pracPin'); if(!pin) return null;
    var track=document.getElementById('pracTrack'), bar=pin.querySelector('.bar'),
        head=pin.querySelector('.head'), card=pin.querySelector('.path-card');
    var p=pin.getBoundingClientRect(), c=card.getBoundingClientRect(), b=bar.getBoundingClientRect();
    return { vh: innerHeight, pinH: Math.round(p.height), padTop: Math.round(parseFloat(getComputedStyle(pin).paddingTop)),
             headH: Math.round(head.getBoundingClientRect().height), cardH: Math.round(c.height),
             cardW: Math.round(c.width), cardTop: Math.round(c.top), cardBottom: Math.round(c.bottom),
             barTop: Math.round(b.top), trackW: Math.round(track.scrollWidth),
             clipsBar: c.bottom > b.top + 1, clipsPin: c.bottom > p.bottom + 1 };
  })()`);
  R.pracFit.push({ w, h, ...m });
  console.log(`  ${w}x${h}  card ${m.cardW}x${m.cardH} bottom=${m.cardBottom} bar=${m.barTop} pinH=${m.pinH} vh=${m.vh}  ${m.clipsBar || m.clipsPin ? 'OVERFLOW' : 'ok'}`);
  await t.shot(`prac-${w}x${h}-before.png`);
  await close(t);
}

/* ── 2b. is any pinned content hidden under the fixed action bar? ──
   The bar is position:fixed, so it costs a pin nothing in layout and covers
   it anyway. Nothing in the overflow or interaction gates can see this. */
console.log('\n── pinned content under the action bar');
R.underBar = [];
for (const slug of ['implants', 'aox', 'veneers', 'emergency', 'dentist-near-me', 'next-door']) {
  for (const [w, h] of [[390, 844], [360, 780], [768, 1024]]) {
    const t = await open(slug, w, h);
    const m = await t.ev(`(async function(){
      var sleep=function(ms){return new Promise(function(r){setTimeout(r,ms)})};
      var bar=document.querySelector('.actionbar');
      if(!bar || getComputedStyle(bar).display==='none') return {n:0, skipped:'no bar'};
      var pins=ScrollTrigger.getAll().filter(function(s){return s.pin});
      var hits=[];
      for(var i=0;i<pins.length;i++){
        var st=pins[i];
        // Park mid-pin so the scene is assembled, and let the bar come on.
        window.scrollTo(0, Math.round(st.start+(st.end-st.start)*0.6));
        await sleep(700);
        var br=bar.getBoundingClientRect();
        if(br.top>=innerHeight-1) continue;            // bar not shown yet
        var root=st.pin;
        var els=root.querySelectorAll('p,h2,h3,li,.bar,.path-card,.btn,b');
        for(var j=0;j<els.length;j++){
          var r=els[j].getBoundingClientRect();
          if(r.width===0||r.height===0) continue;
          if(getComputedStyle(els[j]).visibility==='hidden') continue;
          // Covered = its lower edge is inside the bar's band and it starts above it.
          if(r.bottom>br.top+2 && r.top<br.top){
            hits.push({pin:root.id, el:(els[j].className||els[j].tagName).toString().slice(0,26),
                       over:Math.round(r.bottom-br.top)});
            break;
          }
        }
      }
      return {n:hits.length, hits:hits.slice(0,4)};
    })()`);
    R.underBar.push({ slug, w, h, ...m });
    if (m.n) console.log(`  ${slug.padEnd(17)} ${w}x${h}  COVERED ${m.hits.map((x) => `${x.pin}:${x.el}+${x.over}px`).join(' ')}`);
    await close(t);
  }
  const bad = R.underBar.filter((r) => r.slug === slug && r.n);
  if (!bad.length) console.log(`  ${slug.padEnd(17)} ok`);
}

/* ── 3. anatomy: walk the pin and record whether assembly matches the steps ── */
console.log('\n── implants anatomy scrub');
{
  const t = await open('implants', 1920, 1080);
  R.anat = await t.ev(`(async function(){
    var sleep=function(ms){return new Promise(function(r){setTimeout(r,ms)})};
    var st = ScrollTrigger.getAll().filter(function(s){ return s.pin && s.pin.id==='anatPin'; })[0];
    if(!st) return {err:'no anatPin ScrollTrigger'};
    var out=[], read=function(id){
      var el=document.getElementById(id); if(!el) return null;
      var m=(el.getAttribute('transform')||'').match(/matrix\\(([^)]+)\\)/);
      var ty=m?Math.round(parseFloat(m[1].split(',')[5])*10)/10:0;
      return { ty: ty, op: Math.round(parseFloat(getComputedStyle(el).opacity)*100)/100 };
    };
    for(var p=0;p<=1.0001;p+=0.125){
      window.scrollTo(0, Math.round(st.start + (st.end-st.start)*p));
      await sleep(650);
      out.push({ p:+p.toFixed(3), prog:+st.progress.toFixed(3),
        post:read('anatPost'), abut:read('anatAbut'), crown:read('anatCrown'),
        halo:(function(){var h=document.getElementById('anatHalo');return h?Math.round(parseFloat(getComputedStyle(h).opacity)*100)/100:null})(),
        steps:Array.prototype.map.call(document.querySelectorAll('#anatSteps .anat-step'),function(s){return Math.round(parseFloat(getComputedStyle(s).opacity)*100)/100}) });
    }
    return out;
  })()`);
  if (Array.isArray(R.anat)) R.anat.forEach((r) => console.log(
    `  p=${String(r.p).padEnd(5)} prog=${String(r.prog).padEnd(5)} post ty=${String(r.post.ty).padStart(6)} op=${r.post.op}` +
    ` | abut ty=${String(r.abut.ty).padStart(6)} op=${r.abut.op} | crown ty=${String(r.crown.ty).padStart(7)} op=${r.crown.op}` +
    ` | halo=${r.halo} steps=${r.steps.join(',')}`));
  else console.log('  ', R.anat);
  await close(t);
}

/* ── 4. word sweep ordering: is any accent word coloured before the last
       white word finishes? ── */
console.log('\n── word sweep ordering');
R.sweep = {};
for (const [slug, pinId, bigId] of [['veneers', 'mirPin', 'mirBig'], ['aox', 'vdPin', 'vdBig'],
  ['implants', 'gapPin', 'gapBig'], ['emergency', 'nowPin', 'nowBig'], ['dentist-near-me', 'srchPin', 'srchBig']]) {
  const t = await open(slug, 1920, 1080);
  R.sweep[slug] = await t.ev(`(async function(){
    var sleep=function(ms){return new Promise(function(r){setTimeout(r,ms)})};
    var st=ScrollTrigger.getAll().filter(function(s){return s.pin&&s.pin.id==='${pinId}'})[0];
    if(!st) return {err:'no ${pinId}'};
    var words=Array.prototype.slice.call(document.querySelectorAll('#${bigId} .wz-word'));
    if(!words.length) return {err:'no words'};
    var isWhite=function(c){return /rgba?\\(255,\\s*255,\\s*255(,\\s*1)?\\)/.test(c)};
    var isBase=function(c){return /0\\.17/.test(c)};
    var rows=[];
    for(var p=0;p<=1.0001;p+=0.1){
      window.scrollTo(0, Math.round(st.start+(st.end-st.start)*p));
      await sleep(520);
      var cols=words.map(function(w){return getComputedStyle(w).color});
      // first index still at the untouched base colour
      var firstBase=-1; for(var i=0;i<cols.length;i++){ if(isBase(cols[i])){firstBase=i;break} }
      // last index that has taken accent (neither base nor white)
      var lastAcc=-1; for(var j=0;j<cols.length;j++){ if(!isBase(cols[j])&&!isWhite(cols[j])&&!/255,\\s*255,\\s*255/.test(cols[j])) lastAcc=j }
      rows.push({p:+p.toFixed(2), firstBase:firstBase, lastAccent:lastAcc,
                 outOfOrder: firstBase>-1 && lastAcc>-1 && lastAcc>firstBase});
    }
    return {n:words.length, rows:rows};
  })()`);
  const s = R.sweep[slug];
  const bad = s.rows ? s.rows.filter((r) => r.outOfOrder) : [];
  console.log(`  ${slug.padEnd(17)} words=${s.n ?? '-'} ${bad.length ? 'OUT OF ORDER at p=' + bad.map((b) => b.p).join(',') : (s.err || 'ok')}`);
  await close(t);
}

writeFileSync(join(OUT, 'diag.json'), JSON.stringify(R, null, 2));
console.log(`\nwrote ${join(OUT, 'diag.json')}`);
try { await send('Browser.close'); } catch { /* gone */ }
proc.kill();
