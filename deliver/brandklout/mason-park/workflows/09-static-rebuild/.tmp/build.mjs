// Build the static Mason Park Dental site from the extracted content.
//
//   node build.mjs [--no-assets] [--only substr]
//
// Input : content/<slug>.json  (from extract.mjs)
//         site/pages.mjs       (hand-authored templates for the Elementor pages)
//         theme/site.css, theme/site.js
//         ../../01-content-intake/.tmp/site-scrape/assets/  (the real images)
// Output: dist/  - a flat static site, ready for Instatic.
//
// Only images the built pages actually reference are copied; the crawl holds
// ~2,000 files and most of them belong to blog posts that are out of scope.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { NAV, FOOTER_LINKS, PRACTICE, SERVICE_SLUGS, TEAM_SLUGS } from "./pages.config.mjs";
import { BESPOKE, SKIP, META } from "./site/pages.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CONTENT = path.join(HERE, "content");
const ASSET_SRC = path.resolve(HERE, "../../01-content-intake/.tmp/site-scrape/assets/bestdentistinkatytx.com");
const DIST = path.join(HERE, "dist");

const argv = process.argv.slice(2);
const NO_ASSETS = argv.includes("--no-assets");
const ONLY = argv.includes("--only") ? argv[argv.indexOf("--only") + 1] : null;

const SITE_URL = "https://bestdentistinkatytx.com";
const BUILT = new Date().toISOString().slice(0, 10);

// Fallback meta description for pages the WordPress site never gave one.
const DEFAULT_DESC = (title) =>
  `${title} at Mason Park Dental of Katy - family, cosmetic and pediatric dentistry at 21830 Kingsland Blvd #104A, Katy, TX. Call (281) 769-8878.`;

// ---------------------------------------------------------------- utilities
// Elementor flattened some lists into a single paragraph, leaving sentences run
// together with no space after the full stop. Requiring two lowercase letters
// before the stop keeps initials ("U.S.") and decimals intact.
const fixRunOn = (s) => String(s ?? "").replace(/([a-z]{2})\.(?=[A-Z])/g, "$1. ");

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const read = (slug) => {
  const f = path.join(CONTENT, slug + ".json");
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : null;
};

// slug -> public route. The crawler flattened `/services/x/` to `services-x`.
const routeOf = (slug) => {
  if (slug === "home") return "/";
  if (SERVICE_SLUGS.includes(slug)) return "/services/" + slug.replace(/^services-/, "") + "/";
  if (TEAM_SLUGS.includes(slug)) return "/team/" + slug.replace(/^team-/, "") + "/";
  return "/" + slug + "/";
};

const ALL = fs.readdirSync(CONTENT).filter((f) => f.endsWith(".json") && f !== "_index.json").map((f) => f.slice(0, -5));
const ROUTES = new Map(ALL.map((s) => [routeOf(s), s]));
// The live nav points at a couple of URLs the crawl stored under a different
// slug; map them so the header never links into a 404.
const ALIASES = new Map([
  ["/blog/", null],                 // blog is out of scope for the emergency rebuild
  ["/category/dental-care/", null],
  // Broken on the live WordPress site too - the real pages are /contacts/ and
  // /our-services/, and "david-green" is a leftover from the theme demo whose
  // anchor text on the Invisalign page reads "Dr. William Sung".
  ["/contact/", "/contacts/"],
  ["/services/", "/our-services/"],
  ["/team/david-green/", "/team/dr-sung/"],
  ["/katy-tx-dentist/", "/contacts/"],
]);

const wantedAssets = new Set();
const droppedLinks = new Map();   // href -> count, for the build report
// Images the pages load from a domain that is not the practice's. The crawl did
// not download these, so they cannot be localised from what we have.
const externalImages = new Map();  // host -> Set(url)

// Choose the best on-disk file for a wp-content URL. `-scaled` originals run to
// 2560px and 9MB; prefer the 1536px derivative when WordPress made one.
const assetFile = (webPath) => {
  const rel = webPath.replace(/^\/+/, "").replace(/^wp-content\//, "wp-content/");
  const abs = path.join(ASSET_SRC, rel);
  if (!fs.existsSync(abs)) return null;
  const m = abs.match(/^(.*)-scaled(\.(?:jpe?g|png|webp))$/i);
  if (m) {
    for (const w of ["1536x", "2048x"]) {
      const dir = path.dirname(m[1]);
      const base = path.basename(m[1]);
      const hit = fs.existsSync(dir) && fs.readdirSync(dir)
        .find((f) => f.startsWith(base + "-" + w) && f.endsWith(m[2]));
      if (hit) return path.join(dir, hit);
    }
  }
  return abs;
};

// wp-content URL -> site-relative asset URL, and remember it for copying.
const asset = (url) => {
  if (!url) return "";
  let u = String(url).trim().replace(/^https?:/, "").replace(/^\/\/bestdentistinkatytx\.com/, "");
  if (!u.startsWith("/wp-content/")) {
    // Record anything still pointing at another host so it cannot be shipped
    // unnoticed - see the cross-site images note in the README.
    const m = String(url).match(/^(?:https?:)?\/\/([^/]+)/);
    if (m) {
      if (!externalImages.has(m[1])) externalImages.set(m[1], new Set());
      externalImages.get(m[1]).add(String(url));
    }
    return url;
  }
  const file = assetFile(u);
  if (!file) { droppedLinks.set("MISSING ASSET " + u, (droppedLinks.get("MISSING ASSET " + u) || 0) + 1); return url; }
  const out = "/assets/" + path.relative(ASSET_SRC, file).split(path.sep).join("/").replace(/^wp-content\//, "");
  wantedAssets.add(JSON.stringify([file, out]));
  return out;
};

// Internal link -> a route we actually build, or null if it points at something
// out of scope (a blog post). Callers unwrap null links rather than emit a 404.
const link = (href) => {
  if (!href) return null;
  let h = String(href).trim();
  if (/^(https?:|tel:|mailto:|#)/i.test(h)) {
    if (h.startsWith(SITE_URL)) h = h.slice(SITE_URL.length) || "/";
    else return h;
  }
  if (!h.startsWith("/")) return h;
  const clean = h.split("#")[0].split("?")[0];
  const withSlash = clean.endsWith("/") ? clean : clean + "/";
  if (ROUTES.has(withSlash)) return withSlash + h.slice(clean.length);
  if (ALIASES.has(withSlash)) return ALIASES.get(withSlash);
  if (withSlash.startsWith("/wp-content/")) return asset(clean);
  droppedLinks.set(withSlash, (droppedLinks.get(withSlash) || 0) + 1);
  return null;
};

// Rewrite a block of WordPress content HTML: local asset paths, live internal
// links, unwrapped out-of-scope links, lazy images, wrapped tables.
const rewrite = (html) => {
  if (!html) return "";
  let out = html;
  out = out.replace(/<img([^>]*?)src="([^"]*)"([^>]*)>/gi, (m, a, src, b) => {
    const u = asset(src);
    const attrs = (a + b).replace(/\sloading="[^"]*"/gi, "");
    return `<img${attrs} src="${esc(u)}" loading="lazy" decoding="async">`;
  });
  out = out.replace(/<a([^>]*?)href="([^"]*)"([^>]*)>([\s\S]*?)<\/a>/gi, (m, a, href, b, text) => {
    const to = link(href);
    if (!to) return text;                              // unwrap, keep the words
    const ext = /^https?:/i.test(to) && !to.includes("bestdentistinkatytx.com");
    return `<a${a}href="${esc(to)}"${b}${ext ? ' target="_blank" rel="noopener"' : ""}>${text}</a>`;
  });
  // A paragraph whose whole content was one out-of-scope link is left as a
  // dangling "Learn More About ..." line once the link is unwrapped, so drop it.
  out = out.replace(/<p>\s*(?:Learn|Read|Find out|Discover|Click|See)\b[^<>]{0,90}<\/p>/gi, "");
  out = out.replace(/<table/gi, '<div class="table-scroll"><table').replace(/<\/table>/gi, "</table></div>");
  return out;
};

// Page bodies from WordPress often open a section with their own <h1>, which
// would be a second h1 under the template's page title. Push those down to h2;
// headings already at h2 or below are left alone.
const demoteH1 = (html) => html.replace(/<(\/?)h1(\s|>)/gi, "<$1h2$2");

// ------------------------------------------------------- theme demo leftovers
// The tooth-fairy theme ships demo widgets in a global block that every
// Elementor page renders. On the live site most of it is hidden by CSS, so the
// practice never saw it - but it IS in the markup, and it includes lorem ipsum
// AND four FABRICATED AWARDS ("Top Dental Clinic 2019", "Best Dental Practice
// 2022", ...) that the practice has not won. None of it may reach the rebuild.
// Detection is per Elementor section: if a section carries any marker below,
// the whole section is dropped.
const DEMO_MARKERS = [
  /dicta sunt explicabo/i,                 // lorem ipsum body copy
  /nemo enim ipsam voluptatem/i,
  /\badipiscing elit\b/i,
  /\beusmod tempor\b/i,
  /lorem ipsum/i,
  /^top dental clinic$/i,                  // the fabricated awards table
  /^best dental practice$/i,
  /^dental laboratory$/i,
  /^annual award$/i,
  /^our professional team$/i,              // duplicate doctor roster
  /^(silver|gold|platinum) pack$/i,        // demo pricing tiers
  /^subscribe for the exclusive updates!?$/i,
];
// Sections that are real but already provided by the site chrome, so repeating
// them inside the page body is pure duplication. NOTE: the contact block on the
// doctor pages also carries a SECOND, DIFFERENT set of office hours from the
// one in the footer (Mon 9-7 / Tue 7-5 / Fri open, vs Mon 9-6 / Tue 8-5 / Fri
// closed). Dropping it here also removes that contradiction; which set is
// correct is an open question for the practice.
const CHROME_MARKERS = [/^contact us$/i, /^office hours$/i];
// The blog teaser strip - blog posts are out of scope, so the cards would be
// headings and images pointing nowhere.
const TEASER_MARKERS = [/^dental news in katy$/i, /^what people are saying$/i];
const ACCREDITATION_RE = /(aapd|abpd|agd|kois|ssc)[-\d]*\.(webp|png|jpe?g)$/i;

const stripBoilerplate = (blocks = []) => {
  const bad = new Set();
  const bySection = new Map();
  for (const b of blocks) {
    if (!bySection.has(b.section)) bySection.set(b.section, []);
    bySection.get(b.section).push(b);
  }
  for (const [section, items] of bySection) {
    const texts = items.map((b) => b.text || "").filter(Boolean);
    const isDemo = texts.some((t) => DEMO_MARKERS.some((re) => re.test(t.trim())));
    const isChrome = CHROME_MARKERS.every((re) => texts.some((t) => re.test(t.trim())))
      // the doctor pages carry the same block with the hours as one paragraph
      || (texts.some((t) => /^contact us$/i.test(t.trim())) && texts.some((t) => /^Dentist Katy$/i.test(t.trim())));
    const isTeaser = texts.some((t) => TEASER_MARKERS.some((re) => re.test(t.trim())));
    const onlyBadges = items.length > 2 && items.every((b) => b.type === "image" && ACCREDITATION_RE.test(b.src || ""));
    // NB: a breadcrumb heading is dropped block-by-block below, NOT by killing
    // its section - that section also holds the page header image.
    if (isDemo || isChrome || isTeaser || onlyBadges) bad.add(section);
  }
  return blocks.filter((b) => {
    if (bad.has(b.section)) return false;
    if (b.type === "cta" && /^play$/i.test(b.text || "")) return false;      // demo video button
    if (b.type === "image" && ACCREDITATION_RE.test(b.src || "")) return false;
    if (b.type === "heading" && /^home\s*[-–>»|]\s*/i.test(b.text || "")) return false;
    return true;
  });
};

// ------------------------------------------------------------------ chrome
// Menu entries pointing at something this build does not produce (the blog) are
// dropped rather than rendered as a link into a 404.
const navHtml = (items, depth = 0) => {
  const rendered = items.map((it) => {
    const to = link(it.href);
    const kids = it.children?.length ? navHtml(it.children, depth + 1) : "";
    if (!to) return kids ? `<li>${kids}</li>` : "";
    return `<li${kids ? ' class="has-sub"' : ""}><a href="${esc(to)}">${esc(it.label)}</a>${kids}</li>`;
  }).filter(Boolean).join("");
  return rendered ? `<ul>${rendered}</ul>` : "";
};

const LOGO = "/wp-content/uploads/2023/08/Dentist-Katy-TX-Logo-2.webp";

const header = () => `
<a class="visually-hidden" href="#main">Skip to content</a>
<div class="topbar">
  <span>Dentist Katy | ${esc(PRACTICE.street)} | ${esc(PRACTICE.city)}, ${esc(PRACTICE.region)} ${esc(PRACTICE.postal)} | </span>
  <a href="${PRACTICE.phoneHref}">${esc(PRACTICE.phone)}</a>
</div>
<header class="masthead">
  <div class="shell masthead__inner">
    <a class="brand" href="/" aria-label="${esc(PRACTICE.name)} home">
      <img src="${esc(asset(LOGO))}" width="406" height="156" alt="${esc(PRACTICE.name)}">
    </a>
    <nav class="mainnav" id="mainnav" aria-label="Main">${navHtml(NAV)}</nav>
    <div class="masthead__cta">
      <a class="masthead__phone" href="${PRACTICE.phoneHref}">${esc(PRACTICE.phone)}</a>
      <a class="btn btn--slate" href="https://www.flexbook.me/masonpark/1" target="_blank" rel="noopener">Schedule Online</a>
    </div>
    <button class="navtoggle" type="button" aria-expanded="false" aria-controls="mainnav" aria-label="Menu">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
    </button>
  </div>
</header>
<button class="navscrim" type="button" tabindex="-1" aria-hidden="true"></button>`;

const HOURS = [
  ["Monday", "9am - 6pm"], ["Tuesday", "8am - 5pm"], ["Wednesday", "9am - 6pm"],
  ["Thursday", "8am - 5pm"], ["Friday, Saturday &amp; Sunday", "Closed"],
];

const ACCREDITATIONS = [
  ["/wp-content/uploads/2023/08/aapd.webp", "American Academy of Pediatric Dentistry"],
  ["/wp-content/uploads/2023/08/abpd-1.webp", "American Board of Pediatric Dentistry - Board Certified"],
  ["/wp-content/uploads/2023/08/agd-1.webp", "Academy of General Dentistry"],
  ["/wp-content/uploads/2023/08/kois-1.webp", "Kois Center"],
  ["/wp-content/uploads/2023/08/ssc-1.webp", "Seattle Study Club"],
];

const footer = () => `
<section class="infoband">
  <div class="shell grid grid--2">
    <div>
      <h2>Contact Us</h2>
      <p>Dentist Katy</p>
      <p>${esc(PRACTICE.street)},<br>${esc(PRACTICE.city)}, ${esc(PRACTICE.region)} ${esc(PRACTICE.postal)}</p>
      <p><a href="${PRACTICE.phoneHref}">Call: ${esc(PRACTICE.phone)}</a></p>
    </div>
    <div>
      <h2>Office Hours</h2>
      ${HOURS.map(([d, t]) => `<p>${d}: ${t}</p>`).join("\n      ")}
    </div>
  </div>
</section>
<section class="section--slate">
  <div class="badges">
    ${ACCREDITATIONS.map(([src, alt]) => `<div><img src="${esc(asset(src))}" alt="${esc(alt)}" loading="lazy"></div>`).join("\n    ")}
  </div>
</section>
<footer class="sitefoot">
  <div class="shell">
    <div class="sitefoot__grid">
      <div class="sitefoot__brand">
        <img src="${esc(asset(LOGO))}" width="406" height="156" alt="${esc(PRACTICE.name)}" loading="lazy">
        <p>Comprehensive family, cosmetic and restorative dentistry in Katy, Texas.</p>
      </div>
      <div>
        <h3>Useful Links</h3>
        <ul>${FOOTER_LINKS.map((l) => { const to = link(l.href); return to ? `<li><a href="${esc(to)}">${esc(l.label)}</a></li>` : ""; }).join("")}</ul>
      </div>
      <div>
        <h3>Menu</h3>
        <ul>
          <li><a href="/">Home</a></li>
          <li><a href="/our-services/">Services</a></li>
          <li><a href="/about-us/">About Us</a></li>
          <li><a href="/special-offers/">Special Offers</a></li>
          <li><a href="/contacts/">Contacts</a></li>
        </ul>
      </div>
      <div>
        <h3>Contact Us</h3>
        <ul>
          <li><a href="${esc(PRACTICE.maps)}" target="_blank" rel="noopener">${esc(PRACTICE.street)}<br>${esc(PRACTICE.city)}, ${esc(PRACTICE.region)} ${esc(PRACTICE.postal)}</a></li>
          <li><a href="${PRACTICE.phoneHref}">${esc(PRACTICE.phone)}</a></li>
          <li><a href="${esc(PRACTICE.facebook)}" target="_blank" rel="noopener">Facebook</a></li>
        </ul>
      </div>
    </div>
    <div class="sitefoot__legal">
      &copy; ${new Date().getFullYear()} ${esc(PRACTICE.name)} | <a href="${PRACTICE.phoneHref}">${esc(PRACTICE.phone)}</a>
      | ${esc(PRACTICE.street)}, ${esc(PRACTICE.city)}, ${esc(PRACTICE.region)} ${esc(PRACTICE.postal)}
      | <a href="/privacy-policy/">Privacy Policy</a> | <a href="/terms-of-service/">Terms of Service</a>
    </div>
  </div>
</footer>
<a class="callbar" href="${PRACTICE.phoneHref}">Call ${esc(PRACTICE.phone)}</a>`;

const jsonLd = (page, route) => JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Dentist",
  name: PRACTICE.name,
  url: SITE_URL + route,
  telephone: PRACTICE.phone,
  address: {
    "@type": "PostalAddress",
    streetAddress: PRACTICE.street, addressLocality: PRACTICE.city,
    addressRegion: "Texas", postalCode: PRACTICE.postal, addressCountry: "US",
  },
  openingHoursSpecification: [
    { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Wednesday"], opens: "09:00", closes: "18:00" },
    { "@type": "OpeningHoursSpecification", dayOfWeek: ["Tuesday", "Thursday"], opens: "08:00", closes: "17:00" },
  ],
  sameAs: [PRACTICE.facebook],
});

const layout = ({ title, description, route, body, ogImage }) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description || "")}">
<link rel="canonical" href="${esc(SITE_URL + route)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description || "")}">
<meta property="og:url" content="${esc(SITE_URL + route)}">
${ogImage ? `<meta property="og:image" content="${esc(SITE_URL + ogImage)}">` : ""}
<meta name="theme-color" content="#00bde0">
<link rel="icon" href="/assets/uploads/2023/08/Dentist-Katy-TX-Logo-2.webp">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="/assets/site.css">
<script type="application/ld+json">${jsonLd(null, route)}</script>
</head>
<body>
${header()}
<main id="main">
${body}
</main>
${footer()}
<script src="/assets/site.js" defer></script>
</body>
</html>
`;

// -------------------------------------------------------------- renderers
// Only two third-party embeds survive the rebuild: the practice's Google Maps
// pin and its live GoHighLevel appointment form. Everything else the compromised
// WordPress install was loading (chat widget, review widget, the injected
// overlay) is deliberately dropped.
const renderEmbed = (src = "") => {
  if (/google\.com\/maps/.test(src)) {
    return `<div class="embed"><iframe data-src="${esc(src)}" title="Map to ${esc(PRACTICE.name)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div>`;
  }
  if (/leadconnectorhq\.com\/widget\/form/.test(src)) {
    return `<div class="embed"><iframe data-src="${esc(src)}" title="Request an appointment" loading="lazy" style="min-height:640px"></iframe></div>`;
  }
  if (/(form\.)?123formbuilder\.com/.test(src)) {
    return `<div class="embed"><iframe data-src="${esc(src)}" title="Send us your details" loading="lazy" style="min-height:720px"></iframe></div>`;
  }
  return "";
};

const breadcrumbs = (trail) =>
  `<div class="shell"><nav class="breadcrumbs" aria-label="Breadcrumb">` +
  trail.map((t) => (t.href ? `<span><a href="${esc(t.href)}">${esc(t.label)}</a></span>` : `<span>${esc(t.label)}</span>`)).join("") +
  `</nav></div>`;

const sidebarCta = (extra = "") => `
<aside>
  <div class="aside-cta">
    <h3>Book a visit</h3>
    <p>New and existing patients welcome. Call the practice or request a time online.</p>
    <p><a class="btn" href="https://www.flexbook.me/masonpark/1" target="_blank" rel="noopener">Request an appointment</a></p>
    <p><a class="masthead__phone" href="${PRACTICE.phoneHref}">${esc(PRACTICE.phone)}</a></p>
    ${extra}
  </div>
</aside>`;

// Menu labels, so the sidebar reads in the practice's own wording and sentence
// case rather than the raw page titles (some of which are shouted in caps).
const NAV_LABELS = new Map();
(function walkNav(items) {
  for (const it of items) {
    if (it.href) NAV_LABELS.set(it.href, it.label);
    if (it.children) walkNav(it.children);
  }
})(NAV);
for (const l of FOOTER_LINKS) if (!NAV_LABELS.has(l.href)) NAV_LABELS.set(l.href, l.label);
// A couple of pages are linked from neither menu; name them explicitly rather
// than letting a <title> like "FAQs at Mason Park Dental - ..." be trimmed to
// something that reads as a fragment.
NAV_LABELS.set("/faq-page/", "Frequently Asked Questions");
NAV_LABELS.set("/appointment/", "Request an Appointment");
NAV_LABELS.set("/thank-you/", "Thank You");
NAV_LABELS.set("/team/dr-cho/", "Dr. Dave Cho");
NAV_LABELS.set("/team/dr-sung/", "Dr. William Sung");
NAV_LABELS.set("/team/tam-nguyen/", "Dr. Tam Nguyen");
// SHOUTED TITLES are common in this content; soften them, but leave real
// acronyms (TMJ, FAQ, AI, TX) and short all-caps words alone.
const KEEP_CAPS = /^(TMJ|TMD|FAQ|FAQs|AI|TX|USA|PH|RDA|APR|DMD|DDS|A|Z)$/;
const softenCaps = (s) =>
  s === s.toUpperCase()
    ? s.replace(/[\w®']+/g, (w) => (KEEP_CAPS.test(w) ? w : w[0] + w.slice(1).toLowerCase()))
    : s;

// The <h1> in the extracted markup is unreliable - most Elementor pages put the
// blog teaser strip's "DENTAL NEWS IN KATY" first in document order. So prefer
// the menu label, then the service title, then the <title> tag with its site
// suffix trimmed.
const titleOf = (d) => {
  if (!d) return PRACTICE.name;
  const route = routeOf(d.slug);
  if (NAV_LABELS.has(route)) return NAV_LABELS.get(route);
  if (d.kind === "service" && d.heading) return d.heading;
  const fromTitle = (d.title || "").split(/\s*\|\s*|\s*[-–—]\s+/)[0].trim()
    .replace(/\s*[-–—]?\s*(Mason Park Dental.*|Dentist Katy.*)$/i, "").trim();
  if (fromTitle) return softenCaps(fromTitle);
  return softenCaps((d.heading || d.slug).trim());
};
const labelFor = (slug) => titleOf(read(slug));

const relatedServices = (current) => {
  const pool = SERVICE_SLUGS.filter((s) => s !== current && NAV_LABELS.has(routeOf(s)));
  const start = Math.max(0, pool.indexOf(current));
  const items = [...pool.slice(start), ...pool.slice(0, start)].slice(0, 8)
    .map((s) => `<li><a href="${routeOf(s)}">${esc(labelFor(s))}</a></li>`).join("");
  return `<h3 style="margin-top:1.75rem">More services</h3><ul>${items}</ul>
    <p style="margin-top:1rem"><a href="/our-services/">All services</a></p>`;
};

// A WordPress content page: featured image hero, then the article body.
const renderArticle = (d, route) => {
  const title = titleOf(d);
  const isService = SERVICE_SLUGS.includes(d.slug);
  const trail = [{ label: "Home", href: "/" }];
  if (isService) trail.push({ label: "Services", href: "/our-services/" });
  trail.push({ label: title });

  const hero = d.featured?.src
    ? `<section class="hero hero--image">
    <img src="${esc(asset(d.featured.src))}" alt="${esc(d.featured.alt || title)}" width="${d.featured.w || ""}" height="${d.featured.h || ""}">
    <div class="hero__caption"><div class="shell">${isService ? '<p class="eyebrow">Katy, TX</p>' : ""}<h1>${esc(title)}</h1></div></div>
  </section>`
    : `<section class="hero hero--page"><div class="shell">${isService ? '<p class="eyebrow">Katy, TX</p>' : ""}<h1>${esc(title)}</h1>${d.description ? `<p>${esc(d.description)}</p>` : ""}</div></section>`;

  return `${hero}
${breadcrumbs(trail)}
<div class="section section--tight">
  <div class="shell article-layout">
    <article class="prose">${fixRunOn(demoteH1(rewrite(d.html)))}</article>
    ${sidebarCta(isService ? relatedServices(d.slug) : "")}
  </div>
</div>`;
};

// An Elementor page with no hand-written template: replay the extracted blocks
// in document order. Not a pixel match, but every word and image survives.
const renderBlocks = (d, route) => {
  const title = titleOf(d);
  const norm = (t) => String(t || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  let blocks = stripBoilerplate(d.blocks || [])
    // The body repeats the page title as its own heading on most of these pages.
    .filter((b) => !(b.type === "heading" && norm(b.text) === norm(title)));

  // These pages open with a full-width header image that the theme showed under
  // the title. Left inline it reads as a random stock photo mid-article, so it
  // is promoted to the page hero - which is what it was.
  const firstSection = blocks.length ? blocks[0].section : null;
  const firstBlocks = blocks.filter((b) => b.section === firstSection);
  let heroImage = null;
  if (firstBlocks.length === 1 && firstBlocks[0].type === "image") {
    heroImage = firstBlocks[0];
    blocks = blocks.filter((b) => b !== heroImage);
  }

  // Elementor sections are layout seams, not content seams. On a page with only
  // a few of them, banding them alternately reads as deliberate design. On a
  // long one - an FAQ list, the dental dictionary - it turns into a zebra of
  // three-line stripes, so those render as one continuous column instead and
  // let the headings carry the rhythm.
  const sectionCount = new Set(blocks.map((b) => b.section)).size;
  const banded = sectionCount <= 3;

  let out = banded ? "" : `<section class="section"><div class="shell"><div class="prose">`;
  let open = !banded;
  let lastSection = null;
  for (const b of blocks) {
    if (banded && b.section !== lastSection) {
      if (open) out += "</div></div></section>\n";
      out += `<section class="section${(b.section % 2 === 0) ? " section--paper" : ""}"><div class="shell"><div class="prose">`;
      open = true;
      lastSection = b.section;
    }
    switch (b.type) {
      // never a second <h1>: the template already emitted the page title
      case "heading": {
        // "Dentist Katy, TX" and friends are styled as an eyebrow upstream, not
        // as a section heading; rendering them as <h4> leaves a stray line.
        if (/^dentist\s+(in\s+)?katy(,?\s*(tx|texas))?$/i.test(b.text.trim())) {
          out += `<p class="eyebrow">${esc(b.text)}</p>`; break;
        }
        const lv = Math.min(Math.max(b.level, 2), 6);
        out += `<h${lv}>${esc(softenCaps(b.text))}</h${lv}>`; break;
      }
      case "para":    out += fixRunOn(rewrite(b.html)) || `<p>${esc(fixRunOn(b.text))}</p>`; break;
      case "list":    out += `<${b.ordered ? "ol" : "ul"}>${b.items.map((i) => `<li>${esc(i)}</li>`).join("")}</${b.ordered ? "ol" : "ul"}>`; break;
      case "image":   out += `<img src="${esc(asset(b.src))}" alt="${esc(b.alt)}" loading="lazy" decoding="async">`; break;
      case "cta":     { const to = link(b.href); if (to) out += `<p><a class="btn" href="${esc(to)}"${/^https?:/.test(to) ? ' target="_blank" rel="noopener"' : ""}>${esc(b.text)}</a></p>`; break; }
      case "table":   out += rewrite(b.html); break;
      // Recovered Elementor toggle/accordion item. <details> keeps it usable
      // with no JavaScript at all, and open-by-default is wrong for a long list.
      case "faq":     out += `<details class="faq"><summary>${esc(b.question)}</summary><div class="faq__body">${rewrite(b.html)}</div></details>`; break;
      case "embed":   out += renderEmbed(b.src); break;
      default: break;
    }
  }
  if (open) out += "</div></div></section>";
  const hero = heroImage
    ? `<section class="hero hero--image">
    <img src="${esc(asset(heroImage.src))}" alt="${esc(heroImage.alt || title)}" width="${heroImage.w || ""}" height="${heroImage.h || ""}">
    <div class="hero__caption"><div class="shell"><p class="eyebrow">${esc(PRACTICE.city)}, ${esc(PRACTICE.region)}</p><h1>${esc(title)}</h1></div></div>
  </section>`
    : `<section class="hero hero--page"><div class="shell"><p class="eyebrow">${esc(PRACTICE.city)}, ${esc(PRACTICE.region)}</p><h1>${esc(title)}</h1>${d.description ? `<p>${esc(d.description)}</p>` : ""}</div></section>`;
  return `${hero}
${breadcrumbs([{ label: "Home", href: "/" }, { label: title }])}
${out}`;
};

// ------------------------------------------------------------------- build
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });

const helpers = { esc, asset, link, rewrite, demoteH1, stripBoilerplate, titleOf, softenCaps, fixRunOn, routeOf, read, labelFor, PRACTICE, breadcrumbs, sidebarCta, renderEmbed, SITE_URL };
const written = [];

const skipped = [];
for (const slug of ALL) {
  if (ONLY && !slug.includes(ONLY)) continue;
  if (SKIP.has(slug)) { skipped.push(slug); continue; }
  const d = read(slug);
  if (!d) continue;
  const route = routeOf(slug);
  let body;
  // Hand-authored pages quote the same upstream copy, so they need the same
  // run-on repair. Safe over whole markup: the rule needs two lowercase letters
  // before the stop and a capital after, which no path, class or URL here has.
  if (BESPOKE[slug]) body = fixRunOn(BESPOKE[slug](d, helpers));
  else if (d.kind === "service" || d.kind === "article") body = renderArticle(d, route);
  else body = renderBlocks(d, route);

  const meta = META[slug] || {};
  const sourceTitleBroken = !d.title || /403|forbidden/i.test(d.title);
  const title = meta.title || (sourceTitleBroken ? `${titleOf(d)} | ${PRACTICE.name}` : d.title);
  const description = meta.description || (sourceTitleBroken ? "" : d.description) || DEFAULT_DESC(titleOf(d));
  const html = layout({
    title, description, route, body,
    ogImage: d.featured?.src ? asset(d.featured.src) : null,
  });
  const outDir = route === "/" ? DIST : path.join(DIST, route.slice(1, -1));
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "index.html"), html);
  written.push({ slug, route, bytes: html.length, template: BESPOKE[slug] ? "bespoke" : d.kind });
}

// 404 - Instatic serves /404.html for unmatched paths.
fs.writeFileSync(path.join(DIST, "404.html"), layout({
  title: "Page not found | " + PRACTICE.name,
  description: "That page could not be found.",
  route: "/404.html",
  body: `<section class="section"><div class="shell shell--narrow" style="text-align:center">
  <p class="eyebrow">404</p><h1>We could not find that page</h1>
  <p>The page may have moved during our site rebuild. Try the menu above, or call the practice and we will point you to it.</p>
  <p><a class="btn" href="/">Back to the homepage</a> <a class="btn btn--ghost" href="${PRACTICE.phoneHref}">Call ${esc(PRACTICE.phone)}</a></p>
</div></section>`,
}));

// theme + assets
fs.mkdirSync(path.join(DIST, "assets"), { recursive: true });
fs.copyFileSync(path.join(HERE, "theme", "site.css"), path.join(DIST, "assets", "site.css"));
fs.copyFileSync(path.join(HERE, "theme", "site.js"), path.join(DIST, "assets", "site.js"));

let copied = 0, bytes = 0;
if (!NO_ASSETS) {
  for (const entry of wantedAssets) {
    const [from, to] = JSON.parse(entry);
    const dest = path.join(DIST, to.replace(/^\//, ""));
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    if (!fs.existsSync(dest)) { fs.copyFileSync(from, dest); copied++; bytes += fs.statSync(dest).size; }
  }
}

// sitemap + robots
const urls = written.map((w) => `  <url><loc>${SITE_URL}${w.route}</loc><lastmod>${BUILT}</lastmod></url>`).join("\n");
fs.writeFileSync(path.join(DIST, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
fs.writeFileSync(path.join(DIST, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`);

// report
const report = {
  built: BUILT,
  pages: written.length,
  byTemplate: written.reduce((a, w) => ((a[w.template] = (a[w.template] || 0) + 1), a), {}),
  assetsCopied: copied,
  assetMB: +(bytes / 1048576).toFixed(1),
  skipped,
  externalImages: [...externalImages.entries()]
    .map(([host, urls]) => ({ host, count: urls.size, sample: [...urls].slice(0, 3) }))
    .sort((a, b) => b.count - a.count),
  droppedLinks: [...droppedLinks.entries()].sort((a, b) => b[1] - a[1]).map(([href, n]) => ({ href, n })),
};
fs.writeFileSync(path.join(HERE, "build-report.json"), JSON.stringify(report, null, 1));

console.log(`${written.length} pages -> dist/`);
console.log("  templates:", JSON.stringify(report.byTemplate));
console.log(`  assets: ${copied} files, ${report.assetMB} MB`);
console.log(`  out-of-scope links unwrapped: ${report.droppedLinks.length} distinct (see build-report.json)`);
for (const e of report.externalImages) {
  console.log(`  ! ${e.count} image(s) still served from ${e.host} - not ours, not in the crawl`);
}
