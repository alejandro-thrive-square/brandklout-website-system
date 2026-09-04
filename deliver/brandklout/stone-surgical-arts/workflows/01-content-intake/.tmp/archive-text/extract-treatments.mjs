// Turns the recovered archive text into one structured record per treatment.
//
// The old site was a WordPress template, so every service page has the same
// skeleton: nav, then a content region of "## Heading" + paragraphs + bullet
// lists, then an FAQ block, then a "Related Procedures" list, then the shared
// testimonial carousel and the "The Art of a Beautiful You" CTA + footer.
//
// Only the content region is worth anything. The chrome repeats verbatim on
// all 25 pages and would swamp the useful copy, so this cuts it away at both
// ends and emits pages/treatments.json for the build to write sections from.
//
// Usage: node extract-treatments.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PAGES = path.join(HERE, "pages");

// The nav ends with the accessibility link and the phone/Book Now pair; the
// content region starts on the next non-empty line after that.
const NAV_END = /^Accessibility$/;
// The shared closing CTA. Everything from here down is chrome on every page.
const TAIL = /^## The Art of a$/;
// The testimonial carousel is shared chrome too, but it sits in the MIDDLE of
// each service page — between the before/after teaser and the procedure detail
// — so it has to be excised, not truncated at. Cutting at it loses the FAQ and
// recovery sections, which are the most useful copy on the page.
// One entry is: a curly-quoted pull quote, its body paragraphs, then "- Name".
const TESTIMONIAL_OPEN = /^[“"].{20,}[”"]?$/;
const TESTIMONIAL_ATTR = /^- [A-Z][A-Za-z.'’\- ]{2,40}$/;

const FAQ_HEADING = /FAQs|Frequently Asked Questions/i;
const RELATED_HEADING = /^Related Procedures$/i;

function parse(file) {
  const raw = fs.readFileSync(path.join(PAGES, file), "utf8");
  const source = raw.split("\n")[0].replace(/^SOURCE:\s*/, "");
  let lines = raw.split("\n").slice(1);

  const navEnd = lines.findIndex((l) => NAV_END.test(l.trim()));
  if (navEnd !== -1) lines = lines.slice(navEnd + 1);
  // Drop the phone / Book Now pair the nav ends on.
  while (lines.length && /^(\(\d{3}\)|Book Now|-|)$/.test(lines[0].trim())) lines.shift();

  const tail = lines.findIndex((l) => TAIL.test(l.trim()));
  if (tail !== -1) lines = lines.slice(0, tail);

  // Excise every testimonial entry in place: from the pull quote through the
  // "- Name" attribution that closes it. Anything else stays.
  const kept = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();
    if (TESTIMONIAL_OPEN.test(l)) {
      // Look ahead a short distance for the attribution that ends the entry.
      let j = i + 1;
      while (j < lines.length && j - i < 8 && !TESTIMONIAL_ATTR.test(lines[j].trim())) j++;
      if (j < lines.length && j - i < 8 && TESTIMONIAL_ATTR.test(lines[j].trim())) {
        i = j; // skip the whole entry
        continue;
      }
    }
    kept.push(lines[i]);
  }
  lines = kept;

  // Walk the region into { heading, paragraphs[], bullets[] } blocks.
  const blocks = [];
  let cur = { heading: null, paragraphs: [], bullets: [] };
  for (const rawLine of lines) {
    const l = rawLine.trim();
    if (!l || l === "-") continue;
    if (l.startsWith("## ")) {
      if (cur.heading || cur.paragraphs.length) blocks.push(cur);
      cur = { heading: l.slice(3).trim(), paragraphs: [], bullets: [] };
    } else if (l.startsWith("- ")) {
      cur.bullets.push(l.slice(2).trim());
    } else if (l !== "Learn More" && l !== "View Gallery") {
      cur.paragraphs.push(l);
    }
  }
  if (cur.heading || cur.paragraphs.length) blocks.push(cur);

  // Split the blocks three ways: body, FAQ, related.
  const faqAt = blocks.findIndex((b) => b.heading && FAQ_HEADING.test(b.heading));
  const relAt = blocks.findIndex((b) => b.heading && RELATED_HEADING.test(b.heading));
  const end = (...xs) => {
    const v = xs.filter((n) => n > -1);
    return v.length ? Math.min(...v) : blocks.length;
  };

  const body = blocks.slice(0, end(faqAt, relAt));
  // Each FAQ answer is the paragraph(s) under its own "## question" heading.
  const faq =
    faqAt === -1
      ? []
      : blocks
          .slice(faqAt + 1, end(relAt) > faqAt ? end(relAt) : blocks.length)
          .filter((b) => b.heading && b.paragraphs.length)
          .map((b) => ({ q: b.heading, a: b.paragraphs.join(" ") }));
  const related =
    relAt === -1
      ? []
      : blocks
          .slice(relAt + 1)
          .map((b) => b.heading)
          .filter(Boolean);

  return {
    slug: file.replace(/\.txt$/, ""),
    source,
    // The page's own <title>-ish line, e.g. "Neck Lift Westlake TX".
    label: (body[0]?.paragraphs[0] || "").trim(),
    // A heading with no copy under it is a nav item or a card label, not a
    // section. Two pages archived with the nav inside the content region and
    // produced 50+ of those; requiring copy drops them.
    //
    // Four pages use an older template that marks each testimonial up as a
    // heading (`## "quote"`) rather than a bare line, so the line-level
    // excision above misses them. They are recognisable by the quote marks.
    sections: body
      .filter(
        (b) =>
          b.heading &&
          !TESTIMONIAL_OPEN.test(b.heading) &&
          (b.paragraphs.length || b.bullets.length),
      )
      .map((b) => ({
        heading: b.heading,
        body: b.paragraphs,
        bullets: b.bullets,
      })),
    faq,
    related,
  };
}

const files = fs
  .readdirSync(PAGES)
  .filter(
    (f) =>
      /^(cosmetic-facial-surgery-southlake|skin-treatments-southlake)--/.test(f) &&
      fs.statSync(path.join(PAGES, f)).size > 5000,
  )
  .sort();

const out = files.map(parse);
fs.writeFileSync(
  path.join(PAGES, "treatments.json"),
  JSON.stringify(out, null, 2),
  "utf8",
);

for (const t of out) {
  const words = t.sections.reduce(
    (n, s) => n + s.body.join(" ").split(/\s+/).filter(Boolean).length,
    0,
  );
  console.log(
    `${t.slug.padEnd(52)} ${String(t.sections.length).padStart(2)} sections  ` +
      `${String(t.faq.length).padStart(2)} faq  ${String(words).padStart(4)} words`,
  );
}
console.log(`\n${out.length} treatments -> pages/treatments.json`);
