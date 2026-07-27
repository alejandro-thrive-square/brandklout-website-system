/**
 * CMS-IMPORT-PREP: turn .tmp/portfolio_projects_cms_IMPORT.csv into the exact
 * JSON payloads the Webflow Data API expects (create_collection_items), so an
 * agent can import via MCP without re-parsing the CSV in-context.
 *
 *   node cms-import-prep.mjs
 *
 * Emits into .tmp/cms-import/:
 *   schema.json        — field definitions to create on both collections
 *   categories.json    — fieldData array for the Categories collection (4 items)
 *   projects.json      — fieldData array for the Projects collection (15 items);
 *                        `category` holds the category NAME — swap it for the
 *                        created category item ID before sending.
 *
 * List fields ("- line" bullets) become Rich Text <ul><li> HTML. Tags stay a
 * comma-separated PlainText string (split into .pj-tag chips by an embed).
 */
import path from "node:path";
import url from "node:url";
import fs from "node:fs";

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const CSV = path.join(HERE, ".tmp", "portfolio_projects_cms_IMPORT.csv");
const OUT = path.join(HERE, ".tmp", "cms-import");

function parseCsv(text) {
  const rows = [];
  let row = [], field = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQ = false;
      else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((f) => f !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== "" || row.length) { row.push(field); if (row.some((f) => f !== "")) rows.push(row); }
  const [header, ...data] = rows;
  return data.map((r) => Object.fromEntries(header.map((h, i) => [h, (r[i] ?? "").trim()])));
}

// "- a\n- b" → <ul><li>a</li><li>b</li></ul>
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
function bulletsToRichText(text) {
  const lines = text.split(/\r?\n/).map((l) => l.replace(/^\s*-\s*/, "").trim()).filter(Boolean);
  return lines.length ? `<ul>${lines.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>` : "";
}

const items = parseCsv(fs.readFileSync(CSV, "utf8"));

// Category display order follows the schema doc (test-01/portfolio_cms_airtable_schema.md).
const CATEGORY_ORDER = [
  "Featured Capstone",
  "Acquisition & Development Underwriting",
  "Advanced Finance — Case Studies",
  "Planning & Site Analysis",
];
// Match order names dash-insensitively (CSV uses "-", the schema doc "—").
const dashNorm = (s) => s.replace(/[–—]/g, "-");
const seen = [...new Set(items.map((i) => i["Category"]))];
const ordered = CATEGORY_ORDER.map((c) => seen.find((s) => dashNorm(s) === dashNorm(c))).filter(Boolean);
const categories = [...ordered, ...seen.filter((c) => !ordered.includes(c))];

const schema = {
  categories: {
    collection: { displayName: "Categories", singularName: "Category", slug: "categories" },
    fields: [{ type: "Number", displayName: "Sort Order" }],
  },
  projects: {
    // Collection slug MUST be "projects" — homepage cards link to /projects/<slug>.
    collection: { displayName: "Projects", singularName: "Project", slug: "projects" },
    fields: [
      { type: "PlainText", displayName: "Subtitle" },
      { type: "PlainText", displayName: "Overline type" },
      { type: "Reference", displayName: "Category", metadata: { collectionId: "<CATEGORIES_COLLECTION_ID>" } },
      { type: "PlainText", displayName: "Description" },
      { type: "PlainText", displayName: "Tags", helpText: "Comma-separated; rendered as .pj-tag chips" },
      { type: "Switch", displayName: "Is featured" },
      { type: "PlainText", displayName: "Featured context" },
      { type: "PlainText", displayName: "Featured metric 1 label" },
      { type: "PlainText", displayName: "Featured metric 1 value" },
      { type: "PlainText", displayName: "Featured metric 2 label" },
      { type: "PlainText", displayName: "Featured metric 2 value" },
      { type: "PlainText", displayName: "Featured metric 3 label" },
      { type: "PlainText", displayName: "Featured metric 3 value" },
      { type: "PlainText", displayName: "Featured metric 4 label" },
      { type: "PlainText", displayName: "Featured metric 4 value" },
      { type: "RichText", displayName: "Analysis & design list" },
      { type: "RichText", displayName: "Financial & deliverables list" },
    ],
  },
};

const categoryItems = categories.map((name, i) => ({
  name,
  slug: name.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
  "sort-order": i + 1,
}));

// Field slugs + option IDs from the LIVE Projects collection 6a38ce38276585f22ed20012
// (inspected 2026-07-07; category/is-featured are Option fields — API takes option IDs;
// list fields were recreated as RichText and got tombstone `-2` slugs).
const CATEGORY_OPTION = {
  "Featured Capstone": "d2516144d354c013175280e09c476379",
  "Acquisition & Development Underwriting": "80a48bc976849529443d3ea16a2b95bf",
  "Advanced Finance - Case Studies": "a44b50a6c4ab21f3c9b992c4b779ea9b",
  "Planning & Site Analysis": "01288da3bfe4ef440143c3b74d5b3861",
};
const FEATURED_OPTION = { true: "ff7c43798511532edf90ca3257e16552", false: "636631e65d8a697534f876b318bcce03" };

const projectItems = items.map((it) => {
  const catId = CATEGORY_OPTION[it["Category"]];
  if (!catId) throw new Error(`No option ID for category "${it["Category"]}"`);
  return {
    name: it["Name"],
    slug: it["Slug"],
    "project-name": it["Project name"],
    subtitle: it["Subtitle"],
    "overline-type": it["Overline type"],
    category: catId,
    description: it["Description"],
    tags: it["Tags"],
    "is-featured": FEATURED_OPTION[it["Is featured"].toLowerCase()],
    "featured-context": it["Featured context"],
    "featured-metric-1-label": it["Featured metric 1 label"],
    "featured-metric-1-value": it["Featured metric 1 value"],
    "featured-metric-2-label": it["Featured metric 2 label"],
    "featured-metric-2-value": it["Featured metric 2 value"],
    "featured-metric-3-label": it["Featured metric 3 label"],
    "featured-metric-3-value": it["Featured metric 3 value"],
    "featured-metric-4-label": it["Featured metric 4 label"],
    "featured-metric-4-value": it["Featured metric 4 value"],
    "analysis-design-list-2": bulletsToRichText(it["Analysis & design list"]),
    "financial-deliverables-list-2": bulletsToRichText(it["Financial & deliverables list"]),
  };
});

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "schema.json"), JSON.stringify(schema, null, 2));
fs.writeFileSync(path.join(OUT, "categories.json"), JSON.stringify(categoryItems, null, 2));
fs.writeFileSync(path.join(OUT, "projects.json"), JSON.stringify(projectItems, null, 2));
// Batches of 5, compact JSON, ready to paste into create_collection_items fieldData.
for (let b = 0; b * 5 < projectItems.length; b++) {
  fs.writeFileSync(path.join(OUT, `projects-batch-${b + 1}.json`), JSON.stringify(projectItems.slice(b * 5, b * 5 + 5)));
}
console.log(`categories: ${categoryItems.length}  (${categories.join(" | ")})`);
console.log(`projects:   ${projectItems.length} in ${Math.ceil(projectItems.length / 5)} batches`);
console.log(`featured:   ${projectItems.filter((p) => p["is-featured"] === "ff7c43798511532edf90ca3257e16552").map((p) => p.slug).join(", ")}`);
console.log(`empty subtitles: ${projectItems.filter((p) => !p.subtitle).length}`);
console.log(`out: ${OUT}`);
