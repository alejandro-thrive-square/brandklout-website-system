// Computed-style snapshot / differ.
//
// The gates prove the site still WORKS. They do not prove it still LOOKS the
// same, and a CSS refactor that changes selector specificity can leave every
// functional check green while quietly moving type, colour or layout. This
// records what the browser actually computed for every element on every page,
// so a refactor can be diffed rather than eyeballed.
//
// Motion is excluded on purpose: GSAP writes inline transform/opacity/visibility
// and those differ run to run. Reduced motion is emulated so the page settles
// to a deterministic state, and only properties GSAP does not author are read.
//
//   node style-snapshot.mjs <baseUrl> <out.json> [pages,csv]
//   node style-snapshot.mjs --diff <before.json> <after.json>
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";

/* ---------------- diff mode ---------------- */
if (process.argv[2] === "--diff") {
  const a = JSON.parse(fs.readFileSync(process.argv[3], "utf8"));
  const b = JSON.parse(fs.readFileSync(process.argv[4], "utf8"));
  let diffs = 0, checked = 0;
  const byPage = {};
  for (const page of Object.keys(a)) {
    if (!b[page]) { console.log(`MISSING in after: ${page}`); diffs++; continue; }
    const A = a[page], B = b[page];
    if (A.length !== B.length) {
      console.log(`ELEMENT COUNT ${page}: ${A.length} -> ${B.length}`);
      diffs++;
    }
    /* Align by identity, not by position. Adding or removing one element shifts
       every later index, which turns a one-element change into thousands of
       bogus "differences" and buries the real ones. Grouping by the element's
       tag/id/class signature and comparing the nth occurrence of each signature
       survives insertions and deletions, and reports them as what they are. */
    const group = (rows) => {
      const m = new Map();
      for (const [k, v] of rows) {
        if (!m.has(k)) m.set(k, []);
        m.get(k).push(v);
      }
      return m;
    };
    const ga = group(A), gb = group(B);
    const cap = Number(process.env.DIFF_CAP || 6);
    const note = (line) => {
      byPage[page] = byPage[page] || [];
      if (byPage[page].length < cap) byPage[page].push(line);
    };
    for (const [k, va] of ga) {
      const vb = gb.get(k);
      if (!vb) { note(`  GONE  ${k} x${va.length}`); diffs += va.length; continue; }
      if (va.length !== vb.length) {
        note(`  COUNT ${k}: ${va.length} -> ${vb.length}`);
        diffs++;
      }
      const n = Math.min(va.length, vb.length);
      for (let i = 0; i < n; i++) {
        checked++;
        for (const p of Object.keys(va[i])) {
          if (va[i][p] !== vb[i][p]) { note(`  ${k}  ${p}: ${va[i][p]} -> ${vb[i][p]}`); diffs++; }
        }
      }
    }
    for (const [k, vb] of gb) if (!ga.has(k)) { note(`  NEW   ${k} x${vb.length}`); diffs += vb.length; }
  }
  for (const [page, lines] of Object.entries(byPage)) {
    console.log(`\n${page}`);
    for (const l of lines) console.log(l);
  }
  console.log(`\n${checked} elements compared, ${diffs} differences`);
  process.exit(diffs ? 1 : 0);
}

/* ---------------- capture mode ---------------- */
const base = (process.argv[2] || "http://127.0.0.1:8903").replace(/\/$/, "");
const OUT = process.argv[3] || "style-snapshot.json";
// fileURLToPath, not URL.pathname: this repo lives under a path with a space in
// it, and pathname hands back the percent-encoded form.
const HERE = path.dirname(fileURLToPath(import.meta.url));
const PAGES = (process.argv[4] || fs.readdirSync(path.join(HERE, "final-site"))
  .filter((f) => f.endsWith(".html")).map((f) => f.replace(/\.html$/, "")).join(",")).split(",");

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9400 + Math.floor(Math.random() * 250);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-snap-"));
const chrome = spawn(CHROME, [
  "--headless=new", "--disable-gpu", "--hide-scrollbars",
  `--remote-debugging-port=${PORT}`, "--remote-allow-origins=*",
  "--force-device-scale-factor=1", "--window-size=1440,900",
  "--no-first-run", "--no-default-browser-check",
  `--user-data-dir=${profile}`, "about:blank",
]);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const getJSON = (p) => new Promise((res, rej) => {
  http.get({ host: "127.0.0.1", port: PORT, path: p }, (r) => {
    let d = ""; r.on("data", (c) => (d += c)); r.on("end", () => res(JSON.parse(d)));
  }).on("error", rej);
});
let wsUrl;
for (let i = 0; i < 150; i++) {
  try { const v = await getJSON("/json/version"); if (v.webSocketDebuggerUrl) { wsUrl = v.webSocketDebuggerUrl; break; } } catch {}
  await wait(300);
}
const ws = new WebSocket(wsUrl);
let id = 0; const pending = new Map();
ws.addEventListener("message", async (ev) => {
  const raw = typeof ev.data === "string" ? ev.data : await ev.data.text();
  const m = JSON.parse(raw);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
});
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
const send = (method, params = {}, sessionId) => new Promise((res, rej) => {
  const mid = ++id;
  const t = setTimeout(() => rej(new Error("timeout " + method)), 60000);
  pending.set(mid, (m) => { clearTimeout(t); m.error ? rej(new Error(m.error.message)) : res(m.result); });
  ws.send(JSON.stringify({ id: mid, method, params, sessionId }));
});

const { targetInfos } = await send("Target.getTargets");
let pt = targetInfos.find((t) => t.type === "page");
if (!pt) pt = { targetId: (await send("Target.createTarget", { url: "about:blank" })).targetId };
const { sessionId } = await send("Target.attachToTarget", { targetId: pt.targetId, flatten: true });
await send("Page.enable", {}, sessionId);
await send("Runtime.enable", {}, sessionId);
await send("Emulation.setDeviceMetricsOverride",
  { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId);
// Deterministic settled state: no scroll-driven motion, no entrance tweens.
await send("Emulation.setEmulatedMedia",
  { features: [{ name: "prefers-reduced-motion", value: "reduce" }] }, sessionId);

const evalJs = async (expr) => {
  const r = await send("Runtime.evaluate",
    { expression: expr, returnByValue: true, awaitPromise: true }, sessionId);
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text);
  return r.result.value;
};

/* Properties the stylesheet owns. Deliberately excludes transform, opacity,
   visibility, clip-path and filter, which the motion layer writes inline. */
const PROPS = [
  "display", "position", "top", "left", "right", "bottom", "z-index",
  "width", "height", "margin-top", "margin-bottom", "margin-left", "margin-right",
  "padding-top", "padding-bottom", "padding-left", "padding-right",
  "font-family", "font-size", "font-weight", "font-style", "line-height",
  "letter-spacing", "text-transform", "text-align", "color", "background-color",
  "border-top-width", "border-bottom-width", "border-left-width", "border-right-width",
  "border-top-color", "border-bottom-color", "border-left-color", "border-right-color",
  "grid-template-columns", "grid-column", "grid-row", "flex-direction", "gap",
  "align-items", "justify-content", "order", "overflow-x", "overflow-y",
  "aspect-ratio", "object-fit", "max-width", "min-height", "white-space",
];

const snapshot = {};
for (const page of PAGES) {
  await send("Page.navigate", { url: `${base}/${page}.html` }, sessionId);
  await wait(3200);
  /* Wait for the webfonts before measuring. Every text width on the page is a
     different number in Raleway than in the Arial fallback, so a snapshot taken
     mid-swap disagrees with itself by ~2.5% on nav links and reads as a design
     change when nothing changed but the timing. */
  await evalJs(`document.fonts && document.fonts.ready ? document.fonts.ready.then(()=>1) : 1`);
  await wait(400);
  // Walk the whole document so a moved element shows up as an identity change.
  const rows = await evalJs(`(function(){
    var props = ${JSON.stringify(PROPS)};
    var out = [];
    var all = document.querySelectorAll('body *');
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE') continue;
      var cs = getComputedStyle(el);
      var v = {};
      for (var p = 0; p < props.length; p++) v[props[p]] = cs.getPropertyValue(props[p]);
      var key = el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') +
                (el.className && typeof el.className === 'string' && el.className.trim()
                   ? '.' + el.className.trim().split(/\\s+/).join('.') : '');
      out.push([key, v]);
    }
    return out;
  })()`);
  snapshot[page] = rows;
  console.log(`${page}: ${rows.length} elements`);
}

fs.writeFileSync(OUT, JSON.stringify(snapshot));
console.log(`wrote ${OUT}`);
ws.close();
chrome.kill();
process.exit(0);
