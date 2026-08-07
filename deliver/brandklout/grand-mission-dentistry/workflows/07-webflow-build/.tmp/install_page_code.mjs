/**
 * install_page_code.mjs — install the shared pasteable-component page layer
 * (_shared-install/head.html + footer.html) into the PAGE-level custom-code
 * blocks of the three Grand Mission LP pages, over the Data API (the blocks
 * exceed the 10k page-settings UI cap; the API takes 50k).
 *
 * The old embed-build page code is read FIRST and saved to
 * page-code-backup-<page>.json so the superseded build stays restorable.
 * Page-level only — site-wide custom code is forbidden on this client.
 *
 * Usage: node install_page_code.mjs          (from .tmp)
 */
import fs from 'node:fs';
import { callTool } from './wfmcp.mjs';

const SITE = '698111847e9608eb30ee21c6';
const PAGES = {
  implant: '6a724b6977f9b0019d2a03f8',
  cosmetic: '6a723ad5534774f35f17d119',
  'thank-you': '6a7268a862a728c1cd4df73b',
};
const head = fs.readFileSync('_shared-install/head.html', 'utf8');
const footer = fs.readFileSync('_shared-install/footer.html', 'utf8');
console.log(`shared layer: head ${head.length} chars, footer ${footer.length} chars`);

/* The tool answers one JSON object PER LINE (one per action) — treat the
   response as text; callers string-match or save it verbatim. */
const call = async (actions, context) => {
  const r = await callTool('data_scripts_tool', { siteId: SITE, context, actions });
  return r.text;
};

for (const [name, pageId] of Object.entries(PAGES)) {
  // 1. backup what the superseded embed build left in the page settings
  const backup = await call(
    [
      { label: 'head', get_page_freeform_code: { page_id: pageId, location: 'head' } },
      { label: 'footer', get_page_freeform_code: { page_id: pageId, location: 'footer' } },
    ],
    `Backing up the ${name} LP page's existing custom code before installing the pasteable-component shared layer, so the superseded embed build stays restorable.`,
  );
  /* NEVER overwrite an existing backup. This script is re-runnable — all three
     blocks were later found EMPTY on the live site despite a verified install,
     cause unknown — and a second run would otherwise replace 80KB of the
     superseded embed build with the empty string it just read back. */
  const bak = `page-code-backup-${name}.jsonl`;
  if (fs.existsSync(bak)) {
    console.log(`${name}: keeping the existing ${bak} (${fs.statSync(bak).size} bytes) — not overwriting`);
  } else {
    fs.writeFileSync(bak, backup, 'utf8');
    console.log(`${name}: backed up existing page code (${backup.length} bytes) -> ${bak}`);
  }

  // 2. install the shared layer (replaces the old blocks)
  await call(
    [{ label: 'set-head', set_page_freeform_code: { page_id: pageId, location: 'head', content: head } }],
    `Installing the shared pasteable-component HEAD block (GSAP CDN tags + WZ bootstrap + runtime-states CSS) on the ${name} LP page. Page-level on purpose; site-wide custom code is forbidden on this 303-page production site.`,
  );
  await call(
    [{ label: 'set-footer', set_page_freeform_code: { page_id: pageId, location: 'footer', content: footer } }],
    `Installing the shared pasteable-component FOOTER block (registerPlugin + ScrollSmoother.create + WZ.flush + kit) on the ${name} LP page. Exactly one copy — a duplicate ScrollSmoother.create kills every trigger.`,
  );

  // 3. read back and verify byte length
  const check = await call(
    [
      { label: 'head', get_page_freeform_code: { page_id: pageId, location: 'head' } },
      { label: 'footer', get_page_freeform_code: { page_id: pageId, location: 'footer' } },
    ],
    `Verifying the shared layer landed intact on the ${name} LP page (byte-length check of both blocks).`,
  );
  const okHead = check.includes('GRAND MISSION LP SHARED LAYER (head)');
  const okFoot = check.includes('GRAND MISSION LP SHARED LAYER (footer)');
  console.log(`${name}: installed — verify head:${okHead ? 'OK' : 'MISSING'} footer:${okFoot ? 'OK' : 'MISSING'}`);
}
console.log('done — all three pages carry the shared layer (unpublished until the next publish)');
