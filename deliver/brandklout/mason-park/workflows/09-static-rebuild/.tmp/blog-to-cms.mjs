// ===========================================================================
// TURN THE EXTRACTED BLOG INTO INSTATIC CMS ROWS.
//
// The static build under home/blog/ is 161 real pages and ships today. This
// is the other half of the job: the same posts as CMS DATA, so the practice
// can edit a post without a rebuild and so new posts do not need this repo at
// all.
//
// Instatic's model, from deliver/process/22-instatic-api-sync:
//   - a data TABLE holds ROWS, each row a `cells` object
//   - `PATCH /admin/api/cms/data/rows/:id` REPLACES `cells` WHOLESALE. A
//     partial patch silently deletes every cell it omits -- title, slug and
//     body included -- and answers 200. Always read, merge, write the whole
//     object, then read back. That warning is why this file only ever emits
//     complete rows.
//   - a TEMPLATE PAGE renders one row; the collection page lists them.
//
// This writes the payload and does NOT upload. Uploading is a separate,
// reviewed step against a live instance, and process 22's rule is to run
// backup-site.mjs before anything destructive.
//
//   node blog-to-cms.mjs            # writes .tmp/blog/cms-rows.json
//   node blog-to-cms.mjs --check    # report only
// ===========================================================================
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BLOG = path.join(HERE, "blog");
const CHECK = process.argv.includes("--check");

const posts = JSON.parse(fs.readFileSync(path.join(BLOG, "posts.json"), "utf8"));

// One row per post. Field names are the CMS column names and are the contract
// between this file and the template page -- change one, change both.
const rows = posts.map((p) => {
  const bodyPath = path.join(BLOG, "bodies", p.slug + ".html");
  const body = fs.existsSync(bodyPath) ? fs.readFileSync(bodyPath, "utf8") : "";
  return {
    slug: p.slug,
    cells: {
      title: p.title,
      slug: p.slug,
      seoTitle: p.seoTitle,
      metaDescription: p.description,
      excerpt: p.description,
      body,                       // HTML: <h2> and <p> only, no classes
      publishedAt: p.published,   // ISO 8601, or null for the one Yoast never dated
      updatedAt: p.modified,
      topic: p.categories.includes("invisalign")
        ? "Invisalign"
        : p.categories.some((c) => c.startsWith("dental-implant"))
          ? "Dental implants"
          : "General",
      wordCount: p.words,
      // The ORIGINAL hero, kept as a reference and deliberately NOT used as a
      // live src: it points at the WordPress host this build replaces. To use
      // these, download them into uploads/ and re-point the field.
      legacyHeroUrl: p.heroImage,
      legacyUrl: p.sourceUrl,
    },
  };
});

const missingBody = rows.filter((r) => !r.cells.body).map((r) => r.slug);
const missingDate = rows.filter((r) => !r.cells.publishedAt).map((r) => r.slug);
const bytes = Buffer.byteLength(JSON.stringify(rows));

console.log(`${rows.length} rows`);
console.log(`payload: ${(bytes / 1024 / 1024).toFixed(2)} MB`);
console.log(`words:   ${rows.reduce((a, r) => a + r.cells.wordCount, 0).toLocaleString()}`);
console.log(`topics:  ${JSON.stringify(rows.reduce((a, r) => ((a[r.cells.topic] = (a[r.cells.topic] || 0) + 1), a), {}))}`);
if (missingBody.length) console.log(`! ${missingBody.length} row(s) with no body: ${missingBody.join(", ")}`);
if (missingDate.length) console.log(`! ${missingDate.length} row(s) with no publishedAt: ${missingDate.join(", ")}`);

// Slugs must be unique: Instatic re-derives the slug from whatever it is
// handed, so two rows claiming one slug is a silent overwrite, not an error.
const seen = new Set();
const dupes = rows.filter((r) => (seen.has(r.slug) ? true : (seen.add(r.slug), false)));
if (dupes.length) {
  console.error(`! ${dupes.length} DUPLICATE slug(s): ${dupes.map((d) => d.slug).join(", ")}`);
  process.exit(1);
}
console.log("slugs: all unique");

if (!CHECK) {
  const out = path.join(BLOG, "cms-rows.json");
  fs.writeFileSync(out, JSON.stringify(rows, null, 2));
  console.log(`\nwrote ${path.relative(process.cwd(), out)}`);
  console.log("NOT uploaded. Upload is a separate reviewed step -- run backup-site.mjs first.");
}
