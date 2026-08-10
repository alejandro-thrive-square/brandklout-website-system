#!/usr/bin/env node
/**
 * remap-assets.mjs — repoint every Image element on the six landing pages at a
 * real uploaded Webflow asset.
 *
 * The paste left each img with src `https://cdn.prod.website-files.com/<file>`
 * — no site id, no asset hash — which 403s. upload-assets.mjs put the real
 * bytes on the site and wrote asset-map.json; this walks each page's Image
 * elements, reads the filename off whatever src they currently carry, and
 * calls set_image_asset with the matching asset id.
 *
 * PAIRING. `query_elements` does NOT return an Image element's current src or
 * assetId, so the element alone cannot say which file it wants. It does return
 * elements in document order, which is the same order the published HTML lists
 * its <img> tags in — so element i is published img i. That pairing is then
 * CHECKED against the DOM id and the alt text before anything is written; a
 * page whose counts or ids disagree is skipped rather than guessed at, because
 * a silent off-by-one here puts the surgeon's portrait in the hero.
 *
 *   node remap-assets.mjs [--dry] [slug ...]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { callTool } from './wfmcp.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = '693c51e685b19f0d0c149cab';
const DRY = process.argv.includes('--dry');

const PAGES = {
  'dental-implants-ads-landing': '6a79f2aeabc1d37969522293',
  'all-on-x-ads-landing': '6a7a21d7f34df29a4defacdf',
  'porcelain-veneers-ads-landing': '6a7a21fef87845352663538f',
  'emergency-dentist-ads-landing': '6a7a223bf8c58b0aa0c6af2e',
  'dentist-near-me-ads-landing': '6a7a2268da766fb28cddb149',
  'next-door-family-ads-landing': '6a7a228d106ed97b8a7885c9',
};

const map = JSON.parse(fs.readFileSync(path.join(HERE, 'asset-map.json'), 'utf8'));

/**
 * Resolve by displayName, NOT by hostedUrl. `create_asset` hands back a
 * `cdn.prod.website-files.com` URL while `list_assets` reports the same asset's
 * raw `s3.amazonaws.com/webflow-prod-assets` URL, so a URL key never matches
 * for anything uploaded in this run. The id is what set_image_asset wants
 * anyway.
 */
const idByName = new Map();
async function refreshAssetIndex() {
  let all = [];
  for (let off = 0; off < 2000; off += 100) {
    const { text } = await callTool('data_assets_tool', {
      actions: [{ label: 'l', list_assets: { site_id: SITE, limit: 100, offset: off } }],
    });
    const r = JSON.parse(text).result;
    all = all.concat(r.assets);
    if (off + r.assets.length >= r.pagination.total || !r.assets.length) break;
  }
  const dupes = new Map();
  for (const a of all) {
    if (idByName.has(a.displayName)) dupes.set(a.displayName, (dupes.get(a.displayName) || 1) + 1);
    else idByName.set(a.displayName, a.id);
  }
  for (const [n, c] of dupes) if (map[n]) console.log(`  !! ${c} assets named ${n} — using the newest`);
  fs.writeFileSync(path.join(HERE, 'site-assets.json'), JSON.stringify(all, null, 1));
  return all.length;
}

const basename = (u) => decodeURIComponent(String(u).split('?')[0].split('/').pop() || '');
/** The real asset filename is prefixed `<24hex>_`; the broken one is not. */
const stripHash = (b) => b.replace(/^[a-f0-9]{24}_/, '');

/** Only files the upload step actually accounted for are eligible. */
const assetIdFor = (file) => (map[file] ? idByName.get(file) : undefined);

console.log(`refreshing asset index... ${await refreshAssetIndex()} assets`);

const only = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const slugs = only.length ? only : Object.keys(PAGES);

const decode = (s) => String(s).replace(/&#x27;/g, "'").replace(/&amp;/g, '&')
  .replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

/** The <img> tags of the published page, in document order. */
function publishedImgs(slug) {
  const html = fs.readFileSync(path.join(HERE, 'staging', `${slug}.html`), 'utf8');
  return [...html.matchAll(/<img[^>]*>/g)].map((m) => ({
    src: (m[0].match(/src="([^"]*)"/) || [])[1] || '',
    domId: (m[0].match(/\bid="([^"]*)"/) || [])[1] || '',
    alt: decode((m[0].match(/alt="([^"]*)"/) || [])[1] || ''),
  }));
}

let fixed = 0, already = 0, skipped = [], unmatched = [];

for (const slug of slugs) {
  const pageId = PAGES[slug];
  const { text } = await callTool('data_element_tool', {
    siteId: SITE, pageId,
    context: 'Repointing pasted landing page images at real uploaded Webflow assets after asset upload.',
    actions: [{ label: 'imgs', query_elements: { queries: [{ label: 'img', element_filter: { type: 'Image' } }] } }],
  });
  // The envelope occasionally comes back without result[0].data (transient
  // server-side error). Surface it instead of dying with a TypeError three
  // pages into a run that has already written to the site.
  const env = JSON.parse(text);
  const els = env?.result?.[0]?.data?.[0]?.matches;
  if (!els) {
    skipped.push(`${slug}: unexpected query envelope — ${JSON.stringify(env).slice(0, 300)}`);
    console.log(`\n### ${slug} — SKIP, unexpected query envelope:\n   ${JSON.stringify(env).slice(0, 400)}`);
    continue;
  }
  const pub = publishedImgs(slug);
  console.log(`\n### ${slug} — ${els.length} Image elements, ${pub.length} published <img>`);

  if (els.length !== pub.length) {
    skipped.push(`${slug}: ${els.length} elements vs ${pub.length} published imgs`);
    console.log('   SKIP — counts disagree, refusing to pair by index');
    continue;
  }
  // Verify the index pairing before trusting it for any write on this page.
  const conflicts = [];
  els.forEach((el, i) => {
    const eId = el.attributes?.id || '', pId = pub[i].domId;
    const eAlt = el.settings?.altText || '', pAlt = pub[i].alt;
    if (eId && pId && eId !== pId) conflicts.push(`#${i} domId ${eId} != ${pId}`);
    if (eAlt && pAlt && eAlt !== pAlt) conflicts.push(`#${i} alt "${eAlt}" != "${pAlt}"`);
  });
  if (conflicts.length) {
    skipped.push(`${slug}: ${conflicts.join('; ')}`);
    console.log('   SKIP — pairing check failed: ' + conflicts.join('; '));
    continue;
  }

  for (let i = 0; i < els.length; i++) {
    const el = els[i], src = pub[i].src, file = stripHash(basename(src));
    if (src.includes('/' + SITE + '/')) { already++; console.log(`   ok    ${file}`); continue; }
    const aid = assetIdFor(file);
    if (!aid) { unmatched.push({ slug, file, src }); console.log(`   MISS  ${file}  (${src.slice(0, 70)})`); continue; }
    if (DRY) { console.log(`   would ${file} -> ${aid}`); fixed++; continue; }
    const r = await callTool('data_element_tool', {
      siteId: SITE, pageId,
      context: 'Repointing a pasted landing page image at its real uploaded Webflow asset.',
      actions: [{ label: 'set', set_image_asset: { id: el.id, image_asset_id: aid } }],
    });
    const bad = r.raw?.isError || /"status"\s*:\s*"error"/.test(r.text);
    console.log(`   ${bad ? 'FAIL ' : 'set  '} ${file} -> ${aid}${bad ? '  ' + r.text.slice(0, 240) : ''}`);
    if (!bad) fixed++;
  }
}

console.log(`\n${fixed} repointed, ${already} already correct, ${unmatched.length} unmatched, ${skipped.length} pages skipped`);
for (const u of unmatched) console.log(`  unmatched: ${u.slug}  ${u.file}`);
for (const s of skipped) console.log(`  skipped:   ${s}`);
