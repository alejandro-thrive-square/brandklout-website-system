// Reshoot the four wrapped screenshots (LP 1440 + 390): captureBeyondViewport
// wraps past ~8192 DEVICE px in this SwiftShader config, so scale each capture
// to fit under it (dsf = 8100 / bodyHeight). Everything else stays as captured.
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";

const OUT = path.dirname(fileURLToPath(import.meta.url));
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = "https://mason-park-dental.webflow.io";
const JOBS = [
  { slug: "new-patient-special", widths: [1440, 390] },
  { slug: "invisalign", widths: [1440, 390] },
];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

async function session(fn, { width, height }) {
  const PORT = 9920 + Math.floor(Math.random() * 60);
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-reshoot-"));
  const chrome = spawn(CHROME, [
    "--headless=new",
    "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
    "--hide-scrollbars", "--force-prefers-reduced-motion", "--disable-smooth-scrolling",
    `--window-size=${width},${height}`, `--remote-debugging-port=${PORT}`,
    "--remote-allow-origins=*", "--force-device-scale-factor=1", "--no-first-run",
    "--disable-background-timer-throttling", "--disable-backgrounding-occluded-windows",
    "--disable-renderer-backgrounding", `--user-data-dir=${profile}`, "about:blank",
  ]);
  const getJSON = (p) => new Promise((res, rej) => {
    http.get({ host: "127.0.0.1", port: PORT, path: p }, (r) => {
      let d = ""; r.on("data", (c) => (d += c)); r.on("end", () => res(JSON.parse(d)));
    }).on("error", rej);
  });
  let wsUrl = null;
  for (let i = 0; i < 80 && !wsUrl; i++) {
    try { wsUrl = (await getJSON("/json/version")).webSocketDebuggerUrl; } catch {}
    if (!wsUrl) await wait(200);
  }
  const ws = new WebSocket(wsUrl);
  let id = 0; const pend = new Map();
  ws.addEventListener("message", (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); }
  });
  await new Promise((r) => ws.addEventListener("open", r, { once: true }));
  const send = (method, params = {}, sessionId) => new Promise((res, rej) => {
    const i = ++id;
    pend.set(i, (m) => (m.error ? rej(new Error(`${method}: ${m.error.message}`)) : res(m.result)));
    ws.send(JSON.stringify({ id: i, method, params, sessionId }));
  });
  const { targetInfos } = await send("Target.getTargets");
  const t = targetInfos.find((x) => x.type === "page");
  const { sessionId } = await send("Target.attachToTarget", { targetId: t.targetId, flatten: true });
  await send("Page.enable", {}, sessionId);
  await send("Runtime.enable", {}, sessionId);
  await send("Emulation.setEmulatedMedia",
    { features: [{ name: "prefers-reduced-motion", value: "reduce" }] }, sessionId);
  const evaluate = (expr) =>
    send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true }, sessionId)
      .then((r) => r?.result?.value);
  try { return await fn({ send, sessionId, evaluate }); }
  finally {
    try { ws.close(); } catch {}
    chrome.kill();
    await new Promise((r) => { if (chrome.exitCode !== null) return r(); chrome.once("exit", r); setTimeout(r, 2500); });
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
  }
}

const WALK = `(async () => {
  const step = Math.max(300, innerHeight * 0.7);
  const max = () => document.documentElement.scrollHeight;
  for (let y = 0; y < max(); y += step) { scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); }
  scrollTo(0, max()); await new Promise(r => setTimeout(r, 600));
  scrollTo(0, 0); await new Promise(r => setTimeout(r, 400));
  return true;
})()`;

async function settle(evaluate) {
  const start = Date.now();
  let prev = -1, quietSince = Date.now(), h = 0;
  while (Date.now() - start < 30_000) {
    h = await evaluate("document.body ? document.body.scrollHeight : 0");
    if (Math.abs(h - prev) > 4) quietSince = Date.now();
    prev = h;
    if (h > 0 && Date.now() - quietSince >= 3_000) break;
    await wait(500);
  }
  return h;
}

for (let j = 0; j < JOBS.length; j++) {
  if (j > 0) { log("waiting 70s (CDN throttle)"); await wait(70_000); }
  const { slug, widths } = JOBS[j];
  log(`=== ${slug} ===`);
  await session(async ({ send, sessionId, evaluate }) => {
    for (const width of widths) {
      const vh = width <= 430 ? 844 : 900;
      const mobile = width <= 430;
      await send("Emulation.setDeviceMetricsOverride",
        { width, height: vh, deviceScaleFactor: 1, mobile }, sessionId);
      if (width === widths[0]) {
        await send("Page.navigate", { url: `${BASE}/${slug}` }, sessionId);
        const start = Date.now();
        while (Date.now() - start < 25_000) {
          let s = null; try { s = await evaluate("document.readyState"); } catch {}
          if (s === "complete") break;
          await wait(300);
        }
      } else { await wait(800); }
      await evaluate(WALK);
      const bodyH = await settle(evaluate);
      const dsf = Math.min(1, Math.round((8100 / bodyH) * 1000) / 1000);
      await send("Emulation.setDeviceMetricsOverride",
        { width, height: vh, deviceScaleFactor: dsf, mobile }, sessionId);
      await wait(500);
      const { data } = await send("Page.captureScreenshot",
        { format: "png", captureBeyondViewport: true }, sessionId);
      const png = Buffer.from(data, "base64");
      fs.writeFileSync(path.join(OUT, slug, `${width}.png`), png);
      log(`${slug}: ${width}.png (${(png.length / 1024).toFixed(0)}KB, body ${bodyH}px, dsf ${dsf})`);
      await send("Emulation.setDeviceMetricsOverride",
        { width, height: vh, deviceScaleFactor: 1, mobile }, sessionId);
    }
  }, { width: 1440, height: 900 });
}
log("RESHOOT DONE");
