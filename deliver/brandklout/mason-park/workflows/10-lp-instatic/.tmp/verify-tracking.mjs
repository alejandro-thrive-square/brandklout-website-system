/**
 * Does the GoHighLevel number pool actually swap the phone number?
 *
 *   node verify-tracking.mjs
 *
 * This is the only honest test of call tracking. The markup ships the
 * practice's public number, (281) 769-8878, on every page; `number_pool.js`
 * replaces it in the DOM with a per-campaign number once it runs. The Webflow
 * reference renders (281) 645-5375 on /invisalign. If our page still shows the
 * public number after the scripts have had time to run, tracking is not working
 * and every ad call will attribute to the main site.
 *
 * Compared against the reference page rather than a hard-coded number, because
 * a pool hands out different numbers over time.
 */
import { spawn } from "node:child_process";
import http from "node:http";
import os from "node:os";
import path from "node:path";

const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const TARGET = (process.env.TARGET_ORIGIN || "https://www.masonparkdental.com").replace(/\/+$/, "");
const PUBLIC = "(281) 769-8878";
const SLUGS = [
  "invisalign", "new-patient-special", "invisalign-consultation",
  "new-patient-special-consultation", "invisalign-thank-you", "new-patient-thank-you",
];

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const gj = (p, port) => new Promise((res, rej) => http.get({ host: "127.0.0.1", port, path: p }, (r) => {
  let d = ""; r.on("data", (c) => (d += c)); r.on("end", () => res(JSON.parse(d)));
}).on("error", rej));

const port = 9200 + Math.floor(Math.random() * 90);
const proc = spawn(CHROME, [
  "--headless=new", "--disable-gpu", `--remote-debugging-port=${port}`,
  "--remote-allow-origins=*", "--no-first-run", "--hide-scrollbars",
  `--user-data-dir=${path.join(os.tmpdir(), "vt" + Date.now())}`, "about:blank",
], { stdio: "ignore" });

let ws;
for (let i = 0; i < 150 && !ws; i++) {
  try { ws = (await gj("/json/version", port)).webSocketDebuggerUrl; } catch { await wait(200); }
}
const sock = new WebSocket(ws);
const pend = new Map();
let id = 0;
let loaded = [];
sock.addEventListener("message", async (e) => {
  const m = JSON.parse(typeof e.data === "string" ? e.data : await e.data.text());
  if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); return; }
  if (m.method === "Network.responseReceived") loaded.push([m.params.response.status, m.params.response.url]);
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
await S("Page.enable"); await S("Network.enable");

async function probe(url) {
  loaded = [];
  await S("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await S("Page.navigate", { url });
  await wait(7000); // the pool script rewrites the DOM after it loads
  const { result } = await S("Runtime.evaluate", {
    returnByValue: true,
    expression: `(() => {
      const nums = [...new Set([...document.querySelectorAll('a[href^="tel:"]')]
        .map(a => a.textContent.replace(/\\s+/g,' ').trim())
        .filter(t => /\\d{3}/.test(t)))];
      const hrefs = [...new Set([...document.querySelectorAll('a[href^="tel:"]')].map(a => a.getAttribute('href')))];
      return JSON.stringify({ nums, hrefs });
    })()`,
  });
  const info = JSON.parse(result.value);
  const pool = loaded.filter(([, u]) => /number_pool\.js/.test(u));
  return { ...info, poolStatus: pool.length ? pool[0][0] : null };
}

const problems = [];
console.log(`${"page".padEnd(34)} ${"where".padEnd(5)}  pool  numbers shown`);
for (const slug of SLUGS) {
  const out = {};
  for (const [where, url] of [
    ["ours", `${TARGET}/${slug}`],
    ["ref", `https://mason-park-dental.webflow.io/${slug}`],
  ]) {
    const d = await probe(url);
    out[where] = d;
    console.log(`${slug.padEnd(34)} ${where.padEnd(5)}  ${String(d.poolStatus ?? "-").padStart(4)}  ${d.nums.join(" | ").slice(0, 60)}`);
  }
  if (out.ours.poolStatus !== 200) {
    problems.push(`${slug}: number_pool.js did not load (status ${out.ours.poolStatus})`);
  }
  const oursSwapped = out.ours.nums.some((n) => !n.includes(PUBLIC));
  const refSwapped = out.ref.nums.some((n) => !n.includes(PUBLIC));
  if (refSwapped && !oursSwapped) {
    problems.push(`${slug}: the reference swaps in a tracking number and ours still shows ${PUBLIC}`);
  }
}

console.log(`\n${problems.length} problems`);
for (const p of problems) console.log(`  PROBLEM  ${p}`);
sock.close();
proc.kill();
process.exitCode = problems.length ? 1 : 0;
