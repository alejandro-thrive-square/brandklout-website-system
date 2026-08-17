// Behaviour probe for the implants landing conversion source, motion ENABLED.
// Verifies the JS/state carried in the per-section data-embeds before paste:
// before/after slider, lead form swap, FAQ details toggle + mark swap, step
// numbers, sticky header/form-card.
// Usage: node behave-implants.mjs <fileUrl> [settleMs]
import { spawn } from "node:child_process";
import fs from "node:fs"; import os from "node:os"; import path from "node:path"; import http from "node:http";

const [, , fileUrl, settleArg] = process.argv;
const settle = Number(settleArg) || 8000;
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
await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "no-preference" }] }, sessionId);
await send("Page.navigate", { url: fileUrl }, sessionId);
await wait(settle);

const evalJs = async (expr) => {
  const r = await send("Runtime.evaluate",
    { expression: expr, returnByValue: true, awaitPromise: true }, sessionId);
  return r?.result?.value ?? r?.result;
};

const report = {};

// 1 — before/after slider: input event drives clip-path, divider and knob
report.slider = await evalJs(`(() => {
  const range = document.getElementById('ba-range');
  const after = document.getElementById('ba-after');
  const clip0 = after.style.clipPath;
  range.value = 80;
  range.dispatchEvent(new Event('input', { bubbles: true }));
  return { init: clip0, at80: after.style.clipPath,
           divider: document.getElementById('ba-divider').style.left,
           knob: document.getElementById('ba-knob').style.left };
})()`);

// 2 — lead form: empty submit focuses, filled submit swaps to thanks view
report.form = await evalJs(`(() => {
  const form = document.getElementById('lead-form');
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  const blockedSwap = document.getElementById('thanks-view').style.display || '(none)';
  document.getElementById('f-name').value = 'Test Patient';
  document.getElementById('f-phone').value = '(703) 555-0000';
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  return { guardHeld: blockedSwap !== 'block',
           formView: document.getElementById('form-view').style.display,
           thanksView: document.getElementById('thanks-view').style.display,
           inited: form.dataset.impInit === '1' };
})()`);

// 3 — FAQ: native details toggle + plus/minus mark swap
report.faq = await evalJs(`(() => {
  const d = document.querySelectorAll('details')[1];
  const vis = el => getComputedStyle(el).display;
  const openMark = d.querySelector('.imp-fmark-open');
  const closeMark = d.querySelector('.imp-fmark-close');
  const closed = { open: vis(openMark), close: vis(closeMark) };
  d.setAttribute('open', '');
  const opened = { open: vis(openMark), close: vis(closeMark),
                   answer: vis(d.querySelector('.imp-a')) };
  return { count: document.querySelectorAll('details').length, closed, opened };
})()`);

// 4 — step numbers rendered explicitly (counters were replaced)
report.steps = await evalJs(`(() =>
  [...document.querySelectorAll('.imp-stepnum')].map(s => s.textContent).join('')
)()`);

// 5 — sticky header + sticky form card resolve (no overflow ancestor kills them)
report.sticky = await evalJs(`(() => {
  const out = [];
  for (const el of document.querySelectorAll('*')) {
    if (getComputedStyle(el).position === 'sticky') {
      let blocked = null, a = el.parentElement;
      while (a) {
        const o = getComputedStyle(a).overflow + getComputedStyle(a).overflowX + getComputedStyle(a).overflowY;
        if (/hidden|auto|scroll/.test(o)) { blocked = a.className || a.tagName; break; }
        a = a.parentElement;
      }
      out.push({ el: (el.className || el.tagName).toString().slice(0, 40), blocked });
    }
  }
  return out;
})()`);

report.jsErrors = errors;
console.log(JSON.stringify(report, null, 2));
chrome.kill();
process.exit(0);
