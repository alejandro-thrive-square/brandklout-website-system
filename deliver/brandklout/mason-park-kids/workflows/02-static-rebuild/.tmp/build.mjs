// Build the static Mason Park Dental for Kids site.
//
//   node build.mjs [--no-assets] [--only substr]
//
// Input : content/<slug>.json      live-install snapshots   (extract.mjs)
//         content-db/<slug>.json   the abandoned install    (db-pages.mjs)
//         site/pages.mjs           hand-authored templates
//         theme/site.css, theme/site.js
//         ../../01-site-recovery/.tmp/recovered/mirror/     the real images
// Output: dist/  — a flat static site.
//
// Only images the built pages actually reference are copied; the recovery holds
// 512 upload files and a good share of them belong to blog posts, out of scope.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  NAV, FOOTER_LINKS, PRACTICE, HOURS, LOGO,
  SERVICE_SLUGS, AUTHORED_SERVICE_SLUGS, DB_CORE_PAGES, RETITLED,
} from "./pages.config.mjs";
import { BESPOKE, SKIP, META } from "./site/pages.mjs";
import { makePresentation } from "./site/presentation.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CONTENT = path.join(HERE, "content");
const CONTENT_DB = path.join(HERE, "content-db");
const ASSET_SRC = path.resolve(HERE, "../../01-site-recovery/.tmp/recovered/mirror");
const DIST = path.join(HERE, "dist");

const argv = process.argv.slice(2);
const NO_ASSETS = argv.includes("--no-assets");
const ONLY = argv.includes("--only") ? argv[argv.indexOf("--only") + 1] : null;

// Canonical URLs, the sitemap and robots.txt all hang off this. It stays the
// real domain even while the site is served from a temporary host: that keeps
// the temp URL out of the index and means DNS cutover needs no rebuild.
//   SITE_URL=https://example.up.railway.app node build.mjs
const SITE_URL = (process.env.SITE_URL || "https://pediatricdentistkatytx.com").replace(/\/+$/, "");
const BUILT = new Date().toISOString().slice(0, 10);

const DEFAULT_DESC = (title) =>
  `${title} at ${PRACTICE.name} — pediatric dentistry in Katy, TX with Dr. Tam Nguyen. ` +
  `${PRACTICE.street}, ${PRACTICE.city}, ${PRACTICE.region} ${PRACTICE.postal}. Call ${PRACTICE.phone}.`;

// ---------------------------------------------------------------- utilities
// Elementor flattened some lists into a single paragraph, leaving sentences run
// together with no space after the full stop. Requiring two lowercase letters
// before the stop keeps initials ("U.S.") and decimals intact.
const fixRunOn = (s) => String(s ?? "").replace(/([a-z]{2})\.(?=[A-Z])/g, "$1. ");

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// ------------------------------------------------------------------ wpautop
// Pages taken from the database are stored the way the classic editor stores
// them: paragraphs are blank lines, and only block tags are explicit. WordPress
// runs wpautop() at render time. Rebuilding without it collapses every page
// into one wall of text, so do the same job here — conservatively, only
// wrapping runs that are not already inside a block element.
const BLOCK = "address|article|aside|blockquote|details|div|dl|fieldset|figure|figcaption|footer|form|h[1-6]|header|hr|nav|ol|p|pre|section|table|ul";
const wpautop = (raw) => {
  const text = String(raw ?? "").replace(/\r\n?/g, "\n").trim();
  if (!text) return "";
  // Split on blank lines, but never inside a top-level block element.
  const parts = [];
  let buf = "";
  let depth = 0;
  for (const line of text.split("\n")) {
    const opens = (line.match(new RegExp(`<(${BLOCK})\\b`, "gi")) || []).length;
    const closes = (line.match(new RegExp(`</(${BLOCK})>`, "gi")) || []).length;
    if (!line.trim() && depth <= 0) { if (buf.trim()) parts.push(buf.trim()); buf = ""; continue; }
    buf += (buf ? "\n" : "") + line;
    depth += opens - closes;
    if (depth < 0) depth = 0;
  }
  if (buf.trim()) parts.push(buf.trim());
  return parts.map((p) => {
    if (new RegExp(`^\\s*<(${BLOCK})\\b`, "i").test(p)) return p;
    return `<p>${p.replace(/\n/g, "<br>")}</p>`;
  }).join("\n");
};

// -------------------------------------------------------------- db cleanup
// Database rows carry whatever editor last touched them. Two of them are
// Gutenberg documents, so they arrive wrapped in forty `wp-block-*`,
// `has-large-font-size`, `is-cropped` and `wp-image-541` classes that this
// stylesheet does not define and must not start defining — a page whose markup
// names classes the stylesheet does not carry is exactly what audit.mjs fails
// the build over. The content itself is fine; only the packaging is not.
//
// Three things go, in this order:
//   1. every WordPress emoji <img> (WordPress rewrites a literal "▪" in the
//      copy into an <img class="emoji" src="https://s.w.org/…25aa.png">, so a
//      bullet character becomes four cross-origin requests). The alt text IS
//      the original character, so put it back.
//   2. every <iframe> and every <img> served from a host that is not ours —
//      on these pages that host is the PARENT practice's web server, and
//      serving another practice's files is what this rebuild is undoing.
//   3. class, id and style attributes. `.text-rich-text` styles this content
//      by tag, so nothing here needs a class of its own.
const cleanDbHtml = (raw) => String(raw ?? "")
  .replace(/<img[^>]*class="[^"]*\bemoji\b[^"]*"[^>]*alt="([^"]*)"[^>]*>/gi, "$1")
  .replace(/<img[^>]*\bs\.w\.org\/images\/core\/emoji[^>]*>/gi, "")
  .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
  .replace(/<img\b[^>]*>/gi, (tag) => {
    const src = (tag.match(/\bsrc="([^"]*)"/i) || [, ""])[1];
    const local = normaliseAssetUrl(src);
    // NB a protocol-relative `//otherhost/…` also begins with "/", so test for
    // exactly one leading slash rather than just the first character.
    return /^\/(?!\/)/.test(local) ? tag : "";
  })
  // An <a> that wrapped one of those images is now empty: a link with no
  // accessible name still pointing at the other practice's file.
  .replace(/<a\b[^>]*>\s*<\/a>/gi, "")
  .replace(/\s(?:class|id|style|data-[\w-]+)="[^"]*"/gi, "")
  // A figure or div left holding nothing after the image inside it was dropped.
  .replace(/<(figure|div)>\s*(?:<figcaption>\s*<\/figcaption>)?\s*<\/\1>/gi, "")
  // The 2013-era editor could not type a trademark glyph, so the copy spells it
  // "Invisalign(TM)" eleven times on one page. Same word, correct symbol.
  .replace(/Invisalign\s*\(TM\)/gi, "Invisalign®")
  // Shortcodes for plugins that are not coming back render as literal text.
  .replace(/\[\/?[a-z][a-z0-9_-]*(?:\s[^\]]*)?\]/gi, "");

// --------------------------------------------------------------- the corpus
// Two sources, one map. A snapshot wins over a database row if both exist —
// the snapshot is what the practice was actually publishing.
const readFrom = (dir, slug) => {
  const f = path.join(dir, slug + ".json");
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : null;
};
const listOf = (dir) => (fs.existsSync(dir)
  ? fs.readdirSync(dir).filter((f) => f.endsWith(".json") && f !== "_index.json").map((f) => f.slice(0, -5))
  : []);

const SNAP_SLUGS = listOf(CONTENT);
const DB_SLUGS = listOf(CONTENT_DB);

const read = (slug) => {
  const snap = readFrom(CONTENT, slug);
  if (snap) return snap;
  const db = readFrom(CONTENT_DB, slug);
  if (!db) return null;
  // Normalise a database row into the shape the renderers expect.
  return {
    slug: db.slug,
    url: SITE_URL + routeOf(db.slug),
    title: "",
    description: "",
    kind: db.kind === "service" ? "service" : "article",
    heading: db.title,
    html: wpautop(cleanDbHtml(db.html)),
    blocks: [],
    featured: null,
    source: db.source,
  };
};

// slug -> public route.
const routeOf = (slug) => {
  if (slug === "home") return "/";
  if (RETITLED[slug]) return RETITLED[slug].route;
  if (SERVICE_SLUGS.includes(slug) || AUTHORED_SERVICE_SLUGS.includes(slug)) return "/services/" + slug + "/";
  return "/" + slug + "/";
};

// Everything that becomes a route.
const ALL = [
  ...SNAP_SLUGS,
  ...DB_SLUGS.filter((s) => !SNAP_SLUGS.includes(s)),
  ...AUTHORED_SERVICE_SLUGS,
  "privacy-policy",
].filter((s, i, a) => a.indexOf(s) === i);

const ROUTES = new Map(ALL.map((s) => [routeOf(s), s]));

// The live nav and body copy point at URLs this build resolves differently, or
// does not build at all. Everything here was verified against the recovery.
const ALIASES = new Map([
  // 157 blog posts are out of scope, exactly as they were for the parent site.
  ["/blog/", null],
  // Dead on the live WordPress site too — no page has ever existed at these.
  ["/contact/", "/contacts/"],
  ["/services/", "/our-services/"],
  ["/dental-savings-plan/", "/dental-saving-plan/"],
  ["/our-team-copy/", "/our-team/"],
  // Menu parents that pointed at `#`.
  ["/#/", null],
  // Named in body copy on several pages; the parent practice's site, not ours.
  ["/katy-tx-dentist/", "/contacts/"],
]);

const wantedAssets = new Set();
const droppedLinks = new Map();   // href -> count, for the build report
const externalImages = new Map(); // host -> Set(url)

// Choose the best on-disk file for a wp-content URL. `-scaled` originals run to
// 2560px and several MB; prefer the 1536px derivative when WordPress made one.
const assetFile = (webPath) => {
  const rel = webPath.replace(/^\/+/, "");
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

// ------------------------------------------------------- responsive images
// WordPress already generated derivatives beside every upload and the recovery
// mirror downloaded them, so build a srcset from whatever sizes exist rather
// than shipping one size to every device. Only files whose width is in the
// filename are used — the width is then known without decoding the image.
const WIDTH_RE = /^(.*)-(\d{2,4})x(\d{2,4})(\.(?:jpe?g|png|webp))$/i;
const MAX_SRCSET_WIDTH = 1600;

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
    // carry dots, dashes and parentheses, and escaping them into a RegExp is
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

const webPathOf = (file) =>
  "/assets/" + path.relative(ASSET_SRC, file).split(path.sep).join("/").replace(/^wp-content\//, "");

const responsive = (url) => {
  const src = asset(url);
  if (typeof src !== "string" || !src.startsWith("/assets/")) return { src, srcset: "" };
  const file = assetFile(normaliseAssetUrl(url));
  if (!file) return { src, srcset: "" };
  const sizes = derivativesOf(file);
  if (sizes.length < 2) return { src, srcset: "" };
  const srcset = sizes.map((d) => {
    const web = webPathOf(d.file);
    wantedAssets.add(JSON.stringify([d.file, web]));
    return `${web} ${d.w}w`;
  }).join(", ");
  return { src, srcset };
};

const img = (url, alt, { sizes = "(max-width: 999px) 100vw, 700px", cls = "", eager = false, decorative = false, w, h } = {}) => {
  const r = responsive(url);
  if (!r.src) return "";
  return `<img src="${esc(r.src)}"${r.srcset ? ` srcset="${esc(r.srcset)}" sizes="${esc(sizes)}"` : ""}` +
    `${cls ? ` class="${esc(cls)}"` : ""} alt="${esc(alt || "")}"${decorative ? ' aria-hidden="true"' : ""}` +
    `${w ? ` width="${w}"` : ""}${h ? ` height="${h}"` : ""}` +
    `${eager ? ' fetchpriority="high"' : ' loading="lazy"'} decoding="async">`;
};

// Snapshots were rendered off a local mirror, so an absolute URL can carry the
// real host OR a throwaway 127.0.0.1:<port>. Both mean the same file.
const normaliseAssetUrl = (url) => String(url).trim()
  .replace(/^https?:\/\/(www\.)?pediatricdentistkatytx\.com/i, "")
  .replace(/^https?:\/\/127\.0\.0\.1(:\d+)?/, "")
  .replace(/^https?:\/\/localhost(:\d+)?/i, "")
  .replace(/^https?:/, "");

const asset = (url) => {
  if (!url) return "";
  const u = normaliseAssetUrl(url);
  if (!u.startsWith("/wp-content/")) {
    // Record anything still pointing at another host so it cannot ship unnoticed.
    const m = String(url).match(/^(?:https?:)?\/\/([^/]+)/);
    if (m) {
      if (!externalImages.has(m[1])) externalImages.set(m[1], new Set());
      externalImages.get(m[1]).add(String(url));
    }
    return url;
  }
  const file = assetFile(u);
  if (!file) { droppedLinks.set("MISSING ASSET " + u, (droppedLinks.get("MISSING ASSET " + u) || 0) + 1); return url; }
  const out = webPathOf(file);
  wantedAssets.add(JSON.stringify([file, out]));
  return out;
};

// Internal link -> a route we actually build, or null if it points at something
// out of scope. Callers unwrap null links rather than emit a 404.
const link = (href) => {
  if (!href) return null;
  let h = String(href).trim();
  if (h === "#" || h === "") return null;
  if (/^(https?:|tel:|mailto:|#)/i.test(h)) {
    const n = normaliseAssetUrl(h);
    if (n !== h.replace(/^https?:/, "") || h.startsWith(SITE_URL)) h = n || "/";
    else return h;
  }
  if (!h.startsWith("/")) return h;
  const clean = h.split("#")[0].split("?")[0];
  const withSlash = clean.endsWith("/") ? clean : clean + "/";
  if (ROUTES.has(withSlash)) return withSlash + h.slice(clean.length);
  if (ALIASES.has(withSlash)) return ALIASES.get(withSlash);
  // A bare /<service>/ link from the old install's copy — the menu puts those
  // under /services/, so send them where the page actually is.
  const asService = "/services" + withSlash;
  if (ROUTES.has(asService)) return asService;
  // A link straight to an uploaded file. The recovery mirrored the pages and
  // the images they show, not every attachment the copy links to — a PDF
  // brochure and a privacy-policy form are both linked and neither was ever
  // downloaded. Returning the raw path would ship a link into a 404, so unwrap
  // it and keep the words. `droppedLinks` in build-report.json lists them.
  if (withSlash.startsWith("/wp-content/")) {
    const file = assetFile(clean);
    if (file) return asset(clean);
    droppedLinks.set("MISSING FILE " + clean, (droppedLinks.get("MISSING FILE " + clean) || 0) + 1);
    return null;
  }
  droppedLinks.set(withSlash, (droppedLinks.get(withSlash) || 0) + 1);
  return null;
};

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
    const ext = /^https?:/i.test(to);
    return `<a${a}href="${esc(to)}"${b}${ext ? ' target="_blank" rel="noopener"' : ""}>${text}</a>`;
  });
  // A paragraph whose whole content was one out-of-scope link is left as a
  // dangling "Learn More About ..." line once the link is unwrapped, so drop it.
  out = out.replace(/<p>\s*(?:Learn|Read|Find out|Discover|Click|See)\b[^<>]{0,90}<\/p>/gi, "");
  out = out.replace(/<table/gi, '<div class="overflow-scroll-x"><table').replace(/<\/table>/gi, "</table></div>");
  return out;
};

// Heading levels in the imported markup jump around — h2 straight to h5 is
// common — because they were chosen for size, not structure. A screen reader
// navigates by that outline, so close the gaps: each heading may be at most one
// level deeper than the one before it, and never an h1 (the page title owns
// that). Headings do not nest, so non-greedy pairing is safe.
const normaliseHeadings = (html) => {
  let prev = 1;
  return String(html ?? "").replace(
    /<h([1-6])([^>]*)>([\s\S]*?)<\/h\1>/gi,
    (whole, lvl, attrs, inner) => {
      const target = Math.max(2, Math.min(Number(lvl), prev + 1));
      prev = target;
      return `<h${target}${attrs}>${inner}</h${target}>`;
    });
};

const demoteH1 = (html) => html.replace(/<(\/?)h1(\s|>)/gi, "<$1h2$2");

// ------------------------------------------------------- theme demo leftovers
// The tooth-fairy theme ships demo widgets in a global block that every
// Elementor page renders. On the live site most of it is hidden by CSS, so the
// practice never saw it — but it IS in the markup. The parent practice's
// rebuild found four FABRICATED AWARDS in the same block; the same markers are
// kept here so they cannot reach this site either.
const DEMO_MARKERS = [
  /dicta sunt explicabo/i,
  /nemo enim ipsam voluptatem/i,
  /\badipiscing elit\b/i,
  /\beusmod tempor\b/i,
  /lorem ipsum/i,
  /^top dental clinic$/i,
  /^best dental practice$/i,
  /^dental laboratory$/i,
  /^annual award$/i,
  /^our professional team$/i,
  /^(silver|gold|platinum) pack$/i,
  /^subscribe for the exclusive updates!?$/i,
];
// Real, but already provided by the site chrome — repeating it inside the page
// body is pure duplication.
const CHROME_MARKERS = [/^contact us$/i, /^office hours$/i];
// Blog teasers and the third-party review widget: 157 posts are out of scope,
// and the reviews strip renders itself from JavaScript that is not shipped.
const TEASER_MARKERS = [/^dental news in katy$/i, /^what people are saying$/i, /^reviews$/i];
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
      || (texts.some((t) => /^contact us$/i.test(t.trim())) && texts.some((t) => /^dentist katy$/i.test(t.trim())));
    const isTeaser = texts.some((t) => TEASER_MARKERS.some((re) => re.test(t.trim())));
    const onlyBadges = items.length > 2 && items.every((b) => b.type === "image" && ACCREDITATION_RE.test(b.src || ""));
    if (isDemo || isChrome || isTeaser || onlyBadges) bad.add(section);
  }
  return blocks.filter((b) => {
    if (bad.has(b.section)) return false;
    if (b.type === "cta" && /^play$/i.test(b.text || "")) return false;
    if (b.type === "image" && ACCREDITATION_RE.test(b.src || "")) return false;
    // The theme's breadcrumb widget, which renders as a heading: "Home",
    // "Home - ABOUT US", "Home > Technology".
    if (b.type === "heading" && /^home(\s*[-–>»|]\s*|$)/i.test((b.text || "").trim())) return false;
    // The newsletter widget's "Click here" is a button to a popup that is gone.
    if (b.type === "cta" && /^click here$/i.test(b.text || "")) return false;
    return true;
  });
};

// ============================================================================
// PRESENTATION
// All markup lives in site/presentation.mjs, composed from site/components.mjs.
// build.mjs stays responsible for data — routes, assets, links, the demo
// stripper — and writes no tags of its own.
// ============================================================================

const NAV_LABELS = new Map();
(function walkNav(items) {
  for (const it of items) {
    if (it.href) NAV_LABELS.set(it.href, it.label);
    if (it.children) walkNav(it.children);
  }
})(NAV);
for (const l of FOOTER_LINKS) if (!NAV_LABELS.has(l.href)) NAV_LABELS.set(l.href, l.label);
NAV_LABELS.set("/faq-page/", "Frequently Asked Questions");
NAV_LABELS.set("/appointment/", "Request an Appointment");
NAV_LABELS.set("/thank-you/", "Thank You");
NAV_LABELS.set("/privacy-policy/", "Privacy Policy");
NAV_LABELS.set("/dental-library/", "Dental Library");
NAV_LABELS.set("/dental-dictionary/", "Dental Dictionary");
NAV_LABELS.set("/services/restorative-dentistry/", "Restorative Dentistry");
for (const [slug, r] of Object.entries(RETITLED)) NAV_LABELS.set(r.route, r.label);
for (const slug of DB_SLUGS) {
  const r = routeOf(slug);
  if (!NAV_LABELS.has(r)) {
    const d = readFrom(CONTENT_DB, slug);
    if (d?.title) NAV_LABELS.set(r, d.title);
  }
}

// SHOUTED TITLES are everywhere in this content; soften them, but leave real
// acronyms alone.
const KEEP_CAPS = /^(TMJ|TMD|FAQ|FAQs|AI|TX|USA|PH|pH|RDA|DMD|DDS|A|Z|I|II|III)$/;
const softenCaps = (s) =>
  s === s.toUpperCase()
    ? s.replace(/[\w®']+/g, (w) => (KEEP_CAPS.test(w) ? w : w[0] + w.slice(1).toLowerCase()))
    : s;

// The <h1> in the extracted markup is unreliable — most Elementor pages put the
// blog teaser strip's "DENTAL NEWS IN KATY" first in document order. So prefer
// the menu label, then the page's own heading, then the <title> tag with its
// site suffix trimmed.
const titleOf = (d) => {
  if (!d) return PRACTICE.name;
  const route = routeOf(d.slug);
  if (NAV_LABELS.has(route)) return NAV_LABELS.get(route);
  if ((d.kind === "service" || d.kind === "article") && d.heading) return d.heading;
  const fromTitle = (d.title || "").split(/\s*\|\s*|\s*[-–—]\s+/)[0].trim()
    .replace(/\s*[-–—]?\s*(Mason Park Dental.*|Dentist Katy.*)$/i, "").trim();
  if (fromTitle) return softenCaps(fromTitle);
  return softenCaps((d.heading || d.slug).trim());
};
// `|| { slug }` matters: an AUTHORED page has no row in either content source,
// so `read` returns null and `titleOf(null)` falls all the way through to the
// practice name — which is how "Restorative Dentistry" came out of the services
// index captioned "Mason Park Dental for Kids". Passing the bare slug lets
// titleOf reach NAV_LABELS by route, which is where an authored page's name is.
const labelFor = (slug) => titleOf(read(slug) || { slug });

const P = makePresentation({
  esc, img, link, rewrite, demoteH1, normaliseHeadings, fixRunOn, softenCaps, stripBoilerplate,
  titleOf, labelFor, routeOf, NAV, FOOTER_LINKS, PRACTICE, HOURS, LOGO,
  SERVICE_SLUGS: [...SERVICE_SLUGS, ...AUTHORED_SERVICE_SLUGS],
  NAV_LABELS, SITE_URL, ROUTES,
});
const { C, renderArticle, renderBlocks, renderEmbed, sidebarCta, pageBody, layout } = P;

// ------------------------------------------------------------------- build
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });

const helpers = {
  esc, asset, img, responsive, link, rewrite, demoteH1, normaliseHeadings, stripBoilerplate,
  titleOf, softenCaps, fixRunOn, routeOf, read, labelFor, wpautop,
  PRACTICE, SITE_URL, C, sidebarCta, renderEmbed, renderBlocks, renderArticle,
  breadcrumbs: C.breadcrumb,
  HOURS, BOOKING: PRACTICE.booking, LOGO,
  SERVICE_SLUGS, ROUTES,
};

const written = [];
const skipped = [];
for (const slug of ALL) {
  if (ONLY && !slug.includes(ONLY)) continue;
  if (SKIP.has(slug)) { skipped.push(slug); continue; }
  const d = read(slug);
  if (!d && !BESPOKE[slug]) continue;
  // META is the authority on a page's description, and the generic renderer
  // prints that description under the page title. Without this line a retitled
  // page keeps the standfirst of the page it used to be: the knee-to-knee guide
  // opened "Meet our Pediatric Dental Team", inherited from `our-team-copy`.
  // A retitled page carries its own title and description in RETITLED, keyed by
  // the slug the content still has rather than the route it now lives at.
  const overrides = { ...(RETITLED[slug] || {}), ...(META[slug] || {}) };
  if (d && overrides.description) d.description = overrides.description;
  const route = routeOf(slug);
  let body;
  // Hand-authored pages quote the same upstream copy, so they need the same
  // run-on repair. Safe over whole markup: the rule needs two lowercase letters
  // before the stop and a capital after, which no path, class or URL here has.
  if (BESPOKE[slug]) body = fixRunOn(BESPOKE[slug](d || { slug }, helpers));
  else if (d.kind === "service" || d.kind === "article") body = renderArticle(d, route);
  else body = renderBlocks(d, route);

  const meta = overrides;
  const sourceTitleBroken = !d?.title || /403|forbidden|^dentist katy$/i.test(d.title);
  const title = meta.title || (sourceTitleBroken ? `${titleOf(d || { slug })} | ${PRACTICE.name}` : d.title);
  const description = meta.description || (sourceTitleBroken ? "" : d.description) || DEFAULT_DESC(titleOf(d || { slug }));
  const html = layout({
    title, description, route, body,
    ogImage: d?.featured?.src ? asset(d.featured.src) : null,
  });
  const outDir = route === "/" ? DIST : path.join(DIST, route.slice(1, -1));
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "index.html"), html);
  written.push({
    slug, route, bytes: html.length,
    template: BESPOKE[slug] ? "bespoke" : (d.source ? "database" : d.kind),
  });
}

// 404 — a static host serves /404.html for unmatched paths.
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
      <div class="button-group is-centered">
        ${C.button({ label: "Back to the homepage", href: "/" })}
        ${C.button({ label: `Call ${PRACTICE.phone}`, href: PRACTICE.phoneHref, variant: "ghost" })}
      </div>
    </div>` }),
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
  console.log(`  ! ${e.count} image(s) still served from ${e.host} — not ours, not in the recovery`);
}
