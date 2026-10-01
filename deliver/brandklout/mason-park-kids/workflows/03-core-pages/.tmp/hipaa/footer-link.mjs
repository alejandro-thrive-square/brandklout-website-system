// Add "HIPAA Disclosure" to the footer's legal row on every page, right after Privacy, then publish once.
//
//   node .tmp/hipaa/footer-link.mjs [--dry-run]                          # staging
//   PROMOTE=production INSTATIC_BASE_URL=https://mason-park-kids.up.railway.app node .tmp/hipaa/footer-link.mjs
//
// The footer is inlined into every page body (the site has no components), so this edits that one
// row per page and nothing else: one new base.link, a clone of the Privacy link's node with a new id,
// href and text, spliced into `.foot_legal`'s children after it. The row is a flex row with a gap, so
// there is no separator node to copy. Pages that already carry the link are skipped (re-runnable).
// Refuses unless the draft matches what is published; refuses to publish if any row it did not
// write moved; every write carries the row's seq (baseSeqs) and the shell seq.
import crypto from "node:crypto";
import { api, getPages, getSite, publish, publishStatus, BASE } from "../insta.mjs";

const DRY = process.argv.includes("--dry-run");
const HREF = "/hipaa-disclosure", TEXT = "HIPAA Disclosure";
const ALPHABET = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";
const newId = () => Array.from(crypto.randomBytes(21), (b) => ALPHABET[b & 63]).join("");
const die = (m) => { console.error(`STOP: ${m}`); process.exit(1); };

console.log(`site: ${BASE}`);
const st0 = await publishStatus();
console.log(`status before: ${JSON.stringify(st0)}`);
if (!st0.draftMatchesPublished) die("draft differs from published - someone has unpublished work");

const rows0 = (await getPages()).rows ?? [];
const seq0 = new Map(rows0.map((r) => [r.id, r.seq]));
const changedPages = [], baseSeqs = {};
let skipped = 0;
for (const r of rows0) {
  const body = structuredClone(r.cells.body);
  const N = body.nodes;
  const rows = Object.values(N).filter((n) => n.classIds?.includes("foot_legal"));
  if (rows.length !== 1) die(`${r.slug}: ${rows.length} .foot_legal rows`);
  const row = rows[0];
  const kids = row.children.map((id) => N[id]);
  if (kids.some((n) => n.props?.href === HREF)) { skipped++; continue; }
  const at = kids.findIndex((n) => n.moduleId === "base.link" && n.props?.href === "/privacy-policy");
  if (at < 0) die(`${r.slug}: no Privacy link in the legal row`);
  const priv = kids[at];
  const id = newId();
  N[id] = { ...structuredClone(priv), id, props: { ...structuredClone(priv.props), href: HREF, text: TEXT }, children: [] };
  row.children.splice(at + 1, 0, id);
  baseSeqs[r.id] = r.seq ?? 0;
  changedPages.push({
    id: r.id, tableId: "pages", slug: r.slug, title: r.cells.title,
    nodes: N, rootNodeId: body.rootNodeId, status: "published",
    cells: { ...r.cells, body },
  });
}
console.log(`${rows0.length} pages: ${changedPages.length} to change, ${skipped} already linked`);
if (DRY || !changedPages.length) process.exit(0);

for (let i = 0; i < changedPages.length; i += 40) {
  const site = await getSite(); // the shell seq can move with each save
  const batch = changedPages.slice(i, i + 40);
  const res = await api("PUT", "/admin/api/cms/site-document", {
    mode: "incremental", site: site.site, changedPages: batch, deletedPageIds: [],
    changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [],
    baseSeqs: Object.fromEntries(batch.map((p) => [p.id, baseSeqs[p.id]])), shellBaseSeq: site.seq,
  });
  console.log(`  saved ${i + batch.length}/${changedPages.length}: ${JSON.stringify(res).slice(0, 80)}`);
}

// Read back: each changed page = old node count + 1 and the link in place; nothing else moved.
const rows1 = (await getPages()).rows ?? [];
const mine = new Set(changedPages.map((p) => p.id));
let bad = 0;
for (const r of rows1) {
  if (!mine.has(r.id)) { if (seq0.get(r.id) !== r.seq) { console.error(`  moved, not mine: ${r.slug}`); bad++; } continue; }
  const N = r.cells.body.nodes;
  const before = Object.keys(rows0.find((x) => x.id === r.id).cells.body.nodes).length;
  const row = Object.values(N).find((n) => n.classIds?.includes("foot_legal"));
  const texts = row.children.map((id) => N[id]?.props?.text);
  if (Object.keys(N).length !== before + 1 || texts[texts.indexOf("Privacy") + 1] !== TEXT) { console.error(`  bad readback: ${r.slug}`); bad++; }
}
if (bad || rows1.length !== rows0.length) die(`${bad} problem(s) on read-back; NOT publishing`);
console.log(`read back: ${mine.size} pages carry the link after Privacy, +1 node each; no other row moved`);

console.log(`publish: ${JSON.stringify(await publish()).slice(0, 200)}`);
const st1 = await publishStatus();
console.log(`status after: ${JSON.stringify(st1)}`);
if (!st1.draftMatchesPublished || st1.publishedPages !== st0.publishedPages) die("unexpected status after publish");
