/**
 * Ship the two 2026-09-18 fidelity fixes to the live landing pages WITHOUT
 * re-importing the six pages.
 *
 *   node patch-live.mjs                 # dry run: reads, reports, writes nothing
 *   node patch-live.mjs --apply         # one incremental site-document save
 *   node patch-live.mjs --apply --publish
 *
 * import.mjs rewrites every node of all six pages from converted-pages.json.
 * That is right for a first import and wrong three weeks later: the Embed
 * blocks were placed afterwards (place-embeds.mjs) and anything done in the
 * editor since lives only on the instance. So this edits the live document in
 * place:
 *
 *  1. STYLESHEET.  The leak block that build.mjs now writes at the top of
 *     lp.css is prepended to the LIVE asset's own content. The live asset is
 *     compared with the committed lp.css first and the difference reported,
 *     but it is the live text that is kept.
 *  2. LINK.  /invisalign's footer holds "Privacy Policy" as a bare text node,
 *     because build.mjs used to unwrap the PDF link. It becomes a base.link
 *     with Webflow's href and its `lp_footer_legal-link` class, which is
 *     registered as an empty rule if the site has never seen it.
 *
 * Idempotent: a second run finds both already done and saves nothing.
 * Take a backup first: `node ../../09-static-rebuild/.tmp/backup-site.mjs`.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { api, getSite, getPages, publish as doPublish, publishStatus, BASE } from "../../09-static-rebuild/.tmp/insta.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APPLY = process.argv.includes("--apply");
const PUBLISH = process.argv.includes("--publish");
const ASSET_PATH = "src/styles/mason-park-lp.css";
const PDF = "https://cdn.prod.website-files.com/6a60bdc0340e5f1784b4d553/6a7be0536588ef69bd70edbb_Patient_Privacy_Policy.pdf";
const LINK_CLASS = "lp_footer_legal-link";

const norm = (s) => s.replace(/\r\n/g, "\n").trim();
const built = norm(fs.readFileSync(path.join(HERE, "out", "lp.css"), "utf8"));
const FIRST_SCOPED = "html:has(.lp-page){";
const cut = built.indexOf(FIRST_SCOPED);
if (cut <= 0) throw new Error("out/lp.css does not open with the leak block - run build.mjs first.");
const LEAK = built.slice(0, cut).trim();
console.log(`${BASE}\nleak block: ${LEAK.split("\n").length} rules, ${LEAK.length} bytes`);

const site = await getSite();
const shell = site.site;

// ------------------------------------------------------------ 1. stylesheet
const files = [...(shell.files ?? [])];
const at = files.findIndex((f) => f.path === ASSET_PATH);
if (at < 0) throw new Error(`${ASSET_PATH} is not on this instance - this is a patch, not an import.`);
const live = norm(files[at].content ?? "");
let committed = "";
try {
  committed = norm(execFileSync("git", ["show", "HEAD:./out/lp.css"], { cwd: HERE, encoding: "utf8", maxBuffer: 1 << 26 }));
} catch { /* not fatal: only a report */ }
const below = (x) => x.slice(Math.max(0, x.indexOf(FIRST_SCOPED)));
console.log(`live asset ${live.length} bytes; committed lp.css ${committed.length} bytes; below the leak block: ${below(live) === below(committed) ? "IDENTICAL" : "DIFFERENT (the live text is kept)"}`);
// The asset as imported opens with the first scoped rule, so whatever sits before it is an
// earlier leak block. Replace it rather than stacking a second one.
const liveCut = live.indexOf(FIRST_SCOPED);
if (liveCut < 0) throw new Error("the live asset has no scoped root rule - not the file this patch expects.");
const liveLeak = live.slice(0, liveCut).trim();
const cssDone = liveLeak === LEAK;
if (cssDone) console.log("stylesheet: leak block already there");
else {
  files[at] = { ...files[at], content: `${LEAK}\n${live.slice(liveCut)}\n` };
  console.log(`stylesheet: leak block ${liveLeak ? "replaced" : "prepended"} -> ${files[at].content.length} bytes`);
}

// ------------------------------------------------------------------ 2. link
const rows = (await getPages()).rows ?? [];
const row = rows.find((r) => r.slug === "invisalign");
if (!row) throw new Error("no /invisalign row");
const body = structuredClone(row.cells.body);
const nodes = body.nodes;
const holder = Object.values(nodes).find((n) => (n.classIds ?? []).includes("lp_footer_legal-links"));
if (!holder) throw new Error("/invisalign has no .lp_footer_legal-links");
const kids = holder.children.map((id) => nodes[id]);
const already = kids.find((n) => n.moduleId === "base.link" && n.props?.href === PDF);
const bare = kids.find((n) => n.moduleId === "base.text" && (n.props?.text ?? "").trim() === "Privacy Policy");
let linkDone = false;
if (already) { linkDone = true; console.log("link: already a link"); }
else if (!bare) throw new Error(`unexpected children: ${JSON.stringify(kids).slice(0, 400)}`);
else {
  // Same id, same slot: only the module and its props change.
  nodes[bare.id] = {
    ...bare,
    moduleId: "base.link",
    props: { href: PDF, text: "Privacy Policy", target: "_self", htmlAttributes: {} },
    classIds: [LINK_CLASS],
  };
  console.log(`link: node ${bare.id} base.text -> base.link (${LINK_CLASS})`);
}

const styleRules = { ...(shell.styleRules ?? {}) };
if (!styleRules[LINK_CLASS]) {
  styleRules[LINK_CLASS] = {
    id: LINK_CLASS, kind: "class", name: LINK_CLASS, selector: `.${LINK_CLASS}`,
    declarations: {}, conditions: [], order: Object.keys(styleRules).length,
  };
  console.log(`class: ${LINK_CLASS} registered as an empty rule`);
} else console.log(`class: ${LINK_CLASS} already registered`);

if (cssDone && linkDone) { console.log("\nnothing to do."); process.exit(0); }
if (!APPLY) { console.log("\ndry run - nothing written. --apply to save."); process.exit(0); }

const changedPages = linkDone ? [] : [{
  id: row.id, tableId: "pages", slug: row.slug, title: row.cells.title,
  nodes, rootNodeId: body.rootNodeId, status: "published",
  cells: { ...row.cells, body },
}];
const res = await api("PUT", "/admin/api/cms/site-document", {
  mode: "incremental",
  site: { ...shell, styleRules, files },
  changedPages,
  deletedPageIds: [], changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [],
  baseSeqs: linkDone ? {} : { [row.id]: row.seq ?? 0 },
  shellBaseSeq: site.seq,
});
console.log(`\nsaved: ${JSON.stringify(res).slice(0, 240)}`);

if (PUBLISH) {
  console.log(`publish: ${JSON.stringify(await doPublish()).slice(0, 300)}`);
  console.log(`status : ${JSON.stringify(await publishStatus()).slice(0, 240)}`);
}
