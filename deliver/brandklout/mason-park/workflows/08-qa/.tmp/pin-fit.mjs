// Do the pinned scenes still fit the viewport once the root grows above 1440?
//
// The fluid root makes every rem viewport-relative, so at 1920 the type and
// spacing inside a pinned chapter are 12.5% larger than at 1440, and at 2400
// they are 25% larger — while the scene itself is still exactly one viewport
// tall. Nothing else in the QA set asks this question: screens.mjs stops at
// 1920 and photographs pages with the pins removed.
//
// A pinned chapter is exactly 100svh by construction, so scrollHeight always
// equals clientHeight and proves nothing. Measure the real content instead:
// the top and bottom of every visible descendant against the scene's own box.
//
// Usage:  node pin-fit.mjs
// Source Asana task GID: 1217040406855582
import { spawn } from "node:child_process";
import fs from "node:fs"; import os from "node:os"; import path from "node:path"; import http from "node:http";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const D = path.resolve(here, "../../04-design/.tmp").split(path.sep).join("/");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
// See scrub-proof.mjs — MPD_BASE_URL retargets the suite at a deployed build.
const BASE = (process.env.MPD_BASE_URL || "").replace(/\/+$/, "");
const pageUrl = (page) =>
  BASE ? `${BASE}/${page}` : `file:///${D}/${page}/index.html`.replace(/ /g, "%20");

const PROBE = `(function(){
  var res = [];
  document.querySelectorAll('[class$="-pin"]').forEach(function(el){
    var box = el.getBoundingClientRect();
    var top = 1e9, bot = -1e9;
    el.querySelectorAll('*').forEach(function(c){
      var cs = getComputedStyle(c);
      if (cs.display === 'none' || cs.visibility === 'hidden' || cs.position === 'fixed') return;
      var r = c.getBoundingClientRect();
      if (r.height === 0 && r.width === 0) return;
      if (r.top < top) top = r.top;
      if (r.bottom > bot) bot = r.bottom;
    });
    res.push({
      sel: el.className.split(' ')[0],
      content: Math.round(bot - top),
      box: Math.round(box.height),
      over: Math.round(Math.max(box.top - top, bot - box.bottom)),
    });
  });
  return res;
})()`;

let port = 9960, bad = 0;
for (const [w, h] of [[1440, 900], [1920, 1080], [2400, 1350]]) {
  for (const page of ["invisalign", "new-patient-special", "thank-you"]) {
    const P = port++;
    const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-pin-"));
    const chrome = spawn(CHROME, [
      "--headless=new", "--use-gl=angle", "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader", "--hide-scrollbars",
      `--window-size=${w},${h}`, `--remote-debugging-port=${P}`,
      "--remote-allow-origins=*", "--force-device-scale-factor=1", "--no-first-run",
      `--user-data-dir=${profile}`, "about:blank",
    ]);
    const getJSON = (p) => new Promise((res, rej) => {
      http.get({ host: "127.0.0.1", port: P, path: p }, (r) => {
        let d = ""; r.on("data", (c) => (d += c)); r.on("end", () => res(JSON.parse(d)));
      }).on("error", rej);
    });
    let u = null;
    for (let i = 0; i < 80 && !u; i++) { try { u = (await getJSON("/json/version")).webSocketDebuggerUrl; } catch {} if (!u) await wait(200); }
    const ws = new WebSocket(u); let id = 0; const pend = new Map();
    ws.addEventListener("message", (e) => {
      const m = JSON.parse(e.data);
      if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result); pend.delete(m.id); }
    });
    await new Promise((r) => ws.addEventListener("open", r, { once: true }));
    const send = (m, p = {}, s) => new Promise((res) => {
      const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method: m, params: p, sessionId: s }));
    });
    const { targetInfos } = await send("Target.getTargets");
    const t = targetInfos.find((x) => x.type === "page");
    const { sessionId } = await send("Target.attachToTarget", { targetId: t.targetId, flatten: true });
    await send("Page.enable", {}, sessionId);
    await send("Runtime.enable", {}, sessionId);
    await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile: false }, sessionId);
    // Reduced motion removes the pins, so each scene renders as a plain 100svh
    // box holding its real content — which is exactly what needs measuring.
    await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] }, sessionId);
    await send("Page.navigate", { url: pageUrl(page) }, sessionId);
    await wait(3800);
    const ev = (e) => send("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true }, sessionId).then((r) => r?.result?.value);
    for (const r of await ev(PROBE)) {
      // Horizontal scenes park cards off-screen on purpose; only vertical spill counts.
      const over = r.over;
      if (over > 2) bad++;
      console.log(`  ${String(w).padStart(4)} ${page.padEnd(20)} ${r.sel.padEnd(12)} content ${String(r.content).padStart(5)} in ${String(r.box).padStart(5)} -> ${over > 2 ? `SPILLS ${over}px` : `fits (${r.box - r.content}px slack)`}`);
    }
    ws.close(); chrome.kill();
    await new Promise((r) => { if (chrome.exitCode !== null) return r(); chrome.once("exit", r); setTimeout(r, 2000); });
  }
}
console.log(bad ? `\n${bad} pinned scenes spill vertically` : "\nAll pinned scenes fit at 1440, 1920 and 2400.");
process.exit(bad ? 1 : 0);
