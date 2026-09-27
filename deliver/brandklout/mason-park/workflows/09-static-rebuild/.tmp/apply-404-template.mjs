// ===========================================================================
// MARK THE IMPORTED /404 PAGE AS THE SITE'S NOT-FOUND TEMPLATE.
//
//   node apply-404-template.mjs            # staging only
//   node apply-404-template.mjs --check
//
// `resolveNotFoundTemplate()` looks for a page with
// `template.target.kind === "notFound"` and serves it for every URL that falls
// through route resolution -- composed like a regular page, so it gets the
// `everywhere` layout chain and all the site chrome. With no such page,
// Instatic falls back to its own bare not-found document: an <h1> on an
// unstyled <body>, with no header, no footer and no way back.
//
// SAME TWO RULES AS apply-blog-template.mjs, for the same reasons:
//
//   1. The flags go on through PATCH /admin/api/cms/data/rows/:id, because
//      PUT /admin/api/cms/site-document rebuilds the row through
//      `pageToCells()` and only carries `template` when the in-memory Page
//      already had one -- which it never does coming from import-pages.mjs.
//      The PATCH replaces `cells` wholesale, so the whole object is read back
//      and re-sent, body included.
//
//   2. It must run AFTER any import-pages.mjs run, or the flag is gone and the
//      stock 404 is back.
//
// The slug here has no slash in it, so the slug-mangling trap that
// apply-seo.mjs documents does not bite. Do not copy this to a nested page.
// ===========================================================================
import * as I from "./insta.mjs";

const CHECK = process.argv.includes("--check");
const SLUG = "404";

// Production only on the launch: ALLOW_PRODUCTION=launch is set by the one-off
// push-production-2026-09-24.sh that took the rebuilt site live (2026-09-24).
if (!I.IS_STAGING && process.env.ALLOW_PRODUCTION !== "launch") {
  console.error("REFUSING: INSTATIC_BASE_URL is not a staging instance.");
  process.exit(1);
}

await I.login();
try { await I.stepUp(); } catch {}

const rows = (await I.api("GET", "/admin/api/cms/data/tables/pages/rows")).rows || [];
const row = rows.find((r) => (r.cells?.slug ?? r.slug) === SLUG);
if (!row) { console.error(`REFUSING: no page row with slug "${SLUG}" -- import it first`); process.exit(1); }

const nodes = Object.keys(row.cells?.body?.nodes ?? {}).length;
console.log(`page   ${row.id}  slug=${SLUG}  nodes=${nodes}`);
if (nodes <= 1) { console.error("REFUSING: that row has no body -- run import-pages.mjs first"); process.exit(1); }

const target = { kind: "notFound" };
console.log(`target ${JSON.stringify(target)}`);
if (CHECK) { console.log("\n--check: nothing written."); process.exit(0); }

await I.api("PATCH", `/admin/api/cms/data/rows/${row.id}`, {
  cells: { ...row.cells, templateEnabled: true, templateTarget: target, templatePriority: 0 },
});

// Read back rather than trusting the write.
const after = ((await I.api("GET", "/admin/api/cms/data/tables/pages/rows")).rows || [])
  .find((r) => r.id === row.id);
const ok = after?.cells?.templateEnabled === true && after?.cells?.templateTarget?.kind === "notFound";
const kept = Object.keys(after?.cells?.body?.nodes ?? {}).length;
console.log(`\ntemplateEnabled=${after?.cells?.templateEnabled} target=${JSON.stringify(after?.cells?.templateTarget)} nodes=${kept}`);
if (!ok) { console.error("! the template flags did not persist"); process.exit(1); }
if (kept <= 1) { console.error("! the page lost its body"); process.exit(1); }
console.log("every unmatched URL now renders through the /404 page");
console.log("\nNOT published. Publishing is a separate step and republishes every page.");
