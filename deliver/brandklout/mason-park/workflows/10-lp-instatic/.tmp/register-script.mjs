/**
 * Register a landing-page runtime script with Instatic, scoped to the six
 * landing pages.
 *
 *   node register-script.mjs lp-faq.js [--publish]
 *   node register-script.mjs lp-faq.js --remove [--publish]
 *
 * The script asset is a SiteFile of type 'script'; `site.runtime.scripts` is
 * keyed by that file's id and carries placement, timing and scope. Scope is
 * `{type:'pages', pageIds:[...]}` so none of this loads on the other 71 pages -
 * the main site must keep its own phone number and pull in no third-party JS
 * it did not have before.
 *
 * Currently used for `lp-faq.js`, which puts the FAQ accordions back: they are
 * Webflow Dropdown components whose answers are revealed by a `w--open` class
 * that only `webflow.js` adds, and the port strips `webflow.js`.
 *
 * Always read back after saving. A SiteFile without an `id` is dropped
 * silently - the save answers ok:true and `files` comes back empty - so this
 * re-fetches the document and asserts both the file and its runtime entry
 * survived, rather than trusting the ok.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { api, getSite, getPages, publish as doPublish, publishStatus } from "../../09-static-rebuild/.tmp/insta.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PUBLISH = process.argv.includes("--publish");
const FILE = process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : null;
if (!FILE) {
  console.error("usage: node register-script.mjs <file.js> [--remove] [--publish]");
  process.exit(2);
}
const SCRIPT_PATH = `src/scripts/${FILE}`;

const ALPHABET = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";
const newId = () => Array.from(crypto.randomBytes(21), (b) => ALPHABET[b & 63]).join("");

const SLUGS = [
  "invisalign", "new-patient-special", "invisalign-consultation",
  "new-patient-special-consultation", "invisalign-thank-you", "new-patient-thank-you",
];

const REMOVE = process.argv.includes("--remove");
const js = fs.readFileSync(path.join(HERE, FILE), "utf8");
const site = await getSite();
const shell = site.site;

// A registered script is served same-origin from /_instatic/assets/, so it runs
// under `script-src 'self'` and needs no CSP widening of its own. That is why
// the FAQ fix ships this way rather than as an inline snippet in an Embed
// block. (An earlier experiment tried to inject the GoHighLevel iframe from a
// script like this; that could never work, because `frame-src 'none'` blocks a
// scripted iframe exactly as it blocks a static one. The forms are Embed blocks
// instead - see build.mjs's extractForms.)
if (REMOVE) {
  const files = (shell.files ?? []).filter((f) => f.path !== SCRIPT_PATH);
  const gone = (shell.files ?? []).find((f) => f.path === SCRIPT_PATH);
  const scripts = { ...(shell.runtime?.scripts ?? {}) };
  if (gone) delete scripts[gone.id];
  const res = await api("PUT", "/admin/api/cms/site-document", {
    mode: "incremental",
    site: { ...shell, files, runtime: { ...(shell.runtime ?? {}), scripts } },
    changedPages: [], deletedPageIds: [],
    changedComponents: [], deletedComponentIds: [],
    changedLayouts: [], deletedLayoutIds: [],
    baseSeqs: {}, shellBaseSeq: site.seq,
  });
  console.log(`removed ${SCRIPT_PATH}: ${JSON.stringify(res).slice(0, 120)}`);
  const after = (await getSite()).site;
  console.log(`read back: file ${(after.files ?? []).some((f) => f.path === SCRIPT_PATH) ? "STILL PRESENT" : "gone"}`
    + `, runtime entries ${Object.keys(after.runtime?.scripts ?? {}).length}`);
  if (PUBLISH) {
    console.log(`publish: ${JSON.stringify(await doPublish()).slice(0, 200)}`);
    console.log(`status : ${JSON.stringify(await publishStatus()).slice(0, 200)}`);
  }
  process.exit(0);
}

const rows = (await getPages()).rows ?? [];
const pageIds = SLUGS.map((s) => {
  const r = rows.find((x) => x.slug === s);
  if (!r) throw new Error(`page ${s} is not in the CMS - import it first`);
  return r.id;
});
console.log(`scoping to ${pageIds.length} pages`);

const files = [...(shell.files ?? [])];
const at = files.findIndex((f) => f.path === SCRIPT_PATH);
const id = at >= 0 ? files[at].id : newId();
const asset = { id, path: SCRIPT_PATH, type: "script", content: js };
if (at >= 0) files[at] = { ...files[at], ...asset }; else files.push(asset);
console.log(`${at >= 0 ? "replaced" : "added"} ${SCRIPT_PATH} (${(js.length / 1024).toFixed(1)} KB), id ${id}`);

const runtime = {
  ...(shell.runtime ?? {}),
  scripts: {
    ...(shell.runtime?.scripts ?? {}),
    [id]: {
      enabled: true,
      runInCanvas: false,
      format: "classic",
      placement: "body-end",
      timing: "dom-ready",
      scope: { type: "pages", pageIds },
      priority: 100,
    },
  },
};

const res = await api("PUT", "/admin/api/cms/site-document", {
  mode: "incremental",
  site: { ...shell, files, runtime },
  changedPages: [], deletedPageIds: [],
  changedComponents: [], deletedComponentIds: [],
  changedLayouts: [], deletedLayoutIds: [],
  baseSeqs: {}, shellBaseSeq: site.seq,
});
console.log(`saved: ${JSON.stringify(res).slice(0, 200)}`);

// Read back: a save that answers ok:true but drops the entry is a known Instatic
// failure mode (a SiteFile without an id does exactly that).
const after = (await getSite()).site;
const savedFile = (after.files ?? []).find((f) => f.path === SCRIPT_PATH);
const savedEntry = after.runtime?.scripts?.[id];
console.log(`read back: file ${savedFile ? `present (${String(savedFile.content ?? "").length}b)` : "MISSING"}`
  + `, runtime entry ${savedEntry ? `present (enabled=${savedEntry.enabled})` : "MISSING"}`);
if (!savedFile || !savedEntry) process.exitCode = 1;

if (PUBLISH) {
  console.log("publishing...");
  console.log(`publish: ${JSON.stringify(await doPublish()).slice(0, 200)}`);
  console.log(`status : ${JSON.stringify(await publishStatus()).slice(0, 200)}`);
}
