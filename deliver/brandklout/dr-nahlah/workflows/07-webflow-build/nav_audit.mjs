/* Report EVERY nav link's rendered state, live vs local, so "looks current" can
   be pinned to a specific property. aria-current already matches local, so the
   cause has to be paint: the underline's scaleX or the link's colour. */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { spawn } from "node:child_process";

const LOCAL = "C:/Users/pc/orca/workspaces/Webzite Agentic Workflow/Dr-Nahlah/deliver/dr-nahlah/workflows/04-design/.tmp/final-site";
const PAGES = process.argv.slice(2).length ? process.argv.slice(2)
  : ["sedation-dentistry", "implant-cost", "veneers", "all-on-4", "dental-implants", "smile-makeover"];
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9700 + Math.floor(Math.random() * 300);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-nav-"));
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

const PROBE = `(() => {
  const out = [];
  for (const a of document.querySelectorAll('.nav-links a')) {
    // Live the underline is a real child div (converted pseudo); locally it is
    // an actual ::after. Reading only the child makes every local link report
    // "no transform" -> scaleX 1, which fakes a mismatch on the good build.
    const u = a.firstElementChild;
    const t = u ? getComputedStyle(u).transform
                : getComputedStyle(a, '::after').transform;
    const sx = (!t || t === 'none') ? 1 : parseFloat(t.slice(t.indexOf('(') + 1));
    out.push({
      label: a.textContent.trim().slice(0, 16),
      cur: a.hasAttribute('aria-current'),
      color: getComputedStyle(a).color,
      cls: u ? u.className : '(none)',
      sx: Number(sx.toFixed(2)),
      op: u ? getComputedStyle(u).opacity : '-',
    });
  }
  return JSON.stringify(out);
})()`;

const probe = async (url) => {
  await send("Page.navigate", { url }, sessionId);
  await wait(3800);
  const r = await send("Runtime.evaluate", { expression: PROBE, returnByValue: true }, sessionId);
  try { return JSON.parse(r.result?.result?.value); } catch { return null; }
};

for (const slug of PAGES) {
  const live = await probe(`https://dr-nahlah.webflow.io/${slug}`);
  const loc = await probe(`file:///${LOCAL}/${slug}.html`);
  console.log(`\n=== ${slug} ===`);
  console.log(`${"link".padEnd(17)}${"LIVE cur/sx/color".padEnd(40)}LOCAL cur/sx/color`);
  const n = Math.max(live?.length || 0, loc?.length || 0);
  for (let i = 0; i < n; i++) {
    const L = live?.[i], O = loc?.[i];
    const f = (x) => x ? `${x.cur ? "CUR" : "   "} sx=${String(x.sx).padEnd(4)} ${x.color.padEnd(18)}` : "(missing)".padEnd(28);
    const bad = L && O && (L.cur !== O.cur || L.sx !== O.sx || L.color !== O.color);
    console.log(`${(L?.label || O?.label || "?").padEnd(17)}${f(L).padEnd(40)}${f(O)}${bad ? "  <-- DIFF" : ""}`);
  }
  if (live) console.log("  live underline classes: " + live.map((x) => x.cls).join(" | "));
}
ws.close(); chrome.kill();
try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
