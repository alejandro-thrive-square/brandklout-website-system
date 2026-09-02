// Put the core stylesheet AFTER the migration's in the published bundle.
//
//   node reorder-styles.mjs [--publish]
//
// import-styles.mjs appends our asset to the END of `files`, and that is not
// where the bundler reads order from: the published userStyles-*.css opened
// with `src/styles/mason-park-kids-core.css` and carried the old sheet after
// it, so every tie on a shared class name (`.button`, `.faq_question`) went
// to the old sheet - the live buttons came out uppercase. The bundle is
// ordered by PATH. So the migration's asset is renamed to sort first:
// `src/styles/legacy-migration.css`. A SiteFile is keyed by id, so the
// rename changes nothing else about it.
import { getSite, saveShell, publish as doPublish, publishStatus, BASE } from "./insta.mjs";

const OLD = "src/styles/mason-park-kids.css";
const NEW = "src/styles/legacy-migration.css";
const PUBLISH = process.argv.includes("--publish");

const { site: shell, seq } = await getSite();
console.log(`site: ${BASE}`);
const files = (shell.files ?? []).map((f) => (f.path === OLD ? { ...f, path: NEW } : f));
if (!files.some((f) => f.path === NEW)) { console.log(`nothing named ${OLD}; files: ${files.map((f) => f.path).join(", ")}`); process.exit(0); }
console.log(`save: ${JSON.stringify(await saveShell({ ...shell, files }, seq)).slice(0, 120)}`);
const after = (await getSite()).site;
console.log("files now: " + (after.files ?? []).map((f) => f.path).sort().join(" | "));
if (PUBLISH) {
  console.log(`publish: ${JSON.stringify(await doPublish()).slice(0, 200)}`);
  console.log(`status : ${JSON.stringify(await publishStatus())}`);
}
