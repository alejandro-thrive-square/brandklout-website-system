// Point every remaining Flexbook link on the live document at /contacts (2026-09-25:
// "every Book button goes to the Contacts page, where the GHL form lives"). The
// rebuilt pages already link there from the build; this is for the production-only
// rows the rebuild does not have (old Webflow-era pages: "Schedule Online" links).
// Only base.link hrefs change; the cookie and privacy policies' TEXT naming FlexBook
// as a service is legal copy and is left alone. Idempotent. --apply saves and publishes.
//   INSTATIC_BASE_URL=https://www.masonparkdental.com node bugherd/patch-old-flexbook.mjs [--apply]
import * as I from "../insta.mjs";
const APPLY = process.argv.includes("--apply");
const rows = (await I.getPages()).rows;
const site = await I.getSite();
const changedPages = [], baseSeqs = {};
let total = 0;
for (const r of rows) {
  const body = structuredClone(r.cells.body ?? {});
  let n = 0;
  for (const node of Object.values(body.nodes ?? {})) {
    if (node.moduleId === "base.link" && /flexbook/i.test(node.props?.href ?? "")) {
      node.props.href = "/contacts";
      node.props.target = "_self";
      n++;
    }
    for (const o of Object.values(node.breakpointOverrides ?? {})) if (/flexbook/i.test(o?.href ?? "")) { o.href = "/contacts"; n++; }
  }
  if (!n) continue;
  total += n;
  console.log(`${r.slug}: ${n} link(s)`);
  baseSeqs[r.id] = r.seq ?? 0;
  changedPages.push({ id: r.id, tableId: "pages", slug: r.slug, title: r.cells.title, nodes: body.nodes, rootNodeId: body.rootNodeId, status: "published", cells: { ...r.cells, body } });
}
console.log(`${total} link(s) on ${changedPages.length} page(s)`);
if (!APPLY || !changedPages.length) process.exit(0);
const res = await I.api("PUT", "/admin/api/cms/site-document", { mode: "incremental", site: site.site, changedPages, deletedPageIds: [], changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [], baseSeqs, shellBaseSeq: site.seq });
console.log(`saved: ${JSON.stringify(res).slice(0, 160)}`);
console.log(`publish: ${JSON.stringify(await I.publish()).slice(0, 160)}`);
console.log(`status: ${JSON.stringify(await I.publishStatus())}`);
