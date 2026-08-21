/* Drive the before/after slider and measure whether anything actually moves.

   The slider works by writing --pos on .pk-ba; the after-image clips to
   inset(0 0 0 var(--pos)) and .ba-line sits at left:var(--pos). If the build
   resolved those var() references to static values the range still slides and
   the JS still runs — nothing visibly moves. Only measuring the clip and the
   line position before/after a value change can tell the difference. */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { spawn } from "node:child_process";

const LOCAL = "C:/Users/pc/orca/workspaces/Webzite Agentic Workflow/Dr-Nahlah/deliver/dr-nahlah/workflows/04-design/.tmp/final-site";
const PAGES = ["veneers", "all-on-4", "dental-implants", "smile-makeover", "smile-gallery"];
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9700 + Math.floor(Math.random() * 300);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-drag-"));
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
  const ba = document.querySelector('.pk-ba');
  if (!ba) return JSON.stringify({ err: 'no .pk-ba' });
  const range = ba.querySelector('input[type=range]');
  if (!range) return JSON.stringify({ err: 'no range input' });
  const aft  = [...ba.querySelectorAll('img')].find(i => /after|aft/.test(i.className)) || ba.querySelectorAll('img')[1];
  const line = [...ba.children].find(c => /ba-line/.test(c.className));
  const read = () => ({
    pos:  ba.style.getPropertyValue('--pos') || '(unset)',
    clip: aft  ? getComputedStyle(aft).clipPath  : '(no after img)',
    left: line ? getComputedStyle(line).left     : '(no ba-line)',
  });
  const before = read();
  range.value = 15;
  range.dispatchEvent(new Event('input', { bubbles: true }));
  const after = read();
  return JSON.stringify({
    imgs: ba.querySelectorAll('img').length,
    aftCls: aft ? aft.className : '-', lineCls: line ? line.className : '-',
    before, after,
    moved: before.clip !== after.clip || before.left !== after.left,
  });
})()`;

const probe = async (url) => {
  await send("Page.navigate", { url }, sessionId);
  await wait(4000);
  const r = await send("Runtime.evaluate", { expression: PROBE, returnByValue: true }, sessionId);
  try { return JSON.parse(r.result?.result?.value); } catch { return { err: "probe failed" }; }
};

for (const slug of PAGES) {
  const L = await probe(`https://dr-nahlah.webflow.io/${slug}`);
  const O = await probe(`file:///${LOCAL}/${slug}.html`);
  const fmt = (x) => x.err ? `ERR ${x.err}` :
    `moved=${x.moved}  clip:${String(x.before.clip).slice(0, 30)} -> ${String(x.after.clip).slice(0, 30)}  left:${x.before.left}->${x.after.left}`;
  console.log(`\n=== ${slug} ===`);
  console.log(`  LIVE  ${fmt(L)}`);
  console.log(`  LOCAL ${fmt(O)}`);
  if (!L.err) console.log(`  live classes: after-img="${L.aftCls}" line="${L.lineCls}" imgs=${L.imgs}`);
}
ws.close(); chrome.kill();
try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
