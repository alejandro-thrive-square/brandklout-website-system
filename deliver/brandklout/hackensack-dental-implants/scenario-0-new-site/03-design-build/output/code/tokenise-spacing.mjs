// Client script, 2026-10-09. Puts the build's rem spacing (padding / margin / gap) on the Framework's
// spacing tokens, so one edit in the Framework panel moves every use (CLASS-STANDARD §10; structure-
// audit.mjs wants 80% for a new build).
//
//   exact  a value that EQUALS a house step becomes var(--space-*); a 1.5rem gap becomes var(--grid-gap)
//          (the 12-column grid's gutter), 1.375rem var(--heading-gap), 2.8125rem var(--stack-gap): Framework
//          Layout tokens of the same size. No visual change.
//   snap   (only in the files named with --snap) a value off the scale is moved to the nearest step BY
//          RATIO, the fleet's rule (snap-preview.mjs snapValue), then tokenised. Visible: a few px.
// Values inside calc() / min() / max() / clamp() and negative values are left alone.
//
// Usage (from the step's output/ folder): node code/tokenise-spacing.mjs [--snap a.css,b.css] [--apply]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const CSS = path.join(here, 'site-src', 'css');
const { snapValue } = await import(pathToFileURL(path.resolve(here, '../../../../tools/instatic-api-sync/snap-preview.mjs')).href);
const STEPS = { 0.25: 'xxsmall', 0.5: 'xsmall', 1: 'small', 2: 'medium', 3: 'large', 4: 'xlarge', 5: 'xxlarge', 6: 'huge', 8: 'xhuge', 12: 'xxhuge' };
/* the concept's two recurring off-scale measures, as Layout tokens of their own (same size, so no change):
   the space under a section headline (22px) and the gap between stacked blocks on a phone (45px) */
const SEMANTIC = { 1.375: 'heading-gap', 2.8125: 'stack-gap' };
const SPACE = /^(padding|margin)(-(top|right|bottom|left|block|inline))?$|^(gap|row-gap|column-gap)$/;
const GAP = /^(gap|row-gap|column-gap)$/;
const apply = process.argv.includes('--apply');
const snapArg = process.argv.indexOf('--snap');
const SNAP = new Set(snapArg > 0 ? process.argv[snapArg + 1].split(',') : []);
const files = ['10-client-first.css', '20-shell.css', '30-home.css', '40-components.css', '50-pages.css'];
const log = [];
for (const f of files) {
  const file = path.join(CSS, f);
  const src = fs.readFileSync(file, 'utf8');
  let n = 0;
  const out = src.replace(/([{;\s])([a-z-]+)(\s*:\s*)([^;{}]+)/g, (all, pre, prop, colon, value) => {
    if (!SPACE.test(prop) || /\b(calc|clamp|min|max)\(/.test(value)) return all;
    const v = value.replace(/(^|[\s])(\d*\.?\d+)rem\b/g, (m, before, num) => {
      let rem = Number(num);
      if (rem === 0) return m;
      if (GAP.test(prop) && rem === 1.5) { n++; log.push(`${f}  ${prop}: 1.5rem -> var(--grid-gap)`); return `${before}var(--grid-gap)`; }
      if (SEMANTIC[rem]) { n++; log.push(`${f}  ${prop}: ${rem}rem -> var(--${SEMANTIC[rem]})`); return `${before}var(--${SEMANTIC[rem]})`; }
      if (!STEPS[rem] && SNAP.has(f)) {
        const s = snapValue(rem);
        if (s !== null) { log.push(`${f}  ${prop}: ${rem}rem -> ${s}rem (${(rem * 16).toFixed(1)} -> ${s * 16}px)`); rem = s; }
      }
      if (!STEPS[rem]) return m;
      n++;
      return `${before}var(--space-${STEPS[rem]})`;
    });
    return `${pre}${prop}${colon}${v}`;
  });
  if (apply && out !== src) fs.writeFileSync(file, out);
  console.log(`${f.padEnd(22)} ${n} value(s) on tokens${apply ? '' : ' (dry run)'}`);
}
fs.writeFileSync(path.join(here, '..', 'tokenise-spacing.txt'), log.join('\n') + '\n');
console.log(`${log.length} change(s) listed in output/tokenise-spacing.txt`);
