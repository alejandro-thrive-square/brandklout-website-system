// ===========================================================================
// IMPORT THE 161 BLOG ARTICLES INTO THE INSTATIC "Articles" COLLECTION.
//
// The blog lives as CMS DATA, not as 161 static pages, so the practice can
// edit a post without a rebuild and add new ones without this repo.
//
// Why a CUSTOM table and not the built-in `posts`: the system table refuses
// to change either its name or its routeBase ("System tables can't change
// their routeBase"), which would have put every article at /posts/<slug>.
// A custom postType table takes routeBase /blog and keeps the URLs the static
// build already uses.
//
// SAFETY, from deliver/process/22-instatic-api-sync:
//   - PATCH .../rows/:id replaces `cells` WHOLESALE and answers 200 to a
//     partial patch that silently deletes every omitted cell. This script
//     therefore only ever POSTs whole rows, and re-runs are idempotent by
//     slug: an existing row is PATCHed with a COMPLETE cells object.
//   - It does not publish. Publishing is a separate, deliberate step, and
//     POST /publish republishes every page on the instance.
//
//   node import-articles.mjs --check     # report only, touches nothing
//   node import-articles.mjs --limit 3   # a pilot
//   node import-articles.mjs             # all 161
// ===========================================================================
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as I from "./insta.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const rows = JSON.parse(fs.readFileSync(path.join(HERE, "blog", "cms-rows.json"), "utf8"));

const CHECK = process.argv.includes("--check");
const li = process.argv.indexOf("--limit");
const LIMIT = li > -1 ? Number(process.argv[li + 1]) : Infinity;

// Production only on the launch: ALLOW_PRODUCTION=launch is set by the one-off
// push-production-2026-09-24.sh that took the rebuilt site live (2026-09-24).
if (!I.IS_STAGING && process.env.ALLOW_PRODUCTION !== "launch") {
  console.error("REFUSING: INSTATIC_BASE_URL is not a staging instance. This script is staging-only.");
  process.exit(1);
}

await I.login();
try { await I.stepUp(); } catch {}

const tables = (await I.api("GET", "/admin/api/cms/data/tables")).tables;
const table = tables.find((t) => t.routeBase === "/blog" && t.kind === "postType");
if (!table) {
  console.error("REFUSING: no postType table with routeBase /blog. Create it first.");
  process.exit(1);
}
console.log(`table ${table.id} (${table.name}) routeBase=${table.routeBase}`);
console.log(`fields: ${table.fields.map((f) => f.id).join(" ")}`);

const ROWS_URL = `/admin/api/cms/data/tables/${table.id}/rows`;
const existing = (await I.api("GET", ROWS_URL)).rows || [];
const bySlug = new Map(existing.map((r) => [r.cells?.slug ?? r.slug, r]));
console.log(`${existing.length} row(s) already present, ${rows.length} to import\n`);

// Only the fields the table actually declares are sent. An unknown cell is
// either rejected or silently kept out of the UI, and neither is useful.
const known = new Set(table.fields.map((f) => f.id));
const cellsFor = (r) => {
  const c = {
    title: r.cells.title,
    slug: r.cells.slug,
    body: r.cells.body,
    seoTitle: r.cells.seoTitle || r.cells.title,
    seoDescription: r.cells.metaDescription || "",
    // The listing card reads these. `dateDisplay` / `dateIso` exist because
    // the row's own publishedAt column is when the row entered Instatic, not
    // when the practice published the article -- see blog-to-cms.mjs.
    topic: r.cells.topic || "",
    excerpt: r.cells.excerpt || "",
    dateDisplay: r.cells.dateDisplay || "",
    dateIso: r.cells.dateIso || "",
  };
  for (const k of Object.keys(c)) if (!known.has(k)) delete c[k];
  return c;
};

if (CHECK) {
  const sample = cellsFor(rows[0]);
  console.log("would send, per row:", Object.keys(sample).join(" "));
  console.log("sample title:", sample.title);
  console.log("body bytes  :", sample.body.length);
  console.log(`\n${rows.length} rows, ${bySlug.size} already exist. Nothing written.`);
  process.exit(0);
}

let created = 0, updated = 0, failed = 0;
const chosen = rows.slice(0, LIMIT);

for (const [i, r] of chosen.entries()) {
  const cells = cellsFor(r);
  const prev = bySlug.get(r.slug);
  try {
    if (prev) {
      // WHOLE object, never a partial patch -- see the header.
      // The PATCH endpoint is NOT nested under the table: process 22
      // documents it as /admin/api/cms/data/rows/:id, and the nested path
      // 404s. Cost three rows on the first full run.
      await I.api("PATCH", `/admin/api/cms/data/rows/${prev.id}`, { cells });
      updated++;
    } else {
      await I.api("POST", ROWS_URL, { cells });
      created++;
    }
  } catch (e) {
    failed++;
    console.log(`\n  FAIL ${r.slug}: ${String(e.message).slice(0, 140)}`);
  }
  if ((i + 1) % 10 === 0 || i === chosen.length - 1) {
    process.stdout.write(`\r  ${i + 1}/${chosen.length}  created ${created}  updated ${updated}  failed ${failed}`);
  }
}
console.log("");

// Read back rather than trusting the writes.
const after = (await I.api("GET", ROWS_URL)).rows || [];
console.log(`\nread back: ${after.length} row(s) in the collection`);
const missing = chosen.filter((r) => !after.some((a) => (a.cells?.slug ?? a.slug) === r.slug));
if (missing.length) console.log(`! ${missing.length} row(s) did not land: ${missing.slice(0, 5).map((m) => m.slug).join(", ")}`);
const empty = after.filter((a) => !a.cells?.body);
if (empty.length) console.log(`! ${empty.length} row(s) have an EMPTY body`);
if (!missing.length && !empty.length) console.log("every row present with a body");
console.log("\nNOT published. Publishing is a separate step and republishes every page.");
