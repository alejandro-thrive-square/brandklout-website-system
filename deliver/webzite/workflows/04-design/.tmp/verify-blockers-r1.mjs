// Verifies iteration-1 blocker fixes:
//  B2: .eq-rule resolves to a scaleX draw (not the generic translateY reveal).
//  B1: below-fold reveals keep staggered --reveal-delay (clamped, not zeroed).
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
const errors = [];
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
await send("Runtime.enable", {}, sessionId);
await send("Log.enable", {}, sessionId);
ws.addEventListener("message", (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.method === "Runtime.exceptionThrown") errors.push("exception: " + JSON.stringify(msg.params.exceptionDetails.text || msg.params.exceptionDetails));
  if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error") errors.push("console.error: " + msg.params.args.map(a => a.value).join(" "));
  if (msg.method === "Log.entryAdded" && msg.params.entry.level === "error") errors.push("log: " + msg.params.entry.text);
});
await send("Page.enable", {}, sessionId);
await send("Page.navigate", { url: fileUrl }, sessionId);
await wait(3500);

const { result } = await send("Runtime.evaluate", {
  expression: `(() => {
    const rule = document.querySelector('.eq-rule');
    // B2: strip is-visible and read the resolved START transform — must be scaleX(0)
    // = matrix(0,0,0,1,0,0), NOT the generic translateY(22px) reveal.
    rule.classList.remove('is-visible');
    const startTf = getComputedStyle(rule).transform;
    const startOpacity = getComputedStyle(rule).opacity;
    rule.classList.add('is-visible');
    const endTf = getComputedStyle(rule).transform;

    // B1: scroll below-fold groups into view, then read the delays the observer set.
    const rateCalc = document.querySelector('.rate-calc');
    rateCalc.scrollIntoView({ block: 'center' });
    return { startTf, startOpacity, endTf };
  })()`,
  returnByValue: true,
}, sessionId);

await wait(900);

const { result: delays } = await send("Runtime.evaluate", {
  expression: `(() => {
    const read = (el) => el ? {
      delay: getComputedStyle(el).getPropertyValue('--reveal-delay').trim(),
      visible: el.classList.contains('is-visible'),
    } : null;
    return {
      capCards: [...document.querySelectorAll('.cap-card')].map(read),
      thesis2: read(document.querySelectorAll('.thesis-body p')[1]),
      rateCalc: read(document.querySelector('.rate-calc')),
      metricsVisible: document.querySelector('[data-metrics]').classList.contains('is-visible'),
      counts: [...document.querySelectorAll('[data-count]')].map(e => e.textContent),
    };
  })()`,
  returnByValue: true,
}, sessionId);

console.log("B2 eq-rule:", JSON.stringify(result.value));
console.log("B1 delays:", JSON.stringify(delays.value));
console.log("errors:", JSON.stringify(errors));
ws.close(); chrome.kill(); process.exit(0);
