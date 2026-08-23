// Full-resolution tiled capture for the very tall LP pages: the main harness has to
// scale those down to ~180px wide to dodge captureBeyondViewport's wrap limit, which
// makes mobile defects invisible. Here each tile is a dsf=1 clip, so text is legible.
// Usage: node tiles.mjs <outDir> <slug> <width> [tileH=1800]
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";

const [, , OUT, SLUG, W, TH = "1800"] = process.argv;
const WIDTH = +W, TILE = +TH;
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = "https://mason-park-dental.webflow.io";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const PORT = 9500 + Math.floor(Math.random() * 90);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-tiles-"));
const vh = WIDTH <= 430 ? 844 : 900;
const chrome = spawn(CHROME, [
  "--headless=new", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
  "--hide-scrollbars", "--force-prefers-reduced-motion", "--disable-smooth-scrolling",
  `--window-size=${WIDTH},${vh}`, `--remote-debugging-port=${PORT}`, "--remote-allow-origins=*",
  "--force-device-scale-factor=1", "--no-first-run", "--disable-background-timer-throttling",
  "--disable-backgrounding-occluded-windows", "--disable-renderer-backgrounding",
  `--user-data-dir=${profile}`, "about:blank",
]);
const getJSON = (p) => new Promise((res, rej) => {
  http.get({ host: "127.0.0.1", port: PORT, path: p }, (r) => {
    let d = ""; r.on("data", (c) => (d += c)); r.on("end", () => res(JSON.parse(d)));
  }).on("error", rej);
});
let wsUrl = null;
for (let i = 0; i < 80 && !wsUrl; i++) { try { wsUrl = (await getJSON("/json/version")).webSocketDebuggerUrl; } catch {} if (!wsUrl) await wait(200); }
const ws = new WebSocket(wsUrl);
let id = 0; const pend = new Map();
ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } });
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
const send = (method, params = {}, sessionId) => new Promise((res, rej) => {
  const i = ++id; pend.set(i, (m) => (m.error ? rej(new Error(`${method}: ${m.error.message}`)) : res(m.result)));
  ws.send(JSON.stringify({ id: i, method, params, sessionId }));
});
const { targetInfos } = await send("Target.getTargets");
const t = targetInfos.find((x) => x.type === "page");
const { sessionId } = await send("Target.attachToTarget", { targetId: t.targetId, flatten: true });
await send("Page.enable", {}, sessionId);
await send("Runtime.enable", {}, sessionId);
await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] }, sessionId);
await send("Emulation.setDeviceMetricsOverride", { width: WIDTH, height: vh, deviceScaleFactor: 1, mobile: WIDTH <= 430 }, sessionId);
const ev = (e) => send("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true }, sessionId).then((r) => r?.result?.value);

await send("Page.navigate", { url: `${BASE}/${SLUG}` }, sessionId);
for (let i = 0; i < 90; i++) { if (await ev("document.readyState") === "complete") break; await wait(300); }
await ev(`(async () => {
  const step = Math.max(300, innerHeight * 0.7);
  const max = () => document.documentElement.scrollHeight;
  for (let y = 0; y < max(); y += step) { scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); }
  scrollTo(0, max()); await new Promise(r => setTimeout(r, 600)); scrollTo(0, 0);
  await new Promise(r => setTimeout(r, 400)); return true; })()`);
let prev = -1, quiet = Date.now(), h = 0, start = Date.now();
while (Date.now() - start < 30_000) {
  h = await ev("document.body.scrollHeight");
  if (Math.abs(h - prev) > 4) quiet = Date.now();
  prev = h;
  if (h > 0 && Date.now() - quiet >= 3000) break;
  await wait(500);
}
console.log("body", h);
const dir = path.join(OUT, SLUG);
fs.mkdirSync(dir, { recursive: true });
const n = Math.ceil(h / TILE);
for (let i = 0; i < n; i++) {
  const y = i * TILE;
  const hh = Math.min(TILE, h - y);
  const { data } = await send("Page.captureScreenshot", {
    format: "png", captureBeyondViewport: true,
    clip: { x: 0, y, width: WIDTH, height: hh, scale: 1 },
  }, sessionId);
  const f = path.join(dir, `t${WIDTH}-${String(i + 1).padStart(2, "0")}.png`);
  fs.writeFileSync(f, Buffer.from(data, "base64"));
  console.log(f, `${WIDTH}x${hh} @y${y}`);
}
ws.close(); chrome.kill();
try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
