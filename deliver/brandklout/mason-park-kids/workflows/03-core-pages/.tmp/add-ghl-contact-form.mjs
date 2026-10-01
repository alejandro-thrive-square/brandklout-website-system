#!/usr/bin/env node
/**
 * add-ghl-contact-form.mjs — the practice's GoHighLevel "Contact form" where the pages hold a slot.
 *
 *   node add-ghl-contact-form.mjs            # dry run
 *   node add-ghl-contact-form.mjs --apply    # write the draft
 *   node add-ghl-contact-form.mjs --apply --publish
 *
 * Form pyYcEmfIvtv5LwB1s4X6 ("Contact form"), embed sent by the user 2026-10-01 for BugHerd #34/#198.
 *
 *   /contacts         #message   .ms-slot  -> Embed
 *   /patient-reviews  #question  .ms-slot  -> Embed
 *
 * Instatic publishes a bare iframe as an empty div and strips the script, so the snippet goes in a
 * brandklout.embed-origins Embed (snippet mode); a page holding one gets the plugin's compatible CSP.
 * The Embed REPLACES the slot and keeps its classes, so it publishes as div.ms-slot.wz-embed, which
 * site.css makes a full-width block with the height reserved. `fit: "auto"` arms the module's
 * height runtime for the lc.setHeight message the LeadConnector frame posts (Dr. Nahlah's
 * push-contact-embeds.mjs); `height` is only the pre-measure fallback.
 *
 * GOTCHA: import-pages.mjs rebuilds a page from home/<page>/index.html, which holds only the slot.
 * Re-importing either page drops the form: re-run this after it (publish chains do).
 */
import { randomBytes } from "node:crypto";
import { api, getPages, getSite, publish, BASE } from "./insta.mjs";

const APPLY = process.argv.includes("--apply");
const PUBLISH = process.argv.includes("--publish");
const MODULE = "brandklout.embed-origins.embed";
const FORM = "pyYcEmfIvtv5LwB1s4X6";
const SLOT = "ms-slot";
const PAGES = [["contacts", "message"], ["patient-reviews", "question"]];
// Verbatim from GoHighLevel (Sites > Forms > Integrate > Embed), as the user sent it.
const SNIPPET = `<iframe
    src="https://api.leadconnectorhq.com/widget/form/${FORM}"
    style="width:100%;height:100%;border:none;border-radius:0px"
    id="inline-${FORM}"
    data-layout="{'id':'INLINE'}"
    data-trigger-type="alwaysShow"
    data-trigger-value=""
    data-activation-type="alwaysActivated"
    data-activation-value=""
    data-deactivation-type="neverDeactivate"
    data-deactivation-value=""
    data-form-name="Contact form"
    data-height="1822"
    data-layout-iframe-id="inline-${FORM}"
    data-form-id="${FORM}"
    data-cookie-consent="true"
    data-cookie-consent-provider="auto"
    title="Contact form"

        >
</iframe>
<script src="https://link.msgsndr.com/js/form_embed.js"></script>`;

const ALPHABET = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";
const nanoid = (n = 21) => [...randomBytes(n)].map((b) => ALPHABET[b & 63]).join("");

const site = await getSite();
const shell = site.site;
const rules = shell.styleRules ?? {};
const nameOf = (id) => rules[id]?.name;
const hasClass = (n, c) => (n?.classIds ?? []).some((x) => nameOf(x) === c);

const dropSubtree = (nodes, id) => {
  for (const c of nodes[id]?.children ?? []) dropSubtree(nodes, c);
  delete nodes[id];
};

const { rows } = await getPages();
const changed = [];
for (const [slug, sid] of PAGES) {
  const row = rows.find((r) => r.slug === slug);
  if (!row) throw new Error(`no page /${slug}`);
  const nodes = row.cells.body.nodes;
  const sec = Object.values(nodes).find((n) => n.props?.htmlAttributes?.id === sid);
  if (!sec) throw new Error(`/${slug} has no #${sid}`);
  const inSec = (id) => { for (let n = nodes[id]; n; n = nodes[n.parentId]) if (n.id === sec.id) return true; return false; };
  const placed = Object.values(nodes).filter((n) => n.moduleId === MODULE && inSec(n.id) && (n.props?.snippet ?? "").includes(FORM));
  if (placed.length) {
    const stale = placed.filter((n) => n.props.snippet !== SNIPPET);
    for (const n of stale) n.props.snippet = SNIPPET;
    console.log(`/${slug}  ${stale.length ? `snippet refreshed on ${stale.length}` : "already has the form"}`);
    if (stale.length) changed.push(row);
    continue;
  }
  const slot = Object.values(nodes).find((n) => n.moduleId !== MODULE && hasClass(n, SLOT) && inSec(n.id));
  if (!slot) throw new Error(`/${slug} #${sid} has no .${SLOT}`);
  const parent = nodes[slot.parentId];
  const made = {
    id: nanoid(), moduleId: MODULE, parentId: parent.id, classIds: [...(slot.classIds ?? [])], children: [], breakpointOverrides: {},
    props: { source: "snippet", snippet: SNIPPET, url: "", title: "Contact form", fit: "auto",
      height: 760, ratio: "16 / 9", lazy: true, allowFullscreen: false, allow: "" },
  };
  const at = parent.children.indexOf(slot.id);
  dropSubtree(nodes, slot.id);
  nodes[made.id] = made;
  parent.children[at] = made.id;
  console.log(`/${slug}  .${SLOT} ${slot.id} -> embed ${made.id}`);
  changed.push(row);
}

console.log(`\ntarget ${BASE}  shell seq ${site.seq}  pages ${changed.map((r) => r.slug).join(", ") || "none"}`);
if (!APPLY) { console.log("DRY RUN — nothing written. Re-run with --apply."); process.exit(0); }
if (changed.length) {
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
  const back = (await getPages()).rows;
  for (const r of changed) {
    const n = Object.values(back.find((x) => x.id === r.id).cells.body.nodes).filter((x) => x.moduleId === MODULE && (x.props?.snippet ?? "").includes(FORM));
    console.log(`check  /${r.slug}: ${n.length} form embed(s), snippet ${n[0]?.props?.snippet === SNIPPET ? "exact" : "MISMATCH"}`);
  }
}
if (PUBLISH) console.log("publish", JSON.stringify(await publish()).slice(0, 160));
