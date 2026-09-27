// One name per doctor on the production-only rows the rebuild does not have (old
// Webflow-era pages and the six root ad-page ports): the same rules as
// doctor-names.py, applied in place on the live document (2026-09-25).
// Only string props of base.text / base.heading / base.link nodes and the row's
// title / seoTitle / metaDescription change. Every change is printed on a dry run;
// read them before --apply, because a patient quote here would be edited too
// (none was on 2026-09-25). Idempotent.
//   INSTATIC_BASE_URL=https://www.masonparkdental.com node bugherd/patch-old-doctor-names.mjs [--apply]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as I from "../insta.mjs";

const APPLY = process.argv.includes("--apply");
const HOME = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "home");
const FULL = { Cho: "Dr. Dave Cho", Sung: "Dr. William Sung", Nguyen: "Dr. Tam Nguyen" };
const ORDER = ["Cho", "Sung", "Nguyen"];
const RULES = [
  [/\bDrs\.?\s+(?:Cho|Sung|Nguyen)(?:\s*,\s*(?:Cho|Sung|Nguyen))*,?\s*(?:&amp;|&|and)\s*(?:Cho|Sung|Nguyen)\b/g, (m) => {
    const full = ORDER.filter((n) => m.includes(n)).map((n) => FULL[n]);
    return full.length === 2 ? `${full[0]} and ${full[1]}` : `${full.slice(0, -1).join(", ")} and ${full.at(-1)}`;
  }],
  [/\bDr\.?\s+(?:Dave\s+)?Cho\b/g, () => FULL.Cho],
  [/\bDr\.?\s+(?:William\s+)?Sung\b/g, () => FULL.Sung],
  [/\bDr\.?\s+(?:Tam\s+)?Nguyen\b/g, () => FULL.Nguyen],
  [/(Dr\. (?:Dave Cho|William Sung|Tam Nguyen)) (DMD|DDS)\b/g, (_, a, b) => `${a}, ${b}`],
];
const fix = (s) => RULES.reduce((t, [re, fn]) => t.replace(re, fn), s);

// The rebuilt pages are handled by doctor-names.py and the push chain; skip them.
const built = new Set();
const walk = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) walk(path.join(dir, e.name));
    else if (e.name === "index.html") {
      const rel = path.relative(HOME, dir).split(path.sep).join("/");
      built.add(rel === "" ? "index" : rel);
    }
  }
};
walk(HOME);

const NODE_MODULES = new Set(["base.text", "base.heading", "base.link"]);
const rows = (await I.getPages()).rows;
const site = await I.getSite();
const changedPages = [], baseSeqs = {};
let total = 0;
for (const r of rows) {
  if (built.has(r.slug) || r.slug === "blog-article") continue;
  const cells = structuredClone(r.cells);
  let n = 0;
  for (const node of Object.values(cells.body?.nodes ?? {})) {
    if (!NODE_MODULES.has(node.moduleId)) continue;
    for (const [k, v] of Object.entries(node.props ?? {})) {
      if (typeof v !== "string" || k === "href") continue;
      const nv = fix(v);
      if (nv !== v) { console.log(`  ${r.slug} ${node.moduleId}.${k}: ${v.slice(0, 90)}\n      -> ${nv.slice(0, 90)}`); node.props[k] = nv; n++; }
    }
  }
  for (const k of ["title", "seoTitle", "metaDescription"]) {
    const v = cells[k];
    if (typeof v !== "string") continue;
    const nv = fix(v);
    if (nv !== v) { console.log(`  ${r.slug} cell.${k}: ${v}\n      -> ${nv}`); cells[k] = nv; n++; }
  }
  if (!n) continue;
  total += n;
  baseSeqs[r.id] = r.seq ?? 0;
  changedPages.push({ id: r.id, tableId: "pages", slug: r.slug, title: cells.title, nodes: cells.body.nodes, rootNodeId: cells.body.rootNodeId, status: "published", cells });
}
console.log(`${total} change(s) on ${changedPages.length} page(s)`);
if (!APPLY || !changedPages.length) process.exit(0);
const res = await I.api("PUT", "/admin/api/cms/site-document", { mode: "incremental", site: site.site, changedPages, deletedPageIds: [], changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [], baseSeqs, shellBaseSeq: site.seq });
console.log(`saved: ${JSON.stringify(res).slice(0, 160)}`);
console.log(`publish: ${JSON.stringify(await I.publish()).slice(0, 160)}`);
console.log(`status: ${JSON.stringify(await I.publishStatus())}`);
