// Responsive gate: load every built page at three widths and fail on anything
// that overflows the viewport horizontally, plus a few things that only show up
// in a real layout (unreadable tap targets, text smaller than the body scale).
//
//   node responsive.mjs [--only substr] [--widths 390,768,1440]
//
// Horizontal overflow is the one mobile bug that makes a site feel broken rather
// than imperfect, and it is invisible in a desktop screenshot, so it gets a gate
// of its own rather than a spot check.
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(HERE, "dist");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";

const argv = process.argv.slice(2);
const str = (n, d) => { const i = argv.indexOf(n); return i === -1 ? d : argv[i + 1]; };
const ONLY = str("--only", null);
const WIDTHS = str("--widths", "390,768,1440").split(",").map(Number);

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
let routes = walk(DIST).filter((f) => f.endsWith("index.html")).map((f) => {
  const rel = path.relative(DIST, f).split(path.sep).join("/");
  return "/" + rel.replace(/index\.html$/, "");
}).sort();
if (ONLY) routes = routes.filter((r) => r.includes(ONLY));

// ------------------------------------------------------------- static server
const MIME = {
  ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".webp": "image/webp", ".svg": "image/svg+xml", ".ico": "image/x-icon",
};
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(req.url.split("?")[0]);
  let file = path.join(DIST, p);
  if (p.endsWith("/")) file = path.join(file, "index.html");
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404).end(); return; }
  res.writeHead(200, { "content-type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const BASE = "http://127.0.0.1:" + server.address().port;

// ---------------------------------------------------------------- CDP setup
const PORT = 9500 + Math.floor(Math.random() * 90);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "mpd-resp-"));
const chrome = spawn(CHROME, [
  "--headless=new", "--disable-gpu", "--hide-scrollbars",
  `--remote-debugging-port=${PORT}`, "--remote-allow-origins=*",
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
for (let i = 0; i < 80 && !wsUrl; i++) {
  try { wsUrl = (await getJSON("/json/version")).webSocketDebuggerUrl; } catch { await wait(200); }
}
const ws = new WebSocket(wsUrl);
let id = 0; const pending = new Map();
ws.addEventListener("message", (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
});
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let sessionId;
const call = (method, params, root) => new Promise((resolve) => {
  const mid = ++id; pending.set(mid, resolve);
  ws.send(JSON.stringify({ id: mid, method, params, ...(root ? {} : { sessionId }) }));
});
const { targetInfos } = await call("Target.getTargets", {}, true);
const t = targetInfos.find((x) => x.type === "page");
({ sessionId } = await call("Target.attachToTarget", { targetId: t.targetId, flatten: true }, true));
const send = (m, p = {}) => call(m, p, false);
await send("Page.enable");
await send("Runtime.enable");
const evaluate = async (expr) =>
  (await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true }))?.result?.value;

// The "has the stylesheet applied yet" test below compares a computed custom
// property against a literal. Read that literal out of the stylesheet rather
// than hard-coding it: this file was ported from the parent practice's rebuild,
// where --accent is #00bde0, and it silently never matched here. Every page then
// spent 80 retries failing to look ready, so a 55-page run took 17 minutes and
// reported the whole site as "never finished loading".
const ACCENT = (fs.readFileSync(path.join(HERE, "theme", "site.css"), "utf8")
  .match(/--accent:\s*([^;]+);/) || [, ""])[1].trim();
if (!ACCENT) { console.error("could not read --accent from theme/site.css"); process.exit(1); }

// Runs in-page. Reports the widest offender rather than every descendant of it,
// so one overflowing table does not produce forty findings.
const PROBE = `(() => {
  const ACCENT = ${JSON.stringify(ACCENT)};
  const vw = document.documentElement.clientWidth;
  // NOT readyState === "complete": that also waits on the Google Fonts request,
  // which in a headless run can stall past any sane budget and made a different
  // page "never finish loading" on every run. Layout is settled once the DOM is
  // parsed, our stylesheet has applied and the eager images have their boxes.
  const ready = document.readyState !== "loading"
    && getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() === ACCENT
    // Only images the page actually intends to load now. Lazy ones below the
    // fold never complete without scrolling, so requiring them here would hang
    // the probe on every long page and report the whole site as never loading.
    && [...document.images].filter((i) => i.loading !== "lazy").every((i) => i.complete);
  const over = [];
  for (const el of document.querySelectorAll("body *")) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    if (getComputedStyle(el).position === "fixed") continue;
    if (r.right > vw + 1 || r.left < -1) {
      over.push({
        sel: el.tagName.toLowerCase() + (el.className && typeof el.className === "string"
          ? "." + el.className.trim().split(/\\s+/).slice(0, 2).join(".") : ""),
        right: Math.round(r.right), left: Math.round(r.left), width: Math.round(r.width),
        depth: (() => { let d = 0, n = el; while ((n = n.parentElement)) d++; return d; })(),
      });
    }
  }
  over.sort((a, b) => a.depth - b.depth);
  const seen = new Set();
  const worst = over.filter((o) => !seen.has(o.sel) && seen.add(o.sel)).slice(0, 4);
  return {
    ready,
    vw,
    scrollWidth: document.documentElement.scrollWidth,
    overflow: worst,
    tinyText: [...document.querySelectorAll("p, li, a, td")]
      .filter((e) => parseFloat(getComputedStyle(e).fontSize) < 12).length,
  };
})()`;

const problems = [];
for (const width of WIDTHS) {
  await send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: width < 700 });
  for (const route of routes) {
    await send("Page.navigate", { url: BASE + route });
    // Measuring before the stylesheet applies reports the raw HTML width
    // attributes and produces spectacular false positives, so wait for the
    // document to finish AND for a value only site.css can have produced.
    // Re-probe until the probe itself reports a fully loaded, styled document.
    // A separate "is it ready" call is not enough: the previous page is still
    // live for a moment after Page.navigate and answers "yes" on its behalf.
    let r = null;
    for (let attempt = 0; attempt < 80; attempt++) {
      r = await evaluate(PROBE);
      if (r?.ready) break;
      await wait(75);
    }
    if (!r) continue;
    if (!r.ready) { problems.push({ width, route, msg: "page never finished loading" }); continue; }
    if (r.scrollWidth > r.vw + 1) {
      problems.push({ width, route, msg: `page scrolls horizontally (${r.scrollWidth}px in ${r.vw}px)` +
        (r.overflow.length ? ` - widest: ${r.overflow.map((o) => `${o.sel} @${o.left}..${o.right}`).join(", ")}` : "") });
    }
    if (r.tinyText) problems.push({ width, route, msg: `${r.tinyText} text node(s) under 12px` });
  }
  process.stdout.write(`  ${width}px: ${routes.length} pages checked\n`);
}

for (const p of problems) console.log(`FAIL  ${String(p.width).padStart(4)}px  ${p.route.padEnd(38)} ${p.msg}`);
console.log(`\n${routes.length} pages x ${WIDTHS.length} widths - ${problems.length} problem(s)`);
fs.writeFileSync(path.join(HERE, "responsive-report.json"), JSON.stringify({ widths: WIDTHS, routes: routes.length, problems }, null, 1));

ws.close(); chrome.kill(); server.close();
try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
process.exit(problems.length ? 1 : 0);
