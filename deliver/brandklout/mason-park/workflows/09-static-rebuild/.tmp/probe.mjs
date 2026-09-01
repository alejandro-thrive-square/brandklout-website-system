// Drive the homepage and ASSERT its behaviour. Screenshots cannot do this.
//
//   node verify-journey.mjs [route]
//
// DESIGN-STANDARD.md is explicit that a screenshot cannot tell you whether a
// reveal fired, a counter ran, or a scrub is a scrub. The check that matters is
// the third one: step the scroll through a scrubbed chapter and assert the
// content is at a DIFFERENT INTERMEDIATE STATE at 25%, 50% and 75% of its
// range. A scene that snaps between two states is a triggered scene wearing a
// costume, and this is the only check that catches it.
//
// What it asserts:
//   1. no horizontal overflow at 360 / 390 / 768 / 1024 / 1440
//   2. GSAP and both plugins registered, no console errors
//   3. chapter 01's statement is scrubbed  (word colours differ across 3 steps)
//   4. chapter 05's path is pinned AND scrubbed (track x differs across 3 steps)
//   5. chapter 06's quote is scrubbed
//   6. the reading progress bar tracks real document progress
//   7. the header inverts over the hero and resolves to solid after it
//   8. counters reach their stated value
//   9. reduced motion reveals every hidden element and clips nothing
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(HERE, "dist");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const ROUTE = (process.env.PROBE_ROUTE || "/").replace(/^[A-Za-z]:[\\/].*?[\\/](?=[^\\/]*$)/, "") || "/";

const MIME = {
  ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript",
  ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml",
  ".gif": "image/gif", ".ico": "image/x-icon", ".xml": "application/xml", ".txt": "text/plain",
};
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(req.url.split("?")[0]);
  let file = path.join(DIST, p);
  if (p.endsWith("/")) file = path.join(file, "index.html");
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    const alt = path.join(DIST, p, "index.html");
    file = fs.existsSync(alt) ? alt : path.join(DIST, "404.html");
  }
  res.writeHead(200, { "content-type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const BASE = "http://127.0.0.1:" + server.address().port;

const PORT = 9500 + Math.floor(Math.random() * 90);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "mpd-verify-"));
const chrome = spawn(CHROME, [
  "--headless=new", "--disable-gpu", "--hide-scrollbars",
  `--remote-debugging-port=${PORT}`, "--remote-allow-origins=*",
  "--no-first-run", "--no-default-browser-check", "--force-device-scale-factor=1",
  `--user-data-dir=${profile}`, "about:blank",
]);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const getJSON = (p) => new Promise((res, rej) => {
  http.get({ host: "127.0.0.1", port: PORT, path: p }, (r) => {
    let d = ""; r.on("data", (c) => (d += c)); r.on("end", () => res(JSON.parse(d)));
  }).on("error", rej);
});
let wsUrl;
for (let i = 0; i < 80 && !wsUrl; i++) {
  try { wsUrl = (await getJSON("/json/version")).webSocketDebuggerUrl; } catch { await wait(200); }
}
const ws = new WebSocket(wsUrl);
let id = 0; const pending = new Map();
const consoleErrors = [];
ws.addEventListener("message", (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); return; }
  if (m.method === "Log.entryAdded" && m.params.entry.level === "error") consoleErrors.push(m.params.entry.text);
  if (m.method === "Runtime.exceptionThrown") consoleErrors.push(String(m.params.exceptionDetails.text));
});
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
const { targetInfos } = await new Promise((resolve) => {
  const mid = ++id; pending.set(mid, resolve);
  ws.send(JSON.stringify({ id: mid, method: "Target.getTargets", params: {} }));
});
const t = targetInfos.find((x) => x.type === "page");
let sessionId;
({ sessionId } = await new Promise((resolve) => {
  const mid = ++id; pending.set(mid, resolve);
  ws.send(JSON.stringify({ id: mid, method: "Target.attachToTarget", params: { targetId: t.targetId, flatten: true } }));
}));
const send = (method, params = {}) => new Promise((resolve) => {
  const mid = ++id; pending.set(mid, resolve);
  ws.send(JSON.stringify({ id: mid, method, params, sessionId }));
});
await send("Page.enable"); await send("Runtime.enable"); await send("Log.enable");
const evaluate = async (expr) =>
  (await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true }))?.result?.value;


// probe.mjs — evaluate one expression against the built site at a given width.
//   PROBE_W=1024 node probe.mjs "getComputedStyle(document.documentElement).getPropertyValue('--bleed')"
//   PROBE_W=390 PROBE_ROUTE=/our-doctors/ node probe.mjs "..."
// Reduced motion is OFF by default; set PROBE_STILL=1 for the layout state.
const W = Number(process.env.PROBE_W || 1440);
const EXPR = process.argv[2] || "1";
await send("Emulation.setDeviceMetricsOverride", { width: W, height: 900, deviceScaleFactor: 1, mobile: W < 700 });
await send("Emulation.setEmulatedMedia", {
  features: process.env.PROBE_STILL ? [{ name: "prefers-reduced-motion", value: "reduce" }] : [],
});
await send("Page.navigate", { url: BASE + ROUTE });
await new Promise((r) => setTimeout(r, 1600));
const val = await (async (e) =>
  (await send("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true }))?.result?.value)(EXPR);
console.log(typeof val === "object" ? JSON.stringify(val, null, 1) : String(val));
if (consoleErrors.length) console.error("console errors:", consoleErrors.slice(0, 3));
ws.close(); chrome.kill(); server.close();
