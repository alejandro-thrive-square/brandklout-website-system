// Independent verifier probe (round 3). CDP via Node built-in WebSocket.
// Usage: node verifier-probe-r3.mjs <fileUrl> <width> <mode:normal|reduced> [outPng]
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";

const [, , fileUrl, widthArg, mode = "normal", outPng] = process.argv;
const width = Number(widthArg) || 1440;
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9433 + Math.floor(Math.random() * 400);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-vf3-"));

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
const pageTarget = targetInfos.find((t) => t.type === "page");
const { sessionId } = await send("Target.attachToTarget", { targetId: pageTarget.targetId, flatten: true });

await send("Page.enable", {}, sessionId);
await send("Runtime.enable", {}, sessionId);
await send("Log.enable", {}, sessionId);
await send("Emulation.setEmulatedMedia", {
  features: mode === "reduced" ? [{ name: "prefers-reduced-motion", value: "reduce" }] : [],
}, sessionId);

// Sample the eq-rule's computed transform/opacity from inside the page,
// starting at DOMContentLoaded, every ~80ms for 2.6s.
await send("Page.addScriptToEvaluateOnNewDocument", {
  source: `
    window.__eqSamples = [];
    document.addEventListener("DOMContentLoaded", () => {
      const el = document.querySelector(".eq-rule");
      if (!el) return;
      const t0 = performance.now();
      const tick = () => {
        const cs = getComputedStyle(el);
        window.__eqSamples.push({
          t: Math.round(performance.now() - t0),
          transform: cs.transform,
          opacity: cs.opacity,
          origin: cs.transformOrigin,
          visible: el.classList.contains("is-visible"),
        });
        if (performance.now() - t0 < 2600) setTimeout(tick, 80);
      };
      tick();
    });
  `,
}, sessionId);

await send("Page.navigate", { url: fileUrl }, sessionId);
await wait(3200);

async function evalJson(expr) {
  const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true }, sessionId);
  if (r.exceptionDetails) return { evalError: JSON.stringify(r.exceptionDetails).slice(0, 300) };
  return r.result?.value;
}

// BLOCKER 2 evidence: eq-rule draw samples
const eqSamples = await evalJson("window.__eqSamples");

// State at top before any scrolling: which reveals are visible, inline delays
const topState = await evalJson(`(() => {
  const rows = [...document.querySelectorAll("[data-reveal]")];
  const info = (el) => ({
    cls: el.className.toString().slice(0, 44),
    delayAttr: el.dataset.delay || "0",
    inlineDelay: el.style.getPropertyValue("--reveal-delay"),
    visible: el.classList.contains("is-visible"),
    inView: (() => { const r = el.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; })(),
  });
  return {
    overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    metricsEl: info(document.querySelector(".metrics")),
    capCards: [...document.querySelectorAll(".cap-card")].map(info),
    thesisPs: [...document.querySelectorAll(".thesis-body [data-reveal]")].map(info),
    rateCalc: info(document.querySelector(".rate-calc")),
    metricsText: [...document.querySelectorAll(".metric-num")].map(e => e.textContent),
    eqRule: info(document.querySelector(".eq-rule")),
    heroVisibleCount: rows.filter(e => e.classList.contains("is-visible")).length,
    revealTotal: rows.length,
  };
})()`);

// BLOCKER 1 evidence: scroll each below-fold group into view, then read the
// inline --reveal-delay and computed transition-delay the observer applied.
const staggerState = await evalJson(`(async () => {
  const grab = (el) => ({
    cls: el.className.toString().slice(0, 44),
    delayAttr: el.dataset.delay || "0",
    inlineDelay: el.style.getPropertyValue("--reveal-delay"),
    computedTransitionDelay: getComputedStyle(el).transitionDelay,
    visible: el.classList.contains("is-visible"),
  });
  const scrollWait = async (sel) => {
    document.querySelector(sel).scrollIntoView({ block: "center" });
    await new Promise(r => setTimeout(r, 450));
  };
  await scrollWait(".thesis-body");
  await scrollWait(".cap-grid");
  await scrollWait(".rate-calc");
  await scrollWait(".metrics");
  await new Promise(r => setTimeout(r, 1800)); // let count-up settle
  return {
    capCards: [...document.querySelectorAll(".cap-card")].map(grab),
    thesisPs: [...document.querySelectorAll(".thesis-body [data-reveal]")].map(grab),
    rateCalc: grab(document.querySelector(".rate-calc")),
    metrics: grab(document.querySelector(".metrics")),
    metricsText: [...document.querySelectorAll(".metric-num")].map(e => e.textContent),
  };
})()`);

// Full-page sweep: everything must end visible, no overflow anywhere
const sweep = await evalJson(`(async () => {
  const step = innerHeight * 0.75;
  for (let y = 0; y <= document.documentElement.scrollHeight; y += step) {
    scrollTo(0, y); await new Promise(r => setTimeout(r, 130));
  }
  await new Promise(r => setTimeout(r, 1200));
  const reveals = [...document.querySelectorAll("[data-reveal]")];
  const invisible = reveals.filter(e => !e.classList.contains("is-visible"))
    .map(e => e.className.toString().slice(0, 50));
  scrollTo(0, 0); await new Promise(r => setTimeout(r, 250));
  return {
    invisible,
    revealTotal: reveals.length,
    overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    calcFirstRow: document.querySelector('[data-pages="1"] [data-cost]')?.textContent,
  };
})()`);

// Keyboard/focus sanity: does :focus-visible produce a visible outline on a button?
const focusCheck = await evalJson(`(() => {
  const link = document.querySelector(".nav-link");
  const btn = document.querySelector(".button.primary");
  const probe = (el) => {
    try { el.focus({ focusVisible: true }); } catch { el.focus(); }
    const cs = getComputedStyle(el);
    return { matchedFocusVisible: el.matches(":focus-visible"), outline: cs.outlineStyle + " " + cs.outlineWidth + " " + cs.outlineColor };
  };
  return { navLink: probe(link), button: probe(btn) };
})()`);

if (outPng) {
  const { data } = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true }, sessionId);
  fs.writeFileSync(outPng, Buffer.from(data, "base64"));
}

console.log(JSON.stringify({
  mode, width,
  console: consoleMsgs.filter(m => !/favicon/i.test(m.text)),
  eqSamples,
  topState, staggerState, sweep, focusCheck,
}, null, 2));
ws.close();
chrome.kill();
process.exit(0);
