/**
 * Step 7: prove the published site is actually serving what we imported.
 *
 *   node verify-live.mjs
 *
 * `publish -> {"publishedPages":54}` only says the CMS wrote 54 rows. It does
 * not say a route answers 200, that the stylesheet reached the page, or that
 * the images resolve - and those are exactly the things that break in an
 * import, because they depend on the media map and the class registration
 * rather than on the page content.
 *
 * Checks, per route: status, that a class attribute is emitted at all (the
 * empty-rule registration in `import-styles.mjs` is what makes that happen),
 * and that every `/uploads/` reference resolves. Image URLs are collected
 * across the whole site and each distinct one is fetched once.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BASE } from "../../../../../process/18-instatic-embeds/lib/insta-api.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const pagesDir = path.join(HERE, "instatic", "pages");
const slugs = fs.readdirSync(pagesDir)
  .map((f) => JSON.parse(fs.readFileSync(path.join(pagesDir, f), "utf8")).slug);

const bad = [];
const images = new Set();
let checked = 0;

for (const slug of slugs) {
  const url = `${BASE}${slug === "/" ? "/" : slug}`;
  let res, html = "";
  try {
    res = await fetch(url, { redirect: "follow" });
    html = await res.text();
  } catch (e) {
    bad.push(`${slug}  FETCH FAILED ${e.message.slice(0, 80)}`);
    continue;
  }
  if (res.status !== 200) { bad.push(`${slug}  HTTP ${res.status}`); continue; }
  if (!/class="/.test(html)) bad.push(`${slug}  no class attributes - style rules missing`);
  if (!/<title>/.test(html)) bad.push(`${slug}  no <title>`);
  for (const m of html.matchAll(/\/uploads\/[A-Za-z0-9_.\-]+/g)) images.add(m[0]);
  checked++;
  if (checked % 10 === 0) console.log(`  ${checked}/${slugs.length} routes`);
}
console.log(`${checked}/${slugs.length} routes answered 200`);

console.log(`\n${images.size} distinct /uploads/ reference(s) across the site`);
let brokenImages = 0;
for (const src of images) {
  const r = await fetch(`${BASE}${src}`, { method: "HEAD" });
  if (!r.ok) { bad.push(`IMAGE ${r.status}  ${src}`); brokenImages++; }
}
console.log(`${images.size - brokenImages}/${images.size} images resolve`);

if (bad.length) {
  console.log(`\n${bad.length} problem(s):`);
  for (const b of bad.slice(0, 40)) console.log(`  ! ${b}`);
  process.exit(1);
}
console.log(`\nclean - every route 200, every image resolves, classes emitted`);
console.log(BASE);
