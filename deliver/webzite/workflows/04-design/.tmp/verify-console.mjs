// Console/error probe: loads the page headlessly, scrolls to bottom, reports
// console errors/warnings, page errors, and failed requests.
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";

const [, , fileUrl] = process.argv;
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
  "--window-size=1440,1000",
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
  for (let i = 0; i < 40; i++) {
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
const issues = [];

ws.addEventListener("message", (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg.result);
    pending.delete(msg.id);
    return;
  }
  if (msg.method === "Runtime.consoleAPICalled" && ["error", "warning"].includes(msg.params.type)) {
    issues.push(`console.${msg.params.type}: ` + msg.params.args.map((a) => a.value ?? a.description ?? "").join(" "));
  }
  if (msg.method === "Runtime.exceptionThrown") {
    issues.push("pageerror: " + (msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text));
  }
  if (msg.method === "Network.loadingFailed") {
    issues.push("requestfailed: " + msg.params.errorText);
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
await send("Network.enable", {}, sessionId);
await send("Page.navigate", { url: fileUrl }, sessionId);
await wait(2500);

// scroll through the page to trigger observers/animations
for (let i = 1; i <= 8; i++) {
  await send("Runtime.evaluate", { expression: `window.scrollTo(0, document.body.scrollHeight * ${i / 8})` }, sessionId);
  await wait(500);
}
await wait(1500);

const { result } = await send("Runtime.evaluate", {
  expression: `JSON.stringify({
    metricsText: [...document.querySelectorAll('[data-count]')].map(e => e.textContent),
    calcCosts: [...document.querySelectorAll('[data-cost]')].map(e => e.textContent),
    revealed: document.querySelectorAll('[data-reveal].is-visible').length,
    totalReveal: document.querySelectorAll('[data-reveal]').length,
    docWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  })`,
  returnByValue: true,
}, sessionId);

console.log("STATE:", result.value);
console.log(issues.length ? "ISSUES:\n" + issues.join("\n") : "NO CONSOLE/NETWORK ISSUES");
ws.close();
chrome.kill();
process.exit(0);
