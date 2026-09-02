// Give the imported pages their BEHAVIOUR back.
//
//   INSTATIC_BASE_URL=https://staging.masonparkdental.com node import-scripts.mjs [--publish]
//
// WHY THIS EXISTS. `to-instatic.mjs` strips every <script> from the body,
// because Instatic stores a body and holds code as site-wide assets. But
// `import-styles.mjs` only ever shipped the CSS -- so the imported pages came
// up correctly styled and with NO JAVASCRIPT AT ALL: the mobile menu toggle
// did nothing, the deferred map never loaded, and the whole GSAP layer was
// missing. Everything degraded quietly, which is why it survived a review:
// `journey.js` is written so a page without it reads as ordinary static markup.
//
// ONE FILE, NOT FIVE. The page loads gsap, ScrollTrigger, SplitText, site.js
// and journey.js in that order, and order is load-bearing -- journey.js checks
// `window.gsap && window.ScrollTrigger` and falls back to `jr-fail` if either
// is missing. Instatic's runtime registry orders scripts by a `priority` whose
// direction is not documented anywhere we can see, so rather than guess and get
// a silently static page, the five are concatenated in the right order and
// registered as a single asset. Joined with a newline and a semicolon: the
// vendored GSAP builds are minified UMD and do not all end in one.
//
// A SiteFile needs BOTH `id` (nanoid, NOT the path, which is mutable) and
// `path`; an entry missing `id` is dropped silently and `files` comes back
// empty on an ok:true save. A script ALSO needs an entry in `runtime.scripts`
// keyed by that same id -- a file on its own is inert, which is the same shape
// of failure as the missing id.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { api, getSite, getPages, publish as doPublish, publishStatus, BASE } from "./insta.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const HOME = path.join(HERE, "..", "home", "assets");
const PUBLISH = process.argv.includes("--publish");

const ALPHABET = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";
const newFileId = () => Array.from(crypto.randomBytes(21), (b) => ALPHABET[b & 63]).join("");

// The exact order the page's own <script> tags declare.
const PARTS = [
  "gsap/gsap.min.js",
  "gsap/ScrollTrigger.min.js",
  "gsap/SplitText.min.js",
  "site.js",
  "journey.js",
  "elevate.js",
];
const ASSET_PATH = "src/scripts/mason-park.js";

const chunks = PARTS.map((p) => {
  const abs = path.join(HOME, p);
  const src = fs.readFileSync(abs, "utf8");
  console.log(`  ${p.padEnd(28)} ${(src.length / 1024).toFixed(0)} KB`);
  return `/* ${p} */\n${src}`;
});
const bundle = chunks.join("\n;\n");
console.log(`bundle ${(bundle.length / 1024).toFixed(0)} KB -> ${ASSET_PATH}`);

for (let i = 0; i < bundle.length; i++) {
  const c = bundle.charCodeAt(i);
  if (c < 32 && c !== 9 && c !== 10 && c !== 13) {
    console.error(`control byte in the bundle at ${i} - refusing to ship it`);
    process.exit(1);
  }
}

const site = await getSite();
const shell = site.site;

const files = [...(shell.files ?? [])];
const at = files.findIndex((f) => f.path === ASSET_PATH);
const id = at >= 0 ? files[at].id : newFileId();
const asset = { id, path: ASSET_PATH, type: "script", content: bundle };
if (at >= 0) files[at] = { ...files[at], ...asset };
else files.push(asset);

// Scope: every page on the site. The one script already registered here is
// scoped `{type:"pages", pageIds:[...]}` to the six landing pages, five of
// which no longer exist -- so that shape is known-good but needs a list. This
// site is the two-page deliverable, so the list is short and explicit, which
// avoids guessing an enum the validator may not accept.
const pageIds = ((await getPages()).rows ?? []).map((r) => r.id);
const runtime = {
  ...(shell.runtime ?? {}),
  scripts: {
    ...((shell.runtime ?? {}).scripts ?? {}),
    [id]: {
      enabled: true,
      runInCanvas: false,
      format: "classic",
      placement: "body-end",
      // The local page uses `defer` on all five, i.e. run after parsing. GSAP's
      // ScrollTrigger measures layout on init, so it must not run before the
      // document has one.
      timing: "dom-ready",
      scope: { type: "pages", pageIds },
      priority: 10,
    },
  },
};

const res = await api("PUT", "/admin/api/cms/site-document", {
  mode: "incremental",
  site: { ...shell, files, runtime },
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

// Read it back: a dropped file and a dropped runtime entry both answer ok:true.
const after = (await getSite()).site;
const savedFile = (after.files ?? []).find((f) => f.path === ASSET_PATH);
const savedEntry = (after.runtime ?? {}).scripts?.[id];
console.log(`file    ${savedFile ? savedFile.content.length + " chars, id " + savedFile.id : "MISSING"}`);
console.log(`runtime ${savedEntry ? JSON.stringify(savedEntry).slice(0, 160) : "MISSING"}`);
if (!savedFile || !savedEntry) process.exit(1);

if (PUBLISH) {
  console.log("publishing...");
  console.log(JSON.stringify(await doPublish()).slice(0, 200));
  console.log(`status: ${JSON.stringify(await publishStatus())}`);
  console.log(`live at ${BASE}`);
}
