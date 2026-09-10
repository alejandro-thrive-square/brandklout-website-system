// ===========================================================================
// TURN THE IMPORTED /blog-article PAGE INTO THE ARTICLES ENTRY TEMPLATE.
//
//   node apply-blog-template.mjs            # staging only
//   node apply-blog-template.mjs --check
//
// The `pages` table declares templateEnabled / templateTarget / templatePriority
// and `pageFromRow()` reads them back as `page.template`, which is what
// `resolveTemplateChain()` matches an entry route against. But the bulk save
// path -- PUT /admin/api/cms/site-document -- rebuilds each row through
// `pageToCells()` from the FLAT Page shape it validates, and only carries
// `template` when the in-memory Page already had one. import-pages.mjs sends a
// plain page, so the flags have to go on afterwards through the per-row
// endpoint, which keeps whatever it is handed:
//
//     PATCH /admin/api/cms/data/rows/:id      (NOT nested under the table)
//
// That PATCH replaces `cells` WHOLESALE, so the whole object -- body included
// -- is read back and re-sent. Same rule as apply-seo.mjs.
//
// The target shape is `{ kind: 'postTypes', tableSlugs: ['articles'] }`:
// tableSLUG, not tableId. `matchesLevel()` compares
// `target.tableSlugs.includes(ctx.tableSlug)` and the route context carries the
// table's slug.
// ===========================================================================
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as I from "./insta.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CHECK = process.argv.includes("--check");

const TEMPLATE_SLUG = "blog-article";
const TABLE_SLUG = "articles";

if (!I.IS_STAGING) {
  console.error("REFUSING: INSTATIC_BASE_URL is not a staging instance.");
  process.exit(1);
}

await I.login();
try { await I.stepUp(); } catch {}

// The table has to exist and own /blog, or the template targets nothing.
const table = (await I.api("GET", "/admin/api/cms/data/tables")).tables
  .find((t) => t.slug === TABLE_SLUG);
if (!table) { console.error(`REFUSING: no data table with slug "${TABLE_SLUG}"`); process.exit(1); }
console.log(`table  ${table.id}  slug=${table.slug}  routeBase=${table.routeBase}  rows=${table.rowCount}`);

const rows = (await I.api("GET", "/admin/api/cms/data/tables/pages/rows")).rows || [];
const row = rows.find((r) => (r.cells?.slug ?? r.slug) === TEMPLATE_SLUG);
if (!row) { console.error(`REFUSING: no page row with slug "${TEMPLATE_SLUG}" -- import it first`); process.exit(1); }

const target = { kind: "postTypes", tableSlugs: [TABLE_SLUG] };
const cells = {
  ...row.cells,
  templateEnabled: true,
  templateTarget: target,
  templatePriority: 0,
};

console.log(`page   ${row.id}  slug=${TEMPLATE_SLUG}  nodes=${Object.keys(row.cells?.body?.nodes ?? {}).length}`);
console.log(`target ${JSON.stringify(target)}`);

if (CHECK) { console.log("\n--check: nothing written."); process.exit(0); }

await I.api("PATCH", `/admin/api/cms/data/rows/${row.id}`, { cells });

// Read back rather than trusting the write.
const after = ((await I.api("GET", "/admin/api/cms/data/tables/pages/rows")).rows || [])
  .find((r) => r.id === row.id);
const ok = after?.cells?.templateEnabled === true
  && after?.cells?.templateTarget?.tableSlugs?.[0] === TABLE_SLUG;
const nodes = Object.keys(after?.cells?.body?.nodes ?? {}).length;
console.log(`\ntemplateEnabled=${after?.cells?.templateEnabled} target=${JSON.stringify(after?.cells?.templateTarget)} nodes=${nodes}`);
if (!ok) { console.error("! the template flags did not persist"); process.exit(1); }
if (nodes <= 1) { console.error("! the page lost its body"); process.exit(1); }
console.log(`every /blog/<slug> now renders through ${TEMPLATE_SLUG}`);
console.log("\nNOT published. Publishing is a separate step and republishes every page.");
