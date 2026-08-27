/**
 * Write converted pages into Instatic and (optionally) publish.
 *
 *   node import-pages.mjs --only core     # the 10 pages the site cannot open without
 *   node import-pages.mjs                 # everything left
 *   node import-pages.mjs --publish       # publish after saving
 *
 * Saves go through PUT /admin/api/cms/site-document in `incremental` mode, so a
 * row nobody mentions is left alone and this can run in batches.
 *
 * Instatic calls the home page `index`; our export calls it `/`. The default
 * install already HAS an index row, so home reuses that row's id - creating a
 * second one would land as `index-2`, not an overwrite.
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

const CORE = [
  "/", "/about-us", "/our-services", "/our-doctors", "/contacts",
  "/appointment", "/financing", "/patient-resources",
  "/services/dental-implants", "/services/invisalign",
];

const ALPHABET = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";
const newId = () => Array.from(crypto.randomBytes(21), (b) => ALPHABET[b & 63]).join("");

/** `/` -> `index`; `/services/invisalign` -> `services/invisalign`. */
const toSlug = (s) => (s === "/" ? "index" : s.replace(/^\/+/, ""));

const all = JSON.parse(fs.readFileSync(path.join(HERE, "converted-pages.json"), "utf8"));
const existing = (await getPages()).rows ?? [];
const bySlug = new Map(existing.map((r) => [r.slug, r]));
console.log(`${all.length} converted, ${existing.length} already in the CMS`);

let wanted = all;
if (ONLY === "core") wanted = all.filter((p) => CORE.includes(p.slug));
else if (ONLY) wanted = all.filter((p) => p.slug === ONLY);

// Skip anything already carrying real content, so re-runs are cheap and a
// second batch never clobbers the first.
const todo = wanted.filter((p) => {
  const row = bySlug.get(toSlug(p.slug));
  if (!row) return true;
  const nodes = row.cells?.body?.nodes ?? {};
  return Object.keys(nodes).length <= 1; // just the empty base.body
});
console.log(`writing ${todo.length} page(s)${ONLY ? ` (--only ${ONLY})` : ""}`);
if (!todo.length && !PUBLISH) { console.log("nothing to do"); process.exit(0); }

const site = await getSite();
const changedPages = [];
const baseSeqs = {};

for (const p of todo) {
  const slug = toSlug(p.slug);
  const row = bySlug.get(slug);
  const id = row?.id ?? newId();
  if (row) baseSeqs[id] = row.seq ?? 0;
  // The validator wants a flat Page - title, slug, nodes and rootNodeId on the
  // row itself - while the stored DataRow keeps them under `cells.body`. Send
  // both shapes: cells is what persists, the flat copy is what validates.
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

if (changedPages.length) {
  const res = await api("PUT", "/admin/api/cms/site-document", {
    mode: "incremental",
    site: site.site,
    changedPages,
    deletedPageIds: [],
    changedComponents: [],
    deletedComponentIds: [],
    changedLayouts: [],
    deletedLayoutIds: [],
    baseSeqs,
    shellBaseSeq: site.seq,
  });
  console.log(`saved: ${JSON.stringify(res).slice(0, 200)}`);
}

if (PUBLISH) {
  console.log("publishing...");
  const r = await doPublish();
  console.log(`publish: ${JSON.stringify(r).slice(0, 300)}`);
  console.log(`status : ${JSON.stringify(await publishStatus()).slice(0, 200)}`);
  console.log(`live at ${BASE}`);
}
