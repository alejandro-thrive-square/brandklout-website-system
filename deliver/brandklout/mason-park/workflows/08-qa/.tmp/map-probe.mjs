// Why does #mapFrame never un-crop on staging when the pin it shares a timeline
// with works? Reads the tween itself, not just the computed style.
//   node map-probe.mjs [url]
// Source Asana task GID: 1217040406855582
import { spawn } from "node:child_process";
import fs from "node:fs"; import os from "node:os"; import path from "node:path"; import http from "node:http";

const URL_ = process.argv[2] || "https://mason-park-dental.webflow.io/thank-you";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const PORT = 9871;
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-map-"));
const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`, "--window-size=1440,900", "--no-first-run", URL_],
  { stdio: "ignore" });

const getJSON = (p) => new Promise((res, rej) => {
  const t = setTimeout(() => rej(new Error("timeout")), 4000);
  http.get({ host: "127.0.0.1", port: PORT, path: p }, (r) => {
    let b = ""; r.on("data", (d) => (b += d));
    r.on("end", () => { clearTimeout(t); try { res(JSON.parse(b)); } catch (e) { rej(e); } });
  }).on("error", (e) => { clearTimeout(t); rej(e); });
});

let ws, id = 0; const pending = new Map();
for (let i = 0; i < 40; i++) {
  try {
    const tabs = await getJSON("/json/list");
    const tab = tabs.find((t) => t.type === "page" && t.webSocketDebuggerUrl);
    if (tab) { ws = new WebSocket(tab.webSocketDebuggerUrl); break; }
  } catch {}
  await wait(300);
}
await new Promise((r) => (ws.onopen = r));
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
};
const send = (method, params) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const evaluate = async (expr) => {
  const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
  return r.result?.result?.value;
};

await wait(6000);

console.log("--- ScrollTrigger instances on #findPin ---");
console.log(JSON.stringify(await evaluate(`(function(){
  if (!window.ScrollTrigger) return 'no ScrollTrigger';
  return ScrollTrigger.getAll().filter(function(s){
    return s.trigger && s.trigger.id === 'findPin';
  }).map(function(s){
    var an = s.animation;
    return { start: Math.round(s.start), end: Math.round(s.end), pin: !!s.pin,
             scrub: !!s.scrub, hasAnimation: !!an,
             children: an && an.getChildren ? an.getChildren().length : 0,
             targets: an && an.getChildren ? an.getChildren().map(function(c){
               return (c.targets()||[]).map(function(t){ return t.id || t.className || t.tagName; }).join(',');
             }) : [] };
  });
})()`), null, 1));

console.log("\n--- tweens targeting #mapFrame anywhere ---");
console.log(JSON.stringify(await evaluate(`(function(){
  var el = document.getElementById('mapFrame');
  if (!el) return 'no #mapFrame';
  if (!window.gsap) return 'no gsap';
  return gsap.getTweensOf(el).map(function(t){
    return { dur: t.duration(), paused: t.paused(), progress: +t.progress().toFixed(3),
             vars: Object.keys(t.vars).join(',') };
  });
})()`), null, 1));

console.log("\n--- clip-path across the pin ---");
const info = await evaluate(`(function(){
  var s = ScrollTrigger.getAll().filter(function(x){ return x.trigger && x.trigger.id==='findPin' && x.pin; })[0];
  return s ? { start: Math.round(s.start), end: Math.round(s.end) } : null;
})()`);
console.log("pin range:", JSON.stringify(info));
if (info) {
  for (const f of [0, 0.25, 0.5, 0.75, 1]) {
    const y = Math.round(info.start + (info.end - info.start) * f);
    await evaluate(`window.scrollTo(0, ${y})`);
    await wait(900);
    const s = await evaluate(`(function(){
      var el = document.getElementById('mapFrame');
      return { inline: el.style.clipPath || '(none)', computed: getComputedStyle(el).clipPath,
               h: Math.round(el.getBoundingClientRect().height) };
    })()`);
    console.log(`  ${String(f * 100).padStart(3)}%  y=${y}  inline=${s.inline}  computed=${s.computed}  h=${s.h}`);
  }
}

console.log("\n--- every pinned trigger on this page (scrub + progress) ---");
console.log(JSON.stringify(await evaluate(`(function(){
  return ScrollTrigger.getAll().filter(function(s){return s.pin;}).map(function(s){
    return { id: s.trigger && s.trigger.id, scrub: s.scrub, vscrub: s.vars && s.vars.scrub,
             progress: +s.progress.toFixed(3),
             animProgress: s.animation ? +s.animation.progress().toFixed(3) : null };
  });
})()`), null, 1));

console.log("\n--- force the timeline by hand: can the property animate at all? ---");
console.log(JSON.stringify(await evaluate(`(function(){
  var el = document.getElementById('mapFrame');
  var tw = gsap.getTweensOf(el)[0];
  if (!tw) return 'no tween';
  var tl = tw.parent;
  var out = [];
  [0, 0.5, 1].forEach(function(p){
    if (tl && tl.progress) tl.progress(p); else tw.progress(p);
    out.push({ p: p, inline: el.style.clipPath || '(none)', computed: getComputedStyle(el).clipPath });
  });
  return out;
})()`), null, 1));

ws.close(); chrome.kill();
process.exit(0);
