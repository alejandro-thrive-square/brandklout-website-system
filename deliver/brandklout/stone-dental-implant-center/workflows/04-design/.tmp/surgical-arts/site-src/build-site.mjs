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
import { TREATMENTS, CATEGORIES } from "./treatments-data.mjs";

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
   `nav` is the navbar item to mark as current. `photoHero` is true only where
   the navbar sits over a photograph and therefore starts transparent. `cta`
   false suppresses the shared closing band on pages that already end in one. */
const PAGES = [
  { slug: "index", src: "home", nav: null, photoHero: false, motion: true },
  { slug: "treatments", src: "treatments", nav: "TREATMENTS" },
  { slug: "memberships", src: "memberships", nav: "MEMBERSHIPS" },
  { slug: "results", src: "results", nav: "RESULTS" },
  { slug: "about", src: "about", nav: "ABOUT" },
  { slug: "book", src: "book", nav: "BOOK", cta: false },
  /* The twelve flagship treatment pages are DERIVED from the collection in
     treatments-data.mjs rather than listed here, so adding a treatment is one
     edit rather than three. Their bodies are rendered by render-treatments.mjs.
     `treatment-detail` was the single shared page all four categories linked
     to; it is now myellevate-neck-lift, one page among twelve. */
  ...TREATMENTS.map((t) => ({ slug: t.slug, src: t.slug, nav: "TREATMENTS" })),
];

const NAV_KEYS = ["TREATMENTS", "RESULTS", "MEMBERSHIPS", "ABOUT", "BOOK"];

/* --- the treatments menus -------------------------------------------------
   Until 2026-08-31 the dropdown listed the four CATEGORIES, each pointing at a
   tab anchor on the hub, because categories were all that existed. Twelve
   treatment pages later that menu was the only place on the site that had not
   noticed, and the client said so: "each of the drop down links should go to
   their corresponding page."

   Both menus are generated from the same collection as the pages themselves,
   so a treatment cannot exist without appearing in the nav. The category
   HEADING still points at the hub tab, which is genuinely the category's index;
   the items under it point at pages. */
const CATEGORY_ORDER = ["face", "neck", "skin", "nonsurgical"];

function grouped() {
  return CATEGORY_ORDER.map((key) => ({
    key,
    cat: CATEGORIES[key],
    items: TREATMENTS.filter((t) => t.category === key),
  })).filter((g) => g.items.length);
}

function treatmentMenu() {
  const cols = grouped()
    .map(
      (g) => `              <li class="navbar_mega-group">
                <a class="navbar_mega-heading" href="treatments.html#${g.cat.anchor}">${g.cat.label}</a>
                <ul class="navbar_mega-sublist">
${g.items
  .map(
    (t) =>
      `                  <li><a class="navbar_dropdown-link" href="${t.slug}.html">${t.name}</a></li>`
  )
  .join("\n")}
                </ul>
              </li>`
    )
    .join("\n");

  return `<ul class="navbar_dropdown-list is-mega">
${cols}
              <li class="navbar_mega-all"><a class="navbar_dropdown-link" href="treatments.html">All treatments &amp; fees <span aria-hidden="true">&rarr;</span></a></li>
            </ul>`;
}

/* The hub's card grid, one per tab pane.
   Client feedback 2026-08-31: "the details page is not outstanding so the users
   will not know how to navigate." True. The only route to a treatment page was
   a "see the detail page" link inside a fee row's small print, which nobody
   reads a price table looking for. Each pane now opens with a grid of clickable
   cards, one per page in that category, and the FULL fee table stays underneath
   it. The grid is navigation; the table is still the complete price list, which
   is what the page is for and what people came to see. */
function treatmentCards(key) {
  const g = grouped().find((x) => x.key === key);
  if (!g) return "";
  const cards = g.items
    .map(
      (t) => `            <a class="treatment-card_component" href="${t.slug}.html">
              <h3 class="treatment-card_name">${t.name}</h3>
              <p class="treatment-card_text">${t.heroSub}</p>
              <div class="treatment-card_foot"><span class="treatment-card_price">${t.cardPrice}</span><span class="button is-link">Details</span></div>
            </a>`
    )
    .join("\n");

  return `<div class="treatment-grid_component margin-bottom margin-large" data-reveal="stagger">
${cards}
          </div>`;
}

function treatmentDrawer() {
  return grouped()
    .map(
      (g) => `      <p class="drawer_subheading"><a href="treatments.html#${g.cat.anchor}">${g.cat.label}</a></p>
      <ul class="drawer_sublist">
${g.items
  .map((t) => `        <li><a class="drawer_sublink" href="${t.slug}.html">${t.name}</a></li>`)
  .join("\n")}
      </ul>`
    )
    .join("\n");
}

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
   SEPARATE asset rather than folded into site.js. site.js ships to all
   eighteen pages; this is ~125KB and, for now, only the home page's journey
   chapters use it. A page opts in with `motion: true` in the table above and
   gets one extra <script> before site.js; every other page is byte-for-byte
   what it was.

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
  let body = read(`pages/${page.src}.body.html`);
  // The hub's four panes each open with a card grid generated from the
  // collection. Only treatments.body.html carries these tokens; the replace is
  // a no-op everywhere else, and the stray-token check at the end of this file
  // catches it if a pane is ever renamed out from under them.
  body = body
    .replace("{{TREATMENT_CARDS_FACE}}", () => treatmentCards("face"))
    .replace("{{TREATMENT_CARDS_NECK}}", () => treatmentCards("neck"))
    .replace("{{TREATMENT_CARDS_SKIN}}", () => treatmentCards("skin"))
    .replace("{{TREATMENT_CARDS_NONSURGICAL}}", () => treatmentCards("nonsurgical"));

  let nav = navbar
    .replace("{{NAV_MODE}}", page.photoHero ? "" : " is-static")
    .replace("{{TREATMENT_MENU}}", treatmentMenu());
  for (const key of NAV_KEYS) {
    nav = nav.replace(`{{CUR_${key}}}`, page.nav === key ? ' aria-current="page"' : "");
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
${head.replace("{{SEO}}", seoBlock(page.slug))}
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
<div class="page-wrapper">
${nav}
${drawer.replace("{{TREATMENT_DRAWER}}", treatmentDrawer())}
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
