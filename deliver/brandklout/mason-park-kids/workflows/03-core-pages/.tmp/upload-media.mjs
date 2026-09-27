/**
 * Upload every file in instatic/media-manifest.json to the Instatic media
 * library, then write the local -> uploaded path map that to-instatic.mjs
 * consumes via --media.
 *
 *   node upload-media.mjs [--dry]
 *
 * Resumable: the live library is listed first and anything already there with
 * the same FILENAME AND SIZE is reused, so a re-run after a failure costs
 * nothing. Filename alone is not enough: the five credential marks were
 * uploaded by the 02 import under other names and the same bytes, and the old
 * library has an `aapd.webp` of its own, so the size is the tie-breaker.
 *
 * Identical bytes are uploaded once: files are grouped by SHA-256 and every
 * path in a group maps to one asset (a publish snapshots every runtime asset
 * into the volume, so a duplicate is paid for on every publish).
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { listMedia, uploadFile, BASE } from "./insta.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const HOME = path.join(HERE, "..", "home");
const MANIFEST = path.join(HERE, "instatic", "media-manifest.json");
// Outside instatic/: to-instatic.mjs rmSyncs that folder on every run.
const OUT_MAP = path.join(HERE, "instatic-media-map.json");
const OUT_LOG = path.join(HERE, "media-upload-log.json");
const DRY = process.argv.includes("--dry");

const MIME = { ".webp": "image/webp", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".gif": "image/gif", ".svg": "image/svg+xml", ".avif": "image/avif" };

const files = JSON.parse(fs.readFileSync(MANIFEST, "utf8")).files;
console.log(`manifest: ${files.length} files -> ${BASE}`);

for (const f of files) {
  f.abs = path.join(HOME, f.local.replace(/^\//, "").split("/").join(path.sep));
  if (!fs.existsSync(f.abs)) { console.error(`  MISSING on disk: ${f.name}`); process.exit(1); }
  f.buf = fs.readFileSync(f.abs);
  f.hash = crypto.createHash("sha256").update(f.buf).digest("hex");
}
const groups = new Map();
for (const f of files) { if (!groups.has(f.hash)) groups.set(f.hash, []); groups.get(f.hash).push(f); }

const listed = await listMedia();
const existing = new Map();
for (const a of listed.assets ?? listed.rows ?? []) {
  const key = `${a.filename ?? a.name}|${a.sizeBytes ?? a.size}`;
  // Same name AND same size is the same file uploaded twice (a retried upload,
  // 2026-09-26): reuse the first copy. Only a name clash at different sizes is ambiguous.
  if (existing.has(key)) { console.log(`  duplicate in library, reusing the first: ${key}`); continue; }
  existing.set(key, a.publicPath ?? a.url ?? a.path);
}
console.log(`already in library: ${existing.size} distinct filename|size`);

const map = {};
const results = [];
let uploaded = 0, reused = 0, failed = 0;
for (const [, group] of groups) {
  const f = group[0];
  const base = path.basename(f.name);
  const ext = path.extname(base).toLowerCase();
  const hit = existing.get(`${base}|${f.buf.length}`);
  if (hit === "AMBIGUOUS") { console.error(`  AMBIGUOUS in library: ${base} at ${f.buf.length} B`); failed++; continue; }
  if (hit) { for (const g of group) map[g.name] = hit; reused++; results.push({ name: f.name, reused: hit }); continue; }
  if (DRY) { console.log(`  would upload ${f.name} (${f.buf.length} B)${group.length > 1 ? ` [+${group.length - 1} alias]` : ""}`); continue; }

  let lastErr = null;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await uploadFile("/admin/api/cms/media", base, f.buf, MIME[ext] ?? "application/octet-stream");
      const a = res.asset ?? res.media ?? res;
      const url = a.publicPath ?? a.url ?? a.path;
      if (!url) throw new Error(`upload returned no path: ${JSON.stringify(res).slice(0, 200)}`);
      for (const g of group) map[g.name] = url;
      existing.set(`${a.filename ?? base}|${a.sizeBytes ?? f.buf.length}`, url);
      results.push({ name: f.name, uploaded: url, attempts: attempt });
      uploaded++;
      console.log(`  ${String(uploaded + reused).padStart(2)}/${groups.size}  ${f.name} -> ${url}`);
      lastErr = null;
      break;
    } catch (e) {
      lastErr = e;
      if (/not an accepted|too large|invalid origin|Unauthorized/i.test(String(e.message))) break;
      if (attempt < 4) await new Promise((r) => setTimeout(r, 800 * attempt * attempt));
    }
  }
  if (lastErr) { console.error(`  FAILED ${f.name}: ${String(lastErr.message).slice(0, 200)}`); results.push({ name: f.name, error: String(lastErr.message).slice(0, 300) }); failed++; }
}

if (DRY) { console.log("\ndry run - nothing uploaded, no map written"); process.exit(0); }

fs.writeFileSync(OUT_MAP, JSON.stringify(map, null, 1));
fs.writeFileSync(OUT_LOG, JSON.stringify({ total: files.length, groups: groups.size, uploaded, reused, failed, results }, null, 1));
console.log(`\nuploaded ${uploaded}, reused ${reused}, failed ${failed} (of ${groups.size} distinct file(s), ${files.length} paths)`);
console.log(`map -> ${path.relative(HERE, OUT_MAP)} (${Object.keys(map).length} entries)`);
if (failed) process.exit(1);
console.log(`\nnext: node to-instatic.mjs --media instatic-media-map.json${JSON.parse(fs.readFileSync(MANIFEST, "utf8")).lean ? " --lean" : ""}`);
