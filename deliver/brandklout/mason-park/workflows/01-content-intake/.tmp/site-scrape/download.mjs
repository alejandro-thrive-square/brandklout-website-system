// Asset downloader for the bestdentistinkatytx.com scrape.
//
// Reads .state/assets.json (every URL the crawler saw) and mirrors each file to
// assets/<host>/<path>.
//
// WHY THIS DRIVES CHROME RATHER THAN JUST FETCHING
// SiteGround's bot wall guards *every* path, static uploads included: a plain
// request for a .jpg gets a 202 + meta-refresh stub. Replaying Chrome's cookie
// from Node does NOT get past it either (verified — still 202), so the pass is
// bound to more than the cookie. Same-origin files are therefore pulled with
// fetch() *inside* the page, where the whole session is genuinely Chrome's, and
// handed back over CDP as base64. Third-party CDNs have no such wall, so those
// go over plain Node, which is far cheaper.
//
// Two extras beyond a flat fetch loop:
//   * downloaded CSS is re-parsed for url() and @import refs and those queue
//     too, recursively — stylesheet art never appears in the DOM;
//   * WordPress srcset thumbnails are traced back to their full-size original
//     (foo-768x512.jpg -> foo.jpg) so the scrape holds print-quality masters and
//     not only the sizes this theme happened to render.
//
//   node download.mjs [--batch N]
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import https from "node:https";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const STATE = path.join(HERE, ".state");
const ASSETS = path.join(HERE, "assets");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const SITE = "https://bestdentistinkatytx.com";
const OWN = /(^|\.)bestdentistinkatytx\.com$|(^|\.)masonparkdental\.com$/;

const argv = process.argv.slice(2);
const BATCH = argv.includes("--batch") ? Number(argv[argv.indexOf("--batch") + 1]) : 4;
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

const assetList = JSON.parse(fs.readFileSync(path.join(STATE, "assets.json"), "utf8"));

// ------------------------------------------------------------------ local paths
function localPath(u) {
  const x = new URL(u);
  let p = decodeURIComponent(x.pathname);
  if (p.endsWith("/")) p += "index";
  let name = path.basename(p) || "index";
  const dir = path.dirname(p);
  if (x.search) {
    // Cache-busted assets differ by query, so fold it into the filename.
    const q = x.search.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
    const ext = path.extname(name);
    name = ext ? `${name.slice(0, -ext.length)}__${q}${ext}` : `${name}__${q}`;
  }
  const safe = (s) => s.replace(/[<>:"|?*\\]/g, "_").slice(0, 150);
  return path.join(ASSETS, safe(x.hostname), ...dir.split("/").filter(Boolean).map(safe), safe(name));
}

const isWallStub = (buf, ctype) =>
  buf.length < 500 && /text\/html/i.test(ctype || "") && /sgcaptcha|Robot Challenge|well-known/i.test(buf.toString("utf8"));

// -------------------------------------------------------- third-party fetching
function nodeGet(u, dest, redirects = 0) {
  return new Promise((resolve) => {
    let x;
    try {
      x = new URL(u);
    } catch {
      return resolve({ ok: false, error: "bad url" });
    }
    const mod = x.protocol === "http:" ? http : https;
    const req = mod.request(
      {
        hostname: x.hostname,
        path: x.pathname + x.search,
        method: "GET",
        headers: { "User-Agent": UA, Accept: "*/*", "Accept-Language": "en-US,en;q=0.9", Referer: SITE + "/" },
        timeout: 60000,
      },
      (res) => {
        if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location && redirects < 5) {
          res.resume();
          return resolve(nodeGet(new URL(res.headers.location, u).href, dest, redirects + 1));
        }
        if (res.statusCode !== 200) {
          res.resume();
          return resolve({ ok: false, status: res.statusCode });
        }
        const ctype = res.headers["content-type"] || "";
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const buf = Buffer.concat(chunks);
          if (isWallStub(buf, ctype)) return resolve({ ok: false, error: "bot wall" });
          fs.mkdirSync(path.dirname(dest), { recursive: true });
          fs.writeFileSync(dest, buf);
          resolve({ ok: true, bytes: buf.length, ctype, via: "node" });
        });
        res.on("error", (e) => resolve({ ok: false, error: e.message }));
      }
    );
    req.on("timeout", () => {
      req.destroy();
      resolve({ ok: false, error: "timeout" });
    });
    req.on("error", (e) => resolve({ ok: false, error: e.message }));
    req.end();
  });
}

// ---------------------------------------------------------------- CDP plumbing
const PORT = 9400 + Math.floor(Math.random() * 400);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "mpd-dl-"));
const chrome = spawn(CHROME, [
  "--headless=new",
  "--disable-gpu",
  `--remote-debugging-port=${PORT}`,
  "--remote-allow-origins=*",
  "--no-first-run",
  "--no-default-browser-check",
  "--disable-blink-features=AutomationControlled",
  "--window-size=1400,900",
  `--user-data-dir=${profile}`,
  "about:blank",
]);
let chromeErr = "";
chrome.stderr.on("data", (d) => (chromeErr += d));

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const getJSON = (p) =>
  new Promise((res, rej) => {
    http
      .get({ host: "127.0.0.1", port: PORT, path: p }, (r) => {
        let d = "";
        r.on("data", (c) => (d += c));
        r.on("end", () => res(JSON.parse(d)));
      })
      .on("error", rej);
  });

let wsUrl;
for (let i = 0; i < 60; i++) {
  try {
    const v = await getJSON("/json/version");
    if (v.webSocketDebuggerUrl) {
      wsUrl = v.webSocketDebuggerUrl;
      break;
    }
  } catch {}
  await wait(200);
}
if (!wsUrl) {
  console.error("Chrome CDP did not come up\n" + chromeErr.slice(0, 800));
  process.exit(1);
}
const ws = new WebSocket(wsUrl);
let id = 0;
const pending = new Map();
ws.addEventListener("message", (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m.result);
    pending.delete(m.id);
  }
});
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let sessionId;
const send = (method, params = {}, root = false) =>
  new Promise((res) => {
    const mid = ++id;
    pending.set(mid, res);
    ws.send(JSON.stringify({ id: mid, method, params, sessionId: root ? undefined : sessionId }));
  });
const { targetInfos } = await send("Target.getTargets", {}, true);
const t = targetInfos.find((x) => x.type === "page") || (await send("Target.createTarget", { url: "about:blank" }, true));
({ sessionId } = await send("Target.attachToTarget", { targetId: t.targetId, flatten: true }, true));
await send("Page.enable");
await send("Runtime.enable");
await send("Network.enable");
await send("Network.setUserAgentOverride", { userAgent: UA, acceptLanguage: "en-US,en;q=0.9" });

const evaluate = async (expression) => {
  const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  return r?.result?.value;
};

console.log("Clearing the bot wall…");
await send("Page.navigate", { url: SITE + "/" });
let cleared = false;
for (let i = 0; i < 30; i++) {
  await wait(2000);
  const title = await evaluate("document.title");
  if (title && !/robot challenge|just a moment/i.test(title)) {
    console.log("  session ready —", title);
    cleared = true;
    break;
  }
}
if (!cleared) {
  console.error("Never cleared the wall; aborting.");
  process.exit(2);
}

// Same-origin fetch runs inside the page, so it inherits the real session.
// Base64 keeps binaries intact across the CDP JSON boundary.
async function chromeGet(urls) {
  const expr = `(async () => {
    const urls = ${JSON.stringify(urls)};
    const out = [];
    await Promise.all(urls.map(async (u) => {
      try {
        const r = await fetch(u, { credentials: 'include', redirect: 'follow' });
        if (!r.ok) { out.push({ url: u, ok: false, status: r.status }); return; }
        const ctype = r.headers.get('content-type') || '';
        const buf = new Uint8Array(await r.arrayBuffer());
        let s = '';
        const CH = 0x8000;
        for (let i = 0; i < buf.length; i += CH) s += String.fromCharCode.apply(null, buf.subarray(i, i + CH));
        out.push({ url: u, ok: true, ctype, b64: btoa(s) });
      } catch (e) {
        out.push({ url: u, ok: false, status: 0, error: String(e && e.message || e) });
      }
    }));
    return JSON.stringify(out);
  })()`;
  try {
    return JSON.parse((await evaluate(expr)) || "[]");
  } catch (e) {
    return urls.map((u) => ({ url: u, ok: false, error: "cdp: " + e.message }));
  }
}

// ------------------------------------------------------- derived asset URLs
function fullSizeOf(u) {
  const m = u.match(/^(.*?)-\d{2,4}x\d{2,4}(\.(?:jpe?g|png|gif|webp|avif))(\?.*)?$/i);
  return m ? m[1] + m[2] + (m[3] || "") : null;
}

function cssRefs(css, baseUrl) {
  const out = new Set();
  let m;
  const re = /url\(\s*(['"]?)([^'")]+)\1\s*\)/g;
  while ((m = re.exec(css))) {
    const v = m[2].trim();
    if (!v || v.startsWith("data:") || v.startsWith("#")) continue;
    try {
      const x = new URL(v, baseUrl);
      x.hash = "";
      out.add(x.href);
    } catch {}
  }
  const imp = /@import\s+(?:url\(\s*)?(['"])([^'"]+)\1/g;
  while ((m = imp.exec(css))) {
    try {
      out.add(new URL(m[2], baseUrl).href);
    } catch {}
  }
  return [...out];
}

// ------------------------------------------------------------------ the queue
const pagesFor = new Map();
const originOf = new Map();
const queue = [];
const queued = new Set();
// Analytics and ad pixels are not site assets; they add noise and never rebuild.
const SKIP = /googletagmanager|google-analytics|doubleclick|facebook\.(net|com)|hotjar|clarity\.ms|statcounter|recaptcha|bat\.bing|snap\.licdn|tiktok|pinterest|\.gif\?|utm_/i;

function enqueue(u, pages, origin = "page") {
  let n;
  try {
    const x = new URL(u);
    if (!/^https?:$/.test(x.protocol)) return;
    x.hash = "";
    n = x.href;
  } catch {
    return;
  }
  if (SKIP.test(n)) return;
  if (!pagesFor.has(n)) pagesFor.set(n, new Set());
  (pages || []).forEach((p) => pagesFor.get(n).add(p));
  if (queued.has(n)) return;
  queued.add(n);
  originOf.set(n, origin);
  queue.push(n);
}

for (const { url, pages } of assetList) {
  enqueue(url, pages, "page");
  const full = fullSizeOf(url);
  if (full && full !== url) enqueue(full, pages, "full-size");
}
console.log(`Queued ${queue.length} URLs (${assetList.length} harvested + full-size originals)`);

// --------------------------------------------------------------------- the run
const results = [];
let processed = 0;

function record(url, r) {
  const dest = localPath(url);
  results.push({
    url,
    origin: originOf.get(url) || "",
    pages: [...(pagesFor.get(url) || [])],
    dest,
    ...r,
  });
}

function afterCss(url, dest) {
  if (!/\.css(\?|$)/i.test(url)) return;
  let css;
  try {
    css = fs.readFileSync(dest, "utf8");
  } catch {
    return;
  }
  const before = queue.length;
  const pages = [...(pagesFor.get(url) || [])];
  for (const ref of cssRefs(css, url)) {
    enqueue(ref, pages, "css");
    const full = fullSizeOf(ref);
    if (full && full !== ref) enqueue(full, pages, "css-full-size");
  }
  if (queue.length > before) console.log(`    ↳ ${queue.length - before} refs from ${path.basename(dest)}`);
}

while (queue.length) {
  // Batch same-origin work; third-party goes straight over Node.
  const batch = [];
  while (queue.length && batch.length < BATCH) {
    const u = queue.shift();
    const dest = localPath(u);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
      processed++;
      record(u, { ok: true, bytes: fs.statSync(dest).size, cached: true, via: "cache" });
      afterCss(u, dest);
      continue;
    }
    batch.push(u);
  }
  if (!batch.length) continue;

  const own = batch.filter((u) => OWN.test(new URL(u).hostname));
  const ext = batch.filter((u) => !OWN.test(new URL(u).hostname));

  const jobs = [];
  if (own.length) {
    jobs.push(
      chromeGet(own).then((rows) => {
        for (const row of rows) {
          processed++;
          const dest = localPath(row.url);
          if (!row.ok) {
            record(row.url, { ok: false, status: row.status, error: row.error });
            console.log(`  FAIL ${row.status || row.error} ${row.url.slice(0, 110)}`);
            continue;
          }
          const buf = Buffer.from(row.b64, "base64");
          if (isWallStub(buf, row.ctype)) {
            record(row.url, { ok: false, error: "bot wall" });
            console.log(`  FAIL wall ${row.url.slice(0, 110)}`);
            continue;
          }
          fs.mkdirSync(path.dirname(dest), { recursive: true });
          fs.writeFileSync(dest, buf);
          record(row.url, { ok: true, bytes: buf.length, ctype: row.ctype, via: "chrome" });
          afterCss(row.url, dest);
        }
      })
    );
  }
  for (const u of ext) {
    const dest = localPath(u);
    jobs.push(
      nodeGet(u, dest).then((r) => {
        processed++;
        record(u, r);
        if (!r.ok) console.log(`  FAIL ${r.status || r.error} ${u.slice(0, 110)}`);
        else afterCss(u, dest);
      })
    );
  }
  await Promise.all(jobs);

  if (processed % 50 < BATCH) {
    const okN = results.filter((r) => r.ok).length;
    const mbN = results.reduce((a, r) => a + (r.bytes || 0), 0) / 1048576;
    console.log(`  [${processed} done, ${queue.length} queued] ${okN} ok, ${mbN.toFixed(1)} MB`);
  }
}

fs.writeFileSync(path.join(STATE, "download-results.json"), JSON.stringify(results, null, 2), "utf8");

const ok = results.filter((r) => r.ok);
const failed = results.filter((r) => !r.ok);
console.log(`\nDownloaded ${ok.length}/${results.length} — ${(ok.reduce((a, r) => a + (r.bytes || 0), 0) / 1048576).toFixed(1)} MB`);
if (failed.length) {
  const grouped = new Map();
  for (const f of failed) {
    const k = String(f.status || f.error);
    grouped.set(k, (grouped.get(k) || 0) + 1);
  }
  console.log(`\n${failed.length} failures:`);
  for (const [k, n] of [...grouped].sort((a, b) => b[1] - a[1])) console.log(`  ${n}× ${k}`);
}

ws.close();
chrome.kill();
process.exit(0);
