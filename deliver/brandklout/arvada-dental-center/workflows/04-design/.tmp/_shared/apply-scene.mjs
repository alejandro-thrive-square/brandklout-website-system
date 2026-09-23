#!/usr/bin/env node
/**
 * apply-scene.mjs — route every scrubbed chapter through WZ.scene().
 *
 * Eighteen chapters each wrote the same ScrollTrigger config by hand, which
 * is why "pin: true" was unconditional on all eighteen: there was nowhere to
 * decide it once. WZ.scene() is that place — it pins on desktop and scrubs
 * the section as it passes below 900px, where the scene no longer fits a
 * viewport.
 *
 * Only the plain shape is rewritten here:
 *
 *     scrollTrigger: {
 *       trigger: X, start: 'top top', end: '+=' + Math.round(window.innerHeight * N),
 *       pin: true, scrub: S, anticipatePin: 1, invalidateOnRefresh: true
 *     }
 *
 * The six with a function-valued `end` (the horizontal-scroll chapters, whose
 * range is measured from track width) are left alone and handled by hand —
 * their unpinned behaviour is a different design, not a different config.
 *
 *   node apply-scene.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const DESIGN = resolve(HERE, '..');
const PAGES = ['implants', 'aox', 'veneers', 'emergency', 'dentist-near-me', 'next-door'];

// scrollTrigger: { trigger: <t>, start: 'top top', end: '+=' + Math.round(window.innerHeight * <n>),
//                  pin: true, scrub: <s>, anticipatePin: 1, invalidateOnRefresh: true }
const RE = /scrollTrigger:\s*\{\s*\r?\n\s*trigger:\s*([A-Za-z0-9_$.'"#\-]+),\s*start:\s*'top top',\s*end:\s*'\+=' \+ Math\.round\(window\.innerHeight \* ([\d.]+)\),\s*\r?\n\s*pin:\s*true,\s*scrub:\s*([\d.]+),\s*anticipatePin:\s*1,\s*invalidateOnRefresh:\s*true\s*\r?\n(\s*)\}/g;

let total = 0;
for (const slug of PAGES) {
  const file = join(DESIGN, slug, 'index.html');
  let s = readFileSync(file, 'utf8');
  let n = 0;
  s = s.replace(RE, (_m, trigger, run, scrub) => {
    n++;
    return `scrollTrigger: W.scene(${trigger}, { run: ${run}, scrub: ${scrub} })`;
  });
  if (n) writeFileSync(file, s, 'utf8');
  total += n;
  console.log(`${slug.padEnd(17)} ${n} scene(s) rewired`);
}
console.log(`\n${total} rewired; ${18 - total} left for hand treatment (function-valued end)`);
