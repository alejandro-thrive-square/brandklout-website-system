// Proof that a section is portable.
//
// The architecture claims that styling and behaviour are site-wide and each
// section's module guards on its own markup, so moving a section between pages
// means moving the markup and nothing else. This checks that claim the only way
// worth checking it: it lifts a section out of one built page, drops it into a
// different built page that has never carried it, and asks whether it looks and
// behaves the same there.
//
// It works on the BUILT pages and writes a scratch file, so it never edits the
// source. Anything it proves is a property of the shipped output.
//
// Usage: node swap-proof.mjs <baseUrl>
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(HERE, "final-site");
const base = (process.argv[2] || "http://127.0.0.1:8903").replace(/\/$/, "");

/* Two moves, chosen because they exercise the two different failure modes.
   - a home chapter has its own JS module and its own stylesheet, and lands on a
     page whose body has never contained a `ch-*` section;
   - a kit section has no module of its own and depends entirely on the shared
     kit behaviour, so it tests that the shared layer is really shared. */
const MOVES = [
  { from: "index.html", section: "standard", into: "privacy-policy-maclean.html", module: "ch-standard" },
  { from: "veneers.html", section: "cases", into: "privacy-policy-maclean.html", module: null },
];

function lift(html, id) {
  // Find `<section ... id="<id>" ...>` and its matching close, counting nesting.
  const open = new RegExp(`<section[^>]*\\bid="${id}"[^>]*>`);
  const m = open.exec(html);
  if (!m) throw new Error(`no <section id="${id}">`);
  let i = m.index + m[0].length, depth = 1;
  const tag = /<(\/?)section\b[^>]*>/g;
  tag.lastIndex = i;
  let t;
  while ((t = tag.exec(html))) {
    depth += t[1] ? -1 : 1;
    if (!depth) return html.slice(m.index, t.index + t[0].length);
  }
  throw new Error(`unterminated <section id="${id}">`);
}

const scratch = [];
for (const [n, mv] of MOVES.entries()) {
  const src = fs.readFileSync(path.join(SITE, mv.from), "utf8");
  const dst = fs.readFileSync(path.join(SITE, mv.into), "utf8");
  const markup = lift(src, mv.section);
  const at = dst.lastIndexOf("</main>");
  if (at === -1) throw new Error(`${mv.into} has no </main>`);
  const out = `_swap-proof-${n}.html`;
  fs.writeFileSync(path.join(SITE, out), dst.slice(0, at) + "\n" + markup + "\n" + dst.slice(at));
  scratch.push({ ...mv, out, bytes: markup.length });
}

/* ---------- drive it ---------- */
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9800 + Math.floor(Math.random() * 150);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-swap-"));
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
const evalJs = async (expr) => {
  const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true }, sessionId);
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text);
  return r.result.value;
};

const PROPS = ["display", "background-color", "color", "font-family", "font-size",
  "padding-top", "padding-bottom", "grid-template-columns", "letter-spacing", "text-transform"];

async function readSection(url, id) {
  await send("Page.navigate", { url }, sessionId);
  await wait(3000);
  await evalJs(`document.fonts && document.fonts.ready ? document.fonts.ready.then(()=>1) : 1`);
  await wait(400);
  return evalJs(`(function(){
    var root = document.getElementById(${JSON.stringify(id)});
    if (!root) return null;
    var props = ${JSON.stringify(PROPS)};
    var nodes = [root].concat([...root.querySelectorAll('*')].filter(function(e){
      return e.tagName !== 'SCRIPT' && e.tagName !== 'STYLE';
    }));
    return {
      count: nodes.length,
      styles: nodes.map(function(e){
        var cs = getComputedStyle(e), v = {};
        props.forEach(function(p){ v[p] = cs.getPropertyValue(p); });
        return [e.tagName.toLowerCase() + '.' + (e.classList[0] || ''), v];
      }),
      active: (window.WZ && WZ.active) ? WZ.active.slice() : null,
    };
  })()`);
}

const results = [];
const check = (name, pass, detail = "") => {
  results.push(pass);
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
};

for (const mv of scratch) {
  const home = await readSection(`${base}/${mv.from}`, mv.section);
  const away = await readSection(`${base}/${mv.out}`, mv.section);
  const label = `${mv.section} (${mv.from} -> ${mv.into})`;

  check(`${label}: section arrived intact`,
    !!away && away.count === home.count, away ? `${home.count} -> ${away.count} elements` : "not found");

  if (away && home && away.count === home.count) {
    let same = 0, diff = [];
    for (let i = 0; i < home.styles.length; i++) {
      const [ka, va] = home.styles[i], [kb, vb] = away.styles[i];
      for (const p of PROPS) {
        if (va[p] === vb[p]) same++;
        else diff.push(`${ka} ${p}: ${va[p]} -> ${vb[p]}`);
      }
      if (ka !== kb) diff.push(`identity ${ka} -> ${kb}`);
    }
    check(`${label}: renders identically on the new page`,
      diff.length === 0, diff.length ? diff.slice(0, 3).join(" | ") : `${same} computed values matched`);
  }

  if (mv.module) {
    check(`${label}: its JS module activated on the new page`,
      !!away && away.active && away.active.indexOf(mv.module) > -1,
      away && away.active ? away.active.join(",") : "-");

    /* The control. Without it, "the module is active" proves nothing — it would
       read the same if every module ran on every page. Load the destination
       WITHOUT the section and confirm the module stayed out. */
    await send("Page.navigate", { url: `${base}/${mv.into}` }, sessionId);
    await wait(2500);
    const untouched = await evalJs(`(window.WZ && WZ.active) ? WZ.active.join(',') : '-'`);
    check(`${label}: that module is inert on ${mv.into} without the section`,
      !untouched.split(",").includes(mv.module), untouched || "(none active)");
  }
}

for (const mv of scratch) fs.unlinkSync(path.join(SITE, mv.out));

const passed = results.filter(Boolean).length;
console.log(`\n${passed}/${results.length} checks passed`);
ws.close();
chrome.kill();
process.exit(passed === results.length ? 0 : 1);
