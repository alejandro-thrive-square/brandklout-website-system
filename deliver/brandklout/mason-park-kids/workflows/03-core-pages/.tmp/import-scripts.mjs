/**
 * Give the pages their BEHAVIOUR back.
 *
 *   node import-scripts.mjs [--publish]
 *
 * to-instatic.mjs strips every <script>; Instatic holds code as site-wide
 * assets. The page needs gsap, ScrollTrigger, SplitText, site.js and
 * journey.js in that order, and the runtime registry orders scripts by a
 * priority whose direction is undocumented, so the five are concatenated in
 * order and registered as ONE asset.
 *
 * THE OLD ASSET IS REPLACED, NOT ADDED TO. The 02 migration registered
 * `src/scripts/mason-park-kids.js` as a file and never gave it a runtime
 * entry, so it never loaded on any page (list-site.mjs shows
 * `runtime.scripts` empty). This writes the bundle into that same file and
 * adds the runtime entry it always needed, scoped to every page. site.js
 * handles both generations of chrome (`masthead_*` and `navbar_*`), so the
 * 43 migrated pages get a working mobile menu out of the same change.
 *
 * A SiteFile needs BOTH `id` and `path`; a script ALSO needs the
 * `runtime.scripts[id]` entry, or it is a file on disk and nothing more.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { api, getSite, publish as doPublish, publishStatus, BASE } from "./insta.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ASSETS = path.join(HERE, "..", "home", "assets");
const PUBLISH = process.argv.includes("--publish");
const ASSET_PATH = "src/scripts/mason-park-kids.js";

const ALPHABET = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";
const newFileId = () => Array.from(crypto.randomBytes(21), (b) => ALPHABET[b & 63]).join("");

const PARTS = ["gsap/gsap.min.js", "gsap/ScrollTrigger.min.js", "gsap/SplitText.min.js", "site.js", "journey.js"];
const bundle = PARTS.map((p) => {
  const src = fs.readFileSync(path.join(ASSETS, p), "utf8");
  console.log(`  ${p.padEnd(28)} ${(src.length / 1024).toFixed(0)} KB`);
  return `/* ${p} */\n${src}`;
}).join("\n;\n");
console.log(`bundle ${(bundle.length / 1024).toFixed(0)} KB -> ${ASSET_PATH}`);
for (let i = 0; i < bundle.length; i++) { const c = bundle.charCodeAt(i); if (c < 32 && c !== 9 && c !== 10 && c !== 13) { console.error(`control byte in the bundle at ${i}`); process.exit(1); } }

const site = await getSite();
const shell = site.site;
const files = [...(shell.files ?? [])];
const at = files.findIndex((f) => f.path === ASSET_PATH);
const id = at >= 0 ? files[at].id : newFileId();
const asset = { id, path: ASSET_PATH, type: "script", content: bundle };
if (at >= 0) files[at] = { ...files[at], ...asset }; else files.push(asset);

const runtime = {
  ...(shell.runtime ?? {}),
  scripts: {
    ...((shell.runtime ?? {}).scripts ?? {}),
    [id]: {
      enabled: true, runInCanvas: false, format: "classic", placement: "body-end",
      // The local pages `defer` all five: run after parsing. ScrollTrigger
      // measures layout on init, so it must not run before the document has one.
      timing: "dom-ready",
      scope: { type: "all-pages" },
      priority: 10,
    },
  },
};

console.log(`site: ${BASE}`);
const res = await api("PUT", "/admin/api/cms/site-document", {
  mode: "incremental", site: { ...shell, files, runtime }, changedPages: [], deletedPageIds: [],
  changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [],
  baseSeqs: {}, shellBaseSeq: site.seq,
});
console.log(`saved: ${JSON.stringify(res).slice(0, 200)}`);

const after = (await getSite()).site;
const savedFile = (after.files ?? []).find((f) => f.path === ASSET_PATH);
const savedEntry = (after.runtime ?? {}).scripts?.[id];
console.log(`file    ${savedFile ? savedFile.content.length + " chars, id " + savedFile.id : "MISSING"}`);
console.log(`runtime ${savedEntry ? JSON.stringify(savedEntry) : "MISSING"}`);
if (!savedFile || !savedEntry || savedFile.content.length !== bundle.length) process.exit(1);

if (PUBLISH) {
  console.log(`publish: ${JSON.stringify(await doPublish()).slice(0, 200)}`);
  console.log(`status : ${JSON.stringify(await publishStatus())}`);
}
