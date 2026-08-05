// Full-page preview renderer for the Arvada landing pages.
//
// A plain captureScreenshot leaves every [data-reveal] section blank: the page
// never scrolls, so IntersectionObserver never fires and the reveals stay at
// opacity 0. This scrolls the whole page first, waits for the reveals to settle,
// then captures.
//
// Usage: node preview.mjs <slug> [width] [reduced]
// Asana parent task: 1217040406855586
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");

const [, , slug, widthArg, reduced] = process.argv;
const width = Number(widthArg) || 1440;
const pageFile = path.join(root, slug, "index.html");
if (!fs.existsSync(pageFile)) {
  console.error("no such page:", pageFile);
  process.exit(1);
}
const outPng = path.join(root, slug, `preview-${width}${reduced === "reduced" ? "-reduced" : ""}.png`);

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9500 + Math.floor(Math.random() * 400);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-prev-"));

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

async function getJSON(p) {
  return new Promise((resolve, reject) => {
    http
      .get({ host: "127.0.0.1", port: PORT, path: p }, (res) => {
        let d = "";
        res.on("data", (c) => (d += c));
        res.on("end", () => resolve(JSON.parse(d)));
      })
      .on("error", reject);
  });
}
let wsUrl;
for (let i = 0; i < 40 && !wsUrl; i++) {
  try {
    wsUrl = (await getJSON("/json/version")).webSocketDebuggerUrl;
  } catch {}
  if (!wsUrl) await wait(200);
}
if (!wsUrl) {
  console.error("Chrome CDP did not come up\n" + chromeErr.slice(0, 600));
  process.exit(1);
}
const ws = new WebSocket(wsUrl);
let id = 0;
const pending = new Map();
const consoleErrors = [];
ws.addEventListener("message", (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m.result ?? m.error);
    pending.delete(m.id);
    return;
  }
  if (m.method === "Runtime.exceptionThrown") {
    consoleErrors.push(m.params.exceptionDetails?.exception?.description || "exception");
  }
  if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") {
    consoleErrors.push((m.params.args || []).map((a) => a.value ?? a.description).join(" "));
  }
});
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
const send = (method, params = {}, sessionId) =>
  new Promise((resolve) => {
    const mid = ++id;
    pending.set(mid, resolve);
    ws.send(JSON.stringify({ id: mid, method, params, sessionId }));
  });

const { targetInfos } = await send("Target.getTargets");
const t = targetInfos.find((x) => x.type === "page");
const { sessionId } = await send("Target.attachToTarget", { targetId: t.targetId, flatten: true });
await send("Page.enable", {}, sessionId);
await send("Runtime.enable", {}, sessionId);
await send(
  "Emulation.setDeviceMetricsOverride",
  { width, height: 1000, deviceScaleFactor: 1, mobile: width < 700 },
  sessionId
);
await send(
  "Emulation.setEmulatedMedia",
  { features: reduced === "reduced" ? [{ name: "prefers-reduced-motion", value: "reduce" }] : [] },
  sessionId
);

const evaluate = async (expression) =>
  (
    await send(
      "Runtime.evaluate",
      { expression, returnByValue: true, awaitPromise: true },
      sessionId
    )
  )?.result?.value;

await send("Page.navigate", { url: pathToFileURL(pageFile).href }, sessionId);
await wait(2200);
await evaluate("document.fonts ? document.fonts.ready.then(() => true) : true");

// Scroll the whole page so IntersectionObserver fires for every [data-reveal].
await evaluate(`(async () => {
  const step = window.innerHeight * 0.6;
  const h = document.body.scrollHeight;
  for (let y = 0; y < h; y += step) {
    window.scrollTo(0, y);
    await new Promise(r => setTimeout(r, 190));
  }
  window.scrollTo(0, h);
  await new Promise(r => setTimeout(r, 700));
  window.scrollTo(0, 0);
  await new Promise(r => setTimeout(r, 900));
})()`);

const stats = await evaluate(`(() => {
  const all = document.querySelectorAll('[data-reveal]');
  const shown = document.querySelectorAll('[data-reveal].is-in');
  const imgs = [...document.querySelectorAll('img')];
  return {
    reveals: all.length,
    revealed: shown.length,
    images: imgs.length,
    brokenImages: imgs.filter(i => !i.complete || i.naturalWidth === 0).map(i => i.getAttribute('src')),
    height: document.body.scrollHeight,
    overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth
      ? document.documentElement.scrollWidth - document.documentElement.clientWidth : 0,
    js: document.documentElement.getAttribute('data-js')
  };
})()`);

const shot = await send(
  "Page.captureScreenshot",
  { format: "png", captureBeyondViewport: true },
  sessionId
);
if (shot?.data) {
  fs.writeFileSync(outPng, Buffer.from(shot.data, "base64"));
  console.log(`wrote ${path.relative(root, outPng)}`);
} else {
  console.log("capture FAILED", JSON.stringify(shot).slice(0, 300));
}
console.log(
  `  reveals ${stats.revealed}/${stats.reveals} · images ${stats.images} · height ${stats.height}px · js=${stats.js}`
);
if (stats.overflowX) console.log(`  !! horizontal overflow: ${stats.overflowX}px`);
if (stats.brokenImages.length) console.log(`  !! broken images:`, stats.brokenImages);
if (consoleErrors.length) console.log(`  !! console errors:`, consoleErrors.slice(0, 5));

ws.close();
chrome.kill();
process.exit(0);
