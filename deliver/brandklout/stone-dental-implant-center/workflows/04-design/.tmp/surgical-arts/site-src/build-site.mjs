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
   ONE PAGE, since 2026-09-01. The client kept the home page and nothing else,
   so the other seventeen bodies, their seo.json entries and the collection in
   treatments-data.mjs were deleted rather than left to rot. What survives here
   is the shape of the table, not a stub: adding a page is still one row plus a
   body and an seo entry.

   `photoHero` is true only where the navbar sits over a photograph and
   therefore starts transparent. `cta` false suppresses the shared closing band
   on a page that already ends in one. */
const PAGES = [
  { slug: "index", src: "home", photoHero: false, motion: true },
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
  // Every page carries the practice graph; a page may add its own node.
  const graph = [seo.organization].concat(d.schema ? [d.schema] : []);
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

const built = [];
for (const page of PAGES) {
  const body = read(`pages/${page.src}.body.html`);
  const nav = navbar.replace("{{NAV_MODE}}", page.photoHero ? "" : " is-static");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
${head.replace("{{SEO}}", seoBlock(page.slug))}
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
<div class="page-wrapper">
${nav}
${drawer}
<main class="main-wrapper" id="main">
${body}
${page.cta === false ? "" : cta}
</main>
${footer}
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
