// Retire the six root Webflow-port ad pages on PRODUCTION (client, 2026-09-25: "remove the
// ads landing pages that are not in the ads landing pages folder"). Instatic has no server
// redirects, and the live Google Ads and the old GHL forms may still send people to these
// URLs, so each row's body is replaced with one Embed block that forwards to its
// /ads-landing-pages/ twin: location.replace keeps the query string (gclid, UTMs) and the
// hash; a meta refresh in <noscript> covers no-JS; a visible link covers everything else. The rows keep
// their ids and slugs. Their old bodies are in the backup taken first
// (backup-www...2026-09-25T19-34-10.json). Idempotent. --apply saves and publishes.
//   INSTATIC_BASE_URL=https://www.masonparkdental.com node bugherd/retire-root-ad-pages.mjs [--apply]
import * as I from "../insta.mjs";
if (I.IS_STAGING) throw new Error("production only: staging has no root ad pages");
const APPLY = process.argv.includes("--apply");
const TWIN = {
  "invisalign": "/ads-landing-pages/invisalign/",
  "invisalign-consultation": "/ads-landing-pages/invisalign-consultation/",
  "invisalign-thank-you": "/ads-landing-pages/invisalign-thank-you/",
  "new-patient-special": "/ads-landing-pages/new-patient-special/",
  "new-patient-special-consultation": "/ads-landing-pages/new-patient-special-consultation/",
  "new-patient-thank-you": "/ads-landing-pages/new-patient-thank-you/",
};
// v2: the meta refresh sits in <noscript>. Bare, it fired before the script and
// dropped the query string (gclid) on every forward.
const MARK = "data-retired-v2";
const snippet = (to) =>
  `<script ${MARK}="${to}">location.replace(${JSON.stringify(to)} + location.search + location.hash)</script>` +
  `<noscript><meta http-equiv="refresh" content="0; url=${to}"></noscript>` +
  `<p style="font:16px/1.5 sans-serif;padding:2rem;text-align:center">This page has moved to <a href="${to}">${to}</a>.</p>`;

const rows = (await I.getPages()).rows;
const site = await I.getSite();
const changedPages = [], baseSeqs = {};
for (const [slug, to] of Object.entries(TWIN)) {
  const r = rows.find((x) => x.slug === slug);
  if (!r) { console.log(`${slug}: not on this instance`); continue; }
  if (!rows.some((x) => x.slug === to.replace(/^\/|\/$/g, ""))) throw new Error(`${to} does not exist; refusing to forward ${slug} into a 404`);
  const old = r.cells.body;
  if (JSON.stringify(old).includes(`${MARK}=\\"${to}\\"`)) { console.log(`${slug}: already forwards to ${to}`); continue; }
  const rootId = old.rootNodeId;
  const embedId = `retire${slug.replace(/[^a-z]/g, "").slice(0, 20)}`;
  const nodes = {
    [rootId]: { ...old.nodes[rootId], children: [embedId] },
    [embedId]: {
      id: embedId, moduleId: "brandklout.embed-origins.embed",
      props: { source: "snippet", snippet: snippet(to), url: "", title: `Moved to ${to}`, fit: "auto", height: 0, ratio: "16 / 9", lazy: false, allowFullscreen: false, allow: "" },
      breakpointOverrides: {}, children: [], classIds: [], parentId: rootId,
    },
  };
  const body = { nodes, rootNodeId: rootId };
  console.log(`${slug}: ${Object.keys(old.nodes).length} nodes -> forward to ${to}`);
  baseSeqs[r.id] = r.seq ?? 0;
  changedPages.push({ id: r.id, tableId: "pages", slug, title: "Moved | Mason Park Dental", nodes, rootNodeId: rootId, status: "published", cells: { ...r.cells, title: "Moved | Mason Park Dental", body } });
}
console.log(`${changedPages.length} page(s) to retire`);
if (!APPLY || !changedPages.length) process.exit(0);
const res = await I.api("PUT", "/admin/api/cms/site-document", { mode: "incremental", site: site.site, changedPages, deletedPageIds: [], changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [], baseSeqs, shellBaseSeq: site.seq });
console.log(`saved: ${JSON.stringify(res).slice(0, 160)}`);
console.log(`publish: ${JSON.stringify(await I.publish()).slice(0, 160)}`);
console.log(`status: ${JSON.stringify(await I.publishStatus())}`);
