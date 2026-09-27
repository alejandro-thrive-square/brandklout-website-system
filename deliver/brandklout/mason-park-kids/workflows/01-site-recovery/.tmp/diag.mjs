// Why do 39 of 40 mirrored pages parse to an empty body while the homepage is
// fine? Loads one page and reports what the parser actually built, plus the
// console errors, plus where the raw file and the parsed DOM diverge.
//
//   node diag.mjs [slug]
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MIRROR = path.join(HERE, "recovered", "mirror");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const SLUG = process.argv[2] || "about-us";

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const MIME = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp",
  ".svg": "image/svg+xml", ".gif": "image/gif", ".woff": "font/woff", ".woff2": "font/woff2",
  ".ttf": "font/ttf", ".eot": "application/vnd.ms-fontobject", ".cur": "image/x-icon" };

const server = http.createServer((req, res) => {
  let rel = decodeURIComponent(req.url.split("?")[0]).replace(/^\/+/, "");
  let f = path.join(MIRROR, rel);
  try {
    if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, "index.html");
  } catch {}
  if (!fs.existsSync(f) || !fs.statSync(f).isFile()) { res.writeHead(404); return res.end("x"); }
  res.writeHead(200, { "content-type": MIME[path.extname(f).toLowerCase()] || "application/octet-stream" });
  fs.createReadStream(f).pipe(res);
});
const PORT = await new Promise((r) => server.listen(0, "127.0.0.1", () => r(server.address().port)));

const CDP = 9700 + Math.floor(Math.random() * 200);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "pdk-diag-"));
const chrome = spawn(CHROME, ["--headless=new", "--disable-gpu", `--remote-debugging-port=${CDP}`,
  "--remote-allow-origins=*", "--host-resolver-rules=EXCLUDE 127.0.0.1, EXCLUDE localhost, MAP * ~NOTFOUND",
  "--window-size=1440,900", "--no-first-run", `--user-data-dir=${profile}`, "about:blank"]);

const getJSON = (p) => new Promise((res, rej) => {
  http.get({ host: "127.0.0.1", port: CDP, path: p }, (r) => {
    let d = ""; r.on("data", (c) => (d += c)); r.on("end", () => res(JSON.parse(d)));
  }).on("error", rej);
});
let wsUrl = null;
for (let i = 0; i < 80; i++) { try { const v = await getJSON("/json/version"); if (v.webSocketDebuggerUrl) { wsUrl = v.webSocketDebuggerUrl; break; } } catch {} await wait(250); }

const ws = new WebSocket(wsUrl);
let id = 0; const pending = new Map(); const logs = [];
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
  if (m.method === "Log.entryAdded") logs.push(`${m.params.entry.level}: ${m.params.entry.text}`.slice(0, 200));
  if (m.method === "Runtime.exceptionThrown") logs.push("EXC: " + (m.params.exceptionDetails.text || "") + " " + (m.params.exceptionDetails.exception?.description || "").slice(0, 200));
});
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let sessionId;
const call = (m, p, root) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method: m, params: p, ...(root ? {} : { sessionId }) })); });
const send = (m, p = {}) => call(m, p, false);
const sendRoot = (m, p = {}) => call(m, p, true);
const { targetInfos } = await sendRoot("Target.getTargets");
let t = targetInfos.find((x) => x.type === "page") || { targetId: (await sendRoot("Target.createTarget", { url: "about:blank" })).targetId };
({ sessionId } = await sendRoot("Target.attachToTarget", { targetId: t.targetId, flatten: true }));
await send("Page.enable"); await send("Runtime.enable"); await send("Log.enable");

const ev = async (x) => (await send("Runtime.evaluate", { expression: x, returnByValue: true, awaitPromise: true }))?.result?.value;

await send("Page.navigate", { url: `http://127.0.0.1:${PORT}/${SLUG === "home" ? "" : SLUG + "/"}` });
await wait(7000);

const raw = fs.readFileSync(path.join(MIRROR, SLUG === "home" ? "index.html" : SLUG + "/index.html"), "utf8");
console.log("=== RAW FILE ===");
console.log("bytes:", raw.length);
console.log("<script> tags:", (raw.match(/<script/gi) || []).length, " closing:", (raw.match(/<\/script>/gi) || []).length);
console.log("<style> tags:", (raw.match(/<style/gi) || []).length, " closing:", (raw.match(/<\/style>/gi) || []).length);
console.log("<!-- :", (raw.match(/<!--/g) || []).length, " --> :", (raw.match(/-->/g) || []).length);
console.log("<div :", (raw.match(/<div/gi) || []).length, " </div> :", (raw.match(/<\/div>/gi) || []).length);

console.log("\n=== PARSED DOM ===");
console.log("title      :", await ev("document.title"));
console.log("body kids  :", await ev("document.body ? document.body.children.length : -1"));
console.log("head kids  :", await ev("document.head ? document.head.children.length : -1"));
console.log("doc length :", await ev("document.documentElement.outerHTML.length"));
console.log("readyState :", await ev("document.readyState"));
console.log("body html  :", JSON.stringify(await ev("document.body ? document.body.innerHTML.slice(0,400) : null")));
console.log("last head  :", JSON.stringify(await ev("document.head ? document.head.lastElementChild?.outerHTML.slice(0,300) : null")));

console.log("\n=== CONSOLE (first 12) ===");
logs.slice(0, 12).forEach((l) => console.log("  " + l));

ws.close(); chrome.kill(); server.close();
setTimeout(() => process.exit(0), 300);
