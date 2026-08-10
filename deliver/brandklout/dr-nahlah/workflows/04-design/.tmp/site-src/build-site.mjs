// Assembles every page in the site from one shell + one body file per page.
//
// The shell (head tokens, nav, drawer, footer, GSAP flush) lives in partials/ so
// the eleven pages cannot drift apart. Each pages/<slug>.body.html holds only
// <section> elements, each still carrying its own <style> and <script> — the
// self-contained paste units the Webflow build needs.
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
const flush = read("partials/flush.html");
const pagekit = read("partials/pagekit.html");

const CHAPTER_READOUT = `<div class="nav-chapter" aria-hidden="true">
        <span>Chapter</span><b id="navCh">00</b><i id="navBar"></i><span id="navName">Arrival</span>
      </div>`;

// nav-links key -> which page is "current"
const NAVKEYS = ["IMPLANTS", "COSMETIC", "GALLERY", "ABOUT", "CONTACT"];

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
  { slug: "contact", journey: 0, navKey: "CONTACT" },

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
  { slug: "privacy-policy", journey: 0, navKey: null },
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
    `<meta property="og:title" content="${esc(m.ogTitle)}">`,
    `<meta property="og:description" content="${esc(m.ogDesc)}">`,
    `<meta property="og:type" content="website">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${esc(m.ogTitle)}">`,
    `<meta name="twitter:description" content="${esc(m.ogDesc)}">`,
  ];
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

${flush}
</body>
</html>
`;
  fs.writeFileSync(path.join(OUT, `${p.slug}.html`), out);
  built++;
}
console.log(`built ${built}/${PAGES.length} pages -> ${path.relative(process.cwd(), OUT)}`);
