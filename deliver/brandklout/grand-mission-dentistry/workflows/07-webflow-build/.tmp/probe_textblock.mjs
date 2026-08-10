/**
 * probe_textblock.mjs — can a real, editable Text Block be created headlessly?
 *
 * probe_editable.mjs established that `set_text` REPORTS SUCCESS on a `Block`
 * and changes nothing — so the obvious way to fill a new Text Block is a silent
 * no-op. The `text` element SETTING is the other candidate (it is the key the
 * CMS binds through). This probe answers, inside a throwaway #wzProbe2 section:
 *
 *   1. does set_settings key "text" fill a Block, and does it survive a re-read?
 *   2. does a Block created by the builder come back as a Text Block (Block +
 *      String child) rather than an empty Div Block?
 *   3. can a class be applied at creation, and does it stick?
 *   4. what happens to a ListItem's element children when its "text" is written?
 */
import { call, SITE, PAGES } from './mcp.mjs';

const PAGE = PAGES.implant;
const ctx = 'Probing headless creation of editable Webflow text blocks before repairing landing page list copy.';
const el = (a) => call('data_element_tool', { siteId: SITE, pageId: PAGE, context: ctx, actions: a });
const set = (a) => call('data_element_settings_tool', { siteId: SITE, pageId: PAGE, context: ctx, actions: a });
const build = (a) => call('data_element_builder', { siteId: SITE, pageId: PAGE, context: ctx, actions: a });
const unwrap = (r) => { const i = Array.isArray(r.result) ? r.result[0] : r.result; return i?.data ?? i; };

const DOMID = 'wzProbe2';
async function find() {
  const [r] = await el([{ label: 'find', query_elements: { queries: [{
    label: 'p', element_filter: { attribute_name: 'id', attribute_value: DOMID }, limit: 5 } ] } }]);
  return unwrap(r)[0]?.matches?.[0]?.id ?? null;
}
async function read(id, depth = 3) {
  const [r] = await el([{ label: 'read', query_elements: { queries: [{ label: 'r', element_id: id, children_depth: depth }] } }]);
  return unwrap(r)[0].matches[0];
}
const shape = (n) => `${n.type}[${n.settings?.tag ?? n.settings?.dom?.tag ?? '-'}] .${(n.styleNames || []).join('.')} -> ` +
  (n.children || []).map((k) => (k.type === 'String' ? `TEXT("${k.textContent}")` : k.type)).join(', ');

if (process.argv.includes('--clean')) {
  const id = await find();
  if (id) await el([{ label: 'clean', remove_element: { id } }]);
  console.log(id ? 'removed' : 'nothing to remove');
  process.exit(0);
}

const [bodyRes] = await el([{ label: 'body', get_all_elements: { depth: 0 } }]);
let section = await find();
if (!section) {
  await build([{ build_label: 'sec', parent_element_id: unwrap(bodyRes).id, creation_position: 'append',
    element_schema: { type: 'Section', settings: [{ key: 'domId', static_text: { value: DOMID } }] } }]);
  section = await find();
}
console.log('probe section', section.element);

/* 1-3: a plain TextBlock, with an existing site class applied at creation. */
await build([{ build_label: 'tb', parent_element_id: section, creation_position: 'append',
  element_schema: { type: 'TextBlock', set_style: { style_names: ['imp-span-3'] } } }]);
let sec = await read(section);
const tb = sec.children.at(-1);
console.log('created  :', shape(tb));

await set([{ label: 'write text', set_settings: { operations: [{ element_id: tb.id,
  settings: [{ key: 'text', static_text: { value: 'EDITABLE-COPY' } }] }] } }]);
sec = await read(section);
console.log('after set:', shape(sec.children.at(-1)));

/* 4: a List > ListItem carrying an icon Block plus text, the exact live shape. */
await build([{ build_label: 'list', parent_element_id: section, creation_position: 'append',
  element_schema: { type: 'BY_CUSTOM_TAG', custom_tag: 'ul', children: [
    { type: 'BY_CUSTOM_TAG', custom_tag: 'li', children: [{ type: 'DivBlock' }] },
  ] } }]);
sec = await read(section, 4);
const ul = sec.children.at(-1);
console.log('list     :', shape(ul), '|', (ul.children || []).map(shape).join(' || '));

const li = ul.children?.[0];
if (li) {
  try {
    await set([{ label: 'li text', set_settings: { operations: [{ element_id: li.id,
      settings: [{ key: 'text', static_text: { value: 'LI-COPY' } }] }] } }]);
    const back = await read(li.id, 2);
    console.log('li after :', shape(back));
  } catch (e) {
    console.log('li text  -> REJECTED', String(e.message).replace(/\s+/g, ' ').slice(0, 160));
  }
}

if (process.env.KEEP !== '1') {
  await el([{ label: 'clean', remove_element: { id: section } }]);
  console.log('probe section removed');
}
