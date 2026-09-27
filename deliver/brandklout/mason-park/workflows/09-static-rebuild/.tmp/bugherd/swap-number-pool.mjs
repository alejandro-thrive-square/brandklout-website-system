// The client's correct GHL number pool (2026-09-25): location 9tm8C3iReDUyrhdV01Kd,
// pool haD8dfHnprszNglZQtBV, the same location as the three new GHL forms. It
// replaces loc mZ2q3yXtue090i2YLcrj / pool IEOmxFRkrrKh72B8hqHg in every embed
// snippet on the live document: the rebuilt /ads-landing-pages/ and, on production,
// the six root Webflow-port ad pages. user_session.js is unchanged. Idempotent.
// Consent: the pool is deliberately NOT consent-gated (client, 2026-09-22), so the
// script tags are copied as they are, with no type="text/plain" or data-categories.
//   INSTATIC_BASE_URL=... node bugherd/swap-number-pool.mjs [--apply]
import * as I from "../insta.mjs";
const APPLY = process.argv.includes("--apply");
const OLD = "loc/mZ2q3yXtue090i2YLcrj/pool/IEOmxFRkrrKh72B8hqHg/number_pool.js";
const NEW = "loc/9tm8C3iReDUyrhdV01Kd/pool/haD8dfHnprszNglZQtBV/number_pool.js";
const rows = (await I.getPages()).rows;
const site = await I.getSite();
const changedPages = [], baseSeqs = {};
for (const r of rows) {
  const body = structuredClone(r.cells.body ?? {});
  let n = 0;
  for (const node of Object.values(body.nodes ?? {})) {
    for (const [k, v] of Object.entries(node.props ?? {})) {
      if (typeof v === "string" && v.includes(OLD)) { node.props[k] = v.split(OLD).join(NEW); n++; }
    }
  }
  if (!n) continue;
  console.log(`${r.slug}: ${n} snippet(s)`);
  baseSeqs[r.id] = r.seq ?? 0;
  changedPages.push({ id: r.id, tableId: "pages", slug: r.slug, title: r.cells.title, nodes: body.nodes, rootNodeId: body.rootNodeId, status: "published", cells: { ...r.cells, body } });
}
console.log(`${changedPages.length} page(s)`);
if (!APPLY || !changedPages.length) process.exit(0);
const res = await I.api("PUT", "/admin/api/cms/site-document", { mode: "incremental", site: site.site, changedPages, deletedPageIds: [], changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [], baseSeqs, shellBaseSeq: site.seq });
console.log(`saved: ${JSON.stringify(res).slice(0, 160)}`);
console.log(`publish: ${JSON.stringify(await I.publish()).slice(0, 160)}`);
console.log(`status: ${JSON.stringify(await I.publishStatus())}`);
