// Office hours change (Jessica Acosta, 2026-10-05): Tuesday-Friday 7:00 am-3:00 pm, every other Monday
// 8:00 am-12:00 pm. Writes the Webflow DRAFT only; nothing here publishes.
// node apply-hours.mjs --dry   prints every change; without --dry it writes, then reads each one back.
// Needs elements.json and schema-before.json from read-hours.mjs.
import fs from 'node:fs';
import { call, result } from '../../../../tools/webflow-build/wf.mjs';

const SITE = '6a5f81effe0aee1d204818dd'; // Dentiq Dental, docs/mcp-access.md
const DRY = process.argv.includes('--dry');
const CONTACT = '6a7356fc9ce83a98a59752ce';
const elements = JSON.parse(fs.readFileSync('elements.json', 'utf8'));
const schemaBefore = JSON.parse(fs.readFileSync('schema-before.json', 'utf8'));

// 1. Visible copy. String nodes only, so set_text keeps the <br>/<strong> siblings.
const COPY = {
  'd9d0c6b1-4e77-397c-0eaf-a5475ed3a085': ['Monday 8:00 am - 12:00 pm.', 'Every other Monday 8:00 am - 12:00 pm.'], // Footer component, every page
  '2d94f550-3343-8a50-a1ee-2c2e64a5eca5': ['Monday:', 'Every other Monday:'], // /contact hours table
  '1d664525-4968-2f39-db1f-a4279081efdd': [ // /dentist-near-montrose
    'Our office is open Monday 8:00 am to 12:00 pm and Tuesday through Friday 7:00 am to 3:00 pm,',
    'Our office is open Tuesday through Friday 7:00 am to 3:00 pm and every other Monday 8:00 am to 12:00 pm,',
  ],
  '05ac6ada-a5e5-9179-9eca-51ba871c779c': [ // /dentist-near-hyde-park
    'The office is open Monday 8:00 am to 12:00 pm and Tuesday through Friday 7:00 am to 3:00 pm.',
    'The office is open Tuesday through Friday 7:00 am to 3:00 pm and every other Monday 8:00 am to 12:00 pm.',
  ],
};
const PAGE_OF = { contact: CONTACT, 'dentist-near-montrose': '6a899820e1b5a04b8b19fe96', 'dentist-near-hyde-park': '6a89984ab18c863ef24bcca6', 'component:Footer': CONTACT };

const copyJobs = [];
for (const [element, [from, to]] of Object.entries(COPY)) {
  const el = elements.find((e) => e.id.element === element);
  if (!el) throw new Error(`element ${element} not in elements.json`);
  if (!el.text.includes(from)) throw new Error(`element ${element} text changed since the read: ${el.text}`);
  copyJobs.push({ el, page: PAGE_OF[el.page], text: el.text.replace(from, to) });
}

// 2. JSON-LD. A biweekly day cannot be said in openingHoursSpecification, so the weekly Monday entry
// is dropped (Monday is left unstated, not "closed") and the descriptions say "every other Monday".
const TUE_FRI = {
  '@type': 'OpeningHoursSpecification',
  closes: '15:00',
  dayOfWeek: ['https://schema.org/Tuesday', 'https://schema.org/Wednesday', 'https://schema.org/Thursday', 'https://schema.org/Friday'],
  opens: '07:00',
};
const TEXT = [
  ['open Monday 8:00 am to 12:00 pm and Tuesday through Friday 7:00 am to 3:00 pm', 'open Tuesday through Friday 7:00 am to 3:00 pm and every other Monday 8:00 am to 12:00 pm'],
  ['open Monday from 8:00 am to 12:00 pm and Tuesday through Friday from 7:00 am to 3:00 pm', 'open Tuesday through Friday from 7:00 am to 3:00 pm and every other Monday from 8:00 am to 12:00 pm'],
  ['Office hours are Monday 8:00 am to 12:00 pm and Tuesday through Friday 7:00 am to 3:00 pm', 'Office hours are Tuesday through Friday 7:00 am to 3:00 pm and every other Monday 8:00 am to 12:00 pm'],
  ['open Monday 8am to 12pm and Tuesday to Friday 7am to 3pm', 'open Tuesday to Friday 7am to 3pm and every other Monday 8am to 12pm'],
];
const isMondayOnly = (s) => s?.['@type'] === 'OpeningHoursSpecification' && /Monday$/.test(String(s.dayOfWeek));
const fixSpecs = (specs) => {
  // The /lp/all-on-4 page carried Mon-Fri 9-17, which was never the practice's hours.
  if (specs.some((s) => Array.isArray(s.dayOfWeek) && s.dayOfWeek.includes('Monday') && s.opens === '09:00')) return [TUE_FRI];
  return specs.filter((s) => !isMondayOnly(s));
};
const rewrite = (x) => {
  if (Array.isArray(x)) return x.map(rewrite);
  if (typeof x === 'string') return TEXT.reduce((s, [a, b]) => s.split(a).join(b), x);
  if (!x || typeof x !== 'object') return x;
  const out = {};
  for (const [k, v] of Object.entries(x)) out[k] = k === 'openingHoursSpecification' ? fixSpecs(v) : rewrite(v);
  return out;
};
const schemaJobs = [];
for (const [id, before] of Object.entries(schemaBefore)) {
  if (!/Monday/.test(JSON.stringify(before))) continue;
  const after = rewrite(before);
  const left = JSON.stringify(after).match(/.{0,60}Monday.{0,40}/g)?.filter((m) => !/every other Monday/.test(m));
  if (left?.length) throw new Error(`page ${id}: Monday still present after rewrite: ${left.join(' | ')}`);
  schemaJobs.push({ id, jsonLdSchema: after });
}

console.log(`copy edits: ${copyJobs.length}, schema pages: ${schemaJobs.length}`);
for (const j of copyJobs) console.log(`  ${j.el.page}: ${j.text}`);
fs.writeFileSync('schema-after.json', JSON.stringify(Object.fromEntries(schemaJobs.map((j) => [j.id, j.jsonLdSchema])), null, 1));
if (DRY) process.exit(0);

for (const j of copyJobs) {
  // Inside a component, set_text without scope_component_id reports success and changes nothing.
  const inComponent = j.el.page.startsWith('component:');
  const scope = inComponent ? { scope_component_id: j.el.id.component } : {};
  await call('data_element_tool', [{ label: 'set', set_text: { id: j.el.id, text: j.text, ...scope } }], { site: SITE, page: j.page });
  const back = await call('data_element_tool', [inComponent
    ? { label: 'get', get_all_elements: { scope_component_id: j.el.id.component } }
    : { label: 'get', query_elements: { queries: [{ label: 'id', element_id: j.el.id }] } }], { site: SITE, page: j.page });
  const ok = JSON.stringify(back).includes(JSON.stringify(j.text).slice(1, -1));
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${j.el.page} ${j.el.id.element}`);
  if (!ok) process.exitCode = 1;
}
for (let i = 0; i < schemaJobs.length; i += 25) {
  const batch = schemaJobs.slice(i, i + 25);
  await call('data_pages_tool', { label: 'w', bulk_update_pages_schema_markup: { pages: batch } }, { site: SITE });
  const back = result(await call('data_pages_tool', { label: 'r', query_pages_schema_markup: { pages: batch.map((b) => ({ id: b.id })) } }, { site: SITE }));
  for (const item of back.pages || back) {
    const want = batch.find((b) => b.id === item.id).jsonLdSchema;
    const got = item.jsonLdSchema ?? item.schemaMarkup;
    const ok = JSON.stringify(typeof got === 'string' ? JSON.parse(got) : got) === JSON.stringify(want);
    if (!ok) { console.log(`FAIL schema ${item.id}`); process.exitCode = 1; }
  }
  console.log(`schema batch ${i / 25 + 1}: ${batch.length} written and read back`);
}
