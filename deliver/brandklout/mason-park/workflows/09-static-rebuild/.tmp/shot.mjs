// Serve dist/ and capture the rebuilt pages, sliced into readable chunks.
//
//   node shot.mjs /            [--w 1000] [--h 1400] [--vw 1440]
//   node shot.mjs /services/invisalign/ /contacts/
//   node shot.mjs --mobile /            (375px viewport)
//
// Output: shots/<name>-NN.png
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(HERE, "dist");
const OUT = path.join(HERE, "shots");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
fs.mkdirSync(OUT, { recursive: true });

const argv = process.argv.slice(2);
const num = (n, d) => { const i = argv.indexOf(n); return i === -1 ? d : Number(argv[i + 1]); };
const MOBILE = argv.includes("--mobile");
// LAYOUT captures need the motion layer OFF. The capture pass scrolls the whole
// document to wake lazy images, which leaves every scrubbed timeline at whatever
// state its scrub lag settled on, so a scroll-driven page photographs mid-tween:
// the hero came out at 15% opacity because its departure scrub had run. Emulating
// prefers-reduced-motion puts the page in the state the reduced-motion guard
// defines, which is the finished layout with no motion. Use it for layout and
// responsive review; motion is verified by driving the page, never by a capture.
const STILL = argv.includes("--still");
// STICKY AND FIXED ELEMENTS ARE NOT WHERE captureBeyondViewport SAYS THEY ARE.
// The homepage's header floats over the hero and is `position: sticky`. In a
// full-page capture it paints at a translated offset and leaves a band of the
// page background under it, which reads exactly like a broken negative margin:
// a 74px white gap between the utility bar and the hero photograph at 1920.
// Measuring it said `heroRect.y === navRect.y === 38`, i.e. no gap at all.
// `--viewport` scrolls one viewport at a time and takes ordinary screenshots,
// which is the only way to photograph a sticky header truthfully. Slower, and
// the header repeats once per slice by definition, so it is for checking the
// chrome rather than for reading a whole page.
const VIEWPORT = argv.includes("--viewport");
const VW = num("--vw", MOBILE ? 390 : 1440);
const SLICE_W = num("--w", MOBILE ? 480 : 1000);
const SLICE_H = num("--h", 1400);
// Routes may be given with or without a leading slash. Git Bash on Windows
// rewrites a leading-slash argument into a Windows path, so the bare form
// (`node shot.mjs services/invisalign`) is the one that always works. `.` is home.
const BOOL_FLAGS = new Set(["--mobile", "--still", "--viewport"]);
const VALUE_FLAGS = new Set(["--w", "--h", "--vw"]);
const routes = argv
  .filter((a, i) => !BOOL_FLAGS.has(a) && !VALUE_FLAGS.has(a) && !VALUE_FLAGS.has(argv[i - 1]))
  .map((a) => {
    if (a === "." || a === "home") return "/";
    let r = a.replace(/^[A-Za-z]:[\\/].*?[\\/](?=[^\\/]*$)/, "");  // undo MSYS mangling
    r = "/" + r.replace(/^\/+/, "").replace(/\\/g, "/");
    return r.endsWith("/") ? r : r + "/";
  });
if (!routes.length) routes.push("/");

// ------------------------------------------------------------- static server
const MIME = {
  ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript",
  ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml",
  ".gif": "image/gif", ".ico": "image/x-icon", ".xml": "application/xml", ".txt": "text/plain",
};
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  let file = path.join(DIST, p);
  if (p.endsWith("/")) file = path.join(file, "index.html");
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    const alt = path.join(DIST, p, "index.html");
    file = fs.existsSync(alt) ? alt : path.join(DIST, "404.html");
    if (!fs.existsSync(file)) { res.writeHead(404).end("not found"); return; }
  }
  res.writeHead(200, { "content-type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const BASE = "http://127.0.0.1:" + server.address().port;
console.log("serving dist/ at " + BASE);

// ---------------------------------------------------------------- CDP setup
const PORT = 9300 + Math.floor(Math.random() * 90);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "mpd-shot2-"));
const chrome = spawn(CHROME, [
  "--headless=new", "--disable-gpu", "--hide-scrollbars",
  `--remote-debugging-port=${PORT}`, "--remote-allow-origins=*",
  "--no-first-run", "--no-default-browser-check", "--force-device-scale-factor=1",
  `--user-data-dir=${profile}`, "about:blank",
]);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const getJSON = (p) => new Promise((res, rej) => {
  http.get({ host: "127.0.0.1", port: PORT, path: p }, (r) => {
    let d = ""; r.on("data", (c) => (d += c)); r.on("end", () => res(JSON.parse(d)));
  }).on("error", rej);
});
let wsUrl;
for (let i = 0; i < 80 && !wsUrl; i++) {
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
await send("Log.enable");
await send("Emulation.setDeviceMetricsOverride", { width: VW, height: 900, deviceScaleFactor: 1, mobile: MOBILE });
if (STILL) await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
const evaluate = async (expr) => (await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true }))?.result?.value;

for (const route of routes) {
  const name = (route === "/" ? "home" : route.replace(/^\/|\/$/g, "").replace(/\//g, "-")) + (MOBILE ? "-m" : "");
  await send("Page.navigate", { url: BASE + route });
  await wait(900);
  // Fonts, lazy images and the deferred map all need a scroll pass first.
  // A full-page capture never scrolls, so lazy images and the deferred map have
  // to be woken by hand; then wait for every image to actually decode, or the
  // capture (and the broken-image check below) races the network.
  await evaluate(`(async()=>{
    document.querySelectorAll('iframe[data-src]').forEach(f=>{f.src=f.getAttribute('data-src');});
    document.querySelectorAll('img[loading="lazy"]').forEach(i=>i.loading='eager');
    const H=document.documentElement.scrollHeight;
    for(let y=0;y<H;y+=400){scrollTo(0,y);await new Promise(r=>setTimeout(r,16));}
    scrollTo(0,0);
    if(document.fonts&&document.fonts.ready)await document.fonts.ready;
    await Promise.all([...document.images].map(i=>i.decode().catch(()=>null)));
    await new Promise(r=>setTimeout(r,400));
  })()`);
  const h = await evaluate("document.documentElement.scrollHeight");
  const broken = await evaluate("[...document.images].filter(i=>!i.complete||i.naturalWidth===0).map(i=>i.currentSrc||i.src)");
  if (broken?.length) console.log(`  ! ${route}: ${broken.length} broken image(s): ` + broken.slice(0, 5).join(", "));
  console.log(`${route} -> ${VW}x${h}`);

  if (VIEWPORT) {
    const VH = 900;
    const steps = Math.ceil(h / VH);
    for (let i = 0; i < steps; i++) {
      await evaluate(`scrollTo(0, ${i * VH})`);
      await wait(320);
      const shot = await send("Page.captureScreenshot", { format: "png" });
      fs.writeFileSync(path.join(OUT, `${name}-v${String(i + 1).padStart(2, "0")}.png`), Buffer.from(shot.data, "base64"));
    }
    console.log(`  ${steps} viewport slice(s) -> shots/${name}-v*.png`);
    continue;
  }

  const scale = SLICE_W / VW;
  const scaledH = Math.round(h * scale);
  const n = Math.ceil(scaledH / SLICE_H);
  for (let i = 0; i < n; i++) {
    const yTop = Math.round((i * SLICE_H) / scale);
    const clipH = Math.min(Math.round(SLICE_H / scale), h - yTop);
    const shot = await send("Page.captureScreenshot", {
      format: "png",
      clip: { x: 0, y: yTop, width: VW, height: clipH, scale },
      captureBeyondViewport: true,
    });
    fs.writeFileSync(path.join(OUT, `${name}-${String(i + 1).padStart(2, "0")}.png`), Buffer.from(shot.data, "base64"));
  }
  console.log(`  ${n} slice(s) -> shots/${name}-*.png`);
}

ws.close(); chrome.kill(); server.close();
try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
process.exit(0);
