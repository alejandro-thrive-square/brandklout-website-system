/**
 * Screenshot the rebuilt landing pages next to the Webflow originals.
 *
 *   node preview.mjs &            # must already be running
 *   node compare.mjs [--vw 1440] [--slug invisalign]
 *
 * Output: compare/<slug>-<width>-{new,ref}.png plus a height/console report.
 *
 * Heights are the useful signal. Two pages built from the same markup and the
 * same stylesheet should lay out to within a few percent; a large divergence
 * means a rule failed to survive the namespacing, which is exactly the failure
 * mode this port risks. The GoHighLevel form area is expected to differ - it is
 * a placeholder locally and a live iframe on the reference.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, "compare");
const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
fs.mkdirSync(OUT, { recursive: true });

const argv = process.argv.slice(2);
const num = (n, d) => { const i = argv.indexOf(n); return i === -1 ? d : Number(argv[i + 1]); };
const VW = num("--vw", 1440);
const ONE = argv.includes("--slug") ? argv[argv.indexOf("--slug") + 1] : null;
const PORT = num("--port", 4320);

const SLUGS = (ONE ? [ONE] : [
  "invisalign", "new-patient-special", "invisalign-consultation",
  "new-patient-special-consultation", "invisalign-thank-you", "new-patient-thank-you",
]);

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const gj = (p, port) => new Promise((res, rej) => http.get({ host: "127.0.0.1", port, path: p }, (r) => {
  let d = ""; r.on("data", (c) => (d += c)); r.on("end", () => res(JSON.parse(d)));
}).on("error", rej));

const port = 9700 + Math.floor(Math.random() * 200);
const proc = spawn(CHROME, [
  "--headless=new", "--disable-gpu", `--remote-debugging-port=${port}`,
  "--remote-allow-origins=*", "--no-first-run", "--hide-scrollbars",
  `--user-data-dir=${path.join(os.tmpdir(), "lpcmp" + Date.now())}`, "about:blank",
], { stdio: "ignore" });

let ws;
for (let i = 0; i < 150 && !ws; i++) {
  try { ws = (await gj("/json/version", port)).webSocketDebuggerUrl; } catch { await wait(200); }
}
if (!ws) { proc.kill(); throw new Error("Chrome did not start"); }

const sock = new WebSocket(ws);
const pend = new Map();
let id = 0;
let errors = [];
sock.addEventListener("message", async (e) => {
  const m = JSON.parse(typeof e.data === "string" ? e.data : await e.data.text());
  if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); return; }
  if (m.method === "Log.entryAdded" && m.params.entry.level === "error") errors.push(m.params.entry.text.slice(0, 120));
});
await new Promise((r) => sock.addEventListener("open", r, { once: true }));
const send = (me, p = {}, sid) => new Promise((res, rej) => {
  const i = ++id;
  pend.set(i, (m) => (m.error ? rej(new Error(m.error.message)) : res(m.result)));
  sock.send(JSON.stringify({ id: i, method: me, params: p, sessionId: sid }));
});
const tg = (await gj("/json/list", port)).find((t) => t.type === "page");
const { sessionId } = await send("Target.attachToTarget", { targetId: tg.id, flatten: true });
const S = (m, p = {}) => send(m, p, sessionId);
await S("Page.enable"); await S("Runtime.enable"); await S("Log.enable");

async function shoot(url, file) {
  errors = [];
  await S("Emulation.setDeviceMetricsOverride", { width: VW, height: 1200, deviceScaleFactor: 1, mobile: VW < 500 });
  await S("Page.navigate", { url });
  await wait(VW < 500 ? 3500 : 3000);
  // Let lazy images resolve before measuring.
  await S("Runtime.evaluate", { expression: "window.scrollTo(0,document.body.scrollHeight)" });
  await wait(1200);
  await S("Runtime.evaluate", { expression: "window.scrollTo(0,0)" });
  await wait(400);
  const { result } = await S("Runtime.evaluate", {
    expression: `JSON.stringify({h:document.documentElement.scrollHeight,
      imgs:[...document.images].length,
      broken:[...document.images].filter(i=>i.complete&&i.naturalWidth===0).length,
      text:document.body.innerText.replace(/\\s+/g,' ').trim().length})`,
    returnByValue: true,
  });
  const info = JSON.parse(result.value);
  const shot = await S("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
  fs.writeFileSync(path.join(OUT, file), Buffer.from(shot.data, "base64"));
  return { ...info, errors: [...errors] };
}

console.log(`viewport ${VW}px\n`);
console.log("page                              rebuilt-h    ref-h   delta   imgs broken  text-new  text-ref");
const rows = [];
for (const slug of SLUGS) {
  const a = await shoot(`http://localhost:${PORT}/${slug}`, `${slug}-${VW}-new.png`);
  const b = await shoot(`https://mason-park-dental.webflow.io/${slug}`, `${slug}-${VW}-ref.png`);
  const delta = b.h ? Math.round(((a.h - b.h) / b.h) * 100) : 0;
  rows.push({ slug, a, b, delta });
  console.log(
    `${slug.padEnd(34)}${String(a.h).padStart(8)}${String(b.h).padStart(9)}${String(delta + "%").padStart(8)}`
    + `${String(a.imgs).padStart(7)}${String(a.broken).padStart(7)}${String(a.text).padStart(10)}${String(b.text).padStart(10)}`);
}

console.log("");
for (const r of rows) {
  if (r.a.broken) console.log(`  BROKEN IMAGES  ${r.slug}: ${r.a.broken}`);
  if (Math.abs(r.delta) > 12) console.log(`  HEIGHT DRIFT   ${r.slug}: ${r.delta}% (${r.a.h} vs ${r.b.h})`);
  for (const e of r.a.errors.slice(0, 3)) console.log(`  console        ${r.slug}: ${e}`);
}
fs.writeFileSync(path.join(OUT, `report-${VW}.json`), JSON.stringify(rows, null, 2));
console.log(`\n-> compare/ (${fs.readdirSync(OUT).filter((f) => f.endsWith(".png")).length} images)`);

sock.close();
proc.kill();
