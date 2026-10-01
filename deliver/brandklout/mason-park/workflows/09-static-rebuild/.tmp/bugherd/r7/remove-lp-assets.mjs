// Remove the retired root Webflow ad pages' code assets (BugHerd #264, 2026-10-01).
//
//   INSTATIC_BASE_URL=<base> node bugherd/r7/remove-lp-assets.mjs [--apply]
//
// src/styles/mason-park-lp.css (134 KB) and src/scripts/lp-faq.js were installed for the six
// Webflow ports (workflows/10-lp-instatic), which have been one-block forwarders since
// 2026-09-25 and use neither. The stylesheet is bundled into every page's userStyles anyway,
// and its webflow-icons @font-face is a data: URI the strict page CSP refuses ("Loading the
// font 'data:application/x-font-ttf...' violates ... font-src"). No page row carries an
// .lp-page or .w-icon class. Shell-only save (no page rows, so no template flags at risk);
// no publish here: the chain that follows publishes.
import { api, getSite, BASE } from "../../insta.mjs";

const APPLY = process.argv.includes("--apply");
const PATHS = ["src/styles/mason-park-lp.css", "src/scripts/lp-faq.js"];
const site = await getSite();
const shell = site.site;
const gone = (shell.files ?? []).filter((f) => PATHS.includes(f.path));
console.log(`${BASE}: removing ${gone.map((f) => `${f.path} (${String(f.content ?? "").length} b)`).join(", ") || "nothing, already gone"}`);
if (!gone.length || !APPLY) process.exit(0);
const files = (shell.files ?? []).filter((f) => !PATHS.includes(f.path));
const scripts = { ...(shell.runtime?.scripts ?? {}) };
for (const f of gone) delete scripts[f.id];
const res = await api("PUT", "/admin/api/cms/site-document", {
  mode: "incremental",
  site: { ...shell, files, runtime: { ...(shell.runtime ?? {}), scripts } },
  changedPages: [], deletedPageIds: [], changedComponents: [], deletedComponentIds: [],
  changedLayouts: [], deletedLayoutIds: [], baseSeqs: {}, shellBaseSeq: site.seq,
});
console.log(`saved ${JSON.stringify(res).slice(0, 120)}`);
const after = (await getSite()).site;
const left = (after.files ?? []).filter((f) => PATHS.includes(f.path)).map((f) => f.path);
console.log(`read back: ${left.length ? `STILL PRESENT ${left}` : "gone"}; files now ${(after.files ?? []).map((f) => f.path).join(", ")}`);
if (left.length) process.exit(1);
