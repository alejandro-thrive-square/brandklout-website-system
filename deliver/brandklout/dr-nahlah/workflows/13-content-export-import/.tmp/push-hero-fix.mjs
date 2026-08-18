#!/usr/bin/env node
/**
 * push-hero-fix.mjs — make the hero editable in the Instatic canvas, and publish.
 *
 * The design hides [data-anim="hide"] until the reveal runtime adds .wz-ready.
 * That runtime does not run in the editor canvas, so the hero heading, lead and
 * buttons were invisible while editing; only the background film showed. The
 * PUBLISHED bundle already carried `[data-anim="hide"]{visibility:visible
 * !important}` from an earlier pass, so the live page was never affected - the
 * registry and the bundle simply disagreed. site_apply_css has already brought
 * the registry into line for the canvas; this puts the same rule in the code
 * asset so it survives the publish-time purge.
 */
import { callJson } from './instatic-mcp.mjs';

const PATH = 'src/styles/runtime-states.css';
const ANCHOR = '.ch-invitation .iv-gallery { display: grid;';

const BLOCK = `/* --------------------------------------------------------------------------
   HERO REVEAL, MADE UNCONDITIONAL (2026-08-18)
   [data-anim="hide"] is hidden by the design until the reveal runtime adds
   .wz-ready. That runtime does not run in the Instatic editor canvas, so the
   hero heading, lead and buttons were invisible while editing and only the
   background film showed. The published bundle already forced them visible with
   an !important rule, so the live page was never wrong; the registry and the
   bundle just disagreed. The reveal is therefore off on this platform in both
   places, deliberately. Getting the animation back means making .wz-ready fire
   reliably here, which is its own piece of work.
   -------------------------------------------------------------------------- */
[data-anim="hide"] { visibility: visible; }

`;

const cur = await callJson('site_read_code_asset', { path: PATH });
if ((cur.content || '').includes('HERO REVEAL')) {
  console.log('already present');
} else {
  if (!(cur.content || '').includes(ANCHOR)) throw new Error('anchor not found in stylesheet');
  await callJson('site_patch_code_asset', {
    path: PATH, expectedHash: cur.hash,
    replacements: [{ oldText: ANCHOR, newText: BLOCK + ANCHOR }],
  });
  const after = await callJson('site_read_code_asset', { path: PATH });
  console.log('installed:', (after.content || '').includes('HERO REVEAL'),
              'stylesheet now', (after.content || '').length, 'chars');
}

const p = await callJson('site_publish', {}, { tries: 3, waitMs: 4000 });
console.log('publish:', JSON.stringify(p));
