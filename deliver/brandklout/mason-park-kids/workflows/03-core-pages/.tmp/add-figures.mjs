/**
 * Puts a photograph into the chapters that had none.
 *
 *   node add-figures.mjs --dry-run     print the plan, write nothing
 *   node add-figures.mjs               apply it
 *
 * WHY. 2026-09-08, the client: "Use more images." Eight of the eleven pages
 * had a picture in the arrival and one in the invitation and nothing in the
 * middle; four of them had exactly two pictures on the whole page. The pool
 * could not answer it either - `waiting` was on nine pages of eleven - so
 * get-stock.mjs bought fourteen frames from Magnific and upscale-images.mjs
 * repaired the soft ones. This is the placement step.
 *
 * HOW IT INSERTS. One `<div class="wrap"><figure class="ch-figure ..."></div>`
 * immediately before the target chapter's `</section>`. That is deliberately
 * the dullest possible insertion: it cannot land inside somebody's grid and
 * become a stray grid item, it inherits the chapter's ground and measure, and
 * it is trivially reversible. The VARIETY comes from the shape (band, plate,
 * inset), the alignment, and which frame - never from a clever insertion.
 *
 * The rule from get-stock.mjs holds here: a `caption` is only ever written for
 * one of the PRACTICE'S OWN frames. A stock frame is decoration and is left to
 * say so; captioning it is what would turn it into a claim.
 *
 * Re-running is safe: a chapter that already carries a `.ch-figure` is skipped.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const HOME = path.resolve(HERE, "..", "home");
const dry = process.argv.includes("--dry-run");

/* Which uploads are the practice's own, so a caption is allowed. Everything
   with an `st-` prefix is bought and must stay uncaptioned. */
const OWN = new Set(["team", "knee", "knee-2", "operatory", "smile", "dr-nguyen", "dr-cho", "chair", "mother", "waiting"]);

/* page -> [ { chapter id, shape, extra classes, image key, widths, sizes, alt, caption } ]
   The order within a page is the order the chapters appear, and no two
   consecutive entries on a page share a shape. */
const PLAN = {
  "financing/index.html": [
    { at: "rule", shape: "is-plate", cls: "is-right", key: "st-desk", w: [480, 960, 1440], src: 960,
      sizes: "(max-width: 899px) 100vw, 27rem", alt: "A clipboard and a pen on a desk in daylight" },
    { at: "network", shape: "is-band", key: "st-family", w: [480, 960, 1440], src: 1440,
      sizes: "(max-width: 899px) 100vw, 75vw", alt: "A parent and a young child laughing together at home" },
    { at: "ways", shape: "is-inset", key: "st-calendar", w: [480, 960, 1440], src: 960,
      sizes: "(max-width: 899px) 100vw, 34rem", alt: "A calendar and a pen on a desk" },
    { at: "questions", shape: "is-band", key: "st-crayons", w: [480, 960, 1440], src: 1440,
      sizes: "(max-width: 899px) 100vw, 75vw", alt: "Crayons and colouring pencils on a table" },
  ],
  "our-services/index.html": [
    { at: "map", shape: "is-band", key: "operatory", w: [480, 960, 1440, 1920], src: 1440,
      sizes: "(max-width: 899px) 100vw, 75vw", alt: "A hygienist at the sink in a treatment room",
      caption: "In the practice" },
    { at: "finder", shape: "is-inset", cls: "is-right", key: "st-books", w: [480, 960, 1440], src: 960,
      sizes: "(max-width: 899px) 100vw, 34rem", alt: "A stack of children's picture books" },
    { at: "ages", shape: "is-band", key: "st-teen", w: [480, 960, 1440], src: 1440,
      sizes: "(max-width: 899px) 100vw, 75vw", alt: "A smiling teenager outdoors" },
    { at: "offers", shape: "is-plate", key: "st-lunchbox", w: [480, 960, 1440], src: 960,
      sizes: "(max-width: 899px) 100vw, 27rem", alt: "A packed school lunch of fruit and vegetables" },
  ],
  "patient-reviews/index.html": [
    { at: "word", shape: "is-plate", cls: "is-right", key: "st-family", w: [480, 960, 1440], src: 960,
      sizes: "(max-width: 899px) 100vw, 27rem", alt: "A parent and a young child laughing together at home" },
    { at: "wall", shape: "is-band", key: "knee-2", w: [480, 960, 1400], src: 1400,
      sizes: "(max-width: 899px) 100vw, 75vw", alt: "A knee-to-knee exam: an infant on a parent's lap",
      caption: "A knee-to-knee exam" },
    { at: "write", shape: "is-inset", cls: "is-centre", key: "st-crayons", w: [480, 960, 1440], src: 960,
      sizes: "(max-width: 899px) 100vw, 34rem", alt: "Crayons and colouring pencils on a table" },
  ],
  "thank-you/index.html": [
    { at: "now", shape: "is-band", key: "operatory", w: [480, 960, 1440, 1920], src: 1440,
      sizes: "(max-width: 899px) 100vw, 75vw", alt: "A hygienist at the sink in a treatment room",
      caption: "In the practice" },
    { at: "next", shape: "is-inset", cls: "is-right", key: "st-calendar", w: [480, 960, 1440], src: 960,
      sizes: "(max-width: 899px) 100vw, 34rem", alt: "A calendar and a pen on a desk" },
    { at: "meanwhile", shape: "is-plate", key: "st-nook", w: [480, 960, 1440], src: 960,
      sizes: "(max-width: 899px) 100vw, 27rem", alt: "A reading nook by a window" },
  ],
  "dental-saving-plan/index.html": [
    { at: "inside", shape: "is-plate", cls: "is-right", key: "st-brushes", w: [480, 960, 1400], src: 960,
      sizes: "(max-width: 899px) 100vw, 27rem", alt: "Children's toothbrushes in a cup on a shelf" },
    { at: "who", shape: "is-band", key: "st-family", w: [480, 960, 1440], src: 1440,
      sizes: "(max-width: 899px) 100vw, 75vw", alt: "A parent and a young child laughing together at home" },
    { at: "join", shape: "is-inset", cls: "is-centre", key: "st-apple", w: [480, 960, 1400], src: 960,
      sizes: "(max-width: 899px) 100vw, 34rem", alt: "A child holding an apple outdoors" },
  ],
  "our-doctors/index.html": [
    { at: "training", shape: "is-band", key: "st-books", w: [480, 960, 1440], src: 1440,
      sizes: "(max-width: 899px) 100vw, 75vw", alt: "A stack of picture books" },
    { at: "measure", shape: "is-inset", cls: "is-right", key: "knee-2", w: [480, 960, 1400], src: 960,
      sizes: "(max-width: 899px) 100vw, 34rem", alt: "A knee-to-knee exam: an infant on a parent's lap",
      caption: "A knee-to-knee exam" },
    { at: "voices", shape: "is-plate", key: "st-infant", w: [480, 960, 1440], src: 960,
      sizes: "(max-width: 899px) 100vw, 27rem", alt: "A parent holding a smiling baby" },
  ],
  "new-patients/index.html": [
    { at: "before", shape: "is-inset", cls: "is-right", key: "st-backpack", w: [480, 960, 1440], src: 960,
      sizes: "(max-width: 899px) 100vw, 34rem", alt: "A child's backpack by a door" },
    { at: "visit", shape: "is-band", key: "st-brush", w: [480, 960, 1440], src: 1440,
      sizes: "(max-width: 899px) 100vw, 75vw", alt: "A child brushing their teeth at a bathroom sink" },
    { at: "questions", shape: "is-plate", cls: "is-right", key: "st-crayons", w: [480, 960, 1440], src: 960,
      sizes: "(max-width: 899px) 100vw, 27rem", alt: "Crayons and colouring pencils on a table" },
  ],
  "about-us/index.html": [
    { at: "two", shape: "is-band", key: "st-nook", w: [480, 960, 1440], src: 1440,
      sizes: "(max-width: 899px) 100vw, 75vw", alt: "A reading nook by a window" },
    { at: "forward", shape: "is-plate", cls: "is-right", key: "st-apple", w: [480, 960, 1400], src: 960,
      sizes: "(max-width: 899px) 100vw, 27rem", alt: "A child holding an apple outdoors" },
    { at: "word", shape: "is-inset", key: "st-play", w: [480, 960, 1440], src: 960,
      sizes: "(max-width: 899px) 100vw, 34rem", alt: "A bright playroom with wooden toys" },
  ],
  "services/comprehensive-pediatric-dentistry/index.html": [
    { at: "questions", shape: "is-band", key: "st-lunchbox", w: [480, 960, 1440], src: 1440,
      sizes: "(max-width: 899px) 100vw, 75vw", alt: "A packed school lunch of fruit and vegetables" },
  ],
  "index.html": [
    { at: "comfort", shape: "is-band", key: "st-play", w: [480, 960, 1440], src: 1440,
      sizes: "(max-width: 899px) 100vw, 75vw", alt: "A bright playroom with wooden toys" },
  ],
};

// The path prefix back to assets/ depends on how deep the page sits.
const upTo = (rel) => "../".repeat(rel.split("/").length - 1) || "";

function figure(rel, f) {
  const up = upTo(rel);
  const u = (w) => `${up}assets/uploads/${f.key}-${w}.webp`;
  const srcset = f.w.map((w) => `${u(w)} ${w}w`).join(", ");
  const caption = f.caption ? `<figcaption>${f.caption}</figcaption>` : "";
  if (f.caption && !OWN.has(f.key)) {
    throw new Error(`${rel}#${f.at}: "${f.key}" is a bought frame and may not carry a caption - see get-stock.mjs`);
  }
  const cls = ["ch-figure", f.shape, f.cls].filter(Boolean).join(" ");
  return (
    `\n  <div class="wrap">\n` +
    `    <figure class="${cls}" data-wipe data-drift>` +
    `<img src="${u(f.src)}" srcset="${srcset}" sizes="${f.sizes}" alt="${f.alt}" loading="lazy" decoding="async">` +
    `${caption}</figure>\n` +
    `  </div>\n`
  );
}

let added = 0, skipped = 0;
for (const [rel, items] of Object.entries(PLAN)) {
  const file = path.join(HOME, ...rel.split("/"));
  let html = fs.readFileSync(file, "utf8");
  for (const f of items) {
    // The chapter, from its id to its </section>.
    const open = new RegExp(`<section[^>]*\\bid="${f.at}"[^>]*>`);
    const m = open.exec(html);
    if (!m) { console.error(`MISS  ${rel}  no <section id="${f.at}">`); continue; }
    const from = m.index;
    const close = html.indexOf("</section>", from);
    if (close < 0) { console.error(`MISS  ${rel}#${f.at}  no </section>`); continue; }
    if (html.slice(from, close).includes("ch-figure")) { skipped++; console.log(`skip  ${rel}#${f.at} (already has one)`); continue; }
    const block = figure(rel, f);
    if (!dry) html = html.slice(0, close) + block + html.slice(close);
    added++;
    console.log(`${dry ? "would" : "add  "} ${rel.padEnd(50)} #${f.at.padEnd(11)} ${f.shape.padEnd(9)} ${f.key}`);
  }
  if (!dry) fs.writeFileSync(file, html);
}
console.log(`\n${added} figure(s) ${dry ? "planned" : "added"}, ${skipped} skipped`);
