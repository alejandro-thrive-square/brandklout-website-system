/**
 * Do the FAQ accordions actually open and close on the published pages?
 *
 *   node verify-faq.mjs
 *
 * The FAQ items are Webflow Dropdown components. Their answers are hidden by
 * `.w-dropdown-list{display:none}` and revealed only by a `w--open` class that
 * `webflow.js` adds — and the port strips `webflow.js`, so every answer was
 * permanently unreadable. `lp-faq.js` puts that class back.
 *
 * NOTE: these accordions do not work on the Webflow original either — a real
 * trusted click there leaves `aria-expanded="false"` and the answer hidden. So
 * there is no reference behaviour to diff against; this asserts the behaviour
 * outright instead.
 *
 * For each toggle: closed to begin with, opens on click (answer becomes visible
 * AND has height), closes again, and carries the accessibility attributes the
 * missing webflow.js would have set.
 */
import { spawn } from "node:child_process";
import http from "node:http";
import os from "node:os";
import path from "node:path";

const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const ORIGIN = "https://www.masonparkdental.com";

// Pages that carry FAQ accordions, and how many. The consultation pages have
// none, so they must report zero rather than being skipped silently.
const EXPECT = {
  "invisalign": 7,
  "new-patient-special": 5,
  "invisalign-thank-you": 7,
  "new-patient-thank-you": 7,
  "invisalign-consultation": 0,
  "new-patient-special-consultation": 0,
};

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const gj = (p, port) => new Promise((res, rej) => http.get({ host: "127.0.0.1", port, path: p }, (r) => {
  let d = ""; r.on("data", (c) => (d += c)); r.on("end", () => res(JSON.parse(d)));
}).on("error", rej));

const port = 9800 + Math.floor(Math.random() * 90);
const proc = spawn(CHROME, [
  "--headless=new", "--disable-gpu", `--remote-debugging-port=${port}`,
  "--remote-allow-origins=*", "--no-first-run", "--hide-scrollbars",
  `--user-data-dir=${path.join(os.tmpdir(), "faq" + Date.now())}`, "about:blank",
], { stdio: "ignore" });

let ws;
for (let i = 0; i < 150 && !ws; i++) {
  try { ws = (await gj("/json/version", port)).webSocketDebuggerUrl; } catch { await wait(200); }
}
const sock = new WebSocket(ws);
const pend = new Map();
let id = 0;
sock.addEventListener("message", async (e) => {
  const m = JSON.parse(typeof e.data === "string" ? e.data : await e.data.text());
  if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); }
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
await S("Page.enable"); await S("Runtime.enable");

async function probe(slug) {
  await S("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await S("Page.navigate", { url: `${ORIGIN}/${slug}` });
  await wait(3500);
  const { result } = await S("Runtime.evaluate", {
    returnByValue: true,
    awaitPromise: true,
    expression: `(async () => {
      const toggles = [...document.querySelectorAll('.lp-page .w-dropdown-toggle')];
      const out = { count: toggles.length, script: !!document.querySelector('script[src*="lp-faq"]'), items: [] };
      for (const t of toggles) {
        const list = t.closest('.w-dropdown').querySelector('.w-dropdown-list');
        const closed = getComputedStyle(list).display;
        t.click();
        await new Promise(r => setTimeout(r, 120));
        const openDisp = getComputedStyle(list).display;
        const openH = Math.round(list.getBoundingClientRect().height);
        const aria = t.getAttribute('aria-expanded');
        const text = (list.innerText || '').trim().length;
        t.click();
        await new Promise(r => setTimeout(r, 120));
        const reclosed = getComputedStyle(list).display;
        out.items.push({
          q: (t.innerText || '').trim().split('\\n')[0].slice(0, 40),
          closed, openDisp, openH, aria, text, reclosed,
          role: t.getAttribute('role'), tab: t.getAttribute('tabindex'),
        });
      }
      return JSON.stringify(out);
    })()`,
  });
  return JSON.parse(result.value);
}

const problems = [];
console.log(`${"page".padEnd(34)} script  faqs  all-open-ok  all-close-ok  a11y-ok`);
for (const [slug, expected] of Object.entries(EXPECT)) {
  const d = await probe(slug);

  if (d.count !== expected) problems.push(`${slug}: expected ${expected} FAQ toggles, found ${d.count}`);
  if (expected === 0) {
    console.log(`${slug.padEnd(34)} ${String(d.script).padEnd(7)}${String(d.count).padStart(5)}   (none expected)`);
    continue;
  }

  const opened = d.items.filter((i) => i.openDisp !== "none" && i.openH > 0 && i.text > 0);
  const closedAgain = d.items.filter((i) => i.reclosed === "none");
  const a11y = d.items.filter((i) => i.role === "button" && i.tab === "0" && i.aria === "true");
  console.log(
    `${slug.padEnd(34)} ${String(d.script).padEnd(7)}${String(d.count).padStart(5)}`
    + `${(opened.length + "/" + d.count).padStart(13)}${(closedAgain.length + "/" + d.count).padStart(14)}`
    + `${(a11y.length + "/" + d.count).padStart(9)}`);

  if (!d.script) problems.push(`${slug}: lp-faq.js is not on the page`);
  for (const i of d.items) {
    if (i.closed !== "none") problems.push(`${slug}: "${i.q}" starts open`);
    if (i.openDisp === "none" || i.openH === 0) problems.push(`${slug}: "${i.q}" does not open`);
    if (i.text === 0) problems.push(`${slug}: "${i.q}" opens but has no answer text`);
    if (i.reclosed !== "none") problems.push(`${slug}: "${i.q}" does not close again`);
    if (i.role !== "button" || i.tab !== "0") problems.push(`${slug}: "${i.q}" is not keyboard reachable`);
    if (i.aria !== "true") problems.push(`${slug}: "${i.q}" does not report aria-expanded when open`);
  }
}

console.log(`\n${problems.length} problems`);
for (const p of problems) console.log(`  PROBLEM  ${p}`);
sock.close();
proc.kill();
process.exitCode = problems.length ? 1 : 0;
