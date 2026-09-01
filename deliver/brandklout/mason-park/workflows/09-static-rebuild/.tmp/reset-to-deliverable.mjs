// Reduce an Instatic instance to exactly what `home/` contains, plus the
// pages named in KEEP. Everything else is deleted.
//
//   INSTATIC_BASE_URL=https://staging.masonparkdental.com node reset-to-deliverable.mjs
//   ... --apply            do it
//   ... --apply --publish  do it and publish
//
// ONE PUT. The delete and the write go in the same site-document call, so the
// site is never in a state where the old pages are gone and the new ones have
// not landed. `mode: incremental` still applies: a row nobody names is left
// alone, which is what protects everything in KEEP.
//
// STAGING ONLY, and not by convention: production carries six paid-traffic
// landing pages (workflows/10-lp-instatic) and the repo `.env` points at it.
// This refuses to run anywhere IS_STAGING is false, and --i-know refuses to
// exist. If you ever need this on production, read the backup path first.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { api, getPages, getSite, publish as doPublish, publishStatus, BASE, IS_STAGING } from "./insta.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const APPLY = argv.includes("--apply");
const PUBLISH = argv.includes("--publish");

// Slugs that survive the reset even though `home/` has no such folder.
// `404` is Instatic's notFound TEMPLATE target: without it every unmatched URL
// -- which on a two page site is every link in the 55-item menu -- falls
// through to a bare 21-byte {"error":"Not found"}.
const KEEP = new Set(["404"]);

if (!IS_STAGING) {
  console.error(`${BASE} is not a staging instance. Refusing.`);
  console.error("This script deletes every page it is not told to keep.");
  process.exit(1);
}

const converted = JSON.parse(fs.readFileSync(path.join(HERE, "converted-pages.json"), "utf8"));
/** `/` -> `index`; `/services/invisalign` -> `services/invisalign`. */
const toSlug = (s) => (s === "/" ? "index" : s.replace(/^\/+/, ""));
const incoming = new Map(converted.map((p) => [toSlug(p.slug), p]));

const rows = (await getPages()).rows ?? [];
const bySlug = new Map(rows.map((r) => [r.cells?.slug ?? r.slug, r]));

const keep = [], replace = [], remove = [];
for (const r of rows) {
  const slug = r.cells?.slug ?? r.slug;
  if (incoming.has(slug)) replace.push(r);
  else if (KEEP.has(slug)) keep.push(r);
  else remove.push(r);
}
const create = [...incoming.keys()].filter((s) => !bySlug.has(s));

console.log(`${BASE}  (staging)`);
console.log(`  ${rows.length} pages now`);
console.log(`  keep     ${keep.length}   ${keep.map((r) => "/" + (r.cells?.slug ?? r.slug)).join(", ") || "-"}`);
console.log(`  replace  ${replace.length}   ${replace.map((r) => "/" + (r.cells?.slug ?? r.slug)).join(", ") || "-"}`);
console.log(`  create   ${create.length}   ${create.map((s) => "/" + s).join(", ") || "-"}`);
console.log(`  DELETE   ${remove.length}`);
for (const r of remove) console.log(`      /${r.cells?.slug ?? r.slug}`);
console.log(`  -> ${keep.length + replace.length + create.length} pages after`);

const status = await publishStatus();
console.log(`  publish now: ${JSON.stringify(status)}`);

if (!APPLY) {
  console.log("\ndry run - pass --apply to write, --apply --publish to publish");
  process.exit(0);
}

const ALPHABET = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";
const newId = () => Array.from(crypto.randomBytes(21), (b) => ALPHABET[b & 63]).join("");

const site = await getSite();
const changedPages = [];
const baseSeqs = {};
for (const [slug, p] of incoming) {
  const row = bySlug.get(slug);
  const id = row?.id ?? newId();
  if (row) baseSeqs[id] = row.seq ?? 0;
  // The validator wants a flat Page; the stored DataRow keeps it under cells.
  // Send both shapes - cells is what persists, the flat copy is what validates.
  changedPages.push({
    id,
    tableId: "pages",
    slug,
    title: p.title,
    nodes: p.body.nodes,
    rootNodeId: p.body.rootNodeId,
    status: "published",
    cells: { title: p.title, slug, body: p.body },
  });
}

// A DELETE IS A WRITE, AND IT IS OPTIMISTICALLY LOCKED LIKE ANY OTHER.
// `deletedPageIds` carries no seq of its own, so the row's current seq has to
// be quoted in `baseSeqs` exactly as it is for a changed row. Omitting them
// sends an implicit 0 for each and the save comes back 409 "Another admin saved
// a newer version of content in this save", naming every page being deleted --
// with no other admin anywhere near it. The newer version is each row's own
// current seq, unquoted. push-404-page.mjs documents this for changed rows;
// it is the same rule for deleted ones.
for (const r of remove) baseSeqs[r.id] = r.seq ?? 0;

const res = await api("PUT", "/admin/api/cms/site-document", {
  mode: "incremental",
  site: site.site,
  changedPages,
  deletedPageIds: remove.map((r) => r.id),
  changedComponents: [],
  deletedComponentIds: [],
  changedLayouts: [],
  deletedLayoutIds: [],
  baseSeqs,
  shellBaseSeq: site.seq,
});
console.log(`\nsaved: ${JSON.stringify(res).slice(0, 200)}`);

const after = (await getPages()).rows ?? [];
console.log(`pages now: ${after.length}`);
for (const r of after) console.log(`  /${r.cells?.slug ?? r.slug}`);

if (PUBLISH) {
  console.log("\npublishing...");
  console.log(JSON.stringify(await doPublish()).slice(0, 200));
  console.log(`status: ${JSON.stringify(await publishStatus())}`);
  console.log(`live at ${BASE}`);
}
