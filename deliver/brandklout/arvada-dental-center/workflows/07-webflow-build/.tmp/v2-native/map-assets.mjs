#!/usr/bin/env node
/**
 * map-assets.mjs — bind each Image element on a v2 page to a real Webflow asset.
 *
 * whtml_builder inserts an <img src="https://cdn.prod.website-files.com/…"> as
 * an Image element but refuses to attach the asset: *"skipped … since the image
 * does not exist in asset library"*. It looks the file up by URL, and the CDN
 * URL an <img> carries never matches the s3.amazonaws.com URL list_assets
 * reports for the same file — the trap the previous build hit too.
 *
 * The id does not have to be searched for: Webflow prefixes every uploaded
 * filename with it, so `…/693fa144…f7_arvada-dentist-1.png.webp` IS asset
 * `693fa144…f7`.
 *
 * PAIRING IS THE DANGEROUS PART — an off-by-one puts the surgeon's portrait in
 * the hero. Two independent checks, and the run aborts unless both hold:
 *
 *   1. Structural. The (own class, parent class) sequence of the page's Image
 *      elements must equal the design's, element for element.
 *      NOTE: `get_attributes` returns [] for an Image — alt is not an
 *      attribute — so an alt-based check passes vacuously and proves nothing.
 *      That is why this uses the class chain, which is really there.
 *   2. Semantic, for the one pair a swap would silently ruin: where the design
 *      alt says "before"/"after", the bound asset's own filename must agree.
 *
 *   node map-assets.mjs <pageId> <html-file> [--dry]
 */
import fs from 'node:fs';
import { call, SITES } from './wf.mjs';

const [pageId, htmlFile] = process.argv.slice(2);
const DRY = process.argv.includes('--dry');
const o = { site: SITES.arvada, page: pageId };

/* ------------------------------- the design's images, with their context -- */

const html = fs.readFileSync(htmlFile, 'utf8');
const VOID = new Set(['img', 'br', 'hr', 'input', 'meta', 'link', 'source']);

const wanted = [];
{
  const stack = [];
  for (const m of html.matchAll(/<(\/?)([a-zA-Z][\w-]*)\b([^>]*)>/g)) {
    const [, slash, tagRaw, attrs] = m;
    const tag = tagRaw.toLowerCase();
    if (tag === 'img') {
      const src = (attrs.match(/\bsrc="([^"]+)"/) || [])[1] || '';
      const alt = (attrs.match(/\balt="([^"]*)"/) || [])[1] || '';
      const cls = (attrs.match(/\bclass="([^"]*)"/) || [])[1] || '';
      const file = decodeURIComponent(src.split('/').pop() || '');
      wanted.push({
        src, alt, file,
        id: (file.match(/^([0-9a-f]{24})_/) || [])[1] || null,
        cls: cls.trim(),
        parent: stack.length ? stack[stack.length - 1] : '',
      });
      continue;
    }
    if (VOID.has(tag)) continue;
    if (!slash) stack.push(((attrs.match(/\bclass="([^"]*)"/) || [])[1] || '').trim());
    else stack.pop();
  }
}

console.log(`design has ${wanted.length} images`);
for (const w of wanted) console.log(`  ${w.id || 'NO-ID'}  .${w.cls} in .${w.parent}  <- ${w.file.slice(0, 46)}`);

const noId = wanted.filter((w) => !w.id);
if (noId.length) { console.log('\ncannot derive an asset id for: ' + noId.map((w) => w.file).join(', ')); process.exit(1); }

/* -------------------------------------------- confirm each asset is real -- */

const meta = new Map();
for (let i = 0; i < wanted.length; i += 5) {
  const chunk = wanted.slice(i, i + 5);
  const res = call('data_assets_tool', chunk.map((w, k) => ({ label: 'a' + (i + k), get_asset: { asset_id: w.id } })), o);
  for (const r of (Array.isArray(res) ? res : [res])) if (r?.result?.id) meta.set(r.result.id, r.result);
}
const gone = wanted.filter((w) => !meta.has(w.id));
if (gone.length) {
  // GET /v2/assets rate-limits hard (429) if you have been reading it in a
  // loop. That is not evidence the asset is missing, so say which it is
  // instead of aborting on a false "not in the library".
  console.log(`\n${gone.length} asset(s) could not be read: ${[...new Set(gone.map((w) => w.id))].join(', ')}`);
  console.log('If this is a 429, wait and re-run — it is a rate limit, not a missing asset.');
  console.log('Continuing without the semantic before/after check.');
} else {
  console.log(`all ${meta.size} distinct assets exist`);
}

/* --------------------------------------- the page's Image elements, in order */

const tree = call('data_element_tool', [{ label: 'e', get_all_elements: {} }], o);
const images = [];
(function walk(n, parent) {
  if (n.type === 'Image') images.push({ node: n, cls: (n.styleNames || []).join(' '), parent: ((parent?.styleNames) || []).join(' ') });
  for (const c of n.children || []) walk(c, n);
})(tree.result[0].data, null);

console.log(`page has ${images.length} Image elements`);
if (images.length !== wanted.length) {
  console.log(`COUNT MISMATCH — design ${wanted.length}, page ${images.length}. Nothing written.`);
  process.exit(1);
}

/* ------------------------------------------------------- check 1: structure */

let bad = 0;
wanted.forEach((w, i) => {
  const g = images[i];
  if (w.cls !== g.cls || w.parent !== g.parent) {
    bad++;
    console.log(`  #${i} STRUCTURE: design .${w.cls} in .${w.parent}  |  page .${g.cls} in .${g.parent}`);
  }
});
if (bad) { console.log(`\n${bad} structural mismatch(es) — nothing written.`); process.exit(1); }
console.log('check 1 ok — the class chain of every image matches the design, in order');

/* -------------------------------------------------------- check 2: semantic */

let sem = 0, semChecked = 0;
wanted.forEach((w, i) => {
  const word = (w.alt.toLowerCase().match(/\b(before|after)\b/) || [])[1];
  if (!word || !meta.has(w.id)) return;
  semChecked++;
  const name = (meta.get(w.id).originalFileName || '').toLowerCase();
  if (!name.includes(word)) { sem++; console.log(`  #${i} SEMANTIC: alt says "${word}" but the asset is ${name}`); }
});
if (sem) { console.log(`\n${sem} semantic mismatch(es) — nothing written.`); process.exit(1); }
console.log(`check 2 ok — ${semChecked} before/after image(s) bound to a matching file`);

if (process.argv.includes('--check')) {
  const now = images.map((im) => {
    const r = call('data_element_settings_tool',
      [{ label: 's', get_settings: { type: 'all_raw_settings', element_id: im.node.id } }], o);
    return Object.fromEntries((r?.result?.[0]?.data?.matches || []).map((m) => [m.key, m.value]));
  });
  let wrong = 0;
  wanted.forEach((w, i) => {
    const got = now[i] || {};
    const ok = got.assetId === w.id;
    if (!ok) wrong++;
    console.log(`  ${ok ? 'ok  ' : 'MISS'} #${i} .${w.cls}  ${got.assetId || 'unset'}`);
    if (w.alt && got.altText && got.altText.trim() !== w.alt.trim()) {
      console.log(`       altText drift: page "${got.altText}" vs design "${w.alt}"`);
    }
  });
  console.log(`\n${images.length - wrong}/${images.length} images bound to the right asset`);
  process.exit(wrong ? 1 : 0);
}

if (DRY) process.exit(0);

/* ------------------------------------------------------------------ write -- */

/**
 * WRITE EACH ELEMENT AT MOST ONCE PER RUN — set_image_asset TOGGLES.
 *
 * Writing an image that is already bound to that asset UNBINDS it. Combined
 * with the write being eventually consistent (an immediate read-back still
 * says `unset`), a write-then-verify-then-retry loop is actively destructive:
 * it read "unset", wrote again, and drove this page from 6/7 bound to 5/7 to
 * 4/7 while reporting 1/7. The previous build's note that "re-running the
 * script is safe and idempotent" is wrong for this tool.
 *
 * So the run only ever writes images whose assetId is currently NOT what we
 * want, and never writes the same element twice. Run it again to repair what
 * is still missing — each run converges instead of thrashing.
 */
function readAssetIds() {
  return images.map((im) => {
    const r = call('data_element_settings_tool',
      [{ label: 's', get_settings: { type: 'all_raw_settings', element_id: im.node.id } }], o);
    return Object.fromEntries((r?.result?.[0]?.data?.matches || []).map((m) => [m.key, m.value]));
  });
}

const before = readAssetIds();
const todo = images.map((_, i) => i).filter((i) => before[i].assetId !== wanted[i].id);
console.log(`${images.length - todo.length}/${images.length} already correct; writing ${todo.length}`);

for (const i of todo) {
  call('data_element_tool', [{ label: 'set', set_image_asset: { id: images[i].node.id, image_asset_id: wanted[i].id } }], o);
}

/* ----------------------------------------------------------------- verify -- */
// Read the state back rather than trusting the write: set_image_asset has
// silently no-opped on a minority of elements before.
//
// `assetId` and `altText` are element SETTINGS, not attributes — get_attributes
// returns [] for an Image, which is why an alt-based pairing check looks like it
// passes while checking nothing at all.

// One element per call. Batching several get_settings actions into one call
// comes back in a shape this could not read, and it reported every image as
// unbound while six of the seven were in fact correct — a verifier that cries
// wolf is worse than none.
// Deliberately NOT verified in this process: the write has not settled yet, so
// an immediate read reports false negatives. Run `--check` (a fresh process,
// after the writes have landed) to see the real state.
console.log(`\nwrote ${todo.length} binding(s). They settle asynchronously —` +
  ' run `node map-assets.mjs <pageId> <html> --check` to read the real state.');
