// parity.mjs — is the STAGING page the same page as the LOCAL design?
//
// The other gates in this folder ask "does the built page behave" (scrub-proof)
// and "does it fit" (pin-fit, screens). None of them asks the question the
// client actually asks, which is "is this the same page I signed off on, down
// to the icons". This one does, by fingerprinting both sides and diffing.
//
// Four fingerprints per page, each catching a different class of drift:
//   text    — every visible text run in document order (missing/changed copy,
//             a whole section that failed to paste)
//   images  — <img> in document order: asset basename, alt, natural size, and
//             the nearest text label, so a SWAPPED asset is visible as such
//   icons   — inline <svg> in document order, keyed by viewBox + a hash of the
//             concatenated path geometry (a wrong or missing icon)
//   styles  — computed font/colour/background on every text-bearing element
//
// Assets legitimately differ by URL (local files vs the Webflow CDN), so image
// identity is compared on the design's own basename, which the uploader keeps
// in the CDN filename. The map in ALIAS handles the cases where it does not.
//
// Usage:
//   node parity.mjs                 # all three pages
//   node parity.mjs invisalign      # one page
//   MPD_BASE_URL=... node parity.mjs   # override staging origin
//
// Output: .tmp/parity/<page>.{local,staging}.json and <page>.report.txt
// Source Asana task GID: 1217040406855582
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const DESIGN = path.resolve(here, "../../04-design/.tmp");
const OUT = path.join(here, "parity");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const STAGING = (process.env.MPD_BASE_URL || "https://mason-park-dental.webflow.io").replace(/\/+$/, "");

const ALL = ["invisalign", "new-patient-special", "thank-you"];
const PAGES = process.argv[2] ? ALL.filter((p) => p === process.argv[2]) : ALL;
const WIDTH = Number(process.env.MPD_WIDTH || 1440);

fs.mkdirSync(OUT, { recursive: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------- CDP session
let port = 9800;
async function session(url, fn) {
  const PORT = port++;
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-parity-"));
  const chrome = spawn(CHROME, [
    "--headless=new",
    "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
    "--hide-scrollbars",
    `--window-size=${WIDTH},1000`,
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
  await send("Emulation.setDeviceMetricsOverride",
    { width: WIDTH, height: 1000, deviceScaleFactor: 1, mobile: false }, sessionId);
  const evaluate = (expr) =>
    send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true }, sessionId)
      .then((r) => {
        if (r?.exceptionDetails) throw new Error(r.exceptionDetails.text + " " +
          (r.exceptionDetails.exception?.description || ""));
        return r?.result?.value;
      });
  await send("Page.navigate", { url }, sessionId);
  // Runtime.evaluate lands in the OLD document if it fires before the commit,
  // where document.documentElement is null — poll for a real document first.
  for (let i = 0; i < 150; i++) {
    const st = await evaluate(`document.documentElement ? document.readyState : ""`).catch(() => "");
    if (st === "interactive" || st === "complete") break;
    await wait(200);
  }
  try {
    return await fn({ evaluate });
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

// These pages need ~15s to reach a stable height (see RUNBOOK "the gate bugs"),
// so settle on a height that has actually stopped moving before reading it, and
// walk the whole page first so every reveal has fired and lazy images decoded.
// A fingerprint taken before this records the harness's impatience.
const SETTLE = `(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const t0 = Date.now();
  let last = -1, stable = 0;
  while (Date.now() - t0 < 30000) {
    const h = document.documentElement.scrollHeight;
    if (Math.abs(h - last) <= 4) { stable++; if (stable >= 6) break; }
    else { stable = 0; last = h; }
    await sleep(400);
  }
  const step = innerHeight * 0.7;
  for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
    scrollTo(0, y); await sleep(120);
  }
  scrollTo(0, document.documentElement.scrollHeight);
  await sleep(900);
  scrollTo(0, 0);
  await sleep(900);
  return document.documentElement.scrollHeight;
})()`;

// ------------------------------------------------------------- the fingerprint
const FINGERPRINT = `(function () {
  const SKIP = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE", "IFRAME"]);
  const norm = s => (s || "").replace(/\\s+/g, " ").trim();
  const base = u => {
    if (!u) return "";
    if (/^data:/.test(u)) return "data:" + u.length;
    try { u = new URL(u, location.href).pathname; } catch (e) {}
    let n = u.split("/").pop() || "";
    try { n = decodeURIComponent(n); } catch (e) {}
    return n;
  };
  const visible = el => {
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") return false;
    return true;
  };
  // A reveal parks its element at opacity 0 until it scrolls in, and a pinned
  // chapter parks later cards off-screen. Neither is "absent", so presence is
  // judged on layout and display only, never on opacity or position.

  const out = { text: [], images: [], icons: [], styles: [], meta: {} };

  out.meta.title = document.title;
  out.meta.h1 = [...document.querySelectorAll("h1")].map(h => norm(h.textContent));
  out.meta.height = document.documentElement.scrollHeight;

  // --- text: every own-text run, in document order
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      if (!norm(n.nodeValue)) return NodeFilter.FILTER_REJECT;
      let p = n.parentElement;
      if (!p || SKIP.has(p.tagName)) return NodeFilter.FILTER_REJECT;
      if (!visible(p)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    out.text.push(norm(n.nodeValue));
  }

  // --- images, with the nearest heading/label so a swap is legible
  const labelFor = el => {
    for (let p = el; p && p !== document.body; p = p.parentElement) {
      const t = norm(p.textContent);
      if (t) return t.slice(0, 60);
      let s = p.previousElementSibling;
      while (s) { const st = norm(s.textContent); if (st) return st.slice(0, 60); s = s.previousElementSibling; }
    }
    return "";
  };
  [...document.images].forEach((img, i) => {
    out.images.push({
      i, file: base(img.currentSrc || img.src), alt: norm(img.alt),
      nat: img.naturalWidth + "x" + img.naturalHeight,
      box: Math.round(img.getBoundingClientRect().width) + "x" + Math.round(img.getBoundingClientRect().height),
      shown: visible(img), near: labelFor(img),
    });
  });

  // --- background images from computed style (art that is not an <img>)
  [...document.querySelectorAll("body *")].forEach(el => {
    if (SKIP.has(el.tagName) || !visible(el)) return;
    const bi = getComputedStyle(el).backgroundImage;
    if (!bi || bi === "none") return;
    const urls = [...bi.matchAll(/url\\((['"]?)(.*?)\\1\\)/g)].map(m => base(m[2]));
    if (urls.length) out.images.push({ bg: true, file: urls.join("|"), near: labelFor(el).slice(0, 40) });
  });

  // --- icons: inline svg keyed on geometry, not on markup
  const h32 = s => { let h = 0; for (let i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) | 0; } return (h >>> 0).toString(16); };
  [...document.querySelectorAll("svg")].forEach((svg, i) => {
    const geo = [...svg.querySelectorAll("path,circle,rect,line,polyline,polygon,ellipse")]
      .map(n => n.tagName + ":" + (n.getAttribute("d") || [...n.attributes].map(a => a.name + "=" + a.value).join(",")))
      .join(";");
    const r = svg.getBoundingClientRect();
    out.icons.push({
      i, vb: svg.getAttribute("viewBox") || "", n: svg.children.length,
      geo: h32(geo), len: geo.length,
      box: Math.round(r.width) + "x" + Math.round(r.height),
      stroke: getComputedStyle(svg).stroke, fill: getComputedStyle(svg).fill,
      shown: visible(svg), near: labelFor(svg).slice(0, 40),
    });
  });

  // --- styles: what every text-bearing element actually renders as
  const seen = new Set();
  [...document.querySelectorAll("body *")].forEach(el => {
    if (SKIP.has(el.tagName) || !visible(el)) return;
    const own = norm([...el.childNodes].filter(n => n.nodeType === 3).map(n => n.nodeValue).join(" "));
    if (!own) return;
    const cs = getComputedStyle(el);
    const key = own.slice(0, 40);
    if (seen.has(key)) return;
    seen.add(key);
    out.styles.push({
      t: key, tag: el.tagName.toLowerCase(),
      ff: (cs.fontFamily || "").split(",")[0].replace(/["']/g, ""),
      fs: Math.round(parseFloat(cs.fontSize)) + "px",
      fw: cs.fontWeight, lh: cs.lineHeight,
      tt: cs.textTransform, ls: cs.letterSpacing,
      c: cs.color, bg: cs.backgroundColor,
    });
  });

  return out;
})()`;

// ------------------------------------------------------------------ compare
const localUrl = (p) =>
  "file:///" + path.join(DESIGN, p, "index.html").replace(/\\/g, "/").replace(/ /g, "%20");

async function grab(url) {
  return session(url, async ({ evaluate }) => {
    await evaluate(SETTLE);
    return evaluate(FINGERPRINT);
  });
}

// Multiset diff: what the design has that staging does not, and vice versa.
function diffList(a, b, key) {
  const count = (arr) => {
    const m = new Map();
    for (const x of arr) { const k = key(x); m.set(k, (m.get(k) || 0) + 1); }
    return m;
  };
  const ma = count(a), mb = count(b);
  const missing = [], extra = [];
  for (const [k, n] of ma) { const d = n - (mb.get(k) || 0); if (d > 0) missing.push([k, d]); }
  for (const [k, n] of mb) { const d = n - (ma.get(k) || 0); if (d > 0) extra.push([k, d]); }
  return { missing, extra };
}

const lines = [];
const say = (s = "") => { lines.push(s); console.log(s); };

let totalFindings = 0;

for (const page of PAGES) {
  say("");
  say("=".repeat(72));
  say(`PAGE  ${page}`);
  say("=".repeat(72));

  const local = await grab(localUrl(page));
  await wait(4000);            // the CDN closes connections on back-to-back runs
  const live = await grab(`${STAGING}/${page}`);

  fs.writeFileSync(path.join(OUT, `${page}.local.json`), JSON.stringify(local, null, 1));
  fs.writeFileSync(path.join(OUT, `${page}.staging.json`), JSON.stringify(live, null, 1));

  say(`  height   local ${local.meta.height}  staging ${live.meta.height}`);
  say(`  h1       local ${JSON.stringify(local.meta.h1)}`);
  say(`           live  ${JSON.stringify(live.meta.h1)}`);

  // 1 — copy
  const td = diffList(local.text, live.text, (x) => x);
  say("");
  say(`  TEXT     ${local.text.length} runs local / ${live.text.length} staging`);
  if (td.missing.length) {
    say(`  !! ${td.missing.length} text runs in the design that are NOT on staging:`);
    td.missing.slice(0, 40).forEach(([k, n]) => say(`       - ${n > 1 ? `(x${n}) ` : ""}${k.slice(0, 110)}`));
    if (td.missing.length > 40) say(`       ... and ${td.missing.length - 40} more`);
  }
  if (td.extra.length) {
    say(`  !! ${td.extra.length} text runs on staging that are NOT in the design:`);
    td.extra.slice(0, 40).forEach(([k, n]) => say(`       + ${n > 1 ? `(x${n}) ` : ""}${k.slice(0, 110)}`));
    if (td.extra.length > 40) say(`       ... and ${td.extra.length - 40} more`);
  }
  totalFindings += td.missing.length + td.extra.length;

  // 2 — assets, compared on the design's basename
  // Webflow's uploader prefixes every asset with the 24-char asset id and keeps
  // the design's own filename after it, so identity survives the CDN rename.
  const stem = (f) => (f || "").replace(/\.[a-z0-9]+$/i, "").toLowerCase()
    .replace(/^[0-9a-f]{16,32}_/, "").replace(/-[0-9a-f]{6,}$/, "");
  say("");
  say(`  IMAGES   ${local.images.length} local / ${live.images.length} staging`);
  const idl = diffList(local.images, live.images, (x) => stem(x.file));
  if (idl.missing.length) {
    say(`  !! assets in the design, absent on staging:`);
    idl.missing.forEach(([k, n]) => {
      const ex = local.images.find((x) => stem(x.file) === k);
      say(`       - ${n > 1 ? `(x${n}) ` : ""}${k}   near: ${ex?.near || ""}`);
    });
  }
  if (idl.extra.length) {
    say(`  !! assets on staging, absent from the design:`);
    idl.extra.forEach(([k, n]) => {
      const ex = live.images.find((x) => stem(x.file) === k);
      say(`       + ${n > 1 ? `(x${n}) ` : ""}${k}   near: ${ex?.near || ""}`);
    });
  }
  // ordered positional check — a right-count/wrong-place asset swap
  const lseq = local.images.filter((x) => !x.bg).map((x) => stem(x.file));
  const sseq = live.images.filter((x) => !x.bg).map((x) => stem(x.file));
  const swaps = [];
  for (let i = 0; i < Math.max(lseq.length, sseq.length); i++) {
    if (lseq[i] !== sseq[i]) swaps.push(`#${i} design=${lseq[i] ?? "-"} staging=${sseq[i] ?? "-"}`);
  }
  if (swaps.length) {
    say(`  !! <img> order differs (${swaps.length} positions) — a swapped or shifted asset:`);
    swaps.slice(0, 25).forEach((s) => say(`       ~ ${s}`));
  }
  // broken / undecoded
  const broken = live.images.filter((x) => !x.bg && x.nat === "0x0" && x.shown);
  if (broken.length) {
    say(`  !! ${broken.length} staging <img> resolved to 0x0 (broken or never decoded):`);
    broken.forEach((x) => say(`       x ${x.file}   near: ${x.near}`));
  }
  totalFindings += idl.missing.length + idl.extra.length + swaps.length + broken.length;

  // 3 — icons
  say("");
  say(`  ICONS    ${local.icons.length} local / ${live.icons.length} staging`);
  const icd = diffList(local.icons, live.icons, (x) => x.geo + "@" + x.vb);
  if (icd.missing.length) {
    say(`  !! icon geometries in the design, absent on staging:`);
    icd.missing.forEach(([k, n]) => {
      const ex = local.icons.find((x) => x.geo + "@" + x.vb === k);
      say(`       - ${n > 1 ? `(x${n}) ` : ""}vb=${ex?.vb} paths=${ex?.n} box=${ex?.box}  near: ${ex?.near}`);
    });
  }
  if (icd.extra.length) {
    say(`  !! icon geometries on staging, absent from the design:`);
    icd.extra.forEach(([k, n]) => {
      const ex = live.icons.find((x) => x.geo + "@" + x.vb === k);
      say(`       + ${n > 1 ? `(x${n}) ` : ""}vb=${ex?.vb} paths=${ex?.n} box=${ex?.box}  near: ${ex?.near}`);
    });
  }
  // size / colour of the icons that DO match
  const byGeo = new Map();
  live.icons.forEach((x) => { if (!byGeo.has(x.geo)) byGeo.set(x.geo, x); });
  const iconStyle = [];
  local.icons.forEach((x) => {
    const m = byGeo.get(x.geo);
    if (!m) return;
    if (m.box !== x.box) iconStyle.push(`box design=${x.box} staging=${m.box}  near: ${x.near}`);
    else if (m.stroke !== x.stroke || m.fill !== x.fill)
      iconStyle.push(`colour design=${x.stroke}/${x.fill} staging=${m.stroke}/${m.fill}  near: ${x.near}`);
  });
  if (iconStyle.length) {
    say(`  !! ${iconStyle.length} matched icons render differently:`);
    iconStyle.slice(0, 25).forEach((s) => say(`       ~ ${s}`));
  }
  totalFindings += icd.missing.length + icd.extra.length + iconStyle.length;

  // 4 — typography and colour, on the copy that exists on both sides
  say("");
  const lmap = new Map(local.styles.map((s) => [s.t, s]));
  const smap = new Map(live.styles.map((s) => [s.t, s]));
  const styleDiffs = [];
  for (const [t, a] of lmap) {
    const b = smap.get(t);
    if (!b) continue;
    const d = [];
    for (const k of ["ff", "fs", "fw", "lh", "tt", "ls", "c", "bg"]) {
      if (String(a[k]) !== String(b[k])) d.push(`${k}: design=${a[k]} staging=${b[k]}`);
    }
    if (d.length) styleDiffs.push(`"${t}" — ${d.join("; ")}`);
  }
  say(`  STYLES   ${lmap.size} comparable text elements, ${styleDiffs.length} differ`);
  styleDiffs.slice(0, 40).forEach((s) => say(`       ~ ${s}`));
  if (styleDiffs.length > 40) say(`       ... and ${styleDiffs.length - 40} more`);
  totalFindings += styleDiffs.length;
}

say("");
say("=".repeat(72));
say(totalFindings === 0
  ? "PARITY: staging matches the design on every fingerprint."
  : `PARITY: ${totalFindings} differences between the design and staging.`);
fs.writeFileSync(path.join(OUT, "report.txt"), lines.join("\n"));
say(`report → ${path.join(OUT, "report.txt")}`);
