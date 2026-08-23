// try-css.mjs — apply candidate CSS to the live page and measure the result.
//
// Reasoning about this cascade has been wrong four times now: an embed wrapper
// that inherits the svg's class, a body <style> that out-ranks the head, a
// `line-height:inherit` that looked equivalent to the design and was not. So
// stop reasoning and ask the renderer. This injects each candidate into the
// real staging page and prints the boxes, next to the same boxes measured on
// the local design.
//
// Usage:
//   node try-css.mjs <page> "<sel1>,<sel2>" "name=css" "name=css" ...
// Example:
//   node try-css.mjs invisalign ".faq,summary" "flex=summary{display:flex}"
//
// Source Asana task GID: 1217040406855582
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const DESIGN = path.resolve(here, "../../04-design/.tmp");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const STAGING = (process.env.MPD_BASE_URL || "https://mason-park-dental.webflow.io").replace(/\/+$/, "");

const page = process.argv[2];
const SELECTORS = (process.argv[3] || "").split(",").map((s) => s.trim()).filter(Boolean);
const CANDIDATES = process.argv.slice(4).map((a) => {
  const i = a.indexOf("=");
  return [a.slice(0, i), a.slice(i + 1)];
});
if (!page || !SELECTORS.length) {
  console.error('usage: node try-css.mjs <page> "<sel1>,<sel2>" "name=css" ...');
  process.exit(2);
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

let port = 9840;
async function open(url) {
  const PORT = port++;
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-try-"));
  const chrome = spawn(CHROME, [
    "--headless=new", "--use-gl=angle", "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader", "--hide-scrollbars", "--window-size=1440,1000",
    `--remote-debugging-port=${PORT}`, "--remote-allow-origins=*",
    "--force-device-scale-factor=1", "--no-first-run",
    `--user-data-dir=${profile}`, "about:blank",
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
    if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result); pend.delete(m.id); }
  });
  await new Promise((r) => ws.addEventListener("open", r, { once: true }));
  const send = (m, p = {}, s) => new Promise((res) => {
    const i = ++id; pend.set(i, res);
    ws.send(JSON.stringify({ id: i, method: m, params: p, sessionId: s }));
  });
  const { targetInfos } = await send("Target.getTargets");
  const t = targetInfos.find((x) => x.type === "page");
  const { sessionId } = await send("Target.attachToTarget", { targetId: t.targetId, flatten: true });
  await send("Page.enable", {}, sessionId);
  await send("Runtime.enable", {}, sessionId);
  await send("Emulation.setDeviceMetricsOverride",
    { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false }, sessionId);
  const evaluate = (expr) =>
    send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true }, sessionId)
      .then((r) => {
        if (r?.exceptionDetails) throw new Error("in-page: " + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
        return r?.result?.value;
      });
  await send("Page.navigate", { url }, sessionId);
  for (let i = 0; i < 150; i++) {
    const st = await evaluate("document.documentElement?document.readyState:''").catch(() => "");
    if (st === "interactive" || st === "complete") break;
    await wait(200);
  }
  await evaluate("new Promise(r=>setTimeout(r,9000))");
  return { evaluate, close: () => { ws.close(); chrome.kill(); } };
}

const measureExpr = (sels) =>
  "(function(){var out={};" + sels.map((s) =>
    "out[" + JSON.stringify(s) + "]=[].slice.call(document.querySelectorAll(" + JSON.stringify(s) +
    ")).slice(0,6).map(function(e){var r=e.getBoundingClientRect();" +
    "return Math.round(r.width)+'x'+Math.round(r.height);}).join(' ');"
  ).join("") + "return out;})()";

const applyExpr = (css) =>
  "(function(){var e=document.getElementById('try-css');if(e)e.remove();" +
  "if(" + JSON.stringify(css) + "){var s=document.createElement('style');s.id='try-css';" +
  "s.textContent=" + JSON.stringify(css) + ";document.head.appendChild(s);}return true;})()";

const localPath = path.join(DESIGN, page, "index.html").split(path.sep).join("/").split(" ").join("%20");
const d = await open("file:///" + localPath);
const target = await d.evaluate(measureExpr(SELECTORS));
d.close();
await wait(2500);

console.log("\nTARGET (local design)");
for (const s of SELECTORS) console.log("  " + s.padEnd(26) + (target[s] || "(none)"));

const live = await open(`${STAGING}/${page}`);
console.log("\nSTAGING");
for (const [name, css] of [["(as published)", ""], ...CANDIDATES]) {
  await live.evaluate(applyExpr(css));
  await wait(600);
  const m = await live.evaluate(measureExpr(SELECTORS));
  console.log("  " + name);
  for (const s of SELECTORS) {
    const same = (m[s] || "") === (target[s] || "");
    console.log("     " + (same ? "MATCH " : "      ") + s.padEnd(24) + (m[s] || "(none)"));
  }
}
live.close();
