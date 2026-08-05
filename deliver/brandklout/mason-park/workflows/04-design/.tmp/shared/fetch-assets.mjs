// Download the client's own imagery into shared/img/.
//
// Why this exists: bestdentistinkatytx.com sits behind a SiteGround bot wall.
// Hotlinking the images from a local page returns the 202 challenge HTML instead
// of an image, so the pages cannot reference the live URLs. This drives a real
// browser to the site first (which clears the wall and sets the cookie), then
// fetches each asset from the page's own origin and writes the bytes to disk.
//
// Usage: node shared/fetch-assets.mjs   (run from 04-design/.tmp/)
// Source Asana task GID: 1217040406855582
//
// Output is gitignored per the repo asset rules — re-run this to restore it.
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(here, "img");
fs.mkdirSync(outDir, { recursive: true });

const BASE = "https://bestdentistinkatytx.com";
const ASSETS = [
  ["/wp-content/uploads/2023/08/Dentist-Katy-TX-Logo-2.webp", "logo.webp"],
  ["/wp-content/uploads/2020/04/DrWilliamSung-230x300-1.webp", "dr-sung.webp"],
  ["/wp-content/uploads/2023/11/HS-7-683x1024.jpg", "dr-cho.jpg"],
  ["/wp-content/uploads/2023/11/HS-8-683x1024.jpg", "dr-nguyen.jpg"],
  ["/wp-content/uploads/2023/11/Dentist-in-Katy-Office-1536x658.webp", "office.webp"],
  ["/wp-content/uploads/2023/11/g7-1024x683.jpg", "interior.jpg"],
  ["/wp-content/uploads/2021/12/Dentist-Katy-scaled-1-840x560.jpg", "care-1.jpg"],
  ["/wp-content/uploads/2021/12/Katy-TX-Dentist-scaled-1-840x560.jpg", "care-2.jpg"],
  ["/wp-content/uploads/2023/08/kois-1.webp", "badge-kois.webp"],
  ["/wp-content/uploads/2023/08/ssc-1.webp", "badge-ssc.webp"],
  ["/wp-content/uploads/2023/08/agd-1.webp", "badge-agd.webp"],
  ["/wp-content/uploads/2023/08/aapd.webp", "badge-aapd.webp"],
  ["/wp-content/uploads/2023/08/abpd-1.webp", "badge-abpd.webp"],
  ["/wp-content/uploads/2026/03/68252146834983973a92051f_cherry-logo-primary.svg", "cherry.svg"],
];

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9800 + Math.floor(Math.random() * 300);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-assets-"));

const chrome = spawn(CHROME, [
  "--headless=new",
  "--disable-gpu",
  `--remote-debugging-port=${PORT}`,
  "--remote-allow-origins=*",
  "--no-first-run",
  "--no-default-browser-check",
  "--disable-blink-features=AutomationControlled",
  `--user-data-dir=${profile}`,
  "about:blank",
]);
let chromeErr = "";
chrome.stderr.on("data", (d) => (chromeErr += d));

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const getJSON = (p) =>
  new Promise((resolve, reject) => {
    http
      .get({ host: "127.0.0.1", port: PORT, path: p }, (res) => {
        let d = "";
        res.on("data", (c) => (d += c));
        res.on("end", () => resolve(JSON.parse(d)));
      })
      .on("error", reject);
  });

async function findWs() {
  for (let i = 0; i < 50; i++) {
    try {
      const v = await getJSON("/json/version");
      if (v.webSocketDebuggerUrl) return v.webSocketDebuggerUrl;
    } catch {}
    await wait(200);
  }
  throw new Error("Chrome CDP did not come up\n" + chromeErr.slice(0, 600));
}

const ws = new WebSocket(await findWs());
let id = 0;
const pending = new Map();
ws.addEventListener("message", (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg.result);
    pending.delete(msg.id);
  }
});
await new Promise((r) => ws.addEventListener("open", r, { once: true }));

function send(method, params = {}, sessionId) {
  return new Promise((resolve) => {
    const mid = ++id;
    pending.set(mid, resolve);
    ws.send(JSON.stringify({ id: mid, method, params, sessionId }));
  });
}

const { targetInfos } = await send("Target.getTargets");
let target = targetInfos.find((t) => t.type === "page");
if (!target) target = { targetId: (await send("Target.createTarget", { url: "about:blank" })).targetId };
const { sessionId } = await send("Target.attachToTarget", { targetId: target.targetId, flatten: true });
await send("Page.enable", {}, sessionId);
await send("Runtime.enable", {}, sessionId);

const evaluate = async (expression) => {
  const r = await send(
    "Runtime.evaluate",
    { expression, returnByValue: true, awaitPromise: true },
    sessionId
  );
  if (r?.exceptionDetails) throw new Error(r.exceptionDetails.text || "eval failed");
  return r?.result?.value;
};

// Clear the bot wall first.
console.log("warming up session against the bot wall...");
await send("Page.navigate", { url: BASE + "/" }, sessionId);
await wait(9000);
const bodyText = (await evaluate("document.body.innerText")) || "";
if (/one moment|robot challenge/i.test(bodyText)) {
  console.log("still challenged, waiting longer...");
  await wait(9000);
}

let ok = 0;
let failed = [];
for (const [urlPath, filename] of ASSETS) {
  try {
    const b64 = await evaluate(`(async () => {
      const r = await fetch(${JSON.stringify(BASE + urlPath)}, { credentials: 'include' });
      if (!r.ok) return 'ERR:' + r.status;
      const ct = r.headers.get('content-type') || '';
      if (/text\\/html/.test(ct)) return 'ERR:challenged';
      const buf = new Uint8Array(await r.arrayBuffer());
      let s = '';
      for (let i = 0; i < buf.length; i++) s += String.fromCharCode(buf[i]);
      return btoa(s);
    })()`);

    if (!b64 || b64.startsWith("ERR:")) {
      failed.push(`${filename} (${b64 || "empty"})`);
      continue;
    }
    const bytes = Buffer.from(b64, "base64");
    fs.writeFileSync(path.join(outDir, filename), bytes);
    console.log(`  ${filename.padEnd(20)} ${(bytes.length / 1024) | 0} KB`);
    ok++;
    await wait(350); // stay polite, avoid re-tripping the wall
  } catch (e) {
    failed.push(`${filename} (${e.message})`);
  }
}

console.log(`\n${ok}/${ASSETS.length} assets downloaded to shared/img/`);
if (failed.length) console.log("FAILED:\n  " + failed.join("\n  "));

ws.close();
chrome.kill();
process.exit(failed.length ? 1 : 0);
