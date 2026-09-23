#!/usr/bin/env node
/**
 * verify-assets.mjs — RUN THIS BEFORE EVERY PUBLISH.
 *
 * On 2026-08-19 the site published with 59% of its stylesheet missing. 66 of the
 * 137 classes on the home page had no rule at all.
 *
 * The cause was not the publish and not a purge. `push-site-css.mjs` clears the
 * asset in slices before refilling it, and that run CRASHED between the two
 * steps. What it left behind was the banner plus the tail it had not reached
 * yet: a 21,736-character file that is still a valid stylesheet, still enabled,
 * still served, and wrong. The published bundle began mid-way through the
 * design system, at `52-emergency-notice.css`, because that is where the
 * interrupted clear had got to.
 *
 * Nothing caught it. Each pusher verifies its own write, but only if it reaches
 * the end; a crash skips the verification along with the fill. The page pushes
 * that followed all passed, because a page's markup is fine when the stylesheet
 * is broken. So the only safe check is an independent one that asks the server
 * what it is holding and compares it to what should be there.
 *
 * A clear-then-fill against a live asset has a window where the asset is
 * incomplete. That window cannot be closed with the tools this platform gives
 * (no atomic replace, no staging path with a swappable runtime), so it is
 * covered by checking afterwards instead of by hoping.
 *
 *   node verify-assets.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { callJson } from './instatic-mcp.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BUILD = path.resolve(HERE, '../../04-design/.tmp/final-site/assets');

/** path on Instatic -> local file it must equal, ignoring the pusher's banner. */
const EXPECT = {
  'src/styles/site.css': path.join(BUILD, 'site.css'),
  'src/scripts/site.js': path.join(BUILD, 'site.js'),
};
/** Assets with no local counterpart, checked for plausibility only. */
const FLOOR = {
  'src/styles/runtime-states.css': 10000,
  'src/scripts/gsap-head-i.js': 100000,
};

async function readWhole(p) {
  let out = '', part = 1;
  for (;;) {
    const r = await callJson('site_read_code_asset', { path: p, part });
    out += r.content ?? '';
    const n = r.pageInfo?.nextPart;
    if (!n) return out;
    part = n;
  }
}

let bad = 0;
for (const [p, localPath] of Object.entries(EXPECT)) {
  const server = await readWhole(p);
  const local = fs.readFileSync(localPath, 'utf8');
  // the pushers prepend a banner and append a sentinel; strip both before comparing
  const stripped = server.replace(/^\/\*[^\n]*\*\/\n/, '').replace(/\/\*__wz_end__\*\/\s*$/, '');
  if (stripped.trim() === local.trim()) {
    console.log(`PASS  ${p.padEnd(32)} ${server.length} chars, matches the build`);
  } else {
    bad++;
    console.log(`FAIL  ${p.padEnd(32)} server ${server.length} vs local ${local.length}`);
    if (!stripped.includes(local.slice(0, 80))) {
      console.log(`      the file does not even start where the build does; a clear was interrupted`);
    }
  }
}
for (const [p, min] of Object.entries(FLOOR)) {
  const server = await readWhole(p);
  const ok = server.length >= min;
  if (!ok) bad++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${p.padEnd(32)} ${server.length} chars (floor ${min})`);
}

console.log(bad ? `\n${bad} asset(s) wrong. DO NOT PUBLISH until they are re-pushed.`
                : `\nall runtime assets match the build; safe to publish.`);
process.exitCode = bad ? 1 : 0;
