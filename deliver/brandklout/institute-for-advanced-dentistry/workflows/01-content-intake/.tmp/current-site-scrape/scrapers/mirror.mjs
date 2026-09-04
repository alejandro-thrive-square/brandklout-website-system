// Mirror https://www.ifadentistry.com/ into ../site so it opens from file:// with
// its own CSS, JS, fonts, images and video. Also pulls the whole WordPress media
// library (REST /wp/v2/media) into ../media-library as original files.
//
// Usage: node mirror.mjs            (full run)
//        node mirror.mjs --no-media (skip the media-library pass)
//
// Discovery: WP REST pages + posts + categories, then same-origin links found in
// every fetched page (author/tag/pagination archives). The Yoast sitemap URLs 200
// but return the 404 page, so they are not a source.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, "..");
const SITE = path.join(OUT, "site");
const MEDIA = path.join(OUT, "media-library");
const ORIGIN = "https://www.ifadentistry.com";
const HOSTS = new Set(["www.ifadentistry.com", "ifadentistry.com"]);
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
const MAX_PAGES = 250;
const skipMedia = process.argv.includes("--no-media");

fs.mkdirSync(SITE, { recursive: true });

// ---------------------------------------------------------------- helpers
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, { binary = false, tries = 3 } = {}) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, {
        headers: { "user-agent": UA, "accept-language": "en-US,en;q=0.9", accept: "*/*" },
        redirect: "follow",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const type = res.headers.get("content-type") || "";
      const body = binary ? Buffer.from(await res.arrayBuffer()) : await res.text();
      return { body, type, finalUrl: res.url, status: res.status };
    } catch (e) {
      lastErr = e;
      await sleep(500 * (i + 1));
    }
  }
  throw lastErr;
}

function stripQuery(p) {
  return p.replace(/[?#].*$/, "").replace(/&#0?38;.*$/, "");
}

// URL -> local file path under SITE (assets) and the site-relative path ("wp-content/..")
function assetLocal(u) {
  const url = new URL(u);
  let rel;
  if (HOSTS.has(url.hostname)) {
    rel = decodeURIComponent(stripQuery(url.pathname)).replace(/^\//, "");
  } else {
    let p = decodeURIComponent(stripQuery(url.pathname)).replace(/^\//, "");
    if (url.search && /googleapis/.test(url.hostname)) {
      // css2?family=... -> css2-<hash>.css
      let h = 0;
      for (const ch of url.search) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
      p = p.replace(/\/?$/, "") + "-" + h.toString(16) + ".css";
    }
    rel = path.posix.join("_ext", url.hostname, p);
  }
  return { rel, file: path.join(SITE, ...rel.split("/")) };
}

function pageLocal(pathname) {
  const clean = stripQuery(pathname).replace(/\/+$/, "");
  const dir = clean.replace(/^\//, "");
  const rel = dir ? `${dir}/index.html` : "index.html";
  return { dir, rel, file: path.join(SITE, ...rel.split("/")), depth: dir ? dir.split("/").length : 0 };
}

function relFrom(fromDirDepth, toRel) {
  return "../".repeat(fromDirDepth) + toRel;
}

// ---------------------------------------------------------------- state
const pages = new Map(); // pathname -> { file, title, status }
const queue = [];
const seenPage = new Set();
const assets = new Map(); // absolute url (no query) -> { rel, file, size, type, status, refs }
const assetQueue = [];
const seenAsset = new Set();

function enqueuePage(pathname) {
  pathname = stripQuery(pathname);
  if (!pathname.startsWith("/")) return;
  if (!pathname.endsWith("/")) pathname += "/";
  if (/^\/(wp-json|wp-admin|wp-content|wp-includes|feed|comments|xmlrpc)/.test(pathname)) return;
  if (/\/feed\/$/.test(pathname)) return;
  if (/\.(xml|php|jpe?g|png|gif|webp|svg|pdf|mp4|css|js)$/i.test(pathname)) return;
  if (seenPage.has(pathname)) return;
  seenPage.add(pathname);
  queue.push(pathname);
}

function enqueueAsset(absUrl, from) {
  const key = stripQuery(absUrl);
  if (!seenAsset.has(key)) {
    seenAsset.add(key);
    assetQueue.push({ url: absUrl, key, from });
  }
}

// ---------------------------------------------------------------- discovery via REST
async function restList(base) {
  const all = [];
  for (let p = 1; p < 50; p++) {
    const { body } = await get(`${ORIGIN}/wp-json/wp/v2/${base}${base.includes("?") ? "&" : "?"}per_page=100&page=${p}`);
    const arr = JSON.parse(body);
    if (!Array.isArray(arr) || !arr.length) break;
    all.push(...arr);
    if (arr.length < 100) break;
  }
  return all;
}

const inventory = { pages: [], posts: [], categories: [] };
{
  const p = await restList("pages?_fields=id,link,title,slug,parent,status,modified");
  inventory.pages = p.map((x) => ({ id: x.id, link: x.link, title: x.title.rendered, parent: x.parent, modified: x.modified }));
  const q = await restList("posts?_fields=id,link,title,slug,date,modified,categories");
  inventory.posts = q.map((x) => ({ id: x.id, link: x.link, title: x.title.rendered, date: x.date, modified: x.modified }));
  const c = await restList("categories?_fields=id,link,name,count");
  inventory.categories = c.filter((x) => x.count > 0).map((x) => ({ id: x.id, link: x.link, name: x.name, count: x.count }));
  for (const x of [...inventory.pages, ...inventory.posts, ...inventory.categories]) enqueuePage(new URL(x.link).pathname);
  enqueuePage("/");
  console.log(`REST: ${inventory.pages.length} pages, ${inventory.posts.length} posts, ${inventory.categories.length} categories`);
}

// ---------------------------------------------------------------- page pass
// asset references: absolute same-origin or root-relative into wp-content / wp-includes
const ASSET_RE = /(?:https?:\/\/(?:www\.)?ifadentistry\.com)?(\/(?:wp-content|wp-includes)\/[^\s"'<>(),\\]+)/g;
// same-origin page links inside href="..."
const HREF_RE = /href=(["'])(https?:\/\/(?:www\.)?ifadentistry\.com(\/[^"'#?]*)?(\?[^"'#]*)?(#[^"']*)?)\1/g;
// external stylesheet/font/script hosts we want to bring local
const EXT_LOCAL_RE = /(https?:\/\/fonts\.googleapis\.com\/[^"'\s)]+|https?:\/\/fonts\.gstatic\.com\/[^"'\s)]+)/g;

function rewriteHtml(html, page) {
  const depth = page.depth;
  // assets
  html = html.replace(ASSET_RE, (m, p) => {
    const abs = ORIGIN + p;
    enqueueAsset(abs, page.rel);
    const { rel } = assetLocal(abs);
    return relFrom(depth, rel);
  });
  // google fonts css / files
  html = html.replace(EXT_LOCAL_RE, (m) => {
    const clean = m.replace(/&#0?38;/g, "&");
    enqueueAsset(clean, page.rel);
    const { rel } = assetLocal(clean);
    return relFrom(depth, rel);
  });
  // page links
  html = html.replace(HREF_RE, (m, q, full, pth = "/", qs = "", hash = "") => {
    if (qs) return m; // ?s= search, ?p= previews etc.: leave live
    let pathname = pth || "/";
    if (!pathname.endsWith("/")) pathname += "/";
    if (/^\/(wp-json|wp-admin|feed|comments|xmlrpc)/.test(pathname) || /\/feed\/$/.test(pathname)) return m;
    enqueuePage(pathname);
    const target = pageLocal(pathname);
    return `href=${q}${relFrom(depth, target.rel)}${hash}${q}`;
  });
  return html;
}

while (queue.length && pages.size < MAX_PAGES) {
  const pathname = queue.shift();
  const url = ORIGIN + pathname;
  const local = pageLocal(pathname);
  try {
    const { body, finalUrl, status } = await get(url);
    const finalPath = new URL(finalUrl).pathname;
    if (stripQuery(finalPath).replace(/\/$/, "") !== stripQuery(pathname).replace(/\/$/, "")) {
      console.log(`  redirect ${pathname} -> ${finalPath}`);
      pages.set(pathname, { rel: local.rel, status: "redirect", redirect: finalPath });
      enqueuePage(finalPath);
      continue;
    }
    const title = (body.match(/<title>([^<]*)<\/title>/i) || [, ""])[1].trim();
    const is404 = /class="[^"]*\berror404\b/.test(body) || /<body[^>]*\berror404\b/.test(body);
    if (is404) {
      console.log(`  404-page ${pathname}`);
      pages.set(pathname, { rel: local.rel, status: "404", title });
      continue;
    }
    fs.mkdirSync(path.dirname(local.file), { recursive: true });
    const rawDir = path.join(OUT, "raw-html");
    const rawFile = path.join(rawDir, ...local.rel.split("/"));
    fs.mkdirSync(path.dirname(rawFile), { recursive: true });
    fs.writeFileSync(rawFile, body);
    const out = rewriteHtml(body, local);
    fs.writeFileSync(local.file, out);
    pages.set(pathname, { rel: local.rel, status: "ok", title, bytes: body.length });
    console.log(`page ${pages.size} ${pathname} (${body.length} b) "${title.slice(0, 60)}"`);
  } catch (e) {
    console.log(`  FAIL ${pathname}: ${e.message}`);
    pages.set(pathname, { rel: local.rel, status: "fail", error: e.message });
  }
}

// ---------------------------------------------------------------- asset pass
const CSS_URL_RE = /url\(\s*(["']?)([^"')]+)\1\s*\)/g;
const CSS_IMPORT_RE = /@import\s+(?:url\()?["']?([^"')\s]+)["']?\)?/g;

function rewriteCss(css, cssUrl, cssRel) {
  const cssDirDepth = cssRel.split("/").length - 1;
  const fix = (ref) => {
    ref = ref.trim();
    if (/^(data:|blob:|#|about:)/.test(ref)) return null;
    let abs;
    try {
      abs = new URL(ref, cssUrl).href;
    } catch {
      return null;
    }
    const host = new URL(abs).hostname;
    if (!HOSTS.has(host) && !/fonts\.gstatic\.com|fonts\.googleapis\.com/.test(host)) return null;
    enqueueAsset(abs, cssRel);
    const { rel } = assetLocal(abs);
    return relFrom(cssDirDepth, rel);
  };
  css = css.replace(CSS_URL_RE, (m, q, ref) => {
    const r = fix(ref);
    return r ? `url(${q}${r}${q})` : m;
  });
  css = css.replace(CSS_IMPORT_RE, (m, ref) => {
    const r = fix(ref);
    return r ? `@import url("${r}")` : m;
  });
  return css;
}

async function worker() {
  while (assetQueue.length) {
    const job = assetQueue.shift();
    const { rel, file } = assetLocal(job.url);
    const isCss = /\.css$/i.test(rel) || /fonts\.googleapis\.com/.test(job.url);
    try {
      if (fs.existsSync(file) && !isCss) {
        const st = fs.statSync(file);
        assets.set(job.key, { rel, size: st.size, status: "cached", from: job.from });
        continue;
      }
      const { body, type } = await get(job.url, { binary: !isCss });
      fs.mkdirSync(path.dirname(file), { recursive: true });
      if (isCss) {
        const out = rewriteCss(body, job.url, rel);
        fs.writeFileSync(file, out);
        assets.set(job.key, { rel, size: Buffer.byteLength(out), type, status: "ok", from: job.from });
      } else {
        fs.writeFileSync(file, body);
        assets.set(job.key, { rel, size: body.length, type, status: "ok", from: job.from });
      }
    } catch (e) {
      assets.set(job.key, { rel, size: 0, status: "fail", error: e.message, from: job.from });
      console.log(`  asset FAIL ${job.url}: ${e.message}`);
    }
  }
}
await Promise.all(Array.from({ length: 6 }, worker));
// CSS files may have enqueued more (fonts, images) - drain again
while (assetQueue.length) await Promise.all(Array.from({ length: 6 }, worker));

// ---------------------------------------------------------------- media library pass
const media = [];
if (!skipMedia) {
  fs.mkdirSync(MEDIA, { recursive: true });
  const items = await restList("media?_fields=id,date,slug,title,alt_text,caption,mime_type,media_details,source_url,post");
  console.log(`media library: ${items.length} items`);
  const jobs = items.map((m) => async () => {
    const src = m.source_url;
    const name = decodeURIComponent(new URL(src).pathname.split("/").pop());
    const file = path.join(MEDIA, name);
    const rec = {
      id: m.id,
      file: name,
      source_url: src,
      mime: m.mime_type,
      width: m.media_details?.width ?? null,
      height: m.media_details?.height ?? null,
      filesize: m.media_details?.filesize ?? null,
      alt: m.alt_text || "",
      title: m.title?.rendered || "",
      caption: (m.caption?.rendered || "").replace(/<[^>]+>/g, "").trim(),
      date: m.date,
      attached_to: m.post ?? null,
    };
    try {
      if (!fs.existsSync(file)) {
        const { body } = await get(src, { binary: true });
        fs.writeFileSync(file, body);
        rec.bytes = body.length;
      } else rec.bytes = fs.statSync(file).size;
      rec.status = "ok";
    } catch (e) {
      rec.status = "fail";
      rec.error = e.message;
      console.log(`  media FAIL ${src}: ${e.message}`);
    }
    media.push(rec);
  });
  let i = 0;
  await Promise.all(
    Array.from({ length: 6 }, async () => {
      while (i < jobs.length) await jobs[i++]();
    })
  );
  media.sort((a, b) => a.id - b.id);
  fs.writeFileSync(path.join(OUT, "media-library.json"), JSON.stringify(media, null, 2));
  const csv = [
    "id,file,mime,width,height,bytes,alt,title,date,status",
    ...media.map((m) =>
      [m.id, m.file, m.mime, m.width, m.height, m.bytes ?? 0, m.alt, m.title, m.date, m.status]
        .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
        .join(",")
    ),
  ].join("\n");
  fs.writeFileSync(path.join(OUT, "media-library.csv"), csv);
}

// ---------------------------------------------------------------- reports
const pageList = [...pages.entries()].map(([pathname, p]) => ({ url: ORIGIN + pathname, ...p }));
const assetList = [...assets.entries()].map(([url, a]) => ({ url, ...a }));
fs.writeFileSync(
  path.join(OUT, "site-data.json"),
  JSON.stringify({ scrapedAt: new Date().toISOString(), origin: ORIGIN, inventory, pages: pageList, assets: assetList }, null, 2)
);
const acsv = [
  "url,local,bytes,type,status,first_seen_on",
  ...assetList.map((a) =>
    [a.url, a.rel, a.size, a.type || "", a.status, a.from].map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")
  ),
].join("\n");
fs.writeFileSync(path.join(OUT, "assets-manifest.csv"), acsv);
fs.writeFileSync(
  path.join(OUT, "pages.csv"),
  ["url,local,status,title,bytes", ...pageList.map((p) => [p.url, p.rel, p.status, p.title || "", p.bytes || ""].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))].join("\n")
);

const ok = pageList.filter((p) => p.status === "ok").length;
const aok = assetList.filter((a) => a.status !== "fail").length;
const abytes = assetList.reduce((s, a) => s + (a.size || 0), 0);
console.log(`\nDONE: ${ok}/${pageList.length} pages, ${aok}/${assetList.length} assets (${(abytes / 1048576).toFixed(1)} MB), ${media.filter((m) => m.status === "ok").length}/${media.length} media-library files`);
