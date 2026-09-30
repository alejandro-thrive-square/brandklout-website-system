#!/usr/bin/env node
/**
 * brand-probe.mjs — read the brand off the LIVE site as it renders, not off
 * its variable list. A Webflow site declares many more colours and fonts than
 * it uses; what counts is what the visitor sees. For each URL this records:
 *
 *   - every background colour, weighted by the painted area it covers
 *   - every text colour and font family/weight, weighted by characters
 *   - the computed style of each heading level, the body copy and every button
 *
 *   node brand-probe.mjs <url> [url ...]   -> brand/<slug>.json + brand/<slug>-<n>.png
 */
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const OUT = join(HERE, 'brand'); mkdirSync(OUT, { recursive: true });
const urls = process.argv.slice(2);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';

const PORT = 9200 + (process.pid % 700);
const PROFILE = join(tmpdir(), `aox-brand-${process.pid}`);
const proc = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  `--remote-debugging-port=${PORT}`, '--user-data-dir=' + PROFILE, '--headless=new', '--no-first-run', '--hide-scrollbars', `--user-agent=${UA}`, 'about:blank',
], { stdio: 'ignore' });
let wsUrl;
for (let i = 0; i < 60 && !wsUrl; i++) { try { const r = await fetch(`http://127.0.0.1:${PORT}/json/version`); if (r.ok) wsUrl = (await r.json()).webSocketDebuggerUrl; } catch { await wait(300); } }
const ws = new WebSocket(wsUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let id = 0; const pending = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); } };
const send = (method, params = {}, sessionId) => { const i = ++id; ws.send(JSON.stringify({ id: i, method, params, sessionId })); return new Promise((res, rej) => pending.set(i, { res, rej })); };

const PROBE = `(function(){
  function hex(c){ var m = c.match(/rgba?\\(([^)]+)\\)/); if (!m) return c; var p = m[1].split(',').map(function(x){ return parseFloat(x); });
    if (p.length > 3 && p[3] === 0) return null;
    var h = '#' + p.slice(0,3).map(function(n){ return ('0' + Math.round(n).toString(16)).slice(-2); }).join('');
    return p.length > 3 && p[3] < 1 ? h + ' @' + p[3] : h; }
  var bg = {}, fg = {}, fam = {};
  var all = document.body.querySelectorAll('*');
  for (var i = 0; i < all.length; i++) {
    var e = all[i], cs = getComputedStyle(e), r = e.getBoundingClientRect();
    if (cs.display === 'none' || cs.visibility === 'hidden' || !r.width || !r.height) continue;
    var b = hex(cs.backgroundColor);
    if (b) bg[b] = (bg[b] || 0) + Math.round(r.width * r.height);
    var own = 0;
    for (var n = e.firstChild; n; n = n.nextSibling) if (n.nodeType === 3) own += n.textContent.trim().length;
    if (own) {
      var c = hex(cs.color); fg[c] = (fg[c] || 0) + own;
      var f = cs.fontFamily.split(',')[0].replace(/["']/g, '').trim() + ' ' + cs.fontWeight;
      fam[f] = (fam[f] || 0) + own;
    }
  }
  function top(o, n){ return Object.keys(o).sort(function(a, b){ return o[b] - o[a]; }).slice(0, n).map(function(k){ return [k, o[k]]; }); }
  function style(e){ var cs = getComputedStyle(e);
    return { text: e.textContent.trim().replace(/\\s+/g, ' ').slice(0, 60), font: cs.fontFamily.split(',')[0].replace(/["']/g, ''), weight: cs.fontWeight, size: cs.fontSize,
      lh: cs.lineHeight, ls: cs.letterSpacing, tt: cs.textTransform, color: hex(cs.color), bg: hex(cs.backgroundColor), radius: cs.borderRadius,
      border: cs.borderTopWidth !== '0px' ? cs.borderTopWidth + ' ' + hex(cs.borderTopColor) : '', pad: cs.padding, cls: String(e.className).slice(0, 70) }; }
  function firstVisible(sel, n){ return Array.prototype.slice.call(document.querySelectorAll(sel)).filter(function(e){ var r = e.getBoundingClientRect(); return r.width && r.height && e.textContent.trim(); }).slice(0, n).map(style); }
  var body = getComputedStyle(document.body);
  return { title: document.title, body: { bg: hex(body.backgroundColor), color: hex(body.color), font: body.fontFamily, size: body.fontSize, lh: body.lineHeight },
    backgrounds: top(bg, 14), textColors: top(fg, 10), fonts: top(fam, 12),
    h1: firstVisible('h1', 2), h2: firstVisible('h2', 4), h3: firstVisible('h3', 3), p: firstVisible('p', 3),
    buttons: firstVisible('a[class*="button"], a[class*="btn"], .w-button, button', 10),
    nav: firstVisible('nav a, header a, [class*="nav"] a', 4), footer: firstVisible('footer, [class*="footer"]', 1) };
})()`;

for (const url of urls) {
  const slug = new URL(url).pathname.replace(/^\/|\/$/g, '').replace(/\//g, '_') || 'home';
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  await send('Page.enable', {}, sessionId);
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId);
  await send('Page.navigate', { url }, sessionId);
  const ev = async (expression) => (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, sessionId)).result.value;
  for (let i = 0; i < 80; i++) { try { if (await ev(`document.readyState === 'complete'`)) break; } catch { /* navigating */ } await wait(250); }
  await ev(`document.documentElement.style.scrollBehavior = 'auto'; document.fonts.ready.then(() => 1)`);
  await ev(`(async function(){ var h = document.documentElement.scrollHeight; for (var y = 0; y < h; y += 700) { window.scrollTo(0, y); await new Promise(function(r){ setTimeout(r, 120); }); } window.scrollTo(0, 0); return 1; })()`);
  await wait(1500);
  const data = await ev(PROBE);
  writeFileSync(join(OUT, slug + '.json'), JSON.stringify(data, null, 1));
  const h = await ev(`document.documentElement.scrollHeight`);
  const ys = [0, 900, 1800, Math.max(0, h - 900)];
  for (let n = 0; n < ys.length; n++) {
    const { data: png } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: ys[n], width: 1440, height: 900, scale: 1 } }, sessionId);
    writeFileSync(join(OUT, `${slug}-${n + 1}.png`), Buffer.from(png, 'base64'));
  }
  console.log(slug, data.title, h);
  await send('Target.closeTarget', { targetId });
}
ws.close(); proc.kill(); await wait(400);
try { rmSync(PROFILE, { recursive: true, force: true }); } catch { /* still letting go */ }
