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
import { makePresentation } from "./site/presentation.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CONTENT = path.join(HERE, "content");
const ASSET_SRC = path.resolve(HERE, "../../01-content-intake/.tmp/site-scrape/assets/bestdentistinkatytx.com");
const DIST = path.join(HERE, "dist");

const argv = process.argv.slice(2);
const NO_ASSETS = argv.includes("--no-assets");
const ONLY = argv.includes("--only") ? argv[argv.indexOf("--only") + 1] : null;

// Canonical URLs, the sitemap and robots.txt all hang off this. It stays the
// real domain even while the site is served from a temporary host: that keeps
// the temp URL out of the index and means DNS cutover needs no rebuild. Only
// override it if the temp URL is meant to be indexed on its own.
//   SITE_URL=https://mason-park.up.railway.app node build.mjs
const SITE_URL = (process.env.SITE_URL || "https://bestdentistinkatytx.com").replace(/\/+$/, "");
const BUILT = new Date().toISOString().slice(0, 10);

// Fallback meta description for pages the WordPress site never gave one.
const DEFAULT_DESC = (title) =>
  `${title} at Mason Park Dental of Katy - family, cosmetic and pediatric dentistry at 21830 Kingsland Blvd #104A, Katy, TX. Call (281) 769-8878.`;

// ---------------------------------------------------------------- utilities
// Elementor flattened some lists into a single paragraph, leaving sentences run
// together with no space after the full stop. Requiring two lowercase letters
// before the stop keeps initials ("U.S.") and decimals intact.
const fixRunOn = (s) => String(s ?? "")
  .replace(/([a-z]{2})\.(?=[A-Z])/g, "$1. ")
  // a stray letter in their own copy on /town-resource/
  .replace(/\bBMason Park\b/g, "Mason Park");

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

// Every page the crawl produced content for, PLUS any hand-authored page that
// has no upstream counterpart at all (/cookie-policy/ is new to this site).
// Deliberately not read off CORE_SLUGS: that list is the crawl manifest, and
// extract.mjs reports anything in it with no scrape as a missing page.
const ALL = [...new Set([
  ...fs.readdirSync(CONTENT).filter((f) => f.endsWith(".json") && f !== "_index.json").map((f) => f.slice(0, -5)),
  ...Object.keys(BESPOKE),
])];
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

// ------------------------------------------------------------ responsive images
// WordPress already generated derivatives beside every upload (g7-768x512.jpg
// next to g7.jpg), and the crawl downloaded them. Serving one fixed size means a
// phone pulls a 1536px photo to paint it 390px wide, so build a srcset from
// whatever sizes exist. Only files whose width is in the filename are used -
// the width is then known without decoding the image.
const WIDTH_RE = /^(.*)-(\d{2,4})x(\d{2,4})(\.(?:jpe?g|png|webp))$/i;
const MAX_SRCSET_WIDTH = 1600;   // beyond this is retina-on-desktop territory

const stemOf = (base) => {
  const m = base.match(WIDTH_RE);
  if (m) return { stem: m[1], ext: m[4] };
  const e = base.match(/^(.*?)(-scaled)?(\.\w+)$/);
  return e ? { stem: e[1], ext: e[3] } : null;
};

const derivativeCache = new Map();
const derivativesOf = (file) => {
  if (derivativeCache.has(file)) return derivativeCache.get(file);
  const dir = path.dirname(file);
  const parts = stemOf(path.basename(file));
  let out = [];
  if (parts && fs.existsSync(dir)) {
    // Matched with plain string slicing rather than a built regexp: these stems
    // contain dots, dashes and parentheses, and escaping them into a RegExp is
    // needless risk when the shape is this fixed (`<stem>-<w>x<h><ext>`).
    const prefix = parts.stem + "-";
    const ext = parts.ext.toLowerCase();
    out = fs.readdirSync(dir)
      .map((f) => {
        if (!f.startsWith(prefix) || !f.toLowerCase().endsWith(ext)) return null;
        const mid = f.slice(prefix.length, f.length - ext.length);
        const m = /^(\d{2,4})x(\d{2,4})$/.exec(mid);
        return m ? { file: path.join(dir, f), w: Number(m[1]) } : null;
      })
      .filter(Boolean)
      .filter((d) => d.w <= MAX_SRCSET_WIDTH)
      .sort((a, b) => a.w - b.w);
  }
  derivativeCache.set(file, out);
  return out;
};

// Returns { src, srcset } for a wp-content URL, registering every file it names.
const responsive = (url) => {
  const src = asset(url);
  if (typeof src !== "string" || !src.startsWith("/assets/")) return { src, srcset: "" };
  const file = assetFile(String(url).replace(/^https?:/, "").replace(/^\/\/bestdentistinkatytx\.com/, ""));
  if (!file) return { src, srcset: "" };
  const sizes = derivativesOf(file);
  if (sizes.length < 2) return { src, srcset: "" };
  const srcset = sizes.map((d) => {
    const web = "/assets/" + path.relative(ASSET_SRC, d.file).split(path.sep).join("/").replace(/^wp-content\//, "");
    wantedAssets.add(JSON.stringify([d.file, web]));
    return `${web} ${d.w}w`;
  }).join(", ");
  return { src, srcset };
};

// One <img> tag with the whole responsive set. `sizes` is the CSS width the
// image will occupy - get it wrong and the browser picks a needlessly big file.
const img = (url, alt, { sizes = "(max-width: 999px) 100vw, 700px", cls = "", eager = false, decorative = false, w, h } = {}) => {
  const r = responsive(url);
  if (!r.src) return "";
  return `<img src="${esc(r.src)}"${r.srcset ? ` srcset="${esc(r.srcset)}" sizes="${esc(sizes)}"` : ""}` +
    `${cls ? ` class="${esc(cls)}"` : ""} alt="${esc(alt || "")}"${decorative ? ' aria-hidden="true"' : ""}` +
    `${w ? ` width="${w}"` : ""}${h ? ` height="${h}"` : ""}` +
    `${eager ? ' fetchpriority="high"' : ' loading="lazy"'} decoding="async">`;
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
    const r = responsive(src);
    const attrs = (a + b).replace(/\sloading="[^"]*"/gi, "").replace(/\ssrcset="[^"]*"/gi, "");
    return `<img${attrs} src="${esc(r.src)}"` +
      `${r.srcset ? ` srcset="${esc(r.srcset)}" sizes="(max-width: 999px) 100vw, 700px"` : ""}` +
      ` loading="lazy" decoding="async">`;
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
  out = out.replace(/<table/gi, '<div class="overflow-scroll-x"><table').replace(/<\/table>/gi, "</table></div>");
  return out;
};

// Heading levels in the imported markup jump around - h2 straight to h5 is
// common - because they were chosen for size, not structure. A screen reader
// navigates by that outline, so close the gaps: each heading may be at most one
// level deeper than the one before it, and never an h1 (the page title owns
// that). Headings do not nest, so non-greedy pairing is safe.
const normaliseHeadings = (html) => {
  let prev = 1;   // the page <h1> lives in the hero, above this markup
  return String(html ?? "").replace(
    /<h([1-6])([^>]*)>([\s\S]*?)<\/h\1>/gi,
    (whole, lvl, attrs, inner) => {
      const target = Math.max(2, Math.min(Number(lvl), prev + 1));
      prev = target;
      return `<h${target}${attrs}>${inner}</h${target}>`;
    });
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

// ============================================================================
// PRESENTATION
// All markup lives in site/presentation.mjs, composed from site/components.mjs.
// build.mjs stays responsible for data - routes, assets, links, the demo
// stripper - and writes no tags of its own.
// ============================================================================

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

const P = makePresentation({
  esc, img, link, rewrite, demoteH1, normaliseHeadings, fixRunOn, softenCaps, stripBoilerplate,
  // `read` so the treatment pages can pull the practice's own reviews for their
  // proof chapter. They live in the homepage's content file, section 15, which
  // is where the crawler put them; there is no separate reviews source.
  titleOf, labelFor, routeOf, read, NAV, FOOTER_LINKS, PRACTICE, SERVICE_SLUGS,
  NAV_LABELS, SITE_URL,
});
const { C, renderArticle, renderService, renderBlocks, renderEmbed, sidebarCta, pageBody, layout } = P;

// ------------------------------------------------------------------- build
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });

// What a page template may use. `C` is the component library; templates compose
// it rather than writing markup. `breadcrumbs` is kept as an alias so existing
// templates keep working while they are ported.
const helpers = {
  esc, asset, img, responsive, link, rewrite, demoteH1, normaliseHeadings, stripBoilerplate,
  titleOf, softenCaps, fixRunOn, routeOf, read, labelFor,
  PRACTICE, SITE_URL, C, sidebarCta, renderEmbed,
  breadcrumbs: C.breadcrumb,
  HOURS: P.HOURS, BOOKING: P.BOOKING, ACCREDITATIONS: P.ACCREDITATIONS,
};
const written = [];

const skipped = [];
for (const slug of ALL) {
  if (ONLY && !slug.includes(ONLY)) continue;
  if (SKIP.has(slug)) { skipped.push(slug); continue; }
  // A hand-authored page need not have a crawled counterpart: /cookie-policy/
  // is new, and the crawler only ever got a 403 for /privacy-policy/. Anything
  // NOT hand-authored still needs its content file, so a silent gap stays loud.
  const d = read(slug) || (BESPOKE[slug] ? { slug, blocks: [] } : null);
  if (!d) continue;
  const route = routeOf(slug);
  let body;
  // Hand-authored pages quote the same upstream copy, so they need the same
  // run-on repair. Safe over whole markup: the rule needs two lowercase letters
  // before the stop and a capital after, which no path, class or URL here has.
  if (BESPOKE[slug]) body = fixRunOn(BESPOKE[slug](d, helpers));
  // The 35 treatment pages get their own renderer; the ~20 informational
  // articles keep the single-column one, which is right for them.
  else if (d.kind === "service") body = renderService(d, route);
  else if (d.kind === "article") body = renderArticle(d, route);
  else body = renderBlocks(d, route);

  const meta = META[slug] || {};
  const sourceTitleBroken = !d.title || /403|forbidden/i.test(d.title);
  const title = meta.title || (sourceTitleBroken ? `${titleOf(d)} | ${PRACTICE.name}` : d.title);
  const description = meta.description || (sourceTitleBroken ? "" : d.description) || DEFAULT_DESC(titleOf(d));
  const html = layout({
    title, description, route, body,
    ogImage: d.featured?.src ? asset(d.featured.src) : null,
    // Detected from the markup rather than listed by slug, so a page gains the
    // motion layer the moment it is authored as chapters and loses it the
    // moment it is not. Nothing to keep in sync.
    motion: body.includes("data-chapter="),
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
  body: C.section({ name: "not-found", container: "medium", inner: `
    <div class="text-align-center">
      ${C.eyebrow("404")}
      ${C.heading("We could not find that page", { level: 1 })}
      ${C.spacer("small")}
      ${C.paragraph("The page may have moved during our site rebuild. Try the menu above, or call the practice and we will point you to it.", { size: "medium" })}
      ${C.spacer("medium")}
      <div class="button-group" style="justify-content:center">
        ${C.button({ label: "Back to the homepage", href: "/" })}
        ${C.button({ label: `Call ${PRACTICE.phone}`, href: PRACTICE.phoneHref, variant: "ghost" })}
      </div>
    </div>` }),
}));

// theme + assets
fs.mkdirSync(path.join(DIST, "assets"), { recursive: true });
// The stylesheet ships as ONE file, because Instatic registers it as a single
// site-wide code asset. `journey.css` is authored separately only so the design
// layer stays readable; it is concatenated here, never linked separately.
// ORDER MATTERS. The fluid root has to be the first rule in the sheet, before
// any reset, and nothing later may set a root font-size (see
// deliver/process/04-design/fluid-root.md). It is emitted by
// scripts/fluid-root.mjs and must never be hand-edited here.
fs.writeFileSync(
  path.join(DIST, "assets", "site.css"),
  [
    fs.readFileSync(path.join(HERE, "theme", "fluid-root.css"), "utf8"),
    fs.readFileSync(path.join(HERE, "theme", "site.css"), "utf8"),
    fs.readFileSync(path.join(HERE, "theme", "journey.css"), "utf8"),
  ].join(String.fromCharCode(10)),
);
// CONTROL CHARACTERS IN SOURCE. Writing a JS regex through a shell heredoc
// turns a backslash-b into a literal BACKSPACE byte. The file still parses,
// the build still succeeds, and the pattern silently matches nothing: it cost
// three rounds on the treatment pages, where every page came back with zero
// sections and rendered perfectly as the wall it was supposed to replace.
// Nothing else here can see that, so the build refuses it.
{
  // No regex literal here, deliberately. The first version of this guard was
  // written as one and its own escapes collapsed into real control characters,
  // which is the exact bug it exists to catch. A numeric scan has nothing to
  // escape and cannot be mangled by whatever wrote this file.
  const badAt = (text) => {
    for (let k = 0; k < text.length; k++) {
      const c = text.charCodeAt(k);
      if (c < 32 && c !== 9 && c !== 10 && c !== 13) return k;
    }
    return -1;
  };
  const roots = ["site", "theme"];
  for (const dir of roots) {
    const abs = path.join(HERE, dir);
    if (!fs.existsSync(abs)) continue;
    for (const f of fs.readdirSync(abs)) {
      if (!/.(mjs|js|css)$/.test(f)) continue;
      const text = fs.readFileSync(path.join(abs, f), "utf8");
      const at = badAt(text);
      if (at !== -1) {
        console.error( +
          JSON.stringify(text.slice(Math.max(0, at - 50), at + 10)));
        process.exitCode = 1;
      }
    }
  }
}
// A BRACE COUNT, because an unbalanced one fails silently and expensively.
// Splicing a token block into `:root` once dropped its closing brace. CSS error
// recovery then swallowed the four type tiers below it as if they were
// declarations, so --t-disp stayed at 1 at every width: the hero headline
// rendered at its 1440 size on a 360 phone and ran off the screen. Nothing
// reported it. audit.mjs checks classes, responsive.mjs checks rendered text,
// and neither can see a stylesheet that parsed into the wrong shape.
{
  const css = fs.readFileSync(path.join(DIST, "assets", "site.css"), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "");
  const open = (css.match(/{/g) || []).length;
  const close = (css.match(/}/g) || []).length;
  if (open !== close) {
    console.error(`  ! site.css braces are unbalanced: ${open} open, ${close} close`);
    process.exitCode = 1;
  }
}

fs.copyFileSync(path.join(HERE, "theme", "site.js"), path.join(DIST, "assets", "site.js"));
fs.copyFileSync(path.join(HERE, "theme", "journey.js"), path.join(DIST, "assets", "journey.js"));

// GSAP is vendored, not pulled off a CDN: a dental site must not hand a third
// party the ability to run script on its pages, and the whole set is 125KB.
// All plugins are free since GSAP 3.13, so ScrollTrigger and SplitText need no
// licence check. Only the three the journey layer actually uses are shipped.
const GSAP_SRC = path.join(HERE, "vendor", "gsap");
if (fs.existsSync(GSAP_SRC)) {
  const gd = path.join(DIST, "assets", "gsap");
  fs.mkdirSync(gd, { recursive: true });
  for (const f of fs.readdirSync(GSAP_SRC)) fs.copyFileSync(path.join(GSAP_SRC, f), path.join(gd, f));
}

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
