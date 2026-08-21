/**
 * diagnose.mjs — load the LIVE staging page and report what is actually broken.
 * Usage: node diagnose.mjs <url> [outdir]
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { spawn } from "node:child_process";

const URL_ = process.argv[2];
const OUT = process.argv[3] || ".";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9700 + Math.floor(Math.random() * 300);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-diag-"));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const chrome = spawn(CHROME, [
  "--headless=new", "--disable-gpu", "--hide-scrollbars",
  `--remote-debugging-port=${PORT}`, "--remote-allow-origins=*",
  "--force-device-scale-factor=1", "--window-size=1440,900",
  "--no-first-run", "--no-default-browser-check",
  `--user-data-dir=${profile}`, "about:blank",
]);
const getJSON = (p) => new Promise((res, rej) => {
  http.get({ host: "127.0.0.1", port: PORT, path: p }, (r) => {
    let d = ""; r.on("data", (c) => (d += c)); r.on("end", () => res(JSON.parse(d)));
  }).on("error", rej);
});
let wsUrl;
for (let i = 0; i < 150 && !wsUrl; i++) {
  try { wsUrl = (await getJSON("/json/version")).webSocketDebuggerUrl; } catch {}
  if (!wsUrl) await wait(300);
}
const ws = new WebSocket(wsUrl);
let mid = 0; const pending = new Map();
const logs = [];
ws.addEventListener("message", async (ev) => {
  const raw = typeof ev.data === "string" ? ev.data : await ev.data.text();
  const m = JSON.parse(raw);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  else if (m.method === "Runtime.exceptionThrown") {
    logs.push("EXCEPTION: " + (m.params?.exceptionDetails?.exception?.description
      || m.params?.exceptionDetails?.text || "?").split("\n")[0]);
  } else if (m.method === "Runtime.consoleAPICalled" &&
             ["error", "warning"].includes(m.params.type)) {
    logs.push(m.params.type.toUpperCase() + ": " +
      m.params.args.map((a) => a.description || a.value).join(" ").split("\n")[0]);
  }
});
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
const send = (method, params = {}, sessionId) => new Promise((res, rej) => {
  const i = ++mid;
  const t = setTimeout(() => rej(new Error("timeout " + method)), 60000);
  pending.set(i, (m) => { clearTimeout(t); m.error ? rej(new Error(m.error.message)) : res(m.result); });
  ws.send(JSON.stringify({ id: i, method, params, sessionId }));
});

const { targetInfos } = await send("Target.getTargets");
let pt = targetInfos.find((t) => t.type === "page")
  || { targetId: (await send("Target.createTarget", { url: "about:blank" })).targetId };
const { sessionId } = await send("Target.attachToTarget", { targetId: pt.targetId, flatten: true });
await send("Runtime.enable", {}, sessionId);
await send("Page.enable", {}, sessionId);
await send("Page.navigate", { url: URL_ }, sessionId);
await wait(9000);

const ev = async (fn) => {
  const r = await send("Runtime.evaluate", {
    expression: `(${fn.toString()})()`, returnByValue: true, awaitPromise: true,
  }, sessionId);
  if (r.exceptionDetails) return { __err: r.exceptionDetails.text };
  return r.result.value;
};

const report = await ev(() => {
  const vis = (el) => {
    const s = getComputedStyle(el), r = el.getBoundingClientRect();
    return { display: s.display, visibility: s.visibility, opacity: s.opacity,
             w: Math.round(r.width), h: Math.round(r.height) };
  };
  const secs = [...document.querySelectorAll("section[data-chapter]")].map((s) => ({
    id: s.id, ...vis(s),
  }));
  const hero = document.getElementById("heroTitle");
  return {
    libs: { WZ: typeof window.WZ, gsap: typeof window.gsap,
            ScrollTrigger: typeof window.ScrollTrigger,
            ScrollSmoother: typeof window.ScrollSmoother,
            SplitText: typeof window.SplitText,
            wzOk: window.WZ ? window.WZ.ok : null,
            smoother: window.WZ ? !!window.WZ.smoother : null },
    htmlClass: document.documentElement.className,
    bodyH: document.body.scrollHeight,
    docH: document.documentElement.scrollHeight,
    viewportW: innerWidth,
    horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1
      ? document.documentElement.scrollWidth : false,
    hero: hero ? { text: hero.textContent.trim().slice(0, 60), ...vis(hero) } : "MISSING",
    heroHidden: [...document.querySelectorAll('[data-anim="hide"]')]
      .map((e) => ({ tag: e.tagName, cls: e.className, v: getComputedStyle(e).visibility })),
    sections: secs,
    sectionsZeroHeight: secs.filter((s) => s.h < 50).map((s) => s.id),
    embeds: document.querySelectorAll(".w-embed").length,
    imgsBroken: [...document.images].filter((i) => i.complete && !i.naturalWidth).length,
    imgsTotal: document.images.length,
    smoothWrapper: document.getElementById("smooth-wrapper") ? vis(document.getElementById("smooth-wrapper")) : "MISSING",
    smoothContent: document.getElementById("smooth-content") ? vis(document.getElementById("smooth-content")) : "MISSING",
  };
});

console.log(JSON.stringify(report, null, 2));
console.log("\n--- CONSOLE (" + logs.length + ") ---");
for (const l of [...new Set(logs)].slice(0, 25)) console.log("  " + l);

// full-page screenshot
try {
  const { contentSize } = await send("Page.getLayoutMetrics", {}, sessionId);
  const h = Math.min(Math.round(contentSize.height), 30000);
  await send("Emulation.setDeviceMetricsOverride",
    { width: 1440, height: h, deviceScaleFactor: 1, mobile: false }, sessionId);
  await wait(1500);
  const shot = await send("Page.captureScreenshot",
    { format: "png", captureBeyondViewport: true }, sessionId);
  fs.writeFileSync(path.join(OUT, "live-full.png"), Buffer.from(shot.data, "base64"));
  console.log("\nscreenshot -> live-full.png  (page height " + h + "px)");
} catch (e) { console.log("screenshot failed: " + e.message); }

try { chrome.kill(); } catch {}
process.exit(0);
