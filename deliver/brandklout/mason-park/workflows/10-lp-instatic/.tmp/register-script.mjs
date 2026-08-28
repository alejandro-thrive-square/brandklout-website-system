/**
 * Register lp-runtime.js as an Instatic runtime script, scoped to the six
 * landing pages.
 *
 *   node register-script.mjs [--publish]
 *
 * The script asset is a SiteFile of type 'script'; `site.runtime.scripts` is
 * keyed by that file's id and carries placement, timing and scope. Scope is
 * `{type:'pages', pageIds:[...]}` so none of this loads on the other 71 pages -
 * the main site must keep its own phone number and pull in no third-party JS
 * it did not have before.
 *
 * This also settles an open question: the instance currently publishes
 * `script-src 'none'; frame-src 'none'`, while the Dr Nahlah instance running
 * the same image publishes a permissive policy. If the policy tracks whether
 * the site has any runtime script, registering one flips it and the GoHighLevel
 * form works. Verify with `node verify-live.mjs` after publishing - do not
 * assume it worked.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { api, getSite, getPages, publish as doPublish, publishStatus } from "../../09-static-rebuild/.tmp/insta.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PUBLISH = process.argv.includes("--publish");
const SCRIPT_PATH = "src/scripts/lp-runtime.js";

const ALPHABET = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";
const newId = () => Array.from(crypto.randomBytes(21), (b) => ALPHABET[b & 63]).join("");

const SLUGS = [
  "invisalign", "new-patient-special", "invisalign-consultation",
  "new-patient-special-consultation", "invisalign-thank-you", "new-patient-thank-you",
];

const REMOVE = process.argv.includes("--remove");
const js = fs.readFileSync(path.join(HERE, "lp-runtime.js"), "utf8");
const site = await getSite();
const shell = site.site;

// The answer turned out to be no: registering a script does relax `script-src`
// from 'none' to 'self', but only to 'self'. The GoHighLevel iframe still hits
// `frame-src 'none'`, and number_pool.js / form_embed.js / elfsight are all
// cross-origin so `script-src 'self'` blocks them too. Keeping the script would
// ship JS that cannot do anything AND leave a needlessly relaxed policy, so
// --remove takes it back out. See build.mjs's extractForms for the full note.
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
