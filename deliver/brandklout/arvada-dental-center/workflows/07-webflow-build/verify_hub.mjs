#!/usr/bin/env node
/**
 * verify_hub.mjs — is PASTE-ALL.html actually usable?
 *
 * Two things, because either alone would mislead:
 *
 *   STATIC — every embedded payload parses, has exactly one root (a multi-root
 *   payload is what crashes the Designer) and emits no non-empty style.
 *
 *   LIVE — every button really copies. This has to be driven with REAL input
 *   events: a scripted `.click()` is not a trusted user gesture and
 *   `execCommand('copy')` refuses it silently, which reports six working
 *   buttons as six broken ones. The clipboard is then read back and parsed, so
 *   the check is "the right payload reached the clipboard", not "the status
 *   text says it did".
 *
 *   node verify_hub.mjs
 */
import { spawn } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const FILE = join(HERE, '.tmp', 'payload', 'PASTE-ALL.html');
const src = readFileSync(FILE, 'utf8');
let bad = 0;

/* ---------- static ---------- */
const blobs = [...src.matchAll(/<script type="application\/json" id="p-([^"]+)">([\s\S]*?)<\/script>/g)];
console.log(`embedded payloads: ${blobs.length}`);
for (const [, page, raw] of blobs) {
  let p;
  try { p = JSON.parse(raw.replaceAll('<\\/', '</')); }
  catch (e) { console.log(`  ${page}: PARSE FAIL ${e.message.slice(0, 60)}`); bad++; continue; }
  const nodes = p.payload.nodes;
  const child = new Set();
  for (const n of nodes) for (const c of (n.children || [])) child.add(c);
  const roots = nodes.filter((n) => !child.has(n._id));
  const nonEmpty = p.payload.styles.filter(
    (s) => (s.styleLess || '').trim() && !s.name.endsWith('-br-line')).length;
  const ok = roots.length === 1 && p.type === '@webflow/XscpData' && nonEmpty === 0;
  if (!ok) bad++;
  console.log(`  ${page.padEnd(17)} roots=${roots.length} nodes=${nodes.length}` +
    ` nonEmptyStyles=${nonEmpty} ${ok ? 'ok' : 'FAIL'}`);
}

/* ---------- live ---------- */
const server = createServer((_q, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(src);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const PORT = server.address().port;

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => existsSync(p));
const DBG = 9400 + (process.pid % 150);
const proc = spawn(CHROME, [
  `--remote-debugging-port=${DBG}`, '--user-data-dir=' + join(HERE, '.tmp', '.chrome-hub'),
  '--no-first-run', '--no-default-browser-check',
  '--window-size=900,800', '--window-position=-2400,0', 'about:blank'], { stdio: 'ignore' });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let wsUrl;
for (let i = 0; i < 60; i++) {
  try { const r = await fetch(`http://127.0.0.1:${DBG}/json/version`); if (r.ok) { wsUrl = (await r.json()).webSocketDebuggerUrl; break; } }
  catch { /* not up */ }
  await wait(400);
}
const ws = new WebSocket(wsUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let id = 0; const pend = new Map(); const errs = [];
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pend.has(m.id)) { const { res, rej } = pend.get(m.id); pend.delete(m.id); m.error ? rej(new Error(m.error.message)) : res(m.result); }
  else if (m.method === 'Runtime.exceptionThrown') errs.push((m.params.exceptionDetails.text || '').split('\n')[0]);
};
const send = (me, p = {}, s) => { const i = ++id; ws.send(JSON.stringify({ id: i, method: me, params: p, sessionId: s })); return new Promise((res, rej) => pend.set(i, { res, rej })); };

const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
await send('Runtime.enable', {}, sessionId);
await send('Emulation.setFocusEmulationEnabled', { enabled: true }, sessionId);
await send('Page.bringToFront', {}, sessionId);
await send('Browser.grantPermissions', { origin: `http://127.0.0.1:${PORT}`,
  permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'] });
await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/` }, sessionId);

const ev = async (x) => {
  const r = await send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true }, sessionId);
  return r.exceptionDetails ? { __err: (r.exceptionDetails.exception?.description || '').split('\n')[0] } : r.result.value;
};
for (let i = 0; i < 80; i++) {
  if (await ev(`document.querySelectorAll('button[data-page]').length === ${blobs.length}`)) break;
  await wait(200);
}

console.log('\nlive button test (real input events, clipboard read back):');
for (const [, page] of blobs) {
  const box = await ev(`(function(){
    var b=document.querySelector('button[data-page="${page}"]');
    b.scrollIntoView({block:'center'});
    var r=b.getBoundingClientRect();
    return {x:Math.round(r.left+r.width/2), y:Math.round(r.top+r.height/2)};})()`);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: box.x, y: box.y, button: 'left', clickCount: 1, buttons: 1 }, sessionId);
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: box.x, y: box.y, button: 'left', clickCount: 1, buttons: 0 }, sessionId);
  await wait(350);
  const r = await ev(`(async function(){
    var s=document.querySelector('[data-status="${page}"]');
    var clip=''; try { clip = await navigator.clipboard.readText(); } catch(e){ clip='ERR '+e.message; }
    var parsed=null; try { parsed=JSON.parse(clip); } catch(e){}
    return { text:s.textContent.trim().slice(0,60), ok:s.className.indexOf('ok')>-1,
             marked:document.getElementById('card-${page}').classList.contains('done'),
             kb:Math.round(clip.length/1024),
             type: parsed ? parsed.type : clip.slice(0,44),
             nodes: parsed && parsed.payload ? parsed.payload.nodes.length : null };})()`);
  const good = r.ok && r.marked && r.type === '@webflow/XscpData' && r.nodes > 0;
  if (!good) bad++;
  console.log(`  ${page.padEnd(17)} ${good ? 'ok  ' : 'FAIL'} clip=${String(r.kb).padStart(4)}KB` +
    ` type=${r.type} nodes=${r.nodes}`);
  if (!good) console.log(`      "${r.text}"`);
}

console.log(`\nconsole errors: ${errs.length}`);
errs.slice(0, 3).forEach((e) => console.log('  ' + e));
console.log(bad || errs.length ? `\nFAILURES: ${bad}` : '\nall clean');
try { await send('Browser.close'); } catch { /* gone */ }
proc.kill(); server.close();
process.exit(bad || errs.length ? 1 : 0);
