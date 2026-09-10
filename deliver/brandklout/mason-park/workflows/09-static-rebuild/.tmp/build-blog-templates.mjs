// ===========================================================================
// BUILD THE TWO CMS PAGES THE BLOG NEEDS, AS INSTATIC IMPORT PAYLOADS.
//
//   node build-blog-templates.mjs
//     -> instatic/pages-templates/blog-article.json   the entry TEMPLATE
//     -> instatic/pages-templates/blog.json           the collection listing
//
// The 161 articles live in the `Articles` data table, not as pages. Two pages
// render them:
//
//   /blog/<slug>   ONE page, marked `templateEnabled` and targeting the
//                  `articles` post type. Instatic matches every entry route to
//                  it and renders the row through it. Its slug (`blog-article`)
//                  is never visited directly.
//   /blog          the listing, a `base.loop` over the same table.
//
// HOW THE DYNAMIC BITS GET IN. Rather than hand-building node graphs, the two
// pages start as REAL HTML -- lifted from the static build so the chrome,
// classes and images are identical to every other page -- with two kinds of
// marker in them, and the markers are resolved after Instatic's own HTML
// importer has produced the nodes:
//
//   {currentEntry.title}   a TOKEN. Needs no post-processing at all: the
//                          publisher interpolates `{source.field}` inside any
//                          string prop at render time. So the title, topic and
//                          date are written straight into the HTML.
//   @@OUTLET@@             a marker element, swapped for a `base.outlet` node.
//                          An outlet carries an implicit binding to the
//                          current entry's body and renders its markdown.
//   @@LOOP …@@             a marker element, swapped for a `base.loop` node
//                          configured against the Articles table.
//
// That keeps the visual work in HTML and CSS, where it is reviewable, and
// limits the node surgery to three well-defined substitutions.
// ===========================================================================
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(HERE, "instatic", "pages-blog-cms");
const OUT = path.join(HERE, "instatic", "pages-templates");
fs.mkdirSync(OUT, { recursive: true });

const read = (f) => JSON.parse(fs.readFileSync(path.join(SRC, f), "utf8"));

// A sample article page and the listing page, already converted by
// to-instatic.mjs: chrome inlined, `/uploads/<id>-…` media paths resolved.
const sampleName = fs.readdirSync(SRC).find((f) => f.startsWith("blog__") && !f.includes("__page__"));
const article = read(sampleName);
const listing = read("blog.json");

// ---------------------------------------------------------------------------
// 1. The entry template
// ---------------------------------------------------------------------------
let html = article.html;

const replaceOnce = (haystack, needle, next, what) => {
  const i = haystack.indexOf(needle);
  if (i < 0) throw new Error(`template: could not find ${what}`);
  if (haystack.indexOf(needle, i + 1) >= 0) throw new Error(`template: ${what} is not unique`);
  return haystack.slice(0, i) + next + haystack.slice(i + needle.length);
};

// The topic tag, the headline and the date line, as tokens.
html = replaceOnce(html,
  '<p class="chapter-tag"><i></i><b>General</b></p>',
  '<p class="chapter-tag"><i></i><b>{currentEntry.topic}</b></p>',
  "the topic tag");
html = replaceOnce(html,
  `<h1 class="ar-title" data-split>${article.title.replace(/\s*[-–|]\s*Dentist Katy\s*$/i, "")}</h1>`,
  '<h1 class="ar-title" data-split>{currentEntry.title}</h1>',
  "the headline");

// The lede is the byline and the date. `dateIso` feeds <time datetime>, which
// is an ATTRIBUTE -- tokens interpolate there too, through htmlAttributes.
const ledeStart = html.indexOf('<p class="ar-lede"');
const ledeEnd = html.indexOf("</p>", ledeStart) + 4;
if (ledeStart < 0) throw new Error("template: could not find the lede");
html = html.slice(0, ledeStart)
  + '<p class="ar-lede" data-anim="hide">Mason Park Dental of Katy &middot; '
  + '<time datetime="{currentEntry.dateIso}">{currentEntry.dateDisplay}</time></p>'
  + html.slice(ledeEnd);

// The last breadcrumb is the article's own title.
html = replaceOnce(html,
  `<span class="breadcrumb_item">${esc(article.title.replace(/\s*[-–|]\s*Dentist Katy\s*$/i, ""))}</span>`,
  '<span class="breadcrumb_item">{currentEntry.title}</span>',
  "the breadcrumb leaf");

// The body itself: the .lf-body element BECOMES the outlet. The marker goes on
// that element rather than on a wrapper inside it, because the prose rhythm is
// `.text-rich-text > * + *` -- a DIRECT child selector. An extra wrapper makes
// every paragraph a grandchild, the rule stops matching, and a 200-word
// article renders as one unbroken block with no paragraph breaks at all. The
// same trap is documented at `.lf-section > * + *` in site.css, which exists
// because it was hit once already.
{
  const open = html.indexOf('<div class="lf-body text-rich-text">');
  if (open < 0) throw new Error("template: could not find the article body");
  const close = html.indexOf("</div>", open) + 6;
  html = html.slice(0, open)
    + '<div class="lf-body text-rich-text" id="@@OUTLET@@"></div>'
    + html.slice(close);
}

// The related-articles ledger. On a static page these are three hand-picked
// slugs; on a template there is no such thing, so it becomes a loop of the
// three most recent articles. The loop's own children are the <li>s.
{
  const open = html.indexOf('<ul class="svc-ledger">');
  if (open < 0) throw new Error("template: could not find the related list");
  const close = html.indexOf("</ul>", open) + 5;
  html = html.slice(0, open)
    + '<ul class="svc-ledger" id="@@LOOP:recent:3@@">'
    + '<li><b>Read</b><span><a href="{currentEntry.permalink}">{currentEntry.title}</a></span></li>'
    + "</ul>"
    + html.slice(close);
}

fs.writeFileSync(path.join(OUT, "blog-article.json"), JSON.stringify({
  // Never visited directly -- Instatic routes /blog/<slug> to it because it is
  // the template that targets the `articles` post type.
  slug: "/blog-article",
  title: "{currentEntry.title}",
  description: "",
  bodyClass: article.bodyClass,
  html,
}, null, 2));

// ---------------------------------------------------------------------------
// 2. The collection listing
// ---------------------------------------------------------------------------
let index = listing.html;

// Every card becomes ONE card inside a loop. `pagination: infinite` because
// Instatic has no numeric paginator module yet -- the seven static
// /blog/page/N routes have no CMS equivalent and are dropped.
{
  const open = index.indexOf('<ul class="bl-grid">');
  if (open < 0) throw new Error("listing: could not find the card grid");
  const close = index.indexOf("</ul>", open) + 5;
  index = index.slice(0, open)
    + '<ul class="bl-grid" id="@@LOOP:all:24@@">'
    + '<li class="bl-card">'
    + '<a class="bl-card_link" href="{currentEntry.permalink}">'
    + '<span class="bl-card_meta"><b>{currentEntry.topic}</b>'
    + '<time datetime="{currentEntry.dateIso}">{currentEntry.dateDisplay}</time></span>'
    + '<h3 class="bl-card_title">{currentEntry.title}</h3>'
    + '<p class="bl-card_text">{currentEntry.excerpt}</p>'
    + '<span class="bl-card_more" aria-hidden="true">Read &rarr;</span>'
    + "</a></li>"
    + "</ul>"
    + index.slice(close);
}

// The numeric pager goes with the static pages it addressed.
{
  const open = index.indexOf('<nav class="bl-pager"');
  if (open >= 0) {
    const close = index.indexOf("</nav>", open) + 6;
    index = index.slice(0, open) + index.slice(close);
  }
}

fs.writeFileSync(path.join(OUT, "blog.json"), JSON.stringify({
  slug: "/blog",
  title: listing.title,
  description: listing.description,
  bodyClass: listing.bodyClass,
  html: index,
}, null, 2));

function esc(s) {
  return String(s).replace(/&(?!#?\w+;)/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

console.log(`article template from ${sampleName}`);
for (const f of ["blog-article.json", "blog.json"]) {
  const p = JSON.parse(fs.readFileSync(path.join(OUT, f), "utf8"));
  const tokens = [...p.html.matchAll(/\{currentEntry\.(\w+)\}/g)].map((m) => m[1]);
  const markers = [...p.html.matchAll(/@@[A-Z]+(?::[a-z]+:\d+)?@@/g)].map((m) => m[0]);
  console.log(`  ${f.padEnd(20)} ${(p.html.length / 1024).toFixed(0)} KB  tokens: ${[...new Set(tokens)].join(",") || "-"}  markers: ${markers.join(",") || "-"}`);
}
console.log("\nship with:  node ship-payload.mjs --dir pages-templates");
