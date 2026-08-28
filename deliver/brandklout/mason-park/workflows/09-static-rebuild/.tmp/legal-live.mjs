/**
 * Build the four pages of the 2026-08-28 legal revision AGAINST THE DESIGN THAT
 * IS CURRENTLY LIVE, not against the local rebuild.
 *
 *   node legal-live.mjs
 *
 * Output: legal-live/pages/{privacy-policy,terms-of-service,cookie-policy,contacts}.json
 *         — { slug, title, description, html }, the same shape to-instatic.mjs
 *         emits, ready for the converter.
 *
 * WHY THIS EXISTS
 * `dist/` is the redesigned site (Figma system, --brand #8c6349). It has not
 * shipped: masonparkdental.com still serves the 2026-08-27 build (--accent
 * #00bde0), and shipping it is gated on client review. The legal revision could
 * not wait for that gate, so these four pages have to go live inside the OLD
 * chrome. This script takes the chrome verbatim from the export that produced
 * the live pages and swaps only <main>.
 *
 * The COPY comes from site/legal.mjs — the same module site/pages.mjs renders —
 * so the live site and the local rebuild cannot end up saying different things
 * about the practice. When the redesign ships, this script becomes dead and
 * `to-instatic.mjs` covers all 72 pages again; delete it then.
 *
 * WHAT IT REFUSES TO DO
 * If `instatic/` has been regenerated from the redesigned dist, its chrome is
 * the NEW design and splicing it into the live site would publish four pages
 * the live stylesheet cannot style. The guard below stops on exactly that.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { LEGAL_PAGES } from "./site/legal.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(HERE, "instatic", "pages");
const OUT = path.join(HERE, "legal-live", "pages");

// ------------------------------------------------------------------- guard
// The live site's stylesheet still leads on --accent: #00bde0. The redesign
// deleted that token. One grep is the whole difference between splicing into
// the design that is live and splicing into one that is not.
const exportedCss = fs.readFileSync(path.join(HERE, "instatic", "site.css"), "utf8");
if (!exportedCss.includes("--accent: #00bde0")) {
  console.error(
    "instatic/ no longer holds the design that is live on masonparkdental.com.\n" +
    "It looks like `to-instatic.mjs` was re-run after the redesign. If the redesign\n" +
    "has shipped, this script is obsolete - publish all 72 pages the normal way and\n" +
    "delete it. If it has not, restore instatic/ from git before running this.",
  );
  process.exit(1);
}

// ---------------------------------------------------------------- helpers
/** Instatic routes carry no trailing slash: `/cookie-policy/` -> `/cookie-policy`. */
const route = (href) => (href === "/" ? "/" : href.replace(/\/+$/, ""));
const deSlash = (html) => html.replace(/href="(\/[^"#?]*?)\/"/g, (_, p) => `href="${route(p)}"`);

const readPage = (slug) => JSON.parse(fs.readFileSync(path.join(SRC, slug + ".json"), "utf8"));

/** Swap the whole <main> of a stored page for new markup, leaving chrome alone. */
const replaceMain = (html, main) => {
  const i = html.indexOf("<main");
  const j = html.indexOf("</main>");
  if (i === -1 || j === -1) throw new Error("no <main> in the stored page");
  return html.slice(0, i) + main + html.slice(j + "</main>".length);
};

/**
 * The old design's page opening, copied byte-for-byte from what is live rather
 * than re-derived: plain hero, breadcrumb, then one container-medium column.
 */
const legalMain = ({ heading, sub, body }) => `<main class="main-wrapper" id="main">
<section class="section_hero hero_component is-plain">
  <div class="padding-global"><div class="container-large"><div class="padding-section-large">
    <p class="text-style-eyebrow">Katy, TX</p><h1 class="heading-style-h1">${heading}</h1><div class="spacer-small"></div><p class="text-size-medium">${sub}</p>
  </div></div></div>
</section>
<div class="padding-global"><div class="container-large">
  <nav class="breadcrumb_component" aria-label="Breadcrumb">
    <span class="breadcrumb_item"><a href="/">Home</a></span><span class="breadcrumb_item">${heading}</span>
  </nav>
</div></div>
<section class="section_legal">
  <div class="padding-global">
    <div class="container-medium">
      <div class="padding-section-large"><div class="text-rich-text">
${deSlash(body)}
      </div></div>
    </div>
  </div>
</section>
</main>`;

fs.rmSync(path.join(HERE, "legal-live"), { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const written = [];

// ------------------------------------------------- the three legal documents
// privacy-policy and terms-of-service already have rows in the CMS; cookie-policy
// is new and borrows privacy-policy's chrome, which is identical on every page.
for (const [slug, doc] of Object.entries(LEGAL_PAGES)) {
  const donor = fs.existsSync(path.join(SRC, slug + ".json")) ? slug : "privacy-policy";
  const page = readPage(donor);
  const out = {
    slug: "/" + slug,
    title: doc.title,
    description: doc.description,
    html: replaceMain(page.html, legalMain({ heading: doc.heading, sub: doc.sub, body: doc.body() })),
  };
  fs.writeFileSync(path.join(OUT, slug + ".json"), JSON.stringify(out, null, 1));
  written.push([slug, donor === slug ? "own chrome" : `chrome from /${donor}`, out.html.length]);
}

// ------------------------------------------------------------------ contacts
// Instatic's publisher strips <iframe> from a page body outright and publishes
// `frame-src 'none'`, so BOTH embeds on the live contact page render as empty
// sections today. The only way to get an iframe onto a published Instatic page
// is a `webzite.embed-origins` Embed block, which also widens frame-src for that
// one page. place-legal-embeds.mjs does that swap on the node graph after
// conversion; here we only leave it a placeholder to find.
const CONTACT_FORM_ID = "JuzM9SxuJMPDMwfO6cgj";
const OLD_FORM_ID = "9tzFcq7rgDGIvq5wJfWL";

const contacts = readPage("contacts");
let html = contacts.html;

const formBlock = new RegExp(
  `<div class="embed_component is-form">\\s*<iframe data-src="[^"]*${OLD_FORM_ID}"[^>]*></iframe>\\s*</div>`,
);
if (!formBlock.test(html)) throw new Error(`the old form embed (${OLD_FORM_ID}) is not on the stored contacts page`);
html = html.replace(formBlock, `<div data-embed-slot="form" data-ghl-form="${CONTACT_FORM_ID}" data-embed-height="1398"></div>`);

const mapBlock = /<div class="embed_component">\s*<iframe data-src="(https:\/\/www\.google\.com\/maps\/embed[^"]*)"[^>]*><\/iframe>\s*<\/div>/;
const mapMatch = html.match(mapBlock);
if (!mapMatch) throw new Error("the map embed is not on the stored contacts page");
html = html.replace(mapBlock, `<div data-embed-slot="map" data-embed-url="${mapMatch[1]}" data-embed-height="420"></div>`);

fs.writeFileSync(path.join(OUT, "contacts.json"), JSON.stringify({
  slug: "/contacts",
  title: contacts.title,
  description: contacts.description,
  html,
}, null, 1));
written.push(["contacts", `form ${OLD_FORM_ID} -> ${CONTACT_FORM_ID}, map slot`, html.length]);

for (const [slug, note, bytes] of written) {
  console.log(`${slug.padEnd(18)} ${String(bytes).padStart(7)} b  ${note}`);
}
console.log(`\n${written.length} pages -> legal-live/pages/`);
