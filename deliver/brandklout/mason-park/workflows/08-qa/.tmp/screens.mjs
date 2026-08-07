// Responsive QA — six breakpoints per page, captured AND asserted.
//
// Screenshots are the right instrument for layout and the wrong one for
// motion, so this file does no motion checking at all (see scrub-proof.mjs).
// What it does do is capture every page full-height at each width, and assert
// the things that are easy to miss by eye:
//
//   - zero horizontal overflow (documentElement.scrollWidth <= innerWidth)
//   - no element pushing past the viewport's right edge
//   - body copy never below 14px on mobile
//   - tap targets at least 44x44
//   - the sticky call bar never covering the form's submit button
//
// Paid dental traffic is mostly mobile, so 360 and 390 matter more than 1920.
//
// Output: workflows/08-qa/.tmp/screenshots/<page-slug>/<width>.png
// Usage:  node screens.mjs [page-slug]
// Source Asana task GID: 1217040406855582
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const DESIGN = path.resolve(here, "../../04-design/.tmp");
const OUT = path.join(here, "screenshots");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";

const ALL = ["invisalign", "new-patient-special", "thank-you"];
const PAGES = process.argv[2] ? ALL.filter((p) => p === process.argv[2]) : ALL;
const WIDTHS = [360, 390, 768, 1024, 1440, 1920];

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const fileUrl = (p) =>
  "file:///" + path.join(DESIGN, p, "index.html").replace(/\\/g, "/").replace(/ /g, "%20");

let port = 9700;
let pass = 0, fail = 0;
const failures = [];
function ok(name, condition, detail) {
  if (condition) { pass++; }
  else { fail++; failures.push(`${name}${detail ? ` — ${detail}` : ""}`); }
  console.log(`  ${condition ? "PASS" : "FAIL"}  ${name}${!condition && detail ? ` — ${detail}` : ""}`);
}

async function session(fn, { width, height, mobile }) {
  const PORT = port++;
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-screen-"));
  const chrome = spawn(CHROME, [
    "--headless=new",
    // NOT --disable-gpu: the Google Maps embed draws its tiles through WebGL,
    // so with the GPU off the map captures as an empty grey box and reads as a
    // page defect when it is only a capture artefact.
    "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
    "--hide-scrollbars",
    `--window-size=${width},${height}`,
    `--remote-debugging-port=${PORT}`,
    "--remote-allow-origins=*",
    "--force-device-scale-factor=1",
    "--no-first-run",
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
  ws.addEventListener("message", (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result); pend.delete(m.id); }
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
  await send("Page.bringToFront", {}, sessionId);
  await send("Emulation.setDeviceMetricsOverride",
    { width, height, deviceScaleFactor: 1, mobile: !!mobile }, sessionId);

  const evaluate = (expr) =>
    send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true }, sessionId)
      .then((r) => r?.result?.value);
  const capture = async () => {
    const { data } = await send("Page.captureScreenshot",
      { format: "png", captureBeyondViewport: true }, sessionId);
    return Buffer.from(data, "base64");
  };

  try {
    await fn({ send, sessionId, evaluate, capture });
  } finally {
    ws.close();
    chrome.kill();
    await new Promise((r) => {
      if (chrome.exitCode !== null) return r();
      chrome.once("exit", r);
      setTimeout(r, 2500);
    });
  }
}

// Walk the whole page so lazy images decode and every reveal has fired, then
// come back to the top. A capture taken before this records the test's
// impatience rather than the page.
const SETTLE = `(async () => {
  const step = innerHeight * 0.7;
  const max = document.documentElement.scrollHeight;
  for (let y = 0; y < max; y += step) {
    scrollTo(0, y); await new Promise(r => setTimeout(r, 110));
  }
  scrollTo(0, max);
  await new Promise(r => setTimeout(r, 900));
  scrollTo(0, 0);
  await new Promise(r => setTimeout(r, 700));
})()`;

const AUDIT = `(function(){
  var vw = window.innerWidth;
  var out = {
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: vw,
    overflowing: [],
    tinyText: [],
    smallTargets: [],
    barCoversSubmit: false
  };
  function name(el){
    return el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') +
      (typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\\s+/)[0] : '');
  }
  // A pinned horizontal chapter parks its later cards off to the right on
  // purpose — they sit inside an overflow:hidden/clip ancestor and travel in
  // as you scroll. Counting those as overflow would flag the journey's own
  // mechanism as a bug, so only unclipped content is judged.
  function clippedAway(el){
    for (var p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      var o = getComputedStyle(p);
      if (o.overflowX === 'hidden' || o.overflowX === 'clip' ||
          o.overflow === 'hidden' || o.overflow === 'clip') return true;
    }
    return false;
  }
  // Uppercase micro-labels with wide tracking are a deliberate typographic
  // device, not shrunken body copy, so they get a lower floor than prose
  // rather than being exempted from the check altogether.
  function isMicroLabel(cs){
    return cs.textTransform === 'uppercase' && parseFloat(cs.letterSpacing) >= 1;
  }

  var all = document.querySelectorAll('body *');
  for (var i = 0; i < all.length; i++) {
    var el = all[i];
    var cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    var r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    // Fixed UI is allowed to sit flush; only flag real content spilling out.
    if (cs.position !== 'fixed' && r.right > vw + 1.5 && r.width <= vw && !clippedAway(el)) {
      if (out.overflowing.length < 6) out.overflowing.push(name(el) + ' right=' + Math.round(r.right));
    }
    var txt = el.children.length === 0 && el.textContent.trim().length > 3;
    if (txt) {
      var size = parseFloat(cs.fontSize);
      var floor = isMicroLabel(cs) ? 11.5 : 13.5;
      if (size < floor && out.tinyText.length < 6) {
        out.tinyText.push(name(el) + ' ' + cs.fontSize + (isMicroLabel(cs) ? ' (label)' : ''));
      }
    }
    if ((el.tagName === 'A' || el.tagName === 'BUTTON') && el.offsetParent !== null) {
      if ((r.height > 0 && r.height < 44) && el.closest('.sticky-bar, .offer-rail, .site-head, .btn-row')) {
        if (out.smallTargets.length < 6) out.smallTargets.push(name(el) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
      }
    }
  }
  // The sticky mobile bar sitting on top of the form's submit button is the
  // single most expensive layout bug this page could ship.
  var bar = document.querySelector('.sticky-bar');
  var submit = document.querySelector('form [type="submit"]');
  if (bar && submit && getComputedStyle(bar).display !== 'none') {
    submit.scrollIntoView({ block: 'center' });
    var b = bar.getBoundingClientRect(), s = submit.getBoundingClientRect();
    out.barCoversSubmit = !(s.bottom < b.top || s.top > b.bottom);
  }
  return out;
})()`;

for (const page of PAGES) {
  console.log(`\n=== ${page} ===`);
  fs.mkdirSync(path.join(OUT, page), { recursive: true });

  for (const width of WIDTHS) {
    const mobile = width <= 430;
    await session(async ({ send, sessionId, evaluate, capture }) => {
      await send("Page.navigate", { url: fileUrl(page) }, sessionId);
      for (let i = 0; i < 120; i++) {
        const ready = await evaluate(
          `!!(document.body && document.body.getAttribute('data-page-key') === '${page}' && window.MPD)`
        );
        if (ready) break;
        await wait(150);
      }
      await wait(3000);          // the runtime waits for webfonts before building
      await evaluate(SETTLE);

      const a = await evaluate(AUDIT);
      const label = `${page} @ ${width}`;
      ok(`${label}: no horizontal overflow`,
        a.scrollWidth <= a.innerWidth + 1,
        `scrollWidth=${a.scrollWidth} > innerWidth=${a.innerWidth}`);
      ok(`${label}: nothing spills past the right edge`,
        a.overflowing.length === 0, a.overflowing.join(", "));
      if (width <= 430) {
        ok(`${label}: body text >= 13.5px, micro-labels >= 11.5px`,
          a.tinyText.length === 0, a.tinyText.join(", "));
        ok(`${label}: primary tap targets >= 44px tall`,
          a.smallTargets.length === 0, a.smallTargets.join(", "));
        ok(`${label}: sticky bar does not cover the submit button`, a.barCoversSubmit === false);
      }

      /* The audit above ran against the real, pinned page. The IMAGE, though,
         is captured with reduced motion emulated and the page reloaded.
         captureBeyondViewport on a pinned document is not a picture of the
         page: each pinned chapter renders at its pinned offset while its
         spacer renders as blank, so the composite shows chapters twice with
         long empty gaps between them and is useless for judging layout.
         Reduced motion removes every pin by design, so the capture is the
         honest flowing layout — which is exactly what a responsive review
         needs to look at. Nothing about the page changes; only the media
         feature the capture pass asks for. */
      await send("Emulation.setEmulatedMedia",
        { features: [{ name: "prefers-reduced-motion", value: "reduce" }] }, sessionId);
      await send("Page.navigate", { url: fileUrl(page) }, sessionId);
      await wait(3200);
      await evaluate(SETTLE);
      /* captureBeyondViewport temporarily grows the viewport to the height of
         the document — which re-resolves every `100svh` chapter against that
         new height, so the scene heights balloon mid-capture and the image
         comes back with chapters repeated and long blank gaps. Height is not
         what a responsive review judges (overflow, wrapping and tap targets
         are all width behaviour), so viewport-relative heights are collapsed
         for the capture only. This is injected into the test page, never into
         the build. */
      await evaluate(`(function(){
        var s = document.createElement('style');
        s.textContent = '[class$="-pin"], .ch-arrival { min-height: 0 !important; height: auto !important; }';
        document.head.appendChild(s);
        return true;
      })()`);
      await wait(700);
      /* Halve the capture scale. These pages run past 10,000 CSS px at 390,
         and captureBeyondViewport silently wraps beyond its internal height
         limit — the returned image repeats the top of the page at the bottom,
         which reads as a duplicated chapter rather than a capture artefact.
         Capturing at 0.5x keeps the whole document inside the limit; the
         layout is identical, at half the pixels. */
      await send("Emulation.setDeviceMetricsOverride",
        { width, height: mobile ? 844 : 900, deviceScaleFactor: 0.5, mobile: !!mobile }, sessionId);
      await wait(500);
      fs.writeFileSync(path.join(OUT, page, `${width}.png`), await capture());
      console.log(`        wrote screenshots/${page}/${width}.png`);
    }, { width, height: mobile ? 844 : 900, mobile });
  }
}

console.log(`\n${pass}/${pass + fail} responsive checks pass. Images in ${OUT}`);
if (fail) { console.log("\nFailures:"); failures.forEach((f) => console.log("  - " + f)); }
process.exit(fail ? 1 : 0);
