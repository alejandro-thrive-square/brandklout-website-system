/* .foot-grid is a THREE-tier mobile-first ladder (1 column, 2 from 768, the
   1.4fr/1fr/1fr/1fr masthead from 860). `_invert_mobile_first` re-asserted the
   pre-override value from the ORIGINAL base declaration only, never from a
   lower min-width tier, so the widest rule's inversion put `1fr` back on
   `medium` and the footer collapsed to ONE column across 768-991 on all three
   pages. The converter is fixed and the regenerated payload carries
   `medium: 1fr 1fr`; this brings the already-pasted site up to it.
   Source Asana task GID: 1217040406855582 */
import { callTool as call } from './wfmcp.mjs';
import { liveStyles, SITE, PAGE } from './wfstyles.mjs';

const ctx = 'Restoring the footer grid to two columns on tablet widths, which the design specifies.';
const WANT = '1fr 1fr';

const list = await liveStyles('Finding every footer grid record that collapses to one column on tablets.');
const targets = list.filter(s => /(^|\.)foot-grid$/.test((s.selector || '').replace(/^\./, '')));
const seen = new Set();
const uniq = targets.filter(t => !seen.has(t.selector) && seen.add(t.selector));
console.log('foot-grid records:', uniq.map(t => t.selector).join(', ') || '(none)');

for (const t of uniq) {
  const chain = t.selector.split('.').filter(Boolean);
  await call('data_style_tool', { siteId: SITE, pageId: PAGE, context: ctx, actions: [{
    label: `${t.selector}@medium`,
    update_style: {
      style_name: chain[chain.length - 1],
      parent_style_names: chain.slice(0, -1),
      breakpoint_id: 'medium',
      properties: [{ property_name: 'grid-template-columns', property_value: WANT }],
    },
  }] });
  await new Promise(r => setTimeout(r, 900));
  console.log('  patched', t.selector);
}

// The push result is not the gate — the read-back is.
const after = await liveStyles('Verifying the footer grid now holds two columns on tablets.');
let bad = 0;
const checked = new Set();
for (const s of after) {
  if (!/(^|\.)foot-grid$/.test((s.selector || '').replace(/^\./, ''))) continue;
  if (checked.has(s.selector)) continue;
  checked.add(s.selector);
  const got = s.properties?.breakpoints?.medium?.properties?.['grid-template-columns'];
  const ok = got === WANT;
  if (!ok) bad++;
  console.log(ok ? 'OK  ' : 'FAIL', s.selector, 'medium =', got);
}
console.log(bad ? `${bad} record(s) still wrong` : 'all foot-grid records verified on the site');
process.exit(bad ? 1 : 0);
