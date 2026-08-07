/* overflow-probe.mjs — name what actually overflows the viewport at a given
 * width on the LIVE page. root-proof reports scrollWidth > innerWidth; this
 * says which element causes it.
 *
 * Elements clipped by an overflow ancestor are skipped: the horizontal
 * chapters travel in from off-screen by design and are not overflow.
 *
 * Usage: MPD_BASE_URL=https://... node overflow-probe.mjs <slug> [width]
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const CHROME = process.env.CHROME_PATH ||
  "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = process.env.MPD_BASE_URL || "";
const SLUG = process.argv[2] || "invisalign";
const W = Number(process.argv[3] || 478);
const PORT = 9500 + Math.floor(Math.random() * 400);

const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-ovf-"));
const chrome = spawn(CHROME, [
  "--headless=new", "--use-gl=angle", "--use-angle=swiftshader",
  "--enable-unsafe-swiftshader", "--hide-scrollbars",
  `--window-size=${W},900`, `--remote-debugging-port=${PORT}`,
  "--remote-allow-origins=*", "--force-device-scale-factor=1", "--no-first-run",
  `--user-data-dir=${profile}`, "about:blank",
], { stdio: "ignore" });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let wsUrl = null;
for (let i = 0; i < 60 && !wsUrl; i++) {
  await sleep(300);
  try {
    const r = await fetch(`http://127.0.0.1:${PORT}/json/version`);
    wsUrl = (await r.json()).webSocketDebuggerUrl;
  } catch {}
}
if (!wsUrl) { chrome.kill(); throw new Error("chrome did not expose CDP"); }

const ws = new WebSocket(wsUrl);
await new Promise((res) => ws.addEventListener("open", res, { once: true }));
let id = 0;
const pending = new Map();
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
});
const send = (method, params = {}, sessionId) => new Promise((res, rej) => {
  const n = ++id;
  pending.set(n, (m) => (m.error ? rej(new Error(m.error.message)) : res(m.result)));
  ws.send(JSON.stringify({ id: n, method, params, ...(sessionId ? { sessionId } : {}) }));
});

const { targetInfos } = await send("Target.getTargets");
const page = targetInfos.find((t) => t.type === "page");
const { sessionId } = await send("Target.attachToTarget", { targetId: page.targetId, flatten: true });
await send("Page.enable", {}, sessionId);
await send("Runtime.enable", {}, sessionId);
await send("Emulation.setDeviceMetricsOverride",
  { width: W, height: 900, deviceScaleFactor: 1, mobile: true }, sessionId);
await send("Page.navigate", { url: `${BASE}/${SLUG}` }, sessionId);
await sleep(4000);

const expr = `(() => {
  const vw = document.documentElement.clientWidth;
  const bad = [];
  for (const el of document.querySelectorAll("*")) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    if (r.right <= vw + 1 && r.left >= -1) continue;
    let clipped = false;
    // body carries overflow-x:clip site-wide, so counting it as a clipping
    // ancestor hides every real offender. Walk only true in-page containers.
    for (let p = el.parentElement; p && p !== document.body &&
         p !== document.documentElement; p = p.parentElement) {
      const s = getComputedStyle(p);
      if (s.overflowX !== "visible" || s.overflow !== "visible") { clipped = true; break; }
    }
    if (clipped) continue;
    bad.push(el.tagName + "#" + (el.id || "-") + "." +
      String(el.className || "").split(/\\s+/).slice(0,3).join(".") +
      "  left=" + Math.round(r.left) + " right=" + Math.round(r.right) +
      " w=" + Math.round(r.width));
  }
  return JSON.stringify({ vw, sw: document.documentElement.scrollWidth,
    n: bad.length, bad: bad.slice(0, 14) });
})()`;
const { result } = await send("Runtime.evaluate", { expression: expr, returnByValue: true }, sessionId);
const out = JSON.parse(result.value);
console.log(`${SLUG} @ ${W}: viewport ${out.vw} | scrollWidth ${out.sw} | unclipped overflowing: ${out.n}`);
for (const b of out.bad) console.log("  " + b);

ws.close(); chrome.kill();
try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
