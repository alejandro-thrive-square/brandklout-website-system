// Read every place the office hours live in the Webflow draft and save it beside this script.
// node read-hours.mjs   (run from this folder)
import fs from 'node:fs';
import { call, result } from '../../../../tools/webflow-build/wf.mjs';

const SITE = '6a5f81effe0aee1d204818dd'; // Dentiq Dental, docs/mcp-access.md
const FOOTER = 'df58aff5-693a-f787-2b20-1a56b3aad4eb';
const COPY_PAGES = {
  contact: '6a7356fc9ce83a98a59752ce',
  'dentist-near-montrose': '6a899820e1b5a04b8b19fe96',
  'dentist-near-hyde-park': '6a89984ab18c863ef24bcca6',
};
const HOURS = /monday|tuesday|12:00 pm|3:00 pm/i;

// 1. Visible copy: String/text elements on the pages that mention hours, and the footer component.
const elements = [];
const walk = (o, page) => {
  if (Array.isArray(o)) return o.forEach((x) => walk(x, page));
  if (!o || typeof o !== 'object') return;
  const text = o.text ?? o.textContent;
  if (o.id?.element && typeof text === 'string' && HOURS.test(text)) elements.push({ page, id: o.id, type: o.type, text });
  Object.values(o).forEach((x) => walk(x, page));
};
for (const [slug, page] of Object.entries(COPY_PAGES)) {
  const res = await call('data_element_tool', [{ label: slug, query_elements: { queries: [{ label: 'hours', element_filter: { text: 'day' } }] } }], { site: SITE, page });
  walk(res, slug);
}
const foot = await call('data_element_tool', [{ label: 'footer', get_all_elements: { scope_component_id: FOOTER } }], { site: SITE, page: COPY_PAGES.contact });
walk(foot, 'component:Footer');
const seen = new Set();
const unique = elements.filter((e) => !seen.has(e.id.element) && seen.add(e.id.element));
fs.writeFileSync('elements.json', JSON.stringify(unique, null, 1));
console.log(`elements with hours: ${unique.length}`);

// 2. JSON-LD schema markup on every page.
const pages = result(await call('data_pages_tool', { label: 'p', list_pages: {} }, { site: SITE }));
const list = (pages.pages || pages).filter((p) => p.id);
const schema = {};
for (let i = 0; i < list.length; i += 100) {
  const batch = list.slice(i, i + 100).map((p) => ({ id: p.id }));
  const r = result(await call('data_pages_tool', { label: 's', query_pages_schema_markup: { pages: batch } }, { site: SITE }));
  for (const item of r.pages || r) schema[item.id] = item.jsonLdSchema ?? item.schemaMarkup ?? item;
}
const slugOf = Object.fromEntries(list.map((p) => [p.id, p.publishedPath || p.slug]));
const withHours = Object.entries(schema).filter(([, s]) => /Monday/.test(JSON.stringify(s)));
fs.writeFileSync('schema-before.json', JSON.stringify(schema, null, 1));
fs.writeFileSync('schema-pages.txt', withHours.map(([id]) => `${id} ${slugOf[id]}`).join('\n') + '\n');
console.log(`pages: ${list.length}, schema mentioning Monday: ${withHours.length}`);
