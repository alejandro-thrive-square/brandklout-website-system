// Client script, 2026-09-30. Verbatim file:// mirror of a Webflow site.
//
// Why not the step's mirror-site.mjs: it is WordPress-shaped. It follows only absolute same-origin
// hrefs (Webflow writes root-relative ones, so it stopped after the home page), it only brings
// /wp-content and /wp-includes assets local (Webflow serves everything from
// cdn.prod.website-files.com), and its media-library pass throws on a site with no /wp-json.
//
// What this does:
//   - pages: every URL in scrape/site-data.json, every same-origin <a href> found on the way, and
//     the Webflow 404 page (saved as 404.html).
//   - assets: every URL on the hosts in LOCAL_HOSTS, wherever it sits in the markup (src, srcset,
//     inline style, data-video-urls, JSON in data attributes), plus url() inside the stylesheets.
//     A file extract_assets already downloaded is copied, not fetched again.
//   - trackers and embeds (GTM, Termly, Ahrefs, LeadConnector, Maps) stay absolute: they are
//     evidence, and scan-mirror.mjs lists them.
//   - raw-html/ keeps each page byte for byte as served.
//
// Layout: <out>/site/<path>.html (not <path>/index.html) and <out>/site/_ext/<bucket>/<short name>.
// Short names because the step output folder is ~180 characters deep and Windows MAX_PATH is 260.
//
// Usage (from the step's output/ folder; never pipe Node on Windows):
//   node code/mirror-webflow.mjs --origin https://www.old.com --out mirror --site-data scrape/site-data.json --assets assets > mirror.log
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const argv = (n) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : null; };
if (!argv("origin") || !argv("out")) {
  console.error("usage: node mirror-webflow.mjs --origin https://www.old.com --out <dir> [--site-data scrape/site-data.json] [--assets assets]");
  process.exit(2);
}
const ORIGIN = argv("origin").replace(/\/$/, "");
const OUT = path.resolve(argv("out"));
const SITE = path.join(OUT, "site");
const RAW = path.join(OUT, "raw-html");
const APEX = new URL(ORIGIN).hostname.replace(/^www\./, "");
const HOSTS = new Set([APEX, `www.${APEX}`]);
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
const MAX_PAGES = 400;

const LOCAL_HOSTS = {
  "cdn.prod.website-files.com": "wf",
  "uploads-ssl.webflow.com": "wf",
  "assets.website-files.com": "wf",
  "d3e54v103j8qbb.cloudfront.net": "cf",
  "cdn.jsdelivr.net": "jsd",
  "cdnjs.cloudflare.com": "cdnjs",
  "unpkg.com": "unpkg",
  "ajax.googleapis.com": "gajax",
  "fonts.googleapis.com": "gfonts",
  "fonts.gstatic.com": "gstatic",
};
const HOST_ALT = Object.keys(LOCAL_HOSTS).map((h) => h.split(".").join("[.]")).join("|");
// Commas end a URL (srcset, data-video-urls) except on Google Fonts, whose css2 queries use them.
const URL_RE = new RegExp(`https?://(?:${HOST_ALT})/[^\\s"'<>\\\\]+`, "g");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const sha = (s, n = 6) => crypto.createHash("sha1").update(s).digest("hex").slice(0, n);
const decodeEntities = (s) => s.replace(/&amp;/g, "&").replace(/&#0?38;/g, "&");

async function get(url, { binary = false, tries = 3, allow404 = false } = {}) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, {
        headers: { "user-agent": UA, "accept-language": "en-US,en;q=0.9", accept: "*/*", referer: ORIGIN + "/" },
        redirect: "follow",
      });
      if (!res.ok && !(allow404 && res.status === 404)) {
        const err = new Error(`HTTP ${res.status}`);
        if (res.status === 403 || res.status === 404) { lastErr = err; break; }
        throw err;
      }
      const body = binary ? Buffer.from(await res.arrayBuffer()) : await res.text();
      return { body, type: res.headers.get("content-type") || "", finalUrl: res.url, status: res.status };
    } catch (e) {
      lastErr = e;
      await sleep(600 * (i + 1));
    }
  }
  throw lastErr;
}

// ---------------------------------------------------------------- local names
const taken = new Map(); // lower-case rel -> url
function assetRel(absUrl) {
  const u = new URL(absUrl);
  const bucket = LOCAL_HOSTS[u.hostname];
  let name = decodeURIComponent(u.pathname).split("/").pop() || "index";
  const wf = name.match(/^([0-9a-f]{24})_(.+)$/);
  const tag = wf ? wf[1].slice(-6) : sha(u.origin + u.pathname);
  if (wf) name = wf[2];
  let ext = path.extname(name);
  let stem = ext ? name.slice(0, -ext.length) : name;
  if (!ext && u.hostname === "fonts.googleapis.com") ext = ".css";
  if (!ext && /\/npm\/|\/gh\//.test(u.pathname)) ext = ".js";
  let variant = "";
  const v = stem.match(/^(.+?)(-p-\d{3,4})$/);
  if (v) { stem = v[1]; variant = v[2]; }
  // No spaces (srcset splits on them) and no % or # (the name is written into the HTML as is).
  stem = stem.replace(/[^A-Za-z0-9._-]+/g, "-").slice(0, 30).replace(/[-.]+$/, "");
  ext = ext.replace(/[^A-Za-z0-9.]+/g, "");
  let file = `${tag}_${stem}${variant}${ext}`;
  if (u.search) file = `${sha(u.search, 4)}-${file}`;
  let rel = `_ext/${bucket}/${file}`;
  const key = rel.toLowerCase();
  if (taken.has(key) && taken.get(key) !== absUrl) rel = `_ext/${bucket}/${sha(absUrl, 4)}-${file}`;
  taken.set(rel.toLowerCase(), absUrl);
  return rel;
}

function pageRel(pathname) {
  const clean = decodeURIComponent(pathname).replace(/\/+$/, "").replace(/^\//, "");
  return clean ? `${clean}.html` : "index.html";
}
const depthOf = (rel) => rel.split("/").length - 1;
const relFrom = (fromRel, toRel) => "../".repeat(depthOf(fromRel)) + toRel;

// ---------------------------------------------------------------- already-downloaded assets
const have = new Map(); // url -> absolute file
if (argv("assets")) {
  const dir = path.resolve(argv("assets"));
  const csv = path.join(dir, "asset-manifest.csv");
  if (fs.existsSync(csv)) {
    for (const line of fs.readFileSync(csv, "utf8").split(/\r?\n/).slice(1)) {
      const m = line.match(/^(https?:\/\/[^,]+),("?)([^,"]*)\2,/);
      if (m && m[3]) {
        const f = path.join(dir, m[3]);
        if (fs.existsSync(f)) have.set(m[1], f);
      }
    }
  }
  console.log(`asset manifest: ${have.size} files already on disk`);
}

// ---------------------------------------------------------------- assets
const assets = new Map(); // key url -> { rel, status, bytes, from, error }
const trimUrl = (raw) => {
  let u = raw;
  const q = u.search(/&quot;|&#x27;|&#39;|&gt;|&lt;/);
  if (q >= 0) u = u.slice(0, q);
  if (!/^https?:\/\/fonts[.]googleapis[.]com\//.test(u)) { const c = u.indexOf(","); if (c >= 0) u = u.slice(0, c); }
  // url(https://host/a%20(1).png): a closing paren with no opener belongs to the CSS, not the URL
  let open = 0;
  for (let i = 0; i < u.length; i++) {
    if (u[i] === "(") open++;
    else if (u[i] === ")" && --open < 0) { u = u.slice(0, i); break; }
  }
  return u.replace(/[;.]+$/, "");
};

async function fetchAsset(rawUrl, from) {
  const abs = decodeEntities(rawUrl).split("#")[0];
  if (assets.has(abs)) return assets.get(abs);
  const rec = { rel: assetRel(abs), status: "pending", bytes: 0, from };
  assets.set(abs, rec);
  const file = path.join(SITE, ...rec.rel.split("/"));
  fs.mkdirSync(path.dirname(file), { recursive: true });
  try {
    const isCss = rec.rel.endsWith(".css");
    if (!isCss && have.has(abs)) {
      fs.copyFileSync(have.get(abs), file);
      rec.status = "copied";
    } else {
      const { body } = await get(abs, { binary: !isCss });
      if (isCss) {
        const rawFile = path.join(RAW, "_css", path.basename(rec.rel));
        fs.mkdirSync(path.dirname(rawFile), { recursive: true });
        fs.writeFileSync(rawFile, body);
        fs.writeFileSync(file, await rewriteCss(body, abs, rec.rel));
      } else {
        if (!body.length) throw new Error("empty body");
        fs.writeFileSync(file, body);
      }
      rec.status = "ok";
    }
    rec.bytes = fs.statSync(file).size;
  } catch (e) {
    rec.status = "fail";
    rec.error = e.message;
    console.log(`  asset FAIL ${abs}: ${e.message}  <- ${from}`);
  }
  return rec;
}

async function rewriteCss(css, cssUrl, cssRel) {
  const refs = new Map();
  for (const m of css.matchAll(/url\(\s*(['"]?)([^)'"]+)\1\s*\)/g)) {
    const ref = m[2].trim();
    if (!ref || ref.startsWith("data:") || ref.startsWith("#")) continue;
    let abs;
    try { abs = new URL(ref, cssUrl).href; } catch { continue; }
    if (!LOCAL_HOSTS[new URL(abs).hostname]) continue;
    refs.set(ref, abs);
  }
  for (const m of css.matchAll(/@import\s+(?:url\()?["']([^"']+)["']/g)) {
    try { const abs = new URL(m[1], cssUrl).href; if (LOCAL_HOSTS[new URL(abs).hostname]) refs.set(m[1], abs); } catch {}
  }
  const jobs = [...new Set(refs.values())];
  for (let i = 0; i < jobs.length; i += 6) await Promise.all(jobs.slice(i, i + 6).map((u) => fetchAsset(u, cssRel)));
  const local = (ref) => {
    const rec = refs.has(ref) && assets.get(decodeEntities(refs.get(ref)).split("#")[0]);
    return rec && rec.status !== "fail" ? relFrom(cssRel, rec.rel) : null;
  };
  return css
    .replace(/url\(\s*(['"]?)([^)'"]+)\1\s*\)/g, (m, q, ref) => { const l = local(ref.trim()); return l ? `url(${q}${l}${q})` : m; })
    .replace(/(@import\s+(?:url\()?["'])([^"']+)(["'])/g, (m, a, ref, b) => { const l = local(ref); return l ? a + l + b : m; });
}

// ---------------------------------------------------------------- pages
const pages = new Map(); // pathname -> { rel, status, title, bytes, redirect }
const queue = [];
const seen = new Set();
function enqueuePage(pathname) {
  pathname = pathname.replace(/[?#].*$/, "").replace(/\/+$/, "") || "/";
  if (!pathname.startsWith("/")) return;
  if (/\.(xml|txt|json|jpe?g|png|gif|webp|avif|svg|pdf|mp4|webm|css|js|ico|zip)$/i.test(pathname)) return;
  if (seen.has(pathname)) return;
  seen.add(pathname);
  queue.push(pathname);
}

enqueuePage("/");
if (argv("site-data") && fs.existsSync(argv("site-data"))) {
  for (const r of JSON.parse(fs.readFileSync(argv("site-data"), "utf8"))) {
    try { const u = new URL(r.url); if (HOSTS.has(u.hostname)) enqueuePage(u.pathname); } catch {}
  }
}
console.log(`seeded ${queue.length} pages`);

const A_RE = /<a\b[^>]*>/gi;
function sameOriginPath(href) {
  const h = decodeEntities(href.trim());
  if (!/^(\/(?!\/)|https?:\/\/)/i.test(h)) return null; // already-local asset paths, #, mailto:, tel:
  let u;
  try { u = new URL(h, ORIGIN + "/"); } catch { return null; }
  if (!HOSTS.has(u.hostname) || !/^https?:$/.test(u.protocol)) return null;
  if (u.search) return null; // pagination and search stay live
  return { pathname: u.pathname, hash: u.hash };
}

async function mirrorPage(pathname, { as404 = false } = {}) {
  const rel = as404 ? "404.html" : pageRel(pathname);
  const { body, finalUrl, status } = await get(ORIGIN + pathname, { allow404: as404 });
  const finalPath = new URL(finalUrl).pathname.replace(/\/+$/, "") || "/";
  if (!as404 && finalPath !== pathname) {
    console.log(`  redirect ${pathname} -> ${finalPath}`);
    pages.set(pathname, { rel, status: "redirect", redirect: finalPath });
    enqueuePage(finalPath);
    return;
  }
  const rawFile = path.join(RAW, ...rel.split("/"));
  fs.mkdirSync(path.dirname(rawFile), { recursive: true });
  fs.writeFileSync(rawFile, body);

  // data-video-urls="a.mp4,b.webm" is one regex match holding two URLs
  const parts = (m) => (/^https?:\/\/fonts[.]googleapis[.]com\//.test(m) ? [m] : m.split(","));
  const found = [...new Set([...body.matchAll(URL_RE)].flatMap((m) => parts(m[0])).filter((s) => /^https?:\/\//.test(s)).map(trimUrl))].filter((u) => {
    try { return new URL(decodeEntities(u)).pathname.length > 1; } catch { return false; }
  });
  for (let i = 0; i < found.length; i += 6) await Promise.all(found.slice(i, i + 6).map((u) => fetchAsset(u, rel)));

  let html = body.replace(URL_RE, (m) => parts(m).map((part) => {
    if (!/^https?:\/\//.test(part)) return part;
    const u = trimUrl(part);
    const rec = assets.get(decodeEntities(u).split("#")[0]);
    if (!rec || rec.status === "fail") return part;
    return relFrom(rel, rec.rel) + part.slice(u.length);
  }).join(","));
  // A rewritten stylesheet or a file:// script no longer matches its hash or passes CORS.
  // A module script stays remote: file:// modules are blocked by CORS, and a code-split one
  // (Finsweet Attributes) imports chunks by relative path that were never in the markup.
  const byRel = new Map([...assets].map(([url, a]) => [a.rel, url]));
  html = html.replace(/<(?:link|script)\b[^>]*>/gi, (tag) => {
    const m = tag.match(/\s(?:href|src)="((?:[.][.]\/)*)(_ext\/[^"]+)"/);
    if (!m) return tag;
    if (/^<script\b/i.test(tag) && /\stype=["']module["']/i.test(tag) && byRel.has(m[2])) return tag.replace(m[1] + m[2], byRel.get(m[2]));
    return tag.replace(/\s(?:integrity|crossorigin)(?:="[^"]*")?/gi, "");
  });
  html = html.replace(A_RE, (tag) =>
    tag.replace(/(\shref=)(["'])([^"']*)\2/i, (m, a, q, href) => {
      const t = sameOriginPath(href);
      if (!t) return m;
      enqueuePage(t.pathname);
      return m; // rewritten in the link pass, once every page is known
    }));

  const file = path.join(SITE, ...rel.split("/"));
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
  const title = (body.match(/<title>([^<]*)<\/title>/i) || [, ""])[1].trim();
  pages.set(pathname, { rel, status: as404 ? "404-page" : "ok", http: status, title, bytes: body.length });
  console.log(`page ${pages.size} ${pathname} (${body.length} b, ${found.length} asset urls) "${title.slice(0, 60)}"`);
}

while (queue.length && pages.size < MAX_PAGES) {
  const pathname = queue.shift();
  try {
    await mirrorPage(pathname);
  } catch (e) {
    pages.set(pathname, { rel: pageRel(pathname), status: "fail", error: e.message });
    console.log(`  page FAIL ${pathname}: ${e.message}`);
  }
  await sleep(250);
}
try {
  await mirrorPage("/404", { as404: true });
} catch (e) {
  console.log(`  404 page not captured: ${e.message}`);
}

// ---------------------------------------------------------------- page links
// Rewritten last, and only to pages that were captured: a link the old site already had broken
// stays absolute instead of becoming a dead local file.
const pageKey = (pathname) => pathname.replace(/\/+$/, "") || "/";
const brokenOnSite = new Map(); // pathname -> Set(referrer rel)
for (const [, p] of pages) {
  if (p.status !== "ok" && p.status !== "404-page") continue;
  const file = path.join(SITE, ...p.rel.split("/"));
  const html = fs.readFileSync(file, "utf8").replace(A_RE, (tag) =>
    tag.replace(/(\shref=)(["'])([^"']*)\2/i, (m, a, q, href) => {
      const t = sameOriginPath(href);
      if (!t) return m;
      let target = pages.get(pageKey(t.pathname));
      if (target && target.status === "redirect") target = pages.get(target.redirect);
      if (!target || target.status !== "ok") {
        if (!brokenOnSite.has(t.pathname)) brokenOnSite.set(t.pathname, new Set());
        brokenOnSite.get(t.pathname).add(p.rel);
        return `${a}${q}${ORIGIN}${t.pathname}${t.hash}${q}`;
      }
      return `${a}${q}${relFrom(p.rel, target.rel)}${t.hash}${q}`;
    }));
  fs.writeFileSync(file, html);
}
for (const [pathname, refs] of brokenOnSite) console.log(`  BROKEN ON THE LIVE SITE ${pathname}  <- ${[...refs].join(", ")}`);

// ---------------------------------------------------------------- self-check and manifest
let deadLinks = 0;
for (const [, p] of pages) {
  if (p.status !== "ok" && p.status !== "404-page") continue;
  const file = path.join(SITE, ...p.rel.split("/"));
  const html = fs.readFileSync(file, "utf8");
  for (const tag of html.match(A_RE) || []) {
    const m = tag.match(/\shref=(["'])([^"']*)\1/i);
    if (!m || /^(https?:|#|mailto:|tel:|javascript:|sms:|\/)/i.test(m[2]) || !m[2]) continue;
    const target = path.resolve(path.dirname(file), decodeURIComponent(m[2].replace(/[?#].*$/, "")));
    if (!fs.existsSync(target)) { deadLinks++; console.log(`  DEAD LINK ${p.rel} -> ${m[2]}`); }
  }
}

const list = [...assets].map(([url, a]) => ({ url, ...a }));
const count = (s) => list.filter((a) => a.status === s).length;
const longest = Math.max(0, ...list.map((a) => path.join(SITE, a.rel).length), ...[...pages.values()].map((p) => path.join(RAW, p.rel).length));
fs.writeFileSync(path.join(OUT, "mirror-manifest.json"), JSON.stringify({
  origin: ORIGIN,
  captured: new Date().toISOString(),
  pages: [...pages].map(([pathname, p]) => ({ path: pathname, ...p })),
  brokenOnSite: [...brokenOnSite].map(([pathname, refs]) => ({ path: pathname, linkedFrom: [...refs] })),
  assets: list,
}, null, 2));
const ok = [...pages.values()].filter((p) => p.status === "ok").length;
console.log(`\ndone: ${ok} pages, ${[...pages.values()].filter((p) => p.status === "redirect").length} redirects, ` +
  `${[...pages.values()].filter((p) => p.status === "fail").length} page failures`);
console.log(`assets: ${list.length} (${count("ok")} fetched, ${count("copied")} copied from assets/, ${count("fail")} failed), ` +
  `${(list.reduce((n, a) => n + a.bytes, 0) / 1048576).toFixed(1)} MB`);
console.log(`dead local links: ${deadLinks}; longest path ${longest} characters`);
process.exitCode = deadLinks ? 1 : 0;
