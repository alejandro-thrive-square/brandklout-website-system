// Step 6: serve the offline mirror locally and capture full-page screenshots.
//
// By this point nothing talks to SiteGround. recovered/mirror/ is a complete,
// self-contained copy of the 40 pages with their CSS, JS, fonts and images, and
// every URL in it is root-relative — so a plain static server is all it needs.
//
// Chrome runs with "MAP * ~NOTFOUND" after excluding loopback, which means the
// page cannot reach ANY external host. That matters: this markup came off a
// live-compromised WordPress, and the injected loaders fetch their payload at
// runtime. Here they resolve to nothing. Google Fonts and the Maps embed fail
// for the same reason, which is a fair trade and is reported per page rather
// than left silent.
//
//   node 06-shoot.mjs [--width 1440] [--only slug] [--limit N] [--settle MS]
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MIRROR = path.join(HERE, "recovered", "mirror");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";

const argv = process.argv.slice(2);
const flag = (n, d) => {
  const i = argv.indexOf(n);
  return i === -1 ? d : argv[i + 1];
};
const WIDTH = Number(flag("--width", 1440));
const ONLY = flag("--only", null);
const LIMIT = Number(flag("--limit", Infinity));
const SETTLE = Number(flag("--settle", 4500));

if (!fs.existsSync(MIRROR)) {
  console.error("no recovered/mirror — run 05-mirror.sh and extract mirror.tar.gz first");
  process.exit(1);
}

const SHOTS = path.join(HERE, "screenshots", `w${WIDTH}`);
const PAGES = path.join(HERE, "pages");
fs.mkdirSync(SHOTS, { recursive: true });
fs.mkdirSync(PAGES, { recursive: true });

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// ------------------------------------------------------------- static server
const MIME = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp",
  ".svg": "image/svg+xml", ".ico": "image/x-icon", ".cur": "image/x-icon",
  ".woff": "font/woff", ".woff2": "font/woff2", ".ttf": "font/ttf",
  ".eot": "application/vnd.ms-fontobject", ".otf": "font/otf",
  ".mp4": "video/mp4", ".txt": "text/plain; charset=utf-8", ".xml": "application/xml",
};

const missing = new Set();
const server = http.createServer((req, res) => {
  // Query strings are stripped before resolving. The CSS still asks for
  // "fontello.woff2?71212352", and those files were renamed on the way out of
  // the server because '?' cannot exist in a Windows path.
  let rel = decodeURIComponent(req.url.split("?")[0].split("#")[0]);
  rel = rel.replace(/^\/+/, "");
  let file = path.join(MIRROR, rel);
  try {
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
    else if (!fs.existsSync(file) && fs.existsSync(file + "/index.html")) file = file + "/index.html";
  } catch {}
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
    missing.add(rel || "/");
    res.writeHead(404, { "content-type": "text/plain" });
    return res.end("not in mirror");
  }
  res.writeHead(200, { "content-type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
const PORT = await new Promise((resolve) => {
  server.listen(0, "127.0.0.1", () => resolve(server.address().port));
});
console.log(`serving recovered/mirror on http://127.0.0.1:${PORT}`);

// -------------------------------------------------------------- page list
let slugs = fs
  .readdirSync(MIRROR, { withFileTypes: true })
  .filter((d) => d.isDirectory() && fs.existsSync(path.join(MIRROR, d.name, "index.html")))
  .map((d) => d.name);
if (fs.existsSync(path.join(MIRROR, "index.html"))) slugs.unshift("");
if (ONLY) slugs = slugs.filter((s) => (s || "home") === ONLY);
slugs = slugs.slice(0, LIMIT);
console.log(`${slugs.length} pages at ${WIDTH}px`);

// ----------------------------------------------------------------- chrome
// EXCLUDE before the catch-all: rules are first-match-wins, so a leading
// "MAP * ~NOTFOUND" would black-hole loopback too and every page would come
// back as ERR_NAME_NOT_RESOLVED.
const RESOLVER = "EXCLUDE 127.0.0.1, EXCLUDE localhost, MAP * ~NOTFOUND";
const CDP = 9600 + Math.floor(Math.random() * 300);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "pdk-shoot-"));
const chrome = spawn(CHROME, [
  "--headless=new", "--disable-gpu", "--hide-scrollbars",
  `--remote-debugging-port=${CDP}`, "--remote-allow-origins=*",
  `--host-resolver-rules=${RESOLVER}`,
  "--force-device-scale-factor=1", `--window-size=${WIDTH},900`,
  "--no-first-run", "--no-default-browser-check",
  "--disable-blink-features=AutomationControlled",
  `--user-data-dir=${profile}`, "about:blank",
]);
let chromeErr = "";
chrome.stderr.on("data", (d) => (chromeErr += d));

const getJSON = (p) =>
  new Promise((resolve, reject) => {
    http.get({ host: "127.0.0.1", port: CDP, path: p }, (r) => {
      let d = "";
      r.on("data", (c) => (d += c));
      r.on("end", () => resolve(JSON.parse(d)));
    }).on("error", reject);
  });

let wsUrl = null;
for (let i = 0; i < 80; i++) {
  try {
    const v = await getJSON("/json/version");
    if (v.webSocketDebuggerUrl) { wsUrl = v.webSocketDebuggerUrl; break; }
  } catch {}
  await wait(250);
}
if (!wsUrl) { console.error("Chrome CDP did not come up\n" + chromeErr.slice(0, 800)); process.exit(1); }

const ws = new WebSocket(wsUrl);
let id = 0;
const pending = new Map();
ws.addEventListener("message", (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
});
await new Promise((r) => ws.addEventListener("open", r, { once: true }));

let sessionId;
const call = (method, params, root) =>
  new Promise((resolve) => {
    const mid = ++id;
    pending.set(mid, resolve);
    ws.send(JSON.stringify({ id: mid, method, params, ...(root ? {} : { sessionId }) }));
  });
const send = (m, p = {}) => call(m, p, false);
const sendRoot = (m, p = {}) => call(m, p, true);

const { targetInfos } = await sendRoot("Target.getTargets");
let t = targetInfos.find((x) => x.type === "page");
if (!t) t = { targetId: (await sendRoot("Target.createTarget", { url: "about:blank" })).targetId };
({ sessionId } = await sendRoot("Target.attachToTarget", { targetId: t.targetId, flatten: true }));
await send("Page.enable");
await send("Runtime.enable");

const ev = async (expr) => {
  const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
  return r?.result?.value;
};

// The tooth-fairy theme holds the main menu at visibility:hidden until its JS
// adds .inited to .sc_layouts_menu. That init never completes on this broken
// install, so a naive capture yields 40 pages with no navigation — exactly the
// trap workflow 09 documented. Force it, then confirm the header is really there.
const PREP = `(async () => {
  document.querySelectorAll('.sc_layouts_menu').forEach(e => e.classList.add('inited'));
  document.querySelectorAll('[data-sm="1"], iframe[src*="yourbodybydesign"]').forEach(e => e.remove());

  // Elementor and revslider reveal on scroll, and most images are
  // loading="lazy". A single jump to the bottom fires the reveal but does not
  // give the lazy images anywhere near enough time to arrive — that capped the
  // first full run at 400 of 525 images. Step down the page instead, then wait
  // for the decode.
  const step = Math.max(400, window.innerHeight * 0.8);
  for (let y = 0; y < document.body.scrollHeight; y += step) {
    window.scrollTo(0, y);
    await new Promise(r => setTimeout(r, 120));
  }
  window.scrollTo(0, document.body.scrollHeight);

  // Force anything still deferred to load now, rather than hoping it scrolled
  // into view: eager loading plus a src assignment from the lazy attributes.
  document.querySelectorAll('img').forEach(img => {
    img.loading = 'eager';
    const lazy = img.getAttribute('data-src') || img.getAttribute('data-lazy-src');
    if (lazy && !img.src.endsWith(lazy)) img.src = lazy;
    const ss = img.getAttribute('data-srcset') || img.getAttribute('data-lazy-srcset');
    if (ss) img.srcset = ss;
  });

  await Promise.race([
    Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => {
      i.addEventListener('load', r, { once: true });
      i.addEventListener('error', r, { once: true });
    }))),
    new Promise(r => setTimeout(r, 8000)),
  ]);
  window.scrollTo(0, 0);
  return true;
})()`;

const manifest = [];
let n = 0;
for (const slug of slugs) {
  n++;
  const name = slug || "home";
  const url = `http://127.0.0.1:${PORT}/${slug ? slug + "/" : ""}`;
  missing.clear();

  await send("Page.navigate", { url });
  await wait(SETTLE);
  await ev(PREP);
  await wait(1200);
  await ev("window.scrollTo(0,0)");
  await wait(500);

  const info = await ev(`(() => {
    const html = document.documentElement.outerHTML;
    const navItems = [...document.querySelectorAll('.sc_layouts_menu a, nav a')].map(a => a.innerText.trim()).filter(Boolean);
    return {
      title: document.title,
      h1: [...document.querySelectorAll('h1')].map(h => h.innerText.trim()).slice(0,3),
      textChars: (document.body ? document.body.innerText : '').length,
      images: document.images.length,
      imagesLoaded: [...document.images].filter(i => i.complete && i.naturalWidth > 0).length,
      navCount: navItems.length,
      navSample: navItems.slice(0, 8),
      height: document.documentElement.scrollHeight,
      ioc: {
        overlay: !!document.querySelector('div[data-sm="1"], iframe[src*="yourbodybydesign"]'),
        ybd: html.includes('yourbodybydesign'),
        cdnSbs: html.includes('webanalytics-cdn.sbs'),
      },
    };
  })()`);

  const dir = path.join(PAGES, name);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "rendered.html"), (await ev("document.documentElement.outerHTML")) || "");
  fs.writeFileSync(path.join(dir, "rendered.txt"), (await ev("document.body ? document.body.innerText : ''")) || "");

  await send("Emulation.setDeviceMetricsOverride", {
    width: WIDTH, height: Math.min(info?.height || 900, 30000),
    deviceScaleFactor: 1, mobile: false,
  });
  await wait(500);
  const shot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
  if (shot?.data) fs.writeFileSync(path.join(SHOTS, name + ".png"), Buffer.from(shot.data, "base64"));
  await send("Emulation.clearDeviceMetricsOverride");

  const rec = { slug: name, url, ...info, missingAssets: [...missing].slice(0, 20), missingCount: missing.size,
                screenshot: shot?.data ? `screenshots/w${WIDTH}/${name}.png` : null };
  fs.writeFileSync(path.join(dir, "meta.json"), JSON.stringify(rec, null, 2));
  manifest.push(rec);

  const warn = [];
  if (!info?.navCount) warn.push("NO NAV");
  if (info?.ioc?.overlay || info?.ioc?.ybd || info?.ioc?.cdnSbs) warn.push("IOC");
  if (missing.size) warn.push(`${missing.size} missing`);
  console.log(
    `  [${String(n).padStart(2)}/${slugs.length}] ${name.padEnd(38).slice(0, 38)}` +
      `${String(info?.textChars ?? 0).padStart(6)} chars  ${String(info?.height ?? 0).padStart(6)}px  ` +
      `img ${info?.imagesLoaded ?? 0}/${info?.images ?? 0}  nav ${info?.navCount ?? 0}` +
      (warn.length ? "  <- " + warn.join(", ") : "")
  );
}

fs.writeFileSync(
  path.join(HERE, `shoot-manifest-w${WIDTH}.json`),
  JSON.stringify({ shotAt: new Date().toISOString(), width: WIDTH, pages: manifest }, null, 2)
);

const noNav = manifest.filter((m) => !m.navCount);
const withIoc = manifest.filter((m) => m.ioc?.overlay || m.ioc?.ybd || m.ioc?.cdnSbs);
console.log(`\n${manifest.length} pages captured to screenshots/w${WIDTH}/`);
console.log(noNav.length ? `!! ${noNav.length} pages with no navigation: ${noNav.map((m) => m.slug).join(", ")}` : "all pages have navigation");
console.log(withIoc.length ? `!! ${withIoc.length} pages carry injection markers` : "no injection markers in any page");

ws.close();
chrome.kill();
server.close();
setTimeout(() => process.exit(0), 400);
