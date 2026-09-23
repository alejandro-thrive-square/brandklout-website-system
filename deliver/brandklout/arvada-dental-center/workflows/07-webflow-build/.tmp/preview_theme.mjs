/**
 * preview_theme.mjs — try a theme layer on the live page WITHOUT publishing.
 *
 * A colour flip's characteristic failure is unreadable text, and it is cheap
 * to create and expensive to undo once it is on six published pages. So
 * inject the candidate CSS into the live page over CDP, then:
 *
 *   1. capture it, so it can be looked at, and
 *   2. run a contrast check over every piece of visible text, so the failures
 *      that a screenshot at 720px wide would hide get named.
 *
 * The contrast pass walks up for the first opaque background behind each text
 * node, which is the part hand-checking always gets wrong: text usually sits
 * on a transparent parent several levels below the element actually painting
 * the colour.
 *
 *   node preview_theme.mjs <slug> [css-file] [width]
 */
import { spawn } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const [slug, cssFile = join(HERE, 'theme-arvada.css'), widthArg] = process.argv.slice(2);
const WIDTH = Number(widthArg || 1440);
const CSS = readFileSync(cssFile, 'utf8');
mkdirSync(join(HERE, 'shots'), { recursive: true });

const CONTRAST = `(function(){
  function parse(c){
    var m = /rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)(?:,\\s*([\\d.]+))?\\)/.exec(c || '');
    if (!m) return null;
    return { r:+m[1], g:+m[2], b:+m[3], a: m[4] === undefined ? 1 : parseFloat(m[4]) };
  }
  function over(fg, bg){        // composite a translucent colour onto its ground
    var a = fg.a;
    return { r: fg.r*a + bg.r*(1-a), g: fg.g*a + bg.g*(1-a), b: fg.b*a + bg.b*(1-a), a:1 };
  }
  function lum(c){
    var f = [c.r, c.g, c.b].map(function(v){
      v /= 255; return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4);
    });
    return 0.2126*f[0] + 0.7152*f[1] + 0.0722*f[2];
  }
  function ratio(a, b){
    var l1 = lum(a), l2 = lum(b);
    return (Math.max(l1,l2) + 0.05) / (Math.min(l1,l2) + 0.05);
  }
  /** First ancestor actually painting an opaque colour — what the eye sees. */
  function ground(e){
    var n = e;
    while (n && n.nodeType === 1) {
      var c = parse(getComputedStyle(n).backgroundColor);
      if (c && c.a >= 0.92) return c;
      n = n.parentElement;
    }
    return { r:255, g:255, b:255, a:1 };
  }
  var bad = [], checked = 0;
  document.querySelectorAll('p,h1,h2,h3,h4,h5,li,a,button,span,label,td,th,dt,dd,strong,em,figcaption').forEach(function(e){
    var own = '';
    for (var i = 0; i < e.childNodes.length; i++)
      if (e.childNodes[i].nodeType === 3) own += e.childNodes[i].nodeValue;
    own = own.replace(/\\s+/g,' ').trim();
    if (own.length < 3) return;
    var cs = getComputedStyle(e);
    if (cs.display === 'none' || cs.visibility === 'hidden') return;
    if (parseFloat(cs.opacity) < 0.5) return;
    var r = e.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) return;
    // Text sitting on top of an image is not measurable this way — skip it
    // rather than report a number that means nothing.
    var n = e, onImage = false;
    while (n && n.nodeType === 1) {
      var b = getComputedStyle(n);
      if (b.backgroundImage && b.backgroundImage !== 'none') { onImage = true; break; }
      if (parse(b.backgroundColor) && parse(b.backgroundColor).a >= 0.92) break;
      n = n.parentElement;
    }
    if (onImage) return;
    var fg = parse(cs.color); if (!fg) return;
    var g = ground(e);
    var c = ratio(over(fg, g), g);
    checked++;
    var size = parseFloat(cs.fontSize) || 16;
    var large = size >= 24 || (size >= 18.66 && parseInt(cs.fontWeight,10) >= 700);
    var need = large ? 3 : 4.5;
    if (c < need) bad.push({ ratio: +c.toFixed(2), need: need, size: Math.round(size),
      color: cs.color, bg: 'rgb(' + Math.round(g.r) + ',' + Math.round(g.g) + ',' + Math.round(g.b) + ')',
      tag: e.tagName.toLowerCase(),
      cls: (e.getAttribute('class')||'').split(/\\s+/).slice(0,2).join('.'),
      text: own.slice(0, 44) });
  });
  bad.sort(function(a,b){ return a.ratio - b.ratio; });

  /**
   * For the worst few, the ratio alone does not say WHY. Walk up and report
   * where the ground and the text colour each came from — which ancestor
   * paints, which one declares --fg-body, and whether a [data-theme] sits
   * between them. Two rounds were spent reasoning about this from the
   * stylesheet and getting it wrong.
   */
  function chain(el){
    var out = [], n = el;
    while (n && n.nodeType === 1 && out.length < 7) {
      var cs = getComputedStyle(n);
      var bgc = parse(cs.backgroundColor);
      out.push({
        tag: n.tagName.toLowerCase() + (n.id ? '#' + n.id : '') +
             ((n.getAttribute('class')||'').trim() ? '.' + (n.getAttribute('class')||'').trim().split(/\\s+/).slice(0,2).join('.') : ''),
        theme: n.getAttribute('data-theme') || '',
        paints: bgc && bgc.a >= 0.92 ? cs.backgroundColor : '',
        fgBody: cs.getPropertyValue('--fg-body').trim(),
        bgTok: cs.getPropertyValue('--bg').trim(),
        color: cs.color
      });
      n = n.parentElement;
    }
    return out;
  }
  return { checked: checked, failures: bad.length, worst: bad.slice(0, 18),
    diag: bad.slice(0, 3).map(function(b){
      var el = null;
      document.querySelectorAll(b.tag).forEach(function(e){
        if (el) return;
        var t = ''; for (var i=0;i<e.childNodes.length;i++) if (e.childNodes[i].nodeType===3) t += e.childNodes[i].nodeValue;
        if (t.replace(/\\s+/g,' ').trim().slice(0,44) === b.text) el = e;
      });
      return { text: b.text, chain: el ? chain(el) : [] };
    }) };
})()`;

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => existsSync(p));
const DBG = 9200 + (process.pid % 700);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
try {
  for (const d of readdirSync(HERE)) {
    if (d.startsWith('.chrome-prev-') && d !== `.chrome-prev-${process.pid}`) {
      try { rmSync(join(HERE, d), { recursive: true, force: true }); } catch {}
    }
  }
} catch {}
const proc = spawn(CHROME, [`--remote-debugging-port=${DBG}`,
  '--user-data-dir=' + join(HERE, `.chrome-prev-${process.pid}`),
  '--no-first-run', '--no-default-browser-check',
  '--disable-background-timer-throttling', '--disable-renderer-backgrounding',
  `--window-size=${WIDTH},900`, '--window-position=-2400,0', 'about:blank'], { stdio: 'ignore' });
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
const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
await send('Page.enable', {}, sessionId);
await send('Network.enable', {}, sessionId);
await send('Network.setBlockedURLs', { urls: ['*sienna-accessibility*', '*googletagmanager*'] }, sessionId);
await send('Emulation.setFocusEmulationEnabled', { enabled: true }, sessionId);
await send('Page.bringToFront', {}, sessionId);
await send('Emulation.setDeviceMetricsOverride', { width: WIDTH, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId);
await send('Page.navigate', { url: `https://arvadadentalcenter.webflow.io/${slug}` }, sessionId);
const ev = async (x) => (await send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true }, sessionId)).result?.value;
for (let i = 0; i < 120; i++) { if (await ev(`document.readyState==='complete'`) === true) break; await wait(200); }
await ev(`document.fonts ? document.fonts.ready.then(()=>1) : 1`);

// Inject LAST in <head>… actually append to <body> so it outranks nothing on
// specificity but everything on source order among equals.
const injected = await ev(`(function(){
  var s = document.createElement('style');
  s.id = 'wz-theme-preview';
  s.textContent = ${JSON.stringify(CSS)};
  document.body.appendChild(s);
  return !!document.getElementById('wz-theme-preview');
})()`);
if (!injected) { console.error('theme did not inject'); process.exit(1); }

await ev(`(async function(){ var h=document.documentElement.scrollHeight;
  for (var y=0; y<h; y+=innerHeight*0.85){ window.scrollTo(0,y); await new Promise(r=>setTimeout(r,300)); }
  window.scrollTo(0,0); await new Promise(r=>setTimeout(r,700)); return 1; })()`);
await wait(1200);

const c = await ev(CONTRAST);
console.log(`\n${slug} @${WIDTH}  text checked ${c.checked}  CONTRAST FAILURES ${c.failures}`);
for (const f of c.worst) {
  console.log(`  ${String(f.ratio).padStart(5)}:1 (need ${f.need})  ${f.size}px ${f.tag}.${f.cls}`);
  console.log(`         ${f.color} on ${f.bg}   "${f.text}"`);
}

for (const d of c.diag || []) {
  console.log(`\n  WHY: "${d.text}"`);
  d.chain.forEach((n, i) => console.log(
    `    ${'  '.repeat(i)}${n.tag}${n.theme ? ' [data-theme=' + n.theme + ']' : ''}` +
    `${n.paints ? '  PAINTS ' + n.paints : ''}  --bg ${n.bgTok || '-'}  --fg-body ${n.fgBody || '-'}`));
}

const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true }, sessionId);
const out = join(HERE, 'shots', `${slug}-THEMED-${WIDTH}.png`);
writeFileSync(out, Buffer.from(shot.data, 'base64'));
console.log(`\n${out}`);
try { await send('Browser.close'); } catch {}
proc.kill();
