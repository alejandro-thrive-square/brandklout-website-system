/**
 * fixveneers.mjs — the fifth dead cross-page link.
 *
 * fixlinks2.mjs excluded anything carrying a `-btn` style name on the reasoning
 * that the CTAs are buttons and the cross-sell links are inline text. That held
 * for four of the five. Veneers' is
 *   <a class="vnr-btn vnr-btn--ghost vnr-magnetic" href="https://../implants/">
 * — a cross-sell CTA that IS a button, so the filter skipped it and the run
 * reported "1 non-button candidate" on a page with a broken link.
 *
 * Targeted here rather than by widening the filter, because widening it means
 * reading settings for every link on every page again, which is what the rate
 * limit will not tolerate.
 *
 *   node fixveneers.mjs [--apply]
 */
import { callTool } from './wfmcp.mjs';

const SITE = '693c51e685b19f0d0c149cab';
const VENEERS = '6a7a21fef87845352663538f';
const IMPLANTS = '6a79f2aeabc1d37969522293';
const APPLY = process.argv.includes('--apply');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function call(tool, args, pick) {
  for (let i = 0; i < 8; i++) {
    const r = await callTool(tool, args);
    let v;
    try { v = pick(JSON.parse(r.text)); } catch { v = undefined; }
    if (v !== undefined && v !== null) return v;
    const limited = /\b429\b/.test(r.text);
    process.stderr.write(`   …${limited ? '429' : 'no data'}, waiting\n`);
    await sleep(limited ? 20000 : 2500);
  }
  throw new Error(`no usable response from ${tool}`);
}

const all = await call('data_element_tool', {
  siteId: SITE, pageId: VENEERS,
  context: 'Locating the veneers cross-sell button that still points at a malformed relative URL.',
  actions: [{ label: 'q', query_elements: { queries: [{ label: 'a', element_filter: { type: 'Link' } }] } }],
}, (o) => o?.result?.[0]?.data?.[0]?.matches);
await sleep(1500);

// Ghost buttons only — the primary CTAs are the booking links.
const ghosts = all.filter((e) => (e.styleNames || []).some((n) => n.includes('--ghost')));
console.log(`${all.length} links, ${ghosts.length} ghost buttons to check`);

let done = 0;
for (const el of ghosts) {
  const settings = await call('data_element_settings_tool', {
    siteId: SITE, pageId: VENEERS,
    context: 'Reading a ghost button target to find the malformed cross-page link.',
    actions: [{ label: 's', get_settings: { type: 'all_raw_settings', element_id: el.id } }],
  }, (o) => o?.result?.[0]?.data?.matches);
  await sleep(1500);
  const to = settings.find((x) => x.key === 'link')?.value?.to;
  const label = settings.find((x) => x.key === 'text')?.value?.innerText || '';
  console.log(`   ${JSON.stringify(to)}  "${label.slice(0, 40)}"`);
  if (to !== '../implants/') continue;

  if (!APPLY) { done++; console.log('      would fix -> page ' + IMPLANTS); continue; }
  const status = await call('data_element_tool', {
    siteId: SITE, pageId: VENEERS,
    context: 'Repointing the veneers cross-sell button at the published implants landing page.',
    actions: [{ label: 'set', set_link: { id: el.id, linkType: 'page', link: IMPLANTS } }],
  }, (o) => o?.result?.[0]?.status ?? null);
  console.log(`      ${status === 'success' ? 'SET' : 'FAIL'} -> page ${IMPLANTS}`);
  if (status === 'success') done++;
  await sleep(1500);
}
console.log(`\n${done} link ${APPLY ? 'repointed' : 'to repoint'}`);
