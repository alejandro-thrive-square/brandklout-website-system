// Minimal CDP full-page screenshot driver (Node 22 built-in WebSocket).
// Usage: node shot.mjs <fileUrl> <outPng> <width> [reducedMotion] [settleMs]
//
// settleMs matters for pages with MANY inline <script> blocks: a pending
// external stylesheet (Google Fonts) blocks inline script execution, which
// blocks the parser, so the tail of the document can still be unparsed
// seconds in. Pages with per-section script embeds need ~12000.
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";

const [, , fileUrl, outPng, widthArg, reduced, settleArg] = process.argv;
const width = Number(widthArg) || 1440;
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9333 + Math.floor(Math.random() * 400);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-"));

const chrome = spawn(CHROME, [
  "--headless=new",
  "--disable-gpu",
  "--hide-scrollbars",
  `--remote-debugging-port=${PORT}`,
  "--remote-allow-origins=*",
  "--force-device-scale-factor=1",
  `--window-size=${width},1000`,
  "--no-first-run",
  "--no-default-browser-check",
  `--user-data-dir=${profile}`,
  "about:blank",
]);
let chromeErr = "";
chrome.stderr.on("data", (d) => (chromeErr += d));

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJSON(path) {
  return new Promise((resolve, reject) => {
    http
      .get({ host: "127.0.0.1", port: PORT, path }, (res) => {
        let d = "";
        res.on("data", (c) => (d += c));
        res.on("end", () => resolve(JSON.parse(d)));
      })
      .on("error", reject);
  });
}

async function findWs() {
  for (let i = 0; i < 40; i++) {
    try {
      const v = await getJSON("/json/version");
      if (v.webSocketDebuggerUrl) return v.webSocketDebuggerUrl;
    } catch {}
    await wait(200);
  }
  throw new Error("Chrome CDP did not come up\n" + chromeErr.slice(0, 800));
}

const wsUrl = await findWs();
const ws = new WebSocket(wsUrl);
let id = 0;
const pending = new Map();
const sessionPending = new Map();

ws.addEventListener("message", (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg.result);
    pending.delete(msg.id);
  }
});

await new Promise((r) => ws.addEventListener("open", r, { once: true }));

function send(method, params = {}, sessionId) {
  return new Promise((resolve) => {
    const mid = ++id;
    pending.set(mid, resolve);
    ws.send(JSON.stringify({ id: mid, method, params, sessionId }));
  });
}

// Attach to a page target
const { targetInfos } = await send("Target.getTargets");
let pageTarget = targetInfos.find((t) => t.type === "page");
if (!pageTarget) {
  const created = await send("Target.createTarget", { url: "about:blank" });
  pageTarget = { targetId: created.targetId };
}
const { sessionId } = await send("Target.attachToTarget", {
  targetId: pageTarget.targetId,
  flatten: true,
});

await send("Page.enable", {}, sessionId);
await send("Emulation.setEmulatedMedia", {
  features: reduced === "reduced" ? [{ name: "prefers-reduced-motion", value: "reduce" }] : [],
}, sessionId);

await send("Page.navigate", { url: fileUrl }, sessionId);
await wait(Number(settleArg) || (reduced === "reduced" ? 1400 : 2600)); // fonts + parse + reveals

// captureBeyondViewport does NOT trigger loading="lazy" images below the fold,
// and it only rasterizes tiles the compositor has already produced — lazy
// images end up half-painted. Walk the page to trigger the loads, then resize
// the viewport to the whole document so every tile is rasterized for real.
await send("Runtime.evaluate", {
  expression: `(async () => {
    // force every lazy image to load now, then wait for all of them
    document.querySelectorAll('img[loading="lazy"]').forEach(i => { i.loading = 'eager'; });
    const step = window.innerHeight;
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise(r => setTimeout(r, 90));
    }
    window.scrollTo(0, 0);
    await Promise.all([...document.images].map(i => Promise.race([
      i.complete ? Promise.resolve() : new Promise(r => { i.onload = r; i.onerror = r; }),
      new Promise(r => setTimeout(r, 6000)),
    ])));
    await new Promise(r => setTimeout(r, 600));
    return document.documentElement.scrollHeight;
  })()`,
  awaitPromise: true, returnByValue: true,
}, sessionId).then(async (res) => {
  // Safe because previews are rendered in reduced-motion mode, where the only
  // vh-sized element on these pages (the pinned scrub stage) collapses to auto.
  const full = Math.min(Number(res?.result?.value) || 1000, 16000);
  await send("Emulation.setDeviceMetricsOverride", {
    width, height: full, deviceScaleFactor: 1, mobile: false,
  }, sessionId);
  await wait(1200);
});

const { data } = await send(
  "Page.captureScreenshot",
  { format: "png", captureBeyondViewport: true },
  sessionId
);
fs.writeFileSync(outPng, Buffer.from(data, "base64"));
console.log("wrote", outPng);
ws.close();
chrome.kill();
process.exit(0);
