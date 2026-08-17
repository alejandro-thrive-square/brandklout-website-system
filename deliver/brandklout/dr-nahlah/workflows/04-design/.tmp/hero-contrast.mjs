// The site contrast audit scores text over imagery as "unscorable", and this
// hero puts ink type over a moving picture. So: screenshot the real composited
// page at six points in the clip, read the pixels back through Chrome, and take
// the worst-case contrast behind the headline, the lead and the meta row.
//
// Two traps this had to work around:
//  - GSAP writes inline visibility:visible on the reveal targets, so hiding the
//    copy column with visibility:hidden does nothing — use display:none.
//  - The dev server ignores Range requests, so the video reports seekable [0,0]
//    and every seek snaps back to 0. Sample it while it plays instead.
import { spawn } from "node:child_process";
import fs from "node:fs"; import os from "node:os"; import path from "node:path"; import http from "node:http";
const base = "http://127.0.0.1:8902";
const W = +(process.argv[2] || 1640), H = +(process.argv[3] || 934);
const PORT = 9530 + Math.floor(Math.random() * 60);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-hc-"));
const chrome = spawn("C:/Program Files/Google/Chrome/Application/chrome.exe", ["--headless=new", "--disable-gpu", "--hide-scrollbars", `--remote-debugging-port=${PORT}`, "--remote-allow-origins=*", "--force-device-scale-factor=1", `--window-size=${W},${H}`, "--no-first-run", "--no-default-browser-check", "--autoplay-policy=no-user-gesture-required", `--user-data-dir=${profile}`, "about:blank"]);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const getJSON = (p) => new Promise((res, rej) => { http.get({ host: "127.0.0.1", port: PORT, path: p }, (r) => { let d = ""; r.on("data", (c) => (d += c)); r.on("end", () => res(JSON.parse(d))); }).on("error", rej); });
let wsUrl; for (let i = 0; i < 150; i++) { try { const v = await getJSON("/json/version"); if (v.webSocketDebuggerUrl) { wsUrl = v.webSocketDebuggerUrl; break; } } catch {} await wait(300); }
const ws = new WebSocket(wsUrl); let id = 0; const pending = new Map();
ws.addEventListener("message", async (ev) => { const raw = typeof ev.data === "string" ? ev.data : await ev.data.text(); const m = JSON.parse(raw); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
const send = (m, p = {}, s) => new Promise((res, rej) => { const mid = ++id; pending.set(mid, (x) => (x.error ? rej(new Error(x.error.message)) : res(x.result))); ws.send(JSON.stringify({ id: mid, method: m, params: p, sessionId: s })); });
const { targetId } = await send("Target.createTarget", { url: "about:blank" });
const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
const S = (m, p) => send(m, p, sessionId);
await S("Page.enable"); await S("Runtime.enable");
await S("Page.navigate", { url: base + "/index.html" });
await wait(5000);
const ev = async (e) => { const r = await S("Runtime.evaluate", { expression: e, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description); return r.result.value; };

const rects = await ev(`(() => {
  const pick = sel => { const r = document.querySelector(sel).getBoundingClientRect();
    return { x: Math.max(0, Math.round(r.x)), y: Math.max(0, Math.round(r.y)),
             w: Math.round(r.width), h: Math.round(r.height) }; };
  const metas = [...document.querySelectorAll('.ch-arrival .meta div')].map(el => { const r = el.getBoundingClientRect();
    return { x: Math.max(0,Math.round(r.x)), y: Math.max(0,Math.round(r.y)), w: Math.round(r.width), h: Math.round(r.height) }; });
  return { h1: pick('#heroTitle'), lead: pick('#heroLead'), metas: metas };
})()`);

const worst = { h1: 99, lead: 99, meta: 99 };
for (let i = 0; i < 4; i++) {
  const v = await ev(`(async () => {
    const v = document.getElementById('heroFilm');
    document.querySelector('.ch-arrival .in').style.display = 'none';
    document.querySelector('.ch-arrival .cue').style.display = 'none';
    const p = v.play(); if (p && p.catch) p.catch(function(){});
    await new Promise(r => setTimeout(r, ${i === 0 ? 400 : 3600}));
    return { t: +v.currentTime.toFixed(1) };
  })()`);
  const shot = await S("Page.captureScreenshot", { format: "png" });
  const res = await ev(`(async (b64) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0);
    const lum = (r, g, b) => { const f = v => { v /= 255; return v <= .03928 ? v/12.92 : Math.pow((v+.055)/1.055, 2.4); };
      return .2126*f(r) + .7152*f(g) + .0722*f(b); };
    const ratio = (a, b) => (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
    const inkL = lum(20,20,22), bodyL = lum(58,58,64);
    const worstIn = (r, textL) => {
      // Clamp: getImageData past the canvas edge returns transparent black,
      // which reads as a 1.86:1 failure that is not on the page at all.
      const w = Math.min(r.w, c.width - r.x), h = Math.min(r.h, c.height - r.y);
      if (w <= 0 || h <= 0) return 99;
      const d = ctx.getImageData(r.x, r.y, w, h).data;
      let min = 99;
      for (let i = 0; i < d.length; i += 4 * 5) {
        const cr = ratio(lum(d[i], d[i+1], d[i+2]), textL);
        if (cr < min) min = cr;
      }
      return +min.toFixed(2);
    };
    const R = ${JSON.stringify(rects)};
    return { h1: worstIn(R.h1, inkL), lead: worstIn(R.lead, bodyL),
             meta: Math.min.apply(null, R.metas.map(function(m){ return worstIn(m, bodyL); })) };
  })(${JSON.stringify(shot.data)})`);
  for (const k of Object.keys(worst)) worst[k] = Math.min(worst[k], res[k]);
  console.log(`t=${String(v.t).padStart(4)}s   headline ${String(res.h1).padStart(5)}:1   lead ${String(res.lead).padStart(5)}:1   meta ${String(res.meta).padStart(5)}:1`);
}
console.log(`\nWORST across the clip @${W}x${H}`);
console.log(`  headline ${worst.h1}:1  (large text, needs 3.0)`);
console.log(`  lead     ${worst.lead}:1  (needs 4.5)`);
console.log(`  meta     ${worst.meta}:1  (small caps, needs 4.5)`);
console.log(worst.h1 >= 3 && worst.lead >= 4.5 && worst.meta >= 4.5 ? "PASS" : "FAIL");
await send("Target.closeTarget", { targetId }); chrome.kill();
try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
process.exit(0);
