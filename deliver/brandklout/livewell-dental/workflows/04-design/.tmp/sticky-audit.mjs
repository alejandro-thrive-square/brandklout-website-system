// Static audit: find every position:sticky element and report any ancestor that
// creates a scroll container (overflow not visible/clip), which silently kills
// sticky. Also reports horizontal document overflow.
// Usage: node sticky-audit.mjs <fileUrl> [settleMs]
import { spawn } from "node:child_process";
import fs from "node:fs"; import os from "node:os"; import path from "node:path"; import http from "node:http";

const [, , fileUrl, settleArg] = process.argv;
const settle = Number(settleArg) || 14000;
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9600 + Math.floor(Math.random() * 90);
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
const ws = new WebSocket(wsUrl); let id = 0; const pending = new Map();
ws.addEventListener("message", ev => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
});
await new Promise(r => ws.addEventListener("open", r, { once: true }));
const send = (method, params = {}, sessionId) => new Promise(res => {
  const mid = ++id; pending.set(mid, res); ws.send(JSON.stringify({ id: mid, method, params, sessionId }));
});
const { targetInfos } = await send("Target.getTargets");
const pt = targetInfos.find(t => t.type === "page");
const { sessionId } = await send("Target.attachToTarget", { targetId: pt.targetId, flatten: true });
await send("Page.enable", {}, sessionId);
await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "no-preference" }] }, sessionId);
await send("Page.navigate", { url: fileUrl }, sessionId);
await wait(settle);

const r = await send("Runtime.evaluate", {
  expression: `(() => {
    const out = [];
    document.querySelectorAll('*').forEach(el => {
      if (getComputedStyle(el).position !== 'sticky') return;
      const label = el.tagName.toLowerCase() + (el.className && typeof el.className === 'string'
        ? '.' + el.className.trim().split(/\\s+/).join('.') : '');
      const blockers = [];
      let p = el.parentElement;
      while (p && p !== document.documentElement) {
        const cs = getComputedStyle(p);
        const ov = [cs.overflow, cs.overflowX, cs.overflowY];
        // 'clip' does NOT create a scroll container, so it is safe for sticky
        if (ov.some(v => v && v !== 'visible' && v !== 'clip')) {
          blockers.push((p.className && typeof p.className === 'string'
            ? '.' + p.className.trim().split(/\\s+/)[0] : p.tagName.toLowerCase())
            + ' {overflow:' + cs.overflow + '}');
        }
        p = p.parentElement;
      }
      out.push({ sticky: label.slice(0, 60), blockers });
    });
    return {
      stickies: out,
      docScrollWidth: document.documentElement.scrollWidth,
      windowWidth: window.innerWidth,
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth
    };
  })()`, returnByValue: true
}, sessionId);

const d = r.result.value;
console.log("sticky elements:", d.stickies.length);
for (const s of d.stickies) {
  console.log(`  ${s.blockers.length ? "BROKEN " : "ok     "} ${s.sticky}`);
  for (const b of s.blockers) console.log(`            blocked by ${b}`);
}
console.log(`horizontal overflow: ${d.horizontalOverflow} (scrollWidth ${d.docScrollWidth} vs window ${d.windowWidth})`);

ws.close(); chrome.kill();
try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
