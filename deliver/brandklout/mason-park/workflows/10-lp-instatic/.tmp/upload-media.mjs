/**
 * Upload the landing pages' images into the Instatic media library and write
 * the local -> uploaded path map that build.mjs consumes via --media.
 *
 *   node upload-media.mjs [--concurrency 3] [--dry]
 *
 * Resumable: the live library is listed first and anything already there by
 * basename is reused, so a re-run after a failure costs nothing AND the 27
 * landing-page images never duplicate the 127 the main site already uploaded.
 * Instatic assigns the id at upload, so the map cannot be predicted - this has
 * to run before the final build.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { listMedia, uploadFile, BASE } from "../../09-static-rebuild/.tmp/insta.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MANIFEST = path.join(HERE, "out", "media-manifest.json");
const OUT_MAP = path.join(HERE, "instatic-media-map.json");

const argv = process.argv.slice(2);
const CONCURRENCY = argv.includes("--concurrency") ? Number(argv[argv.indexOf("--concurrency") + 1]) : 3;
const DRY = argv.includes("--dry");

const MIME = {
  ".webp": "image/webp", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".png": "image/png", ".gif": "image/gif", ".svg": "image/svg+xml",
  ".avif": "image/avif",
};

const files = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
console.log(`manifest: ${files.length} files -> ${BASE}`);

// Instatic derives its stored name from the basename, so that is what we match.
const existing = new Map();
const listed = await listMedia();
for (const a of listed.assets ?? listed.rows ?? listed ?? []) {
  const name = a.filename ?? a.name ?? a.originalName ?? "";
  // The real field is `publicPath`, and its nanoid prefix is NOT the asset id -
  // deriving `/uploads/<id>-<name>` yields a path that 404s on every image.
  const url = a.publicPath ?? a.url ?? a.path ?? null;
  if (name && url) existing.set(name, url);
}
console.log(`library already holds ${existing.size} assets`);

const map = fs.existsSync(OUT_MAP) ? JSON.parse(fs.readFileSync(OUT_MAP, "utf8")) : {};
const todo = [];
for (const f of files) {
  const hit = existing.get(f.file);
  if (hit) { map[f.file] = hit; continue; }
  todo.push(f);
}
console.log(`${Object.keys(map).length} already mapped, ${todo.length} to upload`);

if (DRY) {
  for (const f of todo) console.log(`  would upload ${f.file} (${(f.bytes / 1024).toFixed(0)} KB)`);
  process.exit(0);
}

let done = 0;
const failed = [];
const queue = [...todo];
const worker = async () => {
  while (queue.length) {
    const f = queue.shift();
    const ext = path.extname(f.file).toLowerCase();
    try {
      const res = await uploadFile("/admin/api/cms/media", f.file,
        fs.readFileSync(f.path), MIME[ext] ?? "application/octet-stream");
      const a = res.asset ?? res.media ?? res;
      const url = a.publicPath ?? a.url ?? a.path ?? null;
      if (!url) throw new Error(`no publicPath in response: ${JSON.stringify(res).slice(0, 200)}`);
      map[f.file] = url;
      done++;
      process.stdout.write(`\r  uploaded ${done}/${todo.length}`);
    } catch (e) {
      failed.push([f.file, String(e.message).slice(0, 140)]);
    }
  }
};
await Promise.all(Array.from({ length: CONCURRENCY }, worker));
console.log("");

fs.writeFileSync(OUT_MAP, JSON.stringify(map, null, 2));
console.log(`${done} uploaded, ${failed.length} failed, ${Object.keys(map).length}/${files.length} mapped`);
console.log(`-> ${path.relative(HERE, OUT_MAP)}`);
for (const [f, why] of failed) console.log(`  FAIL ${f}: ${why}`);
if (Object.keys(map).length < files.length) process.exitCode = 1;
