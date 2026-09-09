/**
 * Give the imported pages their styling back.
 *
 *   node import-styles.mjs [--publish]
 *
 * Two things, in one save:
 *   1. Register every class name the converted pages carry as an EMPTY style
 *      rule. Instatic only emits a class attribute for a class it holds a rule
 *      for; without this the pages arrive with perfect structure and no
 *      classes, which looks like a stylesheet that failed to load.
 *   2. Ship home/assets/site.css as a SECOND site-wide code asset,
 *      `src/styles/mason-park-kids-core.css`, appended AFTER the migration's
 *      `src/styles/mason-park-kids.css`, which stays for the 43 pages that
 *      still use its `navbar_*` / `footer_*` chrome.
 *
 * THE TWO SHEETS SHARE ONE SITE. The chrome classes never collide (masthead_*
 * against navbar_*), but both declare :root tokens and element defaults, and
 * the later sheet wins those ties. Appending ours means the migrated pages
 * inherit Fraunces, Nunito and the sage accent in place of the old theme's
 * Figtree, DM Sans and cyan; their layouts do not depend on those tokens. It
 * is deliberate: one brand across both generations of page until the rest are
 * rebuilt. verify-live.mjs spot-checks two migrated pages after publish.
 *
 * Run AFTER apply-body-class.mjs and apply-image-alt.mjs: the class harvest
 * reads the converted node graphs, so `has-journey` on the root node has to be
 * there already or it never gets a rule and is never emitted.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { api, getSite, publish as doPublish, publishStatus, BASE } from "./insta.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PUBLISH = process.argv.includes("--publish");
const ASSET_PATH = "src/styles/mason-park-kids-core.css";
const OLD_ASSET = "src/styles/mason-park-kids.css";

const ALPHABET = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";
const newFileId = () => Array.from(crypto.randomBytes(21), (b) => ALPHABET[b & 63]).join("");

const pages = JSON.parse(fs.readFileSync(path.join(HERE, "converted-pages.json"), "utf8"));
const classNames = new Set();
for (const p of pages) for (const n of Object.values(p.body.nodes)) for (const c of n.classIds ?? []) classNames.add(c);
let css = fs.readFileSync(path.join(HERE, "instatic", "site.css"), "utf8");
if (/fonts\.googleapis\.com/.test(css)) { console.error("site.css imports Google Fonts - the CSP blocks it; the faces go through import-fonts.mjs"); process.exit(1); }

/* THE SELF-HOSTED VARIABLE FACES. site.css names them relatively -
   `url("fonts/fraunces-vf.woff2")` - which is correct beside the stylesheet on
   disk and wrong here: this asset is served from `src/styles/`, so the same
   relative URL would resolve to `/src/styles/fonts/...` and 404. The upload
   paths are in font-map.json, written by upload-fonts.mjs.

   Rewritten HERE rather than listed as a second `src` in the stylesheet
   itself, because a two-source `src` means whichever path does not exist 404s
   in the console of every page - three errors per page from `file://`, on
   every shot.mjs run, permanently. See the block at the top of site.css.

   A face with no mapping is fatal. Falling through would publish a stylesheet
   whose display font silently degrades to the static Fraunces, which is the
   exact bug this whole change exists to fix, and nothing would say so. */
const fontMapPath = path.join(HERE, "font-map.json");
const declared = [...css.matchAll(/url\("fonts\/([^"]+)"\)/g)].map((m) => m[1]);
if (declared.length) {
  if (!fs.existsSync(fontMapPath)) {
    console.error(`site.css names ${declared.length} self-hosted face(s) and there is no font-map.json - run \`node upload-fonts.mjs --fetch\` then \`node upload-fonts.mjs\``);
    process.exit(1);
  }
  const faces = JSON.parse(fs.readFileSync(fontMapPath, "utf8")).faces ?? {};
  const missing = declared.filter((f) => !faces[f]?.url);
  if (missing.length) { console.error(`no upload for ${missing.join(", ")} in font-map.json - re-run upload-fonts.mjs`); process.exit(1); }
  css = css.replace(/url\("fonts\/([^"]+)"\)/g, (_, file) => `url("${faces[file].url}")`);
  console.log(`fonts: ${declared.map((f) => `${f} -> ${faces[f].url}`).join("\n       ")}`);
}
if (/url\("fonts\//.test(css)) { console.error("a relative fonts/ url survived the rewrite"); process.exit(1); }
for (let i = 0; i < css.length; i++) { const c = css.charCodeAt(i); if (c < 32 && c !== 9 && c !== 10 && c !== 13) { console.error(`control byte in site.css at ${i}`); process.exit(1); } }
console.log(`site: ${BASE}`);
console.log(`${classNames.size} classes across ${pages.length} pages, site.css ${(css.length / 1024).toFixed(0)} KB`);
if (!classNames.has("has-journey")) { console.error("has-journey is not among the classes - run apply-body-class.mjs first"); process.exit(1); }

const site = await getSite();
const shell = site.site;
const styleRules = { ...(shell.styleRules ?? {}) };
let order = Object.keys(styleRules).length, added = 0;
for (const name of classNames) {
  if (styleRules[name]) continue;
  styleRules[name] = { id: name, kind: "class", name, selector: `.${name}`, declarations: {}, conditions: [], order: order++ };
  added++;
}
console.log(`style rules: ${Object.keys(shell.styleRules ?? {}).length} -> ${Object.keys(styleRules).length} (+${added})`);

const files = [...(shell.files ?? [])];
const oldAt = files.findIndex((f) => f.path === OLD_ASSET);
const at = files.findIndex((f) => f.path === ASSET_PATH);
const asset = { id: at >= 0 ? files[at].id : newFileId(), path: ASSET_PATH, type: "style", content: css };
if (at >= 0) files[at] = { ...files[at], ...asset };
else files.push(asset);
// Ours after the old one, so it wins the token ties described above.
const ours = files.findIndex((f) => f.path === ASSET_PATH);
if (oldAt >= 0 && ours < oldAt) { const [m] = files.splice(ours, 1); files.push(m); }
console.log(`files: ${files.map((f) => f.path).join(", ")}`);

const res = await api("PUT", "/admin/api/cms/site-document", {
  mode: "incremental", site: { ...shell, styleRules, files }, changedPages: [], deletedPageIds: [],
  changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [],
  baseSeqs: {}, shellBaseSeq: site.seq,
});
console.log(`saved: ${JSON.stringify(res).slice(0, 200)}`);

const after = (await getSite()).site;
const got = (after.files ?? []).find((f) => f.path === ASSET_PATH);
console.log(`read back: ${got ? `${ASSET_PATH} ${got.content.length} chars, id ${got.id}` : "ASSET MISSING"}; styleRules ${Object.keys(after.styleRules ?? {}).length}`);
if (!got || got.content.length !== css.length) process.exit(1);

if (PUBLISH) {
  console.log(`publish: ${JSON.stringify(await doPublish()).slice(0, 200)}`);
  console.log(`status : ${JSON.stringify(await publishStatus()).slice(0, 200)}`);
}
