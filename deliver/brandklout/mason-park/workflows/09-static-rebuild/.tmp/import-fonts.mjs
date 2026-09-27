// Install the three type families on Instatic, self-hosted.
//
//   INSTATIC_BASE_URL=https://staging.masonparkdental.com node import-fonts.mjs [--publish]
//
// WHY THE PAGES CAME UP IN THE WRONG TYPE. `home/index.html` loads Karla,
// Newsreader and Nunito Sans with a <link> in the <head>. `to-instatic.mjs`
// ships a BODY, and strips every <link> and <script> on the way -- so the three
// families never reached Instatic at all and the live pages fell back to
// Georgia and Segoe UI. Nothing reports this: `document.fonts.check()` answers
// true for a fallback, and computed `font-family` reports the stack that was
// ASKED for, not the one being painted. The only honest test is to measure a
// string in the family and in its own fallback and compare the widths.
//
// It cannot be fixed with an @import at the top of site.css either: an @import
// is only valid before any other rule, and the fluid root holds that position
// (see the note in home/index.html).
//
// So use the platform's own mechanism, which is what Montserrat already uses on
// this site: `settings.fonts.items[]`, `source: "google"`. Instatic FETCHES AND
// STORES the woff2 files itself and serves them from /uploads/fonts/<family>/,
// then emits the @font-face rules at publish. No third party is handed the
// visitor, which is the same rule the vendored GSAP follows.
//
// The variants are exactly the ones the approved page's <link> requests -- no
// more, because every extra weight is another file on every page load.
import { api, getSite, publish as doPublish, publishStatus, BASE } from "./insta.mjs";

const PUBLISH = process.argv.includes("--publish");

const WANT = [
  { family: "Newsreader", variants: ["300", "400", "500", "300italic", "400italic", "500italic"] },
  { family: "Karla", variants: ["500", "700"] },
  { family: "Nunito Sans", variants: ["400", "600", "700"] },
];
const SUBSETS = ["latin"];

const before = (await getSite()).site.settings?.fonts?.items ?? [];
const installed = [];
console.log(`${BASE}`);
console.log(`fonts already installed: ${before.map((f) => f.family).join(", ") || "(none)"}`);

// GET /fonts/google is the CATALOGUE and is GET-only; POST to it is a 405 that
// reads like a permissions problem. The install route is /fonts/install, and it
// does the fetching and storing server-side.
for (const w of WANT) {
  const have = before.find((f) => f.family === w.family);
  // Matching on family alone is not enough: a family installed with the wrong
  // weights looks installed and renders the missing ones as a synthesised bold
  // or oblique, which is subtly wrong rather than obviously wrong.
  const same = have && w.variants.every((v) => (have.variants ?? []).includes(v));
  if (same) {
    console.log(`  ${w.family}: already installed with the right variants, skipping`);
    continue;
  }
  if (have) console.log(`  ${w.family}: installed with ${(have.variants ?? []).join(",")} - reinstalling`);
  process.stdout.write(`  ${w.family}: installing ${w.variants.join(",")} ... `);
  const res = await api("POST", "/admin/api/cms/fonts/install", {
    source: "google",
    family: w.family,
    variants: w.variants,
    subsets: SUBSETS,
  });
  const f = res.font ?? res;
  installed.push(f);
  console.log(`${(f.files ?? []).length} file(s)`);
}

// INSTALLING IS NOT REGISTERING. `POST /fonts/install` fetches the woff2 files
// and returns a complete font object -- and stops there. The family does not
// appear in `settings.fonts.items` until the shell is saved with it, and until
// it does, `@font-face` is never emitted and the page renders its fallback.
// The install answers with a fat, correct-looking payload either way, so
// nothing about that response tells you the site is still unstyled.
if (installed.length) {
  const site = await getSite();
  const shell = site.site;
  const items = [...(shell.settings?.fonts?.items ?? [])];
  for (const f of installed) {
    const at = items.findIndex((x) => x.family === f.family);
    if (at >= 0) items[at] = f; else items.push(f);
  }
  const res = await api("PUT", "/admin/api/cms/site-document", {
    mode: "incremental",
    site: { ...shell, settings: { ...(shell.settings ?? {}), fonts: { ...(shell.settings?.fonts ?? {}), items } } },
    changedPages: [],
    deletedPageIds: [],
    changedComponents: [],
    deletedComponentIds: [],
    changedLayouts: [],
    deletedLayoutIds: [],
    baseSeqs: {},
    shellBaseSeq: site.seq,
  });
  console.log(`\nregistered on the shell: ${JSON.stringify(res).slice(0, 120)}`);
}

// Read it back. A font that did not actually download its files is an entry
// with an empty `files` array, which looks installed and renders as nothing.
const after = (await getSite()).site.settings?.fonts?.items ?? [];
console.log("\ninstalled now:");
let bad = 0;
for (const f of after) {
  const n = (f.files ?? []).length;
  console.log(`  ${String(f.family).padEnd(16)} ${String(f.source).padEnd(8)} ${n} file(s)  ${(f.files ?? [])[0]?.path ?? ""}`);
  if (!n) { console.log(`    ^ NO FILES - this family will render as its fallback`); bad++; }
}
for (const w of WANT) {
  if (!after.some((f) => f.family === w.family)) { console.log(`  MISSING: ${w.family}`); bad++; }
}
if (bad) process.exit(1);

if (PUBLISH) {
  console.log("\npublishing...");
  console.log(JSON.stringify(await doPublish()).slice(0, 200));
  console.log(`status: ${JSON.stringify(await publishStatus())}`);
}
