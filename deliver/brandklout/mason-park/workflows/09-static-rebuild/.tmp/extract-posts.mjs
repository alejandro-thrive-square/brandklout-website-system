// ===========================================================================
// EXTRACT THE BLOG FROM THE SCRAPE INTO STRUCTURED DATA.
//
// 162 posts and 233,000 words cannot pass through a model's context, and they
// should not have to: every field this needs is already structured in the
// scrape. Each post's `meta.json` carries a Yoast JSON-LD `@graph` with a
// `BlogPosting` node holding the headline, description, datePublished and
// dateModified, and the post's `rendered.html` carries the WordPress category
// slugs as `category-*` classes on the <article> element.
//
// So this reads, it does not rewrite. The one editorial judgement it makes is
// stripping the site-name suffix from the title, because " - Dentist Katy" is
// a WordPress title-tag artefact and not part of the headline.
//
//   node extract-posts.mjs            # writes .tmp/blog/posts.json
//   node extract-posts.mjs --bodies   # also writes .tmp/blog/bodies/<slug>.html
//
// The output is the input to two things: the blog overview page, and the
// Instatic CMS rows. Neither should ever re-parse the scrape itself.
// ===========================================================================
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCRAPE = path.join(HERE, "..", "..", "01-content-intake", ".tmp", "site-scrape", "pages");
const OUT = path.join(HERE, "blog");
const WANT_BODIES = process.argv.includes("--bodies");

const SITE = "https://bestdentistinkatytx.com";

// Titles come out of WordPress as "Headline | 77450 Dentist - Dentist Katy".
// The suffix is the site name the title tag appends; the "| 77450 Dentist"
// half is SEO keyword stuffing the practice chose and is left alone.
const cleanTitle = (t) =>
  String(t || "")
    .replace(/\s*[-–|]\s*Dentist Katy\s*$/i, "")
    .replace(/\s*[-–|]\s*Mason Park Dental(?: of Katy)?\s*$/i, "")
    .trim();

const decode = (s) =>
  String(s || "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#0?39;|&#x27;|&rsquo;/g, "’")
    .replace(/&nbsp;/g, " ").replace(/&#8217;/g, "’")
    .replace(/&hellip;/g, "…").replace(/&#8211;/g, "–");

const posts = [];
const skipped = [];

for (const slug of fs.readdirSync(SCRAPE)) {
  const dir = path.join(SCRAPE, slug);
  const metaPath = path.join(dir, "meta.json");
  if (!fs.existsSync(metaPath)) continue;

  let meta;
  try { meta = JSON.parse(fs.readFileSync(metaPath, "utf8")); } catch { continue; }

  // A post is a page whose JSON-LD graph contains a BlogPosting node.
  // This is the whole classifier: no slug heuristics, no word-count guesses.
  let posting = null;
  for (const raw of meta.jsonld || []) {
    let parsed;
    try { parsed = JSON.parse(raw); } catch { continue; }
    const graph = parsed["@graph"] || [parsed];
    const found = graph.find((n) => {
      const t = n && n["@type"];
      return t === "BlogPosting" || (Array.isArray(t) && t.includes("BlogPosting"));
    });
    if (found) { posting = found; break; }
  }
  if (!posting) { skipped.push(slug); continue; }

  const htmlPath = path.join(dir, "rendered.html");
  const html = fs.existsSync(htmlPath) ? fs.readFileSync(htmlPath, "utf8") : "";

  // WordPress puts its taxonomy on the <article> element as category-* classes.
  const artOpen = (html.match(/<article[^>]*>/) || [""])[0];
  const categories = [...artOpen.matchAll(/\bcategory-([a-z0-9-]+)/g)]
    .map((m) => m[1])
    .filter((c) => c !== "uncategorized");

  // The H1 is the real headline; the title tag is the SEO version of it.
  const h1 = (meta.headings || []).find((h) => h.startsWith("H1: "));

  const published = posting.datePublished || null;
  const modified = posting.dateModified || null;

  posts.push({
    slug,
    title: cleanTitle(h1 ? h1.slice(4) : posting.headline || meta.title),
    seoTitle: decode(meta.title || ""),
    description: decode(posting.description || meta.description || ""),
    published,
    modified,
    year: published ? published.slice(0, 4) : null,
    categories,
    heroImage: meta.ogImage || null,
    words: 0, // filled below when the body is read
    sourceUrl: `${SITE}/${slug}/`,
  });
}

// ---- bodies -------------------------------------------------------------
// The rendered text is the honest source for the body: `rendered.html` is a
// whole WordPress theme, and lifting a content container out of it drags in
// the theme's share widgets, related-post rails and author box. The text file
// is already the article, and the boilerplate that trails it is bounded by two
// stable markers.
const CUT_AFTER = [
  "\nYou May Also Like",
  "\nRecent Posts",
  "\nContact Info",
  "\n77450 Dentist",
  "\nMason Park Dental of Katy\nPhone:",
];

if (WANT_BODIES) fs.mkdirSync(path.join(OUT, "bodies"), { recursive: true });

for (const p of posts) {
  const txtPath = path.join(SCRAPE, p.slug, "rendered.txt");
  if (!fs.existsSync(txtPath)) continue;
  let txt = fs.readFileSync(txtPath, "utf8");

  // Drop the chrome above the headline.
  const h1i = txt.indexOf(p.title);
  if (h1i > 0) txt = txt.slice(h1i + p.title.length);

  // Drop everything from the first boilerplate marker onwards.
  let cut = txt.length;
  for (const marker of CUT_AFTER) {
    const i = txt.indexOf(marker);
    if (i > 0 && i < cut) cut = i;
  }
  txt = txt.slice(0, cut);

  const paras = txt
    .split(/\n{1,}/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1)
    // The date line and the author line sit at the top of every post.
    .filter((s) => !/^MASON PARK DENTAL$/i.test(s))
    .filter((s) => !/^[A-Z][a-z]+ \d{1,2}, \d{4}$/.test(s));

  p.words = paras.join(" ").split(/\s+/).filter(Boolean).length;
  p.paragraphs = paras.length;

  if (WANT_BODIES) {
    // Short lines that are not sentences are headings in the original.
    const body = paras
      .map((s) =>
        s.length < 90 && !/[.!?]$/.test(s)
          ? `<h2>${s}</h2>`
          : `<p>${s}</p>`,
      )
      .join("\n");
    fs.writeFileSync(path.join(OUT, "bodies", p.slug + ".html"), body);
  }
}

// Newest first, and the undated one goes LAST rather than first: sorting
// `String(null)` puts "null" above every real date and the one post Yoast
// never dated would have led the blog.
posts.sort((a, b) => {
  if (!a.published && !b.published) return a.title.localeCompare(b.title);
  if (!a.published) return 1;
  if (!b.published) return -1;
  return b.published.localeCompare(a.published);
});

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "posts.json"), JSON.stringify(posts, null, 2));

const cats = {};
for (const p of posts) for (const c of p.categories) cats[c] = (cats[c] || 0) + 1;

console.log(`${posts.length} posts extracted, ${skipped.length} pages skipped (no BlogPosting)`);
console.log(`words: ${posts.reduce((a, b) => a + b.words, 0).toLocaleString()}`);
console.log(`dated: ${posts.filter((p) => p.published).length}/${posts.length}`);
console.log(`with hero image: ${posts.filter((p) => p.heroImage).length}/${posts.length}`);
console.log("\ncategories:");
for (const [c, n] of Object.entries(cats).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(4)}  ${c}`);
}
console.log(`\nwrote ${path.relative(process.cwd(), path.join(OUT, "posts.json"))}`);
if (WANT_BODIES) console.log(`wrote ${posts.length} bodies to blog/bodies/`);
