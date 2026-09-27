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
  // The comment form. 81 of the 161 bodies ended on "I agree that my
  // submitted data is being collected and stored. *" -- the consent checkbox
  // label -- because none of the markers above appear on those posts.
  "\nLeave a comment",
  "\nLeave a Comment",
  "\nSubmit a Comment",
  // The tag cloud WordPress prints under the post.
  "\nDentist 77450",
  "\nSchedule a virtual consultation now",
];

if (WANT_BODIES) fs.mkdirSync(path.join(OUT, "bodies"), { recursive: true });
// slug -> block array, held until every body is built: the author-box pass
// below needs to compare first paragraphs ACROSS posts, so nothing can be
// written to disk inside the loop.
const bodies = new Map();

for (const p of posts) {
  const txtPath = path.join(SCRAPE, p.slug, "rendered.txt");
  if (!fs.existsSync(txtPath)) continue;
  let txt = fs.readFileSync(txtPath, "utf8");

  // Drop the chrome above the headline.
  //
  // `p.title` is the CLEANED headline -- cleanTitle() strips the " - Dentist
  // Katy" suffix -- but rendered.txt carries the heading as WordPress printed
  // it, suffix and all. On the posts where the two differ indexOf returned -1,
  // nothing was cut, and the theme's skip links, phone number and SCHEDULE
  // ONLINE button shipped as the first four <h2>s of the article. So the raw
  // seoTitle is tried first and the cleaned title second.
  const heading = [p.seoTitle, p.title].find((t) => t && txt.indexOf(t) > 0);
  if (heading) txt = txt.slice(txt.indexOf(heading) + heading.length);

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
    .filter((s) => !/^[A-Z][a-z]+ \d{1,2}, \d{4}$/.test(s))
    // Theme furniture that sits between the H1 and the first paragraph. Every
    // one of these was shipping as an <h2> INSIDE the article: the comment
    // counter WordPress prints under the headline ("0Comments"), the author
    // byline, the skip links, and the header's phone/address strip. 98 of the
    // 161 bodies opened with one of them.
    .filter((s) => !/^\d+\s*Comments?$/i.test(s))
    .filter((s) => !/^(ADMIN|SCHEDULE ONLINE|MENU|SEARCH)$/i.test(s))
    .filter((s) => !/^Skip to (content|sidebar|footer|main)/i.test(s))
    .filter((s) => !/^\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/.test(s))
    .filter((s) => !/^Dentist Katy \|/i.test(s))
    // A leftover fragment of the title suffix, when the heading match above
    // landed on the cleaned title inside the longer raw one.
    .filter((s) => !/^[-–|]\s*(Dentist Katy|Mason Park Dental)/i.test(s))
    // The headline itself, when the cut above landed on an earlier copy of it
    // (the theme prints the title in the breadcrumb as well as the H1). The
    // article page already renders the title as its H1; a second copy inside
    // the body is a duplicate heading.
    .filter((s) => s !== p.title && s !== p.seoTitle);

  p.words = paras.join(" ").split(/\s+/).filter(Boolean).length;
  p.paragraphs = paras.length;

  {
    // Short lines that are not sentences are headings in the original --
    // EXCEPT when three or more run consecutively, which is a bulleted list the
    // text renderer flattened. "12 Reasons to See Your Dentist" was shipping
    // its twelve reasons as twelve <h2>s in a row.
    const isHeadingish = (s) => s.length < 90 && !/[.!?]$/.test(s);
    const blocks = [];
    for (let i = 0; i < paras.length; i++) {
      if (!isHeadingish(paras[i])) { blocks.push(`<p>${paras[i]}</p>`); continue; }
      let j = i;
      while (j < paras.length && isHeadingish(paras[j])) j++;
      const run = paras.slice(i, j);
      if (run.length >= 3) {
        blocks.push("<ul>" + run.map((s) => `<li>${s}</li>`).join("") + "</ul>");
      } else {
        for (const s of run) blocks.push(`<h2>${s}</h2>`);
      }
      i = j - 1;
    }
    // A leading <h2> that is the headline again, or a fragment of it. The
    // exact-string filter above misses these because rendered.txt spells the
    // title with the entities and the site-name suffix the JSON-LD does not
    // ("Don&#8217;t ... | Katy TX Dentist", ", Katy"). Compared on letters
    // only, and only against the head, so a real mid-article heading that
    // happens to echo the title survives.
    const norm = (s) => s.replace(/<[^>]+>/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "");
    const titleish = norm(`${p.title} ${p.seoTitle}`);
    while (
      blocks.length > 1 &&
      blocks[0].startsWith("<h2>") &&
      norm(blocks[0]).length > 2 &&
      titleish.includes(norm(blocks[0]))
    ) blocks.shift();

    bodies.set(p.slug, blocks);
  }
}

// ---- the author box and the contact block --------------------------------
// The theme prints the doctor's biography around the article -- above it on
// most posts, below it on 28 others -- so the article opens (or closes) by
// describing Dr. Cho rather than the subject. Neither is removed by pattern:
// an article may legitimately open "Dr. Dave Cho explains ...". They are
// removed by REPETITION -- a paragraph that opens or closes two different
// articles VERBATIM is furniture, whatever it says. Two articles do not write
// the same 60-word paragraph by accident.
//
// Repeated until neither end is shared any more, because some posts stack a
// bio, a tag list and a contact block.
{
  const trim = (end) => {
    let dropped = 0;
    for (let pass = 0; pass < 6; pass++) {
      const at = (b) => (end === "head" ? b[0] : b[b.length - 1]);
      const freq = new Map();
      for (const blocks of bodies.values()) {
        if (blocks.length < 2) continue;
        freq.set(at(blocks), (freq.get(at(blocks)) ?? 0) + 1);
      }
      let cut = 0;
      for (const blocks of bodies.values()) {
        if (blocks.length > 1 && (freq.get(at(blocks)) ?? 0) >= 2) {
          if (end === "head") blocks.shift(); else blocks.pop();
          cut++;
        }
      }
      dropped += cut;
      if (!cut) break;
    }
    return dropped;
  };
  const head = trim("head");
  const tail = trim("tail");
  if (WANT_BODIES) {
    for (const [slug, blocks] of bodies) {
      fs.writeFileSync(path.join(OUT, "bodies", slug + ".html"), blocks.join("\n"));
    }
  }
  console.log(`repeated blocks dropped: ${head} from the head, ${tail} from the tail`);
}

// ---- the card summary ----------------------------------------------------
// NOT the meta description. Yoast's descriptions repeat -- 26 of the 161 share
// one with another post, eighteen of them word for word, and three implant
// articles all carry a blurb about Invisalign -- so a grid of cards built on
// them shows the same sentence eighteen times next to three different
// headlines. The article's own opening is unique by construction and is the
// article's own words. `description` is left exactly as the practice wrote it,
// because that is what goes in the <meta> tag.
for (const p of posts) {
  const first = ((bodies.get(p.slug) ?? []).join("\n").match(/<p>([\s\S]*?)<\/p>/) || [])[1] ?? "";
  const text = first.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  if (text.length < 60) { p.excerpt = p.description; continue; }
  if (text.length <= 200) { p.excerpt = text; continue; }
  const cut = text.slice(0, 200);
  const stop = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("? "), cut.lastIndexOf("! "));
  p.excerpt = stop > 90 ? cut.slice(0, stop + 1) : cut.replace(/\s+\S*$/, "") + "…";
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
