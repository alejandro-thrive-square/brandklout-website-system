/**
 * Install Montserrat into the Mason Park Instatic site library.
 *
 *   node install-fonts.mjs           # dry run
 *   node install-fonts.mjs --apply
 *
 * WHY
 * The landing pages set every heading and every paragraph to Montserrat, but
 * Webflow loads it with a `WebFont.load(...)` script - and the port strips all
 * scripts. Left alone the pages publish with the right `font-family` VALUE and
 * the wrong rendered font, which no structural diff catches: the side-by-side
 * capture showed identical copy wrapping at different points. Exactly the
 * defect already recorded for Playfair Display on the Dr Nahlah site, whose
 * install-fonts.mjs this follows.
 *
 * Installing through Instatic (rather than adding a Google Fonts <link>) puts
 * the woff2 files under /uploads/fonts/, which is same-origin and therefore
 * survives whatever CSP the instance publishes.
 */
import { api, getSite } from "../../09-static-rebuild/.tmp/insta.mjs";

// The weights lp.css actually uses (300/400/500/600/700/800), plus the italics
// behind the hero's emphasised word.
const WANTED = [{
  family: "Montserrat",
  variants: ["300", "400", "500", "600", "700", "800", "400italic", "600italic", "700italic"],
}];
const SUBSETS = ["latin"];
const apply = process.argv.includes("--apply");

const { families } = await api("GET", "/admin/api/cms/fonts/google");
const byName = new Map(families.map((f) => [f.family, f]));

for (const want of WANTED) {
  const found = byName.get(want.family);
  if (!found) throw new Error(`${want.family} is not in the bundled Google Fonts directory`);
  const missing = want.variants.filter((v) => !found.variants.includes(v));
  if (missing.length) console.warn(`  ! ${want.family}: directory has no ${missing.join(", ")}`);
  want.variants = want.variants.filter((v) => found.variants.includes(v));
  console.log(`${want.family}: ${want.variants.length} variants -> ${want.variants.join(", ")}`);
}

if (!apply) {
  for (const w of WANTED) {
    const est = await api("POST", "/admin/api/cms/fonts/estimate", { ...w, subsets: SUBSETS });
    console.log(`  ${w.family}: ~${Math.round((est.bytes ?? est.totalBytes ?? 0) / 1024)} KB`);
  }
  console.log("\nDRY RUN - re-run with --apply");
  process.exit(0);
}

const installed = [];
for (const w of WANTED) {
  const entry = await api("POST", "/admin/api/cms/fonts/install", { ...w, subsets: SUBSETS });
  const fe = entry.font ?? entry.entry ?? entry;
  console.log(`installed ${w.family}: ${(fe.files ?? []).length} files`);
  installed.push(fe);
}

// Register the entries on the site document; the publisher emits @font-face
// from settings.fonts.items.
const site = await getSite();
const shell = site.site;
const items = [...(shell.settings?.fonts?.items ?? [])];
for (const fe of installed) {
  const at = items.findIndex((i) => i.family === fe.family);
  if (at >= 0) items[at] = fe; else items.push(fe);
}
const settings = { ...(shell.settings ?? {}), fonts: { ...(shell.settings?.fonts ?? {}), items } };

const res = await api("PUT", "/admin/api/cms/site-document", {
  mode: "incremental",
  site: { ...shell, settings },
  changedPages: [], deletedPageIds: [],
  changedComponents: [], deletedComponentIds: [],
  changedLayouts: [], deletedLayoutIds: [],
  baseSeqs: {}, shellBaseSeq: site.seq,
});
console.log(`saved: ${JSON.stringify(res).slice(0, 200)}`);
console.log(`site.settings.fonts.items now holds: ${items.map((i) => i.family).join(", ")}`);
