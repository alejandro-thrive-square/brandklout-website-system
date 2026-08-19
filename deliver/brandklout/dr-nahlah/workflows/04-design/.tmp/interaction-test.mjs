// Functional check of the home page's interactive behaviour via CDP.
// Verifies the things a screenshot cannot: preloader release, reveal classes,
// counter completion, compare-slider drag + tab swap, and the mobile drawer.
//
// Usage: node interaction-test.mjs <url>
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";

const url = process.argv[2] || "http://127.0.0.1:8899/index.html";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9600 + Math.floor(Math.random() * 300);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-test-"));

const chrome = spawn(CHROME, [
  "--headless=new", "--disable-gpu", "--hide-scrollbars",
  `--remote-debugging-port=${PORT}`, "--remote-allow-origins=*",
  "--force-device-scale-factor=1", "--window-size=1440,900",
  "--no-first-run", "--no-default-browser-check",
  "--autoplay-policy=no-user-gesture-required",
  `--user-data-dir=${profile}`, "about:blank",
]);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function getJSON(p) {
  return new Promise((res, rej) => {
    http.get({ host: "127.0.0.1", port: PORT, path: p }, (r) => {
      let d = ""; r.on("data", (c) => (d += c)); r.on("end", () => res(JSON.parse(d)));
    }).on("error", rej);
  });
}
async function findWs() {
  for (let i = 0; i < 150; i++) {
    try { const v = await getJSON("/json/version"); if (v.webSocketDebuggerUrl) return v.webSocketDebuggerUrl; } catch {}
    await wait(300);
  }
  throw new Error("CDP did not start");
}

const ws = new WebSocket(await findWs());
let id = 0; const pending = new Map();
ws.addEventListener("message", async (ev) => {
  const raw = typeof ev.data === "string" ? ev.data : await ev.data.text();
  const m = JSON.parse(raw);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
});
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
function send(method, params = {}, sessionId) {
  return new Promise((res, rej) => {
    const mid = ++id;
    const t = setTimeout(() => rej(new Error("timeout " + method)), 30000);
    pending.set(mid, (m) => { clearTimeout(t); m.error ? rej(new Error(m.error.message)) : res(m.result); });
    ws.send(JSON.stringify({ id: mid, method, params, sessionId }));
  });
}

const { targetInfos } = await send("Target.getTargets");
let pt = targetInfos.find((t) => t.type === "page");
if (!pt) pt = { targetId: (await send("Target.createTarget", { url: "about:blank" })).targetId };
const { sessionId } = await send("Target.attachToTarget", { targetId: pt.targetId, flatten: true });
await send("Page.enable", {}, sessionId);
await send("Runtime.enable", {}, sessionId);

const evalJs = async (expr) => {
  const r = await send("Runtime.evaluate",
    { expression: expr, returnByValue: true, awaitPromise: true }, sessionId);
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + " :: " + expr.slice(0, 80));
  return r.result.value;
};

const results = [];
const check = (name, pass, detail = "") => {
  results.push({ name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
};

// ---- desktop ----
await send("Emulation.setDeviceMetricsOverride",
  { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId);
await send("Page.navigate", { url }, sessionId);
await wait(5200); // preloader has a 3.2s hard ceiling

check("fonts loaded (Playfair Display)",
  await evalJs(`document.fonts.check("16px 'Playfair Display'")`));
check("fonts loaded (Raleway)",
  await evalJs(`document.fonts.check("16px 'Raleway'")`));
check("preloader released",
  await evalJs(`!document.getElementById('pre')`));
check("body scroll unlocked",
  await evalJs(`!document.body.classList.contains('is-locked')`));
check("hero headline masks revealed",
  await evalJs(`[...document.querySelectorAll('#heroTitle .mask')].every(m=>m.classList.contains('in'))`));
check("hero portrait loaded",
  await evalJs(`(function(){var i=document.getElementById('heroPortrait');return i.complete&&i.naturalWidth>0})()`),
  await evalJs(`document.getElementById('heroPortrait').naturalWidth+'px wide'`));
check("ticker duplicated for seamless loop",
  await evalJs(`document.getElementById('ticker').children.length===2`));

// counters
await evalJs(`document.querySelector('.stats').scrollIntoView({block:'center'})`);
await wait(2600);
const counters = await evalJs(`[...document.querySelectorAll('[data-count]')].map(e=>e.textContent)`);
check("stat counters ran to final values",
  counters.join("|") === "25+|10,000+|4.9|2", counters.join(" · "));

// statement word brighten
await evalJs(`document.getElementById('stmt').scrollIntoView({block:'center'})`);
await wait(900);
const lit = await evalJs(`document.querySelectorAll('#stmt .w.on').length`);
const totalW = await evalJs(`document.querySelectorAll('#stmt .w').length`);
check("statement words brighten on scroll", lit > 0, `${lit}/${totalW} lit`);

// compare slider — keyboard
await evalJs(`document.getElementById('cmp').scrollIntoView({block:'center'})`);
await wait(600);
const posBefore = await evalJs(`getComputedStyle(document.getElementById('cmp')).getPropertyValue('--pos').trim()`);
await evalJs(`document.getElementById('cmp').focus()`);
for (let i = 0; i < 5; i++) {
  await send("Input.dispatchKeyEvent",
    { type: "keyDown", key: "ArrowRight", code: "ArrowRight", windowsVirtualKeyCode: 39 }, sessionId);
  await send("Input.dispatchKeyEvent",
    { type: "keyUp", key: "ArrowRight", code: "ArrowRight", windowsVirtualKeyCode: 39 }, sessionId);
}
await wait(300);
const posAfter = await evalJs(`getComputedStyle(document.getElementById('cmp')).getPropertyValue('--pos').trim()`);
check("compare slider responds to keyboard", posBefore !== posAfter, `${posBefore} -> ${posAfter}`);
check("compare slider exposes aria-valuenow",
  !!(await evalJs(`document.getElementById('cmp').getAttribute('aria-valuenow')`)));

// compare slider — pointer drag
const box = await evalJs(`(function(){var r=document.getElementById('cmp').getBoundingClientRect();
  return JSON.stringify({x:r.left+r.width*0.5,y:r.top+r.height*0.5,tx:r.left+r.width*0.22})})()`);
const b = JSON.parse(box);
await send("Input.dispatchMouseEvent", { type: "mousePressed", x: b.x, y: b.y, button: "left", clickCount: 1 }, sessionId);
await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: b.tx, y: b.y, button: "left" }, sessionId);
await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: b.tx, y: b.y, button: "left", clickCount: 1 }, sessionId);
await wait(300);
const posDrag = await evalJs(`getComputedStyle(document.getElementById('cmp')).getPropertyValue('--pos').trim()`);
check("compare slider responds to drag", parseFloat(posDrag) < 35, `-> ${posDrag}`);

// case tabs
await evalJs(`document.querySelectorAll('.compare-tabs button')[1].click()`);
await wait(800);
const src2 = await evalJs(`document.getElementById('cmpBefore').getAttribute('src')`);
const cap2 = await evalJs(`document.getElementById('cmpCaption').textContent`);
check("case tab swaps imagery", src2.includes("case2"), src2);
check("case tab swaps caption", cap2.toLowerCase().includes("all-on-4"), cap2.slice(0, 46));
check("swapped case image actually loads",
  await evalJs(`(function(){var i=document.getElementById('cmpBefore');return i.complete&&i.naturalWidth>0})()`));

// video
await evalJs(`document.getElementById('film').scrollIntoView({block:'center'})`);
await wait(1600);
check("b-roll video has data and is playing",
  await evalJs(`(function(){var v=document.getElementById('film');return v.readyState>=2 && !v.paused})()`),
  await evalJs(`'readyState='+document.getElementById('film').readyState`));

// Walk the whole page so every IntersectionObserver target actually enters the
// viewport, then assert that all of them revealed.
const docH = await evalJs(`Math.max(document.body.scrollHeight,document.documentElement.scrollHeight)`);
for (let y = 0; y <= docH; y += 700) {
  await evalJs(`window.scrollTo(0,${y})`);
  await wait(130);
}
await wait(1400);
const revealed = await evalJs(`document.querySelectorAll('[data-rise].in').length`);
const totalRise = await evalJs(`document.querySelectorAll('[data-rise]').length`);
check("every reveal fires after a full scroll", revealed === totalRise, `${revealed}/${totalRise}`);
const maskTotal = await evalJs(`document.querySelectorAll('.mask').length`);
const maskIn = await evalJs(`document.querySelectorAll('.mask.in').length`);
check("every masked heading fires", maskIn === maskTotal, `${maskIn}/${maskTotal}`);

// no console errors / no broken images
const broken = await evalJs(`[...document.images].filter(i=>!i.complete||i.naturalWidth===0).map(i=>i.getAttribute('src')).join(', ')`);
check("no broken images", broken === "", broken || "all loaded");

// horizontal overflow at desktop
check("no horizontal overflow @1440",
  await evalJs(`document.documentElement.scrollWidth <= window.innerWidth + 1`),
  await evalJs(`'scrollWidth='+document.documentElement.scrollWidth`));

// ---- mobile ----
await send("Emulation.setDeviceMetricsOverride",
  { width: 390, height: 844, deviceScaleFactor: 1, mobile: true }, sessionId);
await send("Page.navigate", { url }, sessionId);
await wait(5200);

check("no horizontal overflow @390",
  await evalJs(`document.documentElement.scrollWidth <= window.innerWidth + 1`),
  await evalJs(`'scrollWidth='+document.documentElement.scrollWidth+' vs '+window.innerWidth`));
check("burger visible on mobile",
  await evalJs(`getComputedStyle(document.getElementById('burger')).display !== 'none'`));
check("desktop nav hidden on mobile",
  await evalJs(`getComputedStyle(document.querySelector('.nav-links')).display === 'none'`));

await evalJs(`document.getElementById('burger').click()`);
await wait(900);
check("drawer opens",
  await evalJs(`document.getElementById('drawer').classList.contains('open')`));
check("drawer sets aria-expanded",
  await evalJs(`document.getElementById('burger').getAttribute('aria-expanded')==='true'`));
check("drawer links visible",
  await evalJs(`(function(){var a=document.querySelector('#drawer li a');var r=a.getBoundingClientRect();
    return r.width>0 && r.top>=0 && r.top<window.innerHeight})()`));
await evalJs(`document.querySelector('#drawer li a').click()`);
await wait(700);
check("drawer closes on link tap",
  await evalJs(`!document.getElementById('drawer').classList.contains('open')`));
check("body unlocked after drawer close",
  await evalJs(`!document.body.classList.contains('is-locked')`));

const cmpW = await evalJs(`(function(){var r=document.getElementById('cmp').getBoundingClientRect();
  return Math.round(r.width)+'x'+Math.round(r.height)})()`);
check("compare slider sized on mobile", !cmpW.startsWith("0"), cmpW);

// ---- reduced motion ----
await send("Emulation.setDeviceMetricsOverride",
  { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId);
await send("Emulation.setEmulatedMedia",
  { features: [{ name: "prefers-reduced-motion", value: "reduce" }] }, sessionId);
await send("Page.navigate", { url }, sessionId);
await wait(2600);
check("reduced motion: preloader skipped",
  await evalJs(`!document.getElementById('pre')`));
check("reduced motion: content visible without scroll",
  await evalJs(`getComputedStyle(document.querySelector('.hero [data-rise]')).opacity === '1'`));

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
if (failed.length) console.log("FAILED: " + failed.map((f) => f.name).join(" | "));
fs.writeFileSync("interaction-test-results.json", JSON.stringify(results, null, 2));

ws.close(); chrome.kill();
process.exit(failed.length ? 1 : 0);
