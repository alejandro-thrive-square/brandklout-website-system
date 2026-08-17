// Behaviour probe for the cosmetic landing package, motion ENABLED.
// Drives each interactive section over CDP and reports the resulting DOM state,
// so the JS carried in the section embeds is verified before conversion.
// Usage: node behave-cosmetic.mjs <fileUrl> [settleMs]
import { spawn } from "node:child_process";
import fs from "node:fs"; import os from "node:os"; import path from "node:path"; import http from "node:http";

const [, , fileUrl, settleArg] = process.argv;
const settle = Number(settleArg) || 13000;
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9900 + Math.floor(Math.random() * 400);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-"));
const chrome = spawn(CHROME, ["--headless=new", "--disable-gpu", "--hide-scrollbars",
  `--remote-debugging-port=${PORT}`, "--remote-allow-origins=*", "--force-device-scale-factor=1",
  "--window-size=1440,1000", "--no-first-run", `--user-data-dir=${profile}`, "about:blank"]);

const wait = (ms) => new Promise(r => setTimeout(r, ms));
async function getJSON(p) {
  return new Promise((res, rej) => {
    http.get({ host: "127.0.0.1", port: PORT, path: p }, r => {
      let d = ""; r.on("data", c => d += c); r.on("end", () => res(JSON.parse(d)));
    }).on("error", rej);
  });
}
let wsUrl;
for (let i = 0; i < 40; i++) {
  try { const v = await getJSON("/json/version"); if (v.webSocketDebuggerUrl) { wsUrl = v.webSocketDebuggerUrl; break; } } catch {}
  await wait(200);
}
const ws = new WebSocket(wsUrl); let id = 0; const pending = new Map();
const errors = [];
ws.addEventListener("message", ev => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
  if (m.method === "Runtime.exceptionThrown") {
    errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
  }
});
await new Promise(r => ws.addEventListener("open", r, { once: true }));
const send = (method, params = {}, sessionId) => new Promise(res => {
  const mid = ++id; pending.set(mid, res); ws.send(JSON.stringify({ id: mid, method, params, sessionId }));
});

const { targetInfos } = await send("Target.getTargets");
const pt = targetInfos.find(t => t.type === "page");
const { sessionId } = await send("Target.attachToTarget", { targetId: pt.targetId, flatten: true });
await send("Page.enable", {}, sessionId);
await send("Runtime.enable", {}, sessionId);
// motion ENABLED on purpose: this probe exists to exercise the JS
await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "no-preference" }] }, sessionId);
await send("Page.navigate", { url: fileUrl }, sessionId);
await wait(settle);

const evalJs = async (expr) => {
  const r = await send("Runtime.evaluate",
    { expression: expr, returnByValue: true, awaitPromise: true }, sessionId);
  return r?.result?.value;
};

const report = {};

// 1 — hero: word masks created, compare slider responds to keyboard
report.hero = await evalJs(`(() => {
  const s = document.querySelector('[data-csm-hero]');
  const masks = s.querySelectorAll('.csm-hero__w').length;
  const stage = s.querySelector('[data-csm-ba]');
  const after = s.querySelector('[data-csm-ba-after]');
  const before = after.style.clipPath;
  stage.focus();
  stage.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));
  stage.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));
  return { wordMasks: masks, clipBefore: before, clipAfter: after.style.clipPath,
           aria: stage.getAttribute('aria-valuenow') };
})()`);

// 2 — credential marquee: row duplicated and drifting
report.marks = await evalJs(`(() => {
  const t = document.querySelector('[data-csm-marks-track]');
  return { children: t.children.length, transform: t.style.transform || '(none)' };
})()`);

// 3 — collection: selecting each scope lights the right teeth
report.collection = await evalJs(`(() => {
  const s = document.querySelector('[data-csm-collection]');
  const lit = () => Array.from(s.querySelectorAll('[data-csm-tooth]'))
    .filter(t => t.classList.contains('is--lit'))
    .map(t => +t.getAttribute('data-csm-tooth'));
  const pick = k => s.querySelector('[data-csm-opt="'+k+'"]').click();
  const out = {};
  pick('1');  out.one  = { lit: lit(), ask: s.querySelector('[data-csm-ask]').textContent.trim() };
  pick('10'); out.ten  = { lit: lit().length, ask: s.querySelector('[data-csm-ask]').textContent.trim() };
  pick('4');  out.four = { lit: lit(), ask: s.querySelector('[data-csm-ask]').textContent.trim(),
                           on: s.querySelectorAll('.csm-opt.is--on').length };
  out.verdict = s.querySelector('[data-csm-verdict]').textContent.trim().slice(0,42);
  return out;
})()`);

// 4 — gallery marquee: duplicated cells, drift advances
report.gallery = await evalJs(`(() => {
  const t = document.querySelector('[data-csm-gal-track]');
  const first = t.style.transform;
  return new Promise(res => setTimeout(() => res({
    cells: t.children.length, first: first || '(none)', later: t.style.transform || '(none)'
  }), 700));
})()`);

// 5 — process: scrolling lights bullets and fills the rail
report.process = await evalJs(`(() => {
  const s = document.querySelector('[data-csm-process]');
  s.scrollIntoView({block:'center'});
  window.scrollBy(0, 400);
  window.dispatchEvent(new Event('scroll'));
  return new Promise(res => setTimeout(() => res({
    fill: s.querySelector('[data-csm-proc-fill]').style.height,
    lit: s.querySelectorAll('.csm-proc__bullet.is--on').length
  }), 300));
})()`);

// 6 — faq: exactly one item open at a time
report.faq = await evalJs(`(() => {
  const s = document.querySelector('[data-csm-faq]');
  const items = s.querySelectorAll('[data-csm-faqitem]');
  const openCount = () => s.querySelectorAll('.csm-faq__item.is--open').length;
  const initial = openCount();
  items[2].querySelector('[data-csm-faqq]').click();
  const afterThird = { open: openCount(), thirdOpen: items[2].classList.contains('is--open') };
  items[2].querySelector('[data-csm-faqq]').click();
  return { initialOpen: initial, afterThird, afterToggleOff: openCount() };
})()`);

// 7 — form: submit swaps in the confirmation panel
report.form = await evalJs(`(() => {
  const s = document.querySelector('[data-csm-cta]');
  const f = s.querySelector('[data-csm-form]');
  f.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
  const done = s.querySelector('[data-csm-form-done]');
  return { formHidden: f.style.display === 'none',
           doneShown: done.classList.contains('is--shown') };
})()`);

// 8 — walk the whole page in steps, driven from Node so nothing races
const pageH = await evalJs(`document.body.scrollHeight`);
for (let y = 0; y < pageH + 1000; y += 600) {
  await evalJs(`window.scrollTo(0, ${y}); window.dispatchEvent(new Event('scroll'));`);
  await wait(90);
}
await wait(1000);
report.reveals = await evalJs(`(() => {
  const pre = document.querySelectorAll('.csm-pre').length;
  const inn = document.querySelectorAll('.csm-pre.csm-in').length;
  const stuck = Array.from(document.querySelectorAll('.csm-pre:not(.csm-in)'))
    .map(e => e.className.replace('csm-pre','').trim()).slice(0,8);
  return { total: pre, revealed: inn, stuckCount: pre - inn, stuckSample: stuck };
})()`);

// 9 — each marquee sampled while its own section is on screen. Both pause off
//     screen on purpose, so measuring them from the page bottom proves nothing.
async function driftOf(sectionSel, trackSel) {
  await evalJs(`document.querySelector('${sectionSel}').scrollIntoView({block:'center'})`);
  await wait(600);
  const a = await evalJs(`document.querySelector('${trackSel}').style.transform || '(none)'`);
  await wait(700);
  const b = await evalJs(`document.querySelector('${trackSel}').style.transform || '(none)'`);
  return { first: a, later: b, advanced: a !== b };
}
report.marquees = {
  marks: await driftOf('[data-csm-marks]', '[data-csm-marks-track]'),
  gallery: await driftOf('[data-csm-gallery]', '[data-csm-gal-track]')
};

report.jsErrors = errors;
console.log(JSON.stringify(report, null, 2));

ws.close(); chrome.kill();
try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
