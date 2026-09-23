// Probe the no-prep-veneers "What are no prep veneers?" scroll-scrub.
// Unlike the earlier check, this measures whether the stage actually PINS
// (sticky) as well as whether the numbers scrub. Motion ENABLED.
// Usage: node behave-layers.mjs <fileUrl> [settleMs]
import { spawn } from "node:child_process";
import fs from "node:fs"; import os from "node:os"; import path from "node:path"; import http from "node:http";

const [, , fileUrl, settleArg] = process.argv;
const settle = Number(settleArg) || 14000;
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9700 + Math.floor(Math.random() * 200);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-"));
const chrome = spawn(CHROME, ["--headless=new", "--disable-gpu", "--hide-scrollbars",
  `--remote-debugging-port=${PORT}`, "--remote-allow-origins=*", "--force-device-scale-factor=1",
  "--window-size=1440,900", "--no-first-run", `--user-data-dir=${profile}`, "about:blank"]);

const wait = (ms) => new Promise(r => setTimeout(r, ms));
async function getJSON(p) {
  return new Promise((res, rej) => {
    http.get({ host: "127.0.0.1", port: PORT, path: p }, r => {
      let d = ""; r.on("data", c => d += c); r.on("end", () => res(JSON.parse(d)));
    }).on("error", rej);
  });
}
let wsUrl;
for (let i = 0; i < 40; i++) {
  try { const v = await getJSON("/json/version"); if (v.webSocketDebuggerUrl) { wsUrl = v.webSocketDebuggerUrl; break; } } catch {}
  await wait(200);
}
const ws = new WebSocket(wsUrl); let id = 0; const pending = new Map(); const errors = [];
ws.addEventListener("message", ev => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
  if (m.method === "Runtime.exceptionThrown")
    errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
});
await new Promise(r => ws.addEventListener("open", r, { once: true }));
const send = (method, params = {}, sessionId) => new Promise(res => {
  const mid = ++id; pending.set(mid, res); ws.send(JSON.stringify({ id: mid, method, params, sessionId }));
});
const { targetInfos } = await send("Target.getTargets");
const pt = targetInfos.find(t => t.type === "page");
const { sessionId } = await send("Target.attachToTarget", { targetId: pt.targetId, flatten: true });
await send("Page.enable", {}, sessionId);
await send("Runtime.enable", {}, sessionId);
await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "no-preference" }] }, sessionId);
await send("Page.navigate", { url: fileUrl }, sessionId);
await wait(settle);

const ev2 = async (expr) => {
  const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true }, sessionId);
  if (r?.exceptionDetails) return { __err: r.exceptionDetails.text };
  return r?.result?.value;
};

// geometry of the section
const geo = await ev2(`(() => {
  const s = document.querySelector('[data-vnr-layers]');
  const track = s.querySelector('[data-vnr-track]');
  const stage = s.querySelector('.vnr-lay__stage');
  const cs = getComputedStyle(s);
  return {
    sectionOverflow: cs.overflow,
    stagePosition: getComputedStyle(stage).position,
    stageHeight: getComputedStyle(stage).height,
    trackHeight: getComputedStyle(track).height,
    innerHeight: window.innerHeight,
    trackTopAbs: track.getBoundingClientRect().top + window.scrollY,
    isLive: s.classList.contains('is--live')
  };
})()`);
console.log("geometry:", JSON.stringify(geo));

const top = geo.trackTopAbs;
const trackH = parseFloat(geo.trackHeight);
const vh = geo.innerHeight;
const total = trackH - vh;

const rows = [];
for (const frac of [0, 0.15, 0.3, 0.5, 0.7, 0.85, 1.0]) {
  const y = Math.round(top + total * frac);
  await ev2(`window.scrollTo(0, ${y})`);
  await wait(420);
  const snap = await ev2(`(() => {
    const s = document.querySelector('[data-vnr-layers]');
    const stage = s.querySelector('.vnr-lay__stage');
    const track = s.querySelector('[data-vnr-track]');
    const q = (sel) => s.querySelector(sel);
    const basis = (fig, layer) => {
      const el = s.querySelector('[data-vnr-tooth="'+fig+'"] [data-vnr-layer="'+layer+'"]');
      return el ? el.style.flexBasis || '(unset)' : '(none)';
    };
    return {
      stageTop: Math.round(stage.getBoundingClientRect().top),
      trackTop: Math.round(track.getBoundingClientRect().top),
      rail: (q('[data-vnr-rail]')||{}).style ? q('[data-vnr-rail]').style.width : '(none)',
      tradP: basis('trad','porcelain'), tradE: basis('trad','enamel'),
      npP: basis('noprep','porcelain'), npE: basis('noprep','enamel'),
      caption: (q('[data-vnr-caption]')||{}).textContent?.slice(0,46)
    };
  })()`);
  rows.push({ frac, y, ...snap });
}
console.log("\nscrub (stageTop should stay ~0 while pinned):");
for (const r of rows) console.log(JSON.stringify(r));
console.log("\njsErrors:", JSON.stringify(errors));

ws.close(); chrome.kill();
try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
