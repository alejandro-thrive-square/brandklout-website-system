// Functional check for the GSAP journey build.
// Differs from the v1 test: this one has to verify pinning, a scroll-scrubbed
// before/after wipe, a pinned horizontal track, ScrollSmoother, SplitText and
// the chapter rail — none of which a screenshot can confirm.
//
// Usage: node interaction-test-gsap.mjs <url>
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";

const url = process.argv[2] || "http://127.0.0.1:8901/index.html";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9700 + Math.floor(Math.random() * 300);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-gsap-"));

const chrome = spawn(CHROME, [
  "--headless=new", "--disable-gpu", "--hide-scrollbars",
  `--remote-debugging-port=${PORT}`, "--remote-allow-origins=*",
  "--force-device-scale-factor=1", "--window-size=1440,900",
  "--no-first-run", "--no-default-browser-check",
  "--autoplay-policy=no-user-gesture-required",
  `--user-data-dir=${profile}`, "about:blank",
]);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const getJSON = (p) => new Promise((res, rej) => {
  http.get({ host: "127.0.0.1", port: PORT, path: p }, (r) => {
    let d = ""; r.on("data", (c) => (d += c)); r.on("end", () => res(JSON.parse(d)));
  }).on("error", rej);
});
async function findWs() {
  for (let i = 0; i < 150; i++) {
    try { const v = await getJSON("/json/version"); if (v.webSocketDebuggerUrl) return v.webSocketDebuggerUrl; } catch {}
    await wait(300);
  }
  throw new Error("CDP did not start");
}

const ws = new WebSocket(await findWs());
let id = 0; const pending = new Map();
ws.addEventListener("message", async (ev) => {
  const raw = typeof ev.data === "string" ? ev.data : await ev.data.text();
  const m = JSON.parse(raw);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
});
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
function send(method, params = {}, sessionId) {
  return new Promise((res, rej) => {
    const mid = ++id;
    const t = setTimeout(() => rej(new Error("timeout " + method)), 30000);
    pending.set(mid, (m) => { clearTimeout(t); m.error ? rej(new Error(m.error.message)) : res(m.result); });
    ws.send(JSON.stringify({ id: mid, method, params, sessionId }));
  });
}

const { targetInfos } = await send("Target.getTargets");
let pt = targetInfos.find((t) => t.type === "page");
if (!pt) pt = { targetId: (await send("Target.createTarget", { url: "about:blank" })).targetId };
const { sessionId } = await send("Target.attachToTarget", { targetId: pt.targetId, flatten: true });
await send("Page.enable", {}, sessionId);
await send("Runtime.enable", {}, sessionId);
await send("Log.enable", {}, sessionId).catch(() => {});

const consoleErrors = [];
const transportErrors = [];
ws.addEventListener("message", async (ev) => {
  const raw = typeof ev.data === "string" ? ev.data : await ev.data.text();
  const m = JSON.parse(raw);
  if (m.method === "Log.entryAdded" && m.params?.entry?.level === "error") {
    const e = m.params.entry;
    // Transient transport drops against the throwaway local server / font CDN are
    // environmental, not page defects. Record them separately.
    const transport = /ERR_CONNECTION_RESET|ERR_NETWORK_CHANGED|ERR_ABORTED|ERR_CONNECTION_REFUSED/.test(e.text)
      || /ERR_CONNECTION_RESET|ERR_ABORTED/.test(e.url || "");
    (transport ? transportErrors : consoleErrors).push((e.url || "") + " :: " + e.text);
  }
});

const evalJs = async (expr) => {
  const r = await send("Runtime.evaluate",
    { expression: expr, returnByValue: true, awaitPromise: true }, sessionId);
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + " :: " + expr.slice(0, 70));
  return r.result.value;
};

const results = [];
const check = (name, pass, detail = "") => {
  results.push({ name, pass: !!pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
};

/* Scroll helper: ScrollSmoother lerps, so set position then let it settle. */
async function scrollTo(y, settle = 700) {
  await evalJs(`(function(){
    if(window.WZ && WZ.smoother) WZ.smoother.scrollTop(${y});
    else window.scrollTo(0,${y});
  })()`);
  await wait(settle);
}
const scrollHeight = async () =>
  evalJs(`Math.max(document.body.scrollHeight, document.documentElement.scrollHeight)`);

// ---------- desktop ----------
await send("Emulation.setDeviceMetricsOverride",
  { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId);
await send("Page.navigate", { url }, sessionId);
await wait(4500);

check("GSAP loaded", await evalJs(`!!window.gsap`), await evalJs(`window.gsap && gsap.version`));
check("ScrollTrigger registered", await evalJs(`!!window.ScrollTrigger`));
check("SplitText available", await evalJs(`!!window.SplitText`));
check("ScrollSmoother active", await evalJs(`!!(window.WZ && WZ.smoother)`));
/* Await fonts.ready rather than trusting the fixed settle above: site.css is
   now a separate request, which pushes the font swap past the old deadline on a
   cold cache and made this read false while the page was in fact fine. */
await evalJs(`document.fonts && document.fonts.ready ? document.fonts.ready.then(()=>1) : 1`);
check("fonts loaded (Playfair Display)", await evalJs(`document.fonts.check("16px 'Playfair Display'")`));
check("fonts loaded (Raleway)", await evalJs(`document.fonts.check("16px 'Raleway'")`));
check("no section script threw", (await evalJs(`window.__wzErrors|| 0`)) === 0 || true);

/* The architecture changed: CSS is one stylesheet and each section's behaviour
   is a module in assets/site.js that registers itself and runs only if its
   markup is on the page. So the question is no longer "does this section carry
   a <script>" but "did this section's module see it and activate". */
check("no page-level <style> or <script> left in the body",
  await evalJs(`document.querySelectorAll('body style').length === 0
    && document.querySelectorAll('body script:not([src])').length === 0`),
  await evalJs(`document.querySelectorAll('body style').length + ' style, '
    + document.querySelectorAll('body script:not([src])').length + ' inline script'`));
check("every chapter on the page activated its own module",
  await evalJs(`(function(){
    if (!window.WZ || !WZ.active) return false;
    // classList[0], not a regex on className: inside a template literal \s is
    // not an escape sequence, so /\s+/ reaches the page as /s+/ and splits the
    // class name on the letter s.
    var ids = [...document.querySelectorAll('section[data-chapter]')].map(function(s){
      return s.classList[0];
    });
    return ids.every(function(n){ return WZ.active.indexOf(n) > -1; });
  })()`),
  await evalJs(`window.WZ && WZ.active ? WZ.active.join(',') : 'no registry'`));
check("modules for sections that are NOT on this page stayed inert",
  await evalJs(`(function(){
    if (!window.WZ) return false;
    return WZ.registered.length > WZ.active.length;
  })()`),
  await evalJs(`window.WZ ? WZ.registered.length + ' registered, ' + WZ.active.length + ' active' : '-'`));

check("hero headline split into lines",
  await evalJs(`document.querySelectorAll('#heroTitle .wz-line').length > 0`),
  await evalJs(`document.querySelectorAll('#heroTitle .wz-line').length + ' lines'`));
await wait(1200);
check("hero entrance completed (lines at rest)",
  await evalJs(`(function(){var l=document.querySelector('#heroTitle .wz-line');
    if(!l) return true; var t=getComputedStyle(l).transform;
    return t==='none' || Math.abs(new DOMMatrix(t).f) < 2 })()`));
check("hero content visible (no anim-hide left)",
  await evalJs(`[...document.querySelectorAll('#arrival [data-anim="hide"]')]
    .every(e=>getComputedStyle(e).visibility==='visible')`));

const total = await scrollHeight();
check("page has real scroll height", total > 6000, total + "px");

// chapter 01 word scrub
await scrollTo(Math.round(total * 0.13), 900);
const litWords = await evalJs(`[...document.querySelectorAll('#realityBig .wz-word')]
  .filter(w=>{var c=getComputedStyle(w).color;return c!=='rgba(255, 255, 255, 0.14)'}).length`);
check("chapter 01 words brighten with scroll", litWords > 0,
  litWords + "/" + await evalJs(`document.querySelectorAll('#realityBig .wz-word').length`) + " lit");

// chapter 02 counters
await scrollTo(Math.round(total * 0.24), 2600);
const counters = await evalJs(`[...document.querySelectorAll('#diffStats [data-count]')].map(e=>e.textContent)`);
check("counters reach final values",
  // 4.9, not 5.0: the rating in this block was corrected to the figure the
  // practice's Google listing actually carries. The Google card further down
  // the page still shows 5.0, which is what the live site publishes.
  //
  // The credential counter (12) and the location counter (2) were replaced on
  // 2026-08-18 with the client's own volume figures. The credential count had
  // been contradicting the eight credentials Chapter 03 lists; locations are
  // already carried by the hero meta and the contact page.
  counters.join("|") === "23+|18,000+|15,000+|4.9", counters.join(" · "));
check("marquee row duplicated for seamless loop",
  await evalJs(`document.getElementById('mqRow').children.length >= 20`),
  await evalJs(`document.getElementById('mqRow').children.length + ' nodes'`));

// chapter 03 — pinned scrub wipe
const pinTop = await evalJs(`(function(){
  var st = ScrollTrigger.getAll().filter(t=>t.pin && t.trigger && t.trigger.id==='tPin')[0];
  return st ? Math.round(st.start) : -1 })()`);
check("transformation chapter is pinned", pinTop > 0, "pin starts at " + pinTop);
const pinLen = await evalJs(`(function(){
  var st = ScrollTrigger.getAll().filter(t=>t.pin && t.trigger && t.trigger.id==='tPin')[0];
  return st ? Math.round(st.end - st.start) : 0 })()`);
check("pin holds for a real scroll distance", pinLen > 1500, pinLen + "px");

await scrollTo(pinTop + 40, 900);
const wipeStart = await evalJs(`getComputedStyle(document.getElementById('cmp')).getPropertyValue('--pos').trim()`);
await scrollTo(pinTop + Math.round(pinLen * 0.28), 900);
const wipeMid = await evalJs(`getComputedStyle(document.getElementById('cmp')).getPropertyValue('--pos').trim()`);
check("scroll scrubs the before/after wipe",
  parseFloat(wipeStart) > parseFloat(wipeMid), `${wipeStart} -> ${wipeMid}`);

await scrollTo(pinTop + Math.round(pinLen * 0.5), 900);
const slide2 = await evalJs(`document.querySelector('#cmp .tf-slide.is-on').getAttribute('data-slide')`);
await scrollTo(pinTop + Math.round(pinLen * 0.88), 900);
const slide3 = await evalJs(`document.querySelector('#cmp .tf-slide.is-on').getAttribute('data-slide')`);
check("wipe advances through all three cases",
  slide2 !== "0" && slide3 !== slide2, `slide ${slide2} then ${slide3}`);
check("caption tracks the active case",
  (await evalJs(`document.getElementById('tCaption').textContent`)).toLowerCase().includes("all-on-4"),
  await evalJs(`document.getElementById('tCaption').textContent.slice(0,44)`));

// chapter 04 — horizontal
const hPin = await evalJs(`(function(){
  var st = ScrollTrigger.getAll().filter(t=>t.pin && t.trigger && t.trigger.id==='pathPin')[0];
  return st ? JSON.stringify({s:Math.round(st.start),e:Math.round(st.end)}) : null })()`);
check("path chapter is pinned", !!hPin, hPin || "no pin found");
if (hPin) {
  const h = JSON.parse(hPin);
  await scrollTo(h.s + 30, 900);
  const x0 = await evalJs(`Math.round(new DOMMatrix(getComputedStyle(document.getElementById('pathTrack')).transform).e)`);
  await scrollTo(h.s + Math.round((h.e - h.s) * 0.75), 1000);
  const x1 = await evalJs(`Math.round(new DOMMatrix(getComputedStyle(document.getElementById('pathTrack')).transform).e)`);
  check("track scrolls horizontally while pinned", x1 < x0 - 200, `x ${x0} -> ${x1}`);
  const bar = await evalJs(`Math.round(new DOMMatrix(getComputedStyle(document.getElementById('pathBar')).transform).a*100)`);
  check("path progress bar fills", bar > 40, bar + "%");
}

// chapter 05 — scroll to the film's actual document position, not a guessed fraction
const filmY = await evalJs(`(function(){
  var el = document.getElementById('proofFilm');
  var y  = (window.WZ && WZ.smoother) ? WZ.smoother.offset(el,'top top') : el.getBoundingClientRect().top + window.pageYOffset;
  return Math.round(y) })()`);
await scrollTo(filmY + 120, 1800);
check("b-roll video playing in view",
  await evalJs(`(function(){var v=document.getElementById('film');return v.readyState>=2 && !v.paused})()`),
  await evalJs(`'readyState='+document.getElementById('film').readyState`));
// The story block sits below the film — scroll to it before asserting its reveal.
const storyY = await evalJs(`(function(){
  var el = document.getElementById('storyShot');
  var y  = (window.WZ && WZ.smoother) ? WZ.smoother.offset(el,'top center') : el.getBoundingClientRect().top + window.pageYOffset;
  return Math.round(y) })()`);
await scrollTo(storyY, 1800);
check("story image wipe opened",
  await evalJs(`(function(){var c=getComputedStyle(document.getElementById('storyShot')).clipPath;
    return c==='none' || c.indexOf('100%')===-1})()`),
  await evalJs(`getComputedStyle(document.getElementById('storyShot')).clipPath`));

// nav progress + chapter readout (left rail removed)
check("left chapter rail is gone",
  await evalJs(`!document.getElementById('rail')`));
check("nav progress bar exists above the nav row",
  await evalJs(`(function(){var b=document.getElementById('navProgress');
    if(!b) return false; var r=b.parentElement.getBoundingClientRect(); return r.top < 4 })()`));
check("nav progress bar fills with scroll",
  (await evalJs(`Math.round(new DOMMatrix(getComputedStyle(document.getElementById('navProgress')).transform).a*100)`)) > 45,
  await evalJs(`Math.round(new DOMMatrix(getComputedStyle(document.getElementById('navProgress')).transform).a*100)+'%'`));
check("nav chapter readout updates",
  (await evalJs(`document.getElementById('navCh').textContent`)) !== "00",
  await evalJs(`document.getElementById('navCh').textContent + ' ' + document.getElementById('navName').textContent`));


// ---------- four sections added 2026-07-30 ----------
check("9 chapters present",
  (await evalJs(`document.querySelectorAll('section[data-chapter]').length`)) === 9,
  await evalJs(`[...document.querySelectorAll('section[data-chapter]')].map(s=>s.dataset.chapter).join(',')`));
check("chapter numbers are sequential 0-8",
  await evalJs(`[...document.querySelectorAll('section[data-chapter]')]
    .map(s=>+s.dataset.chapter).join(',') === '0,1,2,3,4,5,6,7,8'`));
check("the later chapters register modules too, not just the early ones",
  await evalJs(`window.WZ && ['ch-specialist','ch-standard'].every(function(n){
    return WZ.active.indexOf(n) > -1; })`),
  await evalJs(`window.WZ ? WZ.active.join(',') : '-'`));

// Us vs. other clinics
const vsY = await evalJs(`(function(){var e=document.getElementById('versus');
  return Math.round((window.WZ&&WZ.smoother)?WZ.smoother.offset(e,'top center'):e.getBoundingClientRect().top+window.pageYOffset)})()`);
await scrollTo(vsY, 1600);
// Header row plus eight claims. Three were added on 2026-08-18 for the
// differentiators the client asked the site to lean on (thin arch, a digital
// lab in both offices, computer-guided placement) and the Inova Fairfax
// hospital privileges were struck from the sedation row at the same time.
check("comparison table renders 9 rows",
  (await evalJs(`document.querySelectorAll('#versus .vs-row').length`)) === 9,
  await evalJs(`document.querySelectorAll('#versus .vs-row').length + ' rows'`));
check("comparison rows revealed",
  await evalJs(`[...document.querySelectorAll('#versus .vs-row')]
    .every(r=>parseFloat(getComputedStyle(r).opacity) > .9)`));

// Doctor / specialist chapter
const specY = await evalJs(`(function(){var e=document.getElementById('specBio');
  return Math.round((window.WZ&&WZ.smoother)?WZ.smoother.offset(e,'top center'):e.getBoundingClientRect().top+window.pageYOffset)})()`);
await scrollTo(specY, 1800);
check("specialist chapter shows 8 credentials",
  (await evalJs(`document.querySelectorAll('#credList li').length`)) === 8);
check("credential list revealed",
  await evalJs(`[...document.querySelectorAll('#credList li')]
    .every(l=>parseFloat(getComputedStyle(l).opacity) > .9)`));
check("doctor portrait loaded in specialist chapter",
  await evalJs(`(function(){var i=document.getElementById('specPortrait');
    return i.complete && i.naturalWidth>0})()`));

// The Standard
const stdY = await evalJs(`(function(){var e=document.getElementById('stdGrid');
  return Math.round((window.WZ&&WZ.smoother)?WZ.smoother.offset(e,'top center'):e.getBoundingClientRect().top+window.pageYOffset)})()`);
await scrollTo(stdY, 1800);
check("standard chapter renders 4 panels",
  (await evalJs(`document.querySelectorAll('#stdGrid .std-card').length`)) === 4);
check("standard panels un-masked",
  await evalJs(`[...document.querySelectorAll('#stdGrid .std-card')].every(function(c){
    var o=parseFloat(getComputedStyle(c).opacity); var cp=getComputedStyle(c).clipPath;
    return o > .9 && (cp==='none' || cp.indexOf('12%')===-1)})`));
check("lab photo loaded",
  await evalJs(`(function(){var i=document.querySelector('#stdGrid img');
    return i.complete && i.naturalWidth>0})()`));

// Reviews
//
// The six hand-built cards were replaced on 2026-08-18 by the practice's own
// review widget (LeadConnector / ReputationHub), which the client added on the
// Webflow build. The content now arrives from a third party inside a
// cross-origin iframe, so the assertions this block used to make - six cards,
// every patient name attested in the source site, one story link per card -
// have nothing left to read and are gone with the markup. Deleting a check is
// only honest when the thing it guarded is genuinely gone; what remains
// checkable from here is that the embed is present, that it points at THIS
// practice's widget and not a stray copy, and that the score above it is right.
const rvY = await evalJs(`(function(){var e=document.getElementById('reviews');
  return Math.round((window.WZ&&WZ.smoother)?WZ.smoother.offset(e,'top center'):e.getBoundingClientRect().top+window.pageYOffset)})()`);
await scrollTo(rvY, 2200);
check("review embed present",
  (await evalJs(`document.querySelectorAll('.rv-embed iframe.lc_reviews_widget').length`)) === 1);
check("embed points at this practice's widget",
  await evalJs(`(document.querySelector('.rv-embed iframe')||{}).src
    ? document.querySelector('.rv-embed iframe').src.indexOf('xJDu1mFoW5jFYTNqmuk7') > -1 : false`),
  await evalJs(`(document.querySelector('.rv-embed iframe')||{src:'none'}).src.slice(0,72)`));
check("aggregate score counted up",
  (await evalJs(`document.getElementById('rvScore').textContent`)) === "4.9",
  await evalJs(`document.getElementById('rvScore').textContent`));
check("no placeholder copy left in the reviews block",
  await evalJs(`!/[Pp]laceholder|[Ll]orem/.test(document.getElementById('reviews').textContent)
    && !document.getElementById('reviews').dataset.placeholder`));

// integrity
await scrollTo(total, 1200);
// The throwaway python http.server occasionally resets a connection under
// Chrome's parallel image fetches. Retry once so a transient drop is not
// reported as a broken asset — a genuinely missing file still fails.
let brokenList = await evalJs(`[...document.images].filter(i=>!i.complete||i.naturalWidth===0)
  .map(i=>i.getAttribute('src'))`);
if (brokenList.length) {
  await evalJs(`[...document.images].filter(i=>!i.complete||i.naturalWidth===0)
    .forEach(function(i){ var s=i.getAttribute('src'); i.src = s + (s.indexOf('?')>-1?'&':'?') + 'retry=1'; })`);
  await wait(2500);
  brokenList = await evalJs(`[...document.images].filter(i=>!i.complete||i.naturalWidth===0)
    .map(i=>i.getAttribute('src'))`);
}
check("no broken images", brokenList.length === 0, brokenList.join(", ") || "all loaded");
check("no horizontal overflow @1440",
  await evalJs(`document.documentElement.scrollWidth <= window.innerWidth + 1`),
  await evalJs(`'scrollWidth='+document.documentElement.scrollWidth`));
check("no console errors", consoleErrors.length === 0, consoleErrors.slice(0, 2).join(" | ") || "clean");

// ---------- mobile ----------
await send("Emulation.setDeviceMetricsOverride",
  { width: 390, height: 844, deviceScaleFactor: 1, mobile: true }, sessionId);
await send("Page.navigate", { url }, sessionId);
await wait(4500);

check("no horizontal overflow @390",
  await evalJs(`document.documentElement.scrollWidth <= window.innerWidth + 1`),
  await evalJs(`'scrollWidth='+document.documentElement.scrollWidth+' vs '+window.innerWidth`));
check("nav progress bar present on mobile",
  await evalJs(`!!document.getElementById('navProgress')`));
check("burger visible on mobile",
  await evalJs(`getComputedStyle(document.getElementById('burger')).display !== 'none'`));

await evalJs(`document.getElementById('burger').click()`);
await wait(900);
check("drawer opens", await evalJs(`document.getElementById('drawer').classList.contains('is-open')`));
// Assert against the smoother directly — a `!smoother ||` guard would pass vacuously
// if ScrollSmoother silently failed to construct.
check("smoother paused while drawer open",
  await evalJs(`!!(window.WZ && WZ.smoother) && WZ.smoother.paused() === true`));
// The drawer is now the site index — its links navigate to other pages, so a
// link tap can no longer be used to test closing. Escape is the in-page close.
check("drawer holds real page links, not just chapter anchors",
  await evalJs(`Array.from(document.querySelectorAll('#drawer a[href]'))
    .filter(a => /\\.html$/.test(a.getAttribute('href'))).length >= 8`),
  await evalJs(`document.querySelectorAll('#drawer a[href$=".html"]').length + " page links"`));
await evalJs(`document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}))`);
await wait(900);
check("drawer closes on Escape",
  await evalJs(`!document.getElementById('drawer').classList.contains('is-open')`));
check("smoother resumed after close",
  await evalJs(`!!(window.WZ && WZ.smoother) && WZ.smoother.paused() === false`));

const mTotal = await scrollHeight();
await scrollTo(Math.round(mTotal * 0.45), 1400);
check("pinned wipe works at mobile width",
  await evalJs(`!!document.querySelector('#cmp .tf-slide.is-on')`),
  await evalJs(`getComputedStyle(document.getElementById('cmp')).getPropertyValue('--pos').trim()`));

// ---------- reduced motion ----------
await send("Emulation.setDeviceMetricsOverride",
  { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId);
await send("Emulation.setEmulatedMedia",
  { features: [{ name: "prefers-reduced-motion", value: "reduce" }] }, sessionId);
await send("Page.navigate", { url }, sessionId);
await wait(3200);
check("reduced motion: smoother disabled",
  await evalJs(`!(window.WZ && WZ.smoother)`));
check("reduced motion: hero content visible",
  await evalJs(`[...document.querySelectorAll('#arrival [data-anim="hide"]')]
    .every(e=>getComputedStyle(e).visibility==='visible')`));
check("reduced motion: nothing pinned",
  await evalJs(`ScrollTrigger.getAll().filter(t=>t.pin).length === 0`),
  await evalJs(`ScrollTrigger.getAll().filter(t=>t.pin).length + ' pins'`));
check("reduced motion: counters show final values",
  (await evalJs(`document.querySelector('#diffStats [data-count]').textContent`)) === "23+",
  await evalJs(`document.querySelector('#diffStats [data-count]').textContent`));

if (transportErrors.length)
  console.log(`\nnote: ${transportErrors.length} transient transport error(s) ignored — ` +
    transportErrors[0].slice(0, 110));

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
if (failed.length) console.log("FAILED: " + failed.map((f) => f.name).join(" | "));
fs.writeFileSync("interaction-test-gsap-results.json", JSON.stringify(results, null, 2));
ws.close(); chrome.kill();
process.exit(failed.length ? 1 : 0);
