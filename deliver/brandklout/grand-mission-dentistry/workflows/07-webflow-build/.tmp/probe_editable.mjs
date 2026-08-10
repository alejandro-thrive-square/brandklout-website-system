/**
 * probe_editable.mjs — what can actually hold EDITABLE text?
 *
 * The pages render correctly but a lot of their copy sits in `Block` (Div Block)
 * and `DOM` elements, which the Designer gives no text caret for. Before
 * rewriting any of it, establish empirically:
 *   1. which element types the builder can create, and what type they come back as
 *   2. which of those accept `set_text` (the same TextContent capability the
 *      Designer's editing caret keys off)
 *   3. whether a bare String node can be removed
 *
 * Everything happens inside one throwaway Section (#wzProbe) appended to the
 * implant page, removed again at the end. Nothing is published.
 *
 *   node probe_editable.mjs          # probe and clean up
 *   KEEP=1 node probe_editable.mjs   # leave the section for inspection
 *   node probe_editable.mjs --clean  # just remove a leftover section
 */
import { call, SITE, PAGES } from './mcp.mjs';

const PAGE = PAGES.implant;
const ctx = 'Probing which Webflow element types accept editable text before repairing landing page copy.';

const el = (a) => call('data_element_tool', { siteId: SITE, pageId: PAGE, context: ctx, actions: a });
const build = (a) => call('data_element_builder', { siteId: SITE, pageId: PAGE, context: ctx, actions: a });

/* Every data_* response is [{label, action, result}] where result is itself
   [{status, message, data}]. Two envelopes, and guessing wrong silently yields
   `undefined` rather than an error — which is how a probe section got created
   with no id to clean up. */
const unwrap = (r) => {
  const inner = Array.isArray(r.result) ? r.result[0] : r.result;
  return inner?.data ?? inner;
};

async function findProbe() {
  const [r] = await el([{ label: 'find', query_elements: { queries: [{
    label: 'p', element_filter: { attribute_name: 'id', attribute_value: 'wzProbe' }, limit: 5,
  }] } }]);
  return unwrap(r)[0]?.matches?.[0]?.id ?? null;
}

if (process.argv.includes('--clean')) {
  const id = await findProbe();
  if (id) { await el([{ label: 'cleanup', remove_element: { id } }]); console.log('removed', id.element); }
  else console.log('no probe section present');
  process.exit(0);
}

const [bodyRes] = await el([{ label: 'body', get_all_elements: { depth: 0 } }]);
const body = unwrap(bodyRes).id;

let section = await findProbe();
if (!section) {
  await build([{
    build_label: 'probe section',
    parent_element_id: body,
    creation_position: 'append',
    element_schema: { type: 'Section', settings: [{ key: 'domId', static_text: { value: 'wzProbe' } }] },
  }]);
  section = await findProbe();
}
console.log('probe section', section.element);

/* Candidate shapes for holding a run of inline copy. */
const CANDIDATES = [
  { name: 'TextBlock',  schema: { type: 'TextBlock', set_text: { text: 'seed' } } },
  { name: 'DivBlock',   schema: { type: 'DivBlock' } },
  { name: 'DOM-span',   schema: { type: 'DOM', set_dom_config: { dom_tag: 'span' } } },
  { name: 'TAG-span',   schema: { type: 'BY_CUSTOM_TAG', custom_tag: 'span' } },
  { name: 'TAG-b',      schema: { type: 'BY_CUSTOM_TAG', custom_tag: 'b' } },
  { name: 'TAG-dt',     schema: { type: 'BY_CUSTOM_TAG', custom_tag: 'dt' } },
  { name: 'Paragraph',  schema: { type: 'Paragraph', set_text: { text: 'seed' } } },
];

for (const c of CANDIDATES) {
  try {
    await build([{
      build_label: c.name, parent_element_id: section, creation_position: 'append',
      element_schema: c.schema,
    }]);
    console.log(`build    ${c.name.padEnd(10)} -> created`);
  } catch (e) {
    console.log(`build    ${c.name.padEnd(10)} -> FAILED ${String(e.message).replace(/\s+/g, ' ').slice(0, 130)}`);
  }
}

/* The builder's own response envelope differs from the element tool's, so read
   the ids back off the tree instead of parsing it — same order as CANDIDATES. */
const readProbe = async () => {
  const [t] = await el([{ label: 'probe tree', query_elements: { queries: [{
    label: 'probe', element_id: section, children_depth: 3,
  }] } }]);
  return unwrap(t)[0].matches[0];
};

let probe = await readProbe();
const made = (probe.children || []).map((ch, i) => ({ name: CANDIDATES[i]?.name ?? `#${i}`, id: ch.id, node: ch }));

for (const m of made) {
  try {
    await el([{ label: `text ${m.name}`, set_text: { id: m.id, text: `hello-${m.name}` } }]);
    console.log(`set_text ${m.name.padEnd(10)} -> OK`);
  } catch (e) {
    console.log(`set_text ${m.name.padEnd(10)} -> REJECTED ${String(e.message).replace(/\s+/g, ' ').slice(0, 110)}`);
  }
}

probe = await readProbe();
console.log('\n--- probe subtree ---');
for (const ch of probe.children || []) {
  const kids = (ch.children || []).map((k) => `${k.type}${k.textContent ? `("${k.textContent}")` : ''}`).join(', ');
  console.log(`  ${ch.type.padEnd(10)} tag=${ch.settings?.tag ?? ch.settings?.dom?.tag ?? '-'}  children=[${kids}]`);
}

/* Can a bare String node be removed? */
const withString = (probe.children || []).flatMap((c) => (c.children || []).filter((k) => k.type === 'String').map((k) => ({ host: c, str: k })))[0];
if (withString) {
  try {
    await el([{ label: 'rm string', remove_element: { id: withString.str.id } }]);
    console.log(`\nremove String node -> OK (from ${withString.host.type})`);
  } catch (e) {
    console.log(`\nremove String node -> REJECTED ${String(e.message).replace(/\s+/g, ' ').slice(0, 140)}`);
  }
}

if (process.env.KEEP !== '1') {
  await el([{ label: 'cleanup', remove_element: { id: section } }]);
  console.log('probe section removed');
}
