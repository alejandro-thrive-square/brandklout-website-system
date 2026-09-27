/**
 * Self-host the two webfonts, because the published-page CSP blocks Google.
 *
 *   node install-fonts.mjs [--publish]
 *
 * ## Why this is not optional
 *
 * `site.css` asks for its faces the way the static build did:
 *
 *   @import url("https://fonts.googleapis.com/css2?family=DM+Sans...&family=Figtree...")
 *
 * On a published Instatic page that request never completes. The base policy in
 * `/app/src/core/publisher/cspPlan.ts` sets `style-src 'self' 'unsafe-inline'`
 * and emits NO `font-src` at all, so the stylesheet fetch fails `style-src` and
 * the woff2 files fall through to `default-src 'self'`. Nothing errors visibly:
 * the pages render, in the fallback stack, and the site just looks slightly
 * wrong in a way that is easy to blame on the CSS.
 *
 * The parent practice's site does not hit this only because its `webzite.*`
 * plugins relax the policy. This site has no plugins, and adding one to license
 * a font request is the wrong trade.
 *
 * ## What this does instead
 *
 * `POST /admin/api/cms/fonts/install` downloads the woff2 files into the
 * instance and returns a `FontEntry` describing the on-disk paths. Merged into
 * `site.settings.fonts`, Instatic emits the `@font-face` rules itself and
 * serves the files from the same origin - so they satisfy `default-src 'self'`
 * and need no CSP change at all. It is also what the parent site does for
 * Montserrat, so the two sites end up on the same mechanism.
 *
 * The variants are exactly the ones the `@import` asked for, no more: fonts are
 * per-publish bytes in the volume, and an unused weight is paid for forever.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  api, getSite, saveShell, publish as doPublish, BASE,
} from "../../../../../process/18-instatic-embeds/lib/insta-api.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PUBLISH = process.argv.includes("--publish");

/* Straight from the @import in site.css:
     DM Sans  ital,opsz,wght@0,...400;0,...500;0,...700;1,...400
     Figtree  wght@400;500;600;700                                */
const WANT = [
  { family: "DM Sans", variants: ["400", "500", "700", "400italic"], subsets: ["latin"] },
  { family: "Figtree", variants: ["400", "500", "600", "700"], subsets: ["latin"] },
];

console.log(`site: ${BASE}`);

const installed = [];
for (const sel of WANT) {
  const est = await api("POST", "/admin/api/cms/fonts/estimate", sel);
  console.log(`${sel.family}: ${sel.variants.join(", ")} - ~${((est.bytes ?? est.totalBytes ?? 0) / 1024).toFixed(0)} KB`);
  const res = await api("POST", "/admin/api/cms/fonts/install", sel);
  const entry = res.font ?? res.entry ?? res;
  console.log(`  installed: ${(entry.files ?? []).length} file(s)`);
  installed.push(entry);
}

/* The REST call did the on-disk work; the metadata only exists once it is
   merged into the shell and saved. Skip this and the faces are on disk and
   referenced by nothing. */
const { site: shell, seq } = await getSite();
const existing = shell.settings?.fonts?.items ?? [];
const items = [...existing];
for (const entry of installed) {
  const at = items.findIndex((i) => i.family === entry.family);
  if (at >= 0) items[at] = entry;
  else items.push(entry);
}
const settings = { ...(shell.settings ?? {}), fonts: { ...(shell.settings?.fonts ?? {}), items } };
console.log(`saving ${items.length} font famil(y/ies) into settings`);
console.log(`save: ${JSON.stringify(await saveShell({ ...shell, settings }, seq)).slice(0, 160)}`);

const after = (await getSite()).site;
const got = (after.settings?.fonts?.items ?? []).map((i) => i.family);
console.log(`settings.fonts now: ${got.join(", ") || "(empty)"}`);
for (const sel of WANT) {
  if (!got.includes(sel.family)) {
    console.error(`${sel.family} did not persist - pages will fall back`);
    process.exit(1);
  }
}

/* The stylesheet's dead @import is `import-styles.mjs`'s job to strip - it owns
   that asset, and doing it there survives a re-run in either order. All this
   needs to do is notice if the published copy still carries one, which means
   the stylesheet was shipped by an older version of that script. */
const live = (after.files ?? []).find((f) => f.path === "src/styles/mason-park-kids.css");
if (live && /fonts\.googleapis\.com/.test(live.content ?? "")) {
  console.log("\nNOTE: the published stylesheet still @imports Google Fonts, which the CSP");
  console.log("blocks. Re-run `node import-styles.mjs` to drop it.");
}

if (PUBLISH) {
  console.log(`publish: ${JSON.stringify(await doPublish()).slice(0, 200)}`);
}
