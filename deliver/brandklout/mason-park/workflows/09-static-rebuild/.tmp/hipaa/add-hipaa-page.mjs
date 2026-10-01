#!/usr/bin/env node
/**
 * add-hipaa-page.mjs - inject ONE page, /hipaa-disclosure, into a live instance. No re-import.
 *
 *   INSTATIC_BASE_URL=https://staging.masonparkdental.com node .tmp/hipaa/add-hipaa-page.mjs            # dry run
 *   INSTATIC_BASE_URL=https://staging.masonparkdental.com node .tmp/hipaa/add-hipaa-page.mjs --apply    # write the draft row
 *   INSTATIC_BASE_URL=https://www.masonparkdental.com     node .tmp/hipaa/add-hipaa-page.mjs --apply --publish
 *
 * Back up first: `node .tmp/backup-site.mjs` on the same INSTATIC_BASE_URL.
 *
 * The row is a CLONE of the live /privacy-policy row (header, nav, arrival, breadcrumb, invitation,
 * footer, call bar: every node and class as that page has them, new ids), with "The Short Version"
 * dropped and the policy accordion replaced by the notice (notice.mjs). The local twin is
 * home/hipaa-disclosure/index.html (build-hipaa-page.mjs), so a later chain run keeps the page.
 *
 * Besides the row it writes exactly two things:
 *   - the new row id appended to src/scripts/mason-park.js's runtime scope (an explicit pageIds
 *     list; a page outside it loads no GSAP, journey.js or site.js - no menu toggle, no motion);
 *   - an open-graph override with the page's description (no per-page meta otherwise).
 *
 * Publishing in Instatic is all-or-nothing, so --publish refuses unless the instance was
 * draft == published before the write and no other row or the shell moved since.
 */
import { randomBytes } from "node:crypto";
import { api, getPages, getSite, publish, publishStatus, BASE, IS_STAGING } from "../insta.mjs";
import { noticeHtml, parse, toNodes, TITLE, DESCRIPTION, SLUG, EFFECTIVE_HOUSE, ENTITY } from "./notice.mjs";

const APPLY = process.argv.includes("--apply");
const PUBLISH = process.argv.includes("--publish");
const ALPHABET = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";
const nanoid = (n = 21) => [...randomBytes(n)].map((b) => ALPHABET[b & 63]).join("");
const SCRIPT_PATH = "src/scripts/mason-park.js";
const OG = "/admin/api/cms/plugins/brandklout.open-graph";

console.log(`${BASE}  (${IS_STAGING ? "staging" : "PRODUCTION"})`);
const status0 = await publishStatus();
console.log(`status ${JSON.stringify(status0)}`);
const site = await getSite();
const { rows } = await getPages();
const slugOf = (r) => r.cells?.slug ?? r.slug;
const src = rows.find((r) => slugOf(r) === "privacy-policy");
if (!src) throw new Error("no /privacy-policy row to clone");
const existing = rows.find((r) => slugOf(r) === SLUG);
const othersBefore = Object.fromEntries(rows.filter((r) => r !== existing).map((r) => [r.id, r.seq]));
if (!status0.draftMatchesPublished && !existing) {
  throw new Error("draft != published BEFORE this run: someone else has unpublished changes. Stop and report.");
}

// ---- clone with fresh ids ------------------------------------------------------------------
const srcNodes = src.cells.body.nodes;
const idMap = Object.fromEntries(Object.keys(srcNodes).map((id) => [id, nanoid()]));
const nodes = {};
for (const [oldId, n] of Object.entries(srcNodes)) {
  const c = structuredClone(n);
  c.id = idMap[oldId];
  c.parentId = n.parentId ? idMap[n.parentId] : n.parentId;
  c.children = (n.children ?? []).map((k) => idMap[k]);
  nodes[c.id] = c;
}
const rootNodeId = idMap[src.cells.body.rootNodeId];

const all = () => Object.values(nodes);
const hasClass = (n, c) => (n?.classIds ?? []).includes(c);
const one = (pred, what) => {
  const hit = all().filter(pred);
  if (hit.length !== 1) throw new Error(`expected one ${what}, found ${hit.length}`);
  return hit[0];
};
const byClass = (c) => one((n) => hasClass(n, c), `.${c}`);
const within = (ancestor, pred, what) => {
  const out = [];
  const walk = (id) => { const n = nodes[id]; if (pred(n)) out.push(n); (n.children ?? []).forEach(walk); };
  walk(ancestor.id);
  if (out.length !== 1) throw new Error(`expected one ${what} in ${ancestor.classIds?.join(".")}, found ${out.length}`);
  return out[0];
};
const dropSubtree = (id) => { for (const c of nodes[id]?.children ?? []) dropSubtree(c); delete nodes[id]; };
const unlink = (n) => { const p = nodes[n.parentId]; p.children = p.children.filter((c) => c !== n.id); dropSubtree(n.id); };
const text = (n, from, to) => { if (n.props.text !== from) throw new Error(`text was ${JSON.stringify(n.props.text)}, expected ${JSON.stringify(from)}`); n.props.text = to; };

// arrival
const title = byClass("ar-title");
text(nodes[title.children[0]], "Privacy ", "HIPAA ");
text(nodes[title.children[1]], "Policy", "Disclosure");
const lede = byClass("ar-lede");
lede.props.text = `Effective ${EFFECTIVE_HOUSE}. Our Notice of Privacy Practices: how your health information may be used and shared, and your rights over it.`;
const read = one((n) => n.moduleId === "base.link" && n.props.href === "#sections", "Read the policy link");
text(read, "Read the policy", "Read the notice");
read.props.href = "#notice";
text(one((n) => hasClass(n, "breadcrumb_item") && n.props?.text === "Privacy Policy", "breadcrumb"), "Privacy Policy", "HIPAA Disclosure");

// body: drop the Short Version, turn the policy chapter into the notice
unlink(byClass("ch-qualify"));
const chapter = byClass("ch-questions");
chapter.props.htmlAttributes = { ...chapter.props.htmlAttributes, id: "notice", "data-chapter": "1", "data-chapter-name": "The Notice" };
const head = within(chapter, (n) => hasClass(n, "rg-head"), ".rg-head");
text(within(head, (n) => n.props?.text === "The Policy", "chapter tag"), "The Policy", "The Notice");
text(within(head, (n) => n.props?.tag === "h2", "h2"), "Thirteen sections, in full.", "Notice of Privacy Practices, in full.");
const faq = within(chapter, (n) => hasClass(n, "iv-faq"), ".iv-faq");
for (const c of [...faq.children]) dropSubtree(c);
const body = { id: nanoid(), moduleId: "base.container", props: { tag: "div", customTag: "", htmlAttributes: {} }, breakpointOverrides: {}, children: [], classIds: ["lf-body", "text-rich-text"], parentId: faq.id };
nodes[body.id] = body;
faq.children = [body.id];
const built = toNodes(parse(noticeHtml()), body.id, () => nanoid());
Object.assign(nodes, built.nodes);
body.children = built.top;

// invitation
const inv = byClass("ch-invitation");
inv.props.htmlAttributes = { ...inv.props.htmlAttributes, "data-chapter": "2" };
const ivLede = within(inv, (n) => hasClass(n, "iv-lede"), ".iv-lede");
ivLede.props.text = "To ask about this notice, get a copy of your record, or make a request under it, call the office.";
text(within(inv, (n) => n.props?.text === "25 September 2026", "effective date"), "25 September 2026", EFFECTIVE_HOUSE);

// sanity: tree is closed, nothing of the policy is left in <main>
for (const n of all()) {
  if (!Array.isArray(n.children)) throw new Error(`node ${n.id} has no children array`);
  for (const c of n.children) if (!nodes[c] || nodes[c].parentId !== n.id) throw new Error(`broken edge ${n.id} -> ${c}`);
}
const reach = new Set();
(function walk(id) { reach.add(id); nodes[id].children.forEach(walk); })(rootNodeId);
if (reach.size !== Object.keys(nodes).length) throw new Error(`${Object.keys(nodes).length - reach.size} orphan nodes`);
const main = byClass("main-wrapper");
const mainText = [];
(function walk(id) { const n = nodes[id]; if (n.props?.text) mainText.push(n.props.text); n.children.forEach(walk); })(main.id);
const stale = mainText.filter((t) => /Privacy Policy|this policy|25 September/i.test(t) && t !== "Privacy Policy");
if (stale.length) throw new Error(`policy copy left in <main>: ${stale.join(" | ")}`);
if (!mainText.some((t) => t === ENTITY)) throw new Error("entity name missing from the notice");
console.log(`row    /${SLUG} "${TITLE}"  ${Object.keys(nodes).length} nodes (privacy ${Object.keys(srcNodes).length}), notice ${Object.keys(built.nodes).length}`);

// ---- shell: scope the site bundle to the new row ---------------------------------------------
const shell = structuredClone(site.site);
const fileId = (shell.files ?? []).find((f) => f.path === SCRIPT_PATH)?.id;
const entry = fileId && shell.runtime?.scripts?.[fileId];
if (!entry || entry.scope?.type !== "pages") throw new Error(`${SCRIPT_PATH} runtime entry not found or not page-scoped`);
const rowId = existing?.id ?? nanoid();
const inScope = entry.scope.pageIds.includes(rowId);
if (!inScope) entry.scope.pageIds = [...entry.scope.pageIds, rowId];
console.log(`script ${SCRIPT_PATH} scope ${entry.scope.pageIds.length} pages ${inScope ? "(already had this row)" : "(+ this row)"}`);
console.log(`target ${existing ? `overwrite ${existing.id} seq ${existing.seq}` : `new row ${rowId}`}  shell seq ${site.seq}`);

if (!APPLY) { console.log("DRY RUN - nothing written. Re-run with --apply."); process.exit(0); }

const res = await api("PUT", "/admin/api/cms/site-document", {
  mode: "incremental",
  site: shell,
  changedPages: [{
    id: rowId, tableId: "pages", slug: SLUG, title: TITLE, nodes, rootNodeId, status: "published",
    cells: { title: TITLE, slug: SLUG, body: { nodes, rootNodeId }, seoTitle: TITLE, seoDescription: DESCRIPTION },
  }],
  deletedPageIds: [], changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [],
  baseSeqs: existing ? { [existing.id]: existing.seq ?? 0 } : {},
  shellBaseSeq: site.seq,
});
console.log(`saved  ${JSON.stringify(res).slice(0, 200)}`);

// ---- read back --------------------------------------------------------------------------------
const site2 = await getSite();
const back = (await getPages()).rows;
const mine = back.find((r) => slugOf(r) === SLUG);
if (!mine || mine.id !== rowId) throw new Error(`read-back: /${SLUG} row ${mine?.id} != ${rowId}`);
if (mine.cells.title !== TITLE) throw new Error(`read-back title ${mine.cells.title}`);
const scoped = site2.site.runtime.scripts[fileId].scope.pageIds.includes(rowId);
if (!scoped) throw new Error("read-back: the new row is not in the script scope");
const moved = back.filter((r) => r.id !== rowId && othersBefore[r.id] !== r.seq).map((r) => slugOf(r));
const gone = Object.keys(othersBefore).filter((id) => !back.some((r) => r.id === id));
console.log(`check  row ${mine.id} seq ${mine.seq}, ${Object.keys(mine.cells.body.nodes).length} nodes, scoped ${scoped}, other rows moved: ${moved.join(", ") || "none"}, gone: ${gone.length}`);
if (moved.length || gone.length) throw new Error("other rows changed during this run - not publishing");

// ---- open-graph description override -----------------------------------------------------------
const listed = await api("GET", `${OG}/runtime/pages`);
const ogRows = listed.rows ?? listed.pages ?? listed;
const ogRow = ogRows.find((r) => r.kind === "page" && r.slug === SLUG);
if (!ogRow) console.log("og     row not listed yet - re-run after publish to write the description override");
else if (ogRow.override?.description === DESCRIPTION) console.log("og     description already set");
else {
  await api("POST", `${OG}/runtime/override`, { ...(ogRow.override ?? {}), key: ogRow.key, description: DESCRIPTION, enabled: true });
  console.log(`og     description override written (key ${ogRow.key})`);
}

if (PUBLISH) {
  const st = await publishStatus();
  const shellMoved = site2.seq !== (res.shellSeq ?? res.seq ?? site2.seq);
  console.log(`pre    ${JSON.stringify(st)}${shellMoved ? "  SHELL MOVED" : ""}`);
  if (st.draftPages !== back.length) throw new Error("draft page count does not match the rows read back");
  console.log("publish", JSON.stringify(await publish()).slice(0, 200));
  console.log("status ", JSON.stringify(await publishStatus()).slice(0, 200));
}
