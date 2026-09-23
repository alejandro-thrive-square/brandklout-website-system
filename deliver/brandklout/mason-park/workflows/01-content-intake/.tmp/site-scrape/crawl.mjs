// Full-site crawler for bestdentistinkatytx.com (Mason Park Dental).
//
// The site sits behind SiteGround's `sgcaptcha` bot wall, so plain HTTP gets a
// 202 + meta-refresh instead of content. Everything therefore runs through a
// real Chrome over CDP: the wall resolves itself, sets a cookie, and every
// later request rides that session.
//
// Per page it writes pages/<slug>/{rendered.html,rendered.txt,meta.json} and
// harvests EVERY asset URL it can see — not just <img src>. That means srcset
// candidates, lazy-load data-* attributes, <video>/<source>/poster, computed
// CSS background/mask/border-image/content on every element and both pseudo
// elements, inline style url(), <link>/<script>, og:image, and the browser's
// own resource-timing log (which catches fonts and anything JS pulled in).
//
// Output state for the download phase lands in .state/.
//
//   node crawl.mjs [--limit N] [--settle MS]
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = "https://bestdentistinkatytx.com";
const HOSTS = new Set(["bestdentistinkatytx.com", "www.bestdentistinkatytx.com", "masonparkdental.com"]);
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";

const argv = process.argv.slice(2);
const flag = (name, def) => {
  const i = argv.indexOf(name);
  return i === -1 ? def : Number(argv[i + 1]);
};
const LIMIT = flag("--limit", Infinity);
const SETTLE = flag("--settle", 5000);

const STATE = path.join(HERE, ".state");
const PAGES = path.join(HERE, "pages");
fs.mkdirSync(STATE, { recursive: true });
fs.mkdirSync(PAGES, { recursive: true });

// ---------------------------------------------------------------- CDP plumbing
const PORT = 9400 + Math.floor(Math.random() * 400);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "mpd-scrape-"));
const chrome = spawn(CHROME, [
  "--headless=new",
  "--disable-gpu",
  "--hide-scrollbars",
  `--remote-debugging-port=${PORT}`,
  "--remote-allow-origins=*",
  "--force-device-scale-factor=1",
  "--window-size=1600,1000",
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
  for (let i = 0; i < 60; i++) {
    try {
      const v = await getJSON("/json/version");
      if (v.webSocketDebuggerUrl) return v.webSocketDebuggerUrl;
    } catch {}
    await wait(200);
  }
  throw new Error("Chrome CDP did not come up\n" + chromeErr.slice(0, 800));
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

let sessionId;
function send(method, params = {}) {
  return new Promise((resolve) => {
    const mid = ++id;
    pending.set(mid, resolve);
    ws.send(JSON.stringify({ id: mid, method, params, sessionId }));
  });
}
function sendRoot(method, params = {}) {
  return new Promise((resolve) => {
    const mid = ++id;
    pending.set(mid, resolve);
    ws.send(JSON.stringify({ id: mid, method, params }));
  });
}

const { targetInfos } = await sendRoot("Target.getTargets");
let pageTarget = targetInfos.find((t) => t.type === "page");
if (!pageTarget) {
  const created = await sendRoot("Target.createTarget", { url: "about:blank" });
  pageTarget = { targetId: created.targetId };
}
({ sessionId } = await sendRoot("Target.attachToTarget", {
  targetId: pageTarget.targetId,
  flatten: true,
}));
await send("Page.enable");
await send("Runtime.enable");
await send("Network.enable");
await send("Network.setUserAgentOverride", {
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  acceptLanguage: "en-US,en;q=0.9",
});

const evaluate = async (expression) => {
  const r = await send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (r?.exceptionDetails) {
    console.log("  ! eval error:", r.exceptionDetails.text ?? r.exceptionDetails.exception?.description);
  }
  return r?.result?.value;
};

// Chrome also sees every response go by; that is a second net under the
// in-page harvest, and it catches redirect targets and XHR-loaded media.
const seenResponses = new Map(); // url -> {status, mimeType}
ws.addEventListener("message", (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.method === "Network.responseReceived") {
    const r = msg.params.response;
    if (r?.url && !r.url.startsWith("data:")) {
      seenResponses.set(r.url, { status: r.status, mimeType: r.mimeType, type: msg.params.type });
    }
  }
});

// ------------------------------------------------------------- bot wall + nav
// SiteGround serves a proof-of-work interstitial titled "Robot Challenge
// Screen" whose body reads "Checking the site connection security" — it does
// NOT say sgcaptcha anywhere a text match would find it. It solves itself in a
// few seconds inside a real browser, so poll for real content rather than
// sleeping a fixed amount and hoping.
const WALLED = (title, url) =>
  /robot challenge|just a moment|attention required|checking your browser/i.test(title || "") ||
  /\/\.well-known\/(sgcaptcha|captcha)/.test(url || "");

async function goto(url, settle = SETTLE) {
  for (let attempt = 0; attempt < 3; attempt++) {
    await send("Page.navigate", { url });
    await wait(Math.min(settle, 2500));
    for (let i = 0; i < 30; i++) {
      const title = await evaluate("document.title");
      const here = await evaluate("location.href");
      if (!WALLED(title, here) && title) {
        // Give the real page the rest of its settle budget to paint and lazy-load.
        await wait(Math.max(0, settle - 2500));
        return (await evaluate("document.body ? document.body.innerText : ''")) || "";
      }
      if (i === 0) console.log("  … bot wall, waiting it out");
      await wait(2000);
    }
    console.log(`  ! still walled after 60s (attempt ${attempt + 1}/3), backing off`);
    await wait(15000);
  }
  return "";
}

console.log("Warming the session against the bot wall…");
await goto(SITE + "/", 8000);
const warmTitle = await evaluate("document.title");
console.log("  session ready — title:", warmTitle);
if (WALLED(warmTitle, await evaluate("location.href"))) {
  console.error("Could not clear the bot wall; aborting rather than scraping challenge pages.");
  process.exit(2);
}

// ---------------------------------------------------------------- URL discovery
// Fetch runs inside the page, so it carries the wall cookie that plain curl lacks.
async function fetchText(url) {
  return await evaluate(`(async () => {
    try {
      const r = await fetch(${JSON.stringify(url)}, { credentials: 'include' });
      if (!r.ok) return null;
      return await r.text();
    } catch (e) { return null; }
  })()`);
}

const locs = (xml) => [...String(xml).matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((m) => m[1].trim());

async function discover() {
  const found = new Set();
  const candidates = ["/sitemap_index.xml", "/wp-sitemap.xml", "/sitemap.xml", "/page-sitemap.xml"];
  for (const c of candidates) {
    const xml = await fetchText(SITE + c);
    if (!xml || !xml.includes("<loc>")) continue;
    console.log(`  sitemap ${c} → ${locs(xml).length} entries`);
    for (const loc of locs(xml)) {
      if (/\.xml$/i.test(loc)) {
        const child = await fetchText(loc);
        if (!child) continue;
        const kids = locs(child);
        console.log(`    ↳ ${loc.replace(SITE, "")} → ${kids.length}`);
        kids.forEach((k) => found.add(k));
      } else {
        found.add(loc);
      }
    }
    if (found.size) break;
  }
  return [...found];
}

console.log("\nDiscovering URLs…");
const sitemapUrls = await discover();
console.log(`  sitemap gave ${sitemapUrls.length} URLs`);

const normalise = (u) => {
  try {
    const x = new URL(u);
    x.hash = "";
    if (x.pathname !== "/" && x.pathname.endsWith("/")) x.pathname = x.pathname.slice(0, -1);
    return x.href;
  } catch {
    return null;
  }
};
const isPage = (u) => {
  try {
    const x = new URL(u);
    if (!HOSTS.has(x.hostname)) return false;
    if (/\.(jpe?g|png|gif|webp|svg|avif|pdf|mp4|webm|mov|zip|css|js|ico|xml|json|txt|docx?|xlsx?)$/i.test(x.pathname))
      return false;
    if (/^\/(wp-content|wp-admin|wp-json|wp-includes|feed)/i.test(x.pathname)) return false;
    if (x.pathname.includes("/.well-known/")) return false;
    // The sitemap is authoritative for content. Link-crawl additions beyond it
    // are archives, pagination and filters that only re-serve the same posts,
    // so keep them out rather than letting the queue grow without bound.
    if (x.search) return false;
    if (/\/(page|author|tag)\/|\/feed\/?$|\/amp\/?$/i.test(x.pathname)) return false;
    return true;
  } catch {
    return false;
  }
};

const queue = [];
const queued = new Set();
const enqueue = (u) => {
  const n = normalise(u);
  if (n && isPage(n) && !queued.has(n)) {
    queued.add(n);
    queue.push(n);
  }
};
enqueue(SITE + "/");
sitemapUrls.forEach(enqueue);

// ---------------------------------------------------------------- the harvester
const HARVEST = `(() => {
  const out = new Set();
  const push = (u) => {
    if (!u) return;
    u = String(u).trim();
    if (!u || u.startsWith('data:') || u.startsWith('blob:') || u.startsWith('javascript:') || u.startsWith('about:') || u.startsWith('#')) return;
    try { const x = new URL(u, location.href); x.hash = ''; out.add(x.href); } catch (e) {}
  };
  const pushSrcset = (v) => {
    if (!v) return;
    String(v).split(',').forEach((part) => push(part.trim().split(/\\s+/)[0]));
  };
  const pushCss = (v) => {
    if (!v || v === 'none') return;
    const re = /url\\((['"]?)([^'")]+)\\1\\)/g;
    let m;
    while ((m = re.exec(v))) push(m[2]);
  };

  // 1. Everything the browser actually fetched — fonts, XHR media, JS-injected art.
  try { performance.getEntriesByType('resource').forEach((e) => push(e.name)); } catch (e) {}

  // 2. Images, including every srcset candidate and the lazy-load attributes.
  document.querySelectorAll('img').forEach((i) => {
    push(i.currentSrc); push(i.getAttribute('src'));
    ['data-src','data-lazy-src','data-original','data-lazy','data-echo','data-bg','data-large_image','data-full-url','data-thumb'].forEach((a) => push(i.getAttribute(a)));
    pushSrcset(i.getAttribute('srcset'));
    pushSrcset(i.getAttribute('data-srcset'));
    pushSrcset(i.getAttribute('data-lazy-srcset'));
  });
  document.querySelectorAll('source').forEach((s) => {
    push(s.getAttribute('src'));
    pushSrcset(s.getAttribute('srcset'));
    pushSrcset(s.getAttribute('data-srcset'));
  });

  // 3. Video and audio, with posters.
  document.querySelectorAll('video, audio').forEach((v) => {
    push(v.getAttribute('src')); push(v.currentSrc); push(v.getAttribute('poster'));
    ['data-src','data-video-src','data-mp4','data-webm'].forEach((a) => push(v.getAttribute(a)));
  });

  // 4. Head resources and social art.
  document.querySelectorAll('link[href]').forEach((l) => {
    const rel = (l.getAttribute('rel') || '').toLowerCase();
    if (/stylesheet|icon|preload|prefetch|apple-touch|mask-icon|manifest|image_src/.test(rel)) push(l.getAttribute('href'));
  });
  document.querySelectorAll('script[src]').forEach((s) => push(s.getAttribute('src')));
  document.querySelectorAll('meta[property="og:image"], meta[property="og:image:secure_url"], meta[name="twitter:image"], meta[itemprop="image"], meta[property="og:video"]').forEach((m) => push(m.getAttribute('content')));

  // 5. CSS art that is actually applied — element plus both pseudo elements.
  const props = ['backgroundImage','maskImage','webkitMaskImage','borderImageSource','listStyleImage','content','cursor','shapeOutside'];
  const els = document.querySelectorAll('*');
  for (const el of els) {
    for (const pseudo of [null, '::before', '::after']) {
      let cs;
      try { cs = getComputedStyle(el, pseudo); } catch (e) { continue; }
      if (!cs) continue;
      for (const p of props) pushCss(cs[p]);
    }
  }
  document.querySelectorAll('[style]').forEach((el) => pushCss(el.getAttribute('style')));

  // 6. Anything hiding in an attribute — embeds live in data-* and href, not just iframe src.
  for (const el of els) {
    for (const at of el.attributes) {
      if (!/^(data-|href$|src$|content$|value$|action$)/.test(at.name)) continue;
      const v = at.value || '';
      if (/^(https?:)?\\/\\//.test(v) || v.startsWith('/wp-content/') || v.startsWith('/wp-includes/')) {
        if (/\\.(jpe?g|png|gif|webp|svg|avif|ico|mp4|webm|ogv|mov|m4v|mp3|wav|m4a|pdf|woff2?|ttf|otf|eot|css|js|json|zip|docx?|xlsx?)(\\?|$)/i.test(v)) push(v);
      }
      if (/url\\(/.test(v)) pushCss(v);
    }
  }

  const iframes = [...document.querySelectorAll('iframe')].map((f) => f.getAttribute('src') || f.getAttribute('data-src') || '').filter(Boolean);
  const links = [...document.querySelectorAll('a[href]')].map((a) => a.href);

  return JSON.stringify({ assets: [...out], iframes, links });
})()`;

const META = `JSON.stringify({
  url: location.href,
  title: document.title,
  description: (document.querySelector('meta[name=description]') || {}).content || '',
  canonical: (document.querySelector('link[rel=canonical]') || {}).href || '',
  robots: (document.querySelector('meta[name=robots]') || {}).content || '',
  ogTitle: (document.querySelector('meta[property="og:title"]') || {}).content || '',
  ogImage: (document.querySelector('meta[property="og:image"]') || {}).content || '',
  headings: [...document.querySelectorAll('h1,h2,h3,h4')].map((h) => h.tagName + ': ' + h.innerText.trim().replace(/\\s+/g, ' ')).slice(0, 200),
  phones: [...new Set([...document.querySelectorAll('a[href^="tel:"]')].map((a) => a.getAttribute('href')))],
  emails: [...new Set([...document.querySelectorAll('a[href^="mailto:"]')].map((a) => a.getAttribute('href')))],
  forms: [...document.querySelectorAll('form')].map((f) => ({ action: f.action, method: f.method, id: f.id, cls: f.className })),
  imgCount: document.querySelectorAll('img').length,
  videoCount: document.querySelectorAll('video').length,
  iframeCount: document.querySelectorAll('iframe').length,
  fonts: [...new Set([...document.querySelectorAll('h1,h2,h3,p,a,body,button')].map((e) => getComputedStyle(e).fontFamily))],
  bodyBg: getComputedStyle(document.body).backgroundColor,
  bodyColor: getComputedStyle(document.body).color,
  jsonld: [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => s.textContent)
}, null, 2)`;

const SCROLL = `(async () => {
  const step = Math.max(300, innerHeight * 0.75);
  for (let y = 0; y < document.body.scrollHeight; y += step) {
    scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 140));
  }
  scrollTo(0, document.body.scrollHeight);
  await new Promise((r) => setTimeout(r, 600));
  scrollTo(0, 0);
  await new Promise((r) => setTimeout(r, 400));
  // Force-load anything still lazy after the scroll pass.
  document.querySelectorAll('img[loading="lazy"]').forEach((i) => { i.loading = 'eager'; });
  document.querySelectorAll('video[preload="none"]').forEach((v) => { v.preload = 'metadata'; try { v.load(); } catch (e) {} });
  await new Promise((r) => setTimeout(r, 1200));
  return document.body.scrollHeight;
})()`;

const slugify = (u) => {
  const p = new URL(u).pathname.replace(/^\/|\/$/g, "");
  return (p.toLowerCase().replace(/[^a-z0-9._-]+/g, "-") || "home").slice(0, 120);
};

// ---------------------------------------------------------------------- crawl
const assetPages = new Map(); // asset url -> Set(page slug)
const iframeSrc = new Map();
const records = [];
let done = 0;

while (queue.length && done < LIMIT) {
  const url = queue.shift();
  done++;
  console.log(`[${done}/${queued.size}] ${url}`);

  const body = await goto(url);
  const finalUrl = (await evaluate("location.href")) || url;
  const finalTitle = (await evaluate("document.title")) || "";
  if (WALLED(finalTitle, finalUrl)) {
    console.log("  ! never cleared the wall, skipping");
    records.push({ url, error: "bot wall" });
    continue;
  }
  if (!body || body.trim().length < 40) {
    console.log("  ! empty body, skipping");
    records.push({ url, error: "empty body" });
    continue;
  }

  await evaluate(SCROLL);

  const slug = slugify(finalUrl);
  const dir = path.join(PAGES, slug);
  fs.mkdirSync(dir, { recursive: true });

  const html = await evaluate("document.documentElement.outerHTML");
  const text = await evaluate("document.body.innerText");
  const metaRaw = await evaluate(META);
  fs.writeFileSync(path.join(dir, "rendered.html"), html || "", "utf8");
  fs.writeFileSync(path.join(dir, "rendered.txt"), text || "", "utf8");
  fs.writeFileSync(path.join(dir, "meta.json"), metaRaw || "{}", "utf8");

  let harvested = { assets: [], iframes: [], links: [] };
  try {
    harvested = JSON.parse((await evaluate(HARVEST)) || "{}");
  } catch (e) {
    console.log("  ! harvest parse failed:", e.message);
  }

  for (const a of harvested.assets || []) {
    if (!assetPages.has(a)) assetPages.set(a, new Set());
    assetPages.get(a).add(slug);
  }
  for (const f of harvested.iframes || []) {
    if (!iframeSrc.has(f)) iframeSrc.set(f, new Set());
    iframeSrc.get(f).add(slug);
  }
  (harvested.links || []).forEach(enqueue);

  // Files linked but never rendered (menus, brochures, direct media links).
  for (const l of harvested.links || []) {
    if (/\.(pdf|mp4|webm|mov|docx?|xlsx?|zip|jpe?g|png|webp|svg|gif|avif)(\?|$)/i.test(l)) {
      if (!assetPages.has(l)) assetPages.set(l, new Set());
      assetPages.get(l).add(slug);
    }
  }

  let meta = {};
  try {
    meta = JSON.parse(metaRaw || "{}");
  } catch {}
  records.push({
    url: finalUrl,
    requested: url,
    slug,
    title: meta.title || "",
    description: meta.description || "",
    words: (text || "").split(/\s+/).filter(Boolean).length,
    assets: (harvested.assets || []).length,
    imgCount: meta.imgCount ?? 0,
    videoCount: meta.videoCount ?? 0,
    iframeCount: meta.iframeCount ?? 0,
  });
  console.log(
    `  ✓ ${slug} — ${records.at(-1).words} words, ${harvested.assets.length} asset refs, ${meta.imgCount ?? 0} img, ${meta.videoCount ?? 0} video, queue ${queue.length}`
  );

  await wait(700); // be polite; the site asks for a crawl delay
}

// Everything Chrome saw fly past, as a backstop for the in-page harvest.
for (const [u, info] of seenResponses) {
  if (info.status >= 400) continue;
  if (!assetPages.has(u)) assetPages.set(u, new Set(["(network-log)"]));
}

const { cookies } = await send("Network.getAllCookies");

const assetsOut = [...assetPages.entries()].map(([url, pages]) => ({ url, pages: [...pages] }));
fs.writeFileSync(path.join(STATE, "assets.json"), JSON.stringify(assetsOut, null, 2), "utf8");
fs.writeFileSync(path.join(STATE, "cookies.json"), JSON.stringify(cookies, null, 2), "utf8");
fs.writeFileSync(path.join(STATE, "pages.json"), JSON.stringify(records, null, 2), "utf8");
fs.writeFileSync(
  path.join(STATE, "iframes.json"),
  JSON.stringify([...iframeSrc.entries()].map(([url, pages]) => ({ url, pages: [...pages] })), null, 2),
  "utf8"
);

console.log(`\nCrawled ${records.length} pages. ${assetsOut.length} distinct asset URLs harvested.`);
ws.close();
chrome.kill();
process.exit(0);
