/**
 * fixlinks2.mjs — repoint the five dead cross-page links without exhausting
 * the API's rate limit.
 *
 * THE PROBLEM. The design links siblings relatively (`../aox/`). Webflow stores
 * that as link {mode:"url", to:"../aox/"} and the publisher prepends https://
 * to any url-mode target that is not absolute, so the published href is
 * `https://../aox/` — host "..", which resolves nowhere.
 *
 * WHY THIS IS THE THIRD ATTEMPT.
 *  - Walking every Link and reading its settings is ~90 calls against an API
 *    that rate-limits at roughly 60/minute; the run spent itself backing off
 *    429s and never reached a write.
 *  - Filtering the query by text does not work: `{type:'Link', text:'full-arch'}`
 *    returns 0 while `{text:'full-arch'}` alone returns 3. A Link's text lives
 *    in a child String node, so the Link element itself never matches a text
 *    filter. Combining the two silently yields nothing.
 *
 * WHAT WORKS. Every one of these is an inline text link inside a paragraph, so
 * it carries NO style names — the buttons all have `<pfx>-btn` classes. That
 * cuts the settings reads from 14 per page to about 3, which fits the budget.
 *
 * link_type "page", not a path string: Webflow resolves the URL itself, so the
 * link survives the move to the custom domain and any slug change.
 *
 *   node fixlinks2.mjs [--apply]
 */
import { callTool } from './wfmcp.mjs';

const SITE = '693c51e685b19f0d0c149cab';
const P = {
  implants: '6a79f2aeabc1d37969522293', aox: '6a7a21d7f34df29a4defacdf',
  veneers: '6a7a21fef87845352663538f', emergency: '6a7a223bf8c58b0aa0c6af2e',
  'dentist-near-me': '6a7a2268da766fb28cddb149', 'next-door': '6a7a228d106ed97b8a7885c9',
};
/** the design's relative target -> the page it means */
const TARGET = {
  '../implants/': P.implants, '../aox/': P.aox, '../veneers/': P.veneers,
  '../emergency/': P.emergency, '../dentist-near-me/': P['dentist-near-me'],
  '../next-door/': P['next-door'],
};

const APPLY = process.argv.includes('--apply');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Retry on 429, which the MCP reports as a success-shaped envelope with no data. */
async function call(tool, args, pick) {
  for (let i = 0; i < 6; i++) {
    const r = await callTool(tool, args);
    let v;
    try { v = pick(JSON.parse(r.text)); } catch { v = undefined; }
    if (v !== undefined && v !== null) return v;
    const limited = /\b429\b/.test(r.text);
    process.stderr.write(`   …${limited ? '429' : 'no data'}, waiting\n`);
    await sleep(limited ? 15000 : 2000);
  }
  throw new Error(`no usable response from ${tool}`);
}

let fixed = 0;
const review = [];
for (const [page, pid] of Object.entries(P)) {
  const all = await call('data_element_tool', {
    siteId: SITE, pageId: pid,
    context: 'Listing link elements to find the cross-page targets the publisher renders as malformed URLs.',
    actions: [{ label: 'q', query_elements: { queries: [{ label: 'a', element_filter: { type: 'Link' } }] } }],
  }, (o) => o?.result?.[0]?.data?.[0]?.matches);
  await sleep(1200);

  /**
   * Everything that is not a button or the nav. "No style names at all" was
   * too narrow — it found 4 of the 5 and missed veneers, whose cross-sell link
   * carries the kit's `.more` class. The CTAs are the ones worth excluding:
   * they all carry a `-btn` name, and the nav logo/phone are `-nav-`.
   */
  const candidates = all.filter((e) => !(e.styleNames || [])
    .some((n) => /-btn\b|-nav-/.test(n)));
  console.log(`##### ${page}: ${all.length} links, ${candidates.length} non-button candidates`);

  for (const el of candidates) {
    const settings = await call('data_element_settings_tool', {
      siteId: SITE, pageId: pid,
      context: 'Reading a link target to decide whether it is one of the malformed cross-page links.',
      actions: [{ label: 's', get_settings: { type: 'all_raw_settings', element_id: el.id } }],
    }, (o) => o?.result?.[0]?.data?.matches);
    await sleep(1200);

    const to = settings.find((x) => x.key === 'link')?.value?.to;
    const label = settings.find((x) => x.key === 'text')?.value?.innerText || '';
    if (!to || !String(to).startsWith('../')) continue;

    const target = TARGET[to];
    if (!target) {
      // `../` alone is the LOCAL REVIEW INDEX ("All landing pages"). No
      // published page it could correctly point at, so it is only reported.
      review.push(`${page}: "${label}" -> ${to}`);
      console.log(`   REVIEW-ONLY  "${label}"  ${to}`);
      continue;
    }
    if (!APPLY) { fixed++; console.log(`   would fix    "${label}"  ${to} -> page ${target}`); continue; }
    // `linkType`, camelCase. data_element_builder takes `link_type`; this tool
    // takes `linkType`, and passing the wrong one fails schema validation with
    // a message about an unrelated action (`get_all_elements` missing), which
    // reads like anything except "you misspelled a field".
    const status = await call('data_element_tool', {
      siteId: SITE, pageId: pid,
      context: 'Repointing a cross-page link at the published sibling landing page.',
      actions: [{ label: 'set', set_link: { id: el.id, linkType: 'page', link: target } }],
    }, (o) => o?.result?.[0]?.status ?? null);
    console.log(`   ${status === 'success' ? 'SET  ' : 'FAIL '}       "${label}"  ${to} -> page ${target}`);
    if (status === 'success') fixed++;
    await sleep(1200);
  }
}
console.log(`\n${fixed} cross-page links ${APPLY ? 'repointed' : 'to repoint'}`);
console.log(`${review.length} review-only links left for a decision${review.length ? ':\n  ' + review.join('\n  ') : ''}`);
