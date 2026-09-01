// Drive the homepage and ASSERT its behaviour. Screenshots cannot do this.
//
//   node verify-journey.mjs [route]
//
// DESIGN-STANDARD.md is explicit that a screenshot cannot tell you whether a
// reveal fired, a counter ran, or a scrub is a scrub. The check that matters is
// the third one: step the scroll through a scrubbed chapter and assert the
// content is at a DIFFERENT INTERMEDIATE STATE at 25%, 50% and 75% of its
// range. A scene that snaps between two states is a triggered scene wearing a
// costume, and this is the only check that catches it.
//
// What it asserts:
//   1. no horizontal overflow at 360 / 390 / 768 / 1024 / 1440
//   2. GSAP and both plugins registered, no console errors
//   3. chapter 01's statement is scrubbed  (word colours differ across 3 steps)
//   4. chapter 05's path is pinned AND scrubbed (track x differs across 3 steps)
//   5. chapter 06's quote is scrubbed
//   6. the reading progress bar tracks real document progress
//   7. the header inverts over the hero and resolves to solid after it
//   8. counters reach their stated value
//   9. reduced motion reveals every hidden element and clips nothing
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(HERE, "dist");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const ROUTE = (process.argv[2] || "/").replace(/^[A-Za-z]:[\\/].*?[\\/](?=[^\\/]*$)/, "") || "/";

const MIME = {
  ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript",
  ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml",
  ".gif": "image/gif", ".ico": "image/x-icon", ".xml": "application/xml", ".txt": "text/plain",
};
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(req.url.split("?")[0]);
  let file = path.join(DIST, p);
  if (p.endsWith("/")) file = path.join(file, "index.html");
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    const alt = path.join(DIST, p, "index.html");
    file = fs.existsSync(alt) ? alt : path.join(DIST, "404.html");
  }
  res.writeHead(200, { "content-type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const BASE = "http://127.0.0.1:" + server.address().port;

const PORT = 9500 + Math.floor(Math.random() * 90);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "mpd-verify-"));
const chrome = spawn(CHROME, [
  "--headless=new", "--disable-gpu", "--hide-scrollbars",
  `--remote-debugging-port=${PORT}`, "--remote-allow-origins=*",
  "--no-first-run", "--no-default-browser-check", "--force-device-scale-factor=1",
  `--user-data-dir=${profile}`, "about:blank",
]);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const getJSON = (p) => new Promise((res, rej) => {
  http.get({ host: "127.0.0.1", port: PORT, path: p }, (r) => {
    let d = ""; r.on("data", (c) => (d += c)); r.on("end", () => res(JSON.parse(d)));
  }).on("error", rej);
});
let wsUrl;
for (let i = 0; i < 80 && !wsUrl; i++) {
  try { wsUrl = (await getJSON("/json/version")).webSocketDebuggerUrl; } catch { await wait(200); }
}
const ws = new WebSocket(wsUrl);
let id = 0; const pending = new Map();
const consoleErrors = [];
ws.addEventListener("message", (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); return; }
  if (m.method === "Log.entryAdded" && m.params.entry.level === "error") consoleErrors.push(m.params.entry.text);
  if (m.method === "Runtime.exceptionThrown") consoleErrors.push(String(m.params.exceptionDetails.text));
});
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
const { targetInfos } = await new Promise((resolve) => {
  const mid = ++id; pending.set(mid, resolve);
  ws.send(JSON.stringify({ id: mid, method: "Target.getTargets", params: {} }));
});
const t = targetInfos.find((x) => x.type === "page");
let sessionId;
({ sessionId } = await new Promise((resolve) => {
  const mid = ++id; pending.set(mid, resolve);
  ws.send(JSON.stringify({ id: mid, method: "Target.attachToTarget", params: { targetId: t.targetId, flatten: true } }));
}));
const send = (method, params = {}) => new Promise((resolve) => {
  const mid = ++id; pending.set(mid, resolve);
  ws.send(JSON.stringify({ id: mid, method, params, sessionId }));
});
await send("Page.enable"); await send("Runtime.enable"); await send("Log.enable");
const evaluate = async (expr) =>
  (await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true }))?.result?.value;

const results = [];
const check = (name, pass, detail = "") => {
  results.push({ name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? "   " + detail : ""}`);
};

async function load(width, height, reduced = false) {
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 700 });
  await send("Emulation.setEmulatedMedia", {
    features: reduced ? [{ name: "prefers-reduced-motion", value: "reduce" }] : [],
  });
  await send("Page.navigate", { url: BASE + ROUTE });
  await wait(1400);
  await evaluate(`(async()=>{ if(document.fonts&&document.fonts.ready) await document.fonts.ready; })()`);
  await wait(400);
}

// Scroll to an absolute document position and let the scrub lag settle. The
// scrubs run at .3-.5, so a short settle is required or every reading is the
// PREVIOUS step's state and the assertions pass for the wrong reason.
const seek = async (y) => {
  await evaluate(`scrollTo(0, ${Math.round(y)})`);
  await wait(650);
};

// ------------------------------------------------------- 1. no overflow
for (const w of [360, 390, 768, 1024, 1440]) {
  await load(w, 900);
  const over = await evaluate(`(()=>{
    const d=document.documentElement;
    const wide=[...document.querySelectorAll('body *')].filter(el=>{
      const r=el.getBoundingClientRect();
      return r.width>0 && (r.right > d.clientWidth+2 || r.left < -2) && getComputedStyle(el).position!=='fixed';
    }).slice(0,4).map(el=>el.className||el.tagName);
    return {scrollW:d.scrollWidth, clientW:d.clientWidth, wide};
  })()`);
  check(`no horizontal overflow @ ${w}`, over.scrollW <= over.clientW + 1,
    `scrollWidth ${over.scrollW} vs ${over.clientW}` + (over.wide.length ? " :: " + over.wide.join(" | ") : ""));
}

// ------------------------------------------------------- 2. runtime is live
await load(1440, 900);
const runtime = await evaluate(`({
  gsap: !!window.gsap,
  st: !!window.ScrollTrigger,
  split: !!window.SplitText,
  ready: document.documentElement.classList.contains('jr-ready'),
  failed: document.documentElement.classList.contains('jr-fail'),
  triggers: window.ScrollTrigger ? ScrollTrigger.getAll().length : 0,
  pins: window.ScrollTrigger ? ScrollTrigger.getAll().filter(t=>t.pin).length : 0,
  scrubs: window.ScrollTrigger ? ScrollTrigger.getAll().filter(t=>t.scroll && t.vars && t.vars.scrub).length : 0,
})`);
check("gsap + ScrollTrigger + SplitText loaded", runtime.gsap && runtime.st && runtime.split, JSON.stringify(runtime));
check("motion layer booted (jr-ready, not jr-fail)", runtime.ready && !runtime.failed);
check("at least one pinned chapter", runtime.pins >= 1, `${runtime.pins} pin(s), ${runtime.triggers} trigger(s)`);
check("at least three scrubbed triggers", runtime.scrubs >= 3, `${runtime.scrubs} scrub(s)`);

// --------------------------------------------- 3. chapter 01 really scrubs
// Sampled against the TRIGGER'S OWN start and end, not a guess at where the
// section sits. A guessed window can sit entirely past the end of a short
// scrub, read the same finished state three times, and report "not scrubbed"
// for a scrub that works.
const relayST = await evaluate(`(()=>{
  const st = ScrollTrigger.getAll().find(t => t.trigger && t.trigger.classList
    && t.trigger.classList.contains('ch-relay') && t.vars.scrub && t.animation
    && String(t.animation.targets && t.animation.targets()[0] && t.animation.targets()[0].className).includes('jr-word'));
  return st ? {start: st.start, end: st.end} : null;
})()`);
const relayReads = [];
if (relayST) {
  for (const f of [0.1, 0.5, 0.9]) {
    await seek(relayST.start + (relayST.end - relayST.start) * f);
    relayReads.push(await evaluate(`(()=>{
      const w=[...document.querySelectorAll('#relayBig .jr-word')];
      if(!w.length) return null;
      // How many words have been written, rather than three sampled colours:
      // a scrub is "how far through", so the count IS the intermediate state.
      const written = w.filter(el=>getComputedStyle(el).color==='rgb(46, 53, 56)').length;
      return written + '/' + w.length;
    })()`));
  }
  const counts = relayReads.map((r) => Number(String(r).split("/")[0]));
  check("chapter 01 statement is SCRUBBED, not triggered",
    new Set(counts).size === 3 && counts[0] < counts[1] && counts[1] < counts[2],
    relayReads.map((r, i) => `${[10, 50, 90][i]}%: ${r} written`).join("  |  "));
} else {
  check("chapter 01 statement is SCRUBBED, not triggered", false, "no scrubbed word tween found");
}

// --------------------------------------------- 4. chapter 05 pins and scrubs
const pathInfo = await evaluate(`(()=>{
  const st = ScrollTrigger.getAll().find(t=>t.pin);
  return st ? {start: st.start, end: st.end} : null;
})()`);
let pathReads = [];
if (pathInfo) {
  for (const f of [0.2, 0.5, 0.8]) {
    await seek(pathInfo.start + (pathInfo.end - pathInfo.start) * f);
    pathReads.push(await evaluate(`(()=>{
      const tr=document.getElementById('pathTrack');
      const m=new DOMMatrixReadOnly(getComputedStyle(tr).transform);
      const bar=document.getElementById('pathBar');
      const bm=new DOMMatrixReadOnly(getComputedStyle(bar).transform);
      const pinned = getComputedStyle(document.getElementById('pathPin')).position;
      return Math.round(m.m41) + '|' + bm.a.toFixed(2) + '|' + pinned;
    })()`));
  }
  const xs = pathReads.map((r) => Number(r.split("|")[0]));
  check("chapter 05 track travels through three distinct positions",
    new Set(xs).size === 3 && xs[0] > xs[1] && xs[1] > xs[2], pathReads.join("  |  "));
  check("chapter 05 is actually pinned mid-scene", pathReads[1].endsWith("fixed"), pathReads[1]);
} else {
  check("chapter 05 pin exists", false, "no pinned trigger found");
}

// --------------------------------------------- 5. chapter 06 quote scrubs
const proofRange = await evaluate(`(()=>{
  const s=document.querySelector('.pr-lead');
  const r=s.getBoundingClientRect();
  return {top: r.top + scrollY, height: r.height};
})()`);
const proofReads = [];
for (const f of [0.1, 0.5, 0.9]) {
  await seek(proofRange.top - 900 + proofRange.height * f + 500);
  proofReads.push(await evaluate(`(()=>{
    const w=[...document.querySelectorAll('#proofQuote .jr-word')];
    if(!w.length) return null;
    return [getComputedStyle(w[1]).color, getComputedStyle(w[Math.floor(w.length/2)]).color].join(' / ');
  })()`));
}
check("chapter 06 quote is SCRUBBED", new Set(proofReads.filter(Boolean)).size >= 2, proofReads.join("  |  "));

// --------------------------------------------- 6. reading progress is real
const progress = [];
for (const f of [0.1, 0.5, 0.95]) {
  await seek((await evaluate("document.documentElement.scrollHeight - innerHeight")) * f);
  progress.push(await evaluate(`(()=>{
    const b=document.querySelector('.jr-progress');
    return b ? Number(new DOMMatrixReadOnly(getComputedStyle(b).transform).a.toFixed(3)) : null;
  })()`));
}
check("reading progress tracks the document",
  progress[0] < progress[1] && progress[1] < progress[2] && progress[2] > 0.85, progress.join(" -> "));

// --------------------------------------------- 7. the header inverts
await seek(0);
const navTop = await evaluate(`(()=>{
  const n=document.querySelector('.navbar_component');
  return {solid:n.classList.contains('is-solid'), bg:getComputedStyle(n).backgroundColor,
          link:getComputedStyle(n.querySelector('.navbar_link')).color};
})()`);
await seek(await evaluate(`document.querySelector('.ch-arrival').getBoundingClientRect().height + 400`));
const navDown = await evaluate(`(()=>{
  const n=document.querySelector('.navbar_component');
  return {solid:n.classList.contains('is-solid'), bg:getComputedStyle(n).backgroundColor,
          link:getComputedStyle(n.querySelector('.navbar_link')).color};
})()`);
check("header is transparent with white links over the hero",
  !navTop.solid && /rgba\(0, 0, 0, 0\)|transparent/.test(navTop.bg) && navTop.link === "rgb(255, 255, 255)",
  JSON.stringify(navTop));
check("header resolves to solid past the hero",
  navDown.solid && navDown.bg === "rgb(255, 255, 255)" && navDown.link !== "rgb(255, 255, 255)",
  JSON.stringify(navDown));

// --------------------------------------------- 8. counters land on the value
await seek(await evaluate(`document.getElementById('tgFigures').getBoundingClientRect().top + scrollY - 300`));
await wait(2200);
const counters = await evaluate(`[...document.querySelectorAll('.tg-fig b')].map(b=>b.textContent)`);
check("counters land on their stated values",
  JSON.stringify(counters) === JSON.stringify(["3", "6mo", "35", "0%"]), counters.join(", "));

check("no console errors", consoleErrors.length === 0, consoleErrors.slice(0, 3).join(" || "));

// --------------------------------------------- 9. reduced motion is complete
await load(1440, 900, true);
const rm = await evaluate(`(()=>{
  const hidden=[...document.querySelectorAll('[data-anim="hide"]')]
    .filter(el=>getComputedStyle(el).visibility==='hidden').length;
  const zero=[...document.querySelectorAll('.ch *')]
    .filter(el=>el.textContent.trim()
      && !el.hasAttribute('aria-hidden')
      && !el.closest('[aria-hidden="true"]')
      && getComputedStyle(el).opacity==='0').length;
  const d=document.documentElement;
  return {hidden, zero, overflow: d.scrollWidth - d.clientWidth,
          counters:[...document.querySelectorAll('.tg-fig b')].map(b=>b.textContent).join(',')};
})()`);
check("reduced motion hides nothing", rm.hidden === 0 && rm.zero === 0, JSON.stringify(rm));
check("reduced motion does not overflow", rm.overflow <= 1, `overflow ${rm.overflow}`);
check("reduced motion still states the real figures", rm.counters === "3,6mo,35,0%", rm.counters);

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length} checks, ${failed.length} failed`);
ws.close(); chrome.kill(); server.close();
process.exit(failed.length ? 1 : 0);
