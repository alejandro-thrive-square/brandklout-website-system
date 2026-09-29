#!/usr/bin/env node
/**
 * add-elfsight-reviews.mjs — the live Google reviews (Elfsight) where the static ones were.
 *
 *   node add-elfsight-reviews.mjs            # dry run
 *   node add-elfsight-reviews.mjs --apply    # write the draft
 *   node add-elfsight-reviews.mjs --apply --publish
 *
 * Widget: Elfsight Google Reviews "Mason Park Dental for Kids", app d359c3c4-…, source the
 * PEDIATRIC listing (21830 Kingsland Blvd #104B, 4.9 / 97), not the adult #104A one.
 * Created 2026-09-29 on the shared Elfsight account (Google Reviews, 22/50).
 *
 *   /                 #proof  .pr-rail (seven hand-picked chips)  -> Embed, in a .wrap
 *   /patient-reviews  #wall   .rv-wall x2 (the nine)              -> Embed
 *
 * The lead quote and portrait on the homepage stay. The Embed block is the
 * brandklout.embed-origins module in snippet mode; a page that contains one gets the
 * plugin's compatible CSP, which is what lets platform.js reach Elfsight's API hosts
 * (they appear nowhere in the snippet — see Dr. Nahlah's 2026-08-22 runbook).
 *
 * GOTCHA: import-pages.mjs rebuilds a page from home/<page>/index.html, which has no
 * Embed. Re-importing / or /patient-reviews drops the widget: re-run this after it.
 */
import { randomBytes } from "node:crypto";
import { api, getPages, getSite, publish, BASE } from "./insta.mjs";

const APPLY = process.argv.includes("--apply");
const PUBLISH = process.argv.includes("--publish");
const MODULE = "brandklout.embed-origins.embed";
const CLASS = "rv-embed";
const SNIPPET = [
  "<!-- Elfsight Google Reviews | Mason Park Dental for Kids -->",
  '<script src="https://elfsightcdn.com/platform.js" async></script>',
  // No data-elfsight-app-lazy: with it, platform.js loads and never boots the widget on this
  // site (0px, no boot request); any later DOM mutation made it render. Verified 2026-09-29.
  '<div class="elfsight-app-d359c3c4-40bc-4c66-87ae-714ed666eb01"></div>',
].join("\n");
const WALL_HEADING = ["All nine, unedited.", "A few reviews, all unedited."]; // #494

const ALPHABET = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";
const nanoid = (n = 21) => [...randomBytes(n)].map((b) => ALPHABET[b & 63]).join("");

const site = await getSite();
const shell = site.site;
const rules = shell.styleRules ?? (shell.styleRules = {});
const ruleByName = (name) => Object.values(rules).find((r) => r.kind === "class" && r.name === name);
const nameOf = (id) => rules[id]?.name;
const hasClass = (n, c) => (n?.classIds ?? []).some((x) => nameOf(x) === c);

let embedRule = ruleByName(CLASS);
if (!embedRule) {
  const order = Math.max(0, ...Object.values(rules).map((r) => r.order ?? 0)) + 1;
  embedRule = {
    id: nanoid(), name: CLASS, kind: "class", selector: `.${CLASS}`, order,
    styles: { display: "block", width: "100%", minHeight: "420px" },
    contextStyles: {}, createdAt: Date.now(), updatedAt: Date.now(),
  };
  rules[embedRule.id] = embedRule;
  console.log(`rule   + .${CLASS}`);
}
const wrapRule = ruleByName("wrap");
if (!wrapRule) throw new Error("no .wrap rule on the shell");

const embedNode = (parentId, classIds) => ({
  id: nanoid(), moduleId: MODULE, parentId, classIds, children: [], breakpointOverrides: {},
  props: { source: "snippet", snippet: SNIPPET, url: "", title: "Google reviews", fit: "auto",
    height: 420, ratio: "16 / 9", lazy: true, allowFullscreen: false, allow: "" },
});

const dropSubtree = (nodes, id) => {
  for (const c of nodes[id]?.children ?? []) dropSubtree(nodes, c);
  delete nodes[id];
};

const { rows } = await getPages();
const changed = [];

// An embed already placed by an earlier run: bring its snippet up to date.
const refresh = (row) => {
  const stale = Object.values(row.cells.body.nodes).filter((n) => n.moduleId === MODULE && n.props?.snippet !== SNIPPET
    && /elfsight-app-d359c3c4/.test(n.props?.snippet ?? ""));
  for (const n of stale) n.props.snippet = SNIPPET;
  if (stale.length) { console.log(`/${row.slug}  snippet refreshed on ${stale.length} embed(s)`); changed.push(row); }
  return stale.length > 0;
};

// ── / : the chip rail ─────────────────────────────────────────────
{
  const row = rows.find((r) => r.slug === "index");
  const nodes = row.cells.body.nodes;
  const proof = Object.values(nodes).find((n) => n.props?.htmlAttributes?.id === "proof");
  if (!proof) throw new Error("/ has no #proof");
  if ((proof.children ?? []).some((c) => nodes[c]?.moduleId === MODULE || hasClass(nodes[c], CLASS))) {
    if (!refresh(row)) console.log("/      already has the widget");
  } else {
    const at = proof.children.findIndex((c) => hasClass(nodes[c], "pr-rail"));
    if (at < 0) throw new Error("/ #proof has no .pr-rail");
    const railId = proof.children[at];
    const made = embedNode(proof.id, [wrapRule.id, embedRule.id]);
    dropSubtree(nodes, railId);
    nodes[made.id] = made;
    proof.children[at] = made.id;
    console.log(`/      .pr-rail ${railId} -> embed ${made.id} (index ${at})`);
    changed.push(row);
  }
}

// ── /patient-reviews : the wall ───────────────────────────────────
{
  const row = rows.find((r) => r.slug === "patient-reviews");
  const nodes = row.cells.body.nodes;
  const wall = Object.values(nodes).find((n) => n.props?.htmlAttributes?.id === "wall");
  if (!wall) throw new Error("/patient-reviews has no #wall");
  const wrap = nodes[(wall.children ?? []).find((c) => (nodes[c]?.children ?? []).some((k) => hasClass(nodes[k], "rv-wall")))];
  if (!wrap) {
    if (!refresh(row)) console.log("/patient-reviews  no .rv-wall left (already swapped?)");
  } else {
    const walls = wrap.children.filter((c) => hasClass(nodes[c], "rv-wall"));
    const at = wrap.children.indexOf(walls[0]);
    const made = embedNode(wrap.id, [embedRule.id]);
    for (const w of walls) dropSubtree(nodes, w);
    nodes[made.id] = made;
    wrap.children = wrap.children.filter((c) => !walls.includes(c));
    wrap.children.splice(at, 0, made.id);
    console.log(`/patient-reviews  ${walls.length} .rv-wall -> embed ${made.id}`);
    // "All nine, unedited." is no longer true of a live feed.
    let renamed = 0;
    for (const n of Object.values(nodes)) {
      const s = JSON.stringify(n.props ?? {});
      if (s.includes(WALL_HEADING[0])) { n.props = JSON.parse(s.split(WALL_HEADING[0]).join(WALL_HEADING[1])); renamed++; }
    }
    console.log(`                  heading renamed in ${renamed} node(s)`);
    changed.push(row);
  }
}

console.log(`\ntarget ${BASE}  shell seq ${site.seq}  pages ${changed.map((r) => r.slug).join(", ") || "none"}`);
if (!APPLY) { console.log("DRY RUN — nothing written. Re-run with --apply."); process.exit(0); }
if (!changed.length) process.exit(0);

const res = await api("PUT", "/admin/api/cms/site-document", {
  mode: "incremental", site: shell,
  changedPages: changed.map((r) => ({
    id: r.id, tableId: "pages", slug: r.slug, title: r.cells.title,
    nodes: r.cells.body.nodes, rootNodeId: r.cells.body.rootNodeId, status: "published",
    cells: { ...r.cells },
  })),
  deletedPageIds: [], changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [],
  baseSeqs: Object.fromEntries(changed.map((r) => [r.id, r.seq ?? 0])), shellBaseSeq: site.seq,
});
console.log(`saved  ${JSON.stringify(res).slice(0, 160)}`);

// read back
const back = (await getPages()).rows;
for (const r of changed) {
  const n = Object.values(back.find((x) => x.id === r.id).cells.body.nodes).filter((x) => x.moduleId === MODULE);
  console.log(`check  /${r.slug}: ${n.length} embed(s), snippet ${n[0]?.props?.snippet === SNIPPET ? "exact" : "MISMATCH"}`);
}
if (PUBLISH) console.log("publish", JSON.stringify(await publish()).slice(0, 160));
