// Live QA — the deployed page, in a cloud browser, asserted rather than eyeballed.
//
// The suite in .tmp/ (screens.mjs, root-proof.mjs, scrub-proof.mjs) proves the
// *build* is right by driving a local Chrome against the file:// sources. That
// is the correct instrument for layout and motion, and it is blind to an entire
// class of defect: anything that only exists once the page is deployed.
//
// Two Invisalign bugs found on 2026-08-09 were invisible to it, and both would
// have burned paid clicks:
//
//   - WEBHOOK_URL shipped as the literal string "{{GHL_INBOUND_WEBHOOK_URL}}",
//     so every lead is refused by the form's own placeholder guard.
//   - THANK_YOU_URL is "../thank-you/index.html", a filesystem path. It resolves
//     under file://, and 404s on Webflow, where the route is "/thank-you".
//
// A file:// run cannot see either one. That is what this file is for.
//
// It runs against Browserbase — a real Chrome in the cloud — so every run leaves
// a Live View you can watch and a replay you can scrub afterwards. When an agent
// reports "the form is broken", the replay is the evidence.
//
// Requires: the `browse` CLI on PATH (npm i -g browse) and BROWSERBASE_API_KEY,
// read from the environment or the nearest .env walking up from this file.
// No npm dependencies — CDP over Node's built-in WebSocket, same as the local suite.
//
// Usage:  node live-qa.mjs [page-slug] [--submit] [--shots]
//           page-slug   one of invisalign | new-patient-special | thank-you (default: all)
//           --submit    actually fill and submit the lead form (proves the endpoint)
//           --shots     write full-height PNGs to .tmp/live/<slug>/<width>.png
//
// Output: PASS/FAIL lines, a findings block, and the session replay URL.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, ".tmp", "live");

const ALL = ["invisalign", "new-patient-special", "thank-you"];
const argv = process.argv.slice(2);
const slugArg = argv.find((a) => !a.startsWith("--"));
const PAGES = slugArg ? ALL.filter((p) => p === slugArg) : ALL;
const DO_SUBMIT = argv.includes("--submit");
const DO_SHOTS = argv.includes("--shots");

// Staging is the default target because that is where the client approves. Point
// MPD_LIVE_BASE at the custom domain once the site is published.
const BASE = (process.env.MPD_LIVE_BASE || "https://mason-park-dental.webflow.io").replace(/\/+$/, "");

// The two widths that decide a paid dental campaign, plus a desktop control.
// Mobile first and mobile-weighted: most of this traffic arrives on a phone.
const WIDTHS = [390, 768, 1440];

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

// Nothing in this repo loads .env, and requiring the caller to export a key
// before every run is how a QA gate quietly stops being run. Walk up instead.
function loadEnv() {
  if (process.env.BROWSERBASE_API_KEY) return;
  let dir = here;
  for (let i = 0; i < 8; i++) {
    const f = path.join(dir, ".env");
    if (fs.existsSync(f)) {
      for (const line of fs.readFileSync(f, "utf8").split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
      }
      if (process.env.BROWSERBASE_API_KEY) return;
    }
    const up = path.dirname(dir);
    if (up === dir) break;
    dir = up;
  }
}
loadEnv();

if (!process.env.BROWSERBASE_API_KEY) {
  console.error("BROWSERBASE_API_KEY is not set. Put it in the repo-root .env or export it.");
  process.exit(2);
}

// ---------------------------------------------------------------------------
// Result bookkeeping — same shape as the local suite so output reads the same
// ---------------------------------------------------------------------------

let pass = 0, fail = 0;
const failures = [];
function ok(name, condition, detail) {
  if (condition) pass++;
  else { fail++; failures.push(`${name}${detail ? ` — ${detail}` : ""}`); }
  console.log(`  ${condition ? "PASS" : "FAIL"}  ${name}${!condition && detail ? ` — ${detail}` : ""}`);
}

// ---------------------------------------------------------------------------
// Browserbase session + CDP
// ---------------------------------------------------------------------------

// The CLI resolves the project from the API key, so this stays free of any
// project id. Creating through it also tags the session as ours in the dashboard.
function createSession() {
  const raw = execFileSync(
    process.platform === "win32" ? "browse.cmd" : "browse",
    ["cloud", "sessions", "create", "--timeout", "600", "--keep-alive"],
    { encoding: "utf8", env: process.env, maxBuffer: 1 << 22 },
  );
  // The CLI prepends an "Update available" banner often enough that parsing the
  // whole stream is unsafe; take the JSON object only.
  const json = raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
  return JSON.parse(json);
}

let nextId = 1;
const pending = new Map();
const consoleErrors = [];
const failedRequests = [];
let ws;

function send(method, params = {}, sessionId) {
  const id = nextId++;
  const msg = { id, method, params };
  if (sessionId) msg.sessionId = sessionId;
  ws.send(JSON.stringify(msg));
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    setTimeout(() => {
      if (pending.has(id)) { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }
    }, 60000);
  });
}

function connect(url) {
  return new Promise((resolve, reject) => {
    ws = new WebSocket(url);
    ws.addEventListener("open", () => resolve());
    ws.addEventListener("error", (e) => reject(new Error("CDP connect failed: " + (e.message || "unknown"))));
    ws.addEventListener("message", (ev) => {
      const m = JSON.parse(ev.data);
      if (m.id && pending.has(m.id)) {
        const { resolve: res, reject: rej } = pending.get(m.id);
        pending.delete(m.id);
        m.error ? rej(new Error(m.error.message)) : res(m.result);
        return;
      }
      // Events. Console and network failures are collected across the whole run
      // and asserted per page, because a broken third-party script shows up here
      // and nowhere in the DOM.
      if (m.method === "Runtime.exceptionThrown") {
        const d = m.params.exceptionDetails;
        consoleErrors.push(`uncaught: ${d.exception?.description || d.text}`.slice(0, 200));
      }
      if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") {
        consoleErrors.push("console.error: " + m.params.args.map((a) => a.value ?? a.description ?? "").join(" ").slice(0, 200));
      }
      if (m.method === "Network.responseReceived" && m.params.response.status >= 400) {
        failedRequests.push(`${m.params.response.status} ${m.params.response.url.slice(0, 140)}`);
      }
      if (m.method === "Network.loadingFailed" && !m.params.canceled) {
        failedRequests.push(`FAILED ${m.params.errorText} ${m.params.type}`);
      }
    });
  });
}

async function evaluate(sessionId, expression) {
  const r = await send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  }, sessionId);
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + " " + (r.exceptionDetails.exception?.description || ""));
  return r.result.value;
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Probes. Each returns plain data; the assertions live in run().
// ---------------------------------------------------------------------------

// Right-edge overflow, ancestor-clip aware. A raw right > viewport test reports
// every marquee track on the page — the Invisalign one has thirteen at 1440 and
// not one of them is a bug, because body carries overflow-x: clip. Only an
// element with no clipping ancestor is a real leak.
const PROBE_OVERFLOW = `(() => {
  const vw = document.documentElement.clientWidth;
  const leaks = [];
  for (const el of document.querySelectorAll("body *")) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0 || r.right <= vw + 1) continue;
    let clipped = false, p = el.parentElement;
    while (p && p !== document.documentElement) {
      if (/hidden|clip|auto|scroll/.test(getComputedStyle(p).overflowX)) { clipped = true; break; }
      p = p.parentElement;
    }
    if (!clipped) leaks.push({ cls: (el.className || el.tagName).toString().slice(0, 60), over: Math.round(r.right - vw) });
  }
  return { vw, docScrollWidth: document.documentElement.scrollWidth, leaks: leaks.slice(0, 10), leakCount: leaks.length };
})()`;

const PROBE_CONTENT = `(() => {
  const imgs = [...document.images];
  const links = [...document.querySelectorAll("a")];
  const bad = /lorem ipsum|your text here|placeholder|heading here|button text|medium length|section subheading/i;
  const placeholders = [];
  for (const el of document.querySelectorAll("h1,h2,h3,h4,h5,h6,p,a,span,li,button")) {
    if (el.children.length) continue;
    const t = (el.textContent || "").trim();
    if (t && bad.test(t)) placeholders.push(t.slice(0, 70));
  }
  const ids = {};
  for (const el of document.querySelectorAll("[id]")) ids[el.id] = (ids[el.id] || 0) + 1;
  return {
    brokenImages: imgs.filter((i) => i.complete && i.naturalWidth === 0).map((i) => (i.currentSrc || i.src).split("/").pop().slice(0, 60)),
    missingAlt: imgs.filter((i) => !i.alt || !i.alt.trim()).map((i) => (i.currentSrc || i.src).split("/").pop().slice(0, 60)),
    placeholders: placeholders.slice(0, 8),
    deadLinks: links.filter((a) => { const h = a.getAttribute("href"); return !h || h === "#" || /^javascript:void/i.test(h); })
      .map((a) => (a.textContent || "").trim().slice(0, 40)).slice(0, 10),
    brokenAnchors: links.map((a) => a.getAttribute("href")).filter((h) => h && h.startsWith("#") && h.length > 1)
      .filter((h) => { try { return !document.querySelector(h); } catch (e) { return true; } }),
    duplicateIds: Object.entries(ids).filter(([, n]) => n > 1).map(([id]) => id),
    h1Count: document.querySelectorAll("h1").length,
    title: document.title,
    metaDescription: (document.querySelector('meta[name="description"]') || {}).content || null,
  };
})()`;

// Config lives on window.MPD, which is where the placeholder bug is visible.
// Reading the object beats grepping the bundle: it survives minification and it
// reports what the page will actually do at submit time.
const PROBE_CONFIG = `(() => {
  const M = window.MPD;
  if (!M) return { present: false };
  const cfg = M.config || M;
  const pick = (k) => { try { return typeof cfg[k] === "function" ? cfg[k]() : cfg[k]; } catch (e) { return null; } };
  return {
    present: true,
    webhook: pick("WEBHOOK_URL"),
    thankYou: pick("THANK_YOU_URL"),
    booking: pick("BOOKING_URL"),
    publicPhone: pick("PUBLIC_PHONE"),
    tracking: pick("TRACKING"),
    pageKey: (document.body.getAttribute("data-page-key") || ""),
    telHrefs: [...new Set([...document.querySelectorAll('a[href^="tel:"]')].map((a) => a.getAttribute("href")))],
    visibleNumbers: [...new Set((document.body.innerText.match(/\\(?\\d{3}\\)?[\\s.-]?\\d{3}[\\s.-]?\\d{4}/g) || []))],
  };
})()`;

const PROBE_MOBILE = `(() => {
  const small = [];
  for (const el of document.querySelectorAll("a,button,input[type=submit],[role=button]")) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (r.width < 44 || r.height < 44) small.push(((el.textContent || "").trim().slice(0, 30) || el.tagName) + " " + Math.round(r.width) + "x" + Math.round(r.height));
  }
  const tiny = [];
  for (const el of document.querySelectorAll("p,li")) {
    if (el.children.length) continue;
    const t = (el.textContent || "").trim();
    if (t.length < 25) continue;
    const fs = parseFloat(getComputedStyle(el).fontSize);
    if (fs < 16) tiny.push(fs.toFixed(1) + "px: " + t.slice(0, 40));
  }
  const chrome = [...document.querySelectorAll("body *")]
    .filter((el) => getComputedStyle(el).position === "fixed")
    .reduce((sum, el) => sum + el.getBoundingClientRect().height, 0);
  return { smallTapTargets: small.slice(0, 10), smallBodyCopy: tiny.slice(0, 8), fixedChromeHeight: Math.round(chrome), viewportH: window.innerHeight };
})()`;

// Drives the real multi-step form to the real submit. The form fails closed on a
// placeholder endpoint and says so in .form-msg, so the message is the assertion.
const PROBE_SUBMIT = `(async () => {
  const f = document.querySelector("form[data-lead-form]");
  if (!f) return { present: false };
  f.scrollIntoView({ block: "center" });
  const choice = f.querySelector(".choice");
  if (choice) choice.click();
  await new Promise((r) => setTimeout(r, 400));
  const set = (name, v) => {
    const i = f.querySelector('[name="' + name + '"]');
    if (!i) return;
    i.focus();
    i.value = v;
    i.dispatchEvent(new Event("input", { bubbles: true }));
    i.dispatchEvent(new Event("change", { bubbles: true }));
  };
  set("full_name", "QA Harness");
  set("phone", "2815550147");
  set("email", "qa+harness@example.com");
  const c = f.querySelector('[name="consent"]');
  if (c && !c.checked) c.click();
  const sub = f.querySelector('[type=submit]');
  if (!sub) return { present: true, submitted: false, reason: "no submit button reachable" };
  sub.click();
  await new Promise((r) => setTimeout(r, 2500));
  const m = document.querySelector(".form-msg");
  return { present: true, submitted: true, url: location.href, msg: m ? m.textContent.trim() : null, cls: m ? m.className : null };
})()`;

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

async function httpStatus(url) {
  try {
    const r = await fetch(url, { method: "GET", redirect: "manual" });
    return r.status;
  } catch (e) {
    return 0;
  }
}

async function run() {
  console.log(`Live QA — ${BASE}`);
  const session = createSession();
  const replay = `https://www.browserbase.com/sessions/${session.id}`;
  console.log(`Session:  ${replay}`);
  console.log(`Live view: watch it at https://www.browserbase.com/sessions while it runs\n`);

  await connect(session.connectUrl);
  const { targetInfos } = await send("Target.getTargets");
  const page = targetInfos.find((t) => t.type === "page");
  const { sessionId } = await send("Target.attachToTarget", { targetId: page.targetId, flatten: true });

  await send("Page.enable", {}, sessionId);
  await send("Runtime.enable", {}, sessionId);
  await send("Network.enable", {}, sessionId);

  for (const slug of PAGES) {
    const url = `${BASE}/${slug}`;
    console.log(`\n=== ${slug} ===`);

    for (const width of WIDTHS) {
      console.log(`\n-- ${width}px`);
      consoleErrors.length = 0;
      failedRequests.length = 0;

      await send("Emulation.setDeviceMetricsOverride", {
        width, height: width < 500 ? 844 : 900, deviceScaleFactor: 1, mobile: width < 500,
      }, sessionId);
      await send("Page.navigate", { url }, sessionId);
      // The page hangs GSAP + SplitText off jsDelivr and lazy-loads imagery, so a
      // load event is not the same as a settled page. Give it room, then probe.
      await wait(4500);
      await evaluate(sessionId, "window.scrollTo(0, document.body.scrollHeight); 1");
      await wait(1500);
      await evaluate(sessionId, "window.scrollTo(0, 0); 1");
      await wait(800);

      const of = await evaluate(sessionId, PROBE_OVERFLOW);
      ok(`${width} no horizontal leak`, of.leakCount === 0,
        of.leakCount ? `${of.leakCount} unclipped: ${of.leaks.map((l) => `${l.cls}(+${l.over}px)`).join(", ")}` : "");

      const c = await evaluate(sessionId, PROBE_CONTENT);
      ok(`${width} images render`, c.brokenImages.length === 0, c.brokenImages.join(", "));
      ok(`${width} every image has alt`, c.missingAlt.length === 0, c.missingAlt.join(", "));
      ok(`${width} no placeholder copy`, c.placeholders.length === 0, c.placeholders.join(" | "));
      ok(`${width} no dead links`, c.deadLinks.length === 0, c.deadLinks.join(", "));
      ok(`${width} anchors resolve`, c.brokenAnchors.length === 0, c.brokenAnchors.join(", "));
      ok(`${width} ids unique`, c.duplicateIds.length === 0, c.duplicateIds.join(", "));
      ok(`${width} exactly one h1`, c.h1Count === 1, `found ${c.h1Count}`);

      if (width < 500) {
        const m = await evaluate(sessionId, PROBE_MOBILE);
        ok(`${width} tap targets >= 44px`, m.smallTapTargets.length === 0, m.smallTapTargets.join(" | "));
        ok(`${width} body copy >= 16px`, m.smallBodyCopy.length === 0, m.smallBodyCopy.join(" | "));
        ok(`${width} fixed chrome under a third of the viewport`,
          m.fixedChromeHeight < m.viewportH / 3, `${m.fixedChromeHeight}px of ${m.viewportH}px`);
      }

      ok(`${width} no console errors`, consoleErrors.length === 0, [...new Set(consoleErrors)].slice(0, 3).join(" | "));
      ok(`${width} no failed requests`, failedRequests.length === 0, [...new Set(failedRequests)].slice(0, 3).join(" | "));

      if (DO_SHOTS) {
        const dir = path.join(OUT, slug);
        fs.mkdirSync(dir, { recursive: true });
        const shot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true }, sessionId);
        fs.writeFileSync(path.join(dir, `${width}.png`), Buffer.from(shot.data, "base64"));
      }
    }

    // Config and routing are width-independent, so assert them once per page,
    // at the last viewport the loop left in place.
    const cfg = await evaluate(sessionId, PROBE_CONFIG);
    if (cfg.present) {
      const unresolved = (v) => typeof v === "string" && /\{\{.*\}\}/.test(v);
      ok(`${slug} lead webhook is wired`, !unresolved(cfg.webhook),
        unresolved(cfg.webhook) ? `WEBHOOK_URL is still the template token ${cfg.webhook} — every lead is refused` : "");

      // The thank-you route is the one place a filesystem-relative path survives
      // local QA and dies in production, so resolve it the way the browser will.
      if (cfg.thankYou) {
        const resolved = new URL(cfg.thankYou, `${BASE}/${slug}`).href;
        const status = await httpStatus(resolved);
        ok(`${slug} thank-you route resolves`, status === 200, `${cfg.thankYou} -> ${resolved} returned ${status}`);
      }
      if (cfg.booking) {
        const status = await httpStatus(cfg.booking);
        ok(`${slug} booking URL reachable`, status > 0 && status < 400, `${cfg.booking} returned ${status}`);
      }

      // A tracking number that does not match the tel: href is a silently
      // mis-attributed campaign, which is worse than a broken one.
      const expected = cfg.tracking && cfg.tracking[cfg.pageKey];
      if (expected) {
        ok(`${slug} tel: href is the tracking number`, cfg.telHrefs.includes("tel:" + expected.e164),
          `expected tel:${expected.e164}, page has ${cfg.telHrefs.join(", ") || "none"}`);
        ok(`${slug} visible number is the tracking number`, cfg.visibleNumbers.every((n) => n.replace(/\D/g, "") === expected.e164.replace(/^\+1/, "")),
          `expected ${expected.display}, page shows ${cfg.visibleNumbers.join(", ")}`);
      }
    } else {
      ok(`${slug} MPD config present`, false, "window.MPD missing — the page script did not run");
    }

    if (DO_SUBMIT) {
      const s = await evaluate(sessionId, PROBE_SUBMIT);
      if (s.present) {
        ok(`${slug} form submit reaches the endpoint`, s.cls ? !/bad/.test(s.cls) : true,
          s.msg ? `form answered: "${s.msg}"` : "no .form-msg rendered");
      }
    }
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  if (failures.length) {
    console.log("\nFindings:");
    for (const f of failures) console.log(`  - ${f}`);
  }
  console.log(`\nReplay: ${replay}`);
  try { ws.close(); } catch {}
  process.exit(fail ? 1 : 0);
}

run().catch((e) => {
  console.error("live-qa failed:", e.message);
  process.exit(2);
});
