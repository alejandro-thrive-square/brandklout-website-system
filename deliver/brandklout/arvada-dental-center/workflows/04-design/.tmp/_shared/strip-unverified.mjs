// One-off reconciliation pass, 2026-08-06.
//
// Brandklout flagged three things carried in the source material as fabrications
// rather than facts. Two of them had been built into these pages:
//
//   1. The "4.8 stars / 1,000+ reviews" aggregate is an estimated figure, not a
//      real one. Every aggregate score, review count and star glyph comes out —
//      including the per-review 5-star rows, because the star rating on an
//      individual quote was inferred by us, never sourced.
//   2. The named financing partners (Cherry, Sunbit, PatientFi, Proceed Finance,
//      LendingClub, CareCredit) were assumed and are unconfirmed. Naming a
//      specific finance company a practice may not actually work with is not a
//      risk worth carrying, so all names come out and the generic — and
//      separately sourced — "financing available" statement stays.
//
// The third (stock before/after photography presented as patient results) was
// never used on these pages; a QA guard now blocks it.
//
// Individually attributed reviews are KEPT. Each is a named person's published
// words, quoted verbatim. It is the aggregate arithmetic that was invented.
//
// Asana parent task: 1217040406855586
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url)).replace(/_shared$/, "");
const PAGES = ["implants", "aox", "veneers", "emergency", "dentist-near-me", "next-door"];

// A <span class="stars">…</span> block, however many star SVGs it holds.
const STARS = /\s*<span class="stars"[^>]*>(?:\s*<svg[\s\S]*?<\/svg>)+\s*<\/span>/g;

let report = [];
for (const slug of PAGES) {
  const file = path.join(root, slug, "index.html");
  let s = fs.readFileSync(file, "utf8");
  const before = s;
  const hits = [];

  // --- 1. star glyphs, everywhere ---
  const starCount = (s.match(STARS) || []).length;
  if (starCount) { s = s.replace(STARS, ""); hits.push(`${starCount} star row(s)`); }

  // --- 2. the hero trust badge that carried the aggregate ---
  s = s.replace(
    /<span class="trust__item">\s*4\.8 from 931 reviews\s*<\/span>/g,
    () => { hits.push("hero rating badge"); return `<span class="trust__item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>
            Serving Arvada since 2003
          </span>`; }
  );

  // --- 3. proof-section headings built on the aggregate ---
  s = s.replace(
    /<h2 class="display">4\.8 from 931 reviews<\/h2>/g,
    () => { hits.push("proof heading"); return `<h2 class="display">In our patients' own words</h2>`; }
  );

  // --- 4. the rating strip under the implants proof heading ---
  s = s.replace(
    /\s*<div class="rating-strip mt-sm">[\s\S]*?<\/div>/,
    () => { hits.push("rating strip"); return ""; }
  );

  // --- 5. aria-labels asserting a per-review score ---
  s = s.replace(/\s*aria-label="5 out of 5"/g, "");

  fs.writeFileSync(file, s, "utf8");
  report.push(`${slug.padEnd(17)} ${hits.length ? hits.join(", ") : "(nothing to strip)"}${before === s ? "" : ""}`);
}
console.log(report.join("\n"));
