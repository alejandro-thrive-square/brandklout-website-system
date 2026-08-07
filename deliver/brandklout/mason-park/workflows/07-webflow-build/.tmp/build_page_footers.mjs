#!/usr/bin/env node
/**
 * build_page_footers.mjs — rebuild `_js/<page>.sections.min.js`, the per-page
 * footer custom code block, from `.tmp/<page>/webflow-custom-code.js`.
 *
 * Source Asana task GID: 1217040406855582
 *
 * WHY THIS HAS TO BE REBUILT ON A RE-THEME
 * ----------------------------------------
 * The chapter JS animates CONCRETE colour values — `gsap.to(el, { color:
 * '#26292F' })`, `m.style.background = '#00B4D8'`, `borderColor: on ?
 * '#8FDCEC' : 'rgba(255,255,255,.14)'`. None of that is reachable by a CSS
 * property update, so a re-theme that only moves styles leaves every animated
 * END STATE on the old palette: the page loads correct and drifts back to the
 * old colours as you scroll. Nothing static catches it.
 *
 * The mapping is NOT a global hex substitution — the same old hex maps to
 * different new ones in different places (`#c3a98e` becomes `#8FDCEC` on the
 * dark rail and `#00B4D8` on the light one) — so this rebuilds from the
 * re-themed source rather than patching the minified bundle.
 *
 * WHAT COUNTS AS "THE SECTIONS"
 * -----------------------------
 * `webflow-custom-code.js` is the whole page bundle: an IIFE wrapper, a marker
 * COMMENT for each script the design loaded externally, and the page's own
 * inline script blocks in between. The sections block is everything except the
 * wrapper and those marker comments — the two shared runtimes they stand for
 * (`mpd.js` in the site head, `mpd-flush.js` in the site footer) are installed
 * site-wide and are not part of this block.
 *
 * Do NOT slice "between the mpd.js and mpd-flush.js markers": on thank-you an
 * inline block sits AFTER the mpd-flush marker (the open/closed indicator and
 * the received timestamp), and that slice silently drops ~3KB of live code.
 * Do NOT strip trailing `})();` in a loop either — the same page ends with the
 * page-local IIFE's close immediately before the wrapper's, and a loop eats
 * both, leaving a file that will not parse.
 *
 * Verified against the pre-re-theme build: this recipe reproduces the
 * committed `invisalign.sections.min.js` and `new-patient-special.sections.
 * min.js` byte for byte; thank-you matches except for two mangled identifier
 * names, which is the same program.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
// execSync with a shell, not execFileSync: `npx.cmd` is a batch file and
// Node refuses to spawn it directly on Windows (EINVAL) since the 2024
// command-injection hardening.
import { execSync } from 'node:child_process';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PAGES = ['invisalign', 'new-patient-special', 'thank-you'];
const MARKER = '// External script from source design:';

/** The page's own inline scripts: everything but the wrapper and the markers. */
function sectionsOf(page, full) {
  const lines = full.split('\n');
  if (lines[0].trim() !== '(() => {') {
    throw new Error(`${page}: unexpected bundle wrapper ${JSON.stringify(lines[0])}`);
  }
  const body = lines.slice(1).filter((l) => !l.startsWith(MARKER));
  while (body.length && body.at(-1).trim() === '') body.pop();
  if (body.at(-1).trim() !== '})();') {
    throw new Error(`${page}: wrapper close is not the last line`);
  }
  body.pop();
  return body.join('\n');
}

const report = [];
for (const page of PAGES) {
  const srcPath = path.join(HERE, page, 'webflow-custom-code.js');
  const src = fs.readFileSync(srcPath, 'utf8');
  const sections = sectionsOf(page, src);

  const tmp = path.join(HERE, `_js/.${page}.sections.js`);
  fs.writeFileSync(tmp, sections, 'utf8');
  const out = execSync(`npx --no-install terser "${tmp}" --compress --mangle`, {
    encoding: 'utf8',
    shell: true,
    maxBuffer: 32 * 1024 * 1024,
  });
  fs.unlinkSync(tmp);

  const dest = path.join(HERE, '_js', `${page}.sections.min.js`);
  const before = fs.existsSync(dest) ? fs.readFileSync(dest, 'utf8') : '';
  fs.writeFileSync(dest, out, 'utf8');

  report.push({
    page,
    sourceBytes: sections.length,
    minBytes: out.length,
    previousBytes: before.length,
    changed: before.trim() !== out.trim(),
    // A cheap smoke test that the re-theme actually reached the bundle.
    oldPaletteHexRemaining: (out.match(/#(a8875f|c3a98e|7f9a8b|1b2224|f4ece2|e6dccf|dfe4e6|fbf9f7|778386)/gi) || []).length,
  });
}
console.log(JSON.stringify(report, null, 1));
