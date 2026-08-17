// Check this package against the PUBLISHED Webflow site, page by page.
//
// Why this exists: edits made in the Designer do not come back here on their
// own, and on 2026-08-10 they had drifted far enough that the local package no
// longer matched what the client had signed off on. This is the tool that
// closes that loop. Run it after anyone touches the site in Webflow.
//
// Usage:
//   node site-src/build-site.mjs
//   node webflow-parity.mjs              # fetches live pages, then diffs
//   node webflow-parity.mjs --offline    # reuse a previous fetch in .parity/
//
// Reads: final-site/*.html (local) vs https://dr-nahlah.webflow.io (published).
// Writes: .parity/<slug>.html  (the fetched pages, so a re-run can be offline)
//
// NOTE ON EXTRACTION ORDER: HTML comments are stripped BEFORE <script>/<style>.
// The page sources contain the literal words "<script>" and "<style>" inside
// comments, so stripping elements first lets a comment open a match that runs
// to the next real </script> and silently swallows ~10KB of prose. That bug
// made seven pages look unchanged when they were not.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const LOCAL = path.join(HERE, "final-site");
const CACHE = path.join(HERE, ".parity");
const ORIGIN = process.env.PARITY_ORIGIN || "https://dr-nahlah.webflow.io";
const OFFLINE = process.argv.includes("--offline");

// published path -> local built file
const PAGES = [
  ["", "index"], ["dental-implants", "dental-implants"], ["all-on-4", "all-on-4"],
  ["implant-cost", "implant-cost"], ["sedation-dentistry", "sedation-dentistry"],
  ["smile-makeover", "smile-makeover"], ["veneers", "veneers"],
  ["smile-gallery", "smile-gallery"], ["patient-stories", "patient-stories"],
  ["meet-dr-nahlah", "meet-dr-nahlah"], ["contact", "contact"],
];

const ENT = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  rsquo: "’", lsquo: "‘", ldquo: "“", rdquo: "”",
  mdash: "—", ndash: "–", hellip: "…", middot: "·",
  copy: "©", times: "×", deg: "°", reg: "®", trade: "™",
};
const decode = (s) =>
  s.replace(/&(#\d+|#x[0-9a-f]+|\w+);/gi, (m, e) => {
    if (e[0] === "#") {
      const hex = e[1] === "x" || e[1] === "X";
      return String.fromCodePoint(parseInt(hex ? e.slice(2) : e.slice(1), hex ? 16 : 10));
    }
    return e.toLowerCase() in ENT ? ENT[e.toLowerCase()] : m;
  });

const SEP = "";
const BLOCK = /<\/?(p|div|section|main|ul|ol|li|h[1-6]|br|table|td|th|tr|dl|dt|dd|figure|figcaption|summary|details|button|a|label|option|blockquote|nav|header|footer|aside|form)\b[^>]*>/gi;

function prose(html) {
  return decode(
    html
      .replace(/<!--[\s\S]*?-->/g, SEP)        // comments FIRST — see note above
      .replace(/<script[\s\S]*?<\/script>/gi, SEP)
      .replace(/<style[\s\S]*?<\/style>/gi, SEP)
      .replace(/<head\b[\s\S]*?<\/head>/gi, SEP)
      .replace(/<svg[\s\S]*?<\/svg>/gi, SEP)
      .replace(BLOCK, SEP)
      .replace(/<[^>]+>/g, "")
  )
    .split(SEP)
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter((s) => /[a-z]/i.test(s) && s.length > 2);
}

// Punctuation-insensitive key, so a line survives an em dash becoming a comma
// and still pairs with its counterpart. A straight LCS diff drowns in the
// line-wrap noise instead: this source wraps mid-sentence, Webflow does not.
const fp = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");

async function fetchPages() {
  fs.mkdirSync(CACHE, { recursive: true });
  for (const [urlPath, slug] of PAGES) {
    const res = await fetch(`${ORIGIN}/${urlPath}`);
    if (!res.ok) throw new Error(`${ORIGIN}/${urlPath} returned ${res.status}`);
    fs.writeFileSync(path.join(CACHE, slug + ".html"), await res.text());
    process.stdout.write(".");
  }
  console.log(` fetched ${PAGES.length} pages`);
}

if (!OFFLINE) await fetchPages();
if (!fs.existsSync(CACHE)) {
  console.error("no .parity/ cache — run without --offline first");
  process.exit(1);
}

let changed = 0;
let unmatched = 0;
for (const [, slug] of PAGES) {
  const A = prose(fs.readFileSync(path.join(LOCAL, slug + ".html"), "utf8"));   // local
  const B = prose(fs.readFileSync(path.join(CACHE, slug + ".html"), "utf8"));   // published

  const byFp = new Map();
  for (const s of B) {
    const k = fp(s);
    if (!byFp.has(k)) byFp.set(k, []);
    byFp.get(k).push(s);
  }

  const rows = [];
  const missing = [];
  for (const a of A) {
    const bucket = byFp.get(fp(a));
    if (!bucket || !bucket.length) {
      // Short chrome strings split differently between the two markups and are
      // pure noise; only real prose is worth a human looking at.
      if (a.length > 40 || /[–—]/.test(a)) missing.push(a);
      continue;
    }
    const b = bucket.shift();
    if (a !== b) rows.push([a, b]);
  }

  if (!rows.length && !missing.length) continue;
  console.log(`\n${"#".repeat(78)}\n### ${slug}\n${"#".repeat(78)}`);
  for (const [a, b] of rows) {
    changed++;
    console.log(`\nLOCAL     ${a}\nPUBLISHED ${b}`);
  }
  if (missing.length) {
    console.log(`\n--- ${missing.length} local line(s) with no published counterpart ---`);
    for (const s of missing) {
      unmatched++;
      console.log(`  ?  ${s}`);
    }
  }
}

console.log(`\n\n${changed} line(s) differ, ${unmatched} unpaired`);
if (changed) {
  console.log("\nThe published site is ahead of this package. Copy the PUBLISHED wording\ninto site-src/ — do not re-invent it.");
  process.exit(1);
}
