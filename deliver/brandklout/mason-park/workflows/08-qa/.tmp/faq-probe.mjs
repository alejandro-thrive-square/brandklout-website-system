// Does the native Webflow Dropdown FAQ actually open? Uses REAL CDP input events
// (Input.dispatchMouseEvent), not a synthetic el.click(), so Webflow's own handlers
// see a trusted event. Also measures FAQ row width vs the true layout viewport.
// Usage: node faq-probe.mjs <slug> <width>
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
const PORT = 9200 + Math.floor(Math.random() * 90);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-faq-"));
const vh = WIDTH <= 430 ? 844 : 900;
const chrome = spawn(CHROME, [
  "--headless=new", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
  "--hide-scrollbars", "--disable-smooth-scrolling",
  `--window-size=${WIDTH},${vh}`, `--remote-debugging-port=${PORT}`, "--remote-allow-origins=*",
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
await send("Emulation.setDeviceMetricsOverride", { width: WIDTH, height: vh, deviceScaleFactor: 1, mobile: WIDTH <= 430 }, sessionId);
const ev = (e) => send("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true }, sessionId).then((r) => r?.result?.value);

await send("Page.navigate", { url: `${BASE}/${SLUG}` }, sessionId);
for (let i = 0; i < 90; i++) { if (await ev("document.readyState") === "complete") break; await wait(300); }
await wait(2500);

console.log("--- geometry ---");
console.log(JSON.stringify(await ev(`(function(){
  const de=document.documentElement;
  const items=Array.from(document.querySelectorAll(".w-dropdown")).slice(0,3).map(d=>{
    const r=d.getBoundingClientRect(); const s=getComputedStyle(d);
    return { cls:(typeof d.className==='string'?d.className:'').slice(0,40), display:s.display, width:Math.round(r.width),
      right:Math.round(r.right), maxW:s.maxWidth, w:s.width };
  });
  const list=document.querySelector(".w-dropdown-list");
  return { layoutViewport: de.clientWidth, innerWidth, docScrollWidth: de.scrollWidth,
    items, listPosition: list?getComputedStyle(list).position:null };
})()`), null, 1));

// scroll the first FAQ toggle into view and click it with real input events
const box = await ev(`(function(){
  const tog=document.querySelector(".w-dropdown-toggle");
  if(!tog) return null;
  tog.scrollIntoView({block:"center"});
  const r=tog.getBoundingClientRect();
  return { x: Math.round(r.left + Math.min(r.width,200)/2), y: Math.round(r.top + r.height/2),
           text: tog.textContent.replace(/\\s+/g,' ').trim().slice(0,50) };
})()`);
console.log("--- toggle ---", JSON.stringify(box));
if (box) {
  for (const type of ["mousePressed", "mouseReleased"]) {
    await send("Input.dispatchMouseEvent", {
      type, x: box.x, y: box.y, button: "left", clickCount: 1, buttons: type === "mousePressed" ? 1 : 0,
    }, sessionId);
    await wait(80);
  }
  await wait(1800);
}
console.log("--- after real click ---");
console.log(JSON.stringify(await ev(`(function(){
  const tog=document.querySelector(".w-dropdown-toggle");
  const wrap=tog.closest(".w-dropdown");
  const list=wrap.querySelector(".w-dropdown-list");
  const r=list.getBoundingClientRect();
  return { toggleOpen: tog.classList.contains("w--open"), listOpen: list.classList.contains("w--open"),
    listDisplay: getComputedStyle(list).display, listH: Math.round(r.height), listW: Math.round(r.width),
    ariaExpanded: tog.getAttribute("aria-expanded"),
    answerVisible: r.height > 10,
    webflowLoaded: typeof window.Webflow !== "undefined" };
})()`), null, 1));

ws.close(); chrome.kill();
try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
