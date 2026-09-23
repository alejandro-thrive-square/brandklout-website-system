/**
 * delete-dead-selectors.mjs — remove the registry rules nothing uses any more.
 *
 * Instatic's Selectors panel still holds the class system from the ORIGINAL
 * folder import: the pre-2026-08-17 vocabulary (std, st, cap, row, rv, fm,
 * creds, marquee, versus) plus converter artifacts (a-2, b-2, after-2). None of
 * it styles anything now, because every page is styled by the src/styles/site.css
 * code asset instead.
 *
 * WHY THE LIST IS SO CONSERVATIVE. `site_apply_css operation:"delete"` removes
 * the rule AND DETACHES THE CLASS FROM ELEMENTS. Three sources were checked
 * before a name was allowed onto the list, and each one removed candidates:
 *   - the 28 live documents        (112 of 198 registered names are in use)
 *   - src/scripts/site.js          (runtime-applied states: wz-kit, is-open, …)
 *   - src/styles/runtime-states.css (11 more: menu-open, open, solid, rv-play, …)
 * A class applied only at runtime appears in NONE of the documents, so a naive
 * "unused" diff proposes deleting exactly the classes whose loss killed the nav
 * menu on a previous pass.
 *
 *   node delete-dead-selectors.mjs [--dry]
 */
import fs from 'node:fs';
import { callJson, callWrite } from './instatic-mcp.mjs';

const sels = JSON.parse(fs.readFileSync('selectors-to-delete.json', 'utf8'));
console.log(`${sels.length} selectors queued for deletion`);
if (process.argv.includes('--dry')) { sels.forEach((s) => console.log('  ' + s)); process.exit(0); }

// The tool takes up to 100 selectors per call; go in small batches so a refusal
// names a short list rather than the whole set.
const SIZE = 12;
let done = 0;
for (let i = 0; i < sels.length; i += SIZE) {
  const batch = sels.slice(i, i + SIZE);
  const r = await callWrite('site_apply_css', { operation: 'delete', selectors: batch });
  done += batch.length;
  console.log(`  ${done}/${sels.length}  ${JSON.stringify(r).slice(0, 120)}`);
}
console.log('\ndeleted; re-read the styles and re-pull the documents to verify');
