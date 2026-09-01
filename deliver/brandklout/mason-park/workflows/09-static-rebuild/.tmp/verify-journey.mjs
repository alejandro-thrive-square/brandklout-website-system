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
/* A part the page does not have is not a failure, and it is not a pass either.
   Announced, so "53 checks" on a page with half the parts cannot read as a
   clean sweep of the same 53. */
const skip = (name, why) => {
  results.push({ name, pass: true, skipped: true, detail: why });
  console.log(`SKIP  ${name}   ${why}`);
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
// SMOOTH SCROLLING MAKES A HARNESS LIE.
//
// site.css sets `html { scroll-behavior: smooth }`, so `scrollTo(0, y)`
// ANIMATES. Measured on the Invisalign page: a seek of 8,551px was still at
// scroll 0 when the assertion ran, and the check then judged whatever element
// happened to be at that spot. EVERY scroll-dependent check on a long page was
// exposed to it, and the ones that passed did so because the distance was short
// enough for the animation to finish inside the settle window.
//
// `behavior: "instant"` overrides the stylesheet per call, which is what a
// harness wants: it is measuring the page, not scrolling through it.
const seek = async (y) => {
  await evaluate(`scrollTo({ top: ${Math.round(y)}, left: 0, behavior: "instant" })`);
  await wait(650);
};

// ------------------------------------------------------- 1. no overflow
for (const w of [360, 390, 768, 899, 900, 1024, 1279, 1280, 1440]) {
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
/* A PIN belongs to the treatment path, which is a homepage chapter, so it is
   asserted only where that chapter exists. Forcing every page to pin something
   would be motion for its own sake, which is the opposite of what the standard
   is asking for. What IS required of every page is the other half of item 3 of
   the Definition of Done: scroll has to DRIVE content, not trigger it, in at
   least three places. That one is unconditional, and a content page meets it
   through scrubbed departures and drifting media rather than through a pin. */
const hasPath = await evaluate(`!!document.querySelector('.ch-path')`);
if (hasPath) check("the treatment path pins", runtime.pins >= 1, `${runtime.pins} pin(s), ${runtime.triggers} trigger(s)`);
else skip("the treatment path pins", "no treatment path on this page");
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
  skip("chapter 01 statement is SCRUBBED", "no #relayBig on this page");
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
  skip("chapter 05 pin", "no pinned chapter on this page");
}

// --------------------------------------------- 5. chapter 06 quote scrubs
const proofRange = await evaluate(`(()=>{
  const s=document.querySelector('.pr-lead');
  if(!s) return null;
  const r=s.getBoundingClientRect();
  return {top: r.top + scrollY, height: r.height};
})()`);
if (!proofRange) {
  skip("chapter 06 quote is SCRUBBED", "no pull quote on this page");
} else {
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
}

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
const hasFigures = await evaluate(`!!document.getElementById('tgFigures')`);
if (hasFigures) {
  await seek(await evaluate(`document.getElementById('tgFigures').getBoundingClientRect().top + scrollY - 300`));
  await wait(2200);
  const counters = await evaluate(`[...document.querySelectorAll('.tg-fig b')].map(b=>b.textContent)`);
  check("counters land on their stated values",
    JSON.stringify(counters) === JSON.stringify(["3", "6mo", "35", "0%"]), counters.join(", "));
} else {
  skip("counters land on their stated values", "no figures row on this page");
}

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
      // Only judge what is actually on screen at this scroll position, and only
      // what is ARRIVING. An element whose top edge has passed the viewport top
      // is in its departure, and a departure is a fade by definition: the
      // invitation's headline sat at y=-152 with 4px still showing and was
      // reported as an unlanded reveal. Arrival and departure are different
      // assertions and check 9a covers the other one.
      // The tolerance is 60px, not 0. The departure is triggered on the chapter
      // TAG, which sits above the heading, so once the tag crosses the top edge
      // both it and the heading are a few percent into their fade while the
      // heading's own top edge is still barely on screen. Measured: opacity
      // 0.971 with the heading at y=34. That is the departure working, not a
      // reveal that failed, and 9a is the check that owns it.
      if (r.bottom < 0 || r.top > innerHeight || r.top < 60 || r.width === 0) return false;
      const cs=getComputedStyle(el);
      if (el.closest('[aria-hidden="true"]') || el.hasAttribute('aria-hidden')) return false;
      if (Number(cs.opacity) < 0.99) return true;
      if (cs.visibility === 'hidden') return true;
      // A residual translate means the entrance never ran to completion.
      const m=new DOMMatrixReadOnly(cs.transform);
      return Math.abs(m.m42) > 1.5;
    }).map(el=>(el.className||el.tagName)+'@'+Math.round(el.getBoundingClientRect().top)
        +' op'+getComputedStyle(el).opacity
        +' y'+Math.round(scrollY)+'/'+Math.round(document.documentElement.scrollHeight-innerHeight));
  })()`);
  if (bad.length) stuck.push(cid + ": " + bad.slice(0, 4).join(", "));
}
check("every reveal has landed while its chapter is on screen", stuck.length === 0,
  stuck.slice(0, 4).join("  |  "));

// ------------------------------------- 8a. the drawer, driven not photographed
// The header floats over the hero with white contents, and the drawer it opens
// is white. Both states have to be right, and the close button has to be
// reachable: the drawer is `position: fixed` and a positioned element paints
// above a static one whatever the DOM order, so the button that opened it can
// end up UNDER it. Measured before the fix: the point at the centre of the
// toggle hit-tested to a `.navbar_link`, i.e. tapping to close NAVIGATED. A
// screenshot cannot see this; the button is drawn correctly, it is just not on
// top.
await load(390, 800);
const drawer = await evaluate(`(async()=>{
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const t=document.querySelector('.navbar_toggle');
  const nav=document.querySelector('.navbar_component');
  const menu=document.querySelector('.navbar_menu');
  const link=()=>getComputedStyle(menu.querySelector('.navbar_link')).color;
  const out={ closedLink: link(), closedNavBg: getComputedStyle(nav).backgroundColor };
  t.click(); await sleep(450);
  out.open = document.body.classList.contains('nav-open');
  out.aria = t.getAttribute('aria-expanded');
  out.openLink = link();
  out.openNavBg = getComputedStyle(nav).backgroundColor;
  out.menuOnScreen = menu.getBoundingClientRect().x < innerWidth - 10;
  const b=t.getBoundingClientRect();
  const hit=document.elementFromPoint(b.x+b.width/2, b.y+b.height/2);
  out.toggleHitBy = hit ? (hit.className||hit.tagName) : null;
  hit.click(); await sleep(450);
  out.closedAgain = !document.body.classList.contains('nav-open');
  out.path = location.pathname;
  return out;
})()`);
check("drawer opens, and the header inverts back to ink for it",
  drawer.open && drawer.menuOnScreen && drawer.aria === "true" &&
  drawer.closedLink === "rgb(255, 255, 255)" && drawer.openLink !== "rgb(255, 255, 255)",
  JSON.stringify(drawer));
check("the close button is not trapped under the drawer it opened",
  /navbar_toggle/.test(String(drawer.toggleHitBy)) && drawer.closedAgain && drawer.path === ROUTE,
  `hit ${drawer.toggleHitBy}, closed ${drawer.closedAgain}, still on ${drawer.path}`);

// ----------------------------- 8a2. the closed drawer leaves the tab order
// A drawer pushed off screen with a transform is still in the accessibility
// tree and still focusable. Measured before the fix: 52 focusable links sitting
// at x=415 on a 390px screen, all of them ahead of the page content in tab
// order. Nothing visual shows it, and no screenshot ever could.
await load(390, 800);
const tab = await evaluate(`(async()=>{
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const menu=document.querySelector('.navbar_menu');
  const link=()=>menu.querySelector('.navbar_link');
  link().focus();
  const closed = document.activeElement === link();
  const count = menu.querySelectorAll('a[href], button').length;
  document.querySelector('.navbar_toggle').click(); await sleep(450);
  link().focus();
  const open = document.activeElement === link();
  return { closedFocusable: closed, openFocusable: open, links: count };
})()`);
check("the closed drawer is out of the tab order, and back in when open",
  tab.closedFocusable === false && tab.openFocusable === true, JSON.stringify(tab));

await load(1440, 800);
const deskTab = await evaluate(`(()=>{
  const l=document.querySelector('.navbar_menu .navbar_link'); l.focus();
  return document.activeElement === l;
})()`);
check("the desktop nav stays focusable", deskTab === true, String(deskTab));

// ------------------------------------------- 8c. the FAQ actually opens
// `<details>` is progressive enhancement, so the risk is not that it fails to
// toggle but that the answer never becomes readable: a closed `<details>` child
// still reports a bounding box in Chrome, so measuring the answer proves
// nothing. Measure the SECTION growing, and `checkVisibility()` per answer.
await load(1440, 900);
const faq = await evaluate(`(async()=>{
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const sec=document.querySelector('.ch-invitation');
  const items=[...document.querySelectorAll('.ch-invitation .faq_item')];
  if(!items.length) return null;
  const h0=Math.round(sec.getBoundingClientRect().height);
  items.forEach(i=>i.querySelector('.faq_question').click());
  await sleep(600);
  return {
    count: items.length,
    grew: Math.round(sec.getBoundingClientRect().height) - h0,
    visible: items.filter(i=>i.querySelector('.faq_answer').checkVisibility()).length,
    minTap: Math.min(...items.map(i=>Math.round(i.querySelector('.faq_question').getBoundingClientRect().height))),
  };
})()`);
if (!faq) skip("the FAQ opens and reveals every answer", "no FAQ on this page");
if (faq) {
  check("the FAQ opens and reveals every answer",
    faq.grew > 200 && faq.visible === faq.count, JSON.stringify(faq));
  check("FAQ rows clear the 44px tap target", faq.minTap >= 44, `${faq.minTap}px`);
}

// ------------------------------- 8d. the touch branch of the treatment path
// The path branches on `(hover:none) and (pointer:coarse)`, not on width, so a
// large tablet takes the no-pin branch and a narrow desktop window does not.
// That branch cannot be reached by resizing, and it is the one most of this
// practice's traffic will actually get.
for (const w of [390, 1000]) {
  await send("Emulation.setDeviceMetricsOverride", { width: w, height: 900, deviceScaleFactor: 1, mobile: true });
  await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
  await send("Page.navigate", { url: BASE + ROUTE });
  await wait(1500);
  const t = await evaluate(`(()=>{
    const sec=document.querySelector('.ch-path'), tr=document.getElementById('pathTrack');
    // Guard INSIDE the page expression. A throw here makes Runtime.evaluate
    // return undefined, and the guard on the Node side then throws on the
    // undefined rather than reporting a missing part.
    if (!sec || !tr) return null;
    const cards=[...document.querySelectorAll('.pa-card')];
    const scrollable = getComputedStyle(tr).overflowX === 'auto';
    return {
      coarse: matchMedia('(hover:none) and (pointer:coarse)').matches,
      reachable: scrollable || tr.scrollWidth <= tr.clientWidth + 1,
      docOver: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      allOn: cards.every(c=>c.classList.contains('is-on')),
      cards: cards.length,
    };
  })()`);
  if (!t) { skip(`treatment path on touch @ ${w}`, "no treatment path on this page"); continue; }
  check(`treatment path is usable on touch @ ${w}`,
    t.coarse && t.reachable && t.docOver <= 1 && t.allOn && t.cards === 5, JSON.stringify(t));
}
await send("Emulation.setTouchEmulationEnabled", { enabled: false });

// ------------------------------- 8b. scroll containers keep their own gutter
// `scroll-snap-align: start` aligns the first item to the SCROLLPORT edge, not
// the content box, so a snap container scrolls its own padding away on load and
// its first card sits flush against the window while every other section is
// inset. Measured before the fix: railScroll 56, chipX 0, on 56px of padding.
// `scroll-padding` is what tells a snap container where its start edge is.
for (const [w, still] of [[390, true], [1024, true]]) {
  await load(w, 900, still);
  const g = await evaluate(`(()=>{
    const out={};
    for (const [k, box, item] of [['rail','.pr-rail','.pr-chip'], ['path','.pa-track','.pa-card']]) {
      const b=document.querySelector(box), i=document.querySelector(item);
      if (!b || !i) continue;
      const scroller = getComputedStyle(b).overflowX === 'auto' ? b : b.parentElement;
      out[k] = { x: Math.round(i.getBoundingClientRect().x), scrolled: Math.round(scroller.scrollLeft),
                 want: Math.round(parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--bleed')) *
                       parseFloat(getComputedStyle(document.documentElement).fontSize)) };
    }
    return out;
  })()`);
  for (const [k, v] of Object.entries(g || {})) {
    check(`${k} keeps its gutter @ ${w}`, Math.abs(v.x - v.want) <= 2 && v.scrolled === 0, JSON.stringify(v));
  }
}

// --------------------------------------- 9a. every chapter DEPARTS, scrubbed
// DESIGN-STANDARD.md asks that a chapter both arrive and depart. Arrival is the
// easy half and the one everybody ships; this asserts the other half, and it
// asserts it as a SCRUB — three distinct intermediate opacities as the head
// passes the top edge, not a two-state snap.
//
// This check is also the reason the pin carries refreshPriority: 1. Pinning
// inserts a spacer, everything below Chapter 05 moves down by the length of the
// pin, and a trigger refreshed before the pin measures a document without it.
// The Proof's heading read 0.05 while still half a screen from the top: its
// departure had already run against positions several hundred pixels too high.
// Every trigger below the pin had the same error; the departures merely made it
// visible.
await load(1440, 900);
const departs = [];
for (const sel of [".ch-relay", ".ch-together", ".ch-range", ".ch-people", ".ch-proof", ".ch-invitation"]) {
  const has = await evaluate(`!!document.querySelector('${sel} h2')`);
  if (!has) continue;
  const reads = [];
  const top = await evaluate(`(()=>{const h=document.querySelector('${sel} h2');return h.getBoundingClientRect().top + scrollY;})()`);
  for (const f of [-0.5, -0.03, 0.3]) {
    await seek(Math.max(0, top + 900 * f));
    reads.push(await evaluate(`Number(getComputedStyle(document.querySelector('${sel} h2')).opacity).toFixed(2)`));
  }
  const ok = Number(reads[0]) > 0.95 && Number(reads[1]) < Number(reads[0]) - 0.05 && Number(reads[2]) < 0.25;
  departs.push(`${sel} ${reads.join(" -> ")}${ok ? "" : "  <-- FAILED"}`);
}
check("every chapter departs, and the departure is scrubbed",
  !departs.some((d) => d.includes("FAILED")), departs.join("  |  "));

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
const hasPin = await evaluate(`!!document.getElementById('pathPin')`);
if (!hasPin) skip("pinned chapter fits the viewport at 1920", "no pinned chapter on this page");
if (hasPin) {
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
}

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
if (rm.counters) check("reduced motion still states the real figures", rm.counters === "3,6mo,35,0%", rm.counters);
else skip("reduced motion still states the real figures", "no figures row on this page");

const failed = results.filter((r) => !r.pass);
const skipped = results.filter((r) => r.skipped);
console.log("");
console.log("route " + ROUTE + " — " + (results.length - skipped.length) + " checks, " + failed.length + " failed" + (skipped.length ? ", " + skipped.length + " not applicable" : ""));
ws.close(); chrome.kill(); server.close();
// `process.exitCode`, never `process.exit()`: exit() truncates pending stdout
// on a pipe, and it ate the summary line of every run that had one to print.
process.exitCode = failed.length ? 1 : 0;
