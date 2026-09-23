/**
 * swap_embeds.mjs — replace the headless build's embed placeholders with real
 * HtmlEmbed elements.
 *
 *   node swap_embeds.mjs <implant|cosmetic|thank-you> [--dry]
 *
 * `data_whtml_builder` cannot create an HtmlEmbed, so payload_to_whtml.py
 * leaves `<div data-embed-slot="N" class="…"></div>` where one belongs and
 * writes the real markup to <page>/whtml/embeds.json. `data_element_builder`
 * is the only surface that creates an HtmlEmbed; its code is a plain element
 * SETTING under the key `code` (confirmed by reading an existing embed on the
 * clipboard-built implant page), written with data_element_settings_tool.
 *
 * The embed is created as a SIBLING after the placeholder and inherits the
 * placeholder's classes, then the placeholder is removed — so the embed itself
 * ends up carrying `.ty-iframe` / `.panel__body`, which is what the design's
 * CSS targets. Nesting it inside the placeholder instead would put an unstyled
 * div between the class and its contents, and both of these boxes size their
 * child by percentage height.
 */
import fs from 'node:fs';
import { call, sleep, SITE, PAGES } from './mcp.mjs';

const name = process.argv[2];
const dry = process.argv.includes('--dry');
const pageId = PAGES[name];
if (!pageId) { console.error(`usage: node swap_embeds.mjs <${Object.keys(PAGES).join('|')}> [--dry]`); process.exit(2); }

const embeds = JSON.parse(fs.readFileSync(`${name}/whtml/embeds.json`, 'utf8'));
if (!embeds.length) { console.log(`${name}: no embeds to swap`); process.exit(0); }

const tree = await call('data_element_tool', {
  siteId: SITE, pageId,
  context: `Locating the embed placeholders on the ${name} landing page so each can be replaced by a real HtmlEmbed element. Read-only.`,
  actions: [{ label: 'tree', get_all_elements: {} }],
});

const slots = new Map();
const walk = (n) => {
  if (!n) return;
  if (Array.isArray(n)) return n.forEach(walk);
  if (typeof n !== 'object') return;
  const slot = n.attributes?.['data-embed-slot'];
  if (slot !== undefined) slots.set(Number(slot), n);
  (n.children ?? []).forEach(walk);
};
walk(tree[0].result?.[0]?.data ?? tree[0].result?.data);
console.log(`${name}: ${embeds.length} embed(s) in the payload, ${slots.size} placeholder(s) live`);

const orphans = embeds.filter((e) => !slots.has(e.slot));
if (orphans.length) {
  console.error(`REFUSING: no live placeholder for slot(s) ${orphans.map((o) => o.slot).join(', ')}. ` +
    `Either the build did not land or the placeholders were already swapped.`);
  process.exit(1);
}

for (const e of embeds) {
  const ph = slots.get(e.slot);
  const classes = ph.styleNames ?? e.classes ?? [];
  console.log(`  slot ${e.slot}: ${e.code.length} chars, classes ${JSON.stringify(classes)}, placeholder ${ph.id.element}`);
  if (dry) continue;

  const made = await call('data_element_builder', {
    siteId: SITE, pageId,
    actions: [{
      build_label: `embed-${e.slot}`,
      parent_element_id: ph.id,
      creation_position: 'after',
      element_schema: { type: 'HtmlEmbed', ...(classes.length ? { set_style: { style_names: classes } } : {}) },
    }],
  });
  const entry = Array.isArray(made[0]) ? made[0][0] : made[0];
  if (entry.status !== 'success' && entry.status !== 'partial_success') {
    console.error(`  FAILED to create: ${JSON.stringify(entry).slice(0, 500)}`);
    process.exit(1);
  }
  const id = entry.data.id;
  await sleep(1500);

  await call('data_element_settings_tool', {
    siteId: SITE, pageId,
    context: `Writing the verbatim embed markup into the new HtmlEmbed on the ${name} landing page — markup the headless HTML converter cannot represent as Webflow elements (an iframe / a self-submitting form).`,
    actions: [{ label: 'code', set_settings: { operations: [{ label: `slot-${e.slot}`, element_id: id, settings: [{ key: 'code', static_text: { value: e.code } }] }] } }],
  });
  await sleep(1500);

  /* Read back before destroying the placeholder — an embed that silently took
     an empty string would otherwise leave the page with a hole and no marker. */
  const back = await call('data_element_settings_tool', {
    siteId: SITE, pageId,
    context: `Confirming the embed markup landed intact on the ${name} landing page before the placeholder it replaces is removed.`,
    actions: [{ label: 'read', get_settings: { type: 'all_raw_settings', element_id: id } }],
  });
  const got = (back[0].result?.[0]?.data?.matches ?? []).find((m) => m.key === 'code')?.value ?? '';
  if (got !== e.code) {
    console.error(`  REFUSING to remove the placeholder: code read back as ${got.length} chars, expected ${e.code.length}`);
    process.exit(1);
  }
  console.log(`    embed ${id.element} verified (${got.length} chars)`);

  await call('data_element_tool', {
    siteId: SITE, pageId,
    context: `Removing the now-redundant embed placeholder div on the ${name} landing page; the real HtmlEmbed carrying its classes and markup sits immediately after it and has been verified.`,
    actions: [{ label: 'rm', remove_element: { id: ph.id } }],
  });
  console.log(`    placeholder ${ph.id.element} removed`);
  await sleep(1500);
}
console.log(dry ? 'dry run — nothing written' : 'embeds swapped');
