#!/usr/bin/env node
/**
 * matched.mjs — ask Chrome itself which rules set a property on an element.
 *
 * Hand-rolled walks over document.styleSheets miss rules nested in @scope /
 * @media / @supports and cannot report the cascade order. CSS.getMatchedStyles
 * ForNode is the authoritative answer and reports origin (user-agent, regular)
 * and specificity ordering — last match wins.
 *
 *   node matched.mjs <slug|url> <css-selector> [prop ...]
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const [target, selector, ...props] = process.argv.slice(2);
const PROPS = props.length ? props : ['font-size', 'line-height'];
const url = /^(https?|file):/.test(target) ? target : `https://arvadadentalcenter.webflow.io/${target}`;

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => existsSync(p));
const DBG = 9200 + (process.pid % 700);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const proc = spawn(CHROME, [`--remote-debugging-port=${DBG}`,
  '--user-data-dir=' + join(HERE, '.chrome-matched'), '--no-first-run', '--no-default-browser-check',
  '--allow-file-access-from-files', '--disable-backgrounding-occluded-windows',
  '--disable-renderer-backgrounding', '--disable-background-timer-throttling',
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
for (const d of ['Page', 'DOM', 'CSS']) await send(`${d}.enable`, {}, sessionId);
await send('Emulation.setFocusEmulationEnabled', { enabled: true }, sessionId);
await send('Page.bringToFront', {}, sessionId);
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId);
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] }, sessionId);
await send('Page.navigate', { url }, sessionId);
const ev = async (x) => (await send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true }, sessionId)).result?.value;
for (let i = 0; i < 90; i++) { if (await ev(`document.readyState==='complete'`) === true) break; await wait(200); }
await ev(`document.fonts ? document.fonts.ready.then(()=>1) : 1`);
await wait(1200);

const { root } = await send('DOM.getDocument', { depth: -1 }, sessionId);
const { nodeId } = await send('DOM.querySelector', { nodeId: root.nodeId, selector }, sessionId);
if (!nodeId) { console.log(`selector not found: ${selector}`); proc.kill(); process.exit(1); }

const ms = await send('CSS.getMatchedStylesForNode', { nodeId }, sessionId);
console.log(`### ${selector}  on  ${url}\n`);
if (ms.inlineStyle) {
  const hits = ms.inlineStyle.cssProperties.filter((p) => PROPS.includes(p.name));
  if (hits.length) console.log('inline:', hits.map((h) => `${h.name}: ${h.value}`).join('; '));
}
for (const m of ms.matchedCSSRules || []) {
  const r = m.rule;
  const hits = (r.style?.cssProperties || []).filter((p) => PROPS.includes(p.name) && p.value);
  if (!hits.length) continue;
  const media = (r.media || []).map((x) => `@media ${x.text}`).join(' ');
  const scope = (r.scopes || []).map((x) => `@scope ${x.text}`).join(' ');
  console.log(`[${r.origin}] ${r.selectorList.text.slice(0, 100)}   ${media} ${scope}`);
  for (const h of hits) console.log(`      ${h.name}: ${h.value}${h.important ? ' !important' : ''}`);
  console.log(`      sheet: ${(r.styleSheetId && ms.cssKeyframesRules ? '' : '')}${r.origin === 'regular' ? '' : ''}`);
}
// Inherited chain: line-height/font-size are inherited, so the winner may be an ancestor's.
(ms.inherited || []).forEach((inh, i) => {
  for (const m of inh.matchedCSSRules || []) {
    const r = m.rule;
    const hits = (r.style?.cssProperties || []).filter((p) => PROPS.includes(p.name) && p.value);
    if (!hits.length) continue;
    console.log(`  <inherited ${i + 1}> [${r.origin}] ${r.selectorList.text.slice(0, 90)}`);
    for (const h of hits) console.log(`        ${h.name}: ${h.value}`);
  }
});
try { await send('Browser.close'); } catch {}
proc.kill();
