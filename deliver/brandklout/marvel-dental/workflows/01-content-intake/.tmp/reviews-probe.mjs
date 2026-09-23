#!/usr/bin/env node
/**
 * reviews-probe.mjs — pull the real review text off the live site.
 *
 * The "Trusted by Smiles Across Clifton" block is rendered by a script, so it
 * is absent from the served HTML and invisible to a fetch. Real quotes are the
 * only ones worth putting on a landing page, so read them from the DOM.
 *
 *   node reviews-probe.mjs   -> brand/reviews.json
 */
import { spawn } from 'node:child_process';
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
mkdirSync(join(HERE, 'brand'), { recursive: true });
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => existsSync(p));
const PORT = 9200 + (process.pid % 700);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const proc = spawn(CHROME, [`--remote-debugging-port=${PORT}`, '--user-data-dir=' + join(HERE, '.chrome-reviews'),
  '--no-first-run', '--no-default-browser-check', '--window-size=1440,900', '--window-position=-2400,0', 'about:blank'], { stdio: 'ignore' });

let wsUrl;
for (let i = 0; i < 60; i++) {
  try { const r = await fetch(`http://127.0.0.1:${PORT}/json/version`); if (r.ok) { wsUrl = (await r.json()).webSocketDebuggerUrl; break; } } catch {}
  await wait(400);
}
const ws = new WebSocket(wsUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let id = 0; const pending = new Map();
ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { const { res, rej } = pending.get(m.id); pending.delete(m.id); m.error ? rej(new Error(m.error.message)) : res(m.result); } };
const send = (method, params = {}, sessionId) => { const i = ++id; ws.send(JSON.stringify({ id: i, method, params, sessionId })); return new Promise((res, rej) => pending.set(i, { res, rej })); };

const out = {};
for (const [slug, url] of [['home', 'https://www.marveldentaldds.com/'], ['stories', 'https://www.marveldentaldds.com/patient-stories']]) {
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  await send('Runtime.enable', {}, sessionId);
  await send('Page.navigate', { url }, sessionId);
  await wait(6000);
  const r = await send('Runtime.evaluate', {
    expression: String.raw`(function(){
      var heads = [].slice.call(document.querySelectorAll('h1,h2,h3,h4'));
      var anchor = heads.filter(function(h){ return /Trusted by Smiles|Real Patient Stories|Video Testimonial/i.test(h.textContent); });
      var out = [];
      anchor.forEach(function(h){
        var sec = h.closest('section') || h.parentElement;
        if (!sec) return;
        out.push({ heading: h.textContent.trim(), text: sec.innerText.replace(/\n{2,}/g, '\n').trim().slice(0, 4000) });
      });
      var iframes = [].slice.call(document.querySelectorAll('iframe')).map(function(f){ return f.src.slice(0, 200); });
      return { blocks: out, iframes: iframes };
    })()`, returnByValue: true }, sessionId);
  out[slug] = r.result.value;
  console.log(slug, out[slug] ? out[slug].blocks.length + ' block(s)' : 'none');
  await send('Target.closeTarget', { targetId });
}
writeFileSync(join(HERE, 'brand', 'reviews.json'), JSON.stringify(out, null, 2));
ws.close(); proc.kill();
console.log('wrote brand/reviews.json');
