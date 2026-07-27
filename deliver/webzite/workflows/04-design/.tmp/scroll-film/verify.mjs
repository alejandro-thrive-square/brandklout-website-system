// Scroll-film verification harness (CDP, Node 22 built-in WebSocket).
// Screenshots every film beat via the ?jump dev contract, captures console
// errors, and runs a scripted-scroll jank probe (judge p95/max, never avg).
// Usage: node verify.mjs [width] [reducedMotion]
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const width = Number(process.argv[2]) || 1440;
const reduced = process.argv[3] === "reduced";
const VH = 1000;
const outDir = path.join(here, "shots", reduced ? `reduced-${width}` : `${width}`);
fs.mkdirSync(outDir, { recursive: true });

const pageUrl = "file:///" + path.join(here, "index.html").replace(/\\/g, "/");

// film: 560svh driver → scrollRange = 5.6*VH - VH. Beats at film progress p.
const filmRange = 5.6 * VH - VH;
const beats = [
  ["00-boot", 0],
  ["01-strategy", Math.round(filmRange * 0.09)],
  ["02-experience", Math.round(filmRange * 0.31)],
  ["03-function", Math.round(filmRange * 0.55)],
  ["04-profit", Math.round(filmRange * 0.82)],
  ["05-seam", Math.round(filmRange * 0.99)],
  ["06-marquee-thesis", Math.round(5.6 * VH + 200)],
  ["07-work", Math.round(5.6 * VH + 2400)],
  ["08-statement", Math.round(5.6 * VH + 5200)],
  ["09-quotes-rates", Math.round(5.6 * VH + 6800)],
  ["10-contact-footer", 10 ** 7],
];

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9333 + Math.floor(Math.random() * 400);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-film-"));

const chrome = spawn(CHROME, [
  "--headless=new",
  "--disable-gpu",
  "--hide-scrollbars",
  `--remote-debugging-port=${PORT}`,
  "--remote-allow-origins=*",
  "--force-device-scale-factor=1",
  `--window-size=${width},${VH}`,
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
  for (let i = 0; i < 40; i++) {
    try {
      const v = await getJSON("/json/version");
      if (v.webSocketDebuggerUrl) return v.webSocketDebuggerUrl;
    } catch {}
    await wait(200);
  }
  throw new Error("Chrome CDP did not come up\n" + chromeErr.slice(0, 800));
}

const ws = new WebSocket(await findWs());
let id = 0;
const pending = new Map();
const consoleLog = [];

ws.addEventListener("message", (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg.result);
    pending.delete(msg.id);
  }
  if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error") {
    consoleLog.push("console.error: " + msg.params.args.map((a) => a.value ?? a.description).join(" "));
  }
  if (msg.method === "Runtime.exceptionThrown") {
    consoleLog.push("exception: " + (msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text));
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
  { features: reduced ? [{ name: "prefers-reduced-motion", value: "reduce" }] : [] },
  sessionId
);

async function evalJs(expression) {
  const res = await send(
    "Runtime.evaluate",
    { expression, returnByValue: true, awaitPromise: true },
    sessionId
  );
  return res?.result?.value;
}

async function waitReady() {
  for (let i = 0; i < 60; i++) {
    if (await evalJs("window.__ready === true")) return true;
    await wait(250);
  }
  return false;
}

for (const [name, y] of beats) {
  await send("Page.navigate", { url: `${pageUrl}?jump=${y}` }, sessionId);
  await wait(600);
  const ready = await waitReady();
  await wait(500); // let scrub/lerp paint settle
  const { data } = await send("Page.captureScreenshot", { format: "png" }, sessionId);
  fs.writeFileSync(path.join(outDir, `${name}.png`), Buffer.from(data, "base64"));
  const scrollY = await evalJs("window.scrollY");
  console.log(`${name}: ready=${ready} scrollY=${scrollY}`);
}

// jank probe: real-time scripted scroll through the film, then read __jank()
if (!reduced) {
  await send("Page.navigate", { url: `${pageUrl}` }, sessionId);
  await wait(600);
  await waitReady();
  const jank = await evalJs(`(async () => {
    const total = ${Math.round(5.6 * VH + 4000)};
    const start = performance.now();
    const dur = 9000;
    await new Promise((done) => {
      const step = (now) => {
        const t = Math.min(1, (now - start) / dur);
        window.scrollTo(0, t * total);
        if (t < 1) requestAnimationFrame(step); else done();
      };
      requestAnimationFrame(step);
    });
    return window.__jank ? window.__jank() : null;
  })()`);
  console.log("jank:", JSON.stringify(jank));
}

if (consoleLog.length) {
  console.log("--- console problems ---");
  consoleLog.forEach((l) => console.log(l));
} else {
  console.log("console: clean");
}

ws.close();
chrome.kill();
process.exit(0);
