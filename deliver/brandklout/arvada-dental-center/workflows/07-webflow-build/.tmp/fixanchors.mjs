/**
 * fixanchors.mjs — point the in-page CTAs at ids that exist.
 *
 * THE DEFECT. The packager prefixes every id (`consult` -> `imp-consult`) and
 * rewrites the hrefs it can see in the pasted markup, but a link stored as a
 * Webflow link SETTING (`{mode:"url", to:"#consult"}`) is not markup and was
 * left alone. So the published page carries both `href="#imp-consult"` (works)
 * and `href="#consult"` (lands on nothing) — 29 links across six pages,
 * including every primary CTA: "Free consultation", "Claim $109 offer",
 * "Book my smile evaluation", "Request a call back".
 *
 * WHY NO GATE CAUGHT IT. verify_links.mjs strips the page prefix before
 * comparing, because `#terms` publishing as `#imp-terms` is a correct rename —
 * which means an href pointing at an id that does not exist ANYWHERE reads as a
 * perfect match against the design. The check that finds it is not
 * design-vs-staging, it is href-vs-ids-on-the-same-page (.tmp/anchorcheck.mjs).
 *
 *   node fixanchors.mjs [--apply]
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { callTool } from './wfmcp.mjs';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const SITE = '693c51e685b19f0d0c149cab';
const PAGES = {
  implants: { id: '6a79f2aeabc1d37969522293', slug: 'dental-implants-ads-landing', pfx: 'imp' },
  aox: { id: '6a7a21d7f34df29a4defacdf', slug: 'all-on-x-ads-landing', pfx: 'aox' },
  veneers: { id: '6a7a21fef87845352663538f', slug: 'porcelain-veneers-ads-landing', pfx: 'vnr' },
  emergency: { id: '6a7a223bf8c58b0aa0c6af2e', slug: 'emergency-dentist-ads-landing', pfx: 'emg' },
  'dentist-near-me': { id: '6a7a2268da766fb28cddb149', slug: 'dentist-near-me-ads-landing', pfx: 'dnm' },
  'next-door': { id: '6a7a228d106ed97b8a7885c9', slug: 'next-door-family-ads-landing', pfx: 'nxd' },
};
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

let fixed = 0;
const unfixable = [];
for (const [page, { id: pid, slug, pfx }] of Object.entries(PAGES)) {
  const html = readFileSync(join(HERE, 'staging', `${slug}.html`), 'utf8');
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));

  const links = await call('data_element_tool', {
    siteId: SITE, pageId: pid,
    context: 'Listing links to find in-page anchors whose target id does not exist after the id rename.',
    actions: [{ label: 'q', query_elements: { queries: [{ label: 'a', element_filter: { type: 'Link' } }] } }],
  }, (o) => o?.result?.[0]?.data?.[0]?.matches);
  await sleep(1200);
  console.log(`##### ${page} (${links.length} links)`);

  for (const el of links) {
    const settings = await call('data_element_settings_tool', {
      siteId: SITE, pageId: pid,
      context: 'Reading a link target to see whether its in-page anchor still resolves.',
      actions: [{ label: 's', get_settings: { type: 'all_raw_settings', element_id: el.id } }],
    }, (o) => o?.result?.[0]?.data?.matches);
    await sleep(1200);

    const link = settings.find((x) => x.key === 'link')?.value;
    const label = settings.find((x) => x.key === 'text')?.value?.innerText || '';
    const to = link?.to;
    if (!to || !String(to).startsWith('#')) continue;
    const anchor = String(to).slice(1);
    if (ids.has(anchor)) continue;                       // already resolves

    const prefixed = `${pfx}-${anchor}`;
    if (!ids.has(prefixed)) {
      // e.g. `#main`: the design's <main id="main"> sits outside every packaged
      // section, so neither `main` nor `<pfx>-main` exists. Not renameable.
      unfixable.push(`${page}: "${label.slice(0, 30)}" -> #${anchor} (no such element)`);
      console.log(`   NO TARGET   "${label.slice(0, 28)}"  #${anchor}`);
      continue;
    }
    if (!APPLY) { fixed++; console.log(`   would fix   "${label.slice(0, 28)}"  #${anchor} -> #${prefixed}`); continue; }
    const status = await call('data_element_tool', {
      siteId: SITE, pageId: pid,
      context: 'Repointing an in-page CTA at the renamed section id so it scrolls again.',
      actions: [{ label: 'set', set_link: { id: el.id, linkType: 'url', link: `#${prefixed}` } }],
    }, (o) => o?.result?.[0]?.status ?? null);
    console.log(`   ${status === 'success' ? 'SET  ' : 'FAIL '}      "${label.slice(0, 28)}"  #${anchor} -> #${prefixed}`);
    if (status === 'success') fixed++;
    await sleep(1200);
  }
}
console.log(`\n${fixed} anchors ${APPLY ? 'repointed' : 'to repoint'}`);
console.log(`${unfixable.length} with no target at all:\n  ${unfixable.join('\n  ')}`);
