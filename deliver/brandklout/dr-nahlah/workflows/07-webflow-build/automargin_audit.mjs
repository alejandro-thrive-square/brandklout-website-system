/* Which auto-margin rules survived the conversion, and which were dropped?

   The source centres blocks with `margin-inline:auto`. Webflow's style panel
   stores a numeric margin, so `auto` can be lost — and a block with a max-width
   narrower than its parent then sits hard left instead of centred. That is the
   Home CTA symptom.

   Rather than guess, evaluate the SOURCE selector on BOTH builds: the design's
   own class names (.cta, .ch-proof .film, .wrap) mostly survive the paste, so
   the same selector addresses the same element on each side. Any element that
   computes a centring margin locally and 0 live is a real, visible defect. */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { spawn } from "node:child_process";

const LOCAL = "C:/Users/pc/orca/workspaces/Webzite Agentic Workflow/Dr-Nahlah/deliver/dr-nahlah/workflows/04-design/.tmp/final-site";
const PAGES = ["index", "about", "patient-stories", "contact", "sedation-dentistry",
  "implant-cost", "smile-makeover", "veneers", "all-on-4", "dental-implants", "smile-gallery"];
const slugOf = (p) => (p === "index" ? "" : p);

// Pull "selector { ... margin*: auto ... }" out of each page's inline CSS.
const rulesFor = (page) => {
  const h = fs.readFileSync(`${LOCAL}/${page}.html`, "utf8");
  const out = [];
  for (const m of h.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
    const body = m[2];
    if (!/margin[^;]*:\s*[^;]*\bauto\b/.test(body)) continue;
    const sel = m[1].split("\n").pop().trim();
    if (!sel || sel.startsWith("@") || sel.includes("<") || sel.length > 70) continue;
    if (!/^[.#a-zA-Z][\w .#>:\-\[\]="']*$/.test(sel)) continue;
    const decl = (body.match(/margin[^;]*:\s*[^;]*\bauto\b[^;]*/) || [""])[0].trim();
    out.push({ sel, decl });
  }
  return out;
};

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9700 + Math.floor(Math.random() * 300);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-am-"));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const chrome = spawn(CHROME, [
  "--headless=new", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files",
  `--remote-debugging-port=${PORT}`, "--remote-allow-origins=*",
  "--force-device-scale-factor=1", "--window-size=1440,900",
  "--no-first-run", "--no-default-browser-check", `--user-data-dir=${profile}`, "about:blank",
]);
const getJSON = (p) => new Promise((res, rej) => {
  http.get({ host: "127.0.0.1", port: PORT, path: p }, (r) => {
    let d = ""; r.on("data", (c) => (d += c)); r.on("end", () => res(JSON.parse(d)));
  }).on("error", rej);
});
let wsUrl;
for (let i = 0; i < 150 && !wsUrl; i++) {
  try { wsUrl = (await getJSON("/json/version")).webSocketDebuggerUrl; } catch {}
  if (!wsUrl) await wait(300);
}
const ws = new WebSocket(wsUrl);
let mid = 0; const pending = new Map();
ws.addEventListener("message", async (ev) => {
  const raw = typeof ev.data === "string" ? ev.data : await ev.data.text();
  const m = JSON.parse(raw);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
});
await new Promise((r) => ws.addEventListener("open", r));
const send = (method, params = {}, sessionId) => new Promise((res) => {
  const id = ++mid; pending.set(id, res);
  ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
});
const { result: { targetId } } = await send("Target.createTarget", { url: "about:blank" });
const { result: { sessionId } } = await send("Target.attachToTarget", { targetId, flatten: true });
await send("Page.enable", {}, sessionId);
await send("Runtime.enable", {}, sessionId);
await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] }, sessionId);

const measure = async (url, sels) => {
  await send("Page.navigate", { url }, sessionId);
  await wait(4200);
  const expr = `(() => {
    const sels = ${JSON.stringify(sels)};
    const out = {};
    for (const s of sels) {
      let els = []; try { els = [...document.querySelectorAll(s)]; } catch (e) { continue; }
      out[s] = els.slice(0, 3).map(el => {
        const c = getComputedStyle(el), b = el.getBoundingClientRect();
        const p = el.parentElement ? el.parentElement.getBoundingClientRect() : b;
        return { ml: Math.round(parseFloat(c.marginLeft) || 0), mr: Math.round(parseFloat(c.marginRight) || 0),
                 w: Math.round(b.width), pw: Math.round(p.width), x: Math.round(b.x - p.x) };
      });
    }
    return JSON.stringify(out);
  })()`;
  const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true }, sessionId);
  const v = r.result?.result?.value;
  return typeof v === "string" ? JSON.parse(v) : {};
};

const broken = [];
for (const page of PAGES) {
  const rules = rulesFor(page);
  const sels = [...new Set(rules.map((r) => r.sel))];
  if (!sels.length) continue;
  const live = await measure(`https://dr-nahlah.webflow.io/${slugOf(page)}`, sels);
  const loc = await measure(`file:///${LOCAL}/${page}.html`, sels);
  for (const s of sels) {
    const L = live[s] || [], O = loc[s] || [];
    for (let i = 0; i < Math.min(L.length, O.length); i++) {
      const a = L[i], b = O[i];
      // Locally centred (real side margin, narrower than parent) but flush live.
      const centredLocal = b.ml >= 6 && b.mr >= 6;
      const flushLive = a.ml <= 1 && a.mr <= 1;
      if (centredLocal && flushLive && Math.abs(a.x - b.x) >= 6) {
        broken.push({ page, sel: s, i, shift: b.x - a.x, localM: `${b.ml}/${b.mr}`, w: `${a.w} vs ${b.w}` });
      }
    }
  }
  process.stdout.write(`${page} `);
}
console.log("\n");
if (!broken.length) console.log("no dropped auto-margins detected");
const bySel = new Map();
for (const b of broken) {
  if (!bySel.has(b.sel)) bySel.set(b.sel, []);
  bySel.get(b.sel).push(b);
}
console.log(`DROPPED auto-margins: ${broken.length} element(s) across ${bySel.size} selector(s)\n`);
for (const [sel, list] of [...bySel].sort((a, b) => b[1].length - a[1].length)) {
  console.log(`  ${sel.padEnd(28)} ${String(list.length).padStart(2)} el   pages: ${[...new Set(list.map((x) => x.page))].join(", ")}`);
  console.log(`      shifted left by ~${Math.max(...list.map((x) => x.shift))}px (local margins ${list[0].localM})`);
}
ws.close(); chrome.kill();
try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
