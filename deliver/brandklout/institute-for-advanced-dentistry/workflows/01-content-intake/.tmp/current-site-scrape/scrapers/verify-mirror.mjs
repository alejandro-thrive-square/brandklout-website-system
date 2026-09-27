// Prove the mirror in ../site is complete: every local file any page or stylesheet
// points at must exist on disk. Reads what the pages actually reference, so it is
// not blind to anything mirror.mjs forgot to fetch.
//
// Checked: src, href (stylesheets, icons, preloads), srcset / data-srcset / imagesrcset,
// poster, every data-* attribute that looks like a local file, url() inside <style>
// blocks, inline style="" attributes and every mirrored .css file. Remote URLs that
// are still absolute are listed separately: those load from the network, not disk.
//
// Usage: node verify-mirror.mjs > verify-mirror.log   (never pipe; see memory)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(HERE, "..", "site");
const FILE_EXT = /\.(css|js|mjs|png|jpe?g|gif|webp|avif|svg|ico|woff2?|ttf|otf|eot|mp4|webm|mov|m4v|mp3|pdf|json)$/i;

const walk = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
const all = walk(SITE);
const pages = all.filter((f) => f.endsWith(".html"));
const sheets = all.filter((f) => f.endsWith(".css"));

const missing = new Map(); // resolved path -> Set(referrers)
const remote = new Map(); // host -> count
let checked = 0;

const decode = (s) => s.replace(/&amp;/g, "&").replace(/&#0?38;/g, "&").replace(/&quot;/g, '"').replace(/&#039;/g, "'");

function check(ref, fromFile) {
  ref = decode(ref.trim()).replace(/^['"]|['"]$/g, "");
  if (!ref || ref.startsWith("#") || /^(data:|blob:|mailto:|tel:|javascript:|about:)/i.test(ref)) return;
  if (/^(https?:)?\/\//i.test(ref)) {
    try {
      const h = new URL(ref, "https://x").hostname;
      remote.set(h, (remote.get(h) || 0) + 1);
    } catch {}
    return;
  }
  const clean = ref.replace(/[?#].*$/, "");
  let target = path.resolve(path.dirname(fromFile), decodeURIComponent(clean));
  // a link to a page directory resolves to its index.html
  if (!FILE_EXT.test(clean)) {
    if (clean.endsWith("/") || !path.extname(clean)) target = path.join(target, "index.html");
    else return;
  }
  checked++;
  if (!fs.existsSync(target)) {
    const k = path.relative(SITE, target);
    if (!missing.has(k)) missing.set(k, new Set());
    missing.get(k).add(path.relative(SITE, fromFile));
  }
}

const cssUrls = (css, from) => {
  for (const m of css.matchAll(/url\(\s*([^)]+?)\s*\)/g)) check(m[1], from);
  for (const m of css.matchAll(/@import\s+["']([^"']+)["']/g)) check(m[1], from);
};

for (const f of pages) {
  const h = fs.readFileSync(f, "utf8");
  for (const m of h.matchAll(/<(?:img|script|source|video|audio|iframe|embed|track|input)\b[^>]*?\ssrc=["']([^"']+)["']/gi)) check(m[1], f);
  for (const m of h.matchAll(/<(?:link|a)\b[^>]*?\shref=["']([^"']+)["']/gi)) check(m[1], f);
  for (const m of h.matchAll(/\s(?:srcset|data-srcset|imagesrcset)=["']([^"']+)["']/gi))
    for (const part of m[1].split(",")) check(part.trim().split(/\s+/)[0], f);
  for (const m of h.matchAll(/\sposter=["']([^"']+)["']/gi)) check(m[1], f);
  for (const m of h.matchAll(/\sdata-[\w-]+=["']([^"'\s]+)["']/gi)) if (FILE_EXT.test(m[1].replace(/[?#].*$/, ""))) check(m[1], f);
  for (const m of h.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) cssUrls(m[1], f);
  for (const m of h.matchAll(/\sstyle=["']([^"']*url\([^"']*)["']/gi)) cssUrls(decode(m[1]), f);
}
for (const f of sheets) cssUrls(fs.readFileSync(f, "utf8"), f);

console.log(`pages ${pages.length}, stylesheets ${sheets.length}, files on disk ${all.length}`);
console.log(`local references checked ${checked}, missing ${missing.size}`);
for (const [k, refs] of missing) console.log(`  MISSING ${k}  <- ${[...refs].slice(0, 3).join(", ")}${refs.size > 3 ? ` (+${refs.size - 3})` : ""}`);
console.log("remote hosts still referenced (load from the network):");
for (const [h, n] of [...remote].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(5)}  ${h}`);
process.exitCode = missing.size ? 1 : 0;
