// ===========================================================================
// DO NOT USE THIS ON THE `pages` TABLE. It is kept as a record of why.
//
//   node apply-seo.mjs            # refuses, and explains
//   node apply-seo.mjs --i-know   # runs anyway, and WILL break nested routes
//
// WHAT IT DID. The `pages` table declares `seoTitle` and `seoDescription`, and
// PUT /admin/api/cms/site-document drops both (it rebuilds each row through
// `pageToCells()`, which only carries title, slug, body and the template
// flags). So this wrote them afterwards through the per-row endpoint,
// PATCH /admin/api/cms/data/rows/:id, and the read-back said 49/49.
//
// TWO THINGS WERE WRONG WITH THAT.
//
// 1. IT BROKE EVERY NESTED ROUTE. `handleRowItemPatch` does not store the slug
//    you send -- it RE-DERIVES the denormalized `data_rows.slug` column from
//    the cells:
//        slugForTable(table, cells) -> slugFromTitle(cells.slug)
//        slugFromTitle: .replace(/[^a-z0-9]+/g, '-')
//    which turns `services/invisalign` into `services-invisalign`. The public
//    router looks a page up by that exact column
//    (`where data_rows.slug = $1`), so all 31 treatment pages started
//    answering 404 while `cells.slug` still read `services/invisalign` and the
//    admin looked perfectly healthy. The site-document path writes the slug
//    verbatim and is the only safe way to save a page row with a slash in it.
//
// 2. IT WOULD NOT HAVE RENDERED ANYWAY. `renderPublishedSnapshot()` -- the
//    regular-page path -- passes NO `documentMeta`, so `<meta name=
//    "description">` falls through to the site-level `settings.metaDescription`
//    for every page. Only ENTRY routes carry a per-row description:
//    `renderPublishedDataRowTemplate()` calls `readEntrySeoOverride(row.cells)`
//    and hands it to `publishPage` as `documentMeta`. The 161 blog articles
//    therefore DO get their own description; the 49 static pages cannot, and no
//    amount of writing the cell changes that.
//
// So per-page meta descriptions are a gap in this Instatic build, not a step
// this pipeline forgot. Reporting it is the fix; writing the cell is not.
// ===========================================================================
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as I from "./insta.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OVERRIDE = process.argv.includes("--i-know");

if (!OVERRIDE) {
  console.error([
    "REFUSING to PATCH page rows.",
    "",
    "  PATCH /admin/api/cms/data/rows/:id re-derives data_rows.slug through",
    "  slugFromTitle(), which collapses `services/invisalign` to",
    "  `services-invisalign` and 404s the page. See the header of this file.",
    "",
    "  Page seoDescription is also never rendered by this build: only entry",
    "  routes pass documentMeta. Blog articles get theirs from import-articles.mjs.",
    "",
    "  If you need to repair slugs after someone ran this: re-run",
    "    node import-pages.mjs --overwrite",
    "  then re-run apply-blog-template.mjs, which import-pages drops.",
  ].join("\n"));
  process.exit(1);
}

const ci = process.argv.indexOf("--converted");
const converted = JSON.parse(fs.readFileSync(
  path.join(HERE, ci > -1 ? process.argv[ci + 1] : "converted-pages.json"), "utf8"));
const toSlug = (s) => (s === "/" ? "index" : s.replace(/^\/+/, ""));
const want = new Map(converted.map((p) => [toSlug(p.slug), p]));

await I.login();
try { await I.stepUp(); } catch {}

const rows = (await I.api("GET", "/admin/api/cms/data/tables/pages/rows")).rows || [];
let done = 0, failed = 0;
for (const row of rows) {
  const src = want.get(row.cells?.slug ?? row.slug);
  if (!src) continue;
  try {
    await I.api("PATCH", `/admin/api/cms/data/rows/${row.id}`, {
      cells: { ...row.cells, seoTitle: src.title, seoDescription: src.description || "" },
    });
    done++;
  } catch (e) {
    failed++;
    console.log(`  FAIL ${row.cells?.slug}: ${String(e.message).slice(0, 140)}`);
  }
}
console.log(`${done} written, ${failed} failed`);

const after = (await I.api("GET", "/admin/api/cms/data/tables/pages/rows")).rows || [];
const broken = after.filter((r) => String(r.cells?.slug ?? "").includes("/") && !String(r.slug).includes("/"));
if (broken.length) {
  console.log(`! ${broken.length} row(s) now have a mangled routable slug -- run import-pages.mjs --overwrite:`);
  for (const r of broken.slice(0, 5)) console.log(`    ${r.cells.slug} -> ${r.slug}`);
}
