/**
 * Does the GoHighLevel form actually load, and does it match the reference?
 *
 *   node verify-form.mjs
 *
 * A screenshot is not enough here: the form card renders blank in headless
 * Chrome on OUR page AND on the Webflow original, because the widget lazy-loads
 * (the 18-instatic-embeds directive warns about exactly this). So the check is
 * comparative and structural - same iframe, same form id, same network result
 * on both - rather than visual.
 *
 * Per campaign, the form id must be the one that campaign's Webflow page used:
 *   Invisalign        YbX91GhEDKkCN4GH4gka
 *   $189 New Patient  AFu5BpJpMjgSnSf8yybc
 */
import { spawn } from "node:child_process";
import http from "node:http";
import os from "node:os";
import path from "node:path";

const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const TARGET = (process.env.TARGET_ORIGIN || "https://www.masonparkdental.com").replace(/\/+$/, "");

const CASES = [
  { slug: "invisalign", form: "YbX91GhEDKkCN4GH4gka", campaign: "Invisalign" },
  { slug: "invisalign-consultation", form: "YbX91GhEDKkCN4GH4gka", campaign: "Invisalign" },
  { slug: "new-patient-special", form: "AFu5BpJpMjgSnSf8yybc", campaign: "$189 New Patient" },
  { slug: "new-patient-special-consultation", form: "AFu5BpJpMjgSnSf8yybc", campaign: "$189 New Patient" },
  { slug: "invisalign-thank-you", form: null, campaign: "Invisalign" },
  { slug: "new-patient-thank-you", form: null, campaign: "$189 New Patient" },
];

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const gj = (p, port) => new Promise((res, rej) => http.get({ host: "127.0.0.1", port, path: p }, (r) => {
  let d = ""; r.on("data", (c) => (d += c)); r.on("end", () => res(JSON.parse(d)));
}).on("error", rej));

const port = 9100 + Math.floor(Math.random() * 90);
const proc = spawn(CHROME, [
  "--headless=new", "--disable-gpu", `--remote-debugging-port=${port}`,
  "--remote-allow-origins=*", "--no-first-run", "--hide-scrollbars",
  `--user-data-dir=${path.join(os.tmpdir(), "vf" + Date.now())}`, "about:blank",
], { stdio: "ignore" });

let ws;
for (let i = 0; i < 150 && !ws; i++) {
  try { ws = (await gj("/json/version", port)).webSocketDebuggerUrl; } catch { await wait(200); }
}
const sock = new WebSocket(ws);
const pend = new Map();
let id = 0;
let net = [];
let cspViolations = [];
sock.addEventListener("message", async (e) => {
  const m = JSON.parse(typeof e.data === "string" ? e.data : await e.data.text());
  if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); return; }
  if (m.method === "Network.responseReceived") net.push([m.params.response.status, m.params.response.url]);
  if (m.method === "Network.loadingFailed" && m.params.blockedReason === "csp") {
    cspViolations.push(m.params.type);
  }
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
await S("Page.enable"); await S("Runtime.enable"); await S("Network.enable");

async function probe(url) {
  net = []; cspViolations = [];
  await S("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await S("Page.navigate", { url });
  await wait(3000);
  // Scroll the form into view so a lazy iframe is asked for at all.
  await S("Runtime.evaluate", {
    expression: `(document.querySelector('iframe[src*="leadconnectorhq"]')||{scrollIntoView(){}}).scrollIntoView({block:'center'})`,
  });
  await wait(5000);
  const { result } = await S("Runtime.evaluate", {
    returnByValue: true,
    expression: `(() => {
      const f = document.querySelector('iframe[src*="leadconnectorhq.com/widget/form/"]');
      const r = f && f.getBoundingClientRect();
      return JSON.stringify({
        iframes: document.querySelectorAll('iframe').length,
        src: f ? f.getAttribute('src') : null,
        w: r ? Math.round(r.width) : 0,
        h: r ? Math.round(r.height) : 0,
        loader: !!document.querySelector('script[src*="form_embed.js"]'),
      });
    })()`,
  });
  const info = JSON.parse(result.value);
  const formReq = net.filter(([, u]) => /leadconnectorhq\.com\/widget\/form\//.test(u));
  const loaderReq = net.filter(([, u]) => /form_embed\.js/.test(u));
  return {
    ...info,
    formStatus: formReq.length ? formReq[0][0] : null,
    loaderStatus: loaderReq.length ? loaderReq[0][0] : null,
    csp: [...cspViolations],
  };
}

const problems = [];
console.log(`${"page".padEnd(34)} ${"where".padEnd(5)}  iframe  form-req  loader  size        form id`);
for (const c of CASES) {
  for (const [where, url] of [
    ["ours", `${TARGET}/${c.slug}`],
    ["ref", `https://mason-park-dental.webflow.io/${c.slug}`],
  ]) {
    const d = await probe(url);
    const gotId = d.src ? d.src.split("/").pop() : "-";
    console.log(
      `${c.slug.padEnd(34)} ${where.padEnd(5)}  ${String(d.iframes).padStart(6)}`
      + `  ${String(d.formStatus ?? "-").padStart(8)}  ${String(d.loaderStatus ?? "-").padStart(6)}`
      + `  ${String(d.w + "x" + d.h).padEnd(11)} ${gotId}`);

    if (where !== "ours") continue;
    if (c.form) {
      if (gotId !== c.form) problems.push(`${c.slug}: form id is ${gotId}, expected ${c.form} (${c.campaign})`);
      if (d.formStatus !== 200) problems.push(`${c.slug}: the form iframe request returned ${d.formStatus}`);
      if (d.loaderStatus !== 200) problems.push(`${c.slug}: form_embed.js returned ${d.loaderStatus}`);
      if (!d.w || !d.h) problems.push(`${c.slug}: the form iframe has no size (${d.w}x${d.h})`);
    } else if (d.src) {
      problems.push(`${c.slug}: a thank-you page must carry no lead form, found ${gotId}`);
    }
    if (d.csp.length) problems.push(`${c.slug}: ${d.csp.length} request(s) blocked by CSP (${[...new Set(d.csp)].join(", ")})`);
  }
}

console.log(`\n${problems.length} problems`);
for (const p of problems) console.log(`  PROBLEM  ${p}`);
sock.close();
proc.kill();
process.exitCode = problems.length ? 1 : 0;
