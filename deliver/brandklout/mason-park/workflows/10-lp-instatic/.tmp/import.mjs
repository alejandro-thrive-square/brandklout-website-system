/**
 * Write the six landing pages, their class registry and their stylesheet into
 * Instatic in ONE site-document save.
 *
 *   node import.mjs [--publish]
 *
 * Three things have to land together or the pages come out wrong:
 *
 *  1. PAGES.  The validator wants a flat Page - title, slug, nodes, rootNodeId
 *     on the row itself - while the stored DataRow keeps them under
 *     `cells.body`. Send both shapes: cells is what persists, the flat copy is
 *     what validates.
 *  2. CLASSES.  Instatic only emits a class attribute for a class it has a rule
 *     for. The converter kept our names in `node.classIds`, so registering the
 *     204 names as EMPTY rules restores the attributes, and lp.css does the
 *     actual styling. Existing rules are never overwritten - 44 of these names
 *     are already registered by the main site and their rules are not ours.
 *  3. STYLESHEET.  lp.css ships as a second style asset. It is namespaced to
 *     `.lp-page` (see scope-css.mjs), so it cannot reach the 71 live pages even
 *     though it redefines names they use.
 *
 * A SiteFile needs BOTH `id` (nanoid) and `path`. Without `id` the save answers
 * ok:true and `files` comes back empty - this is why the main site once went
 * live unstyled.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { api, getSite, getPages, publish as doPublish, publishStatus, BASE } from "../../09-static-rebuild/.tmp/insta.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PUBLISH = process.argv.includes("--publish");
const ASSET_PATH = "src/styles/mason-park-lp.css";

const ALPHABET = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";
const newId = () => Array.from(crypto.randomBytes(21), (b) => ALPHABET[b & 63]).join("");

const pages = JSON.parse(fs.readFileSync(path.join(HERE, "converted-pages.json"), "utf8"));
const css = fs.readFileSync(path.join(HERE, "out", "lp.css"), "utf8");

const classNames = new Set();
for (const p of pages) {
  for (const n of Object.values(p.body.nodes)) for (const c of n.classIds ?? []) classNames.add(c);
}
console.log(`${pages.length} pages, ${classNames.size} classes, lp.css ${(css.length / 1024).toFixed(0)} KB`);

const site = await getSite();
const shell = site.site;
const existing = (await getPages()).rows ?? [];
const bySlug = new Map(existing.map((r) => [r.slug, r]));

// ---------------------------------------------------------------- 1. pages
const changedPages = [];
const baseSeqs = {};
for (const p of pages) {
  const row = bySlug.get(p.slug);
  const id = row?.id ?? newId();
  if (row) baseSeqs[id] = row.seq ?? 0;
  changedPages.push({
    id,
    tableId: "pages",
    slug: p.slug,
    title: p.title,
    nodes: p.body.nodes,
    rootNodeId: p.body.rootNodeId,
    status: "published",
    cells: { title: p.title, slug: p.slug, body: p.body },
  });
  console.log(`  ${row ? "update" : "create"}  ${p.slug.padEnd(34)} ${Object.keys(p.body.nodes).length} nodes`);
}

// -------------------------------------------------------------- 2. classes
const styleRules = { ...(shell.styleRules ?? {}) };
let order = Object.keys(styleRules).length;
let added = 0, reused = 0;
for (const name of classNames) {
  if (styleRules[name]) { reused++; continue; }
  styleRules[name] = {
    id: name, kind: "class", name, selector: `.${name}`,
    declarations: {}, conditions: [], order: order++,
  };
  added++;
}
console.log(`classes: ${added} registered, ${reused} already present (left untouched)`);

// ----------------------------------------------------------- 3. stylesheet
const files = [...(shell.files ?? [])];
const at = files.findIndex((f) => f.path === ASSET_PATH);
const asset = {
  id: at >= 0 ? files[at].id : newId(),
  path: ASSET_PATH,
  type: "style",
  content: css,
};
if (at >= 0) files[at] = { ...files[at], ...asset }; else files.push(asset);
console.log(`stylesheet: ${at >= 0 ? "replaced" : "added"} ${ASSET_PATH}`);
console.log(`site files now: ${files.map((f) => f.path).join(", ")}`);

const res = await api("PUT", "/admin/api/cms/site-document", {
  mode: "incremental",
  site: { ...shell, styleRules, files },
  changedPages,
  deletedPageIds: [],
  changedComponents: [],
  deletedComponentIds: [],
  changedLayouts: [],
  deletedLayoutIds: [],
  baseSeqs,
  shellBaseSeq: site.seq,
});
console.log(`\nsaved: ${JSON.stringify(res).slice(0, 200)}`);

if (PUBLISH) {
  console.log("publishing...");
  console.log(`publish: ${JSON.stringify(await doPublish()).slice(0, 300)}`);
  console.log(`status : ${JSON.stringify(await publishStatus()).slice(0, 200)}`);
  for (const p of pages) console.log(`  ${BASE}/${p.slug}`);
}
