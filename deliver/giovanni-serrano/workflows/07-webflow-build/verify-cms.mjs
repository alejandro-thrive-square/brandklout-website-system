/**
 * VERIFY-CMS: audit CMS wiring on the published staging site with zero login
 * and near-zero token cost (only this compact report enters agent context).
 *
 *   node verify-cms.mjs [staging-base] [--slug-prefix projects]
 * e.g.
 *   node verify-cms.mjs                          # defaults to giovanni-serrano.webflow.io
 *   node verify-cms.mjs --slug-prefix portfolio  # if the collection slug differs
 *
 * Checks, driven by .tmp/portfolio_projects_cms_IMPORT.csv (source of truth):
 *   1. HOME PAGE — does the portfolio section use a Collection List
 *      (w-dyn-list/w-dyn-item markers) and does every project name render?
 *   2. TEMPLATE PAGE — does /<slug-prefix>/<item-slug> resolve for every CSV
 *      item, and which CSV field values actually appear on it (i.e. which
 *      fields are bound)?
 *
 * Requires CMS items to be published to staging first; a static (unbound)
 * portfolio section reports "STATIC" rather than failing silently.
 */
import path from "node:path";
import url from "node:url";
import fs from "node:fs";

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const CSV = path.join(HERE, ".tmp", "portfolio_projects_cms_IMPORT.csv");

const args = process.argv.slice(2);
const prefixIdx = args.indexOf("--slug-prefix");
const slugPrefix = prefixIdx >= 0 ? args.splice(prefixIdx, 2)[1] : "projects";
const base = (args[0] || "https://giovanni-serrano.webflow.io").replace(/\/+$/, "");

// Minimal quote-aware CSV parser (handles multiline quoted fields).
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
  return data.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ""])));
}

const items = parseCsv(fs.readFileSync(CSV, "utf8"));

async function get(u) {
  const r = await fetch(u, { redirect: "manual" });
  return { status: r.status, html: r.status === 200 ? await r.text() : "" };
}

// Normalize whitespace plus the entity/typography drift between the CSV and
// rendered HTML (&amp;, en/em dashes, curly quotes) so matches compare content.
const norm = (s) =>
  s
    .replace(/&amp;/g, "&").replace(/&#39;|&#x27;/g, "'").replace(/&quot;/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim();

// Fields short enough to reliably substring-match against rendered HTML.
const CHECK_FIELDS = [
  "Project name", "Subtitle", "Overline type", "Category",
  "Featured context",
  "Featured metric 1 label", "Featured metric 1 value",
  "Featured metric 2 label", "Featured metric 2 value",
  "Featured metric 3 label", "Featured metric 3 value",
  "Featured metric 4 label", "Featured metric 4 value",
];

(async () => {
  let fail = 0;

  // --- 1. home page ---
  const home = await get(base + "/");
  if (home.status !== 200) { console.log(`HOME ${home.status} — staging unreachable`); process.exit(1); }
  const dynLists = (home.html.match(/w-dyn-list/g) || []).length;
  const dynItems = (home.html.match(/w-dyn-item/g) || []).length;
  const emptyBinds = (home.html.match(/w-dyn-bind-empty/g) || []).length;
  console.log(`HOME ${base}/`);
  console.log(`  collection lists: ${dynLists}${dynLists === 0 ? "  << STATIC — portfolio not bound to CMS" : ""}`);
  if (dynLists > 0) console.log(`  collection items: ${dynItems}   empty bindings: ${emptyBinds}`);
  if (dynLists === 0) fail++;
  const homeHtml = norm(home.html);
  for (const it of items) {
    const name = norm(it["Project name"] || it["Name"]);
    const ok = homeHtml.includes(name);
    console.log(`  ${ok ? "OK  " : "MISS"} ${name}`);
    if (!ok) fail++;
  }

  // --- 2. template pages ---
  console.log(`\nTEMPLATE /${slugPrefix}/<slug>`);
  for (const it of items) {
    const slug = it["Slug"];
    const page = await get(`${base}/${slugPrefix}/${slug}`);
    if (page.status !== 200) {
      console.log(`  ${page.status}  /${slugPrefix}/${slug}`);
      fail++;
      continue;
    }
    const html = norm(page.html);
    // Static-clone guard: if a page other than the featured capstone shows the
    // capstone's name in its hero h1, the template is unbound — per-field results
    // would be false positives. Scoped to the h1 because the capstone's name
    // legitimately appears elsewhere (related cards).
    const h1 = (html.match(/<h1[^>]*>[\s\S]*?<\/h1>/) || [""])[0];
    if (slug !== "4855-college-ave" && h1.includes("4855 College Ave")) {
      console.log(`  UNBOUND /${slugPrefix}/${slug} — hero still renders static 4855 content`);
      fail++;
      continue;
    }
    const missing = CHECK_FIELDS.filter((f) => it[f] && !html.includes(norm(it[f])));
    if (missing.length === 0) console.log(`  OK   /${slugPrefix}/${slug} — all ${CHECK_FIELDS.length} checked fields bound`);
    else { console.log(`  PART /${slugPrefix}/${slug} — missing: ${missing.join(", ")}`); fail++; }
  }

  console.log(`\n${fail === 0 ? "PASS — CMS wiring verified on both pages" : `FAIL — ${fail} problem(s) above`}`);
  process.exit(fail === 0 ? 0 : 1);
})();
