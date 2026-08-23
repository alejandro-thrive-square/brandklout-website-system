/**
 * faqclean.mjs — remove elements I created in error inside the FAQ headings.
 *
 * The first conversion attempt wrapped data_element_builder in the same
 * retry-on-empty-response helper the READ calls use. The build succeeded every
 * time; only my parse of the response failed — so eight identical elements
 * were created inside one h3 before the helper gave up. Retrying a CREATE is
 * never safe: an unrecognised response is not evidence that nothing happened.
 *
 * This deletes every non-HtmlEmbed child of an FAQ h3 — i.e. everything that
 * was not there before I started. Dry run by default.
 *
 *   node faqclean.mjs [--apply] [--page implants]
 */
import { callTool } from './wfmcp.mjs';
const SITE = '693c51e685b19f0d0c149cab';
const PAGES = { implants: '6a79f2aeabc1d37969522293', aox: '6a7a21d7f34df29a4defacdf',
  veneers: '6a7a21fef87845352663538f', emergency: '6a7a223bf8c58b0aa0c6af2e',
  'dentist-near-me': '6a7a2268da766fb28cddb149', 'next-door': '6a7a228d106ed97b8a7885c9' };
const APPLY = process.argv.includes('--apply');
const ONLY = process.argv.includes('--page')
  ? process.argv[process.argv.indexOf('--page') + 1] : null;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function read(tool, args, pick) {
  for (let i = 0; i < 8; i++) {
    const r = await callTool(tool, args);
    let v; try { v = pick(JSON.parse(r.text)); } catch { v = undefined; }
    if (v !== undefined && v !== null) return v;
    await sleep(/\b429\b/.test(r.text) ? 20000 : 3000);
  }
  throw new Error('no usable response from ' + tool);
}

let removed = 0;
for (const [page, pid] of Object.entries(PAGES)) {
  if (ONLY && ONLY !== page) continue;
  const body = await read('data_element_tool', { siteId: SITE, pageId: pid,
    context: 'Finding stray elements inside the FAQ headings so they can be removed.',
    actions: [{ label: 't', get_all_elements: {} }] }, (o) => o?.result?.[0]?.data);
  await sleep(1200);

  const strays = [];
  (function walk(n, parent) {
    if (!n?.id) return;
    if (parent?.settings?.tag === 'h3' && n.type !== 'HtmlEmbed'
        && (n.styleNames || []).includes(`${page === 'dentist-near-me' ? 'dnm' : page === 'next-door' ? 'nxd' : page === 'implants' ? 'imp' : page === 'veneers' ? 'vnr' : page === 'emergency' ? 'emg' : 'aox'}-faq__q`)) {
      strays.push(n.id);
    }
    (n.children || []).forEach((c) => walk(c, n));
  })(body, null);

  console.log(`${page}: ${strays.length} stray element(s) in FAQ headings`);
  if (!APPLY) continue;
  for (const id of strays) {
    const st = await read('data_element_tool', { siteId: SITE, pageId: pid,
      context: 'Removing an element created in error inside an FAQ heading.',
      actions: [{ label: 'rm', remove_element: { id } }] }, (o) => o?.result?.[0]?.status ?? null);
    console.log(`   ${id.element.slice(-8)} ${st}`);
    if (st === 'success') removed++;
    await sleep(1200);
  }
}
console.log(`\n${APPLY ? 'removed' : 'would remove'} ${removed}`);
