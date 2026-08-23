/**
 * addskip.mjs — restore the skip link the paste dropped.
 *
 * The design opens <body> with <a class="skip" href="#main">Skip to content</a>,
 * a WCAG 2.4.1 bypass block. It sits outside every section, so the packager
 * never carried it — the same reason <head>, <main> and the page settings did
 * not travel.
 *
 * Inserted as the FIRST child of the paste wrapper (which now carries
 * id="main", so the link has something to skip TO), styled by the .<pfx>-skip
 * rule build_page_code.mjs writes into the page head.
 *
 * Idempotent: a page that already has a skip link is skipped, so a re-run
 * cannot stack duplicates.
 */
import { callTool } from './wfmcp.mjs';

const SITE = '693c51e685b19f0d0c149cab';
const PAGES = {
  implants: { id: '6a79f2aeabc1d37969522293', pfx: 'imp' },
  aox: { id: '6a7a21d7f34df29a4defacdf', pfx: 'aox' },
  veneers: { id: '6a7a21fef87845352663538f', pfx: 'vnr' },
  emergency: { id: '6a7a223bf8c58b0aa0c6af2e', pfx: 'emg' },
  'dentist-near-me': { id: '6a7a2268da766fb28cddb149', pfx: 'dnm' },
  'next-door': { id: '6a7a228d106ed97b8a7885c9', pfx: 'nxd' },
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

let done = 0;
for (const [page, { id: pid, pfx }] of Object.entries(PAGES)) {
  const body = await call('data_element_tool', {
    siteId: SITE, pageId: pid,
    context: 'Locating the paste wrapper so the skip link can be inserted as its first child.',
    actions: [{ label: 't', get_all_elements: { depth: 2 } }],
  }, (o) => o?.result?.[0]?.data);
  await sleep(1200);

  const wrap = (body.children || [])[0];
  if (!wrap) { console.log(`${page}: no wrapper`); continue; }
  const already = (wrap.children || []).some((c) => (c.styleNames || []).includes(`${pfx}-skip`));
  if (already) { console.log(`${page}: skip link already present`); continue; }

  console.log(`${page}: inserting skip link as first child of wrapper`);
  if (!APPLY) { done++; continue; }

  const res = await call('data_element_builder', {
    siteId: SITE, pageId: pid,
    context: 'Restoring the WCAG bypass-block skip link the paste dropped.',
    actions: [{
      build_label: 'skip',
      parent_element_id: wrap.id,
      creation_position: 'prepend',
      element_schema: {
        type: 'TextLink',
        set_text: { text: 'Skip to content' },
        set_link: { link_type: 'url', link: '#main' },
        set_style: { style_names: [`${pfx}-skip`] },
      },
      return_element_info: true,
    }],
  }, (o) => (Array.isArray(o) ? o[0]?.status : o?.result?.[0]?.status) ?? null);
  console.log(`   ${res === 'success' ? 'ADDED' : 'FAILED ' + JSON.stringify(res)}`);
  if (res === 'success') done++;
  await sleep(1500);
}
console.log(`\n${done}/6 skip links ${APPLY ? 'added' : 'to add'}`);
