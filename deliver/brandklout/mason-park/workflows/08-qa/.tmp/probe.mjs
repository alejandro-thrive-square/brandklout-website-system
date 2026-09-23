// Targeted follow-up probes the screenshot pass cannot settle:
//   1. what the mobile layout viewport actually is (the "390" capture rendered ~557px wide)
//   2. real horizontal overflow, which body{overflow-x:clip} hides from scrollWidth
//   3. computed colour + contrast of the consultation hero h1 against its section background
//   4. whether the native Webflow Dropdown FAQ actually opens on click
//   5. form input placeholder attributes as served
// Usage: node probe.mjs <slug> <width>
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";

const [, , SLUG, W = "390"] = process.argv;
const WIDTH = +W;
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = "https://mason-park-dental.webflow.io";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const PORT = 9400 + Math.floor(Math.random() * 90);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-probe-"));
const vh = WIDTH <= 430 ? 844 : 900;
const chrome = spawn(CHROME, [
  "--headless=new", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
  "--hide-scrollbars", "--force-prefers-reduced-motion", "--disable-smooth-scrolling",
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
await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] }, sessionId);
await send("Emulation.setDeviceMetricsOverride", { width: WIDTH, height: vh, deviceScaleFactor: 1, mobile: WIDTH <= 430 }, sessionId);
const ev = (e) => send("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true }, sessionId).then((r) => r?.result?.value);

await send("Page.navigate", { url: `${BASE}/${SLUG}` }, sessionId);
for (let i = 0; i < 90; i++) { if (await ev("document.readyState") === "complete") break; await wait(300); }
await ev("(async()=>{const s=Math.max(300,innerHeight*0.7);for(let y=0;y<document.documentElement.scrollHeight;y+=s){scrollTo(0,y);await new Promise(r=>setTimeout(r,100));}scrollTo(0,0);await new Promise(r=>setTimeout(r,800));return 1})()");

const out = await ev(`(function(){
  const de = document.documentElement, b = document.body;
  const cs = getComputedStyle(de), bs = getComputedStyle(b);
  const lum = (c) => { const m = c.match(/[\\d.]+/g).map(Number);
    const f = m.slice(0,3).map(v => { v/=255; return v<=0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055,2.4); });
    return 0.2126*f[0]+0.7152*f[1]+0.0722*f[2]; };
  const contrast = (a,bb) => { const l1=lum(a), l2=lum(bb); const hi=Math.max(l1,l2), lo=Math.min(l1,l2); return +((hi+0.05)/(lo+0.05)).toFixed(2); };
  const bgOf = (el) => { let e = el; while (e) { const c = getComputedStyle(e).backgroundColor;
    if (c && !/rgba\\(0, 0, 0, 0\\)|transparent/.test(c)) return c; e = e.parentElement; } return "rgb(255,255,255)"; };

  // real overflow: body{overflow-x:clip} hides it from scrollWidth, so measure boxes
  const vpW = de.clientWidth;
  const over = [];
  for (const el of document.querySelectorAll("body *")) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const s = getComputedStyle(el);
    if (s.display === "none" || s.visibility === "hidden") continue;
    if (r.right > vpW + 1 || r.left < -1) {
      // ignore anything an ancestor deliberately clips
      let anc = el.parentElement, clipped = false;
      while (anc) { const as = getComputedStyle(anc);
        if (/hidden|clip/.test(as.overflowX)) { clipped = true; break; } anc = anc.parentElement; }
      over.push({ tag: el.tagName.toLowerCase(),
        cls: (typeof el.className === "string" ? el.className : "").trim().slice(0, 70),
        left: Math.round(r.left), right: Math.round(r.right), clippedByAncestor: clipped });
    }
    if (over.length > 40) break;
  }

  const headings = Array.from(document.querySelectorAll("h1,h2")).slice(0, 6).map((h) => {
    const s = getComputedStyle(h), bg = bgOf(h);
    return { tag: h.tagName, text: h.textContent.replace(/\\s+/g," ").trim().slice(0,60),
      color: s.color, bg, contrast: contrast(s.color, bg),
      spans: Array.from(h.querySelectorAll("span,em,strong")).map(x => ({
        t: x.textContent.trim().slice(0,30), c: getComputedStyle(x).color,
        contrast: contrast(getComputedStyle(x).color, bg) })) };
  });

  const paras = Array.from(document.querySelectorAll("p")).slice(0, 8).map((p) => {
    const s = getComputedStyle(p), bg = bgOf(p);
    return { t: p.textContent.replace(/\\s+/g," ").trim().slice(0,45), color: s.color, bg, contrast: contrast(s.color, bg) };
  }).filter(p => p.t);

  const inputs = Array.from(document.querySelectorAll("input,textarea")).filter(i=>i.type!=="hidden")
    .map(i => ({ name: i.name, type: i.type, placeholder: i.placeholder, required: i.required }));

  // eyebrow / section-label state (the legacy regression suspect)
  const labels = Array.from(document.querySelectorAll(
    "[class*='section-label'],[class*='eyebrow'],[class*='label']")).slice(0, 12).map((el) => {
      const s = getComputedStyle(el), r = el.getBoundingClientRect();
      return { cls: (typeof el.className==="string"?el.className:"").slice(0,50),
        text: el.textContent.replace(/\\s+/g," ").trim().slice(0,40),
        visibility: s.visibility, display: s.display, opacity: s.opacity, color: s.color,
        transform: s.transform === "none" ? "none" : s.transform.slice(0, 40),
        clip: s.clipPath, rect: { w: Math.round(r.width), h: Math.round(r.height) } };
    });

  return {
    url: location.pathname,
    innerWidth: innerWidth, deClientWidth: de.clientWidth, deScrollWidth: de.scrollWidth,
    bodyScrollWidth: b.scrollWidth, bodyClientWidth: b.clientWidth,
    bodyRectW: Math.round(b.getBoundingClientRect().width),
    visualViewport: { w: Math.round(visualViewport.width), scale: visualViewport.scale },
    htmlZoom: cs.zoom, bodyZoom: bs.zoom, htmlFontSize: cs.fontSize,
    htmlOverflowX: cs.overflowX, bodyOverflowX: bs.overflowX,
    devicePixelRatio, screenW: screen.width,
    realOverflow: over, headings, paras, inputs, labels,
  };
})()`);
console.log(JSON.stringify(out, null, 2));

// FAQ accordion interaction test
const faq = await ev(`(function(){
  const tog = document.querySelector(".w-dropdown-toggle");
  if (!tog) return { hasDropdown: false };
  const list = tog.parentElement.querySelector(".w-dropdown-list");
  const before = { display: getComputedStyle(list).display, h: Math.round(list.getBoundingClientRect().height) };
  tog.click();
  return { hasDropdown: true, before, toggleText: tog.textContent.replace(/\\s+/g," ").trim().slice(0,50) };
})()`);
await wait(1200);
const faqAfter = await ev(`(function(){
  const tog = document.querySelector(".w-dropdown-toggle");
  if (!tog) return null;
  const list = tog.parentElement.querySelector(".w-dropdown-list");
  const r = list.getBoundingClientRect();
  return { display: getComputedStyle(list).display, h: Math.round(r.height), w: Math.round(r.width),
    open: list.classList.contains("w--open"), text: list.textContent.replace(/\\s+/g," ").trim().slice(0,80) };
})()`);
console.log("FAQ:", JSON.stringify({ ...faq, after: faqAfter }, null, 2));

ws.close(); chrome.kill();
try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
