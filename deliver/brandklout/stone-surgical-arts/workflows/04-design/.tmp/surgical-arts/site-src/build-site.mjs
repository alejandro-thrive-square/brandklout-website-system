// Assembles the Stone Surgical Arts site into ../final-site.
//
// Same shape as the Dr. Nahlah build, deliberately, so the two Instatic sites
// are maintained the same way:
//
//   partials/           the shell — head, navbar, drawer, cta, footer. One copy,
//                       so no page can drift from another.
//   pages/*.body.html   MARKUP ONLY. No <style>, no <script>.
//   css/*.css           one file per concern, concatenated in FILENAME ORDER
//                       into assets/site.css. Filename order IS cascade order.
//   js/*.js             concatenated the same way into assets/site.js.
//   seo.json            title, description, canonical, Open Graph and JSON-LD
//                       per page. The head partial carries none of it.
//
// The point of bundling rather than inlining per section: a section becomes just
// markup. Move a <section> from one page to another and its styling and
// behaviour follow, because every page already carries the whole vocabulary and
// each JS module guards on its own selector.
//
// Usage: node build-site.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SRC = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(SRC, "..", "final-site");
const read = (p) => fs.readFileSync(path.join(SRC, p), "utf8");

const seo = JSON.parse(read("seo.json"));
const head = read("partials/head.html");
const navbar = read("partials/navbar.html");
const drawer = read("partials/drawer.html");
const cta = read("partials/cta.html");
const footer = read("partials/footer.html");

/* --- the page table -------------------------------------------------------
   TWO PAGES, since 2026-09-01. The client kept the home page and nothing else,
   so the other seventeen bodies, their seo.json entries and the collection in
   treatments-data.mjs were deleted. The neck lift is the FIRST ONE BACK, and it
   is back rewritten rather than recovered: the deleted seventeen were v1 pages,
   and v1 is the design the client rejected. It is here to answer one question
   before the other eleven treatments follow it, which is whether the journey
   system works on a page that has to sell a procedure. See
   pages/neck-lift.body.html, which opens with why.

   Adding the second page cost exactly what the table's shape promised it would:
   one row, one body, one seo entry. Nothing in the build changed except
   `schema` learning to take an array.

   `photoHero` is true only where the navbar sits over a photograph and
   therefore starts transparent. `cta` false suppresses the shared closing band
   on a page that already ends in one. The two pages differ on both flags and on
   `motion`, which is the shape of the 2026-09-01 rebuild: they are not the same
   page with different words in it. */
const PAGES = [
  { slug: "index", src: "home", photoHero: false, motion: true },
  // photoHero TRUE: this page opens on a full-bleed photograph and the navbar
  // sits over it, so the bar starts transparent and goes solid on scroll. That
  // is what the flag was built for and the home page has never used it.
  // motion TRUE since 2026-09-01 evening: the elevation layer (js/12-elevate.js)
  // parallaxes every frame and drifts the ghost words with ScrollTrigger, and
  // the client's brief is animation on every page. It was false while the
  // dossier ran without GSAP; on Instatic the vendor bundle is shipped to every
  // page regardless (trap 17), so the split only ever saved bytes locally.
  // cta FALSE: it closes on its own booking chapter; the shared band would be a
  // second "book a consultation" immediately after the first.
  { slug: "neck-lift", src: "neck-lift", photoHero: true, motion: true, cta: false },
  // THE THIRD PAGE, 2026-09-01. Same three flags as the neck lift and for the
  // same three reasons, which is the finding: a second dossier page is a row
  // here and a body file, and it needed no new flag, no new stylesheet and no
  // new JS module. What it did need was two hard-coded strings moved out of
  // js/11-dossier.js and into the markup, because they were about necks.
  { slug: "blepharoplasty", src: "blepharoplasty", photoHero: true, motion: true, cta: false },
  { slug: "treatments", src: "treatments", photoHero: false, motion: true },
  { slug: "meet-the-doctor", src: "meet-the-doctor", photoHero: false, motion: true },
  { slug: "about", src: "about", photoHero: true, motion: true },
  { slug: "team", src: "team", photoHero: true, motion: true },
  { slug: "memberships", src: "memberships", photoHero: false, motion: true },
  { slug: "results", src: "results", photoHero: false, motion: true },
  { slug: "book", src: "book", photoHero: true, motion: true, cta: false },
  { slug: "myellevate-neck-lift", src: "myellevate-neck-lift", photoHero: true, motion: true, cta: false },
  { slug: "face-and-neck-lift", src: "face-and-neck-lift", photoHero: true, motion: true, cta: false },
];

/* --- bundles --------------------------------------------------------------
   A banner per file so the assembled output is still readable and a rule can be
   traced back to the component that owns it. */
function bundle(dir, ext) {
  const abs = path.join(SRC, dir);
  const files = fs
    .readdirSync(abs)
    .filter((n) => n.endsWith(ext))
    .sort();
  return files
    .map((f) => `/* ===== ${dir}/${f} ===== */\n${fs.readFileSync(path.join(abs, f), "utf8")}`)
    .join("\n\n");
}

/* --- SEO ------------------------------------------------------------------ */
const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function seoBlock(slug) {
  const d = seo.pages[slug];
  if (!d) throw new Error(`seo.json has no entry for "${slug}"`);
  const url = seo.site.origin + (slug === "index" ? "/" : `/${slug}`);
  const image = seo.site.origin + seo.site.ogImage;
  const out = [
    `<title>${esc(d.title)}</title>`,
    `<meta name="description" content="${esc(d.description)}">`,
    `<link rel="canonical" href="${url}">`,
    `<meta property="og:site_name" content="${esc(seo.site.name)}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:title" content="${esc(d.ogTitle || d.title)}">`,
    `<meta property="og:description" content="${esc(d.ogDescription || d.description)}">`,
    `<meta property="og:image" content="${image}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${esc(d.ogTitle || d.title)}">`,
    `<meta name="twitter:description" content="${esc(d.ogDescription || d.description)}">`,
  ];
  // Every page carries the practice graph; a page may add its own node, or
  // several. The neck lift page adds two — a MedicalProcedure and an FAQPage —
  // which is why `schema` accepts an array as well as a single node. It used to
  // take only one, and the deleted service pages got their FAQPage bolted on
  // afterwards by a separate script (add-faq-schema.py). One shape in seo.json
  // is better than a post-processing pass over the built HTML.
  const own = d.schema ? (Array.isArray(d.schema) ? d.schema : [d.schema]) : [];
  const graph = [seo.organization].concat(own);
  out.push(
    `<script type="application/ld+json">\n${JSON.stringify(
      { "@context": "https://schema.org", "@graph": graph },
      null,
      2
    )}\n</script>`
  );
  return out.join("\n");
}

/* --- assemble ------------------------------------------------------------- */
fs.mkdirSync(path.join(OUT, "assets"), { recursive: true });
fs.writeFileSync(path.join(OUT, "assets", "site.css"), bundle("css", ".css"), "utf8");
fs.writeFileSync(path.join(OUT, "assets", "site.js"), bundle("js", ".js"), "utf8");

/* --- the motion vendor bundle ---------------------------------------------
   GSAP + ScrollTrigger + SplitText, vendored from js/vendor/ and emitted as a
   SEPARATE asset rather than folded into site.js. It is ~125KB and only the
   home page's journey chapters use it. A page opts in with `motion: true` in
   the table above and gets one extra <script> before site.js; a page that does
   not is byte-for-byte what it was. Kept split now that home is the only page,
   because the split is what makes adding a still page cheap.

   Both tags are `defer`, so they execute in document order and 10-journey.js
   can rely on window.gsap already existing. It still guards on it: an ad
   blocker or a stale cache that drops one file must degrade to a still page,
   not a broken one. */
const VENDOR = path.join(SRC, "js", "vendor");
const vendorFiles = fs
  .readdirSync(VENDOR)
  .filter((n) => n.endsWith(".js"))
  .sort();
fs.writeFileSync(
  path.join(OUT, "assets", "vendor.js"),
  vendorFiles
    .map((f) => `/* ===== js/vendor/${f} ===== */\n${fs.readFileSync(path.join(VENDOR, f), "utf8")}`)
    .join("\n\n"),
  "utf8"
);

// Copy the image assets across. The contact sheet is a build-time aid, not part
// of the site, so it is skipped.
//
// Directories are recursed rather than skipped: assets/fonts/ holds the
// self-hosted typefaces, and copyFileSync on a directory throws rather than
// quietly doing nothing, so this had to grow a branch the moment the fonts
// stopped coming from Google.
for (const f of fs.readdirSync(path.join(SRC, "assets"))) {
  if (f.startsWith("_")) continue;
  const from = path.join(SRC, "assets", f);
  const to = path.join(OUT, "assets", f);
  if (fs.statSync(from).isDirectory()) fs.cpSync(from, to, { recursive: true });
  else fs.copyFileSync(from, to);
}

// Every navbar, drawer and footer link to "#contact" has to land somewhere on
// every page. The home page and the dossiers carry their own booking chapter
// with that id; any page that does not gets it on the shared closing band,
// which is the one section that exists everywhere. 2026-09-02.
const built = [];
for (const page of PAGES) {
  const body = read(`pages/${page.src}.body.html`);
  // `aria-current="page"` rather than a class, in both the bar and the drawer.
  // 20-navbar.css already styles the attribute selector, so the marker is
  // meaningful to a screen reader first and visible second.
  // `{{CUR_<SLUG>}}` expands to `aria-current="page"` on that page and to
  // nothing everywhere else. It was a single `{{CUR_NECK}}` while there was one
  // treatment link; a second link on 2026-09-01 made the token generic rather
  // than adding `{{CUR_BLEPH}}` beside it, because that road ends with twelve
  // of them. `CUR_NECK_LIFT` -> `neck-lift`: underscores become hyphens.
  const cur = (s) =>
    s.replace(/\{\{CUR_([A-Z0-9_]+)\}\}/g, (_, key) =>
      key.toLowerCase().replace(/_/g, "-") === page.slug ? ' aria-current="page"' : ""
    );
  const nav = cur(navbar).replace("{{NAV_MODE}}", page.photoHero ? "" : " is-static");
  const drawerHtml = cur(drawer);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
${head.replace("{{SEO}}", seoBlock(page.slug))}
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
<div class="page-wrapper">
${nav}
${drawerHtml}
<main class="main-wrapper" id="main">
${body}
${page.cta === false ? "" : body.includes('id="contact"') ? cta : cta.replace('<section class="section_cta cta_component"', '<section class="section_cta cta_component" id="contact"')}
</main>
${cur(footer)}
</div>
${page.motion ? '<script src="assets/vendor.js" defer></script>\n' : ""}<script src="assets/site.js" defer></script>
</body>
</html>
`;

  fs.writeFileSync(path.join(OUT, `${page.slug}.html`), html, "utf8");
  built.push(`${page.slug}.html  ${(html.length / 1024).toFixed(1)}KB`);
}

// A leftover {{TOKEN}} means a partial and this table disagree. Fail loudly
// rather than shipping a page with a placeholder in it.
for (const page of PAGES) {
  const html = fs.readFileSync(path.join(OUT, `${page.slug}.html`), "utf8");
  const stray = html.match(/\{\{[A-Z_]+\}\}/g);
  if (stray) {
    console.error(`UNRESOLVED in ${page.slug}.html: ${[...new Set(stray)].join(", ")}`);
    process.exitCode = 1;
  }
}

console.log(built.join("\n"));
console.log(`\nsite.css  ${(fs.statSync(path.join(OUT, "assets", "site.css")).size / 1024).toFixed(1)}KB`);
console.log(`site.js   ${(fs.statSync(path.join(OUT, "assets", "site.js")).size / 1024).toFixed(1)}KB`);
console.log(`vendor.js ${(fs.statSync(path.join(OUT, "assets", "vendor.js")).size / 1024).toFixed(1)}KB  (${vendorFiles.length} files, loaded only where motion: true)`);
