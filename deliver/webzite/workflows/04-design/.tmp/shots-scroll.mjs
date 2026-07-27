// CDP scrolling screenshot driver — N viewport shots down the page.
// Usage: node shots-scroll.mjs <url> <outPrefix> <width> <height> <numShots> [reducedMotion]
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";

const [, , url, outPrefix, widthArg, heightArg, numArg, reduced] = process.argv;
const width = Number(widthArg) || 1440;
const height = Number(heightArg) || 900;
const numShots = Number(numArg) || 6;
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
  `--window-size=${width},${height}`,
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

async function findWs() {
  for (let i = 0; i < 150; i++) {
    try {
      const v = await getJSON("/json/version");
      if (v.webSocketDebuggerUrl) return v.webSocketDebuggerUrl;
    } catch {}
    await wait(300);
  }
  throw new Error("Chrome CDP did not come up\n" + chromeErr.slice(0, 800));
}

const wsUrl = await findWs();
const ws = new WebSocket(wsUrl);
let id = 0;
const pending = new Map();

ws.addEventListener("message", async (ev) => {
  const raw = typeof ev.data === "string" ? ev.data : await ev.data.text();
  const msg = JSON.parse(raw);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg.result);
    pending.delete(msg.id);
  }
});
ws.addEventListener("error", (e) => console.error("ws error", e.message || e));
ws.addEventListener("close", (e) => console.error("ws closed", e.code, e.reason));

await new Promise((r) => ws.addEventListener("open", r, { once: true }));

function send(method, params = {}, sessionId) {
  return new Promise((resolve, reject) => {
    const mid = ++id;
    const t = setTimeout(() => reject(new Error(`CDP timeout: ${method}`)), 30000);
    pending.set(mid, (res) => {
      clearTimeout(t);
      resolve(res);
    });
    ws.send(JSON.stringify({ id: mid, method, params, sessionId }));
  });
}

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
await send("Runtime.enable", {}, sessionId);
await send(
  "Emulation.setEmulatedMedia",
  { features: reduced === "reduced" ? [{ name: "prefers-reduced-motion", value: "reduce" }] : [] },
  sessionId
);

await send("Page.navigate", { url }, sessionId);
await wait(4000); // fonts, images, initial animations

async function evalJs(expression) {
  const r = await send("Runtime.evaluate", { expression, returnByValue: true }, sessionId);
  return r?.result?.value;
}

const docHeight = await evalJs(
  "Math.max(document.body.scrollHeight, document.documentElement.scrollHeight)"
);
console.log("docHeight", docHeight);
const step = Math.max(0, docHeight - height) / Math.max(1, numShots - 1);

for (let i = 0; i < numShots; i++) {
  const y = Math.round(i * step);
  await evalJs(`window.scrollTo(0, ${y})`);
  await wait(1600); // let reveals/lazy images settle
  const { data } = await send(
    "Page.captureScreenshot",
    { format: "jpeg", quality: 72 },
    sessionId
  );
  const out = `${outPrefix}-${String(i).padStart(2, "0")}.jpg`;
  fs.writeFileSync(out, Buffer.from(data, "base64"));
  console.log("wrote", out, "at y=", y);
}

ws.close();
chrome.kill();
process.exit(0);
