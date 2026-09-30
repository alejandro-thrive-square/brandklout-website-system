#!/usr/bin/env node
/**
 * add-elfsight-reviews.mjs — the practice's live Google reviews where the static ones were,
 * on the LIVE rows of one instance (no re-import).
 *
 *   INSTATIC_BASE_URL=https://staging.masonparkdental.com node add-elfsight-reviews.mjs            # dry run
 *   INSTATIC_BASE_URL=https://staging.masonparkdental.com node add-elfsight-reviews.mjs --apply    # write the draft
 *   INSTATIC_BASE_URL=https://www.masonparkdental.com     node add-elfsight-reviews.mjs --apply --publish
 *
 * Back up first: `node backup-site.mjs` on the same INSTATIC_BASE_URL. The stylesheet (`.rv-embed`
 * in home/assets/site.css) goes up separately with `node to-instatic.mjs --media
 * instatic-media-map.json && node import-styles.mjs`; this script only registers the class.
 *
 * What it does, mirroring the local source (home/index.html, home/patient-reviews/index.html):
 *
 *   /                 #proof  .el-deck (six sticky cards)      -> Embed .rv-embed, same place
 *                             .el-deck_foot 4.9 / "Across 1,037" dropped, "Read more reviews" stays
 *                             .pr-note "…shown whole." -> "…live from its profile."
 *   /patient-reviews  #wall   .cp-wall (15 reviews + 6 photos) -> Embed .rv-embed
 *                             .pe-lede "Most recent first…"    -> "Live from the practice's Google profile…"
 *                     #number  .cp-score_side "…and shown whole." -> "…from the practice's Google profile."
 *
 * The Embed is a brandklout.embed-origins module in snippet mode (elfsight-snippet.mjs). Re-runnable:
 * a page that already has the widget only gets its snippet refreshed if it drifted.
 *
 * GOTCHA: every push chain here re-imports every page from local HTML (import-pages.mjs
 * --overwrite). The local source carries the same change as a `data-elfsight-reviews` slot that
 * place-ad-embeds.mjs turns into the identical Embed, so a chain run keeps the widget. If a page is
 * ever rebuilt from a source without the slot, re-run this.
 */
import { randomBytes } from "node:crypto";
import { api, getPages, getSite, publish, publishStatus, BASE, IS_STAGING } from "./insta.mjs";
import { WIDGET_ID, MODULE_ID, SLOT_CLASS, SNIPPET, embedProps } from "./elfsight-snippet.mjs";

const APPLY = process.argv.includes("--apply");
const PUBLISH = process.argv.includes("--publish");
const ALPHABET = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";
const nanoid = (n = 21) => [...randomBytes(n)].map((b) => ALPHABET[b & 63]).join("");

const COPY = [
  // [class, old text, new text] — the texts are the node's `props.text`, entities decoded.
  ["pr-note", "Google reviews the practice’s own patients left, shown whole.", "Google reviews the practice’s own patients left, live from its profile."],
  ["pe-lede", "Most recent first. A review is as long as the person wrote it.", "Live from the practice’s Google profile, in each patient’s own words."],
  ["cp-score_side", "Every review on this page is a patient’s own words, taken from the practice’s Google profile and shown whole.", "Every review on this page is a patient’s own words, from the practice’s Google profile."],
];

console.log(`${BASE}  (${IS_STAGING ? "staging" : "PRODUCTION"})`);
const site = await getSite();
const shell = site.site;
const rules = shell.styleRules ?? (shell.styleRules = {});
let shellChanged = false;

// The class must be a registered rule or Instatic emits no class attribute (import-styles.mjs).
// Same shape as the rules the converter registers: id === name, no declarations; site.css styles it.
if (!rules[SLOT_CLASS]) {
  const order = Math.max(0, ...Object.values(rules).map((r) => r.order ?? 0)) + 1;
  rules[SLOT_CLASS] = {
    id: SLOT_CLASS, name: SLOT_CLASS, kind: "class", selector: `.${SLOT_CLASS}`, order,
    styles: {}, contextStyles: {}, createdAt: Date.now(), updatedAt: Date.now(),
  };
  shellChanged = true;
  console.log(`rule   + .${SLOT_CLASS}`);
} else console.log(`rule   .${SLOT_CLASS} already registered`);

const cssFile = (shell.files ?? []).find((f) => f.path === "src/styles/mason-park.css");
console.log(`css    src/styles/mason-park.css ${cssFile ? (cssFile.content.includes(`.${SLOT_CLASS} {`) ? "has .rv-embed" : "MISSING .rv-embed - run to-instatic + import-styles") : "NOT FOUND"}`);

const hasClass = (n, c) => (n?.classIds ?? []).includes(c);
const embedNode = (parentId, classIds) => ({
  id: nanoid(), moduleId: MODULE_ID, parentId, classIds, children: [], breakpointOverrides: {}, props: embedProps(),
});
const dropSubtree = (nodes, id) => {
  for (const c of nodes[id]?.children ?? []) dropSubtree(nodes, c);
  delete nodes[id];
};
const findEmbed = (nodes) => Object.values(nodes).find((n) => n.moduleId === MODULE_ID && (n.props?.snippet ?? "").includes(`elfsight-app-${WIDGET_ID}`));

const { rows } = await getPages();
const changed = [];

// Swap `.<cls>` (one node, direct child of a `.wrap`) for the Embed at the same index.
function swap(row, cls) {
  const nodes = row.cells.body.nodes;
  const have = findEmbed(nodes);
  if (have) {
    if (have.props.snippet !== SNIPPET) { have.props.snippet = SNIPPET; console.log(`/${row.slug}  snippet refreshed`); return true; }
    console.log(`/${row.slug}  already has the widget (${have.id})`);
    return false;
  }
  const targets = Object.values(nodes).filter((n) => hasClass(n, cls));
  if (targets.length !== 1) throw new Error(`/${row.slug}: expected one .${cls}, found ${targets.length}`);
  const [old] = targets;
  const parent = nodes[old.parentId];
  if (!hasClass(parent, "wrap")) throw new Error(`/${row.slug}: .${cls} is not in a .wrap`);
  const at = parent.children.indexOf(old.id);
  const made = embedNode(parent.id, [SLOT_CLASS]);
  const before = Object.keys(nodes).length;
  dropSubtree(nodes, old.id);
  nodes[made.id] = made;
  parent.children[at] = made.id;
  console.log(`/${row.slug}  .${cls} ${old.id} (${before - Object.keys(nodes).length + 1} nodes) -> embed ${made.id} at index ${at} of .wrap ${parent.id}`);
  return true;
}
function retext(row) {
  const nodes = row.cells.body.nodes;
  let n = 0;
  for (const [cls, from, to] of COPY) {
    // The text node itself carries the class (pr-note, pe-lede) or sits inside the classed block (cp-score_side > p).
    for (const node of Object.values(nodes).filter((x) => x.props?.text === from && (hasClass(x, cls) || hasClass(nodes[x.parentId], cls)))) { node.props.text = to; n++; console.log(`/${row.slug}  .${cls} retexted`); }
  }
  return n;
}
function dropIn(row, parentCls, classes) {
  const nodes = row.cells.body.nodes;
  const parent = Object.values(nodes).find((x) => hasClass(x, parentCls));
  if (!parent) return 0;
  const gone = parent.children.filter((c) => classes.some((k) => hasClass(nodes[c], k)));
  for (const id of gone) dropSubtree(nodes, id);
  parent.children = parent.children.filter((c) => !gone.includes(c));
  if (gone.length) console.log(`/${row.slug}  .${parentCls}: dropped ${gone.length} node(s) (${classes.join(", ")})`);
  return gone.length;
}

for (const [slug, cls, foot] of [["index", "el-deck", true], ["patient-reviews", "cp-wall", false]]) {
  const row = rows.find((r) => (r.cells?.slug ?? r.slug) === slug);
  if (!row) throw new Error(`no row for /${slug}`);
  let touched = swap(row, cls);
  if (retext(row)) touched = true;
  if (foot && dropIn(row, "el-deck_foot", ["el-deck_score", "el-deck_score-label"])) touched = true;
  if (touched) changed.push(row);
}

console.log(`\ntarget ${BASE}  shell seq ${site.seq}  pages ${changed.map((r) => r.slug).join(", ") || "none"}  shell ${shellChanged ? "changed" : "unchanged"}`);
if (!APPLY) { console.log("DRY RUN - nothing written. Re-run with --apply."); process.exit(0); }
if (!changed.length && !shellChanged) { console.log("nothing to write"); if (!PUBLISH) process.exit(0); }

if (changed.length || shellChanged) {
  const res = await api("PUT", "/admin/api/cms/site-document", {
    mode: "incremental", site: shell,
    changedPages: changed.map((r) => ({
      id: r.id, tableId: "pages", slug: r.cells?.slug ?? r.slug, title: r.cells.title,
      nodes: r.cells.body.nodes, rootNodeId: r.cells.body.rootNodeId, status: "published",
      cells: { ...r.cells },
    })),
    deletedPageIds: [], changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [],
    baseSeqs: Object.fromEntries(changed.map((r) => [r.id, r.seq ?? 0])), shellBaseSeq: site.seq,
  });
  console.log(`saved  ${JSON.stringify(res).slice(0, 160)}`);
}

// read back
const back = (await getPages()).rows;
for (const slug of ["index", "patient-reviews"]) {
  const row = back.find((r) => (r.cells?.slug ?? r.slug) === slug);
  const nodes = row.cells.body.nodes;
  const embeds = Object.values(nodes).filter((x) => x.moduleId === MODULE_ID && (x.props?.snippet ?? "").includes(WIDGET_ID));
  const lazy = embeds.some((e) => /data-elfsight-app-lazy/.test(e.props.snippet));
  const stale = Object.values(nodes).some((x) => x.props?.text === "Across 1,037 Google reviews" || COPY.some(([, from]) => x.props?.text === from));
  console.log(`check  /${slug}: ${embeds.length} embed(s), snippet ${embeds[0]?.props?.snippet === SNIPPET ? "exact" : "MISMATCH"}, lazy attr ${lazy ? "PRESENT (bad)" : "absent"}, class ${embeds.every((e) => hasClass(e, SLOT_CLASS)) ? "rv-embed" : "MISSING"}, old copy ${stale ? "STILL THERE" : "gone"}`);
}
if (PUBLISH) {
  console.log("publish", JSON.stringify(await publish()).slice(0, 160));
  console.log("status ", JSON.stringify(await publishStatus()).slice(0, 160));
}
