#!/usr/bin/env node
/**
 * harvest-media-map.mjs — build the local-filename -> Instatic /uploads path map
 * WITHOUT the MCP bridge.
 *
 * WHY NOT content_list_media
 * --------------------------
 * The `content_*` tools need the Instatic CONTENT workspace open in a browser,
 * and this session only has the SITE editor open (`get_context` reports
 * contentConnected:false). A single call happened to succeed once and every
 * later one came back as an unparsed text blob, which is the bridge saying no
 * in a way that does not look like an error. So: read the map off the LIVE site,
 * which is plain HTTP and needs nothing open.
 *
 * Instatic names an upload `/uploads/<21-char-id>-<original-filename>`, and also
 * emits `-w64/-w320/-w640/-w1024.webp` derivatives. The original filename is
 * recoverable from the path, which is exactly the join key we need against the
 * local `assets/<name>` references.
 *
 *   node harvest-media-map.mjs
 */
import fs from 'node:fs';

const BASE = 'https://encorercm.com';
const SLUGS = ['', 'about', 'all-on-4', 'contact', 'cosmetic-dentistry', 'crowns-and-bridges',
  'dental-conditions', 'dental-implant-faq', 'dental-implants', 'doctor-referral',
  'emergency-dentistry', 'financing', 'implant-cost', 'implant-supported-dentures',
  'meet-dr-nahlah', 'oral-surgery', 'our-facility', 'our-team', 'patient-center',
  'patient-stories', 'privacy-policy', 'sedation-dentistry', 'smile-gallery',
  'smile-makeover', 'teeth-whitening', 'terms-conditions', 'veneers'];

// `-w<digits>.webp` is a generated derivative, never an upload of its own.
const DERIV = /-w\d+\.(webp|avif|jpg|jpeg|png)$/i;

const map = new Map();     // original filename -> publicPath
let fetched = 0;

for (const slug of SLUGS) {
  const url = `${BASE}/${slug}`;
  let html;
  try {
    const res = await fetch(url);
    if (!res.ok) { console.warn(`  ${res.status} ${url}`); continue; }
    html = await res.text();
    fetched++;
  } catch (e) { console.warn(`  FAIL ${url}: ${e.message}`); continue; }

  for (const m of html.matchAll(/\/uploads\/([A-Za-z0-9_-]{21})-([^"'\s)?]+)/g)) {
    const [, id, name] = m;
    if (DERIV.test(name)) continue;
    const path = `/uploads/${id}-${name}`;
    if (!map.has(name)) map.set(name, path);
  }
}

const obj = Object.fromEntries([...map.entries()].sort());
fs.writeFileSync('instatic-media-map.json', JSON.stringify(obj, null, 1));
console.log(`${fetched}/${SLUGS.length} pages fetched, ${map.size} distinct uploads -> instatic-media-map.json`);

// ---- what the local build needs that is not up there yet -------------------
const used = JSON.parse(fs.readFileSync('local-media-used.json', 'utf8'));
const missing = [];
for (const ref of Object.keys(used)) {
  const name = ref.replace(/^assets\//, '');
  // The five practice-space photos were uploaded as .jpg because media_upload
  // will not take AVIF; match them through that rename.
  const candidates = [name, name.replace(/\.avif$/i, '.jpg')];
  if (!candidates.some((c) => map.has(c))) missing.push(ref);
}
fs.writeFileSync('media-missing.json', JSON.stringify(missing, null, 1));
console.log(`local build references ${Object.keys(used).length} files; ${missing.length} not yet on Instatic -> media-missing.json`);
for (const m of missing.slice(0, 40)) console.log('   ', m);
if (missing.length > 40) console.log(`    … and ${missing.length - 40} more`);
