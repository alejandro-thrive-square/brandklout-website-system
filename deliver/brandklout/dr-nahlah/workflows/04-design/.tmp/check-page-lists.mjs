#!/usr/bin/env node
/**
 * check-page-lists.mjs — every gate that names pages must name pages that exist.
 *
 * Twice on 2026-08-19 a hardcoded list drifted from the build and the gate did
 * not say so: site-test fetched a 404 and threw `Uncaught` on a null #burger,
 * and fluid-qa measured the 404 page's 16px root and reported the fluid type
 * scale as broken at two widths. Both look like product bugs. Neither was.
 *
 * A gate pointed at a page that does not exist is not a failing gate, it is an
 * absent one. This is cheap enough to run before the others.
 */
import fs from 'node:fs';
import path from 'node:path';

const HERE = import.meta.dirname;
const built = new Set(fs.readdirSync(path.join(HERE, 'final-site'))
  .filter((f) => f.endsWith('.html')).map((f) => f.replace(/\.html$/, '')));

const src = fs.readFileSync(path.join(HERE, 'site-src', 'build-site.mjs'), 'utf8');
const spec = [...(/const PAGES = \[([\s\S]*?)\];/.exec(src)[1])
  .matchAll(/slug:\s*"([^"]+)"/g)].map((m) => m[1]);

let bad = 0;
const missing = spec.filter((s) => !built.has(s));
const extra = [...built].filter((b) => !spec.includes(b));
if (missing.length) { console.log(`FAIL  in build spec but not built: ${missing.join(', ')}`); bad++; }
if (extra.length) { console.log(`FAIL  built but not in the build spec: ${extra.join(', ')}`); bad++; }

for (const gate of ['fluid-qa.mjs', 'swap-proof.mjs']) {
  const raw = fs.readFileSync(path.join(HERE, gate), 'utf8');
  // Comments are stripped FIRST. A note explaining which page was retired
  // quotes that page's slug, and scanning the raw text turns the explanation
  // into a failure: the gate reported fluid-qa as naming a dead page when the
  // only mention was the comment saying it had been replaced.
  const t = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const named = new Set();
  // Two shapes in play: "slug.html" used as a path, and bare "slug" entries in
  // an array literal, several per line. Matching only line-anchored entries
  // found 1 of fluid-qa's 25 and would have reported a clean run over a list
  // that was almost entirely unchecked.
  for (const m of t.matchAll(/"([a-z0-9-]+)\.html"/g)) named.add(m[1]);
  const arr = /const PAGES[^[]*\[([\s\S]*?)\];/.exec(t);
  if (arr) for (const m of arr[1].matchAll(/"([a-z0-9-]+)"/g)) named.add(m[1]);
  const dead = [...named].filter((n) => !built.has(n) && n !== 'index');
  if (dead.length) { console.log(`FAIL  ${gate} names pages that do not exist: ${dead.join(', ')}`); bad++; }
  else console.log(`PASS  ${gate} names ${named.size} pages, all of which exist`);
}
console.log(`PASS  build spec and final-site agree on ${spec.length} pages`);
process.exit(bad ? 1 : 0);
