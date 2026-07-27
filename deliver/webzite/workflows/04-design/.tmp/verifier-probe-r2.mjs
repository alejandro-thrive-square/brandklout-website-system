// Independent verifier probe (round 2). CDP via Node built-in WebSocket.
// Usage: node verifier-probe-r2.mjs <fileUrl> <width> <mode:normal|reduced> [outPng]
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";

const [, , fileUrl, widthArg, mode = "normal", outPng] = process.argv;
const width = Number(widthArg) || 1440;
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9433 + Math.floor(Math.random() * 400);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-vf-"));

const chrome = spawn(CHROME, [
  "--headless=new",
  "--disable-gpu",
  "--hide-scrollbars",
  `--remote-debugging-port=${PORT}`,
  "--remote-allow-origins=*",
  "--force-device-scale-factor=1",
  `--window-size=${width},900`,
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
    http.get({ host: "127.0.0.1", port: PORT, path: p }, (res) => {
      let d = "";
      res.on("data", (c) => (d += c));
      res.on("end", () => resolve(JSON.parse(d)));
    }).on("error", reject);
  });
}
async function findWs() {
  for (let i = 0; i < 50; i++) {
    try {
      const v = await getJSON("/json/version");
      if (v.webSocketDebuggerUrl) return v.webSocketDebuggerUrl;
    } catch {}
    await wait(200);
  }
  throw new Error("no CDP\n" + chromeErr.slice(0, 500));
}

const ws = new WebSocket(await findWs());
let id = 0;
const pending = new Map();
const consoleMsgs = [];
ws.addEventListener("message", (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg.result);
    pending.delete(msg.id);
    return;
  }
  if (msg.method === "Runtime.consoleAPICalled") {
    consoleMsgs.push({
      type: msg.params.type,
      text: (msg.params.args || []).map((a) => a.value ?? a.description ?? "").join(" "),
    });
  }
  if (msg.method === "Runtime.exceptionThrown") {
    consoleMsgs.push({ type: "exception", text: JSON.stringify(msg.params.exceptionDetails).slice(0, 400) });
  }
  if (msg.method === "Log.entryAdded") {
    consoleMsgs.push({ type: "log:" + msg.params.entry.level, text: msg.params.entry.text });
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
const { sessionId } = await send("Target.attachToTarget", { targetId: pageTarget.targetId, flatten: true });

await send("Page.enable", {}, sessionId);
await send("Runtime.enable", {}, sessionId);
await send("Log.enable", {}, sessionId);
await send("Emulation.setEmulatedMedia", {
  features: mode === "reduced" ? [{ name: "prefers-reduced-motion", value: "reduce" }] : [],
}, sessionId);

await send("Page.navigate", { url: fileUrl }, sessionId);
await wait(2500);

async function evalJson(expr) {
  const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true }, sessionId);
  return r.result?.value;
}

// initial (top of page) state
const topState = await evalJson(`(() => {
  const q = (s) => document.querySelectorAll(s);
  const reveals = [...q("[data-reveal]")];
  return {
    overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    revealTotal: reveals.length,
    revealVisibleNow: reveals.filter(e => e.classList.contains("is-visible")).length,
    metricsText: [...q(".metric-num")].map(e => e.textContent),
    toggle: (() => { const t = document.querySelector("[data-quote-pause]");
      return t ? { hidden: t.hidden, pressed: t.getAttribute("aria-pressed"), label: t.getAttribute("aria-label"),
        w: t.offsetWidth, h: t.offsetHeight } : null; })(),
    dots: [...q("[data-testimonial]")].map(b => ({ cur: b.getAttribute("aria-current"), label: b.getAttribute("aria-label"), w: b.offsetWidth, h: b.offsetHeight })),
    labelColor: getComputedStyle(document.querySelector(".metrics .label")).color,
    faint: getComputedStyle(document.documentElement).getPropertyValue("--wz-faint").trim(),
    heroEqFontPx: getComputedStyle(document.querySelector(".eq")).fontSize,
    metricFontPx: getComputedStyle(document.querySelector(".metrics b")).fontSize,
    quoteText: document.querySelector("[data-quote]")?.textContent?.slice(0, 40),
    tablist: !!document.querySelector("[role=tablist]"),
    navDrawerDisplay: getComputedStyle(document.getElementById("nav-drawer")).display,
  };
})()`);

// scroll through the whole page to trigger observers, then to metrics check
await evalJson(`(async () => {
  const step = window.innerHeight * 0.8;
  for (let y = 0; y <= document.documentElement.scrollHeight; y += step) {
    window.scrollTo(0, y); await new Promise(r => setTimeout(r, 120));
  }
  window.scrollTo(0, 0); await new Promise(r => setTimeout(r, 300));
  return true;
})()`);
await wait(2200);

const afterScroll = await evalJson(`(() => {
  const reveals = [...document.querySelectorAll("[data-reveal]")];
  const invisible = reveals.filter(e => !e.classList.contains("is-visible"))
    .map(e => e.className.toString().slice(0, 60));
  return {
    revealVisible: reveals.length - invisible.length,
    revealTotal: reveals.length,
    invisible,
    metricsText: [...document.querySelectorAll(".metric-num")].map(e => e.textContent),
    overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  };
})()`);

// pause toggle behaviour (normal mode only)
let toggleTest = null;
if (mode === "normal") {
  toggleTest = await evalJson(`(() => {
    const t = document.querySelector("[data-quote-pause]");
    if (!t) return { missing: true };
    const before = { pressed: t.getAttribute("aria-pressed"), label: t.getAttribute("aria-label"), paused: t.classList.contains("is-paused") };
    t.click();
    const after = { pressed: t.getAttribute("aria-pressed"), label: t.getAttribute("aria-label"), paused: t.classList.contains("is-paused") };
    t.click();
    return { before, after, restored: t.getAttribute("aria-pressed") };
  })()`);
}

if (outPng) {
  const { data } = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true }, sessionId);
  fs.writeFileSync(outPng, Buffer.from(data, "base64"));
}

console.log(JSON.stringify({
  mode, width,
  console: consoleMsgs.filter(m => !/favicon/i.test(m.text)),
  topState, afterScroll, toggleTest,
}, null, 2));
ws.close();
chrome.kill();
process.exit(0);
