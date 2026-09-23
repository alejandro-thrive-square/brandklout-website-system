// deep-diff.mjs — pair every element on both sides and diff what it renders as.
//
// parity.mjs answers "is the same content there". This answers the harder half:
// "does it LOOK the same", element by element, which is where the conversion
// actually loses things — the design themes with custom properties under
// `[data-theme]`, and a class-based system has nowhere to put a rule that only
// applies inside a dark section.
//
// Pairing is by a structural signature rather than by index, because Webflow
// inserts its own wrappers (w-embed, w-richtext) that have no counterpart in
// the design. Each element gets `tag>tag>tag|own-text|nth`, which survives an
// extra wrapper on one side while still being unique enough to pair on.
//
// Usage: node deep-diff.mjs <page> [--dark-only]
// Source Asana task GID: 1217040406855582
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const DESIGN = path.resolve(here, "../../04-design/.tmp");
const OUT = path.join(here, "parity");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const STAGING = (process.env.MPD_BASE_URL || "https://mason-park-dental.webflow.io").replace(/\/+$/, "");
const WIDTH = Number(process.env.MPD_WIDTH || 1440);

const ALL = ["invisalign", "new-patient-special", "thank-you"];
const PAGES = process.argv[2] && !process.argv[2].startsWith("--")
  ? ALL.filter((p) => p === process.argv[2]) : ALL;
const DARK_ONLY = process.argv.includes("--dark-only");

fs.mkdirSync(OUT, { recursive: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

let port = 9920;
async function session(url, fn) {
  const PORT = port++;
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-deep-"));
  const chrome = spawn(CHROME, [
    "--headless=new", "--use-gl=angle", "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader", "--hide-scrollbars", `--window-size=${WIDTH},1000`,
    `--remote-debugging-port=${PORT}`, "--remote-allow-origins=*",
    "--force-device-scale-factor=1", "--no-first-run",
    "--disable-background-timer-throttling", "--disable-backgrounding-occluded-windows",
    "--disable-renderer-backgrounding", `--user-data-dir=${profile}`, "about:blank",
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
  let id = 0; const pend = new Map();
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
  await send("Emulation.setDeviceMetricsOverride",
    { width: WIDTH, height: 1000, deviceScaleFactor: 1, mobile: false }, sessionId);
  const evaluate = (expr) =>
    send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true }, sessionId)
      .then((r) => {
        if (r?.exceptionDetails) throw new Error(r.exceptionDetails.text);
        return r?.result?.value;
      });
  await send("Page.navigate", { url }, sessionId);
  for (let i = 0; i < 150; i++) {
    const st = await evaluate(`document.documentElement ? document.readyState : ""`).catch(() => "");
    if (st === "interactive" || st === "complete") break;
    await wait(200);
  }
  try { return await fn({ evaluate }); }
  finally {
    ws.close(); chrome.kill();
    await new Promise((r) => { if (chrome.exitCode !== null) return r(); chrome.once("exit", r); setTimeout(r, 2500); });
  }
}

const SETTLE = `(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const t0 = Date.now(); let last = -1, stable = 0;
  while (Date.now() - t0 < 30000) {
    const h = document.documentElement.scrollHeight;
    if (Math.abs(h - last) <= 4) { stable++; if (stable >= 6) break; } else { stable = 0; last = h; }
    await sleep(400);
  }
  const step = innerHeight * 0.7;
  for (let y = 0; y < document.documentElement.scrollHeight; y += step) { scrollTo(0, y); await sleep(110); }
  scrollTo(0, 0); await sleep(900);
  return true;
})()`;

const COLLECT = `(function () {
  const SKIP = new Set(["SCRIPT","STYLE","NOSCRIPT","TEMPLATE","HEAD","LINK","META","TITLE"]);
  const norm = s => (s || "").replace(/\\s+/g, " ").trim();
  // Wrappers Webflow adds that the design has no counterpart for; they are not
  // part of the design's structure, so they must not shift the path signature.
  // A verbatim SVG embed lands as <div class="<generated> w-embed"><style>..
  // <svg>..</div> INSIDE the design's own element, and the whole page sits in a
  // div.page-wrapper. Neither exists in the design, so both must be invisible
  // to the pairing or every following sibling's nth slips by one.
  const NOISE = /(^|\\s)(w-embed|w-richtext|w-layout|w-container|w-dyn-\\S+|page-wrapper)(\\s|$)/;
  // The converter materialises ::before/::after into real elements, because a
  // Webflow class cannot carry a pseudo. They have no design counterpart, so
  // they shift every following sibling's nth. Two -after classes ARE the
  // design's own real elements and must not be swept up with them.
  const DESIGN_PSEUDO = new Set(["catch-after", "hes-after"]);
  const isNoise = el => {
    const c = typeof el.className === "string" ? el.className : (el.className.baseVal || "");
    if (NOISE.test(c)) return true;
    return c.split(/\\s+/).some(t =>
      /-(before|after)$/.test(t) && !DESIGN_PSEUDO.has(t));
  };

  // Pairing anchor. An ancestor CHAIN cannot be used: Webflow wraps the whole
  // page in div.page-wrapper, which shifts every design path by one level and
  // pairs body-level siblings against each other at random (it matched the
  // sticky offer rail against the page wrapper and reported the rail as
  // unstyled). Anchoring on the nearest id instead is stable, because the ids
  // are the design's own section ids and both sides carry them.
  function anchorOf(el) {
    for (let p = el; p && p.tagName && p.tagName !== "BODY"; p = p.parentElement) {
      if (p.id) return "#" + p.id;
    }
    return "body";
  }
  function themeOf(el) {
    for (let p = el; p; p = p.parentElement) {
      const t = p.getAttribute && p.getAttribute("data-theme");
      if (t) return t;
    }
    return "";
  }

  const seen = new Map();
  const out = [];
  const all = document.querySelectorAll("body *");
  for (const el of all) {
    if (SKIP.has(el.tagName)) continue;
    const cs = getComputedStyle(el);
    if (cs.display === "none") continue;
    const own = norm([...el.childNodes].filter(n => n.nodeType === 3).map(n => n.nodeValue).join(" "));
    // The embed wrapper Webflow inserts has no design counterpart, so counting
    // it would push every following sibling's nth out of step.
    if (isNoise(el) && !own) continue;
    const key0 = anchorOf(el) + "|" + el.tagName.toLowerCase() + "|" + own.slice(0, 60);
    const n = (seen.get(key0) || 0); seen.set(key0, n + 1);
    const r = el.getBoundingClientRect();
    out.push({
      k: key0 + "|" + n,
      tag: el.tagName.toLowerCase(),
      id: el.id || "",
      cls: (typeof el.className === "string" ? el.className : (el.className.baseVal || "")).trim(),
      text: own.slice(0, 60),
      theme: themeOf(el),
      sec: (el.closest("[data-chapter-name]") || {}).id || "",
      w: Math.round(r.width), h: Math.round(r.height),
      color: cs.color, bg: cs.backgroundColor, bgi: cs.backgroundImage === "none" ? "" : "img",
      bc: [cs.borderTopColor, cs.borderRightColor, cs.borderBottomColor, cs.borderLeftColor].join("/"),
      bw: [cs.borderTopWidth, cs.borderRightWidth, cs.borderBottomWidth, cs.borderLeftWidth].join("/"),
      ff: (cs.fontFamily || "").split(",")[0].replace(/["']/g, ""),
      fs: cs.fontSize, fw: cs.fontWeight, lh: cs.lineHeight,
      tt: cs.textTransform, ls: cs.letterSpacing, ta: cs.textAlign,
      op: cs.opacity, fill: cs.fill, stroke: cs.stroke,
      rad: cs.borderTopLeftRadius, disp: cs.display,
    });
  }
  return out;
})()`;

// Which properties matter, and how to describe a difference in one line.
const PROPS = [
  ["color", "text colour"], ["bg", "background"], ["bc", "border colour"],
  ["bw", "border width"], ["ff", "font family"], ["fs", "font size"],
  ["fw", "font weight"], ["lh", "line height"], ["tt", "text transform"],
  ["ls", "letter spacing"], ["ta", "text align"], ["fill", "svg fill"],
  ["stroke", "svg stroke"], ["rad", "border radius"], ["disp", "display"],
];

const rgb = (s) => {
  const m = String(s).match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const p = m[1].split(",").map((x) => parseFloat(x));
  return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
};
// Same to the eye: within 6/255 on every channel and 0.03 on alpha.
function sameColour(x, y) {
  const xs = String(x).split("/"), ys = String(y).split("/");
  if (xs.length !== ys.length) return false;
  return xs.every((v, i) => {
    if (v === ys[i]) return true;
    const a = rgb(v), b = rgb(ys[i]);
    if (!a || !b) return false;
    return Math.abs(a.r - b.r) <= 6 && Math.abs(a.g - b.g) <= 6 &&
           Math.abs(a.b - b.b) <= 6 && Math.abs(a.a - b.a) <= 0.03;
  });
}
const hasBorder = (bw) => String(bw).split("/").some((v) => parseFloat(v) > 0);

const localUrl = (p) =>
  "file:///" + path.join(DESIGN, p, "index.html").replace(/\\/g, "/").replace(/ /g, "%20");
const grab = (url) => session(url, async ({ evaluate }) => {
  await evaluate(SETTLE);
  return evaluate(COLLECT);
});

const REPORT = [];
const log = (s = "") => { REPORT.push(s); console.log(s); };

for (const page of PAGES) {
  log("\n" + "=".repeat(78));
  log("DEEP DIFF  " + page + (DARK_ONLY ? "   (dark sections only)" : ""));
  log("=".repeat(78));

  const local = await grab(localUrl(page));
  await wait(4000);
  const live = await grab(`${STAGING}/${page}`);
  fs.writeFileSync(path.join(OUT, `${page}.deep.local.json`), JSON.stringify(local));
  fs.writeFileSync(path.join(OUT, `${page}.deep.staging.json`), JSON.stringify(live));

  const lm = new Map(local.map((e) => [e.k, e]));
  const sm = new Map(live.map((e) => [e.k, e]));
  log(`  elements: ${local.length} design / ${live.length} staging`);

  let paired = 0;
  const findings = new Map();   // signature -> {n, sample}
  const unpaired = [];
  for (const [k, a] of lm) {
    const b = sm.get(k);
    if (!b) { unpaired.push(a); continue; }
    paired++;
    if (DARK_ONLY && a.theme !== "dark") continue;
    for (const [prop, label] of PROPS) {
      if (String(a[prop]) === String(b[prop])) continue;
      // A font-size that only differs below a rounding step is a fluid-clamp
      // rounding artefact, not a design change.
      if (prop === "fs" || prop === "lh") {
        const d = Math.abs(parseFloat(a[prop]) - parseFloat(b[prop]));
        if (!(d > 0.6)) continue;
      }
      // Webflow stores colours at 8-bit/2-dp precision, so a design authored in
      // a wider space comes back a shade off. Nobody can see it, and left in it
      // buries the differences that are real.
      if (/colour/.test(label) && sameColour(a[prop], b[prop])) continue;
      // border-color on a zero-width border paints nothing. Reporting it turns
      // an invisible inherited default into a finding.
      if (prop === "bc" && !hasBorder(a.bw) && !hasBorder(b.bw)) continue;
      const sig = `${label}|${a[prop]}|${b[prop]}`;
      const rec = findings.get(sig) || { n: 0, label, design: a[prop], staging: b[prop], where: [] };
      rec.n++;
      if (rec.where.length < 4) {
        rec.where.push(`${a.theme || "-"}/${a.sec || "-"} <${a.tag}${a.cls ? "." + a.cls.split(/\s+/).join(".") : ""}> ${a.text || "(no text)"}` +
          (b.cls !== a.cls ? `   [staging classes: ${b.cls || "(none)"}]` : ""));
      }
      findings.set(sig, rec);
    }
  }
  log(`  paired:   ${paired}   unpaired-in-design: ${unpaired.length}`);
  if (unpaired.length) {
    log(`  !! ${unpaired.length} design elements with no staging counterpart (first 15):`);
    unpaired.slice(0, 15).forEach((a) =>
      log(`       - <${a.tag}> ${a.sec ? "#" + a.sec + " " : ""}${a.text || "(no text)"}  [${a.k.split("|")[0]}]`));
  }

  const sorted = [...findings.values()].sort((x, y) => y.n - x.n);
  console.log(`\n  ${sorted.length} distinct rendering differences over ${sorted.reduce((s, x) => s + x.n, 0)} elements:\n`);
  for (const f of sorted) {
    log(`  [x${f.n}] ${f.label}:  design=${f.design}   staging=${f.staging}`);
    f.where.forEach((w) => log(`         @ ${w}`));
  }
}

fs.writeFileSync(path.join(OUT, "deep-report.txt"), REPORT.join("\n"));
console.log("\nreport -> " + path.join(OUT, "deep-report.txt"));
