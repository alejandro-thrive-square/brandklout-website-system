// Assembles every page in the site, plus the two bundles every page loads.
//
// Three kinds of source, and the split is deliberate:
//
//   partials/     the shell — head, nav, drawer, footer — so no page can drift
//   pages/*.body.html   MARKUP ONLY. No <style>, no <script>.
//   css/*.css     one file per component, concatenated in filename order into
//                 assets/site.css. Filename order IS cascade order.
//   js/*.js       the runtime (00), the kit behaviour (20) and the boot
//                 sequence (90-91)
//   sections/*.js one file per section, each registering itself with
//                 WZ.section(name, fn) and running only if that section is on
//                 the page
//
// The point of the two bundles: a section is now just markup. Move a
// `<section>` from one page to another and its styling and behaviour follow it,
// because every page already carries the whole vocabulary and each module
// guards on its own selector. The old build inlined a <style> and a <script>
// beside every section, so moving one meant moving three things and the rules
// were re-emitted into all 26 pages.
//
// Usage: node build-site.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SRC = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(SRC, "..", "final-site");
const read = (p) => fs.readFileSync(path.join(SRC, p), "utf8");

// SEO, Open Graph and JSON-LD live in data, not in this table. They mirror what
// the Webflow Designer carries for each page, so the two stay in step: when the
// site changes there, re-sync seo.json rather than editing the head partial.
const seo = JSON.parse(read("seo.json"));

const head = read("partials/head.html");
const nav = read("partials/nav.html");
const drawer = read("partials/drawer.html");
const footer = read("partials/footer.html");
const pagekit = read("partials/pagekit.html");

/* ---------------------------------------------------------------------------
   The two bundles.

   Concatenated in filename order, with a banner per file so the assembled
   output can still be read and a rule traced back to the component that owns
   it. Order is load-bearing in both:

   - site.css   cascade order. 00 root, 01 tokens, 02 base, 10-12 chrome,
                20 kit, 30-38 chapters, 50-59 single-page overrides.
   - site.js    the runtime has to define WZ before any section registers, and
                the boot sequence has to run after all of them, because it is
                what creates ScrollSmoother and then flushes the queue.
   --------------------------------------------------------------------------- */
function bundle(dirs, ext) {
  const parts = [];
  for (const dir of dirs) {
    const abs = path.join(SRC, dir);
    if (!fs.existsSync(abs)) continue;
    for (const f of fs.readdirSync(abs).filter((n) => n.endsWith(ext)).sort()) {
      parts.push(`/* ===== ${dir}/${f} ===== */\n` + fs.readFileSync(path.join(abs, f), "utf8").replace(/\s*$/, "") + "\n");
    }
  }
  return parts.join("\n");
}

const ASSETS = path.join(OUT, "assets");
fs.mkdirSync(ASSETS, { recursive: true });

const siteCss = bundle(["css"], ".css");
// sections/ sits between the runtime and the boot sequence: 00-runtime defines
// WZ.section, the section modules call it, and 90-boot flushes what they queued.
const runtimeJs = bundle(["js"], ".js");
const sectionJs = bundle(["sections"], ".js");
const boot = runtimeJs.indexOf("/* ===== js/90-boot.js ===== */");
if (boot === -1) throw new Error("js/90-boot.js missing — nothing would flush the section queue");
const siteJs = runtimeJs.slice(0, boot) + sectionJs + "\n" + runtimeJs.slice(boot);

fs.writeFileSync(path.join(ASSETS, "site.css"), siteCss);
fs.writeFileSync(path.join(ASSETS, "site.js"), siteJs);

const CHAPTER_READOUT = `<div class="nav-chapter" aria-hidden="true">
        <span>Chapter</span><b id="navCh">00</b><i id="navBar"></i><span id="navName">Arrival</span>
      </div>`;

// nav-links key -> which page is "current"
const NAVKEYS = ["IMPLANTS", "COSMETIC", "GALLERY", "ABOUT", "CONTACT", "JOURNAL"];

const PAGES = [
  { slug: "index", body: "home", journey: 1, navKey: null },
  { slug: "dental-implants", journey: 0, navKey: "IMPLANTS" },
  { slug: "all-on-4", journey: 0, navKey: "IMPLANTS" },
  { slug: "implant-cost", journey: 0, navKey: "IMPLANTS" },
  { slug: "sedation-dentistry", journey: 0, navKey: "IMPLANTS" },
  { slug: "smile-makeover", journey: 0, navKey: "COSMETIC" },
  { slug: "veneers", journey: 0, navKey: "COSMETIC" },
  { slug: "smile-gallery", journey: 0, navKey: "GALLERY" },
  { slug: "patient-stories", journey: 0, navKey: "GALLERY" },
  // Renamed from `about` on 2026-08-10 to match Webflow, where the page moved to
  // /meet-dr-nahlah. That freed the /about slug for the separate office-overview
  // page the client asked for — built out below.
  { slug: "meet-dr-nahlah", journey: 0, navKey: "ABOUT" },
  // /contact is the CHOOSER. The Webflow build split the contact page one-per-
  // office on 2026-08-24 because each office has its own LeadConnector form, so
  // the pre-split slug is kept alive here — sitewide nav, footer, drawer and the
  // Book a Consult CTA all point at it, and Instatic has no redirect tool. Same
  // treatment as privacy-policy / terms-conditions below.
  { slug: "contact", journey: 0, navKey: "CONTACT" },
  { slug: "contact-maclean", journey: 0, navKey: "CONTACT" },
  { slug: "contact-alexandria", journey: 0, navKey: "CONTACT" },
  // The blog index. 43 migrated WordPress posts live under /posts/<slug>; the
  // slug here has to stay "posts" because that is what all 43 of them and the
  // 117 redirect rules already point at.
  { slug: "posts", journey: 0, navKey: "JOURNAL" },
  // The article layout. On Instatic this page IS the postTypes template: its
  // .bl-body is swapped for an <instatic-outlet> by build-post-template.mjs.
  // Locally it renders one real article so the design is gated like any page.
  { slug: "post", journey: 0, navKey: "JOURNAL" },

  // ---- Build-out from the old site's own IA (2026-08-10). The 33-page
  // WordPress site's primary nav is captured verbatim in the scrape, and these
  // pages restore the groups it had that the eleven-page package dropped.
  // NOTE: these do NOT exist in Webflow yet, so webflow-parity.mjs deliberately
  // still gates on the original eleven only.
  // -- Who We Are
  { slug: "about", journey: 0, navKey: "ABOUT" },
  { slug: "our-team", journey: 0, navKey: "ABOUT" },
  { slug: "our-facility", journey: 0, navKey: "ABOUT" },
  // -- Aesthetics
  { slug: "cosmetic-dentistry", journey: 0, navKey: "COSMETIC" },
  { slug: "teeth-whitening", journey: 0, navKey: "COSMETIC" },
  { slug: "crowns-and-bridges", journey: 0, navKey: "COSMETIC" },
  // -- Treatments
  { slug: "oral-surgery", journey: 0, navKey: "IMPLANTS" },
  { slug: "emergency-dentistry", journey: 0, navKey: "IMPLANTS" },
  { slug: "dental-conditions", journey: 0, navKey: "IMPLANTS" },
  // -- Dental Implants (the rest of that group)
  { slug: "implant-supported-dentures", journey: 0, navKey: "IMPLANTS" },
  { slug: "dental-implant-faq", journey: 0, navKey: "IMPLANTS" },
  // -- What To Expect / For Doctors / legal
  { slug: "patient-center", journey: 0, navKey: "ABOUT" },
  { slug: "financing", journey: 0, navKey: "ABOUT" },
  { slug: "doctor-referral", journey: 0, navKey: "ABOUT" },
  // `tysons-study-club` was the planned fifteenth page. Its source is entirely
  // Lorem Ipsum on the client's live site, so there is nothing to rebuild from
  // and privacy-policy took the slot. See SITE.md.
  // The client's counsel rewrote both documents on the Webflow build (effective
  // 18 Aug 2026) and they are PER ENTITY: McLean trades as Esam Abou Nahlah,
  // DDS, MS, PLLC and Alexandria as Implants And Prosthodontics Specialists,
  // PLLC. Four pages, therefore, not two. The old WordPress terms-conditions
  // and privacy-policy are superseded and retired; both slugs need a 301 to
  // their McLean replacement. Bodies are written by gen-legal.mjs.
  // The old site's /video-gallery/, rebuilt and renamed. Fourteen films that
  // were only ever reachable from a page headed with another practice's name.
  { slug: "video-library", journey: 0, navKey: null },
  // The pre-split slugs, kept alive as choosers rather than deleted: they are
  // what inbound links point at, and Instatic has no redirect tool.
  { slug: "privacy-policy", journey: 0, navKey: null },
  { slug: "terms-conditions", journey: 0, navKey: null },
  { slug: "privacy-policy-maclean", journey: 0, navKey: null },
  { slug: "privacy-policy-alexandria", journey: 0, navKey: null },
  { slug: "terms-of-service-maclean", journey: 0, navKey: null },
  { slug: "terms-of-service-alexandria", journey: 0, navKey: null },
  // The destination for the consultation request. Replaces the old site's two
  // identical survey thank-you pages; noindex, so it never surfaces in search.
  { slug: "thank-you", journey: 0, navKey: null },
];

/* Escape for an HTML text node or a double-quoted attribute. seo.json holds
   plain text, so every entity in the output is produced exactly once, here. */
const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/* The head metadata for one page: title, description, Open Graph, Twitter card
   and JSON-LD, in the same order and with the same fields the published Webflow
   page carries. */
function seoBlock(slug) {
  const m = seo[slug];
  if (!m) throw new Error(`seo.json has no entry for "${slug}"`);
  const lines = [
    `<title>${esc(m.title)}</title>`,
    `<meta name="description" content="${esc(m.desc)}">`,
  ];
  // Only emitted when a page asks for it. A confirmation page has nothing to
  // rank for, and indexing one puts a result in front of searchers telling them
  // their form was submitted when it was not.
  if (m.robots) lines.push(`<meta name="robots" content="${esc(m.robots)}">`);
  lines.push(...[
    `<meta property="og:title" content="${esc(m.ogTitle)}">`,
    `<meta property="og:description" content="${esc(m.ogDesc)}">`,
    `<meta property="og:type" content="website">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${esc(m.ogTitle)}">`,
    `<meta name="twitter:description" content="${esc(m.ogDesc)}">`,
  ]);
  if (m.jsonLd) {
    lines.push(`<script type="application/ld+json">\n${JSON.stringify(m.jsonLd, null, 2)}\n</script>`);
  }
  return lines.join("\n");
}

fs.mkdirSync(OUT, { recursive: true });
let built = 0;
for (const p of PAGES) {
  const bodyFile = `pages/${p.body || p.slug}.body.html`;
  if (!fs.existsSync(path.join(SRC, bodyFile))) {
    console.warn(`SKIP ${p.slug} — no ${bodyFile}`);
    continue;
  }
  const body = read(bodyFile);

  let navHtml = nav
    .replace("{{JOURNEY}}", String(p.journey))
    .replace("{{CHAPTER_READOUT}}", p.journey ? CHAPTER_READOUT : "");
  for (const k of NAVKEYS) {
    navHtml = navHtml.replace(`{{CUR_${k}}}`, p.navKey === k ? ' aria-current="page"' : "");
  }

  const headHtml = head.replace("{{HEAD_SEO}}", seoBlock(p.slug));

  const out = `${headHtml}
<body>

<!-- ==========================================================================
     FIXED UI — outside #smooth-wrapper so ScrollSmoother never transforms it
     ========================================================================== -->
${navHtml}
${drawer}

<div id="smooth-wrapper">
<div id="smooth-content">
<main id="top">
${p.journey ? "" : pagekit}
${body}

</main>

${footer}
</div><!-- /#smooth-content -->
</div><!-- /#smooth-wrapper -->

<!-- The runtime, every section module and the boot sequence, in one file. At the
     end of <body> because ScrollTrigger must be registered after document.body
     exists, and because each section module guards on a selector — it has to be
     able to see the markup to decide whether to run. -->
<script src="assets/site.js"></script>
</body>
</html>
`;
  fs.writeFileSync(path.join(OUT, `${p.slug}.html`), out);
  built++;
}
console.log(`built ${built}/${PAGES.length} pages -> ${path.relative(process.cwd(), OUT)}`);
