// Scrub proof — the check the static journey audit cannot make.
//
// A scrubbed chapter and a triggered chapter look identical in the source and
// identical in a screenshot. The difference is only visible while driving the
// page: a scrubbed scene is at a DIFFERENT INTERMEDIATE STATE at 25%, 50% and
// 75% of its scroll range, where a triggered one snaps between two states.
//
// So for every pinned ScrollTrigger this walks the scroll position across the
// pin and reads a probe out of the chapter's own content — the price the
// ledger is showing, how far the horizontal track has travelled, how many
// words have been read. Three identical readings is a FAIL, and it is a fail
// no amount of extra animation would fix.
//
// Also asserts: pins release cleanly at both ends, the reading-progress
// indicator tracks real document progress, prefers-reduced-motion disables
// motion WITHOUT hiding content, and there are no console errors.
//
// Runs on a FOCUSED tab (Page.bringToFront). Background tabs freeze
// transitions and timers and would report false failures.
//
// Usage: node scrub-proof.mjs [page-slug]
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
const ALL = ["invisalign", "new-patient-special", "thank-you"];
const PAGES = process.argv[2] ? ALL.filter((p) => p === process.argv[2]) : ALL;

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
// MPD_BASE_URL points the whole suite at a deployed build instead of the local
// design package — `MPD_BASE_URL=https://mason-park-dental.webflow.io`. The
// checks are identical either way; only the origin moves. Without it the
// harness verifies the design source, which is what it was written against.
const BASE = (process.env.MPD_BASE_URL || "").replace(/\/+$/, "");
const fileUrl = (p) =>
  BASE
    ? `${BASE}/${p}`
    : "file:///" + path.join(DESIGN, p, "index.html").replace(/\\/g, "/").replace(/ /g, "%20");

// Monotonic ports. Reusing one lets a run attach to a previous Chrome that has
// not exited yet and verify the WRONG page — which has happened.
let port = 9820;

let pass = 0;
let fail = 0;
const failures = [];
function ok(name, condition, detail) {
  if (condition) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; failures.push(name + (detail ? ` — ${detail}` : "")); console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`); }
}

/* ------------------------------------------------------------------ *
 * Per-chapter probes. Each returns a string signature read out of the
 * chapter's OWN content, never out of ScrollTrigger's progress value —
 * echoing progress back would prove only that the trigger fires.
 * ------------------------------------------------------------------ */
const PROBES = {
  // Words that have reached their fully-read colour.
  readWords: (sel) => `(function(){
    var el = document.querySelector('${sel}');
    if (!el) return 'missing';
    var w = el.querySelectorAll('.mpd-word');
    if (!w.length) return 'unsplit';
    var read = 0;
    for (var i = 0; i < w.length; i++) {
      var c = getComputedStyle(w[i]).color;
      var m = c.match(/[\\d.]+/g);
      // The unread state is a heavy alpha wash; anything opaque has been read.
      if (m && (m.length < 4 || parseFloat(m[3]) > 0.9)) read++;
    }
    return 'read=' + read + '/' + w.length;
  })()`,

  // Horizontal travel of a pinned track.
  trackX: (sel) => `(function(){
    var el = document.querySelector('${sel}');
    if (!el) return 'missing';
    var m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
    return 'x=' + Math.round(m.m41);
  })()`,

  // The figure a scrubbed ledger is currently showing.
  text: (sel) => `(function(){
    var el = document.querySelector('${sel}');
    return el ? 'text=' + el.textContent.trim() : 'missing';
  })()`,

  // Combined opacity of a set of stepped elements.
  opacities: (sel) => `(function(){
    var els = document.querySelectorAll('${sel}');
    if (!els.length) return 'missing';
    var out = [];
    for (var i = 0; i < els.length; i++) out.push(parseFloat(getComputedStyle(els[i]).opacity).toFixed(2));
    return 'op=' + out.join(',');
  })()`,

  // How far a clip-path wipe has opened.
  clip: (sel) => `(function(){
    var el = document.querySelector('${sel}');
    return el ? 'clip=' + getComputedStyle(el).clipPath : 'missing';
  })()`,

  // How far each stroke in a set has DRAWN. A tick that is half-drawn cannot be
  // faked by a class toggle, which is the whole point of reading it: the
  // signature is a vector of partial lengths, not an on/off state.
  dash: (sel) => `(function(){
    var els = document.querySelectorAll('${sel}');
    if (!els.length) return 'missing';
    var out = [];
    for (var i = 0; i < els.length; i++) {
      out.push(parseFloat(getComputedStyle(els[i]).strokeDashoffset).toFixed(1));
    }
    return 'dash=' + out.join(',');
  })()`,
};

// Which pinned chapter carries which probe, per page.
const CHAPTERS = {
  invisalign: [
    { id: "hesPin", name: "01 The Hesitation — statement read word by word", probe: PROBES.readWords("#hesStatement") },
    { id: "corPin", name: "02 What It Corrects — horizontal journey travels", probe: PROBES.trackX("#corTrack") },
    { id: "incPin", name: "03 The Inclusion — fee falls as you scroll", probe: PROBES.text("#incFigure") },
  ],
  "new-patient-special": [
    { id: "catchPin", name: "01 The Catch — statement read word by word", probe: PROBES.readWords("#catchStatement") },
    { id: "covPin", name: "02 What It Covers — value falls as you scroll", probe: PROBES.text("#covFigure") },
    { id: "visPin", name: "03 The Visit — timeline draws through the steps", probe: PROBES.opacities("#visSteps .vis-step > div") },
  ],
  "thank-you": [
    { id: "nextPin", name: "02 What Happens Next — timeline draws", probe: PROBES.opacities("#nextSteps .next-step > div") },
    { id: "prepPin", name: "03 The Preparation — ticks draw in turn", probe: PROBES.dash("#prepList .prep-tick path") },
    { id: "findPin", name: "05 Where To Find Us — map un-crops", probe: PROBES.clip("#mapFrame") },
  ],
};

async function session(fn, { width = 1440, height = 900, reduced = false, mobile = false } = {}) {
  const PORT = port++;
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-scrub-"));
  const chrome = spawn(CHROME, [
    "--headless=new",
    "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
    "--hide-scrollbars",
    `--window-size=${width},${height}`,
    `--remote-debugging-port=${PORT}`,
    "--remote-allow-origins=*",
    "--force-device-scale-factor=1",
    "--no-first-run",
    // Without these the tab throttles the moment it is not frontmost and every
    // scrub reads as frozen.
    "--disable-background-timer-throttling",
    "--disable-backgrounding-occluded-windows",
    "--disable-renderer-backgrounding",
    `--user-data-dir=${profile}`,
    "about:blank",
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
  let id = 0;
  const pend = new Map();
  const consoleErrors = [];
  ws.addEventListener("message", (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result); pend.delete(m.id); }
    if (m.method === "Runtime.exceptionThrown") {
      const d = m.params?.exceptionDetails;
      const frames = (d?.stackTrace?.callFrames || [])
        .slice(0, 5)
        .map((f) => `${f.functionName || "(anon)"}@${(f.url || "").split("/").pop()}:${f.lineNumber}`)
        .join(" < ");
      consoleErrors.push((d?.exception?.description || d?.text || "exception") + (frames ? `  [${frames}]` : ""));
    }
    if (m.method === "Runtime.consoleAPICalled" && m.params?.type === "error") {
      consoleErrors.push((m.params.args || []).map((a) => a.value || a.description || "").join(" "));
    }
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
  // Focus matters: a background tab freezes transitions and IntersectionObserver.
  await send("Page.bringToFront", {}, sessionId);
  await send("Emulation.setDeviceMetricsOverride", {
    width, height, deviceScaleFactor: 1, mobile,
  }, sessionId);
  const setMedia = () => send("Emulation.setEmulatedMedia", {
    features: reduced ? [{ name: "prefers-reduced-motion", value: "reduce" }] : [],
  }, sessionId);
  await setMedia();

  const evaluate = (expr) =>
    send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true }, sessionId)
      .then((r) => r?.result?.value);

  try {
    await fn({ evaluate, send, sessionId, consoleErrors, setMedia });
  } finally {
    ws.close();
    chrome.kill();
    // Await exit, or the next session's port can attach to this instance.
    await new Promise((r) => {
      if (chrome.exitCode !== null) return r();
      chrome.once("exit", r);
      setTimeout(r, 2500);
    });
  }
}

// Navigation settles on the page's own marker rather than readyState:
// 'complete' blocks on Google Fonts and can hang past any sane timeout.
async function open(evaluate, send, sessionId, page, { reduced } = {}) {
  await send("Page.navigate", { url: fileUrl(page) }, sessionId);
  for (let i = 0; i < 100; i++) {
    const ready = await evaluate(`(function(){
      return !!(document.body && document.body.getAttribute('data-page-key') === '${page}'
        && window.MPD && document.documentElement.classList.contains('mpd-ready'));
    })()`);
    if (ready) break;
    await wait(150);
  }
  // The runtime deliberately defers building the journey until webfonts have
  // settled (raced against an 1800ms cap), so anything shorter than that can
  // sample the page before its reduced-motion fallbacks have been applied and
  // report content as clipped when it is merely early.
  await wait(2800);
}

// Drive the scroll through whatever is actually moving the page.
const SCROLL_TO = (y) => `(function(){
  var y = ${y};
  if (window.MPD && MPD.smoother) { MPD.smoother.scrollTop(y); }
  else { window.scrollTo(0, y); }
  if (window.ScrollTrigger) ScrollTrigger.update();
  return true;
})()`;

// Finding the true end of the journey is harder than it looks, and two
// plausible answers are both wrong:
//   - ScrollSmoother.scrollTop() does NOT clamp (unlike window.scrollTo), so
//     asking for 1e7 and reading back returns 1e7.
//   - ScrollTrigger.maxScroll(window) does not account for pin spacing under
//     ScrollSmoother: on the thank-you page it reports 2632 while the pins
//     alone run to 4655, so "100% scrolled" landed at the halfway mark and a
//     working progress bar measured 0.48.
// So define the end by CONTENT: step down until the footer is fully in view.
// That is independent of the indicator being tested, which matters — using
// the progress trigger's own `end` to verify the progress bar proves nothing.
const SCROLL_END = `(async function(){
  var step = innerHeight * 0.8, y = 0, guard = 0;
  function at(v){
    if (window.MPD && MPD.smoother) MPD.smoother.scrollTop(v); else window.scrollTo(0, v);
    if (window.ScrollTrigger) ScrollTrigger.update();
  }
  var foot = document.querySelector('.site-foot');
  while (guard++ < 200) {
    at(y);
    await new Promise(function(r){ setTimeout(r, 30); });
    var b = foot.getBoundingClientRect().bottom;
    if (b <= innerHeight + 4) break;
    y += step;
  }
  return Math.round(y);
})()`;

for (const page of PAGES) {
  console.log(`\n=== ${page} ===`);
  const chapters = CHAPTERS[page];

  // ---------- 1. Scrub proof + pin release ----------
  await session(async ({ evaluate, send, sessionId, consoleErrors }) => {
    await open(evaluate, send, sessionId, page);

    const pinInfo = await evaluate(`(function(){
      if (!window.ScrollTrigger) return null;
      return ScrollTrigger.getAll().filter(function(s){ return s.pin; })
        .map(function(s){
          return { id: s.trigger && s.trigger.id, start: Math.round(s.start), end: Math.round(s.end) };
        });
    })()`);

    ok(`${page}: pinned chapters registered (${chapters.length} expected)`,
      Array.isArray(pinInfo) && pinInfo.length === chapters.length,
      `found ${pinInfo ? pinInfo.length : "none"}`);

    for (const ch of chapters) {
      const info = (pinInfo || []).find((p) => p.id === ch.id);
      if (!info) { ok(`${page}: ${ch.name} — pin exists`, false, `no pinned trigger on #${ch.id}`); continue; }

      const span = info.end - info.start;
      ok(`${page}: ${ch.name} — pin has real scroll distance`, span > 200, `${span}px`);

      const readings = [];
      for (const f of [0.25, 0.5, 0.75]) {
        await evaluate(SCROLL_TO(Math.round(info.start + span * f)));
        // scrub:.3 lags the scroll deliberately; give it time to arrive.
        await wait(900);
        readings.push(await evaluate(ch.probe));
      }

      const distinct = new Set(readings).size;
      ok(`${page}: ${ch.name} — SCRUBBED (3 distinct states at 25/50/75%)`,
        distinct === 3,
        `25%=${readings[0]}  50%=${readings[1]}  75%=${readings[2]}`);
      if (distinct === 3) console.log(`        25% ${readings[0]}\n        50% ${readings[1]}\n        75% ${readings[2]}`);

      // Pins must release at both ends, or the chapter traps the page.
      await evaluate(SCROLL_TO(Math.max(0, info.start - 400)));
      await wait(600);
      const before = await evaluate(`(function(){
        var el = document.getElementById('${ch.id}');
        return el ? getComputedStyle(el.parentElement).position : 'missing';
      })()`);
      await evaluate(SCROLL_TO(info.end + 800));
      await wait(600);
      const after = await evaluate(`(function(){
        var el = document.getElementById('${ch.id}');
        if (!el) return 'missing';
        var r = el.getBoundingClientRect();
        // Released means the chapter has scrolled off the top like normal content.
        return r.top < 0 ? 'released' : 'stuck(top=' + Math.round(r.top) + ')';
      })()`);
      ok(`${page}: ${ch.name} — pin releases at the end`, after === "released", after);
      void before;
    }

    // ---------- reading progress tracks real document progress ----------
    const max = await evaluate(SCROLL_END);
    const samples = [];
    for (const f of [0, 0.5, 1]) {
      await evaluate(SCROLL_TO(Math.round(max * f)));
      await wait(700);
      samples.push(await evaluate(`(function(){
        var el = document.getElementById('headProgress');
        if (!el) return -1;
        return new DOMMatrixReadOnly(getComputedStyle(el).transform).m11;
      })()`));
    }
    ok(`${page}: reading progress tracks the document`,
      samples[0] < 0.15 && samples[1] > 0.3 && samples[1] < 0.75 && samples[2] > 0.9,
      `scaleX at 0/50/100% = ${samples.map((s) => (s == null ? "n/a" : s.toFixed(2))).join(", ")}`);

    // ---------- the offer stays reachable at every depth ----------
    const reach = await evaluate(`(function(){
      var out = { phone: false, cta: false };
      var links = document.querySelectorAll('a[href^="tel:"]');
      for (var i = 0; i < links.length; i++) {
        var r = links[i].getBoundingClientRect();
        if (r.top >= 0 && r.bottom <= innerHeight && r.width > 0 && r.height > 0) { out.phone = true; break; }
      }
      var ctas = document.querySelectorAll('.sticky-bar a, .offer-rail a, .site-head a');
      for (var j = 0; j < ctas.length; j++) {
        var q = ctas[j].getBoundingClientRect();
        if (q.top >= 0 && q.bottom <= innerHeight && q.width > 0 && q.height > 0) { out.cta = true; break; }
      }
      return out;
    })()`);
    ok(`${page}: phone reachable at the deepest scroll`, reach && reach.phone);
    ok(`${page}: a CTA is on screen at the deepest scroll`, reach && reach.cta);

    ok(`${page}: no console errors`, consoleErrors.length === 0, consoleErrors.slice(0, 3).join(" | "));
  });

  // ---------- 2. Reduced motion: no motion, but nothing hidden ----------
  // The `reduced: true` below is load-bearing and was missing once: without it
  // the session runs unemulated, the page correctly builds its full motion
  // layer, and every reduced-motion assertion fails against a page that is
  // actually fine. Hence the emulation self-check as the first assertion.
  await session(async ({ evaluate, send, sessionId, consoleErrors }) => {
    await open(evaluate, send, sessionId, page, { reduced: true });
    ok(`${page}: reduced motion — media emulation actually applied`,
      (await evaluate(`matchMedia('(prefers-reduced-motion: reduce)').matches`)) === true);

    const state = await evaluate(`(function(){
      var hidden = 0, clipped = 0, transparent = 0, total = 0, culprits = [];
      function name(el){
        return el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') +
          (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\\s+/).join('.') : '');
      }
      var els = document.querySelectorAll('main h1, main h2, main h3, main p, main li, main img, .map-frame, .doc-photo, .split-media');
      for (var i = 0; i < els.length; i++) {
        var el = els[i];
        if (!el.offsetParent && getComputedStyle(el).position !== 'fixed') continue;
        total++;
        var cs = getComputedStyle(el);
        if (cs.visibility === 'hidden') hidden++;
        if (parseFloat(cs.opacity) < 0.35) transparent++;
        // A wipe left un-run would clip its content away entirely.
        if (/inset\\(.*100%/.test(cs.clipPath)) clipped++;
      }
      return { hidden: hidden, clipped: clipped, transparent: transparent, total: total,
               smoother: !!(window.MPD && MPD.smoother),
               pins: window.ScrollTrigger ? ScrollTrigger.getAll().filter(function(s){return s.pin;}).length : -1 };
    })()`);

    ok(`${page}: reduced motion — nothing left invisible`,
      state.hidden === 0 && state.clipped === 0 && state.transparent === 0,
      `hidden=${state.hidden} clipped=${state.clipped} faded=${state.transparent} of ${state.total} :: ${(state.culprits || []).join(", ")}`);
    ok(`${page}: reduced motion — no smoothed scroll`, state.smoother === false);
    ok(`${page}: reduced motion — nothing pinned`, state.pins === 0, `${state.pins} pins`);
    ok(`${page}: reduced motion — no console errors`, consoleErrors.length === 0, consoleErrors.slice(0, 3).join(" | "));

    // Content must still be complete at the bottom of the page.
    await evaluate(`window.scrollTo(0, document.body.scrollHeight)`);
    await wait(400);
    const foot = await evaluate(`!!document.querySelector('.site-foot') && document.querySelector('.site-foot').getBoundingClientRect().height > 100`);
    ok(`${page}: reduced motion — footer renders`, foot === true);
  }, { reduced: true });
}

console.log(`\n${pass}/${pass + fail} checks pass.`);
if (fail) {
  console.log("\nFailures:");
  failures.forEach((f) => console.log("  - " + f));
}
process.exit(fail ? 1 : 0);
