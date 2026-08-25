// Slice a tall full-page screenshot into readable chunks so they can be viewed
// one at a time. The pre-takedown captures run to ~14,000px; nothing can read
// that in one go.
//
//   node slice.mjs <slug> [--w 1100] [--h 1500]
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const SHOTS = path.resolve(HERE, "../../01-content-intake/.tmp/site-screenshots/desktop");
const OUT = path.join(HERE, "slices");
fs.mkdirSync(OUT, { recursive: true });

const argv = process.argv.slice(2);
const slug = argv[0];
const num = (n, d) => { const i = argv.indexOf(n); return i === -1 ? d : Number(argv[i + 1]); };
const W = num("--w", 1100);
const H = num("--h", 1500);
const src = path.join(SHOTS, slug + ".png");
if (!fs.existsSync(src)) { console.error("no screenshot: " + src); process.exit(1); }

const PORT = 9600 + Math.floor(Math.random() * 150);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "mpd-slice-"));
const chrome = spawn(CHROME, [
  "--headless=new", "--disable-gpu", "--hide-scrollbars",
  `--remote-debugging-port=${PORT}`, "--remote-allow-origins=*",
  "--no-first-run", "--no-default-browser-check", "--allow-file-access-from-files",
  `--user-data-dir=${profile}`, "about:blank",
]);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const getJSON = (p) => new Promise((res, rej) => {
  http.get({ host: "127.0.0.1", port: PORT, path: p }, (r) => {
    let d = ""; r.on("data", (c) => (d += c)); r.on("end", () => res(JSON.parse(d)));
  }).on("error", rej);
});
let wsUrl;
for (let i = 0; i < 60 && !wsUrl; i++) {
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

const html = `<!doctype html><style>html,body{margin:0;background:#fff}img{display:block;width:${W}px}</style><img src="${pathToFileURL(src).href}">`;
const page = path.join(profile, "view.html");
fs.writeFileSync(page, html);
await send("Page.navigate", { url: pathToFileURL(page).href });
await wait(1500);
const dims = await send("Runtime.evaluate", {
  expression: "(()=>{const i=document.images[0];return {w:i.width,h:i.height,nw:i.naturalWidth,nh:i.naturalHeight}})()",
  returnByValue: true,
});
const { h: scaledH, nh, nw } = dims.result.value;
console.log(`${slug}: natural ${nw}x${nh} -> displayed ${W}x${scaledH}`);
const n = Math.ceil(scaledH / H);
await send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 1, mobile: false });
for (let i = 0; i < n; i++) {
  const y = i * H;
  const shot = await send("Page.captureScreenshot", {
    format: "png",
    clip: { x: 0, y, width: W, height: Math.min(H, scaledH - y), scale: 1 },
    captureBeyondViewport: true,
  });
  const f = path.join(OUT, `${slug}-${String(i + 1).padStart(2, "0")}.png`);
  fs.writeFileSync(f, Buffer.from(shot.data, "base64"));
  console.log("  " + path.basename(f));
}
ws.close(); chrome.kill();
try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
process.exit(0);
