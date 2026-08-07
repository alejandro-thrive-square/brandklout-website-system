// Fluid root proof — the snippet is installed, and it is actually live.
//
// The static gate (scripts/fluid-root.mjs --check) can only see that the CSS is
// present. It cannot see a later rule overriding the root, a stylesheet that
// failed to load, or a browser that refused the calc(). This file measures the
// rendered root font-size at each breakpoint and compares it to the generator's
// own table, so a page that merely *contains* the snippet cannot pass.
//
// It also reports the rendered size of the sizes with absolute floors, because
// the root shrinking below 479 is the whole risk of the technique: body copy
// must stay >= 16px on a phone and micro-labels >= 11.5px.
//
// Usage:  node root-proof.mjs [page-slug]
// Source Asana task GID: 1217040406855582
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";
import { rootPxAt } from "../../../../../../scripts/fluid-root.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const DESIGN = path.resolve(here, "../../04-design/.tmp");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";

const ALL = ["invisalign", "new-patient-special", "thank-you"];
const PAGES = process.argv[2] ? ALL.filter((p) => p === process.argv[2]) : ALL;
// 479 and 480 bracket the one breakpoint in the scale where the design steps on
// purpose; 2400 is the top of the curve.
const WIDTHS = [360, 390, 479, 480, 768, 1024, 1440, 1920, 2400];

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const fileUrl = (p) =>
  "file:///" + path.join(DESIGN, p, "index.html").replace(/\\/g, "/").replace(/ /g, "%20");

let port = 9820;
let pass = 0, fail = 0;
const failures = [];
function ok(name, condition, detail) {
  if (condition) pass++;
  else { fail++; failures.push(`${name}${detail ? ` — ${detail}` : ""}`); }
  console.log(`  ${condition ? "PASS" : "FAIL"}  ${name}${!condition && detail ? ` — ${detail}` : ""}`);
}

async function session(fn, { width, height, mobile }) {
  const PORT = port++;
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-root-"));
  const chrome = spawn(CHROME, [
    "--headless=new",
    "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
    "--hide-scrollbars",
    `--window-size=${width},${height}`,
    `--remote-debugging-port=${PORT}`,
    "--remote-allow-origins=*",
    "--force-device-scale-factor=1",
    "--no-first-run",
    "--disable-background-timer-throttling",
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
  try {
    await fn({ evaluate, sessionId, send });
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

/* Read the root, then the computed size of one real element per size that has
   an absolute floor. Reading a token off :root would only prove the token's
   value; reading the element proves what the visitor sees after the cascade. */
const PROBE = `(function(){
  var px = function(el){ return el ? parseFloat(getComputedStyle(el).fontSize) : null; };
  var body = document.querySelector('.lead, p.muted, .checks li, .step p') ||
             document.querySelector('main p');
  var label = document.querySelector('.chapter-tag, .eyebrow, .label');
  var input = document.querySelector('.field input');
  return {
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
    root: parseFloat(getComputedStyle(document.documentElement).fontSize),
    bodyBase: px(document.body),
    prose: px(body),
    label: px(label),
    input: px(input),
    h1: px(document.querySelector('h1')),
  };
})()`;

for (const page of PAGES) {
  console.log(`\n=== ${page} ===`);
  for (const width of WIDTHS) {
    const mobile = width <= 430;
    await session(async ({ evaluate, send, sessionId }) => {
      await send("Page.navigate", { url: fileUrl(page) }, sessionId);
      /* Settle on the page's own marker, not readyState — readyState blocks on
         Google Fonts. If this loop falls through, everything below measures
         about:blank, whose root is a plausible-looking 16px. The element probes
         return null in that case, which is what makes the lie visible. */
      for (let i = 0; i < 120; i++) {
        const ready = await evaluate(
          `!!(document.body && document.body.getAttribute('data-page-key') === '${page}' && window.MPD)`
        );
        if (ready) break;
        await wait(150);
      }
      await wait(1200);
      const p = await evaluate(PROBE);
      const expect = rootPxAt(width);
      const label = `${page} @ ${width}`;
      // Self-check first: about:blank reports a perfectly plausible 16px root.
      ok(`${label}: the real page is loaded`,
        p.prose !== null && p.label !== null, "probes came back null");
      ok(`${label}: root font-size is ${expect.toFixed(2)}px`,
        Math.abs(p.root - expect) < 0.05, `measured ${p.root}px`);
      /* screens.mjs captures 360-1920. These widths are the ones it never
         sees — both sides of the 479 step, and the top of the curve where the
         root is 25% larger than the design was drawn at. */
      ok(`${label}: no horizontal overflow`,
        p.scrollWidth <= p.innerWidth + 1,
        `scrollWidth=${p.scrollWidth} > innerWidth=${p.innerWidth}`);
      // Below 479 the root shrinks; that is exactly where the floors bite.
      if (width <= 430) {
        ok(`${label}: body copy >= 16px`, p.bodyBase >= 15.9,
          `body computes ${p.bodyBase}px`);
        ok(`${label}: prose >= 13.5px`, p.prose >= 13.5, `prose computes ${p.prose}px`);
        ok(`${label}: micro-label >= 11.5px`, p.label >= 11.5, `label computes ${p.label}px`);
      }
      // iOS zooms the page on focus if an input computes under 16px. iPhone SE
      // is the narrowest iOS width still shipping, at 375.
      if (width >= 375 && p.input !== null) {
        ok(`${label}: form input >= 16px (iOS zoom guard)`, p.input >= 15.95,
          `input computes ${p.input}px`);
      }
      console.log(`        root ${p.root.toFixed(2)} · body ${p.bodyBase} · prose ${p.prose} · label ${p.label} · h1 ${p.h1} · input ${p.input}`);
    }, { width, height: mobile ? 844 : 900, mobile });
  }
}

console.log(`\n${pass}/${pass + fail} fluid-root checks pass.`);
if (fail) { console.log("\nFailures:"); failures.forEach((f) => console.log("  - " + f)); }
process.exit(fail ? 1 : 0);
