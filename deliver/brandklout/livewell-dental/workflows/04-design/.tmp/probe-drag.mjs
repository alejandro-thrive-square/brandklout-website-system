// Real-mouse drag probe for the before/after slider (CDP Input events, not
// synthetic dispatchEvent) against a local replica of the published DOM.
// Usage: node probe-drag.mjs <fileUrl> [settleMs]
import { spawn } from "node:child_process";
import fs from "node:fs"; import os from "node:os"; import path from "node:path"; import http from "node:http";

const [, , fileUrl, settleArg] = process.argv;
const settle = Number(settleArg) || 6000;
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
await send("Page.navigate", { url: fileUrl }, sessionId);
await wait(settle);

const evalJs = async (expr) => {
  const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true }, sessionId);
  if (r?.exceptionDetails) console.log("EVAL EXCEPTION:", JSON.stringify(r.exceptionDetails.exception?.description || r.exceptionDetails.text));
  return r?.result?.value;
};

// scroll slider into view (instant), settle, then measure + hit test
await evalJs(`document.getElementById('ba').scrollIntoView({ block: 'center', behavior: 'instant' })`);
await wait(500);
const pre = await evalJs(`(() => {
  const ba = document.getElementById('ba');
  const r = ba.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const hit = document.elementFromPoint(cx, cy);
  return { rect: { x: r.left, y: r.top, w: r.width, h: r.height }, cx, cy,
           hit: (hit.tagName + '#' + (hit.id || '') + '.' + hit.className).slice(0, 80),
           clip: document.getElementById('ba-after').style.clipPath };
})()`);
console.log("pre:", JSON.stringify(pre));

// real mouse drag: press at center, move to 80% width, release
const { cx, cy, rect } = pre;
const endX = rect.x + rect.w * 0.8;
await send("Input.dispatchMouseEvent", { type: "mousePressed", x: cx, y: cy, button: "left", clickCount: 1 }, sessionId);
for (let i = 1; i <= 8; i++) {
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: cx + (endX - cx) * i / 8, y: cy, button: "left", buttons: 1 }, sessionId);
  await wait(30);
}
await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: endX, y: cy, button: "left", clickCount: 1 }, sessionId);
await wait(300);

const post = await evalJs(`(() => ({
  rangeValue: document.getElementById('ba-range').value,
  clip: document.getElementById('ba-after').style.clipPath,
  divider: document.getElementById('ba-divider').style.left
}))()`);
console.log("post-drag:", JSON.stringify(post));
console.log("jsErrors:", JSON.stringify(errors));
chrome.kill();
process.exit(0);
