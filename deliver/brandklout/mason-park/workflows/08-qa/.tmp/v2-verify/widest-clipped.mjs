// Clip-aware "widest visible element" probe at a 390 viewport.
//
// Why this exists: `document.scrollWidth <= innerWidth` is vacuous on this site
// (body{overflow-x:clip}) and a naive box walk over-reports, because decorative
// elements that legitimately extend past the viewport are clipped by an ancestor
// (e.g. consult_proof_watermark inside section_consult_proof{overflow:hidden}).
// This probe intersects every element's border box with each clipping ancestor's
// box before taking the maximum right edge, so what it reports is what a phone
// can actually be scrolled to.
//
// Usage: node widest-clipped.mjs <slug> [slug ...]
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = "https://mason-park-dental.webflow.io";
const SLUGS = process.argv.slice(2);
const GAP_MS = 60_000;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

const PROBE = `(function () {
  const cw = document.documentElement.clientWidth;
  function clipRight(el) {
    let r = el.getBoundingClientRect();
    let right = r.right + scrollX, left = r.left + scrollX;
    let p = el.parentElement;
    while (p) {
      const cs = getComputedStyle(p);
      if (/hidden|clip|auto|scroll/.test(cs.overflowX)) {
        const pr = p.getBoundingClientRect();
        right = Math.min(right, pr.right + scrollX);
        left = Math.max(left, pr.left + scrollX);
      }
      p = p.parentElement;
    }
    return { left, right, clipped: right < r.right + scrollX };
  }
  let widest = 0, best = null;
  const over = [];
  for (const el of document.querySelectorAll("body *")) {
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") continue;
    const r0 = el.getBoundingClientRect();
    if (r0.width === 0 && r0.height === 0) continue;
    const c = clipRight(el);
    if (c.right - c.left <= 0) continue;   // fully clipped away
    if (c.right > widest) {
      widest = c.right;
      best = { tag: el.tagName.toLowerCase(),
               cls: (typeof el.className === "string" ? el.className : "").trim().slice(0, 90),
               left: Math.round(c.left), right: Math.round(c.right), clipped: c.clipped };
    }
    if (c.right > cw + 1 && over.length < 25) {
      over.push({ tag: el.tagName.toLowerCase(),
                  cls: (typeof el.className === "string" ? el.className : "").trim().slice(0, 90),
                  right: Math.round(c.right) });
    }
  }
  return { clientWidth: cw, innerWidth: window.innerWidth,
           scrollWidth: document.documentElement.scrollWidth,
           widestVisibleRight: Math.round(widest), widestEl: best, offenders: over };
})()`;

async function run(slug) {
  const PORT = 9800 + Math.floor(Math.random() * 100);
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-widest-"));
  const chrome = spawn(CHROME, [
    "--headless=new", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
    "--hide-scrollbars", "--force-prefers-reduced-motion", "--disable-smooth-scrolling",
    "--window-size=390,844", `--remote-debugging-port=${PORT}`, "--remote-allow-origins=*",
    "--force-device-scale-factor=1", "--no-first-run",
    "--disable-background-timer-throttling", "--disable-backgrounding-occluded-windows",
    "--disable-renderer-backgrounding", `--user-data-dir=${profile}`, "about:blank",
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
    if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); }
  });
  await new Promise((r) => ws.addEventListener("open", r, { once: true }));
  const send = (method, params = {}, sessionId) => new Promise((res, rej) => {
    const i = ++id;
    pend.set(i, (m) => (m.error ? rej(new Error(`${method}: ${m.error.message}`)) : res(m.result)));
    ws.send(JSON.stringify({ id: i, method, params, sessionId }));
  });
  const { targetInfos } = await send("Target.getTargets");
  const t = targetInfos.find((x) => x.type === "page");
  const { sessionId } = await send("Target.attachToTarget", { targetId: t.targetId, flatten: true });
  await send("Page.enable", {}, sessionId);
  await send("Runtime.enable", {}, sessionId);
  await send("Emulation.setEmulatedMedia",
    { features: [{ name: "prefers-reduced-motion", value: "reduce" }] }, sessionId);
  await send("Emulation.setDeviceMetricsOverride",
    { width: 390, height: 844, deviceScaleFactor: 1, mobile: true }, sessionId);
  const evaluate = (expr) =>
    send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true }, sessionId)
      .then((r) => r?.result?.value);
  try {
    await send("Page.navigate", { url: `${BASE}/${slug}` }, sessionId);
    for (let i = 0; i < 80; i++) {
      if ((await evaluate("document.readyState")) === "complete") break;
      await wait(300);
    }
    await evaluate(`(async () => {
      const step = Math.max(300, innerHeight * 0.7);
      for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
        scrollTo(0, y); await new Promise(r => setTimeout(r, 120));
      }
      scrollTo(0, 0); await new Promise(r => setTimeout(r, 500));
      return true; })()`);
    // settle on a stopped body height
    let prev = -1, quiet = Date.now();
    const start = Date.now();
    while (Date.now() - start < 30_000) {
      const h = await evaluate("document.body ? document.body.scrollHeight : 0");
      if (Math.abs(h - prev) > 4) quiet = Date.now();
      prev = h;
      if (h > 0 && Date.now() - quiet >= 3_000) break;
      await wait(500);
    }
    return await evaluate(PROBE);
  } finally {
    try { ws.close(); } catch {}
    chrome.kill();
    await wait(800);
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
  }
}

const out = {};
for (let i = 0; i < SLUGS.length; i++) {
  if (i > 0) await wait(GAP_MS);
  log(`=== ${SLUGS[i]} ===`);
  out[SLUGS[i]] = await run(SLUGS[i]);
  log(SLUGS[i], JSON.stringify(out[SLUGS[i]]));
}
fs.writeFileSync("widest-clipped.json", JSON.stringify(out, null, 2));
log("DONE");
