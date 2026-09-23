/**
 * fixlinks.mjs — repoint the cross-page links the paste left pointing nowhere.
 *
 * The design links siblings relatively (`../aox/`). Webflow stored that as
 * link {mode:"url", to:"../aox/"} and the publisher prepends https:// to any
 * url-mode target that is not absolute, so the published href is
 * `https://../aox/` — host "..", which resolves nowhere. Both the style gate
 * and the copy gate pass it: the anchor is styled and worded exactly like the
 * design's, it just goes nowhere.
 *
 * Repointed with link_type "page", not a path string. Webflow then resolves
 * the URL itself, so the link keeps working on the custom domain and survives
 * a slug change; a literal "/all-on-x-ads-landing" would be right today only.
 *
 *   node fixlinks.mjs [--apply]
 */
import { callTool } from './wfmcp.mjs';

const SITE = '693c51e685b19f0d0c149cab';
const PAGES = {
  implants: '6a79f2aeabc1d37969522293', aox: '6a7a21d7f34df29a4defacdf',
  veneers: '6a7a21fef87845352663538f', emergency: '6a7a223bf8c58b0aa0c6af2e',
  'dentist-near-me': '6a7a2268da766fb28cddb149', 'next-door': '6a7a228d106ed97b8a7885c9',
};
/** the design's relative target -> the page it means */
const TARGET = {
  '../implants/': PAGES.implants, '../aox/': PAGES.aox, '../veneers/': PAGES.veneers,
  '../emergency/': PAGES.emergency, '../dentist-near-me/': PAGES['dentist-near-me'],
  '../next-door/': PAGES['next-door'],
};
const APPLY = process.argv.includes('--apply');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * THE WEBFLOW DATA API RATE-LIMITS AT ROUGHLY 60 REQUESTS/MINUTE, and every
 * get_settings costs a `GET /v2/pages` behind the scenes. Firing them back to
 * back returns `429`, which the tool reports as a success-shaped envelope
 * carrying an `error` key and no data — so a naive reader sees "no link
 * setting" and skips the element. That is exactly how the first version of
 * this script declared implants clean while one of its links was demonstrably
 * broken: a rate limit read as "nothing to fix".
 *
 * So: pace at ~1.1s, back off in seconds (not milliseconds) on 429, and THROW
 * rather than let missing data read as absence of work.
 */
const PACE = 1100;
async function settings(pid, id) {
  for (let i = 0; i < 5; i++) {
    const r = await callTool('data_element_settings_tool', {
      siteId: SITE, pageId: pid,
      context: 'Reading a link target to decide whether it is a malformed cross-page link.',
      actions: [{ label: 's', get_settings: { type: 'all_raw_settings', element_id: id } }],
    });
    let m = null;
    try { m = JSON.parse(r.text)?.result?.[0]?.data?.matches; } catch { /* retry */ }
    if (Array.isArray(m)) return m;
    const rateLimited = /\b429\b/.test(r.text);
    process.stderr.write(`   …${rateLimited ? '429, backing off' : 'no data, retrying'}\n`);
    await sleep(rateLimited ? 8000 * (i + 1) : 1000 * (i + 1));
  }
  throw new Error(`settings unavailable after 5 tries for ${JSON.stringify(id)}`);
}

async function links(pid) {
  for (let i = 0; i < 4; i++) {
    const { text } = await callTool('data_element_tool', {
      siteId: SITE, pageId: pid,
      context: 'Listing link elements to find the malformed cross-page targets.',
      actions: [{ label: 'l', query_elements: { queries: [{ label: 'a', element_filter: { type: 'Link' } }] } }],
    });
    let m = null;
    try { m = JSON.parse(text)?.result?.[0]?.data?.[0]?.matches; } catch { /* retry */ }
    if (Array.isArray(m)) return m;
    await sleep(400 * (i + 1));
  }
  throw new Error('link list unavailable after 4 tries');
}

let fixed = 0;
const review = [];
for (const [page, pid] of Object.entries(PAGES)) {
  const ms = await links(pid);
  console.log(`##### ${page} (${ms.length} links)`);
  for (const el of ms) {
    const link = (await settings(pid, el.id)).find((x) => x.key === 'link')?.value;
    await sleep(PACE);
    const to = link?.to;
    if (!to || !String(to).startsWith('../')) continue;

    const target = TARGET[to];
    if (!target) {
      // `../` alone is the LOCAL REVIEW INDEX ("All landing pages"). There is
      // no published page it could correctly point at, so it is reported.
      review.push(`${page}: "${to}"`);
      console.log(`   REVIEW-ONLY  ${to}  — no published equivalent, left alone`);
      continue;
    }
    if (!APPLY) { fixed++; console.log(`   would fix    ${to}  ->  page ${target}`); continue; }
    const s = await callTool('data_element_tool', {
      siteId: SITE, pageId: pid,
      context: 'Repointing a cross-page link at the published sibling landing page.',
      actions: [{ label: 'set', set_link: { id: el.id, link_type: 'page', link: target } }],
    });
    const bad = /"status"\s*:\s*"error"/.test(s.text);
    console.log(`   ${bad ? 'FAIL ' : 'set  '}        ${to}  ->  page ${target}${bad ? ' ' + s.text.slice(0, 200) : ''}`);
    if (!bad) fixed++;
    await sleep(150);
  }
}
console.log(`\n${fixed} cross-page links ${APPLY ? 'repointed' : 'to repoint'}`);
console.log(`${review.length} review-only links left for a decision${review.length ? ':\n  ' + review.join('\n  ') : ''}`);
