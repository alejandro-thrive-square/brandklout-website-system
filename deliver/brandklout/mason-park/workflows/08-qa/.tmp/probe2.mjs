// Second regression probe: enumerate every element on a legacy page that is
// display:none / zero-box while still holding text, and dump the CTA address block.
// Usage: node probe2.mjs <slug> [width]
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";

const [, , SLUG, W = "1440"] = process.argv;
const WIDTH = +W;
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = "https://mason-park-dental.webflow.io";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const PORT = 9300 + Math.floor(Math.random() * 90);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-probe2-"));
const chrome = spawn(CHROME, [
  "--headless=new", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
  "--hide-scrollbars", "--force-prefers-reduced-motion", "--disable-smooth-scrolling",
  `--window-size=${WIDTH},900`, `--remote-debugging-port=${PORT}`, "--remote-allow-origins=*",
  "--force-device-scale-factor=1", "--no-first-run", `--user-data-dir=${profile}`, "about:blank",
]);
const getJSON = (p) => new Promise((res, rej) => {
  http.get({ host: "127.0.0.1", port: PORT, path: p }, (r) => {
    let d = ""; r.on("data", (c) => (d += c)); r.on("end", () => res(JSON.parse(d)));
  }).on("error", rej);
});
let wsUrl = null;
for (let i = 0; i < 80 && !wsUrl; i++) { try { wsUrl = (await getJSON("/json/version")).webSocketDebuggerUrl; } catch {} if (!wsUrl) await wait(200); }
const ws = new WebSocket(wsUrl);
let id = 0; const pend = new Map();
ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } });
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
const send = (method, params = {}, sessionId) => new Promise((res, rej) => {
  const i = ++id; pend.set(i, (m) => (m.error ? rej(new Error(`${method}: ${m.error.message}`)) : res(m.result)));
  ws.send(JSON.stringify({ id: i, method, params, sessionId }));
});
const { targetInfos } = await send("Target.getTargets");
const t = targetInfos.find((x) => x.type === "page");
const { sessionId } = await send("Target.attachToTarget", { targetId: t.targetId, flatten: true });
await send("Page.enable", {}, sessionId);
await send("Runtime.enable", {}, sessionId);
await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] }, sessionId);
await send("Emulation.setDeviceMetricsOverride", { width: WIDTH, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId);
const ev = (e) => send("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true }, sessionId).then((r) => r?.result?.value);

await send("Page.navigate", { url: `${BASE}/${SLUG}` }, sessionId);
for (let i = 0; i < 90; i++) { if (await ev("document.readyState") === "complete") break; await wait(300); }
await ev("(async()=>{const s=Math.max(300,innerHeight*0.7);for(let y=0;y<document.documentElement.scrollHeight;y+=s){scrollTo(0,y);await new Promise(r=>setTimeout(r,100));}scrollTo(0,0);await new Promise(r=>setTimeout(r,1000));return 1})()");

const out = await ev(`(function(){
  const dead = [];
  for (const el of document.querySelectorAll("body *")) {
    const txt = (el.textContent || "").replace(/\\s+/g," ").trim();
    if (!txt || txt.length > 90) continue;
    if (el.children.length > 2) continue;
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    if (s.display === "none" || (r.width === 0 && r.height === 0)) {
      // report the closest reason
      let why = s.display === "none" ? "display:none(self)" : "zero box";
      let a = el.parentElement, hiddenAncestor = null;
      while (a && a !== document.body) {
        if (getComputedStyle(a).display === "none") { hiddenAncestor = (typeof a.className==="string"?a.className:"").slice(0,40); break; }
        a = a.parentElement;
      }
      dead.push({ tag: el.tagName.toLowerCase(),
        cls: (typeof el.className==="string"?el.className:"").slice(0,45),
        text: txt.slice(0,55), why, hiddenAncestor });
    }
    if (dead.length > 60) break;
  }
  // the CTA address block, whatever its markup
  const addr = Array.from(document.querySelectorAll("*")).filter(
    e => /Silverbrook|Kingsland/.test(e.textContent || "") && e.children.length <= 3)
    .slice(-6).map(e => { const s = getComputedStyle(e), r = e.getBoundingClientRect();
      return { tag: e.tagName.toLowerCase(), cls: (typeof e.className==="string"?e.className:"").slice(0,40),
        display: s.display, text: (e.textContent||"").replace(/\\s+/g," ").trim().slice(0,70),
        rect: { w: Math.round(r.width), h: Math.round(r.height) },
        html: e.innerHTML.replace(/\\s+/g," ").slice(0,150) }; });
  return { dead, addr };
})()`);
console.log(JSON.stringify(out, null, 2));
ws.close(); chrome.kill();
try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
