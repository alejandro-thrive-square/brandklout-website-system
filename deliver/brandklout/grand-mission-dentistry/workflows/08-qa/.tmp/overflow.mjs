// overflow.mjs — find content that runs off the side of a phone viewport.
//
// `document.scrollWidth <= window.innerWidth` is a VACUOUS test on this site: the site head
// sets `body { overflow-x: clip }`, so scrollWidth can never exceed the viewport no matter how
// far content overflows. Real overflow has to be found by walking box geometry against
// `documentElement.clientWidth` — and each box must be intersected with its own overflow-x
// ancestors, or a deliberately clipped decoration (the consultation pages' watermark rail runs
// to ~5,600px inside an overflow:hidden section) is re-reported as a defect.
//
// Mobile emulation also reports window.innerWidth ABOVE the layout viewport when the page
// zooms out to fit, so innerWidth is never the yardstick here.
//
// Usage: node overflow.mjs <width> <slug...>
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = "https://grandmissiondentistry.webflow.io/ads-landing-pages";
const WIDTH = +(process.argv[2] || 390);
const SLUGS = process.argv.slice(3);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const PROBE = `(() => {
  const vw = document.documentElement.clientWidth;
  const clipped = (el) => {
    // the narrowest overflow-x:hidden|clip ancestor decides what is actually visible
    let n = el.parentElement, box = null;
    while (n) {
      const cs = getComputedStyle(n);
      if (cs.overflowX === 'hidden' || cs.overflowX === 'clip') {
        const r = n.getBoundingClientRect();
        box = box ? { l: Math.max(box.l, r.left), r: Math.min(box.r, r.right) } : { l: r.left, r: r.right };
      }
      n = n.parentElement;
    }
    return box;
  };
  const out = [];
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const c = clipped(el);
    const right = c ? Math.min(r.right, c.r) : r.right;
    const left = c ? Math.max(r.left, c.l) : r.left;
    if (right > vw + 1 || left < -1) {
      out.push({ tag: el.tagName.toLowerCase(), cls: (el.className || '').slice(0, 60),
        left: Math.round(left), right: Math.round(right), w: Math.round(r.width) });
    }
  }
  // widest visible content, the number that must equal the viewport
  const widest = out.reduce((m, o) => Math.max(m, o.right), vw);
  return { vw, innerWidth: window.innerWidth, widest, offenders: out.slice(0, 12), count: out.length };
})()`;

const PORT = 9960 + Math.floor(Math.random() * 30);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-of-"));
const ch = spawn(CHROME, ["--headless=new", "--hide-scrollbars", "--force-prefers-reduced-motion",
  "--window-size=520,900", "--no-first-run", `--remote-debugging-port=${PORT}`,
  "--remote-allow-origins=*", `--user-data-dir=${profile}`, "about:blank"]);
const gj = (p) => new Promise((res, rej) => http.get({ host: "127.0.0.1", port: PORT, path: p }, (r) => {
  let d = ""; r.on("data", (c) => (d += c)); r.on("end", () => res(JSON.parse(d)));
}).on("error", rej));
let ws = null;
for (let i = 0; i < 80 && !ws; i++) { try { ws = (await gj("/json/version")).webSocketDebuggerUrl; } catch {} if (!ws) await wait(200); }
const sock = new WebSocket(ws);
let id = 0; const pend = new Map();
sock.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } });
await new Promise((r) => sock.addEventListener("open", r, { once: true }));
const send = (m, q = {}, sid) => new Promise((res, rej) => {
  const i = ++id; pend.set(i, (x) => (x.error ? rej(new Error(m + ": " + x.error.message)) : res(x.result)));
  sock.send(JSON.stringify({ id: i, method: m, params: q, sessionId: sid }));
});
const { targetInfos } = await send("Target.getTargets");
const t = targetInfos.find((x) => x.type === "page");
const { sessionId } = await send("Target.attachToTarget", { targetId: t.targetId, flatten: true });
await send("Page.enable", {}, sessionId); await send("Runtime.enable", {}, sessionId);
const ev = (e) => send("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true }, sessionId).then((r) => r?.result?.value);

for (const slug of SLUGS) {
  // Chrome floors the WINDOW near 500px on Windows; only the emulation override gives a true
  // 390 layout viewport, and without it the phone layout is never actually tested.
  await send("Emulation.setDeviceMetricsOverride", { width: WIDTH, height: 844, deviceScaleFactor: 1, mobile: true }, sessionId);
  await send("Page.navigate", { url: `${BASE}/${slug}?o=${Math.floor(Math.random() * 1e6)}` }, sessionId);
  for (let k = 0; k < 300; k++) { if (await ev("document.readyState==='complete'")) break; await wait(100); }
  await wait(1200);
  // sentinel: an unstyled load yields plausible geometry that means nothing
  const pos = await ev("getComputedStyle(document.querySelector('.lp_header_bar, .section_lp_header, header, .header') || document.body).position");
  const r = await ev(PROBE);
  const ok = r.widest <= r.vw + 1;
  console.log(`${slug.padEnd(34)} vw=${r.vw} innerWidth=${r.innerWidth} widest=${r.widest} ${ok ? "OK" : "OVERFLOW x" + r.count}`);
  if (!ok) for (const o of r.offenders) console.log(`    ${o.tag}.${o.cls} left=${o.left} right=${o.right} w=${o.w}`);
  await wait(1500);
}
sock.close(); ch.kill();
try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
