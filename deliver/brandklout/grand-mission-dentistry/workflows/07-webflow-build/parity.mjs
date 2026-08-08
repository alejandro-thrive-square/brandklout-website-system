/**
 * parity.mjs — computed-style diff between the LOCAL design and the LIVE
 * Webflow page, at the same viewport.
 *
 * "Same HTML/CSS/JS" cannot be checked by comparing source: Webflow's output is
 * a different DOM (flat classes, `.w-embed` wrappers) that is *supposed* to
 * render identically. So this compares what actually renders — computed style
 * on elements addressed by the stable ids both versions share.
 *
 * Usage: node parity.mjs <designDir> <liveUrl> [viewportWidth]
 *   node parity.mjs ../04-design/.tmp/final-design-gsap https://dr-nahlah.webflow.io 1440
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { spawn } from "node:child_process";

const [DESIGN_DIR, LIVE_URL, W = "1440"] = process.argv.slice(2);
const VW = parseInt(W, 10);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const MIME = { ".html": "text/html; charset=utf-8", ".css": "text/css",
  ".js": "text/javascript", ".png": "image/png", ".jpg": "image/jpeg",
  ".mp4": "video/mp4", ".svg": "image/svg+xml" };
const srv = http.createServer((q, r) => {
  const rel = decodeURIComponent(q.url.split("?")[0]).replace(/^\//, "") || "index.html";
  const fp = path.join(DESIGN_DIR, rel);
  if (!fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { r.writeHead(404).end(); return; }
  r.writeHead(200, { "content-type": MIME[path.extname(fp)] || "application/octet-stream" });
  fs.createReadStream(fp).pipe(r);
});
const PORT = 8700 + Math.floor(Math.random() * 90);
await new Promise((r) => srv.listen(PORT, "127.0.0.1", r));

const CDP = 9700 + Math.floor(Math.random() * 300);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-par-"));
const chrome = spawn("C:/Program Files/Google/Chrome/Application/chrome.exe", [
  "--headless=new", "--disable-gpu", "--hide-scrollbars",
  `--remote-debugging-port=${CDP}`, "--remote-allow-origins=*",
  `--window-size=${VW},900`, "--force-device-scale-factor=1",
  "--no-first-run", "--no-default-browser-check",
  `--user-data-dir=${profile}`, "about:blank"]);
const getJSON = (p) => new Promise((res, rej) => {
  http.get({ host: "127.0.0.1", port: CDP, path: p }, (r) => {
    let d = ""; r.on("data", (c) => (d += c)); r.on("end", () => res(JSON.parse(d)));
  }).on("error", rej);
});
let wsUrl;
for (let i = 0; i < 150 && !wsUrl; i++) {
  try { wsUrl = (await getJSON("/json/version")).webSocketDebuggerUrl; } catch {}
  if (!wsUrl) await wait(300);
}
const ws = new WebSocket(wsUrl);
let mid = 0; const pending = new Map();
ws.addEventListener("message", async (e) => {
  const raw = typeof e.data === "string" ? e.data : await e.data.text();
  const m = JSON.parse(raw);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
});
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
const send = (m, p = {}, s) => new Promise((res, rej) => {
  const i = ++mid;
  const t = setTimeout(() => rej(new Error("timeout " + m)), 90000);
  pending.set(i, (x) => { clearTimeout(t); x.error ? rej(new Error(x.error.message)) : res(x.result); });
  ws.send(JSON.stringify({ id: i, method: m, params: p, sessionId: s }));
});
const { targetInfos } = await send("Target.getTargets");
const pt = targetInfos.find((t) => t.type === "page")
  || { targetId: (await send("Target.createTarget", { url: "about:blank" })).targetId };
const { sessionId } = await send("Target.attachToTarget", { targetId: pt.targetId, flatten: true });
await send("Page.enable", {}, sessionId);
await send("Emulation.setEmulatedMedia",
  { features: [{ name: "prefers-reduced-motion", value: "no-preference" }] }, sessionId);

/* Properties that describe how a thing LOOKS. Deliberately excludes anything
   GSAP mutates at runtime (transform, opacity) — those differ by scroll
   position, not by build fidelity. */
const PROBE = `(function(){
  var PROPS=['font-family','font-size','font-weight','line-height','letter-spacing',
    'color','background-color','text-transform','display','flex-direction',
    'grid-template-columns','justify-content','align-items',
    'padding-top','padding-bottom','padding-left','padding-right',
    'margin-top','margin-bottom','border-radius','max-width','width','height'];
  var out={};
  document.querySelectorAll('[id]').forEach(function(el){
    if(!el.id || /^w-/.test(el.id)) return;
    var c=getComputedStyle(el), rec={tag:el.tagName};
    PROPS.forEach(function(p){ rec[p]=c.getPropertyValue(p); });
    var r=el.getBoundingClientRect();
    rec.__w=Math.round(r.width);
    out[el.id]=rec;
  });
  return JSON.stringify(out);
})()`;

/* Prove the stylesheet applied before trusting a single measurement. Headless
   Chrome here intermittently fails the CSS fetch, and an unstyled page does not
   error — it produces a full set of plausible computed values that differ from
   the design everywhere. That is not a small distortion: the same page measured
   166 diffs on a failed load and 79 on the next run, and an earlier failed load
   was nearly filed as a 151-diff regression. `.gm-header` is `position: fixed`
   only when the stylesheet is in force. */
const SENTINEL = `(function(){var h=document.querySelector(".gm-header");
  return !!h && getComputedStyle(h).position === "fixed";})()`;

async function snap(url, label) {
  let v = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    await send("Page.navigate", { url }, sessionId);
    await wait(9000);
    const ok = await send("Runtime.evaluate", { expression: SENTINEL, returnByValue: true }, sessionId);
    if (!ok.result.value) {
      console.log(`${label}: stylesheet not applied, reloading (${attempt}/3) …`);
      if (attempt === 3) {
        console.error(`ABORT: ${label} never applied its stylesheet — no comparison made.`);
        try { chrome.kill(); } catch {}
        srv.close();
        process.exit(3);
      }
      continue;
    }
    const r = await send("Runtime.evaluate",
      { expression: PROBE, returnByValue: true }, sessionId);
    v = JSON.parse(r.result.value);
    break;
  }
  console.log(`${label}: ${Object.keys(v).length} id-addressed elements`);
  return v;
}

const design = await snap(`http://127.0.0.1:${PORT}/index.html`, "design");
/* Cache-bust the live URL. Webflow's `publish_site` returns immediately and
   compiles asynchronously, and the CDN will happily serve the PREVIOUS build
   for minutes afterwards — which reads as a page that has lost its styling.
   That produced a 151-diff "regression" on thank-you whose every symptom
   (transparent backgrounds, zeroed padding, display block) was absent when the
   same element was measured directly a minute later. */
const bust = (u) => u + (u.includes("?") ? "&" : "?") + "pcb=" + process.pid + Date.now();
const live = await snap(bust(LIVE_URL), "live  ");

const ids = Object.keys(design).filter((k) => live[k]);
console.log(`\ncomparable ids: ${ids.length}  (design-only: ` +
  `${Object.keys(design).length - ids.length}, live-only: ` +
  `${Object.keys(live).length - ids.length})\n`);

const NUMERIC = /^-?[\d.]+px$/;
const diffs = [];
for (const id of ids) {
  for (const prop of Object.keys(design[id])) {
    if (prop === "tag" || prop === "__w") continue;
    let a = (design[id][prop] || "").trim(), b = (live[id][prop] || "").trim();
    if (a === b) continue;
    // px values within 1.5px are rounding, not a fidelity problem.
    if (NUMERIC.test(a) && NUMERIC.test(b) &&
        Math.abs(parseFloat(a) - parseFloat(b)) <= 1.5) continue;
    // font-family: compare the FIRST family only; Webflow appends fallbacks.
    if (prop === "font-family" &&
        a.split(",")[0].replace(/["']/g, "").trim().toLowerCase() ===
        b.split(",")[0].replace(/["']/g, "").trim().toLowerCase()) continue;
    diffs.push({ id, prop, design: a.slice(0, 42), live: b.slice(0, 42) });
  }
}

const byProp = {};
for (const d of diffs) (byProp[d.prop] ||= []).push(d);
console.log(`DIFFS: ${diffs.length} across ${Object.keys(byProp).length} properties\n`);
for (const [prop, list] of Object.entries(byProp).sort((x, y) => y[1].length - x[1].length)) {
  console.log(`  ${prop}  (${list.length})`);
  for (const d of list.slice(0, 4)) {
    console.log(`      #${d.id}\n        design: ${d.design}\n        live  : ${d.live}`);
  }
  if (list.length > 4) console.log(`      ... ${list.length - 4} more`);
}
fs.writeFileSync(path.join(DESIGN_DIR, "..", "..", "..",
  "07-webflow-build", ".tmp", "parity-report.json"),
  JSON.stringify({ viewport: VW, comparable: ids.length, diffs }, null, 1));
try { chrome.kill(); } catch {}
srv.close();
process.exit(diffs.length ? 1 : 0);
