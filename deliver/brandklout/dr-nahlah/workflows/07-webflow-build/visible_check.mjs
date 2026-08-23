/* Restoring the reveal script means [data-rv] blocks are now animated. A from-tween
   that never fires leaves content at opacity 0, so check that no text-bearing
   element is invisible on the live pages, and compare the count against local. */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { spawn } from "node:child_process";

const LOCAL = "C:/Users/pc/orca/workspaces/Webzite Agentic Workflow/Dr-Nahlah/deliver/dr-nahlah/workflows/04-design/.tmp/final-site";
const PAGES = ["veneers", "about", "smile-gallery", "all-on-4", "contact"];
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9700 + Math.floor(Math.random() * 300);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-vis-"));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const chrome = spawn(CHROME, [
  "--headless=new", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files",
  `--remote-debugging-port=${PORT}`, "--remote-allow-origins=*",
  "--window-size=1440,900", "--no-first-run", "--no-default-browser-check",
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
const send = (method, params = {}, sid) => new Promise((res) => {
  const id = ++mid; pending.set(id, res);
  ws.send(JSON.stringify({ id, method, params, ...(sid ? { sessionId: sid } : {}) }));
});
const { result: { targetId } } = await send("Target.createTarget", { url: "about:blank" });
const { result: { sessionId } } = await send("Target.attachToTarget", { targetId, flatten: true });
await send("Page.enable", {}, sessionId);
await send("Runtime.enable", {}, sessionId);

const EXPR = `(() => {
  // Scroll the whole page so every ScrollTrigger has had its chance to fire.
  window.scrollTo(0, document.body.scrollHeight);
  return 'scrolled';
})()`;
const COUNT = `(() => {
  let hidden = 0, total = 0; const samples = [];
  for (const el of document.querySelectorAll('h1,h2,h3,p,li,a,span')) {
    const t = (el.textContent || '').trim();
    if (!t) continue;
    const r = el.getBoundingClientRect();
    if (!r.width && !r.height) continue;
    total++;
    const s = getComputedStyle(el);
    if (parseFloat(s.opacity) < 0.05 || s.visibility === 'hidden') {
      hidden++; if (samples.length < 4) samples.push(t.slice(0, 34));
    }
  }
  return JSON.stringify({ total, hidden, samples });
})()`;

const probe = async (url) => {
  await send("Page.navigate", { url }, sessionId);
  await wait(4000);
  await send("Runtime.evaluate", { expression: EXPR, returnByValue: true }, sessionId);
  await wait(2500);
  const r = await send("Runtime.evaluate", { expression: COUNT, returnByValue: true }, sessionId);
  const v = r.result?.result?.value;
  return typeof v === "string" ? JSON.parse(v) : { total: 0, hidden: -1, samples: [] };
};

for (const p of PAGES) {
  const L = await probe(`https://dr-nahlah.webflow.io/${p}`);
  const O = await probe(`file:///${LOCAL}/${p}.html`);
  const flag = L.hidden > O.hidden + 2 ? "   <-- MORE HIDDEN THAN LOCAL" : "";
  console.log(`${p.padEnd(16)} LIVE ${String(L.hidden).padStart(3)}/${String(L.total).padEnd(4)} hidden   LOCAL ${String(O.hidden).padStart(3)}/${String(O.total).padEnd(4)} hidden${flag}`);
  if (L.hidden) console.log(`                 live samples: ${JSON.stringify(L.samples)}`);
}
ws.close(); chrome.kill();
try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
