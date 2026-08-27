/**
 * Give the imported pages their styling back.
 *
 *   node import-styles.mjs [--publish]
 *
 * The converter kept our class names as `node.classIds`, but Instatic only
 * emits a class attribute for a class it has a rule for - so the live pages
 * came out with the right structure and no classes at all.
 *
 * Rather than translate the whole stylesheet into registry rules (the
 * convert-css problem, and slow), register each class name as an EMPTY rule so
 * the attribute is emitted, and ship site.css verbatim as a site-wide code
 * asset to do the actual styling. Cascade order is
 * reset -> framework -> style -> userStyles, so a code asset wins at equal
 * specificity, which is what we want here.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const ALPHABET = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";
const newFileId = () => Array.from(crypto.randomBytes(21), (b) => ALPHABET[b & 63]).join("");
import { api, getSite, publish as doPublish, publishStatus, BASE } from "./insta.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PUBLISH = process.argv.includes("--publish");

const pages = JSON.parse(fs.readFileSync(path.join(HERE, "converted-pages.json"), "utf8"));
const classNames = new Set();
for (const p of pages) {
  for (const n of Object.values(p.body.nodes)) for (const c of n.classIds ?? []) classNames.add(c);
}
const css = fs.readFileSync(path.join(HERE, "instatic", "site.css"), "utf8");
console.log(`${classNames.size} classes, site.css ${(css.length / 1024).toFixed(0)} KB`);

const site = await getSite();
const shell = site.site;

const styleRules = { ...(shell.styleRules ?? {}) };
let order = Object.keys(styleRules).length;
for (const name of classNames) {
  if (styleRules[name]) continue;
  styleRules[name] = {
    id: name,
    kind: "class",
    name,
    selector: `.${name}`,
    declarations: {},
    conditions: [],
    order: order++,
  };
}

// A SiteFile needs BOTH an `id` (nanoid, and explicitly not the path, because
// path is mutable on rename) and a `path`. An entry missing `id` is dropped
// silently - the save answers ok:true and `files` comes back empty. Type
// 'style' means src/styles/*.css.
const ASSET_PATH = "src/styles/mason-park.css";
const files = [...(shell.files ?? [])];
const at = files.findIndex((f) => f.path === ASSET_PATH);
const asset = {
  id: at >= 0 ? files[at].id : newFileId(),
  path: ASSET_PATH,
  type: "style",
  content: css,
};
if (at >= 0) files[at] = { ...files[at], ...asset };
else files.push(asset);

const res = await api("PUT", "/admin/api/cms/site-document", {
  mode: "incremental",
  site: { ...shell, styleRules, files },
  changedPages: [],
  deletedPageIds: [],
  changedComponents: [],
  deletedComponentIds: [],
  changedLayouts: [],
  deletedLayoutIds: [],
  baseSeqs: {},
  shellBaseSeq: site.seq,
});
console.log(`saved: ${JSON.stringify(res).slice(0, 200)}`);

if (PUBLISH) {
  console.log(`publish: ${JSON.stringify(await doPublish()).slice(0, 200)}`);
  console.log(`status : ${JSON.stringify(await publishStatus()).slice(0, 200)}`);
  console.log(`live at ${BASE}`);
}
