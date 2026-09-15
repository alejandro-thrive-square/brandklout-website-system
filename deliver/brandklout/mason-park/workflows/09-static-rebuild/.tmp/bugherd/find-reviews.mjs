// Lists every review text in the Trustindex richsnippet that mentions a name.
//   node find-reviews.mjs Nguyen
import fs from "node:fs";
const file = "../../../01-content-intake/.tmp/site-scrape/assets/cdn.trustindex.io/companies/1e/1e983d388599g1ad/richsnippet.json";
const j = JSON.parse(fs.readFileSync(new URL(file, import.meta.url), "utf8"));
const needle = new RegExp(process.argv[2] || "nguyen", "i");
const found = [];
(function walk(n, trail) {
  if (Array.isArray(n)) return n.forEach((x, i) => walk(x, trail + "[" + i + "]"));
  if (n && typeof n === "object") {
    if (typeof n.reviewBody === "string" || typeof n.text === "string" || typeof n.description === "string") {
      const t = n.reviewBody || n.text || n.description;
      if (needle.test(t)) found.push({ trail, author: n.author?.name || n.author || n.name, rating: n.reviewRating?.ratingValue || n.rating, date: n.datePublished || n.date, t });
    }
    for (const k of Object.keys(n)) walk(n[k], trail + "." + k);
  }
})(j, "$");
console.log(found.length, "reviews mention", needle);
for (const f of found) console.log("\n---", f.author, "|", f.rating, "|", f.date, "\n", f.t);
