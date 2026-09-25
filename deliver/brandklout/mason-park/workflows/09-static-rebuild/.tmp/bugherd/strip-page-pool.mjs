// Remove the per-page GHL call-tracking Embed (number_pool.js + user_session.js) from every
// row (2026-09-25). Production loads the pool site-wide through siteScripts
// (set-site-pool.mjs), and loading it twice asks GHL for two numbers per visitor from a pool
// of four. Staging gets no pool at all, so its reviewers stop taking real numbers.
// Only Embed nodes whose snippet is nothing but those two scripts are removed; the node is
// dropped from its parent's children. Idempotent. --apply saves and publishes.
//   INSTATIC_BASE_URL=... node bugherd/strip-page-pool.mjs [--apply]
import * as I from "../insta.mjs";
const APPLY = process.argv.includes("--apply");
const ONLY_POOL = /^(\s*<script src="https:\/\/backend\.leadconnectorhq\.com\/appengine\/(loc\/[A-Za-z0-9]+\/pool\/[A-Za-z0-9]+\/number_pool|js\/user_session)\.js"><\/script>\s*)+$/;
const rows = (await I.getPages()).rows;
const site = await I.getSite();
const changedPages = [], baseSeqs = {};
for (const r of rows) {
  const body = structuredClone(r.cells.body ?? {});
  const hits = Object.values(body.nodes ?? {}).filter((n) => n.moduleId === "brandklout.embed-origins.embed" && ONLY_POOL.test(n.props?.snippet ?? ""));
  if (!hits.length) continue;
  for (const n of hits) {
    const parent = body.nodes[n.parentId];
    if (parent) parent.children = parent.children.filter((c) => c !== n.id);
    delete body.nodes[n.id];
  }
  console.log(`${r.slug}: ${hits.length} pool embed(s)`);
  baseSeqs[r.id] = r.seq ?? 0;
  changedPages.push({ id: r.id, tableId: "pages", slug: r.slug, title: r.cells.title, nodes: body.nodes, rootNodeId: body.rootNodeId, status: "published", cells: { ...r.cells, body } });
}
console.log(`${changedPages.length} page(s)`);
if (!APPLY || !changedPages.length) process.exit(0);
const res = await I.api("PUT", "/admin/api/cms/site-document", { mode: "incremental", site: site.site, changedPages, deletedPageIds: [], changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [], baseSeqs, shellBaseSeq: site.seq });
console.log(`saved: ${JSON.stringify(res).slice(0, 160)}`);
console.log(`publish: ${JSON.stringify(await I.publish()).slice(0, 160)}`);
console.log(`status: ${JSON.stringify(await I.publishStatus())}`);
