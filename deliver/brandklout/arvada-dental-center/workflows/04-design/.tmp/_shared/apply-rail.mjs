#!/usr/bin/env node
/**
 * apply-rail.mjs — route the six horizontal chapters through WZ.rail().
 *
 * Each already carried an inline reduced-motion fallback that turned the
 * pinned sideways travel into a native scroller. That fallback was correct
 * and was firing for exactly one of the two cases that need it: reduced
 * motion, but not narrow screens — where there is likewise no pin to convert
 * vertical scroll into horizontal travel, and where a swipeable rail is what
 * a touch screen expects regardless.
 *
 * The inline version also dropped two things on the floor, which is the
 * argument for having one copy rather than six: the progress rule stayed at
 * scaleX(0) forever, and the cards stayed greyscale, because both were wired
 * to a ScrollTrigger that no longer existed. WZ.rail() drives them from the
 * rail's own scroll position instead.
 *
 *   node apply-rail.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const DESIGN = resolve(HERE, '..');
const PAGES = ['implants', 'aox', 'veneers', 'emergency', 'dentist-near-me', 'next-door'];

// The inline fallback, with or without the explanatory comment above it.
const RE = /(\s*)if \(W\.reduced\) \{\r?\n\s*pin\.style\.height = 'auto';\r?\n\s*pin\.style\.paddingBlock = 'clamp\(3rem,6vw,5rem\)';\r?\n\s*track\.style\.overflowX = 'auto';\r?\n\s*track\.style\.width = '100%';\r?\n\s*return;\r?\n\s*\}/g;

const REPLACEMENT = `$1/* No pin available — reduced motion, or a screen too narrow to hold one.
$1   Either way the sideways travel has nothing driving it, so the track
$1   becomes a swipeable rail and keeps its progress rule and its card
$1   lighting. See WZ.rail in journey.js. */
$1if (W.reduced || !W.canPin) { W.rail(pin, track, bar, light); return; }`;

let total = 0;
for (const slug of PAGES) {
  const file = join(DESIGN, slug, 'index.html');
  let s = readFileSync(file, 'utf8');
  let n = 0;
  s = s.replace(RE, (...a) => { n++; return REPLACEMENT.replace(/\$1/g, a[1]); });
  if (n) writeFileSync(file, s, 'utf8');
  total += n;
  console.log(`${slug.padEnd(17)} ${n} rail(s) rewired`);
}
console.log(`\n${total}/6 rewired`);
