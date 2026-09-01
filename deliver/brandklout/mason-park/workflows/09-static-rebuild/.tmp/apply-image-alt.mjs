// Put every image's alt text back on the converted nodes.
//
//   node apply-image-alt.mjs        # after fetch-nodes.mjs, before import-styles.mjs
//
// Instatic's HTML importer maps <img> onto `base.image` and keeps exactly
// `src`, `loading`, `fetchPriority` and `decoding`. **`alt` is not among them.**
// Every image on the published site therefore carries `alt=""` -- 0 of 38 on
// the homepage and 0 of 19 on the service page, against 24 and 19 in the source.
// The 81-page site that was here before had the same hole: there is not one
// `base.image` node with an alt prop anywhere in the backup.
//
// That is an accessibility defect on a medical practice's website and it throws
// away image SEO on pages that earn search traffic, and neither the local gate
// (which reads the source HTML, where the alts are present and correct) nor a
// screenshot can see it.
//
// `srcset` and `sizes` are dropped by the same mapping and are NOT restored
// here: Instatic generates its own srcset at publish -- webp, and more
// breakpoints than we ship -- so ours is redundant. `sizes` going missing means
// the browser assumes 100vw and may over-fetch on a narrow column; that is a
// performance nit, not a defect, and it is not worth fighting the platform for.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CONVERTED = path.join(HERE, "converted-pages.json");
const PAGES_DIR = path.join(HERE, "instatic", "pages");

/**
 * The page's <img> tags IN DOCUMENT ORDER, as { src, alt }.
 *
 * KEYING BY SRC DOES NOT WORK, and it fails in both directions. The homepage's
 * `rg-thumb` index thumbnails deliberately reuse the arc photographs' src with
 * `alt="" aria-hidden="true"`, because the link text beside them already names
 * the treatment. Last-write-wins gave two content images the thumbnail's empty
 * alt (22 of 38 against 24 in the source); "prefer the non-empty one" then gave
 * four decorative thumbnails a duplicate description (28 of 38), which is worse
 * -- a screen reader now announces the same sentence twice.
 *
 * Position is the honest key: the converter walks the document, so the Nth
 * base.image node is the Nth <img>. That is an assumption, so it is CHECKED
 * below against the src sequence rather than trusted.
 */
const imagesFrom = (html) => [...html.matchAll(/<img\b[^>]*>/g)].map((m) => ({
  src: (m[0].match(/\ssrc="([^"]*)"/) || [])[1] ?? "",
  alt: (m[0].match(/\salt="([^"]*)"/) || [])[1] ?? "",
  // No `loading` attribute in the source means EAGER, which is the browser
  // default and is deliberate on the hero.
  loading: (m[0].match(/\sloading="([^"]*)"/) || [])[1] ?? "eager",
  fetchPriority: (m[0].match(/\sfetchpriority="([^"]*)"/i) || [])[1] ?? "auto",
}));

const converted = JSON.parse(fs.readFileSync(CONVERTED, "utf8"));
const bySlug = new Map();
for (const f of fs.readdirSync(PAGES_DIR)) {
  const p = JSON.parse(fs.readFileSync(path.join(PAGES_DIR, f), "utf8"));
  bySlug.set(p.slug, imagesFrom(p.html));
}

let set = 0, blank = 0, eager = 0;
for (const page of converted) {
  const src = bySlug.get(page.slug);
  if (!src) { console.error(`no exported html for ${page.slug}`); process.exit(1); }
  const nodes = Object.values(page.body.nodes).filter((n) => n.moduleId === "base.image");

  // THE PAIRING IS CHECKED, NOT TRUSTED. If the counts or the src sequence
  // disagree, the positional assumption is wrong for this page and writing
  // alts by index would caption the wrong pictures -- which is worse than no
  // alts at all, and invisible in every screenshot.
  if (nodes.length !== src.length) {
    console.error(`  ${page.slug}: ${nodes.length} image nodes vs ${src.length} <img> tags - refusing`);
    process.exit(1);
  }
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].props?.src !== src[i].src) {
      console.error(`  ${page.slug}: image ${i} is ${nodes[i].props?.src} but the html has ${src[i].src} - order differs, refusing`);
      process.exit(1);
    }
  }

  let pageSet = 0, pageBlank = 0;
  for (let i = 0; i < nodes.length; i++) {
    const alt = src[i].alt;
    // `props.alt` is IGNORED by base.image -- setting it publishes and changes
    // nothing, which is a convincing way to think you have fixed this. The
    // module keeps src/loading/fetchPriority/decoding and nothing else, so
    // anything more goes through `htmlAttributes`, the same escape hatch the
    // map iframe's node uses for its data-src and title.
    nodes[i].props.htmlAttributes = { ...(nodes[i].props.htmlAttributes || {}), alt };
    // base.image emits its OWN `alt=""` unconditionally, so the published tag
    // carries two alt attributes -- ours first (which is the one every parser
    // and screen reader takes) and the module's empty one after. Invalid HTML,
    // harmless in practice, and not something we can suppress from here. What
    // we CAN avoid is adding a third: `props.alt` is ignored by the module but
    // an earlier version of this script set it, so it is cleared.
    delete nodes[i].props.alt;
    // AND THE LOADING HINTS. The converter defaults every image to
    // `loading: "lazy", fetchPriority: "auto"` regardless of what the source
    // said -- so the hero, which is the LCP element and is deliberately eager
    // and high priority, was published lazy. All 38 images on the homepage
    // came out lazy. These two ARE real base.image props, unlike alt, so they
    // are set directly.
    nodes[i].props.loading = src[i].loading;
    nodes[i].props.fetchPriority = src[i].fetchPriority;
    if (src[i].loading === "eager") eager++;
    if (alt.trim()) { set++; pageSet++; } else { blank++; pageBlank++; }
  }
  console.log(`  ${String(page.slug).padEnd(24)} ${nodes.length} images: ${pageSet} described, ${pageBlank} deliberately empty`);
}

fs.writeFileSync(CONVERTED, JSON.stringify(converted, null, 1));
console.log(`${eager} image(s) kept eager (the hero)`);
console.log(`
${set} alt(s) written, ${blank} left empty (decorative) -> converted-pages.json`);
if (!set) { console.error("nothing was set - do not publish this"); process.exit(1); }
