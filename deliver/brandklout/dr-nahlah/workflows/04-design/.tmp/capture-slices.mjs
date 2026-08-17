// Scroll-slice screenshot driver.
//
// ScrollSmoother transforms #smooth-content, so `captureBeyondViewport` full-page
// shots are garbage on this build (see style-direction-gsap.md, gotcha 3). This
// scrolls the page in viewport-sized steps, lets the scrubbed timelines settle,
// and captures a real viewport each time.
//
// Usage: node capture-slices.mjs <url> <outDir> [width] [height] [stepFactor]
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";

const url = process.argv[2];
const outDir = process.argv[3];
const W = +(process.argv[4] || 1440);
const H = +(process.argv[5] || 900);
const STEP = +(process.argv[6] || 0.85); // overlap slightly so nothing falls between shots
if (!url || !outDir) { console.error("usage: capture-slices.mjs <url> <outDir> [w] [h] [step]"); process.exit(1); }
fs.mkdirSync(outDir, { recursive: true });

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9400 + Math.floor(Math.random() * 300);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-slice-"));
const chrome = spawn(CHROME, [
  "--headless=new", "--disable-gpu", "--hide-scrollbars",
  `--remote-debugging-port=${PORT}`, "--remote-allow-origins=*",
  "--force-device-scale-factor=1", `--window-size=${W},${H}`,
  "--no-first-run", "--no-default-browser-check",
  "--autoplay-policy=no-user-gesture-required",
  `--user-data-dir=${profile}`, "about:blank",
]);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const getJSON = (p) => new Promise((res, rej) => {
  http.get({ host: "127.0.0.1", port: PORT, path: p }, (r) => {
    let d = ""; r.on("data", (c) => (d += c)); r.on("end", () => res(JSON.parse(d)));
  }).on("error", rej);
});
async function findWs() {
  for (let i = 0; i < 150; i++) {
    try { const v = await getJSON("/json/version"); if (v.webSocketDebuggerUrl) return v.webSocketDebuggerUrl; } catch {}
    await wait(300);
  }
  throw new Error("CDP did not start");
}
const ws = new WebSocket(await findWs());
let id = 0; const pending = new Map();
ws.addEventListener("message", async (ev) => {
  const raw = typeof ev.data === "string" ? ev.data : await ev.data.text();
  const m = JSON.parse(raw);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
});
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
function send(method, params = {}, sessionId) {
  return new Promise((res, rej) => {
    const mid = ++id;
    const t = setTimeout(() => rej(new Error("timeout " + method)), 45000);
    pending.set(mid, (m) => { clearTimeout(t); m.error ? rej(new Error(m.error.message)) : res(m.result); });
    ws.send(JSON.stringify({ id: mid, method, params, sessionId }));
  });
}
const { targetInfos } = await send("Target.getTargets");
let pt = targetInfos.find((t) => t.type === "page");
if (!pt) pt = { targetId: (await send("Target.createTarget", { url: "about:blank" })).targetId };
const { sessionId } = await send("Target.attachToTarget", { targetId: pt.targetId, flatten: true });
await send("Page.enable", {}, sessionId);
await send("Runtime.enable", {}, sessionId);
await send("Emulation.setDeviceMetricsOverride",
  { width: W, height: H, deviceScaleFactor: 1, mobile: W < 700 }, sessionId);

const evalJs = async (expr) => {
  const r = await send("Runtime.evaluate",
    { expression: expr, returnByValue: true, awaitPromise: true }, sessionId);
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + " :: " + expr.slice(0, 80));
  return r.result.value;
};

await send("Page.navigate", { url }, sessionId);
await wait(3500);
await evalJs(`document.fonts ? document.fonts.ready.then(()=>1) : 1`);
await wait(1200);

// ScrollSmoother owns scrolling; window.scrollTo alone desyncs the pinned chapters.
//
// One jump is not enough: ScrollSmoother eases toward the target over ~1s, so a
// screenshot taken straight after lands mid-pin-release and shows layouts that
// no real reader ever sees (a pinned caption floating over the *next* section,
// for one). Set the position, let it settle, then set it again and force two
// ScrollTrigger updates across a frame boundary.
const settle = (y) => evalJs(`(function(){
  var s = window.WZ && WZ.smoother;
  if (s && s.scrollTop) { s.scrollTop(${y}); }
  else if (s && s.scrollTo) { s.scrollTo(${y}, false); }
  else { window.scrollTo(0, ${y}); }
  if (window.ScrollTrigger) ScrollTrigger.update();
  return new Promise(function(res){
    requestAnimationFrame(function(){
      if (window.ScrollTrigger) ScrollTrigger.update();
      requestAnimationFrame(function(){ res(true); });
    });
  });
})()`);
const scrollTo = async (y) => { await settle(y); await wait(250); await settle(y); };

const maxScroll = await evalJs(`(function(){
  var s = window.WZ && WZ.smoother;
  if (window.ScrollTrigger) return ScrollTrigger.maxScroll(window);
  return document.documentElement.scrollHeight - window.innerHeight;
})()`);

const step = Math.round(H * STEP);
const shots = [];
let i = 0;
for (let y = 0; ; y += step, i++) {
  const target = Math.min(y, maxScroll);
  await scrollTo(target);
  await wait(900); // let scrubbed timelines + reveals settle at this position
  const { data } = await send("Page.captureScreenshot", { format: "jpeg", quality: 82 }, sessionId);
  const name = `s${String(i).padStart(2, "0")}.jpg`;
  fs.writeFileSync(path.join(outDir, name), Buffer.from(data, "base64"));
  shots.push({ name, y: target });
  if (target >= maxScroll) break;
  if (i > 60) break;
}
fs.writeFileSync(path.join(outDir, "manifest.json"),
  JSON.stringify({ url, viewport: `${W}x${H}`, maxScroll, step, shots }, null, 2));
console.log(`captured ${shots.length} slices @ ${W}x${H} (maxScroll=${Math.round(maxScroll)}) -> ${outDir}`);
ws.close(); chrome.kill();
process.exit(0);
