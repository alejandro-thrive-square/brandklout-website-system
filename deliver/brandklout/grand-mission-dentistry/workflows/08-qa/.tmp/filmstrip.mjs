// Slice a tall full-page screenshot into vertical strips laid left-to-right, so a
// 16000px-tall capture becomes a handful of readable images instead of one unreadable
// sliver. Pure image work: renders the PNG in headless Chrome and screenshots crops.
// Usage: node filmstrip.mjs <in.png> <outPrefix> [stripH=2000] [stripsPerSheet=4] [scale=1]
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";

const [, , IN, OUTP, sH = "2000", sPer = "4", sc = "1"] = process.argv;
const STRIP_H = +sH, PER = +sPer, SCALE = +sc;
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const PORT = 9600 + Math.floor(Math.random() * 90);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-strip-"));
const chrome = spawn(CHROME, [
  "--headless=new", "--hide-scrollbars", "--force-device-scale-factor=1",
  `--remote-debugging-port=${PORT}`, "--remote-allow-origins=*", "--no-first-run",
  "--allow-file-access-from-files",
  `--user-data-dir=${profile}`, "about:blank",
]);
const getJSON = (p) => new Promise((res, rej) => {
  http.get({ host: "127.0.0.1", port: PORT, path: p }, (r) => {
    let d = ""; r.on("data", (c) => (d += c)); r.on("end", () => res(JSON.parse(d)));
  }).on("error", rej);
});
let wsUrl = null;
for (let i = 0; i < 80 && !wsUrl; i++) { try { wsUrl = (await getJSON("/json/version")).webSocketDebuggerUrl; } catch {} if (!wsUrl) await wait(200); }
const ws = new WebSocket(wsUrl);
let id = 0; const pend = new Map();
ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } });
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
const send = (method, params = {}, sessionId) => new Promise((res, rej) => {
  const i = ++id; pend.set(i, (m) => (m.error ? rej(new Error(`${method}: ${m.error.message}`)) : res(m.result)));
  ws.send(JSON.stringify({ id: i, method, params, sessionId }));
});
const { targetInfos } = await send("Target.getTargets");
const t = targetInfos.find((x) => x.type === "page");
const { sessionId } = await send("Target.attachToTarget", { targetId: t.targetId, flatten: true });
await send("Page.enable", {}, sessionId);
await send("Runtime.enable", {}, sessionId);
const ev = (e) => send("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true }, sessionId).then((r) => r?.result?.value);

const abs = path.resolve(IN).replace(/\\/g, "/");
const url = "file:///" + abs;
// PNG header carries the natural size — no need to render the image to learn it.
const buf = fs.readFileSync(abs);
const dim = { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
const nStrips = Math.ceil(dim.h / STRIP_H);
const sheets = Math.ceil(nStrips / PER);
const tmpHtml = path.join(path.dirname(path.resolve(OUTP)), `.strip-${process.pid}.html`);

const html = (from, count) => `<!doctype html>
<style>html,body{margin:0;padding:0;background:#7a7a7a}
.row{display:flex;align-items:flex-start;gap:6px;padding:6px}
.s{width:${dim.w * SCALE}px;height:${STRIP_H * SCALE}px;overflow:hidden;position:relative;flex:0 0 auto;outline:1px solid #333;background:#fff}
.s img{position:absolute;left:0;width:${dim.w * SCALE}px;height:${dim.h * SCALE}px;max-width:none}
</style><div class="row">${Array.from({ length: count }, (_, k) =>
  `<div class="s"><img src="${url}" style="top:-${(from + k) * STRIP_H * SCALE}px"></div>`).join("")}</div>`;

for (let s = 0; s < sheets; s++) {
  const from = s * PER;
  const count = Math.min(PER, nStrips - from);
  const W = Math.ceil(count * (dim.w * SCALE + 8) + 8);
  const H = Math.ceil(STRIP_H * SCALE + 14);
  fs.writeFileSync(tmpHtml, html(from, count));
  await send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 1, mobile: false }, sessionId);
  await send("Page.navigate", { url: "file:///" + tmpHtml.replace(/\\/g, "/") + "?s=" + s }, sessionId);
  for (let i = 0; i < 100; i++) {
    const ok = await ev("document.readyState==='complete' && Array.from(document.images).every(i=>i.complete && i.naturalWidth>0)");
    if (ok) break;
    await wait(200);
  }
  await wait(400);
  const { data } = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true }, sessionId);
  const f = `${OUTP}-${s + 1}.png`;
  fs.writeFileSync(f, Buffer.from(data, "base64"));
  console.log(f, `${W}x${H}`, `strips ${from + 1}-${from + count}/${nStrips}`);
}
try { fs.rmSync(tmpHtml); } catch {}
ws.close(); chrome.kill();
try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
