#!/usr/bin/env node
/**
 * Step 1 of the Instatic import: upload every file in `media-manifest.json`
 * and write the path-keyed map that `to-instatic.mjs --media` consumes.
 *
 *   node push-media.mjs            # upload, then write instatic-media-map.json
 *   node push-media.mjs --dry-run  # report what would upload, touch nothing
 *
 * Why this exists rather than the MCP connector: 29 of the connector's tools
 * require the Instatic Site editor to be open in a browser, because they are
 * proxied through the in-editor AI chat stream. The admin REST API underneath
 * has no such dependency, so the whole import runs headlessly through
 * `deliver/process/18-instatic-embeds/lib/insta-api.mjs`.
 *
 * ## The map is keyed by full relative path, never by basename
 *
 * `uploads/2023/11/x.webp`, not `x.webp`. Two files in different month folders
 * can share a basename, and `to-instatic.mjs` refuses to resolve one by
 * basename alone for exactly that reason.
 *
 * ## Identical content is uploaded ONCE
 *
 * This site's one shared basename - `Dentist-in-Katy-Office.webp`, in both
 * `2023/11` and `2024/09` - is the SAME IMAGE. Both copies are 95606 bytes and
 * hash to `8ca3aedb...`. (The workflow README and the generated IMPORT.md say
 * they differ in size because the photo was re-uploaded; measured on the real
 * build, that is not true.) So the files are grouped by SHA-256, one member of
 * each group is uploaded, and every path in the group is mapped to that one
 * asset. Two reasons:
 *
 *   - A publish snapshots every runtime asset into the Railway volume and
 *     nothing is ever garbage-collected, so a duplicate is paid for again on
 *     every publish, not once.
 *   - It keeps re-runs stable. Uploading the same bytes twice would leave two
 *     assets with the same filename and size, and the reuse index below could
 *     no longer tell them apart.
 *
 * What is still a real trap, and is checked: two files that share a basename
 * AND a size but hold DIFFERENT bytes. That pair is indistinguishable to the
 * reuse index, so the script stops rather than guess. It does not occur on
 * this site today.
 *
 * ## Instatic renames on the way in
 *
 * `.jpeg` -> `.jpg`, `.` -> `_`, plus an assigned id. `publicPath` therefore
 * cannot be predicted, only read back off the upload response - which is the
 * whole reason media goes first and pages second.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { api, requestForm, BASE } from "../../../../../process/18-instatic-embeds/lib/insta-api.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(HERE, "dist");
const OUT = path.join(HERE, "instatic");
const MANIFEST = path.join(OUT, "media-manifest.json");
/* Deliberately NOT inside instatic/: `to-instatic.mjs` does
   `fs.rmSync(OUT, {recursive:true})` before it regenerates, so a map written
   there is read into memory by the --media pass and then deleted by that same
   run. The map has to outlive the bundle - it is the only record of which
   upload each local file became. */
const MAP_FILE = path.join(HERE, "instatic-media-map.json");
const DRY = process.argv.includes("--dry-run");

const MIME = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
  ".webp": "image/webp", ".gif": "image/gif", ".svg": "image/svg+xml",
  ".avif": "image/avif", ".ico": "image/x-icon",
};

if (!fs.existsSync(MANIFEST)) {
  console.error(`no ${MANIFEST}\nRun \`node to-instatic.mjs --lean\` first.`);
  process.exit(2);
}
const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));

/* headOnly entries are bare paths (the favicon reaches no page body), files[]
   entries are records. Both have to go up; a favicon nobody uploaded is a
   favicon nobody has. The logo is in BOTH lists, so dedupe by path first. */
const byName = new Map();
for (const f of manifest.files) byName.set(f.name, { local: f.local, name: f.name });
for (const local of manifest.headOnly ?? []) {
  const name = local.replace(/^\/assets\//, "");
  if (!byName.has(name)) byName.set(name, { local, name, headOnly: true });
}
const work = [...byName.values()];

console.log(`site: ${BASE}`);
console.log(`${work.length} distinct path(s) from media-manifest.json${manifest.lean ? "  (--lean bundle)" : ""}`);

/* Read the bytes once: needed for the hash, the size and the upload itself. */
const missing = [];
for (const item of work) {
  const src = path.join(DIST, item.local.replace(/^\//, ""));
  if (!fs.existsSync(src)) { missing.push(item.name); continue; }
  item.buf = fs.readFileSync(src);
  item.hash = crypto.createHash("sha256").update(item.buf).digest("hex");
}
for (const n of missing) console.error(`  MISSING on disk: ${n}`);

/* Group identical content. One upload per group, every path mapped to it. */
const groups = new Map();
for (const item of work) {
  if (!item.buf) continue;
  if (!groups.has(item.hash)) groups.set(item.hash, []);
  groups.get(item.hash).push(item);
}
const shared = [...groups.values()].filter((g) => g.length > 1);
for (const g of shared) {
  console.log(`  same bytes, uploaded once: ${g.map((i) => i.name).join("  =  ")}`);
}

/* The real ambiguity: same basename AND size, different bytes. Indistinguishable
   to the reuse index below, so refuse rather than guess. */
const bySig = new Map();
for (const item of work) {
  if (!item.buf) continue;
  const sig = `${path.basename(item.name)}|${item.buf.length}`;
  if (!bySig.has(sig)) bySig.set(sig, new Set());
  bySig.get(sig).add(item.hash);
}
const collisions = [...bySig].filter(([, hashes]) => hashes.size > 1);
if (collisions.length) {
  console.error(`\n${collisions.length} basename+size collision(s) with DIFFERENT content:`);
  for (const [sig] of collisions) console.error(`  ! ${sig}`);
  console.error(`Uploading these makes the reuse index ambiguous forever. Rename first.`);
  process.exit(1);
}

/* Index what is already up, so a re-run is cheap and never duplicates. */
const { assets = [] } = await api("GET", "/admin/api/cms/media");
const existing = new Map();
for (const a of assets) {
  const key = `${a.filename}|${a.sizeBytes}`;
  existing.set(key, existing.has(key) ? "AMBIGUOUS" : a);
}
if (assets.length) console.log(`${assets.length} asset(s) already on the site`);

const map = {};
let uploaded = 0, reused = 0, failed = 0;
const total = groups.size;

for (const [, group] of groups) {
  const item = group[0];
  const base = path.basename(item.name);
  const ext = path.extname(base).toLowerCase();
  const hit = existing.get(`${base}|${item.buf.length}`);

  if (hit === "AMBIGUOUS") {
    console.error(`  AMBIGUOUS: two assets already up as ${base} at ${item.buf.length} bytes - resolve by hand`);
    failed++;
    continue;
  }
  if (hit) {
    for (const g of group) map[g.name] = hit.publicPath;
    reused++;
    continue;
  }
  if (DRY) {
    console.log(`  would upload ${item.name} (${item.buf.length} B)${group.length > 1 ? ` [+${group.length - 1} alias]` : ""}`);
    continue;
  }

  const fd = new FormData();
  fd.append("file", new Blob([item.buf], { type: MIME[ext] ?? "application/octet-stream" }), base);
  try {
    const { asset } = await requestForm("/admin/api/cms/media", fd);
    for (const g of group) map[g.name] = asset.publicPath;
    existing.set(`${asset.filename}|${asset.sizeBytes}`, asset);
    uploaded++;
    console.log(`  ${String(uploaded + reused).padStart(2)}/${total}  ${item.name} -> ${asset.publicPath}`);
  } catch (e) {
    console.error(`  FAILED ${item.name}: ${e.message.slice(0, 200)}`);
    failed++;
  }
}

if (DRY) {
  console.log(`\ndry run - nothing uploaded, media-map.json not written`);
  process.exit(0);
}

fs.writeFileSync(MAP_FILE, JSON.stringify(map, null, 2) + "\n", "utf8");

console.log(`\nuploaded ${uploaded}, reused ${reused}, failed ${failed} (of ${total} distinct file(s))`);
console.log(`map: instatic-media-map.json - ${Object.keys(map).length} path-keyed entries`);
if (missing.length || failed) {
  console.log(`\n${missing.length + failed} file(s) did not make it. Fix those before the --media pass;`);
  console.log(`a page pointing at an unuploaded /assets/ path renders broken.`);
  process.exit(1);
}
console.log(`\nnext: node to-instatic.mjs --media instatic-media-map.json --lean`);
