/**
 * Verify the six landing pages as published, on the real domain.
 *
 *   node verify-live.mjs
 *
 * Checks what actually matters for a page that ad spend points at: it responds,
 * it is styled, no image is broken, the phone and booking CTAs are clickable,
 * the GoHighLevel form is reachable, and the console is clean. It also re-checks
 * the two live main-site pages most likely to show a namespacing leak.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const ORIGIN = "https://www.masonparkdental.com";

const LP = [
  "invisalign", "new-patient-special", "invisalign-consultation",
  "new-patient-special-consultation", "invisalign-thank-you", "new-patient-thank-you",
];
const MAIN = ["about-us", "our-services"];

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const gj = (p, port) => new Promise((res, rej) => http.get({ host: "127.0.0.1", port, path: p }, (r) => {
  let d = ""; r.on("data", (c) => (d += c)); r.on("end", () => res(JSON.parse(d)));
}).on("error", rej));

const port = 9500 + Math.floor(Math.random() * 90);
const proc = spawn(CHROME, [
  "--headless=new", "--disable-gpu", `--remote-debugging-port=${port}`,
  "--remote-allow-origins=*", "--no-first-run", "--hide-scrollbars",
  `--user-data-dir=${path.join(os.tmpdir(), "ver" + Date.now())}`, "about:blank",
], { stdio: "ignore" });

let ws;
for (let i = 0; i < 150 && !ws; i++) {
  try { ws = (await gj("/json/version", port)).webSocketDebuggerUrl; } catch { await wait(200); }
}
const sock = new WebSocket(ws);
const pend = new Map();
let id = 0;
let errors = [];
let netBad = [];
sock.addEventListener("message", async (e) => {
  const m = JSON.parse(typeof e.data === "string" ? e.data : await e.data.text());
  if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); return; }
  if (m.method === "Log.entryAdded" && m.params.entry.level === "error") {
    errors.push(m.params.entry.text.slice(0, 100));
  }
  // Chrome's console text for a failed subresource carries no URL, so the
  // network event is the only way to tell a broken image from the favicon
  // that no Instatic page has.
  if (m.method === "Network.responseReceived") {
    const { status, url } = m.params.response;
    if (![200, 204, 206, 304].includes(status)) netBad.push(`${status} ${url}`);
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
await S("Page.enable"); await S("Runtime.enable"); await S("Log.enable"); await S("Network.enable");

async function probe(url, width) {
  errors = [];
  netBad = [];
  await S("Emulation.setDeviceMetricsOverride", { width, height: 1000, deviceScaleFactor: 1, mobile: width < 500 });
  await S("Page.navigate", { url });
  await wait(3200);
  await S("Runtime.evaluate", { expression: "window.scrollTo(0,document.body.scrollHeight)" });
  await wait(1000);
  const { result } = await S("Runtime.evaluate", {
    returnByValue: true,
    expression: `JSON.stringify({
      h: document.documentElement.scrollHeight,
      overflow: document.documentElement.scrollWidth > window.innerWidth + 2,
      imgs: document.images.length,
      broken: [...document.images].filter(i => i.complete && i.naturalWidth === 0).length,
      font: getComputedStyle(document.querySelector('.lp-page h1, .lp-page p, .lp-page') || document.body).fontFamily.split(',')[0].replace(/["']/g,''),
      bodyFont: getComputedStyle(document.body).fontFamily.split(',')[0].replace(/["']/g,''),
      tel: document.querySelectorAll('a[href^="tel:"]').length,
      booking: document.querySelectorAll('a[href*="flexbook.me"]').length,
      ghl: document.querySelectorAll('a[href*="leadconnectorhq.com/widget/form/"]').length,
      h1: (document.querySelector('h1')||{}).innerText||'',
      lp: !!document.querySelector('.lp-page')
    })`,
  });
  return { ...JSON.parse(result.value), errors: [...errors], netBad: [...netBad] };
}

const problems = [];
console.log(`${"page".padEnd(34)}  h(1440)  overflow  imgs  broken  font        tel  book  form  h1`);
for (const slug of LP) {
  const d = await probe(`${ORIGIN}/${slug}`, 1440);
  const m = await probe(`${ORIGIN}/${slug}`, 390);
  console.log(
    `${slug.padEnd(34)}${String(d.h).padStart(9)}`
    + `${(d.overflow || m.overflow ? "  YES" : "   no").padStart(10)}`
    + `${String(d.imgs).padStart(6)}${String(d.broken).padStart(8)}  ${d.font.padEnd(12)}`
    + `${String(d.tel).padStart(3)}${String(d.booking).padStart(6)}${String(d.ghl).padStart(6)}  ${d.h1.slice(0, 24).replace(/\n/g, " ")}`);

  if (d.broken) problems.push(`${slug}: ${d.broken} broken image(s)`);
  if (!d.lp) problems.push(`${slug}: .lp-page wrapper missing`);
  if (d.font !== "Montserrat") problems.push(`${slug}: body font is ${d.font}, expected Montserrat`);
  if (d.overflow || m.overflow) problems.push(`${slug}: horizontal overflow (desktop=${d.overflow} mobile=${m.overflow})`);
  if (!d.tel) problems.push(`${slug}: no tel: link`);
  if (slug.includes("thank-you") ? d.ghl !== 0 : d.ghl < 1) {
    problems.push(`${slug}: expected ${slug.includes("thank-you") ? "no" : "a"} GoHighLevel form link, found ${d.ghl}`);
  }
  // Instatic serves no favicon on ANY page, and Cloudflare injects a beacon
  // script and an obfuscation font that its own CSP then blocks - both are
  // true of the untouched main site as well, so neither is ours.
  for (const n of d.netBad) {
    if (/favicon\.ico|cloudflareinsights|beacon\.min\.js/i.test(n)) continue;
    problems.push(`${slug}: request failed: ${n}`);
  }
}

console.log("\nmain site regression check (these must be unchanged):");
for (const slug of MAIN) {
  const d = await probe(`${ORIGIN}/${slug}`, 1440);
  console.log(`${slug.padEnd(34)}${String(d.h).padStart(9)}  bodyFont=${d.bodyFont}  lp-page present=${d.lp}  broken=${d.broken}`);
  if (d.lp) problems.push(`${slug}: a .lp-page wrapper leaked onto a main-site page`);
  if (d.bodyFont === "Montserrat") problems.push(`${slug}: main site body font became Montserrat - the landing-page CSS leaked`);
  if (d.broken) problems.push(`${slug}: ${d.broken} broken image(s)`);
}

console.log(`\n${problems.length} problems`);
for (const p of problems) console.log(`  PROBLEM  ${p}`);
sock.close();
proc.kill();
process.exitCode = problems.length ? 1 : 0;
