#!/usr/bin/env node
/**
 * brand-probe.mjs — read Marvel Dental's live brand system off the published site.
 *
 * The site CSS is Webflow-generated, so grepping selectors lies about what a page
 * actually renders. This drives real Chrome and reads COMPUTED styles instead:
 * type ramp, palette (weighted by painted area), buttons, containers, logo.
 *
 *   node brand-probe.mjs            -> brand/probe.json + brand/<slug>-1440.png
 */
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const OUT = join(HERE, 'brand');
mkdirSync(OUT, { recursive: true });

const PAGES = [
  ['home', 'https://www.marveldentaldds.com/'],
  ['implants-offer', 'https://www.marveldentaldds.com/dental-implants-offer'],
  ['emergency', 'https://www.marveldentaldds.com/services/dental-emergency'],
];

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => existsSync(p));
const PORT = 9200 + (process.pid % 700);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const proc = spawn(CHROME, [
  `--remote-debugging-port=${PORT}`, '--user-data-dir=' + join(HERE, '.chrome-brand'),
  '--no-first-run', '--no-default-browser-check',
  '--disable-backgrounding-occluded-windows', '--disable-renderer-backgrounding',
  '--disable-background-timer-throttling',
  '--window-size=1440,900', '--window-position=-2400,0', 'about:blank',
], { stdio: 'ignore' });

let wsUrl;
for (let i = 0; i < 60; i++) {
  try {
    const r = await fetch(`http://127.0.0.1:${PORT}/json/version`);
    if (r.ok) { wsUrl = (await r.json()).webSocketDebuggerUrl; break; }
  } catch { /* not up yet */ }
  await wait(400);
}
const ws = new WebSocket(wsUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let msgId = 0;
const pending = new Map();
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) {
    const { res, rej } = pending.get(m.id); pending.delete(m.id);
    m.error ? rej(new Error(m.error.message)) : res(m.result);
  }
};
const send = (method, params = {}, sessionId) => {
  const id = ++msgId;
  ws.send(JSON.stringify({ id, method, params, sessionId }));
  return new Promise((res, rej) => pending.set(id, { res, rej }));
};

const PROBE = String.raw`(function(){
  var px = function (v) { return Math.round(parseFloat(v) || 0); };
  var sample = function (el) {
    var r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) return null;
    var cs = getComputedStyle(el);
    return { tag: el.tagName.toLowerCase(), cls: (el.className || '').toString().slice(0, 90),
      text: (el.textContent || '').trim().slice(0, 60),
      font: cs.fontFamily, size: px(cs.fontSize), weight: cs.fontWeight, lh: cs.lineHeight,
      ls: cs.letterSpacing, tt: cs.textTransform, color: cs.color, bg: cs.backgroundColor,
      radius: cs.borderRadius, w: Math.round(r.width) };
  };
  var pick = function (sel, n) {
    return [].slice.call(document.querySelectorAll(sel), 0, n).map(sample).filter(Boolean);
  };

  var area = {};
  var all = document.querySelectorAll('*');
  for (var i = 0; i < all.length; i++) {
    var el = all[i];
    var r = el.getBoundingClientRect();
    if (r.width < 8 || r.height < 8) continue;
    var cs = getComputedStyle(el);
    var bg = cs.backgroundColor;
    if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') area[bg] = (area[bg] || 0) + r.width * r.height;
    if ((el.textContent || '').trim().length > 2) {
      var k = 'text:' + cs.color;
      area[k] = (area[k] || 0) + r.width * parseFloat(cs.fontSize);
    }
  }
  var palette = Object.keys(area).map(function (k) { return { color: k, weight: Math.round(area[k] / 1000) }; })
    .sort(function (a, b) { return b.weight - a.weight; }).slice(0, 20);

  var fontSet = {};
  [].forEach.call(document.querySelectorAll('h1,h2,h3,h4,h5,p,a,span,div,button,li'), function (el) {
    fontSet[getComputedStyle(el).fontFamily] = 1;
  });

  var logo = [].slice.call(document.querySelectorAll('header img, .navbar img, nav img, [class*=logo] img, img[alt*=ogo]'), 0, 5)
    .map(function (i) {
      var r = i.getBoundingClientRect();
      return { src: i.currentSrc || i.src, alt: i.alt, w: Math.round(r.width), h: Math.round(r.height) };
    });

  var buttons = [].slice.call(document.querySelectorAll('a.w-button, .button, [class*=button], a[class*=btn]'), 0, 10)
    .map(sample).filter(Boolean);

  var containers = [].slice.call(document.querySelectorAll('[class*=container]'), 0, 6).map(function (el) {
    var cs = getComputedStyle(el);
    return { cls: (el.className || '').toString().slice(0, 60), width: Math.round(el.getBoundingClientRect().width),
      maxW: cs.maxWidth, padL: cs.paddingLeft };
  });

  var sections = [].slice.call(document.querySelectorAll('section, .section'), 0, 16).map(function (el) {
    var cs = getComputedStyle(el);
    return { cls: (el.className || '').toString().slice(0, 60), bg: cs.backgroundColor,
      padT: px(cs.paddingTop), padB: px(cs.paddingBottom) };
  });

  return { title: document.title, h1: pick('h1', 2), h2: pick('h2', 5), h3: pick('h3', 5),
    h4: pick('h4', 3), p: pick('p', 5),
    small: pick('.subheading, [class*=eyebrow], [class*=kicker], [class*=label]', 5),
    buttons: buttons, containers: containers, sections: sections, palette: palette,
    fonts: Object.keys(fontSet).slice(0, 14), logo: logo,
    imgs: [].slice.call(document.images, 0, 45).map(function (i) {
      return { src: (i.currentSrc || i.src).split('/').pop(), alt: i.alt, w: Math.round(i.getBoundingClientRect().width) };
    }) };
})()`;

const out = {};
for (const [slug, url] of PAGES) {
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  await send('Runtime.enable', {}, sessionId);
  await send('Page.enable', {}, sessionId);
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId);
  await send('Page.navigate', { url }, sessionId);
  await wait(4500);
  const ev = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, sessionId);
    if (r.exceptionDetails) {
      console.error(slug, 'probe error', JSON.stringify(r.exceptionDetails).slice(0, 400));
      return null;
    }
    return r.result.value;
  };
  await ev(`document.fonts ? document.fonts.ready.then(function(){return 1;}) : 1`);
  await ev(`(async function(){ var h=document.documentElement.scrollHeight; for (var y=0;y<h;y+=600){ window.scrollTo(0,y); await new Promise(function(r){setTimeout(r,70);}); } window.scrollTo(0,0); return 1; })()`);
  await wait(1200);
  out[slug] = await ev(PROBE);
  const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true }, sessionId);
  writeFileSync(join(OUT, `${slug}-1440.png`), Buffer.from(shot.data, 'base64'));
  console.log('probed', slug, out[slug] ? 'ok' : 'FAILED');
  await send('Target.closeTarget', { targetId });
}
writeFileSync(join(OUT, 'probe.json'), JSON.stringify(out, null, 2));
ws.close();
proc.kill();
console.log('wrote', join(OUT, 'probe.json'));
