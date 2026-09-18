/**
 * Viewport-sized captures for eyeballing, next to the full-page ones from
 * compare.mjs. Matching heights prove the layout survived; these prove it looks
 * like the same page.
 *
 *   node hero-shot.mjs <slug> [--vw 1440] [--y 0]
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, "compare");
const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
fs.mkdirSync(OUT, { recursive: true });

const argv = process.argv.slice(2);
const num = (n, d) => { const i = argv.indexOf(n); return i === -1 ? d : Number(argv[i + 1]); };
const VW = num("--vw", 1440);
const Y = num("--y", 0);
const PORT = num("--port", 4320);
const slug = argv.find((a) => !a.startsWith("--") && !/^\d+$/.test(a));
if (!slug) throw new Error("usage: node hero-shot.mjs <slug>");

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const gj = (p, port) => new Promise((res, rej) => http.get({ host: "127.0.0.1", port, path: p }, (r) => {
  let d = ""; r.on("data", (c) => (d += c)); r.on("end", () => res(JSON.parse(d)));
}).on("error", rej));

const port = 9900 + Math.floor(Math.random() * 90);
const proc = spawn(CHROME, [
  "--headless=new", "--disable-gpu", `--remote-debugging-port=${port}`,
  "--remote-allow-origins=*", "--no-first-run", "--hide-scrollbars",
  `--user-data-dir=${path.join(os.tmpdir(), "hero" + Date.now())}`, "about:blank",
], { stdio: "ignore" });

let ws;
for (let i = 0; i < 150 && !ws; i++) {
  try { ws = (await gj("/json/version", port)).webSocketDebuggerUrl; } catch { await wait(200); }
}
const sock = new WebSocket(ws);
const pend = new Map();
let id = 0;
sock.addEventListener("message", async (e) => {
  const m = JSON.parse(typeof e.data === "string" ? e.data : await e.data.text());
  if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); }
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
await S("Page.enable");

const URLS = argv.includes("--live")
  ? [["live", `https://www.masonparkdental.com/${slug}`], ["ref", `https://mason-park-dental.webflow.io/${slug}`]]
  : [["new", `http://localhost:${PORT}/${slug}`], ["ref", `https://mason-park-dental.webflow.io/${slug}`]];
for (const [label, url] of URLS) {
  await S("Emulation.setDeviceMetricsOverride", { width: VW, height: 900, deviceScaleFactor: 1, mobile: VW < 500 });
  await S("Page.navigate", { url });
  await wait(9000); // the GHL form paints several seconds after load
  await S("Runtime.evaluate", { expression: `window.scrollTo(0,${Y})` });
  await wait(900);
  const shot = await S("Page.captureScreenshot", { format: "png" });
  const file = path.join(OUT, `hero-${slug}-${VW}-${Y}-${label}.png`);
  fs.writeFileSync(file, Buffer.from(shot.data, "base64"));
  console.log(`${label}: ${file} (${(fs.statSync(file).size / 1024).toFixed(0)} KB)`);
}

sock.close();
proc.kill();
