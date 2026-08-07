/**
 * bind_images.mjs — bind every Image element on a headlessly-built page to its
 * real asset-library entry.
 *
 *   node bind_images.mjs <implant|cosmetic|thank-you>
 *
 * WHTML reports "image does not exist in asset library" for EVERY image, even
 * when the src is a correct Webflow CDN URL: the insert copies the URL but not
 * the asset binding, so the Designer shows the image while treating it as an
 * external file (not re-selectable, and it can be dropped on republish). The
 * filename embedded in the CDN URL maps back to the asset id via
 * asset-map.json, which is what this restores.
 */
import fs from 'node:fs';
import { call, sleep, SITE, PAGES } from './mcp.mjs';

const name = process.argv[2];
const pageId = PAGES[name];
if (!pageId) { console.error(`usage: node bind_images.mjs <${Object.keys(PAGES).join('|')}>`); process.exit(2); }

const map = JSON.parse(fs.readFileSync('asset-map.json', 'utf8'));
/* The CDN filename is `<assetId>_<originalName>`; index by both so a renamed
   asset (consult.webp lives under the client's own older filename) still hits. */
const byUrl = new Map();
for (const [file, a] of Object.entries(map)) {
  byUrl.set(a.hostedUrl, a.assetId);
  byUrl.set(a.hostedUrl.split('/').pop(), a.assetId);
}

const tree = await call('data_element_tool', {
  siteId: SITE, pageId,
  context: `Listing the image elements on the ${name} landing page so each can be re-bound to its entry in the site asset library after the headless build.`,
  actions: [{ label: 'tree', get_all_elements: {} }],
});

const images = [];
const walk = (n) => {
  if (!n || typeof n !== 'object') return;
  if (Array.isArray(n)) return n.forEach(walk);
  if (n.type === 'Image') images.push(n);
  for (const k of ['children', 'nodes', 'elements', 'data']) if (n[k]) walk(n[k]);
};
walk(tree[0].result);
console.log(`${name}: ${images.length} Image element(s)`);

let bound = 0;
const unmatched = [];
for (const img of images) {
  const src = img.attributes?.src ?? img.attr?.src ?? img.settings?.image?.url ?? '';
  const assetId = byUrl.get(src) ?? byUrl.get(String(src).split('/').pop());
  if (!assetId) { unmatched.push(src); continue; }
  await call('data_element_tool', {
    siteId: SITE, pageId,
    context: `Binding an image on the ${name} landing page to its existing asset-library entry, so the Designer treats it as a managed asset rather than an external URL.`,
    actions: [{ label: 'bind', set_image_asset: { id: img.id, image_asset_id: assetId } }],
  });
  bound++;
  console.log(`  bound ${String(src).split('/').pop()}`);
  await sleep(1800);
}
console.log(`${bound}/${images.length} bound`);
if (unmatched.length) {
  console.log('UNMATCHED:');
  for (const u of unmatched) console.log('  ' + u);
}
