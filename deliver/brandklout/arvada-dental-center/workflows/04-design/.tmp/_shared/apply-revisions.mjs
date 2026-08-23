#!/usr/bin/env node
/**
 * apply-revisions.mjs — the mechanical, whole-site half of design revision r2.
 *
 * These three changes touch every page in the same way, so they are scripted
 * rather than hand-edited: a hand pass over 46 chapter tags on six pages is
 * where a typo gets in. The structural fixes (practice pin, anatomy scrub,
 * word sweep, the 911 note) are per-chapter and are edited by hand.
 *
 *   1. Practice name  — "Arvada Dental Center & Implants" is not the client's
 *      name. The Webflow site is "Arvada Dental Center".
 *   2. Chapter numbers — the tags carry the section name only. The numbering
 *      sequence goes, in the page tags and in the nav readout both.
 *   3. Tag alignment  — a tag introduces the block beneath it, so where that
 *      block is a narrower centred column the tag moves inside the column.
 *      Leaving it outside put it 312px to the left of its own heading.
 *
 *   node apply-revisions.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const DESIGN = resolve(HERE, '..');
const PAGES = ['implants', 'aox', 'veneers', 'emergency', 'dentist-near-me', 'next-door'];

let totals = { name: 0, chapter: 0, nav: 0, moved: 0 };

for (const slug of PAGES) {
  const file = join(DESIGN, slug, 'index.html');
  let s = readFileSync(file, 'utf8');
  const before = s;

  // 1 ── practice name
  const nameHits = (s.match(/Arvada Dental Center (?:&amp;|&) Implants/g) || []).length;
  s = s.replace(/Arvada Dental Center (?:&amp;|&) Implants/g, 'Arvada Dental Center');
  totals.name += nameHits;

  // 2 ── chapter numbers out of the in-page tags
  const chHits = (s.match(/Chapter \d+ &middot; /g) || []).length;
  s = s.replace(/Chapter \d+ &middot; /g, '');
  totals.chapter += chHits;

  // 2b ── and out of the nav readout. The progress rule (#navChBar) stays: it
  //       shows how far through the page you are without naming a number.
  const navHits = (s.match(/<b id="navChNum">\d+<\/b>/g) || []).length;
  s = s.replace(/<b id="navChNum">\d+<\/b>/g, '');
  totals.nav += navHits;

  // 3 ── a chapter tag stranded outside the centred column it introduces.
  //      Matches `<div class="chapter-tag">…</div>` followed by the opening
  //      `<div class="wrap--narrow" …>` and swaps their order, so the tag
  //      shares the measure of the heading it labels.
  //      These files are CRLF; matching on a bare \n silently finds nothing.
  s = s.replace(
    /[ \t]*(<div class="chapter-tag">.*?<\/div>)\r?\n([ \t]*)(<div class="wrap--narrow"[^>]*>)\r?\n/g,
    (_m, tag, ind, open) => { totals.moved++; return `${ind}${open}\r\n${ind}  ${tag}\r\n`; }
  );

  if (s !== before) writeFileSync(file, s, 'utf8');
  console.log(`${slug.padEnd(17)} name:${nameHits} chapter:${chHits} nav:${navHits}`);
}

// The review index carries the practice name too.
const idx = join(DESIGN, 'index.html');
let ix = readFileSync(idx, 'utf8');
const ixHits = (ix.match(/Arvada Dental Center (?:&amp;|&) Implants/g) || []).length;
if (ixHits) writeFileSync(idx, ix.replace(/Arvada Dental Center (?:&amp;|&) Implants/g, 'Arvada Dental Center'), 'utf8');

console.log(`\nname:${totals.name + ixHits}  chapter tags:${totals.chapter}  nav readouts:${totals.nav}  tags moved into column:${totals.moved}`);
