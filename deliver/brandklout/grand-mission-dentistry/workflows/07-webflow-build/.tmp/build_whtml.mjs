/**
 * build_whtml.mjs — execute a payload_to_whtml.py insert plan against a page.
 *
 *   node build_whtml.mjs <implant|cosmetic|thank-you>
 *
 * Order matters: a chunk's `parent` names the chunk it belongs inside, and the
 * insert needs that chunk's RETURNED element id. The CSS rides on the first
 * action only — Webflow keys styles by name site-wide, so re-sending it per
 * chunk just risks forking.
 *
 * Embeds: the serializer leaves `<div data-embed-slot="N">` placeholders for
 * markup WHTML cannot represent (the map iframe). They are filled afterwards
 * with data_element_builder, which is the only surface that creates a real
 * HtmlEmbed.
 */
import fs from 'node:fs';
import { call, sleep, SITE, PAGES } from './mcp.mjs';

const name = process.argv[2];
const pageId = PAGES[name];
if (!pageId) { console.error(`usage: node build_whtml.mjs <${Object.keys(PAGES).join('|')}>`); process.exit(2); }

const dir = `${name}/whtml`;
const chunks = JSON.parse(fs.readFileSync(`${dir}/chunks.json`, 'utf8'));
const css = fs.readFileSync(`${dir}/styles.css`, 'utf8');

/* Body id, read live rather than assumed. */
const tree = await call('data_element_tool', {
  siteId: SITE, pageId,
  context: `Locating the Body element of the ${name} landing page so the rebuilt markup can be inserted into it.`,
  actions: [{ label: 'tree', get_all_elements: {} }],
});
const body = tree[0].result?.[0]?.data ?? tree[0].result?.data;
if ((body.children ?? []).length) {
  console.error(`REFUSING: ${name} Body already has ${body.children.length} children — clear it first (node clear_page.mjs ${name})`);
  process.exit(1);
}
console.log(`${name}: Body ${body.id.element}, ${chunks.length} chunk(s), css ${css.length} bytes`);

const idOf = {}; // chunk key -> element id object
for (const [i, c] of chunks.entries()) {
  const parent = c.parent ? idOf[c.parent] : body.id;
  if (!parent) throw new Error(`chunk ${c.key}: parent ${c.parent} has no returned id`);
  const args = {
    siteId: SITE, pageId,
    actions: [{
      build_label: c.key,
      parent_element_id: parent,
      creation_position: 'append',
      html: c.html,
      ...(i === 0 ? { css } : {}),
    }],
  };
  const res = await call('data_whtml_builder', args, { tries: 5, base: 6000 });
  const entry = Array.isArray(res[0]) ? res[0][0] : res[0];
  /* `partial_success` means the elements WERE inserted; the only warning this
     build produces is "image does not exist in asset library", which WHTML
     reports for every image even when the CDN URL is correct. Images are
     bound afterwards by bind_images.mjs. Treating it as failure aborted a
     build that had actually landed. */
  if (entry.status !== 'success' && entry.status !== 'partial_success') {
    console.error(`chunk ${c.key} FAILED:`, JSON.stringify(entry).slice(0, 600));
    process.exit(1);
  }
  const warned = entry.data?.image_warnings?.length ?? 0;
  if (warned) console.log(`  (${warned} image(s) unbound — run bind_images.mjs)`);
  idOf[c.key] = entry.data.id;
  console.log(`  ${c.key.padEnd(8)} ${String(c.html.length).padStart(6)}b -> ${entry.data.id.element}`);
  await sleep(2500);
}
fs.writeFileSync(`${dir}/inserted-ids.json`, JSON.stringify(idOf, null, 1), 'utf8');
console.log('chunks inserted');
