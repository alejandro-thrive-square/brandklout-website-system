/* Verify the current-page nav underline actually paints, on every live page.

   A static grep would only prove the selector text changed. What matters is the
   computed transform on the element the browser really matched, so this reads
   scaleX off getComputedStyle after load — and reports the element's real class
   name, which is where the fork shows up. */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { spawn } from "node:child_process";

const PAGES = [
  "", "about", "patient-stories", "contact", "sedation-dentistry",
  "implant-cost", "smile-makeover", "veneers", "all-on-4",
  "dental-implants", "smile-gallery",
];
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9700 + Math.floor(Math.random() * 300);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-ul-"));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const chrome = spawn(CHROME, [
  "--headless=new", "--disable-gpu", "--hide-scrollbars",
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
  const cur = document.querySelector('.nav-links a[aria-current="page"]');
  if (!cur) return 'NO CURRENT LINK';
  const el = cur.firstElementChild;
  if (!el) return 'NO UNDERLINE CHILD';
  const t = getComputedStyle(el).transform;
  const sx = t === 'none' ? 1 : parseFloat(t.slice(t.indexOf('(') + 1));
  return JSON.stringify({ cls: el.className, sx: Number(sx.toFixed(3)), label: cur.textContent.trim() });
})()`;

let pass = 0;
for (const slug of PAGES) {
  const url = "https://dr-nahlah.webflow.io/" + slug;
  await send("Page.navigate", { url }, sessionId);
  await wait(4500);
  const r = await send("Runtime.evaluate", {
    expression: PROBE, returnByValue: true, awaitPromise: true,
  }, sessionId);
  const v = r.result?.result?.value ?? "ERR";
  let out;
  try {
    const o = JSON.parse(v);
    const ok = o.sx > 0.99;
    if (ok) pass++;
    out = `${ok ? "PASS" : "FAIL"}  scaleX=${o.sx}  class=${o.cls}  link=${o.label}`;
  } catch { out = `FAIL  ${v}`; }
  console.log(`${(slug || "(home)").padEnd(20)} ${out}`);
}
console.log(`\n${pass}/${PAGES.length} pages show the current-page underline`);
ws.close(); chrome.kill();
try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
process.exit(pass === PAGES.length ? 0 : 1);
