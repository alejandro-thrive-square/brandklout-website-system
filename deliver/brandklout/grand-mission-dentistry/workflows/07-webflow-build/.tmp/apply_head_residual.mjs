/**
 * apply_head_residual.mjs — append the converter's page-head residual CSS to a
 * page's head custom-code block.
 *
 *   node apply_head_residual.mjs <implant|cosmetic|thank-you> [--dry]
 *
 * `<page>/whtml/page-head.css` holds the rules that cannot become Webflow
 * styles at all:
 *   - `!important` declarations — data_whtml_builder rejects them outright and
 *     one of them errors the WHOLE page insert, and a Webflow style cannot
 *     carry `!important` either. `.proof__rail { transform: none !important }`
 *     is the mobile fallback that has to beat GSAP's inline transform.
 *   - the 1280–1439 display step, for which Webflow has no max-width
 *     breakpoint between 992 and 1920.
 *
 * The block is delimited so re-running replaces it instead of stacking copies,
 * and the shared layer installed by install_page_code.mjs is left untouched —
 * this appends after it, it does not reinstall it.
 */
import fs from 'node:fs';
import { call, SITE, PAGES } from './mcp.mjs';

const name = process.argv[2];
const dry = process.argv.includes('--dry');
const pageId = PAGES[name];
if (!pageId) { console.error(`usage: node apply_head_residual.mjs <${Object.keys(PAGES).join('|')}> [--dry]`); process.exit(2); }

const BEGIN = '<!-- WHTML RESIDUAL CSS: BEGIN -->';
const END = '<!-- WHTML RESIDUAL CSS: END -->';

const css = fs.readFileSync(`${name}/whtml/page-head.css`, 'utf8').trim();
if (!css) { console.log(`${name}: no residual CSS — nothing to do`); process.exit(0); }

const read = async (why) => {
  const r = await call('data_scripts_tool', {
    siteId: SITE, context: why,
    actions: [{ label: 'head', get_page_freeform_code: { page_id: pageId, location: 'head' } }],
  });
  /* get_page_freeform_code answers {location, content} directly on `result` —
     NOT wrapped in the [{status, data}] envelope the element tools use.
     Guessing the envelope shape here read every page's head as the empty
     string and made a present shared layer look wiped. */
  const c = r[0].result?.content;
  if (typeof c !== 'string') throw new Error(`unexpected response shape: ${JSON.stringify(r[0]).slice(0, 300)}`);
  return c;
};

const current = await read(`Reading the ${name} landing page's head custom code so the converter's residual CSS can be appended without disturbing the shared layer already installed there.`);
const stripped = current.replace(new RegExp(`${BEGIN}[\\s\\S]*?${END}\\n?`), '');
const next = `${stripped.trimEnd()}\n${BEGIN}\n<style>\n${css}\n</style>\n${END}\n`;

console.log(`${name}: head ${current.length} -> ${next.length} chars (residual ${css.length})`);
if (current.includes(BEGIN)) console.log('  (an earlier residual block was found and replaced)');
if (!stripped.includes('GRAND MISSION LP SHARED LAYER (head)')) {
  console.error('REFUSING: the shared head layer is not present — install_page_code.mjs has not run on this page.');
  process.exit(1);
}
if (next.length > 50_000) { console.error(`REFUSING: ${next.length} chars exceeds the 50,000 per-block limit`); process.exit(1); }
if (dry) { console.log(next.slice(-400)); process.exit(0); }

await call('data_scripts_tool', {
  siteId: SITE,
  context: `Appending the ${name} landing page's residual CSS — the !important rule the style engine cannot express and the 1280-1439 display step Webflow has no breakpoint for — to its head custom code. Page-level only; site-wide custom code is forbidden on this production site.`,
  actions: [{ label: 'set', set_page_freeform_code: { page_id: pageId, location: 'head', content: next } }],
});

const back = await read(`Verifying the residual CSS landed in the ${name} landing page's head block.`);
const ok = back.includes(BEGIN) && back.includes(css.split('\n')[0]);
console.log(ok ? `installed and verified (${back.length} chars)` : 'FAILED — block not found on read-back');
process.exit(ok ? 0 : 1);
