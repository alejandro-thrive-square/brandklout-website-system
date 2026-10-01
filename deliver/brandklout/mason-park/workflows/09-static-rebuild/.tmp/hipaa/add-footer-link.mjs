#!/usr/bin/env node
/**
 * add-footer-link.mjs - "HIPAA Disclosure" in every footer legal row, right after "Privacy Policy".
 *
 *   INSTATIC_BASE_URL=<base> node .tmp/hipaa/add-footer-link.mjs                     # dry run
 *   INSTATIC_BASE_URL=<base> node .tmp/hipaa/add-footer-link.mjs --apply --publish
 *
 * There is no shared footer component on this site (components: []); every page row carries its own
 * footer. In each `.footer_legal`, the Privacy Policy link and the separator text node after it are
 * CLONED (new ids) and inserted after the Privacy link, so the new link has exactly its neighbours'
 * markup and separator: " · " on the rebuilt pages, " | " on production's old rows. Nothing else in
 * the row or the page is touched. Rows with no `.footer_legal` (the root ad forwarders) are skipped.
 * Idempotent: a row that already links /hipaa-disclosure is left alone.
 *
 * Publish is all-or-nothing, so it refuses unless draft == published before the write and no row
 * outside the changed set moved before publishing.
 */
import { randomBytes } from "node:crypto";
import { api, getPages, getSite, publish, publishStatus, BASE, IS_STAGING } from "../insta.mjs";

const APPLY = process.argv.includes("--apply");
const PUBLISH = process.argv.includes("--publish");
const ALPHABET = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";
const nanoid = (n = 21) => [...randomBytes(n)].map((b) => ALPHABET[b & 63]).join("");
const HREF = "/hipaa-disclosure";
const LABEL = "HIPAA Disclosure";

console.log(`${BASE}  (${IS_STAGING ? "staging" : "PRODUCTION"})`);
const st0 = await publishStatus();
console.log(`status ${JSON.stringify(st0)}`);
if (!st0.draftMatchesPublished) throw new Error("draft != published BEFORE this run: someone else has unpublished changes. Stop and report.");
const site = await getSite();
const { rows } = await getPages();
const slugOf = (r) => r.cells?.slug ?? r.slug;
const seqBefore = Object.fromEntries(rows.map((r) => [r.id, r.seq]));

const changed = [];
const skipped = [];
const already = [];
for (const r of rows) {
  const N = r.cells.body.nodes;
  const legal = Object.values(N).filter((n) => (n.classIds ?? []).includes("footer_legal"));
  if (!legal.length) { skipped.push(slugOf(r)); continue; }
  if (legal.length !== 1) throw new Error(`/${slugOf(r)}: ${legal.length} .footer_legal rows`);
  const [row] = legal;
  const kids = row.children.map((c) => N[c]);
  if (kids.some((k) => k.moduleId === "base.link" && k.props.href === HREF)) { already.push(slugOf(r)); continue; }
  const at = kids.findIndex((k) => k.moduleId === "base.link" && k.props.href === "/privacy-policy" && k.props.text === "Privacy Policy");
  if (at < 0) throw new Error(`/${slugOf(r)}: no Privacy Policy link in .footer_legal`);
  const sep = kids[at + 1];
  if (!sep || sep.moduleId !== "base.text" || !/^\s*[·|]\s*$/.test(sep.props.text)) throw new Error(`/${slugOf(r)}: no separator after Privacy Policy (${JSON.stringify(sep?.props?.text)})`);
  const newSep = { ...structuredClone(sep), id: nanoid() };
  const link = { ...structuredClone(kids[at]), id: nanoid() };
  link.props.href = HREF;
  link.props.text = LABEL;
  N[newSep.id] = newSep;
  N[link.id] = link;
  row.children.splice(at + 1, 0, newSep.id, link.id);
  changed.push(r);
}
const shapes = {};
for (const r of changed) {
  const N = r.cells.body.nodes;
  const row = Object.values(N).find((n) => (n.classIds ?? []).includes("footer_legal"));
  const sig = row.children.map((c) => N[c].moduleId === "base.link" ? `[${N[c].props.text}]` : N[c].props.text).join("");
  shapes[sig] = (shapes[sig] ?? 0) + 1;
}
for (const [s, n] of Object.entries(shapes)) console.log(`${String(n).padStart(3)} rows -> ${s}`);
console.log(`change ${changed.length}, already linked ${already.length}, no footer row ${skipped.length}${skipped.length ? ` (${skipped.join(", ")})` : ""}`);
const cellsBefore = Object.fromEntries(((await api("GET", "/admin/api/cms/data/tables/pages/rows")).rows ?? []).map((r) => [r.id, r.cells]));
const templated = changed.filter((r) => cellsBefore[r.id]?.templateEnabled).map(slugOf);
console.log(`templated rows in the change set (flags restored after the save): ${templated.join(", ") || "none"}`);
if (!APPLY) { console.log("DRY RUN - nothing written. Re-run with --apply."); process.exit(0); }

if (changed.length) {
  const res = await api("PUT", "/admin/api/cms/site-document", {
    mode: "incremental",
    site: site.site,
    changedPages: changed.map((r) => ({
      id: r.id, tableId: "pages", slug: slugOf(r), title: r.cells.title,
      nodes: r.cells.body.nodes, rootNodeId: r.cells.body.rootNodeId, status: "published",
      cells: { ...r.cells },
    })),
    deletedPageIds: [], changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [],
    baseSeqs: Object.fromEntries(changed.map((r) => [r.id, r.seq ?? 0])),
    shellBaseSeq: site.seq,
  });
  console.log(`saved  ${JSON.stringify(res).slice(0, 160)}`);
}

// The site-document save rebuilds every row through pageToCells() and DROPS template flags
// (blog-article: the articles entry template; 404: the not-found template). Left alone, every
// /blog/<slug> 404s and the branded 404 is gone - which happened on staging 2026-10-01 until
// apply-blog-template / apply-404-template put them back. Restore them here, before publishing,
// the same way those scripts do (per-row PATCH with the whole cells object; safe only for
// slash-free slugs, see apply-seo.mjs).
const TEMPLATE_KEYS = ["templateEnabled", "templateTarget", "templatePriority"];
const flagged = Object.fromEntries(Object.entries(cellsBefore).filter(([id, c]) => c.templateEnabled && changed.some((r) => r.id === id)));
const dataRows = async () => (await api("GET", "/admin/api/cms/data/tables/pages/rows")).rows ?? [];
for (const [id, before] of Object.entries(flagged)) {
  if (before.slug.includes("/")) throw new Error(`/${before.slug}: a PATCH would flatten this slug; restore its template by hand`);
  const now = (await dataRows()).find((r) => r.id === id);
  if (TEMPLATE_KEYS.every((k) => JSON.stringify(now.cells[k]) === JSON.stringify(before[k]))) { console.log(`tmpl   /${before.slug} kept its flags`); continue; }
  await api("PATCH", `/admin/api/cms/data/rows/${id}`, { cells: { ...now.cells, ...Object.fromEntries(TEMPLATE_KEYS.map((k) => [k, before[k]])) } });
  const after = (await dataRows()).find((r) => r.id === id);
  const ok = TEMPLATE_KEYS.every((k) => JSON.stringify(after.cells[k]) === JSON.stringify(before[k])) && Object.keys(after.cells.body?.nodes ?? {}).length > 1 && after.cells.slug === before.slug;
  console.log(`tmpl   /${before.slug} flags restored ${ok ? "OK" : "FAILED"} ${JSON.stringify(after.cells.templateTarget)}`);
  if (!ok) throw new Error(`template flags on /${before.slug} did not restore - not publishing`);
}

const back = (await getPages()).rows;
const ids = new Set(changed.map((r) => r.id));
const moved = back.filter((r) => !ids.has(r.id) && seqBefore[r.id] !== r.seq).map(slugOf);
const linked = back.filter((r) => Object.values(r.cells.body.nodes).some((n) => n.moduleId === "base.link" && n.props.href === HREF && n.props.text === LABEL && (r.cells.body.nodes[n.parentId]?.classIds ?? []).includes("footer_legal"))).length;
console.log(`check  footer link in ${linked} rows; other rows moved: ${moved.join(", ") || "none"}`);
if (moved.length) throw new Error("other rows changed during this run - not publishing");

if (PUBLISH) {
  const st = await publishStatus();
  console.log(`pre    ${JSON.stringify(st)}`);
  console.log("publish", JSON.stringify(await publish()).slice(0, 200));
  console.log("status ", JSON.stringify(await publishStatus()).slice(0, 200));
}
