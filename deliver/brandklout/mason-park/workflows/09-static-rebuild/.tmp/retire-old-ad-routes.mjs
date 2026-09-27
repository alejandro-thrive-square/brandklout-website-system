/**
 * Remove the six first-cut paid routes from STAGING, now that the second cut
 * lives under /ads-landing-pages/.
 *
 *   INSTATIC_BASE_URL=https://staging.masonparkdental.com node retire-old-ad-routes.mjs          # dry run
 *   INSTATIC_BASE_URL=https://staging.masonparkdental.com node retire-old-ad-routes.mjs --apply
 *
 * Staging only, and it refuses anything else: production serves its paid
 * traffic from exactly these six root slugs (the workflow-10 Webflow ports),
 * and deleting them there would 404 every running ad. It also refuses to run
 * until all six replacements exist, so staging is never left with neither set.
 *
 * A delete is optimistically locked like any other write: each row's current
 * seq goes in `baseSeqs`, or the save comes back 409 (see reset-to-deliverable).
 */
import { api, getPages, getSite, IS_STAGING, BASE } from "./insta.mjs";

if (!IS_STAGING) throw new Error(`${BASE} is not staging. Production's ads land on these slugs; refusing.`);
const APPLY = process.argv.includes("--apply");

const OLD = [
  "invisalign", "invisalign-consultation", "invisalign-thank-you",
  "new-patient-special", "new-patient-special-consultation", "new-patient-thank-you",
];
const rows = (await getPages()).rows ?? [];
const slugOf = (r) => r.cells?.slug ?? r.slug;
const missing = OLD.filter((s) => !rows.some((r) => slugOf(r) === `ads-landing-pages/${s}`));
if (missing.length) throw new Error(`replacements not imported yet: ${missing.join(", ")}`);

const remove = rows.filter((r) => OLD.includes(slugOf(r)));
console.log(`${rows.length} pages on ${BASE}; ${remove.length} first-cut paid route(s) to remove:`);
for (const r of remove) console.log(`  /${slugOf(r)}  (${r.id}, seq ${r.seq ?? 0})`);
if (!remove.length) { console.log("nothing to do"); process.exit(0); }
if (!APPLY) { console.log("dry run. Pass --apply to delete."); process.exit(0); }

const site = await getSite();
const baseSeqs = {};
for (const r of remove) baseSeqs[r.id] = r.seq ?? 0;
const res = await api("PUT", "/admin/api/cms/site-document", {
  mode: "incremental",
  site: site.site,
  changedPages: [],
  deletedPageIds: remove.map((r) => r.id),
  changedComponents: [],
  deletedComponentIds: [],
  changedLayouts: [],
  deletedLayoutIds: [],
  baseSeqs,
  shellBaseSeq: site.seq,
});
console.log(`saved: ${JSON.stringify(res).slice(0, 200)}`);
console.log(`pages now: ${((await getPages()).rows ?? []).length}`);
