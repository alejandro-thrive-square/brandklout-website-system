// Download the client's own images through a real browser session.
//
// arvadadentalcenter.com sits behind SiteGround's sgcaptcha. The challenge covers
// *images* too, and it specifically intercepts scripted requests: an in-page
// fetch() for a .webp comes back as text/html even with the cookie set, while the
// browser's own <img> loads succeed. So the only reliable way to get the original
// bytes is to let the page load its images normally and read them back off the
// network log with Network.getResponseBody — which also avoids the re-encoding
// that a canvas round-trip would cause.
//
// Usage: node fetch-assets.mjs <pagesJson> <outDir>
//   pagesJson: ["https://arvadadentalcenter.com/", "...", ...]
// Asana task GID: 1217040406855586
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";

const [, , pagesPath, outDir] = process.argv;
const pages = JSON.parse(fs.readFileSync(pagesPath, "utf8"));

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9800 + Math.floor(Math.random() * 300);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-assets-"));
fs.mkdirSync(outDir, { recursive: true });

const chrome = spawn(CHROME, [
  "--headless=new",
  "--disable-gpu",
  "--hide-scrollbars",
  `--remote-debugging-port=${PORT}`,
  "--remote-allow-origins=*",
  "--window-size=1600,1200",
  "--no-first-run",
  "--no-default-browser-check",
  `--user-data-dir=${profile}`,
  "about:blank",
]);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJSON(p) {
  return new Promise((resolve, reject) => {
    http
      .get({ host: "127.0.0.1", port: PORT, path: p }, (res) => {
        let d = "";
        res.on("data", (c) => (d += c));
        res.on("end", () => resolve(JSON.parse(d)));
      })
      .on("error", reject);
  });
}
let wsUrl;
for (let i = 0; i < 40 && !wsUrl; i++) {
  try {
    wsUrl = (await getJSON("/json/version")).webSocketDebuggerUrl;
  } catch {}
  if (!wsUrl) await wait(200);
}
const ws = new WebSocket(wsUrl);
let id = 0;
const pending = new Map();
const imageRequests = new Map(); // requestId -> url

ws.addEventListener("message", (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m.result ?? m.error);
    pending.delete(m.id);
    return;
  }
  if (m.method === "Network.responseReceived") {
    const { response, type, requestId } = m.params;
    if (
      (type === "Image" || /^image\//.test(response.mimeType || "")) &&
      response.status === 200 &&
      response.url.includes("arvadadentalcenter.com")
    ) {
      imageRequests.set(requestId, response.url);
    }
  }
});
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
const send = (method, params = {}, sessionId) =>
  new Promise((resolve) => {
    const mid = ++id;
    pending.set(mid, resolve);
    ws.send(JSON.stringify({ id: mid, method, params, sessionId }));
  });

const { targetInfos } = await send("Target.getTargets");
const t = targetInfos.find((x) => x.type === "page");
const { sessionId } = await send("Target.attachToTarget", {
  targetId: t.targetId,
  flatten: true,
});
await send("Page.enable", {}, sessionId);
await send("Runtime.enable", {}, sessionId);
await send("Network.enable", { maxResourceBufferSize: 256 * 1024 * 1024 }, sessionId);

const evaluate = async (expression) =>
  (
    await send(
      "Runtime.evaluate",
      { expression, returnByValue: true, awaitPromise: true },
      sessionId
    )
  )?.result?.value;

const saved = new Map();

function filenameFor(url) {
  let name = decodeURIComponent(url.split("/").pop().split("?")[0]);
  name = name.replace(/\.webp$/i, ""); // ".jpg.webp" -> ".jpg" (bytes are actually webp)
  return name;
}

async function drainImages() {
  for (const [requestId, url] of [...imageRequests.entries()]) {
    imageRequests.delete(requestId);
    if (saved.has(url)) continue;
    const body = await send("Network.getResponseBody", { requestId }, sessionId);
    if (!body || !body.body) continue;
    const buf = Buffer.from(body.body, body.base64Encoded ? "base64" : "utf8");
    if (buf.length < 900) continue; // tracking pixels, spacers
    // Real image? webp = "RIFF"; png = 0x89PNG; jpeg = 0xFFD8; gif = "GIF8"; svg = "<"
    const head = buf.subarray(0, 4).toString("latin1");
    const isImage =
      head.startsWith("RIFF") ||
      buf[0] === 0x89 ||
      (buf[0] === 0xff && buf[1] === 0xd8) ||
      head.startsWith("GIF8") ||
      head.startsWith("<svg") ||
      head.startsWith("<?xm");
    if (!isImage) continue;
    let name = filenameFor(url);
    if (head.startsWith("RIFF") && !/\.webp$/i.test(name)) name = name + ".webp";
    fs.writeFileSync(path.join(outDir, name), buf);
    saved.set(url, { file: name, bytes: buf.length });
    console.log(`  saved ${name} (${(buf.length / 1024).toFixed(0)} KB)`);
  }
}

for (const url of pages) {
  console.log(`\n=== ${url}`);
  await send("Page.navigate", { url }, sessionId);
  for (let i = 0; i < 12; i++) {
    const title = await evaluate("document.title");
    if (title && !/Robot Challenge|Internal Server Error/i.test(title)) break;
    await wait(2500);
  }
  await wait(2500);
  // Scroll so lazy-loaded and CSS background images actually get requested.
  await evaluate(`(async () => {
    const step = window.innerHeight * 0.7;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise(r => setTimeout(r, 260));
    }
    window.scrollTo(0, 0);
    await new Promise(r => setTimeout(r, 900));
  })()`);
  await wait(1200);
  await drainImages();
}

fs.writeFileSync(
  path.join(outDir, "assets-manifest.json"),
  JSON.stringify(
    {
      note:
        "Client-owned imagery from arvadadentalcenter.com, captured off the network while the live pages loaded (the site's bot challenge blocks scripted fetches). Binaries are gitignored; this manifest is the committed record so they can be re-fetched with 01-content-intake/.tmp/fetch-assets.mjs.",
      asanaTaskGid: "1217040406855586",
      capturedFrom: pages,
      files: [...saved.entries()].map(([url, v]) => ({ url, ...v })),
    },
    null,
    2
  )
);
console.log(`\n${saved.size} assets saved to ${outDir}`);
ws.close();
chrome.kill();
process.exit(0);
