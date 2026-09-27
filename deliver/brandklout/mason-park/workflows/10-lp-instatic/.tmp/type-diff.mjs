/**
 * GATE: the typography of every text element on production, against the same
 * element on the Webflow original.
 *
 * compare.mjs proves the heights match and the text is the same. Neither notices
 * a button that falls back to another typeface, because a fallback face changes
 * a page's height by a few pixels. This keys every leaf text element by its text
 * and compares family, weight, size, tracking and transform, and lists the font
 * faces each document actually loaded.
 *
 *   node type-diff.mjs [--slug invisalign] [--vw 1440]
 *   TARGET_ORIGIN=https://staging.masonparkdental.com node type-diff.mjs
 */
import { spawn } from "node:child_process";
import http from "node:http";
import os from "node:os";
import path from "node:path";

const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const OURS = process.env.TARGET_ORIGIN || "https://www.masonparkdental.com";
const REF = "https://mason-park-dental.webflow.io";
const argv = process.argv.slice(2);
const num = (n, d) => { const i = argv.indexOf(n); return i === -1 ? d : Number(argv[i + 1]); };
const VW = num("--vw", 1440);
const ONE = argv.includes("--slug") ? argv[argv.indexOf("--slug") + 1] : null;
const SLUGS = ONE ? [ONE] : [
  "invisalign", "new-patient-special", "invisalign-consultation",
  "new-patient-special-consultation", "invisalign-thank-you", "new-patient-thank-you",
];

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const gj = (p, port) => new Promise((res, rej) => http.get({ host: "127.0.0.1", port, path: p }, (r) => {
  let d = ""; r.on("data", (c) => (d += c)); r.on("end", () => res(JSON.parse(d)));
}).on("error", rej));

const port = 9800 + Math.floor(Math.random() * 90);
const proc = spawn(CHROME, [
  "--headless=new", "--disable-gpu", `--remote-debugging-port=${port}`,
  "--remote-allow-origins=*", "--no-first-run", "--hide-scrollbars",
  `--user-data-dir=${path.join(os.tmpdir(), "typediff" + Date.now())}`, "about:blank",
], { stdio: "ignore" });

let ws;
for (let i = 0; i < 150 && !ws; i++) {
  try { ws = (await gj("/json/version", port)).webSocketDebuggerUrl; } catch { await wait(200); }
}
const sock = new WebSocket(ws);
const pend = new Map();
let id = 0;
sock.addEventListener("message", async (e) => {
  const m = JSON.parse(typeof e.data === "string" ? e.data : await e.data.text());
  if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); }
});
await new Promise((r) => sock.addEventListener("open", r, { once: true }));
const send = (me, p = {}, sid) => new Promise((res, rej) => {
  const i = ++id;
  pend.set(i, (m) => (m.error ? rej(new Error(m.error.message)) : res(m.result)));
  sock.send(JSON.stringify({ id: i, method: me, params: p, sessionId: sid }));
});
const tg = (await gj("/json/list", port)).find((t) => t.type === "page");
const { sessionId } = await send("Target.attachToTarget", { targetId: tg.id, flatten: true });
const S = (m, p = {}) => send(m, p, sessionId);
await S("Page.enable");
// The Sienna accessibility widget is site-wide on production and absent on Webflow. It writes whole-pixel
// font sizes inline (12.8px -> 12px), which would bury real drift under a hundred sub-pixel rows.
await S("Network.enable");
if (!argv.includes("--with-widget")) await S("Network.setBlockedURLs", { urls: ["*sienna-accessibility*"] });

const PROBE = `(() => {
  const out = {};
  const seen = {};
  for (const el of document.querySelectorAll("body *")) {
    if (el.closest("iframe, script, style, noscript, svg")) continue;
    const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join(" ").replace(/\\s+/g, " ").trim();
    if (own.length < 3) continue;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none") continue;
    const base = own.replace(/[(][0-9]{3}[)] [0-9]{3}-[0-9]{4}/g, "(PHONE)").slice(0, 60);
    seen[base] = (seen[base] || 0) + 1;
    out[base + "#" + seen[base]] = {
      family: cs.fontFamily.split(",")[0].replace(/["']/g, "").trim(),
      weight: cs.fontWeight, size: cs.fontSize, tracking: cs.letterSpacing,
      transform: cs.textTransform, style: cs.fontStyle, line: cs.lineHeight, color: cs.color,
    };
  }
  // --all: every element with a class, keyed by its class list, on the properties a leaked rule would move.
  const box = {};
  if (${JSON.stringify(process.argv.includes("--all"))}) {
    const PROPS = ["display","position","gap","alignItems","justifyContent","flexDirection","paddingTop","paddingRight","paddingBottom","paddingLeft",
      "marginTop","marginRight","marginBottom","marginLeft","borderTopWidth","borderTopColor","borderTopLeftRadius","backgroundColor","color",
      "fontFamily","fontSize","fontWeight","letterSpacing","lineHeight","textTransform","textDecorationLine","textAlign","boxShadow","opacity","transitionProperty","listStyleType","maxWidth"];
    const n = {};
    for (const el of document.querySelectorAll("body [class]")) {
      if (el.closest("iframe, script, style, noscript, svg, .asw-container, [id^=termly], .wz-embed")) continue;
      const cls = [...el.classList].filter((c) => !/^(lp-page|wz-|is-lp)/.test(c)).sort().join(".");
      if (!cls) continue;
      const k0 = el.tagName.toLowerCase() + "." + cls; n[k0] = (n[k0] || 0) + 1;
      const cs = getComputedStyle(el); const o = {};
      for (const p of PROPS) o[p] = p === "fontFamily" ? cs[p].split(",")[0].replace(/["']/g, "").trim() : cs[p];
      box[k0 + "#" + n[k0]] = o;
    }
  }
  const faces = [...document.fonts].filter((f) => f.status === "loaded")
    .map((f) => f.family.replace(/["']/g, "") + " " + f.weight + " " + f.style).sort();
  return JSON.stringify({ els: out, box, faces: [...new Set(faces)] });
})()`;

async function read(url) {
  await S("Emulation.setDeviceMetricsOverride", { width: VW, height: 1200, deviceScaleFactor: 1, mobile: VW < 500 });
  await S("Page.navigate", { url });
  await wait(5000);
  await S("Runtime.evaluate", { expression: "document.documentElement.style.scrollBehavior='auto';window.scrollTo(0,document.body.scrollHeight)" });
  await wait(1500);
  const { result } = await S("Runtime.evaluate", { expression: PROBE, returnByValue: true });
  return JSON.parse(result.value);
}

let problems = 0;
for (const slug of SLUGS) {
  const a = await read(`${OURS}/${slug}`);
  const b = await read(`${REF}/${slug}`);
  const keys = Object.keys(b.els);
  const missing = keys.filter((k) => !a.els[k]);
  const diffs = [];
  for (const k of keys) {
    if (!a.els[k]) continue;
    const d = Object.keys(b.els[k]).filter((p) => a.els[k][p] !== b.els[k][p]);
    if (d.length) diffs.push([k, d.map((p) => `${p} ${a.els[k][p]} (ref ${b.els[k][p]})`).join("; ")]);
  }
  console.log(`\n${slug}: ${keys.length} text elements on the reference, ${missing.length} not found on ours, ${diffs.length} styled differently`);
  console.log(`  faces ours: ${a.faces.join(" | ") || "-"}`);
  console.log(`  faces ref : ${b.faces.join(" | ") || "-"}`);
  for (const k of missing.slice(0, 12)) console.log(`  MISSING  ${k}`);
  for (const [k, d] of diffs.slice(0, 40)) console.log(`  DIFF     ${k.padEnd(48)} ${d}`);
  if (diffs.length > 40) console.log(`  ... and ${diffs.length - 40} more`);
  problems += missing.length + diffs.length;
  if (argv.includes("--all")) {
    // Group by "property ours (ref)" so one leaked rule reads as one line, not forty.
    const groups = {};
    let unmatched = 0;
    for (const k of Object.keys(b.box)) {
      if (!a.box[k]) { unmatched++; continue; }
      for (const p of Object.keys(b.box[k])) {
        if (a.box[k][p] === b.box[k][p]) continue;
        // Deliberate: build.mjs gives the FAQ glyph its own rotate transition (lp-faq.js replaces webflow.js).
        if (p === "transitionProperty" && /faq_icon/.test(k)) continue;
        const g = `${k.replace(/#\d+$/, "")}  ${p}: ${a.box[k][p]} (ref ${b.box[k][p]})`;
        groups[g] = (groups[g] || 0) + 1;
      }
    }
    const rows = Object.entries(groups).sort((x, y) => y[1] - x[1]);
    console.log(`  BOX      ${Object.keys(b.box).length} classed elements on the reference, ${unmatched} unmatched, ${rows.length} distinct property differences`);
    for (const [g, c] of rows.slice(0, 80)) console.log(`  BOX x${String(c).padEnd(3)} ${g}`);
    problems += rows.length;
  }
}

console.log(`\n${problems} problems`);
sock.close();
proc.kill();
process.exit(problems ? 1 : 0);
