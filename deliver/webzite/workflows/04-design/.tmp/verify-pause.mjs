// Probe: confirm the testimonial pause toggle is visible + functional in
// normal motion, and that hover pauses auto-rotation.
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
let chromeErr = "";
chrome.stderr.on("data", (d) => (chromeErr += d));
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
  throw new Error("no CDP\n" + chromeErr.slice(0, 500));
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
await send("Runtime.enable", {}, sessionId);
await send("Page.navigate", { url: fileUrl }, sessionId);
await wait(2000);

const { result } = await send("Runtime.evaluate", {
  expression: `(async () => {
    const btn = document.querySelector('[data-quote-pause]');
    const root = document.querySelector('[data-testimonials]');
    const rect = btn.getBoundingClientRect();
    const visible = rect.width > 0 && rect.height > 0 && getComputedStyle(btn).display !== 'none' && !btn.hidden;
    const before = document.querySelector('[data-quote]').textContent;
    // click pause -> aria-pressed true, is-paused class
    btn.click();
    const pressed = btn.getAttribute('aria-pressed');
    const pausedClass = btn.classList.contains('is-paused');
    const label = btn.getAttribute('aria-label');
    // click again -> resume
    btn.click();
    const pressed2 = btn.getAttribute('aria-pressed');
    // hover pause: dispatch pointerenter, wait > interval, ensure quote unchanged
    root.dispatchEvent(new Event('pointerenter'));
    await new Promise(r => setTimeout(r, 5600));
    const afterHover = document.querySelector('[data-quote]').textContent;
    root.dispatchEvent(new Event('pointerleave'));
    const activeDot = document.querySelectorAll('[data-testimonial].is-active').length;
    const ariaCurrent = document.querySelectorAll('[data-testimonial][aria-current="true"]').length;
    return JSON.stringify({ visible, pressed, pausedClass, label, pressed2, hoverHeldQuote: before === afterHover, activeDot, ariaCurrent });
  })()`,
  returnByValue: true, awaitPromise: true,
}, sessionId);
console.log("PAUSE PROBE:", result.value);
ws.close(); chrome.kill(); process.exit(0);
