/**
 * Step 6 of the Instatic import: give the imported pages their styling and
 * behaviour back.
 *
 *   node import-styles.mjs [--publish] [--pages <converted-pages.json>]
 *
 * The converter kept our class names as `node.classIds`, but Instatic only
 * emits a class attribute for a class it has a rule for - so without this the
 * pages come out with the right structure and no classes at all, which looks
 * like the stylesheet failed to load when in fact it never had anything to
 * match.
 *
 * Rather than translate the whole stylesheet into registry rules (slow, and
 * lossy), register each class name as an EMPTY rule so the attribute is
 * emitted, and ship `site.css` verbatim as a site-wide code asset to do the
 * actual styling. Cascade order is reset -> framework -> style -> userStyles,
 * so a code asset wins at equal specificity, which is what we want.
 *
 * `site.js` (mobile menu + deferred map) ships the same way, as a `script`
 * asset. Both paths follow the convention the parent practice's site uses:
 * `src/styles/*.css` and `src/scripts/*.js`.
 *
 * Fonts need no separate registration here: `site.css` carries its own
 * `@import url(https://fonts.googleapis.com/...)` for DM Sans, so the faces
 * arrive with the stylesheet.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import {
  api, getSite, publish as doPublish, publishStatus, BASE,
} from "../../../../../process/18-instatic-embeds/lib/insta-api.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const PUBLISH = argv.includes("--publish");
const PAGES = argv.includes("--pages")
  ? path.resolve(HERE, argv[argv.indexOf("--pages") + 1])
  : path.join(HERE, "converted-pages.json");

const ALPHABET = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";
const newFileId = () => Array.from(crypto.randomBytes(21), (b) => ALPHABET[b & 63]).join("");

const pages = JSON.parse(fs.readFileSync(PAGES, "utf8"));
const classNames = new Set();
for (const p of pages) {
  for (const n of Object.values(p.body.nodes)) for (const c of n.classIds ?? []) classNames.add(c);
}

/* Drop the Google Fonts @import on the way in. The published-page CSP sets
   `style-src 'self' 'unsafe-inline'` and emits no `font-src`, so that request
   can only fail - see install-fonts.mjs, which self-hosts the faces instead.
   Stripped HERE, in the script that owns the stylesheet asset, rather than as a
   one-off: `to-instatic.mjs` regenerates site.css from dist/ with the @import
   intact (correct - a local preview of dist/ needs it), so any later re-run of
   this script would otherwise quietly put the dead request back. */
const rawCss = fs.readFileSync(path.join(HERE, "instatic", "site.css"), "utf8");
const css = rawCss.replace(/@import url\("https:\/\/fonts\.googleapis\.com[^"]*"\);\s*/g, "");
if (css !== rawCss) console.log(`dropped the CSP-blocked Google Fonts @import (-${rawCss.length - css.length} chars)`);
const js = fs.readFileSync(path.join(HERE, "instatic", "site.js"), "utf8");
console.log(`site: ${BASE}`);
console.log(`${classNames.size} classes, site.css ${(css.length / 1024).toFixed(0)} KB, site.js ${(js.length / 1024).toFixed(1)} KB`);

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

/* A SiteFile needs BOTH an `id` (nanoid, and explicitly NOT the path, because
   path is mutable on rename) and a `path`. An entry missing `id` is dropped
   silently - the save answers ok:true and `files` comes back empty. */
const ASSETS = [
  { path: "src/styles/mason-park-kids.css", type: "style", content: css },
  { path: "src/scripts/mason-park-kids.js", type: "script", content: js },
];

const files = [...(shell.files ?? [])];
for (const a of ASSETS) {
  const at = files.findIndex((f) => f.path === a.path);
  const entry = { id: at >= 0 ? files[at].id : newFileId(), ...a };
  if (at >= 0) files[at] = { ...files[at], ...entry };
  else files.push(entry);
}

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

/* Read back rather than trust ok:true - a file entry missing `id` is dropped
   silently, and the failure mode is an unstyled site nobody can explain. */
const after = (await getSite()).site;
console.log(`styleRules now: ${Object.keys(after.styleRules ?? {}).length}`);
for (const a of ASSETS) {
  const got = (after.files ?? []).find((f) => f.path === a.path);
  console.log(`  ${got ? "OK  " : "LOST"} ${a.path}${got ? `  ${String(got.content ?? "").length} chars` : ""}`);
}
if (ASSETS.some((a) => !(after.files ?? []).some((f) => f.path === a.path))) {
  console.error("a code asset did not persist - the site will render unstyled");
  process.exit(1);
}

if (PUBLISH) {
  console.log(`publish: ${JSON.stringify(await doPublish()).slice(0, 200)}`);
  console.log(`status : ${JSON.stringify(await publishStatus()).slice(0, 200)}`);
  console.log(`live at ${BASE}`);
}
