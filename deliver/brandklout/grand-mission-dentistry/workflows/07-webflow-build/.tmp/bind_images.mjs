/**
 * bind_images.mjs — bind every Image element on a headlessly-built page to its
 * real asset-library entry.
 *
 *   node bind_images.mjs <implant|cosmetic|thank-you> [--dry]
 *
 * WHTML reports "image does not exist in asset library" for EVERY image, even
 * when the src is a correct Webflow CDN URL: the insert copies the URL but not
 * the asset binding, so the Designer shows the image while treating it as an
 * external file (not re-selectable, and it can be dropped on republish).
 *
 * MATCHING IS POSITIONAL, NOT BY URL. The first version of this script read
 * `src` off the live tree and looked it up in asset-map.json — but
 * `get_all_elements` does not expose an Image's src at all (an unbound Image
 * has no `attributes.src` and no image setting), so it matched 0 of 5. The
 * payload's `<img>` tags are inserted in document order and `get_all_elements`
 * returns the tree in document order, so the Nth live Image is the Nth payload
 * `<img>`. The count is asserted before anything is written — if it does not
 * match, the assumption is broken and binding blind would attach the wrong
 * picture to the wrong figure.
 */
import fs from 'node:fs';
import { call, sleep, SITE, PAGES } from './mcp.mjs';

const name = process.argv[2];
const dry = process.argv.includes('--dry');
const pageId = PAGES[name];
if (!pageId) { console.error(`usage: node bind_images.mjs <${Object.keys(PAGES).join('|')}> [--dry]`); process.exit(2); }

/* asset-map.json is keyed by the ORIGINAL filename; the CDN url embeds the
   asset id as a prefix (`<assetId>_<name>`), so index by both. */
const map = JSON.parse(fs.readFileSync('asset-map.json', 'utf8'));
const byFile = new Map();
for (const a of Object.values(map)) byFile.set(a.hostedUrl.split('/').pop(), a.assetId);

/* --- what the payload says, in document order ---------------------------- */
const chunks = JSON.parse(fs.readFileSync(`${name}/whtml/chunks.json`, 'utf8'));
const wanted = [...chunks.map((c) => c.html).join('\n').matchAll(/<img\b[^>]*>/gi)].map((m) => {
  const attr = (n) => (m[0].match(new RegExp(`${n}="([^"]*)"`, 'i')) || [])[1];
  const src = attr('src') || '';
  return { src, file: src.split('/').pop(), alt: attr('alt') || '' };
});

/* --- what is live, in document order ------------------------------------- */
const tree = await call('data_element_tool', {
  siteId: SITE, pageId,
  context: `Listing the image elements on the ${name} landing page in document order so each can be re-bound to its entry in the site asset library after the headless build. Read-only.`,
  actions: [{ label: 'tree', get_all_elements: {} }],
});
const live = [];
const walk = (n) => {
  if (!n) return;
  if (Array.isArray(n)) return n.forEach(walk);
  if (typeof n !== 'object') return;
  if (n.type === 'Image') live.push(n);
  (n.children ?? []).forEach(walk);
};
walk(tree[0].result?.[0]?.data ?? tree[0].result?.data);

console.log(`${name}: ${live.length} live Image element(s), ${wanted.length} in the payload`);
if (live.length !== wanted.length) {
  console.error('REFUSING: counts differ, so position cannot identify the image.');
  process.exit(1);
}
/* An `<img>` with no src is not a defect: `#lightboxImg` is an empty frame the
   page fills from JS when a case card is opened. It has no asset to bind. */
const missing = wanted.filter((w) => w.src && !byFile.has(w.file));
if (missing.length) {
  console.error('REFUSING: no asset-library entry for:\n  ' + missing.map((m) => m.file).join('\n  '));
  process.exit(1);
}

let bound = 0;
for (const [i, w] of wanted.entries()) {
  if (!w.src) { console.log(`  [${i}] (no src — runtime-filled, skipped)`); continue; }
  console.log(`  [${i}] ${w.file} -> ${live[i].id.element}`);
  if (dry) continue;
  await call('data_element_tool', {
    siteId: SITE, pageId,
    context: `Binding image ${i + 1} of ${wanted.length} on the ${name} landing page to its existing asset-library entry, so the Designer treats it as a managed asset rather than an external URL and it survives republishing.`,
    actions: [{ label: 'bind', set_image_asset: { id: live[i].id, image_asset_id: byFile.get(w.file) } }],
  });
  /* Alt text needs no repair — WHTML does carry `alt` across as the Image's
     own `altText` setting (checked on the live tree), and passing
     image_asset_id without an alt does not clear it. */
  bound++;
  await sleep(1500);
}
console.log(dry ? 'dry run — nothing written' : `${bound}/${wanted.length} bound`);
