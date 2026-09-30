#!/usr/bin/env node
/**
 * parity.mjs — does the published page render like the local one?
 *
 * The Webflow page shares its document with the site's own 330 KB stylesheet.
 * A scoped sheet outranks the host only on the properties it sets, so a host
 * rule on a bare tag (li margins, label weight, link colour) reaches in and
 * moves the page by a few pixels, which no text, image or overflow gate can
 * see. This compares COMPUTED styles, element for element, between the local
 * build and staging, for every element inside .aq-page, at a width inside
 * each of Webflow's breakpoints. It also proves the class layer: a style the
 * builder stored differently from wf.css shows up here as a difference.
 *
 *   node parity.mjs [1440,1100,900,600,390]      # exits 1 on any difference
 */
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFileSync, existsSync, rmSync } from 'node:fs';
import { join, extname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const LOCAL = join(HERE, '../../../04-design/.tmp/aox-quiz/native/out');
const STAGING = 'https://arvadadentalcenter.webflow.io/ads-landing-pages';
const PAGES = ['all-on-x-quiz', 'all-on-x-quiz-consult', 'all-on-x-quiz-thank-you'].map((s) => [s + '.html', s]);
const ROOT = '.aq-page';
const WIDTHS = (process.argv[2] || '1440,1100,900,600,390').split(',').map(Number);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Horizontal margins are not compared as values: an `auto` margin computes to a used length that
// depends on when it is read (120px or 0px for the same centred box). Position and width are.
const PROPS = ['display', 'position', 'font-family', 'font-size', 'font-weight', 'font-style', 'line-height', 'letter-spacing', 'text-transform',
  'text-align', 'text-decoration-line', 'color', 'background-color', 'margin-top', 'margin-bottom',
  'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'border-top-width', 'border-right-width', 'border-bottom-width',
  'border-left-width', 'border-top-color', 'border-radius', 'box-sizing', 'list-style-type', 'vertical-align', 'opacity'];

const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript' };
const server = createServer((req, res) => {
  const f = join(LOCAL, decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, ''));
  if (!existsSync(f)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': TYPES[extname(f)] ?? 'application/octet-stream' }); res.end(readFileSync(f));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));

const PORT = 9200 + (process.pid % 700);
const PROFILE = join(tmpdir(), `aox-parity-${process.pid}`);
const proc = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  `--remote-debugging-port=${PORT}`, '--user-data-dir=' + PROFILE, '--headless=new', '--no-first-run', '--hide-scrollbars', 'about:blank',
], { stdio: 'ignore' });
let wsUrl;
for (let i = 0; i < 60 && !wsUrl; i++) { try { const r = await fetch(`http://127.0.0.1:${PORT}/json/version`); if (r.ok) wsUrl = (await r.json()).webSocketDebuggerUrl; } catch { await wait(300); } }
const ws = new WebSocket(wsUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let id = 0; const pending = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); } };
const send = (method, params = {}, sessionId) => { const i = ++id; ws.send(JSON.stringify({ id: i, method, params, sessionId })); return new Promise((res, rej) => pending.set(i, { res, rej })); };

async function snapshot(url, width) {
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  await send('Page.enable', {}, sessionId);
  // Two site-wide scripts change the page after load and are not part of the
  // port: the Sienna accessibility widget rewrites every font-size to a whole
  // pixel (15.2px becomes 15px, which reads exactly like a stylesheet leak),
  // and the consent script clones the footer's privacy link. Both are blocked
  // here so that what is left is the stylesheet.
  await send('Network.enable', {}, sessionId);
  await send('Network.setBlockedURLs', { urls: ['*sienna-accessibility*', '*brandkloutconsentpreferences*'] }, sessionId);
  await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width <= 430 }, sessionId);
  await send('Page.navigate', { url }, sessionId);
  const ev = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, sessionId);
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result.value;
  };
  for (let i = 0; i < 80; i++) { try { if (await ev(`document.readyState === 'complete'`)) break; } catch { /* navigating */ } await wait(200); }
  await ev(`document.fonts.ready.then(() => 1)`);
  await ev(`(async function(){ var h = document.documentElement.scrollHeight; for (var y = 0; y < h; y += 600) { window.scrollTo(0, y); await new Promise(function(r){ setTimeout(r, 100); }); } window.scrollTo(0, 0); return 1; })()`);
  await wait(1500);
  const data = await ev(`(function(){
    var props = ${JSON.stringify(PROPS)};
    var root = document.querySelector(${JSON.stringify(ROOT)}); if (!root) return null;
    var out = [], all = root.querySelectorAll('*');
    for (var i = 0; i < all.length; i++) {
      var e = all[i]; if (e.closest('svg') && e.tagName.toLowerCase() !== 'svg') continue;
      var cs = getComputedStyle(e), r = e.getBoundingClientRect(), o = {};
      for (var j = 0; j < props.length; j++) o[props[j]] = cs.getPropertyValue(props[j]);
      o.x = Math.round(r.left); o.width = Math.round(r.width); o.height = Math.round(r.height);
      out.push({ sel: e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (e.getAttribute('class') ? '.' + e.getAttribute('class').trim().split(/\\s+/).filter(function(c, n, all){ return all.indexOf(c) === n && c.indexOf('w--') !== 0; }).join('.') : ''), s: o });   // Webflow writes a DOM element's class twice
    }
    var b = getComputedStyle(document.body);
    return { els: out, body: { bg: b.backgroundColor, color: b.color, font: b.fontFamily, size: b.fontSize, lh: b.lineHeight, margin: b.margin }, height: Math.round(root.getBoundingClientRect().height) };
  })()`);
  await send('Target.closeTarget', { targetId });
  return data;
}

let total = 0;
for (const [file, slug] of PAGES) {
  for (const width of WIDTHS) {
    const a = await snapshot(`http://127.0.0.1:${server.address().port}/${file}`, width);
    const b = await snapshot(`${STAGING}/${slug}`, width);
    const diffs = [];
    if (!a || !b) { diffs.push('no ' + ROOT + ' on ' + (!a ? 'local' : 'staging')); }
    else {
      if (a.els.length !== b.els.length) diffs.push(`element count local ${a.els.length} staging ${b.els.length}`);
      for (const k of Object.keys(a.body)) if (a.body[k] !== b.body[k]) diffs.push(`body ${k}: local ${a.body[k]} | staging ${b.body[k]}`);
      const seen = new Map();
      for (let i = 0; i < Math.min(a.els.length, b.els.length); i++) {
        if (a.els[i].sel !== b.els[i].sel) { diffs.push(`#${i} differs in kind: ${a.els[i].sel} | ${b.els[i].sel}`); break; }
        for (const k of Object.keys(a.els[i].s)) {
          const x = a.els[i].s[k], y = b.els[i].s[k];
          const near = typeof x === 'number' && Math.abs(x - y) <= 1;
          if (x !== y && !near) { const key = `${a.els[i].sel}  ${k}: local ${x} | staging ${y}`; seen.set(key, (seen.get(key) || 0) + 1); }
        }
      }
      for (const [k, n] of seen) diffs.push(n > 1 ? `${k}  (x${n})` : k);
    }
    total += diffs.length;
    console.log(`${diffs.length ? 'DIFF' : 'same'}  ${slug} @${width}  ${a ? a.els.length + ' elements, ' + a.height + 'px' : ''}${b ? ' vs ' + b.height + 'px' : ''}`);
    for (const d of diffs.slice(0, 40)) console.log('      ' + d);
    if (diffs.length > 40) console.log(`      ... ${diffs.length - 40} more`);
  }
}
ws.close(); proc.kill(); server.close(); await wait(400);
try { rmSync(PROFILE, { recursive: true, force: true }); } catch { /* still letting go */ }
console.log(total ? `\n${total} difference(s)` : '\nlocal and staging render identically');
process.exit(total ? 1 : 0);
