// Live-URL capture driver — CDP over Node 22's built-in WebSocket.
// Renders a real (headful-profile) Chrome so JS bot-walls resolve, then writes
// full-page PNGs at desktop + mobile widths plus the rendered DOM and text.
//
// Usage: node capture.mjs <url> <outDir> [settleMs]
//
// Source Asana task GID: 1217040406855582 (Landing Page - Mason Park)
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";

const [, , url, outDir, settleArg] = process.argv;
if (!url || !outDir) {
  console.error("usage: node capture.mjs <url> <outDir> [settleMs]");
  process.exit(1);
}
const settleMs = Number(settleArg) || 6000;
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9400 + Math.floor(Math.random() * 400);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-cap-"));
fs.mkdirSync(outDir, { recursive: true });

const chrome = spawn(CHROME, [
  "--headless=new",
  "--disable-gpu",
  "--hide-scrollbars",
  `--remote-debugging-port=${PORT}`,
  "--remote-allow-origins=*",
  "--force-device-scale-factor=1",
  "--window-size=1440,1000",
  "--no-first-run",
  "--no-default-browser-check",
  "--disable-blink-features=AutomationControlled",
  `--user-data-dir=${profile}`,
  "about:blank",
]);
let chromeErr = "";
chrome.stderr.on("data", (d) => (chromeErr += d));

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const getJSON = (p) =>
  new Promise((resolve, reject) => {
    http
      .get({ host: "127.0.0.1", port: PORT, path: p }, (res) => {
        let d = "";
        res.on("data", (c) => (d += c));
        res.on("end", () => resolve(JSON.parse(d)));
      })
      .on("error", reject);
  });

async function findWs() {
  for (let i = 0; i < 50; i++) {
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
await send("Network.enable", {}, sessionId);
await send(
  "Network.setUserAgentOverride",
  {
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    acceptLanguage: "en-US,en;q=0.9",
  },
  sessionId
);

const evaluate = async (expression) => {
  const r = await send(
    "Runtime.evaluate",
    { expression, returnByValue: true, awaitPromise: true },
    sessionId
  );
  return r?.result?.value;
};

async function shoot(width, height, mobile, label) {
  await send(
    "Emulation.setDeviceMetricsOverride",
    { width, height, deviceScaleFactor: 1, mobile },
    sessionId
  );
  await wait(1200);
  // nudge lazy content into view, then return to top
  await evaluate(`(async () => {
    const step = innerHeight * 0.8;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      scrollTo(0, y);
      await new Promise(r => setTimeout(r, 120));
    }
    scrollTo(0, 0);
    await new Promise(r => setTimeout(r, 500));
  })()`);
  const { data } = await send(
    "Page.captureScreenshot",
    { format: "png", captureBeyondViewport: true },
    sessionId
  );
  const out = path.join(outDir, `${label}.png`);
  fs.writeFileSync(out, Buffer.from(data, "base64"));
  console.log("wrote", out, `(${(Buffer.from(data, "base64").length / 1024) | 0} KB)`);
}

await send("Page.navigate", { url }, sessionId);
await wait(settleMs);

// A JS bot-wall usually meta-refreshes itself away; give it a second pass.
let finalUrl = await evaluate("location.href");
const title = await evaluate("document.title");
if (/sgcaptcha|captcha|one moment/i.test((await evaluate("document.body.innerText")) || "")) {
  console.log("bot-wall detected, waiting it out...");
  await wait(9000);
  finalUrl = await evaluate("location.href");
}

const html = await evaluate("document.documentElement.outerHTML");
const text = await evaluate("document.body.innerText");
fs.writeFileSync(path.join(outDir, "rendered.html"), html || "");
fs.writeFileSync(path.join(outDir, "rendered.txt"), text || "");

// Collect anything useful for brand extraction.
const meta = await evaluate(`JSON.stringify({
  url: location.href,
  title: document.title,
  description: (document.querySelector('meta[name=description]')||{}).content || '',
  links: [...new Set([...document.querySelectorAll('a[href]')].map(a => a.href))].slice(0, 250),
  images: [...new Set([...document.querySelectorAll('img')].map(i => i.currentSrc || i.src))].slice(0, 150),
  stylesheets: [...document.querySelectorAll('link[rel=stylesheet]')].map(l => l.href),
  fonts: [...new Set([...document.querySelectorAll('h1,h2,h3,p,a,body')].map(e => getComputedStyle(e).fontFamily))],
  headings: [...document.querySelectorAll('h1,h2,h3')].map(h => h.tagName + ': ' + h.innerText.trim()).slice(0, 120),
  phones: [...new Set([...document.querySelectorAll('a[href^="tel:"]')].map(a => a.getAttribute('href')))],
  bodyBg: getComputedStyle(document.body).backgroundColor,
  bodyColor: getComputedStyle(document.body).color
}, null, 2)`);
fs.writeFileSync(path.join(outDir, "meta.json"), meta || "{}");

console.log("final url:", finalUrl, "| title:", title);
await shoot(1440, 1000, false, "desktop");
await shoot(390, 844, true, "mobile");

ws.close();
chrome.kill();
process.exit(0);
