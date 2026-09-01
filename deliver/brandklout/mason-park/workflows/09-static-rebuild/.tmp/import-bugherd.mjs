// Put the BugHerd review sidebar on every page of STAGING, or take it off again.
//
//   INSTATIC_BASE_URL=https://staging.masonparkdental.com node import-bugherd.mjs [--publish]
//   INSTATIC_BASE_URL=https://staging.masonparkdental.com node import-bugherd.mjs --remove [--publish]
//
// WHY A LOADER AND NOT THE SNIPPET. Instatic stores a body, not a document, and
// `to-instatic.mjs` strips every <script> from it -- so the client's
// `<script src="https://www.bugherd.com/sidebarv2.js?apikey=...">` cannot live
// in a page. Code lives as a site-wide asset with a `runtime.scripts` entry, and
// an asset is inline JS by content; there is no `src` field on it. So the asset
// is a four-line loader that appends the real tag. BugHerd reads
// `document.currentScript.src` to learn its own origin (it falls back to
// `https://localhost:3000` otherwise), and a dynamically appended classic script
// still gets `currentScript`, so that works.
//
// THE CSP IS THE OTHER HALF. The published page carries `script-src 'self'` and
// `frame-src https://www.google.com`. BugHerd loads its loader from
// www.bugherd.com, its sidebar bundles from sidebar.bugherd.com, and mounts a
// communication <iframe> from www.bugherd.com -- all three refused until the
// embed-origins plugin lists them. That is plugin settings, not the site
// document, and it is set with:
//
//   cd ../../../../process/18-instatic-embeds
//   INSTATIC_BASE_URL=https://staging.masonparkdental.com node set-origins.mjs \
//     --frame "https://www.google.com https://www.bugherd.com" \
//     --script "https://www.bugherd.com https://sidebar.bugherd.com" \
//     --connect "https://notify.bugsnag.com https://sessions.bugsnag.com"
//
// `set-origins.mjs` REPLACES all three boxes on every call, so the Google Maps
// frame origin has to be repeated or the map dies. A script origin also grants
// itself connect/style/font, which is what the sidebar needs once running.
//
// STAGING ONLY. The review sidebar must never reach www.masonparkdental.com,
// so this refuses any host that is not staging, in both directions.
//
// Same SiteFile rules as import-scripts.mjs: the file needs BOTH `id` and
// `path` or it is dropped on an ok:true save, and a script with no
// `runtime.scripts` entry never loads, with no error anywhere. `all-pages`,
// `head` and `immediate` are the values Dr Nahlah's site.js has run under
// since 2026-08 (13-content-export-import/.tmp/push-site-js.mjs).
import crypto from "node:crypto";
import { api, getSite, publish as doPublish, publishStatus, BASE, IS_STAGING } from "./insta.mjs";

const PUBLISH = process.argv.includes("--publish");
const REMOVE = process.argv.includes("--remove");

if (!IS_STAGING) {
  console.error(`${BASE} is not a staging host. The BugHerd sidebar is a review tool and does not ship to production. Refusing.`);
  process.exit(1);
}

const ASSET_PATH = "src/scripts/bugherd.js";
const BUGHERD_SRC = "https://www.bugherd.com/sidebarv2.js?apikey=wss7lflvrdyxfigqiilzsq";

const ALPHABET = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";
const newFileId = () => Array.from(crypto.randomBytes(21), (b) => ALPHABET[b & 63]).join("");

const loader = [
  "/* BugHerd review sidebar. Staging only; import-bugherd.mjs --remove takes it off. */",
  "(function () {",
  `  if (document.querySelector('script[src^="https://www.bugherd.com/sidebarv2.js"]')) return;`,
  "  var s = document.createElement('script');",
  `  s.src = ${JSON.stringify(BUGHERD_SRC)};`,
  "  s.async = true;",
  "  document.head.appendChild(s);",
  "})();",
  "",
].join("\n");

const site = await getSite();
const shell = site.site;
const files = [...(shell.files ?? [])];
const scripts = { ...((shell.runtime ?? {}).scripts ?? {}) };
const at = files.findIndex((f) => f.path === ASSET_PATH);

if (REMOVE) {
  if (at < 0) {
    console.log(`${ASSET_PATH} is not on ${BASE}; nothing to remove.`);
  } else {
    const [gone] = files.splice(at, 1);
    delete scripts[gone.id];
    console.log(`removing ${ASSET_PATH} (id ${gone.id}) and its runtime entry`);
  }
} else {
  const id = at >= 0 ? files[at].id : newFileId();
  const asset = { id, path: ASSET_PATH, type: "script", content: loader };
  if (at >= 0) files[at] = { ...files[at], ...asset };
  else files.push(asset);
  scripts[id] = {
    enabled: true,
    runInCanvas: false,
    format: "classic",
    // The snippet the client gave is a head script with `async`; this is the
    // same thing, and it must not wait for dom-ready behind the GSAP bundle.
    placement: "head",
    timing: "immediate",
    scope: { type: "all-pages" },
    priority: 5,
  };
  console.log(`${at >= 0 ? "updating" : "adding"} ${ASSET_PATH} (id ${id}), scoped to every page`);
}

const runtime = { ...(shell.runtime ?? {}), scripts };
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
const savedEntry = savedFile ? (after.runtime ?? {}).scripts?.[savedFile.id] : undefined;
if (REMOVE) {
  console.log(savedFile ? `STILL PRESENT: ${ASSET_PATH}` : `gone: ${ASSET_PATH}`);
  if (savedFile) process.exit(1);
} else {
  console.log(`file    ${savedFile ? savedFile.content.length + " chars, id " + savedFile.id : "MISSING"}`);
  console.log(`runtime ${savedEntry ? JSON.stringify(savedEntry) : "MISSING"}`);
  if (!savedFile || !savedEntry) process.exit(1);
}

if (PUBLISH) {
  console.log("publishing...");
  console.log(JSON.stringify(await doPublish()).slice(0, 200));
  console.log(`status: ${JSON.stringify(await publishStatus())}`);
  console.log(`live at ${BASE}`);
}
