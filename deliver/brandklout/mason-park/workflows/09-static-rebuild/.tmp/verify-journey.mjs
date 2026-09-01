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

// ------------------------------------- 9. every reveal lands, in the viewport
// The complaint this check exists to answer: "the animation should work when
// they are in the viewport." A reveal that has already finished before its
// chapter is on screen is invisible, and so is one whose trigger was measured
// against a document height that has since changed. Walk the page chapter by
// chapter, park each one in the middle of the viewport, and assert that every
// element the timeline touches has reached its resting state THERE.
const REVEALED = ".chapter-tag span, [data-split], .rg-body, .rg-item, .pe-card .pe-note," +
  " .pe-card h3, .tg-shot, .vs-row, .iv-facts > div, .pr-mark, .ar-lede, .ar-actions, .ar-meta";
const stuck = [];
const chapterIds = await evaluate(
  `[...document.querySelectorAll('section[data-chapter]')].map(s=>s.id)`);
for (const cid of chapterIds) {
  const mid = await evaluate(`(()=>{
    const s=document.getElementById(${JSON.stringify(cid)});
    const r=s.getBoundingClientRect();
    return r.top + scrollY + r.height/2 - innerHeight/2;
  })()`);
  await seek(Math.max(0, mid));
  await wait(1200);   // the longest reveal is 1.15s; let it finish
  const bad = await evaluate(`(()=>{
    const s=document.getElementById(${JSON.stringify(cid)});
    return [...s.querySelectorAll(${JSON.stringify(REVEALED)})].filter(el=>{
      const r=el.getBoundingClientRect();
      // Only judge what is actually on screen at this scroll position.
      if (r.bottom < 0 || r.top > innerHeight || r.width === 0) return false;
      const cs=getComputedStyle(el);
      if (el.closest('[aria-hidden="true"]') || el.hasAttribute('aria-hidden')) return false;
      if (Number(cs.opacity) < 0.99) return true;
      if (cs.visibility === 'hidden') return true;
      // A residual translate means the entrance never ran to completion.
      const m=new DOMMatrixReadOnly(cs.transform);
      return Math.abs(m.m42) > 1.5;
    }).map(el=>(el.className||el.tagName)+'@'+Math.round(el.getBoundingClientRect().top));
  })()`);
  if (bad.length) stuck.push(cid + ": " + bad.slice(0, 4).join(", "));
}
check("every reveal has landed while its chapter is on screen", stuck.length === 0,
  stuck.slice(0, 4).join("  |  "));

// --------------------------- 9b. the type tier actually reaches the element
// An unbalanced brace in the token block once made CSS error recovery swallow
// all four type tiers as if they were declarations. --t-disp stayed at 1 at
// every width, so the hero headline rendered at its 1440 size on a 360 phone
// and ran off the screen. Nothing caught it: audit.mjs checks classes,
// responsive.mjs checks rendered text size, and neither can see a stylesheet
// that parsed into the wrong shape. This asserts the tier reaches the glyph.
//
// The shell, not the document, is the thing to measure. `body { overflow-x:
// hidden }` makes a document-level check report nothing while a headline is
// silently clipped, and a grid item's default `min-width: auto` means the
// single longest word is what actually binds.
const tierRows = [];
for (const [w, maxDisp] of [[360, 0.6], [768, 0.72], [1440, 1.01]]) {
  await load(w, 800);
  const r = await evaluate(`(()=>{
    const h1=document.querySelector('.ar-title');
    const shell=h1.parentElement;
    const nav=document.querySelector('.navbar_component');
    const hero=document.querySelector('.ch-arrival');
    return {
      disp: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--t-disp')),
      h1: Math.round(parseFloat(getComputedStyle(h1).fontSize)),
      clip: shell.scrollWidth - shell.clientWidth,
      overlay: Math.round(hero.getBoundingClientRect().y - nav.getBoundingClientRect().y),
    };
  })()`);
  tierRows.push(`${w}: t-disp ${r.disp}, h1 ${r.h1}px, clip ${r.clip}, overlay ${r.overlay}`);
  check(`type tier steps at ${w}`, r.disp <= maxDisp, `--t-disp ${r.disp}`);
  check(`hero headline is not clipped at ${w}`, r.clip <= 1, `shell overflow ${r.clip}px`);
  check(`header overlays the hero at ${w}`, Math.abs(r.overlay) <= 1, `hero sits ${r.overlay}px below the nav`);
}

// ------------------------------------------------- 10. the root proof
// Read the computed root at each breakpoint and compare it against the table in
// scripts/fluid-root.mjs, so the stylesheet and the generator can never drift.
// Assert the page LOADED first: about:blank reports a perfectly plausible 16px
// root and would pass every assertion below it.
const rootRows = [];
for (const [w, want] of [[360, null], [390, 13.76], [768, 16], [1440, 16], [1920, 18]]) {
  await load(w, 900);
  const got = await evaluate(`(()=>{
    const probe=document.querySelector('.ch-arrival h1');
    if(!probe) return null;
    return Math.round(parseFloat(getComputedStyle(document.documentElement).fontSize)*100)/100;
  })()`);
  rootRows.push(`${w}:${got}`);
  if (got === null) { check(`root proof @ ${w}`, false, "page did not load"); continue; }
  if (want !== null) check(`root font-size @ ${w} is ${want}px`, Math.abs(got - want) < 0.06, `got ${got}`);
}

// ------------------------------------------------- 11. the pin still fits
// A scene that is 100svh tall always reports scrollHeight === clientHeight, so
// that comparison proves nothing. Measure the pinned chapter's own contents
// against its box at 1920, where the fluid root makes them 12.5% larger.
await load(1920, 1000);
await seek(await evaluate(`document.getElementById('pathPin').getBoundingClientRect().top + scrollY + 200`));
const pinFit = await evaluate(`(()=>{
  const pin=document.getElementById('pathPin');
  const box=pin.getBoundingClientRect();
  const over=[...pin.querySelectorAll('.pa-card')].filter(c=>{
    const r=c.getBoundingClientRect();
    return r.height > box.height + 2;
  }).length;
  return {pinH: Math.round(box.height), vh: innerHeight, over};
})()`);
check("pinned chapter fits the viewport at 1920",
  pinFit.over === 0 && pinFit.pinH <= pinFit.vh + 2, JSON.stringify(pinFit));

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
