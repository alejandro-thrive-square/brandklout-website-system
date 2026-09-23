#!/usr/bin/env node
/**
 * whowrote.mjs — which script writes an inline style onto matching elements?
 *
 * Installed via Page.addScriptToEvaluateOnNewDocument so the hook is in place
 * before any page script runs; hooking after load is too late to see the write.
 * Patches the CSSStyleDeclaration setters and setAttribute, and records a stack
 * trace for every write to a matching element.
 *
 *   node whowrote.mjs <slug> <selector> <css-prop>
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const [target, selector, prop] = process.argv.slice(2);
const url = /^(https?|file):/.test(target) ? target : `https://arvadadentalcenter.webflow.io/${target}`;

const HOOK = `(function(){
  window.__writes = [];
  var SEL = ${JSON.stringify(selector)}, PROP = ${JSON.stringify(prop)};
  function match(el){ try { return el && el.nodeType===1 && el.matches && el.matches(SEL); } catch(e){ return false; } }
  function rec(el, how, val){
    if(!match(el)) return;
    window.__writes.push({ how: how, value: String(val).slice(0,80),
      stack: (new Error().stack||'').split('\\n').slice(2,7).join(' | ') });
  }
  var sp = CSSStyleDeclaration.prototype.setProperty;
  CSSStyleDeclaration.prototype.setProperty = function(n,v,p){
    if(n===PROP) rec(this.__el__ || (this.parentRule?null:null), 'setProperty', v);
    return sp.apply(this, arguments);
  };
  var sa = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function(n,v){
    if(String(n).toLowerCase()==='style' && String(v).indexOf(PROP)>=0) rec(this,'setAttribute',v);
    return sa.apply(this, arguments);
  };
  // el.style.fontSize = x  — patch the camelCase accessor on the prototype.
  var camel = PROP.replace(/-([a-z])/g, function(_,c){ return c.toUpperCase(); });
  var d = Object.getOwnPropertyDescriptor(CSSStyleDeclaration.prototype, camel);
  if(d && d.set){
    Object.defineProperty(CSSStyleDeclaration.prototype, camel, {
      get: d.get,
      set: function(v){
        // Find the owning element by scanning: cheap enough, only on writes.
        try {
          var els = document.querySelectorAll(SEL);
          for (var i=0;i<els.length;i++) if (els[i].style === this) {
            window.__writes.push({ how: 'style.'+camel, value: String(v).slice(0,80),
              stack: (new Error().stack||'').split('\\n').slice(2,7).join(' | ') });
            break;
          }
        } catch(e){}
        return d.set.call(this, v);
      }, configurable: true
    });
  }
})();`;

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => existsSync(p));
const DBG = 9200 + (process.pid % 700);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const proc = spawn(CHROME, [`--remote-debugging-port=${DBG}`,
  '--user-data-dir=' + join(HERE, '.chrome-who'), '--no-first-run', '--no-default-browser-check',
  '--disable-backgrounding-occluded-windows', '--disable-renderer-backgrounding',
  '--disable-background-timer-throttling',
  '--window-size=1440,900', '--window-position=-2400,0', 'about:blank'], { stdio: 'ignore' });

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
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId);
await send('Page.addScriptToEvaluateOnNewDocument', { source: HOOK }, sessionId);
await send('Page.navigate', { url }, sessionId);
const ev = async (x) => (await send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true }, sessionId)).result?.value;
for (let i = 0; i < 90; i++) { if (await ev(`document.readyState==='complete'`) === true) break; await wait(200); }
await wait(3000);
console.log(JSON.stringify(await ev(`window.__writes`), null, 1));
console.log('current attr:', await ev(`(document.querySelector(${JSON.stringify(selector)})||{}).getAttribute && document.querySelector(${JSON.stringify(selector)}).getAttribute('style')`));
try { await send('Browser.close'); } catch {}
proc.kill();
