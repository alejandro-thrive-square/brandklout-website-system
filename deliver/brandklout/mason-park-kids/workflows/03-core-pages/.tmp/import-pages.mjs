/**
 * Write the converted page bodies into the CMS.
 *
 *   node import-pages.mjs [--only <slug>] [--publish]
 *
 * Every one of the eleven core pages is written, whether or not a row already
 * exists: eight of the slugs are pages the 02 migration imported and this run
 * REPLACES them by design (the row's id and seq are reused, so the route and
 * its history stay). Three are new rows. Nothing else on the site is touched:
 * `mode: "incremental"` leaves every unmentioned row alone.
 *
 * Instatic calls the home page `index`; the export calls it `/`. The default
 * install already HAS an index row, so home reuses that row's id: creating a
 * second one lands as `index-2`, not an overwrite.
 *
 * Run backup-site.mjs first. This overwrites eight live pages.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { api, getPages, getSite, publish as doPublish, publishStatus, BASE } from "./insta.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const ONLY = argv.includes("--only") ? argv[argv.indexOf("--only") + 1] : null;
const PUBLISH = argv.includes("--publish");

const ALPHABET = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";
const newId = () => Array.from(crypto.randomBytes(21), (b) => ALPHABET[b & 63]).join("");
const toSlug = (s) => (s === "/" ? "index" : s.replace(/^\/+/, ""));

const all = JSON.parse(fs.readFileSync(path.join(HERE, "converted-pages.json"), "utf8"));
const existing = (await getPages()).rows ?? [];
const bySlug = new Map(existing.map((r) => [r.slug, r]));
console.log(`site: ${BASE}`);
console.log(`${all.length} converted, ${existing.length} already in the CMS`);

const wanted = ONLY ? all.filter((p) => p.slug === ONLY) : all;
if (!wanted.length) { console.error(`nothing matches --only ${ONLY}`); process.exit(1); }

const site = await getSite();
const changedPages = [];
const baseSeqs = {};
for (const p of wanted) {
  const slug = toSlug(p.slug);
  const row = bySlug.get(slug);
  const id = row?.id ?? newId();
  if (row) baseSeqs[id] = row.seq ?? 0;
  console.log(`  ${row ? "replace" : "create "} ${slug.padEnd(44)} ${Object.keys(p.body.nodes).length} nodes${row ? ` (was ${Object.keys(row.cells?.body?.nodes ?? {}).length})` : ""}`);
  changedPages.push({
    id, tableId: "pages", slug, title: p.title,
    nodes: p.body.nodes, rootNodeId: p.body.rootNodeId, status: "published",
    cells: { title: p.title, slug, body: p.body },
  });
}

const res = await api("PUT", "/admin/api/cms/site-document", {
  mode: "incremental", site: site.site, changedPages, deletedPageIds: [],
  changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [],
  baseSeqs, shellBaseSeq: site.seq,
});
console.log(`saved: ${JSON.stringify(res).slice(0, 200)}`);

// Read back: every wanted slug must now carry our node count.
const after = new Map(((await getPages()).rows ?? []).map((r) => [r.slug, r]));
let bad = 0;
for (const p of wanted) {
  const row = after.get(toSlug(p.slug));
  const n = Object.keys(row?.cells?.body?.nodes ?? {}).length;
  if (n !== Object.keys(p.body.nodes).length) { console.error(`  MISMATCH ${p.slug}: ${n} nodes live vs ${Object.keys(p.body.nodes).length}`); bad++; }
}
if (bad) process.exit(1);
console.log("every page read back with the expected node count");

if (PUBLISH) {
  console.log("publishing...");
  console.log(`publish: ${JSON.stringify(await doPublish()).slice(0, 300)}`);
  console.log(`status : ${JSON.stringify(await publishStatus()).slice(0, 200)}`);
}
