/**
 * make_lists_editable.mjs — give every list item's copy an element of its own,
 * so it can be edited in the Designer.
 *
 * THE DEFECT
 * ----------
 * The conversion left a lot of list copy as a BARE TEXT NODE sitting beside an
 * element, or inside a `DOM` element:
 *
 *   <li class="ticks">  Block(icon)  "Free consultation"          <- loose text
 *   <li class="checklist">  HtmlEmbed(svg)  "You're missing …"    <- loose text
 *   <dt class="hours">  "Monday"                                  <- DOM element
 *
 * Both render correctly and neither can be edited: a loose string is not an
 * element, so the Navigator has nothing to select, and a `DOM` element has no
 * text caret at all. That is "the list items are not editable".
 *
 * THE REPAIR, and why it is this one (all four points measured, see
 * probe_editable.mjs / probe_textblock.mjs — do not re-derive them):
 *   1. `set_text` REPORTS SUCCESS on a `Block` and changes nothing. Text is
 *      written with `set_settings` key "text" instead.
 *   2. builder `type: 'TextBlock'` produces exactly what the Designer calls a
 *      Text Block — `Block[div]` with a single String child — and `set_style`
 *      at creation sticks. That is the editable target.
 *   3. writing "text" onto a ListItem REPLACES ITS CHILDREN, so the icon would
 *      be destroyed. Never write text to the li; add a child and fill that.
 *   4. a loose String node can be removed by id.
 *
 * Layout is unaffected because every host is flex or grid, where a run of text
 * is ALREADY an anonymous flex/grid item — swapping it for a div produces the
 * same box (`.ticks li` flex, `.checklist li` grid `auto 1fr`, `.hours div`
 * flex, and dt/dd are block boxes whose child div fills them).
 *
 *   node make_lists_editable.mjs <page> --dry     # print the plan, touch nothing
 *   node make_lists_editable.mjs <page>           # apply
 *   node make_lists_editable.mjs <page> --verify  # re-read and report what is left
 */
import fs from 'node:fs';
import { call, SITE, PAGES } from './mcp.mjs';

const page = process.argv[2];
if (!PAGES[page]) {
  console.error(`usage: make_lists_editable.mjs <${Object.keys(PAGES).join('|')}> [--dry|--verify]`);
  process.exit(2);
}
const DRY = process.argv.includes('--dry');
const VERIFY = process.argv.includes('--verify');
const ctx = 'Giving landing page list copy its own text elements so the client can edit it in the Designer.';

const el = (a) => call('data_element_tool', { siteId: SITE, pageId: PAGES[page], context: ctx, actions: a });
const settings = (a) => call('data_element_settings_tool', { siteId: SITE, pageId: PAGES[page], context: ctx, actions: a });
const build = (a) => call('data_element_builder', { siteId: SITE, pageId: PAGES[page], context: ctx, actions: a });
const unwrap = (r) => { const i = Array.isArray(r.result) ? r.result[0] : r.result; return i?.data ?? i; };

const INLINE = new Set(['Span', 'Strong', 'Emphasized', 'Superscript', 'Subscript']);
const isText = (c) => c.type === 'String' && (c.textContent || '').trim();
const tagOf = (n) => n.settings?.tag ?? n.settings?.dom?.tag ?? null;
const label = (n) => `${n.type}[${tagOf(n) ?? '-'}].${(n.styleNames || []).join('.')}`;

async function tree() {
  const [r] = await el([{ label: 'tree', get_all_elements: { depth: -1 } }]);
  return unwrap(r);
}

/**
 * Everything inside a list — a Webflow List, or a `<dl>`/`<ul>`/`<ol>` that came
 * through as a DOM element — whose copy has no element of its own.
 * Returns { host, anchor, position, text, stringId }.
 */
function plan(root) {
  const out = [];
  const isList = (n) => n.type === 'List' || (n.type === 'DOM' && ['dl', 'ul', 'ol'].includes(tagOf(n)));

  const visit = (n, inList) => {
    const here = inList || isList(n);
    if (here) {
      const kids = n.children || [];
      const loose = kids.filter(isText);
      /* Loose text is editable only when it is the host's ONLY content and the
         host itself carries a text caret — a DOM element never does. */
      const hostIsEditable = n.type !== 'DOM' && !kids.some((c) => c.type !== 'String' && !INLINE.has(c.type));
      if (loose.length && !(hostIsEditable && n.type !== 'DOM')) {
        for (const s of loose) {
          const i = kids.indexOf(s);
          const prev = kids.slice(0, i).reverse().find((c) => c.type !== 'String');
          out.push({
            host: n.id, hostLabel: label(n),
            anchor: prev ? prev.id : n.id,
            position: prev ? 'after' : 'prepend',
            text: s.textContent.trim(),
            stringId: s.id,
          });
        }
      }
    }
    for (const c of n.children || []) visit(c, here);
  };
  visit(root, false);
  return out;
}

const root = await tree();
const items = plan(root);

console.log(`${page}: ${items.length} list text runs with no element of their own`);
for (const it of items) console.log(`   ${it.hostLabel.padEnd(34)} ${it.position.padEnd(7)} "${it.text.slice(0, 62)}"`);
fs.writeFileSync(`lists-editable-${page}.json`, JSON.stringify(items, null, 2));

if (DRY || VERIFY || !items.length) process.exit(0);

/* Apply one at a time: create the Text Block, read it back off the host so its
   id is known (the builder's response envelope does not carry one), fill it,
   then drop the loose String. Doing the removal last means a failure part-way
   leaves the copy duplicated rather than lost. */
let done = 0;
for (const it of items) {
  const [beforeRes] = await el([{ label: 'host', query_elements: { queries: [{ label: 'h', element_id: it.host, children_depth: 1 }] } }]);
  const kidsBefore = (unwrap(beforeRes)[0].matches[0].children || []).map((c) => c.id.element);

  await build([{
    build_label: 'text', parent_element_id: it.anchor, creation_position: it.position,
    element_schema: { type: 'TextBlock' },
  }]);

  const [afterRes] = await el([{ label: 'host', query_elements: { queries: [{ label: 'h', element_id: it.host, children_depth: 1 }] } }]);
  const fresh = (unwrap(afterRes)[0].matches[0].children || []).find((c) => !kidsBefore.includes(c.id.element));
  if (!fresh) throw new Error(`no new child appeared under ${it.hostLabel} for "${it.text.slice(0, 40)}"`);

  await settings([{ label: 'fill', set_settings: { operations: [{
    element_id: fresh.id, settings: [{ key: 'text', static_text: { value: it.text } }],
  }] } }]);
  await el([{ label: 'drop loose text', remove_element: { id: it.stringId } }]);
  console.log(`  ok  ${(++done).toString().padStart(3)}/${items.length}  "${it.text.slice(0, 50)}"`);
}

const left = plan(await tree());
console.log(`\n${page}: ${done} repaired, ${left.length} remaining`);
if (left.length) { console.log('STILL UNEDITABLE:'); for (const l of left) console.log('   ', l.hostLabel, JSON.stringify(l.text.slice(0, 50))); }
