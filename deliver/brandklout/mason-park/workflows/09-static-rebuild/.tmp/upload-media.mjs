/**
 * Upload every file in instatic/media-manifest.json to the Instatic media
 * library, then write the local -> uploaded path map that to-instatic.mjs
 * consumes via --media.
 *
 *   node upload-media.mjs [--concurrency 6] [--dry]
 *
 * Resumable: the live library is listed first and anything already there by
 * name is skipped, so a re-run after a failure costs nothing.
 *
 * application/pdf is rejected by the upload pipeline on purpose (a PDF can be
 * rendered inline, so it is an XSS vector). Those are reported, not retried.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { listMedia, uploadFile, BASE } from "./insta.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
// The files live in the deliverable, `../home/`, and the manifest addresses
// them as `/assets/uploads/...` — so this is the folder those paths are
// relative to. It used to be `.tmp/dist`, the generator's output, and the
// 2026-09-01 freeze deleted that folder and repointed to-instatic.mjs at
// ../home/ WITHOUT repointing this. The failure is loud but misleading: 137 of
// 166 files reported "not on disk" at a path under a directory that no longer
// exists at all, which reads like a missing export rather than a stale const.
const DIST = path.join(HERE, "..", "home");
const MANIFEST = path.join(HERE, "instatic", "media-manifest.json");
const OUT_MAP = path.join(HERE, "instatic-media-map.json");
const OUT_LOG = path.join(HERE, "media-upload-log.json");

const argv = process.argv.slice(2);
const CONCURRENCY = argv.includes("--concurrency") ? Number(argv[argv.indexOf("--concurrency") + 1]) : 6;
const DRY = argv.includes("--dry");

const MIME = {
  ".webp": "image/webp", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".png": "image/png", ".gif": "image/gif", ".svg": "image/svg+xml",
  ".avif": "image/avif", ".ico": "image/x-icon",
  ".mp4": "video/mp4", ".webm": "video/webm",
  ".pdf": "application/pdf",
};

const files = JSON.parse(fs.readFileSync(MANIFEST, "utf8")).files;
console.log(`manifest: ${files.length} files -> ${BASE}`);

// Instatic renames on the way in, so match what is already there by BASENAME,
// which is the part it derives its stored name from.
const existing = new Map();
const listed = await listMedia();
for (const a of listed.assets ?? listed.rows ?? listed ?? []) {
  const name = a.filename ?? a.name ?? a.originalName ?? "";
  const url = a.publicPath ?? a.public_path ?? a.url ?? a.path ?? "";
  if (name && url) existing.set(name, url);
}
console.log(`already in library: ${existing.size}`);

const results = [];
const queue = [...files];
let done = 0;

const worker = async () => {
  for (;;) {
    const f = queue.shift();
    if (!f) return;
    const ext = path.extname(f.name).toLowerCase();
    const base = path.basename(f.name);
    const abs = path.join(DIST, f.local.replace(/^\//, "").split("/").join(path.sep));

    // Instatic normalises .jpeg -> .jpg, so check both when resuming.
    const already = existing.get(base) ?? existing.get(base.replace(/\.jpeg$/i, ".jpg"));
    if (already) {
      results.push({ ...f, uploaded: already, skipped: "already present" });
      done++;
      continue;
    }
    if (ext === ".pdf") {
      results.push({ ...f, error: "application/pdf is not an accepted media type" });
      done++;
      continue;
    }
    if (!fs.existsSync(abs)) {
      results.push({ ...f, error: `not on disk at ${abs}` });
      done++;
      continue;
    }
    if (DRY) { results.push({ ...f, dry: true }); done++; continue; }

    // Every upload makes the server derive variants, which is CPU-heavy enough
    // that a burst drops connections outright ("fetch failed") rather than
    // returning an error status. Retry those with backoff.
    const bytes = fs.readFileSync(abs);
    let lastErr = null;
    for (let attempt = 1; attempt <= 4; attempt++) {
      try {
        const res = await uploadFile("/admin/api/cms/media", base, bytes, MIME[ext] ?? "application/octet-stream");
        const a = res.asset ?? res.media ?? res;
        const url = a.publicPath ?? a.public_path ?? a.url ?? a.path;
        if (!url) throw new Error(`upload returned no path: ${JSON.stringify(res).slice(0, 200)}`);
        results.push({ ...f, uploaded: url, attempts: attempt });
        lastErr = null;
        break;
      } catch (e) {
        lastErr = e;
        const msg = String(e.message ?? e);
        // A rejected media type will be rejected again; only retry transport faults.
        if (/not an accepted|too large|invalid origin|Unauthorized/i.test(msg)) break;
        if (attempt < 4) await new Promise((r) => setTimeout(r, 800 * attempt * attempt));
      }
    }
    if (lastErr) results.push({ ...f, error: String(lastErr.message ?? lastErr).slice(0, 300) });
    done++;
    if (done % 25 === 0) console.log(`  ${done}/${files.length}`);
  }
};

await Promise.all(Array.from({ length: CONCURRENCY }, worker));

const ok = results.filter((r) => r.uploaded);
const failed = results.filter((r) => r.error);

// to-instatic.mjs looks the map up by `name` and by basename, so give it both.
const map = {};
for (const r of ok) {
  map[r.name] = r.uploaded;
  map[path.basename(r.name)] = r.uploaded;
}
fs.writeFileSync(OUT_MAP, JSON.stringify(map, null, 1));
fs.writeFileSync(OUT_LOG, JSON.stringify({ total: files.length, ok: ok.length, failed: failed.length, results }, null, 1));

console.log(`\nuploaded/present: ${ok.length}   failed: ${failed.length}`);
for (const f of failed.slice(0, 20)) console.log(`  ! ${f.name}: ${f.error}`);
if (failed.length > 20) console.log(`  ... and ${failed.length - 20} more (see media-upload-log.json)`);
console.log(`map -> ${path.relative(HERE, OUT_MAP)}`);
