// Assembles the Stone Med Spa site into ../final-site.
//
// Same shape as the Stone Surgical Arts and Dr. Nahlah builds, deliberately, so
// every Instatic site in this repo is maintained the same way:
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
// WHAT IS DIFFERENT HERE: treatments-data.mjs. The menu is seven records, and
// four separate things on the site are views of those same seven — the hero's
// interval rail, the ledger table, the concern pills, and the vitals rail on a
// treatment page. All four are GENERATED below rather than hand-written, so a
// treatment cannot appear on the menu with one interval and in the year grid
// with another. The sibling site learned this the expensive way: it had a
// treatments-data.mjs, the pages drifted from it, and it was deleted.
//
// Usage: node build-site.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TREATMENTS, CATEGORIES, CONCERNS, byCategory } from "./treatments-data.mjs";

const SRC = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(SRC, "..", "final-site");
const read = (p) => fs.readFileSync(path.join(SRC, p), "utf8");

const seo = JSON.parse(read("seo.json"));
const head = read("partials/head.html");
const navbar = read("partials/navbar.html");
const drawer = read("partials/drawer.html");
const cta = read("partials/cta.html");
const footer = read("partials/footer.html");

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/* --- the page table -------------------------------------------------------
   THE ELEVEN CORE PAGES, from Asana task 1218112701145002 "Core Pages -
   MedSpa" and its eleven subtasks, which is the only page list this pillar has
   ever had. The Asana names are in the comments; the slugs are ours.

   `photoHero` is true only where the navbar sits over a photograph and
   therefore starts transparent. On this site that is the home page and nothing
   else, which is the deliberate difference from Surgical Arts, where every
   interior page opens full-bleed — see the note at the top of 49-pagehead.css.

   `cta` false suppresses the shared closing band on a page that already ends in
   its own conversion moment. Two pages do: the booking page, which IS the
   conversion, and the thank-you page, which is past it.

   `motion` ships the GSAP vendor bundle. It is FALSE ON EVERY PAGE right now.
   Nothing on this site currently uses GSAP — the reveals are IntersectionObserver
   in 00-runtime.js and everything else is CSS — so shipping 125KB to do nothing
   would be waste. The flag is kept because the sibling build proved the split is
   what makes adding an animated page cheap later. */
const PAGES = [
  { slug: "index", src: "home", photoHero: true }, //            1. Home
  { slug: "about", src: "about" }, //                            2. About Us
  { slug: "meet-the-doctor", src: "meet-the-doctor" }, //        3. Meet The Doctor
  { slug: "team", src: "team" }, //                              4. Meet the Team
  { slug: "treatments", src: "treatments" }, //                  5. Services Overview
  { slug: "botox", src: "botox" }, //                            6. Service Page Sample (Botox)
  { slug: "results", src: "results" }, //                        7. Testimonials / Before & After
  { slug: "financing", src: "financing" }, //                    8. Financing
  { slug: "book", src: "book", cta: false }, //                  9. Book Consultation
  { slug: "membership", src: "membership" }, //                 10. Membership Plan
  { slug: "thank-you", src: "thank-you", cta: false }, //       11. General Thank You Page
];

/* --- generated views of treatments-data.mjs ------------------------------ */

/** The hero's interval rail: every treatment, and how often it recurs. */
function heroRail() {
  return TREATMENTS.map(
    (t) => `        <a class="hero_rail-item" href="treatments.html#${t.slug}">
          <span class="hero_rail-name">${esc(t.name)}</span>
          <span class="hero_rail-interval">${esc(t.cadence)}</span>
        </a>`
  ).join("\n");
}

/** The concern pills. Buttons, not links — they filter, they do not navigate. */
function concernPills() {
  return CONCERNS.map(
    (c) => `          <li><button class="concerns_button" type="button" data-concern="${c.id}" aria-pressed="false">${esc(
      c.name
    )}</button></li>`
  ).join("\n");
}

/* The concerns a treatment addresses, written out.

   The opened row used to repeat Downtime here, which is already one of the four
   columns in the summary directly above it — the reader had just read it. This
   is the one fact about a treatment that appears nowhere else on the row, and
   it doubles as a hint that the concern pills at the top of the page exist. */
const concernNames = (t) =>
  t.concerns.map((id) => CONCERNS.find((c) => c.id === id).name).join(", ");

/** One ledger row. A <details> so it opens with no JavaScript at all. */
function ledgerRow(t) {
  const link = t.page
    ? `<a class="button is-link" href="${t.page}">Read the full page <span class="button_arrow">&rarr;</span></a>`
    : `<span class="ledger_nopage">A full page for this treatment is not written yet. Dr. Stone covers it in a consultation.</span>`;
  return `          <details class="ledger_row" id="${t.slug}" data-treatment data-concerns="${t.concerns.join(" ")}">
            <summary class="ledger_summary">
              <span class="ledger_name">${esc(t.name)}</span>
              <span class="ledger_cell"><span class="ledger_cell-key">Appointment</span><span class="ledger_cell-val">${esc(
                t.appointment
              )}</span></span>
              <span class="ledger_cell"><span class="ledger_cell-key">Shows</span><span class="ledger_cell-val">${esc(
                t.onset
              )}</span></span>
              <span class="ledger_cell"><span class="ledger_cell-key">Lasts</span><span class="ledger_cell-val">${esc(
                t.lasts
              )}</span></span>
              <span class="ledger_cell is-area"><span class="ledger_cell-key">Downtime</span><span class="ledger_cell-val">${esc(
                t.downtime
              )}</span></span>
              <span class="ledger_chev" aria-hidden="true"></span>
            </summary>
            <div class="ledger_detail">
              <div>
                <p class="text-size-medium ledger_lede">${esc(t.lede)}</p>
                <div class="ledger_meta">
                  <span class="ledger_meta-item"><strong>${esc(t.area)}</strong>Where it is placed</span>
                  <span class="ledger_meta-item"><strong>${esc(concernNames(t))}</strong>What it addresses</span>
                </div>
                <div class="ledger_actions">
                  ${link}
                  <a class="button is-small is-secondary" href="book.html">Ask about this</a>
                </div>
              </div>
              <figure class="ledger_figure">
                <img src="assets/${t.portrait}" alt="" width="900" height="675" loading="lazy">
              </figure>
            </div>
          </details>`;
}

/** The whole table, grouped by shelf. */
function ledger() {
  return CATEGORIES.map(
    (c) => `        <div class="ledger_group" data-group>
          <div class="ledger_group-head">
            <figure class="ledger_group-figure">
              <img src="assets/${c.image}" alt="" width="240" height="240" loading="lazy">
            </figure>
            <h2 class="heading-style-h3">${esc(c.name)}</h2>
            <p class="ledger_group-blurb">${esc(c.blurb)}</p>
          </div>
          <div class="ledger_table">
${byCategory(c.id).map(ledgerRow).join("\n")}
          </div>
        </div>`
  ).join("\n");
}

/* --- the year grid --------------------------------------------------------
   THE SAMPLE PLAN. Five of the seven treatments, on the cadence a patient who
   started in January would actually run. It is an ILLUSTRATION and the page
   says so; it is not this practice's protocol and clinical review is
   outstanding on every interval in it (see treatments-data.mjs).

   Five rows, not seven. Seven rows of dots is a chart nobody reads, and the two
   left out — Dysport & Jeuveau, and Hair Restoration — are the two that would
   duplicate a row already there (they run the same cadence as Botox and as PRP
   respectively). If a sixth is ever wanted, add it here; the grid grows. */
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const PLAN = [
  { slug: "botox", note: "Every 3 to 4 months, indefinitely", months: [1, 4, 7, 10] },
  { slug: "dermal-fillers", note: "Topped up at about a year", months: [2, 11] },
  { slug: "morpheus8", note: "A series of three, a month apart", months: [3, 4, 5] },
  { slug: "chemical-peels", note: "Twice, out of the strong sun", months: [6, 9] },
  { slug: "prp", note: "A series of three, a month apart", months: [7, 8, 9] },
];

function cadenceGrid() {
  const name = (slug) => TREATMENTS.find((t) => t.slug === slug).name;

  const header = `          <div class="cadence_months">
            <span class="cadence_months-spacer">Treatment</span>
${MONTHS.map((m) => `            <span class="cadence_month">${m}</span>`).join("\n")}
          </div>`;

  const rows = PLAN.map((row) => {
    const first = Math.min.apply(null, row.months);
    const last = Math.max.apply(null, row.months);
    // Column 1 is the label, so month N lives in grid column N + 1. The run
    // spans from the first appointment to the last, inclusive.
    const run =
      first === last
        ? ""
        : `            <span class="cadence_run is-run-${row.slug}"></span>\n`;
    // Every cell carries its month class so the grid places it explicitly — see
    // the long note above .cadence_cell in 52-cadence.css for why auto
    // placement cannot be used in a row that also contains the run.
    const cells = MONTHS.map((m, i) => {
      const month = i + 1;
      const on = row.months.indexOf(month) !== -1;
      if (!on) return `            <span class="cadence_cell is-m${month}"></span>`;
      const cls = month === first ? "cadence_dot is-start" : "cadence_dot";
      const what = month === first ? "First appointment" : "Appointment";
      return `            <span class="cadence_cell is-m${month}"><span class="${cls}"><span class="u-sr-only">${what}: ${m}</span></span></span>`;
    }).join("\n");
    return `          <div class="cadence_row">
            <span class="cadence_label">
              <span class="cadence_label-name">${esc(name(row.slug))}</span>
              <span class="cadence_label-interval">${esc(row.note)}</span>
            </span>
${run}${cells}
          </div>`;
  }).join("\n");

  // The phone version: the same plan read by month. Months with nothing in them
  // are kept and say so, because the gaps are the point — the plan is mostly
  // months in which you do not come in.
  const byMonth = MONTHS.map((m, i) => {
    const month = i + 1;
    const due = PLAN.filter((r) => r.months.indexOf(month) !== -1).map((r) => name(r.slug));
    const empty = due.length === 0;
    const items = empty
      ? `              <li>Nothing due</li>`
      : due.map((d) => `              <li>${esc(d)}</li>`).join("\n");
    return `          <div class="cadence_bymonth-item${empty ? " is-empty" : ""}">
            <span class="cadence_bymonth-month">${m}</span>
            <ul class="cadence_bymonth-list">
${items}
            </ul>
          </div>`;
  }).join("\n");

  return `        <div class="cadence_grid">
${header}
${rows}
        </div>
        <div class="cadence_legend">
          <span class="cadence_legend-item"><span class="cadence_legend-dot is-start"></span>First appointment</span>
          <span class="cadence_legend-item"><span class="cadence_legend-dot"></span>Repeat appointment</span>
          <span class="cadence_legend-item">Every row is a treatment; every column is a month.</span>
        </div>
        <div class="cadence_bymonth">
${byMonth}
        </div>`;
}

/** The vitals rail on a treatment detail page. */
function vitals(slug) {
  const t = TREATMENTS.find((x) => x.slug === slug);
  if (!t) throw new Error(`treatments-data.mjs has no treatment "${slug}"`);
  const rows = [
    ["Appointment", t.appointment],
    ["Results show", t.onset],
    ["Results last", t.lasts],
    ["Downtime", t.downtime],
    ["Areas treated", t.area],
  ];
  return rows
    .map(
      ([k, v]) => `            <div class="detail_vital">
              <span class="detail_vital-key">${esc(k)}</span>
              <span class="detail_vital-val">${esc(v)}</span>
            </div>`
    )
    .join("\n");
}

/* --- the generated plan stylesheet ----------------------------------------
   THE ONE STYLESHEET THIS BUILD WRITES RATHER THAN READS.

   Each run in the year grid spans from its row's first appointment to its last,
   which is a different pair of grid columns per row and therefore a computed
   value. The obvious home for a computed value is a style attribute on the
   element, and that is what this did first — until audit.mjs failed the build
   for it, correctly. Client-First forbids inline styles, and more practically
   the Instatic conversion does not carry a style attribute across reliably, so
   a span written inline is a span that silently vanishes at publish.

   So the spans are emitted as classes into a real stylesheet, from the same
   PLAN constant that emits the dots. The two cannot disagree.

   Written into css/ BEFORE bundle() reads that directory, so it lands in the
   cascade at its filename position like every other stylesheet. Same technique
   as get-fonts.mjs writing 03-fonts.css on the sibling build.
   DO NOT HAND-EDIT — edit PLAN above and rebuild. */
const planRules = PLAN.map((row) => {
  const first = Math.min.apply(null, row.months);
  const last = Math.max.apply(null, row.months);
  const span = last - first + 1;
  // Column 1 is the label, so month N is grid column N + 1, and the run's end
  // edge is one line past its last dot.
  //
  // THE MARGIN IS WHAT MAKES THE LINE MEET THE DOTS. A run spanning `span`
  // columns fills those columns edge to edge, but the dots are CENTRED in the
  // first and last of them, so the bare line overhangs each end dot by half a
  // column and reads as sloppy rather than as a measured interval. A grid
  // item's percentage margin resolves against its own grid area — which is
  // exactly this span — so half a column is 100/(2 * span) per cent, and the
  // line lands dead on both dots at every width.
  return (
    `.cadence_run.is-run-${row.slug} {\n` +
    `  grid-column: ${first + 1} / ${last + 2};\n` +
    `  margin-inline: ${(100 / (2 * span)).toFixed(4)}%;\n}`
  );
}).join("\n");
fs.writeFileSync(
  path.join(SRC, "css", "60-cadence-plan.css"),
  `/* GENERATED BY build-site.mjs FROM THE PLAN CONSTANT. Do not hand-edit.\n   One rule per row of the year grid: the columns that row's run spans. */\n${planRules}\n`,
  "utf8"
);

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
function seoBlock(slug) {
  const d = seo.pages[slug];
  if (!d) throw new Error(`seo.json has no entry for "${slug}"`);
  const url = seo.site.origin + (slug === "index" ? "/" : `/${slug}`);
  const image = seo.site.origin + seo.site.ogImage;
  const out = [
    `<title>${esc(d.title)}</title>`,
    `<meta name="description" content="${esc(d.description)}">`,
    `<link rel="canonical" href="${url}">`,
  ];
  // The thank-you page is a conversion endpoint, not a landing page. It must
  // never rank, and it must not be the thing a share card previews.
  if (d.noindex) out.push(`<meta name="robots" content="noindex, follow">`);
  out.push(
    `<meta property="og:site_name" content="${esc(seo.site.name)}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:title" content="${esc(d.ogTitle || d.title)}">`,
    `<meta property="og:description" content="${esc(d.ogDescription || d.description)}">`,
    `<meta property="og:image" content="${image}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${esc(d.ogTitle || d.title)}">`,
    `<meta name="twitter:description" content="${esc(d.ogDescription || d.description)}">`
  );
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

// The motion vendor bundle, emitted as a separate asset. No page opts in today
// (see the PAGES table), so this is written and not linked. It is still written
// because the moment one page sets motion: true it has to exist, and a build
// that half-ships a feature is worse than one that ships an unused asset.
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

// Copy the image assets across. A leading underscore marks a build-time aid
// rather than part of the site. Directories are recursed, because assets/fonts/
// holds the self-hosted typefaces and copyFileSync throws on a directory.
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

  // The generated views. Done on the body only — no partial carries one.
  body = body
    .replace("{{HERO_RAIL}}", heroRail)
    .replace("{{CONCERNS}}", concernPills)
    .replace("{{LEDGER}}", ledger)
    .replace("{{CADENCE_GRID}}", cadenceGrid)
    .replace(/\{\{VITALS:([a-z0-9-]+)\}\}/g, (_, slug) => vitals(slug));

  // `aria-current="page"` rather than a class, in the bar, the drawer and the
  // footer. 20-navbar.css already styles the attribute selector, so the marker
  // is meaningful to a screen reader first and visible second.
  const cur = (s) =>
    s.replace(/\{\{CUR_([A-Z0-9_]+)\}\}/g, (_, key) =>
      key.toLowerCase().replace(/_/g, "-") === page.slug ? ' aria-current="page"' : ""
    );
  const nav = cur(navbar).replace("{{NAV_MODE}}", page.photoHero ? "" : " is-static");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
${head.replace("{{SEO}}", seoBlock(page.slug))}
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
<div class="page-wrapper">
${nav}
${cur(drawer)}
<main class="main-wrapper" id="main">
${body}
${
  page.cta === false
    ? ""
    : body.includes('id="contact"')
      ? cta
      : cta.replace('<section class="section_close close_component"', '<section class="section_close close_component" id="contact"')
}
</main>
${cur(footer)}
</div>
${page.motion ? '<script src="assets/vendor.js" defer></script>\n' : ""}<script src="assets/site.js" defer></script>
</body>
</html>
`;

  fs.writeFileSync(path.join(OUT, `${page.slug}.html`), html, "utf8");
  built.push(`${page.slug}.html`.padEnd(22) + `${(html.length / 1024).toFixed(1)}KB`);
}

// A leftover {{TOKEN}} means a partial, a page and this file disagree. Fail
// loudly rather than shipping a page with a placeholder in it.
let bad = 0;
for (const page of PAGES) {
  const html = fs.readFileSync(path.join(OUT, `${page.slug}.html`), "utf8");
  const stray = html.match(/\{\{[A-Z_][A-Z0-9_:-]*\}\}/g);
  if (stray) {
    console.error(`UNRESOLVED in ${page.slug}.html: ${[...new Set(stray)].join(", ")}`);
    bad++;
  }
}
if (bad) process.exitCode = 1;

console.log(built.join("\n"));
const kb = (f) => (fs.statSync(path.join(OUT, "assets", f)).size / 1024).toFixed(1);
console.log(`\nsite.css   ${kb("site.css")}KB`);
console.log(`site.js    ${kb("site.js")}KB`);
console.log(`vendor.js  ${kb("vendor.js")}KB  (written, linked by no page — see PAGES)`);
console.log(`\n${TREATMENTS.length} treatments, ${CATEGORIES.length} categories, ${CONCERNS.length} concerns, ${PAGES.length} pages.`);
