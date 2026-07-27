// Loads page, no scrolling, waits, reports reveal state of hero children.
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";

const [, , fileUrl] = process.argv;
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9333 + Math.floor(Math.random() * 400);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-"));
const chrome = spawn(CHROME, [
  "--headless=new", "--disable-gpu", "--hide-scrollbars",
  `--remote-debugging-port=${PORT}`, "--remote-allow-origins=*",
  "--force-device-scale-factor=1", "--window-size=1440,1000",
  "--no-first-run", "--no-default-browser-check",
  `--user-data-dir=${profile}`, "about:blank",
]);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function getJSON(p) {
  return new Promise((resolve, reject) => {
    http.get({ host: "127.0.0.1", port: PORT, path: p }, (res) => {
      let d = ""; res.on("data", (c) => (d += c)); res.on("end", () => resolve(JSON.parse(d)));
    }).on("error", reject);
  });
}
async function findWs() {
  for (let i = 0; i < 40; i++) {
    try { const v = await getJSON("/json/version"); if (v.webSocketDebuggerUrl) return v.webSocketDebuggerUrl; } catch {}
    await wait(200);
  }
  throw new Error("no CDP");
}
const ws = new WebSocket(await findWs());
let id = 0; const pending = new Map();
ws.addEventListener("message", (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg.result); pending.delete(msg.id); }
});
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
function send(method, params = {}, sessionId) {
  return new Promise((resolve) => { const mid = ++id; pending.set(mid, resolve); ws.send(JSON.stringify({ id: mid, method, params, sessionId })); });
}
const { targetInfos } = await send("Target.getTargets");
const pageTarget = targetInfos.find((t) => t.type === "page");
const { sessionId } = await send("Target.attachToTarget", { targetId: pageTarget.targetId, flatten: true });
await send("Page.enable", {}, sessionId);
await send("Page.navigate", { url: fileUrl }, sessionId);
await wait(3500);
const { result } = await send("Runtime.evaluate", {
  expression: `JSON.stringify({
    innerH: window.innerHeight,
    heroRect: document.querySelector('.hero').getBoundingClientRect().toJSON(),
    metrics: (() => { const m = document.querySelector('[data-metrics]'); const r = m.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom, visible: m.classList.contains('is-visible'), opacity: getComputedStyle(m).opacity }; })(),
    counts: [...document.querySelectorAll('[data-count]')].map(e => e.textContent),
    heroFootVisible: document.querySelector('.hero-cta').classList.contains('is-visible'),
    eqRows: [...document.querySelectorAll('.eq-row')].map(e => e.classList.contains('is-visible')),
  })`,
  returnByValue: true,
}, sessionId);
console.log(result.value);
ws.close(); chrome.kill(); process.exit(0);
