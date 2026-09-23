/* Rank every link/button on a page by how differently its label sits inside its
   box, live vs local. "Misalignment on the text" is exactly an inset asymmetry,
   so the offender should sort to the top. Usage: node skew.mjs [slug] */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { spawn } from "node:child_process";

const LOCAL = "C:/Users/pc/orca/workspaces/Webzite Agentic Workflow/Dr-Nahlah/deliver/dr-nahlah/workflows/04-design/.tmp/final-site";
const SLUG = process.argv[2] || "home";
const liveUrl = `https://dr-nahlah.webflow.io/${SLUG === "home" ? "" : SLUG}`;
const locUrl = `file:///${LOCAL}/${SLUG === "home" ? "index" : SLUG}.html`;
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9700 + Math.floor(Math.random() * 300);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-skew-"));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const chrome = spawn(CHROME, [
  "--headless=new", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files",
  `--remote-debugging-port=${PORT}`, "--remote-allow-origins=*",
  "--force-device-scale-factor=1", "--window-size=1440,900",
  "--no-first-run", "--no-default-browser-check",
  `--user-data-dir=${profile}`, "about:blank",
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
// Reveals never fire headlessly (no real scroll), so dark chapters stay hidden and
// unmeasurable. Reduced motion makes [data-anim=hide] visible without moving layout.
await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] }, sessionId);

const PROBE = `(() => {
  const out = [];
  for (const b of document.querySelectorAll('a, button, [class*=cta], [class*=btn]')) {
    const t = (b.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 30);
    if (!t) continue;
    const br = b.getBoundingClientRect();
    if (!br.width || !br.height) continue;
    // Union the rects of real TEXT nodes only. A converted pseudo-element is a
    // real child div live (btn-after, creds-more-after) but a ::after locally,
    // so any range over element contents measures a different thing on each
    // side and manufactures a skew that is not on screen.
    const w = document.createTreeWalker(b, NodeFilter.SHOW_TEXT);
    let tr = null, n;
    while ((n = w.nextNode())) {
      if (!n.textContent.trim()) continue;
      const rr = document.createRange(); rr.selectNodeContents(n);
      const q = rr.getBoundingClientRect();
      if (!q.width && !q.height) continue;
      tr = tr ? {
        top: Math.min(tr.top, q.top), bottom: Math.max(tr.bottom, q.bottom),
        left: Math.min(tr.left, q.left), right: Math.max(tr.right, q.right),
      } : { top: q.top, bottom: q.bottom, left: q.left, right: q.right };
    }
    if (!tr) continue;
    const s = getComputedStyle(b);
    out.push({
      t, cls: b.className.slice(0, 46),
      top: +(tr.top - br.top).toFixed(1), bot: +(br.bottom - tr.bottom).toFixed(1),
      left: +(tr.left - br.left).toFixed(1), right: +(br.right - tr.right).toFixed(1),
      h: Math.round(br.height), w: Math.round(br.width),
      disp: s.display, ai: s.alignItems, jc: s.justifyContent, ta: s.textAlign,
      pad: [s.paddingTop, s.paddingRight, s.paddingBottom, s.paddingLeft].join('/'),
    });
  }
  return JSON.stringify(out);
})()`;

const probe = async (url) => {
  await send("Page.navigate", { url }, sessionId);
  await wait(4500);
  const r = await send("Runtime.evaluate", { expression: PROBE, returnByValue: true }, sessionId);
  const v = r.result?.result?.value;
  if (typeof v !== "string") { console.log("probe failed:", JSON.stringify(r.result).slice(0, 200)); return []; }
  return JSON.parse(v);
};

const live = await probe(liveUrl);
const loc = await probe(locUrl);
console.log(`${SLUG}: live=${live.length} local=${loc.length} link/button elements`);
// Key on label + occurrence index. Several labels ("Smile Gallery", the phone
// numbers) appear in both the footer and the drawer, and keying on text alone
// silently compares the footer copy against the drawer copy — which reports a
// 400px "skew" that is really just two different elements.
const seen = new Map();
const lm = new Map();
for (const o of loc) {
  const n = (seen.get(o.t) || 0) + 1; seen.set(o.t, n);
  lm.set(o.t + "#" + n, o);
}
const seenL = new Map();
const rows = [];
for (const L of live) {
  const n = (seenL.get(L.t) || 0) + 1; seenL.set(L.t, n);
  const O = lm.get(L.t + "#" + n);
  if (!O) continue;
  // vertical and horizontal centring skew, relative to local
  const dv = Math.abs((L.top - L.bot) - (O.top - O.bot));
  const dh = Math.abs((L.left - L.right) - (O.left - O.right));
  rows.push({ L, O, skew: +Math.max(dv, dh).toFixed(1) });
}
rows.sort((a, b) => b.skew - a.skew);
console.log(`compared ${rows.length} by label\n`);
for (const { L, O, skew } of rows.slice(0, 8)) {
  if (skew < 1) break;
  console.log(`"${L.t}"  [${L.cls}]  skew=${skew}px`);
  console.log(`   LIVE  t/b=${L.top}/${L.bot} l/r=${L.left}/${L.right}  ${L.w}x${L.h}  ${L.disp}/${L.ai}/${L.jc}/${L.ta}  pad=${L.pad}`);
  console.log(`   LOCAL t/b=${O.top}/${O.bot} l/r=${O.left}/${O.right}  ${O.w}x${O.h}  ${O.disp}/${O.ai}/${O.jc}/${O.ta}  pad=${O.pad}`);
}
if (!rows.length || rows[0].skew < 1) console.log("no link/button shows >=1px alignment skew vs local");
ws.close(); chrome.kill();
try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
