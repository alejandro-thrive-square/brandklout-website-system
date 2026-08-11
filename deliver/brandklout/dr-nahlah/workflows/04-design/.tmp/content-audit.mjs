// Content-parity audit: every rebuilt page against the page it replaces.
//
// The brief for the rebuild was a redesign with reduced copy. The brief NOW is
// that the rebuild should carry the same content structure and the same assets
// as drnahlah.com. This script is what tells us where those two disagree.
//
// It reports, per page:
//   - source headings with no plausible counterpart in the rebuild  (missing sections)
//   - source images not used ANYWHERE in the package                (dropped assets)
//
// CHROME IS DETECTED, NOT HARDCODED. Every one of the 78 scraped pages carries
// the same nav, footer and "Book Now" CTA, so any heading or image that appears
// on more than half the pages is site furniture rather than page content. That
// beats a hand-kept ignore list, which silently rots the moment the client
// edits their footer.
//
// Usage: node content-audit.mjs [--json]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(HERE, "final-site");
const SCRAPE = path.resolve(
  process.env.SCRAPE ||
    "C:/Users/ACER/Documents/Webzite Studio/Webzite Agentic Workflow/deliver/brandklout/dr-nahlah/workflows/01-content-intake/.tmp/current-site-scrape"
);

// rebuilt slug -> source slug. The five renames are deliberate: the source's own
// nav labels are better than its URLs (/dr-esam-nahlah/ is "Meet Dr. Esam
// Nahlah", /patient-center/'s own h1 is "First Visit").
const MAP = {
  index: "home", "dental-implants": "dental-implants", "all-on-4": "all-on-4",
  "implant-cost": "cost-of-dental-implants", "sedation-dentistry": "sedation-dentistry",
  "smile-makeover": "smile-makeover", veneers: "veneers", "smile-gallery": "smile-gallery",
  "patient-stories": "testimonials", "meet-dr-nahlah": "dr-esam-nahlah", contact: "contact",
  about: "about", "our-team": "our-team", "our-facility": "our-dental-facility",
  "cosmetic-dentistry": "cosmetic-dentistry", "teeth-whitening": "teeth-whitening",
  "crowns-and-bridges": "dental-crowns-and-bridges", "oral-surgery": "oral-surgery",
  "emergency-dentistry": "emergency-dentistry", "dental-conditions": "dental-conditions",
  "implant-supported-dentures": "implant-supported-dentures",
  "dental-implant-faq": "dental-implant-faq", "patient-center": "patient-center",
  financing: "financing", "doctor-referral": "doctor-referral",
  "privacy-policy": "privacy-policy",
};

const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const words = (s) => new Set(norm(s).split(" ").filter((w) => w.length > 3));

/* ---------- load every scraped record, so chrome can be measured ---------- */
const records = {};
for (const f of fs.readdirSync(path.join(SCRAPE, "data"))) {
  if (!f.endsWith(".json")) continue;
  records[f.replace(/\.json$/, "")] = JSON.parse(
    fs.readFileSync(path.join(SCRAPE, "data", f), "utf8")
  );
}
const total = Object.keys(records).length;
const headCount = new Map(), imgCount = new Map();
for (const r of Object.values(records)) {
  for (const h of new Set((r.headings || []).map((h) => norm(h.text))))
    headCount.set(h, (headCount.get(h) || 0) + 1);
  for (const s of new Set((r.images || []).map((i) => i.src)))
    imgCount.set(s, (imgCount.get(s) || 0) + 1);
}
const CHROME_AT = total / 2;
const isChromeHeading = (t) => !t || (headCount.get(norm(t)) || 0) > CHROME_AT;
const isChromeImage = (s) => (imgCount.get(s) || 0) > CHROME_AT;

/* ---------- what the package actually uses ---------- */
// Strip WordPress size suffixes so `foo-1024x512.jpg` and `foo-scaled.jpg` both
// resolve to `foo.jpg` — the source pages serve variants, the package copies masters.
const baseName = (src) =>
  path.basename(src).replace(/-\d+x\d+(?=\.\w+$)/, "").replace(/-scaled(?=\.\w+$)/, "");

const usedFiles = new Set();     // asset filenames referenced by any built page
const pageHeads = {};            // slug -> [heading text]
const pageWords = {};            // slug -> Set of significant words in the whole page
for (const slug of Object.keys(MAP)) {
  const p = path.join(SITE, slug + ".html");
  if (!fs.existsSync(p)) continue;
  // Comments BEFORE script/style: the source comments contain the literal words
  // <script> and <style>, so stripping elements first lets a comment open a match
  // that runs to the next real </script> and eats ~10KB of prose. Same trap as
  // webflow-parity.mjs — it under-reported that diff by two thirds.
  const html = fs.readFileSync(p, "utf8").replace(/<!--[\s\S]*?-->/g, "");
  pageHeads[slug] = [...html.matchAll(/<(h[1-3]|summary)\b[^>]*>([\s\S]*?)<\/\1>/gi)]
    .map((m) => m[2].replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/gi, " ").trim())
    .filter(Boolean);
  // Full visible prose, so a source heading whose SUBJECT the rebuild covers under
  // different wording is not reported as a missing section. Without this the
  // matcher reports ~40% false positives and the fix list becomes untrustworthy.
  const prose = html
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ");
  pageWords[slug] = words(prose);
  for (const m of html.matchAll(/src="assets\/([^"]+)"/g)) usedFiles.add(m[1]);
}

// copy-assets maps package filename -> source path; invert it so a source image
// can be asked "did anything ship you, under any name?"
const copyMap = fs.readFileSync(path.join(HERE, "site-src", "copy-assets.mjs"), "utf8");
const shippedSources = new Set();
for (const m of copyMap.matchAll(/"([^"]+)":\s*"([^"]+)"/g)) {
  if (usedFiles.has(m[1])) shippedSources.add(baseName(m[2]));
}
// the generated gallery names its files directly, so add every used file as itself
for (const f of usedFiles) shippedSources.add(baseName(f));

/* ---------- compare ---------- */
const report = [];
for (const [slug, srcSlug] of Object.entries(MAP)) {
  const r = records[srcSlug];
  if (!r) { report.push({ slug, error: `no scrape record for "${srcSlug}"` }); continue; }
  const mine = pageHeads[slug] || [];
  const mineWords = mine.map(words);

  const missingHeads = [];
  const seen = new Set();
  const allProse = pageWords[slug] || new Set();
  for (const h of r.headings || []) {
    if (isChromeHeading(h.text)) continue;
    if (h.level === "h1") continue;               // the rebuild deliberately has one h1
    const w = words(h.text);
    if (!w.size) continue;
    const key = norm(h.text);
    if (seen.has(key)) continue;                  // the source repeats headings; report once
    seen.add(key);
    // Covered if EITHER a rebuilt heading echoes it, OR the page's prose already
    // carries its subject. The second test is what stops a rewritten section from
    // being reported as a deletion.
    const headMatch = mineWords.some((mw) => {
      let hit = 0;
      for (const t of w) if (mw.has(t)) hit++;
      return hit / w.size > 0.5;
    });
    let inProse = 0;
    for (const t of w) if (allProse.has(t)) inProse++;
    if (headMatch || inProse / w.size >= 0.8) continue;
    missingHeads.push(`${h.level} ${h.text}`);
  }

  const missingImgs = [];
  for (const i of r.images || []) {
    if (isChromeImage(i.src)) continue;
    if (!shippedSources.has(baseName(i.src))) {
      missingImgs.push(baseName(i.src) + (i.alt ? `  [alt: ${i.alt}]` : ""));
    }
  }
  report.push({
    slug, srcSlug, srcWords: r.word_count,
    srcHeadings: (r.headings || []).filter((h) => !isChromeHeading(h.text)).length,
    myHeadings: mine.length,
    missingHeads, missingImgs,
  });
}

if (process.argv.includes("--json")) {
  console.log(JSON.stringify(report, null, 2));
} else {
  let mh = 0, mi = 0;
  for (const r of report) {
    if (r.error) { console.log(`\n### ${r.slug}\n  ERROR ${r.error}`); continue; }
    mh += r.missingHeads.length; mi += r.missingImgs.length;
    if (!r.missingHeads.length && !r.missingImgs.length) continue;
    console.log(`\n### ${r.slug}  <- /${r.srcSlug}/   (source ${r.srcWords}w, ${r.srcHeadings} sections; rebuild ${r.myHeadings})`);
    if (r.missingHeads.length) {
      console.log(`  -- ${r.missingHeads.length} source heading(s) with no counterpart:`);
      for (const h of r.missingHeads) console.log(`     ${h}`);
    }
    if (r.missingImgs.length) {
      console.log(`  -- ${r.missingImgs.length} source image(s) not used anywhere in the package:`);
      for (const i of r.missingImgs) console.log(`     ${i}`);
    }
  }
  console.log(`\n\nTOTAL: ${mh} uncovered headings, ${mi} unused source images across ${report.length} pages.`);
}
