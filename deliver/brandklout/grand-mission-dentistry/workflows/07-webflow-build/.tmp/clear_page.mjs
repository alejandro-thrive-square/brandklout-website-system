/**
 * clear_page.mjs — remove every direct child of a page's Body.
 * Usage: node clear_page.mjs <implant|cosmetic|thank-you>
 */
import { call, sleep, SITE, PAGES } from './mcp.mjs';

const name = process.argv[2];
const pageId = PAGES[name];
if (!pageId) { console.error(`usage: node clear_page.mjs <${Object.keys(PAGES).join('|')}>`); process.exit(2); }

const tree = await call('data_element_tool', {
  siteId: SITE, pageId,
  context: `Listing the ${name} landing page's Body children so they can be removed before a clean headless rebuild of the page.`,
  actions: [{ label: 'tree', get_all_elements: {} }],
});
const body = tree[0].result?.[0]?.data ?? tree[0].result?.data;
const kids = body?.children ?? [];
console.log(`${name}: Body has ${kids.length} direct child(ren)`);

for (const kid of kids) {
  await call('data_element_tool', {
    siteId: SITE, pageId,
    context: `Removing a stale top-level element from the ${name} landing page before rebuilding it headlessly. The page's intended content is rebuilt from the gated payload immediately afterwards.`,
    actions: [{ label: 'rm', remove_element: { id: kid.id } }],
  });
  console.log(`  removed ${kid.type} ${kid.id.element}`);
  await sleep(2000);
}

/* Verify rather than trust: the first version of this script reported every
   removal as done while a schema error meant nothing had been removed. */
const after = await call('data_element_tool', {
  siteId: SITE, pageId,
  context: `Confirming the ${name} landing page's Body is empty before its rebuild.`,
  actions: [{ label: 'tree', get_all_elements: {} }],
});
const left = ((after[0].result?.[0]?.data ?? after[0].result?.data)?.children ?? []).length;
console.log(left === 0 ? 'cleared (verified empty)' : `STILL ${left} child(ren) — NOT cleared`);
process.exit(left === 0 ? 0 : 1);
