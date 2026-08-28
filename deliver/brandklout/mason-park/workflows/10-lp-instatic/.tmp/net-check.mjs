/**
 * List every non-200 request a real browser makes on a published page.
 *
 *   node net-check.mjs <slug>
 *
 * Needed because Cloudflare 403s a plain HTTP client (urllib/curl without a
 * browser UA), so a scripted URL sweep reports every asset as broken even when
 * the page is perfect. Only a real browser session gives a truthful answer.
 */
import { spawn } from "node:child_process";
import http from "node:http";
import os from "node:os";
import path from "node:path";

const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const slug = process.argv[2] ?? "invisalign";
const URL_ = `https://www.masonparkdental.com/${slug}`;

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const gj = (p, port) => new Promise((res, rej) => http.get({ host: "127.0.0.1", port, path: p }, (r) => {
  let d = ""; r.on("data", (c) => (d += c)); r.on("end", () => res(JSON.parse(d)));
}).on("error", rej));

const port = 9300 + Math.floor(Math.random() * 90);
const proc = spawn(CHROME, [
  "--headless=new", "--disable-gpu", `--remote-debugging-port=${port}`,
  "--remote-allow-origins=*", "--no-first-run",
  `--user-data-dir=${path.join(os.tmpdir(), "net" + Date.now())}`, "about:blank",
], { stdio: "ignore" });

let ws;
for (let i = 0; i < 150 && !ws; i++) {
  try { ws = (await gj("/json/version", port)).webSocketDebuggerUrl; } catch { await wait(200); }
}
const sock = new WebSocket(ws);
const pend = new Map();
let id = 0;
const responses = [];
const failures = [];
sock.addEventListener("message", async (e) => {
  const m = JSON.parse(typeof e.data === "string" ? e.data : await e.data.text());
  if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); return; }
  if (m.method === "Network.responseReceived") {
    responses.push([m.params.response.status, m.params.response.url]);
  }
  if (m.method === "Network.loadingFailed") {
    failures.push([m.params.blockedReason ?? m.params.errorText, m.params.type]);
  }
});
await new Promise((r) => sock.addEventListener("open", r, { once: true }));
const send = (me, p = {}, sid) => new Promise((res, rej) => {
  const i = ++id;
  pend.set(i, (m) => (m.error ? rej(new Error(m.error.message)) : res(m.result)));
  sock.send(JSON.stringify({ id: i, method: me, params: p, sessionId: sid }));
});
const tg = (await gj("/json/list", port)).find((t) => t.type === "page");
const { sessionId } = await send("Target.attachToTarget", { targetId: tg.id, flatten: true });
const S = (m, p = {}) => send(m, p, sessionId);
await S("Page.enable"); await S("Network.enable");
await S("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
await S("Page.navigate", { url: URL_ });
await wait(4000);
await S("Runtime.evaluate", { expression: "window.scrollTo(0,document.body.scrollHeight)" });
await wait(2500);

console.log(`${URL_}`);
console.log(`${responses.length} responses`);
const bad = responses.filter(([s]) => s !== 200 && s !== 204 && s !== 304);
console.log(`\nnon-200 (${bad.length}):`);
for (const [s, u] of bad) console.log(`  ${s}  ${u.slice(0, 120)}`);
console.log(`\nblocked/failed (${failures.length}):`);
for (const [why, type] of failures) console.log(`  ${type}: ${why}`);

sock.close();
proc.kill();
