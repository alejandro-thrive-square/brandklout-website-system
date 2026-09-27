// Dr. Nguyen first, then Dr. Cho, then Dr. Sung — the order the practice asked
// for in the 2026-09-10 BugHerd round (#15, #34) — on the three pages that
// list the doctors as sibling blocks, plus the note rewrites on the home's
// cards (#17 remove the sedation line, #19 a different line for Dr. Nguyen).
// Idempotent. The blocks carry srcsets, which is why this is a script and not
// a hand edit.
//
//   node reorder-doctors.mjs
import fs from "node:fs";
import path from "node:path";

const HOME = path.join(import.meta.dirname, "..", "..", "home");
const ORDER = ["Dr. Tam Nguyen", "Dr. Dave Cho", "Dr. William Sung"];

function reorder(html, open, itemRe) {
  const start = html.indexOf(open);
  if (start < 0) throw new Error(`container not found: ${open}`);
  const items = [];
  const re = new RegExp(itemRe.source, "g");
  re.lastIndex = start;
  let m, first = -1, last = -1;
  while ((m = re.exec(html)) && items.length < 3) {
    if (first < 0) first = m.index;
    last = m.index + m[0].length;
    items.push(m[0]);
  }
  if (items.length !== 3) throw new Error(`expected 3 items after ${open}, found ${items.length}`);
  const byName = (n) => items.find((s) => s.includes(`alt="${n}"`));
  const sorted = ORDER.map(byName);
  if (sorted.some((s) => !s)) throw new Error(`a doctor is missing after ${open}`);
  const sep = html.slice(first, last).match(/<\/(?:article|figure|a)>(\s*)</)?.[1] ?? "\n";
  return html.slice(0, first) + sorted.join(sep) + html.slice(last);
}

const edits = [
  {
    file: "index.html",
    open: '<div class="pe-grid">',
    item: /<article class="pe-card">[\s\S]*?<\/article>/,
    then: (s) => s
      .replace('<p class="pe-note">Sedation certified, so a long appointment is one appointment.</p>', '<p class="pe-note">A laid back manner that settles nervous patients.</p>')
      .replace('<p class="pe-note">The pediatric practice, in the same building.</p>', '<p class="pe-note">Board certified. The children&rsquo;s side of the hall.</p>')
      .replace('Boston University, dental degree and pediatric residency. The children&rsquo;s side of the address.</p>', 'Boston University, dental degree and pediatric residency. Leads the pediatric practice, from the first tooth on.</p>')
      .replace('  <div class="pe-grid">', '  <!-- Dr. Nguyen first, then Dr. Cho, then Dr. Sung: the order the practice\n       asked for (BugHerd #15, #34, 2026-09-10). -->\n  <div class="pe-grid">'),
  },
  {
    file: "about-us/index.html",
    open: '<div class="el-pillars">',
    item: /<figure class="el-pillar">[\s\S]*?<\/figure>/,
    then: (s) => {
      // The "Meet the doctors" link closes the row: it moves from Dr. Nguyen's
      // figcaption (last before) to Dr. Sung's (last now).
      const link = '          <a class="link-arrow" href="/our-doctors/">Meet the doctors <span aria-hidden="true">&rarr;</span></a>\n';
      const nguyen = s.indexOf('alt="Dr. Tam Nguyen"'), cho = s.indexOf('alt="Dr. Dave Cho"');
      const linkAt = s.indexOf(link, nguyen);
      if (linkAt > nguyen && linkAt < cho) s = s.slice(0, linkAt) + s.slice(linkAt + link.length);
      if (!s.includes(link)) s = s.replace(/(alt="Dr\. William Sung"[\s\S]*?<\/details>\n)/, `$1${link}`);
      return s.replace('    <div class="el-pillars">', '    <!-- Dr. Nguyen, then Dr. Cho, then Dr. Sung: the practice\'s order\n         (BugHerd #34, 2026-09-10). The three reveal together, not staggered,\n         since a reviewer read the stagger as a layout fault (#38). -->\n    <div class="el-pillars">');
    },
  },
  {
    file: "our-team/index.html",
    open: '<div class="cp-bylines" data-stagger>',
    item: /<a class="cp-byline" [\s\S]*?<\/a>/,
    then: (s) => s
      .replace("<span><b>Dr. Tam Nguyen</b><span>Pediatric dentist, across the hall</span></span>", "<span><b>Dr. Tam Nguyen</b><span>Board certified pediatric dentist</span></span>")
      .replace("<h2 data-split>Three doctors, on their own page.</h2>", "<h2 data-split>Start with the doctors.</h2>")
      .replace('    <div class="cp-bylines" data-stagger>', '    <!-- Dr. Nguyen, Dr. Cho, Dr. Sung: the practice\'s order (BugHerd #15). -->\n    <div class="cp-bylines" data-stagger>'),
  },
];

for (const e of edits) {
  const p = path.join(HOME, e.file);
  const before = fs.readFileSync(p, "utf8");
  let s = before.replace(/<!-- Dr\. Nguyen[^]*?-->\n\s*/g, (m) => (m.includes("BugHerd") ? "" : m));
  s = reorder(s, e.open, e.item);
  s = e.then(s);
  fs.writeFileSync(p, s);
  const names = [...s.matchAll(/alt="(Dr\. [A-Za-z]+ [A-Za-z]+)"/g)].map((m) => m[1]);
  console.log(`${e.file}: ${s === before ? "unchanged" : "written"}; doctor images in order: ${names.join(", ")}`);
}
