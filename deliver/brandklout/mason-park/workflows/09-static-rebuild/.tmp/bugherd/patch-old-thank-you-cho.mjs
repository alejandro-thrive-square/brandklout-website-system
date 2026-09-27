// Take Dr. Sung off the two OLD Webflow-port thank-you pages still live at the root
// slugs on production (/invisalign-thank-you, /new-patient-thank-you): the client asked
// that Dr. Sung not be on the ad landing pages, and these are where the live ads' forms
// land. Two paragraphs per page, edited in place on the live document (the pages are
// not in the local build). Idempotent. --apply saves and publishes.
//   INSTATIC_BASE_URL=https://www.masonparkdental.com node patch-old-thank-you-cho.mjs [--apply]
import * as I from "../insta.mjs";
const APPLY = process.argv.includes("--apply");
const SWAPS = [
  ["Dr. Nguyen earned her dental degree from Boston University and returned there for her pediatric residency and specialty degree. Dr. Cho obtained his dental degree from Tufts University, and Dr. Sung holds a Fellowship in the Academy of General Dentistry, held by only 7% of general dentists in Texas.",
   "Dr. Cho obtained his dental degree from Tufts University and is experienced in cosmetic dentistry, implants, root canals and oral surgery. Dr. Nguyen earned her dental degree from Boston University and returned there for her pediatric residency and specialty degree."],
  ["Dr. Nguyen, Dr. Cho and Dr. Sung are committed to providing excellent dentistry in a comfortable environment, and we welcome new patients of all ages. Dr. Cho is experienced in oral sedation for patients who need it.",
   "Dr. Cho and Dr. Nguyen are committed to providing excellent dentistry in a comfortable environment, and we welcome new patients of all ages. Dr. Cho is experienced in oral sedation for patients who need it."],
];
const rows = (await I.getPages()).rows;
const site = await I.getSite();
const changedPages = [], baseSeqs = {};
for (const slug of ["invisalign-thank-you", "new-patient-thank-you"]) {
  const r = rows.find((x) => x.slug === slug);
  const body = structuredClone(r.cells.body);
  let n = 0;
  for (const node of Object.values(body.nodes)) for (const [a, b] of SWAPS) if (node.props?.text === a) { node.props.text = b; n++; }
  console.log(`${slug}: ${n} paragraph(s) to change`);
  if (!n) continue;
  baseSeqs[r.id] = r.seq ?? 0;
  changedPages.push({ id: r.id, tableId: "pages", slug, title: r.cells.title, nodes: body.nodes, rootNodeId: body.rootNodeId, status: "published", cells: { ...r.cells, body } });
}
if (!APPLY || !changedPages.length) process.exit(0);
const res = await I.api("PUT", "/admin/api/cms/site-document", { mode: "incremental", site: site.site, changedPages, deletedPageIds: [], changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [], baseSeqs, shellBaseSeq: site.seq });
console.log(`saved: ${JSON.stringify(res).slice(0, 160)}`);
console.log(`publish: ${JSON.stringify(await I.publish()).slice(0, 160)}`);
console.log(`status: ${JSON.stringify(await I.publishStatus())}`);
