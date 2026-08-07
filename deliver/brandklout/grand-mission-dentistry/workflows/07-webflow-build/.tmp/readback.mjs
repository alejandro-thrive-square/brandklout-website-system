import { callTool } from './wfmcp.mjs';
const SITE = '698111847e9608eb30ee21c6';
const P = { implant: '6a724b6977f9b0019d2a03f8', cosmetic: '6a723ad5534774f35f17d119', 'thank-you': '6a7268a862a728c1cd4df73b' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
for (const [k, pageId] of Object.entries(P)) {
  const el = await callTool('data_element_tool', {
    siteId: SITE, pageId,
    context: 'Reading back the built page structure to confirm the old band stack is gone and one embed carries the journey markup.',
    actions: [{ label: 'tree', get_all_elements: { depth: 2 } }],
  });
  const root = JSON.parse(el.text).result[0].data;
  const kids = (root.children ?? []).map((c) => `${c.type}${c.styleNames ? '.' + c.styleNames.join('.') : ''}`);
  await sleep(1500);
  const ff = await callTool('data_scripts_tool', {
    context: 'Reading back the page custom code blocks to confirm the stylesheet and motion runtime were stored at the expected sizes.',
    actions: [{ label: 'ff', get_page_freeform_code: { site_id: SITE, page_id: pageId } }],
  });
  const blocks = JSON.parse(ff.text).result;
  const sizes = Object.fromEntries(blocks.map((b) => [b.location, b.content.length]));
  await sleep(1500);
  const meta = await callTool('data_pages_tool', {
    context: 'Reading back page metadata to confirm the slug and page id were preserved and the title now reflects the shipped design.',
    actions: [{ label: 'meta', get_page_metadata: { site_id: SITE, page_id: pageId } }],
  });
  const m = JSON.parse(meta.text).result;
  console.log(`\n=== ${k}`);
  console.log(`  body children : ${kids.join(', ') || '(none)'}`);
  console.log(`  head block    : ${sizes.head} chars`);
  console.log(`  footer block  : ${sizes.footer} chars`);
  console.log(`  slug          : /${m.slug}   draft=${m.draft}`);
  console.log(`  title         : ${m.title}`);
  console.log(`  seo.desc      : ${(m.seo?.description ?? '').slice(0, 80)}…`);
  await sleep(1500);
}
