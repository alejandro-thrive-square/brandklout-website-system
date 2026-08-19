#!/usr/bin/env node
/**
 * build-media-map.mjs — the local-filename -> Instatic /uploads path map,
 * built over plain HTTP and VERIFIED, with no dependence on the MCP bridge.
 *
 * WHY NOT content_list_media
 * --------------------------
 * It needs the Instatic CONTENT workspace open in a browser. This session has
 * only the SITE editor (`get_context` -> contentConnected:false). One early call
 * happened to return JSON and every later one came back as an unparsed text
 * blob; a paging run against it retried for half an hour and produced nothing.
 * It is not a rate limit, it is the wrong workspace.
 *
 * HOW THIS WORKS INSTEAD
 * ----------------------
 * Instatic names an upload `/uploads/<21-char-id>-<filename>` and emits
 * `-w<N>.webp` derivatives beside it. So the published HTML of the 27 live pages
 * contains the id for every image the site already uses, even where only the
 * derivative is referenced (which is exactly what the first attempt got wrong:
 * skipping derivatives made 33 already-present masters look missing, and they
 * were re-uploaded).
 *
 * So: harvest every id+stem INCLUDING derivatives, then for each local asset
 * work out the candidate upload paths and HEAD each one until a 200 comes back.
 * The map that results is verified rather than inferred, which matters because a
 * wrong path fails silently as a broken image on a live page.
 *
 * Instatic normalises filenames on upload: `.jpeg` -> `.jpg`, and `.` -> `_`
 * inside the stem (`1.1-.jpg` -> `1_1-.jpg`). Both are tried.
 *
 *   node build-media-map.mjs [--concurrency 8]
 */
import fs from 'node:fs';

const BASE = 'https://encorercm.com';
const SLUGS = ['', 'about', 'all-on-4', 'contact', 'cosmetic-dentistry', 'crowns-and-bridges',
  'dental-conditions', 'dental-implant-faq', 'dental-implants', 'doctor-referral',
  'emergency-dentistry', 'financing', 'implant-cost', 'implant-supported-dentures',
  'meet-dr-nahlah', 'oral-surgery', 'our-facility', 'our-team', 'patient-center',
  'patient-stories', 'privacy-policy', 'sedation-dentistry', 'smile-gallery',
  'smile-makeover', 'teeth-whitening', 'terms-conditions', 'veneers'];

const argv = process.argv.slice(2);
const CONC = Number(argv.includes('--concurrency') ? argv[argv.indexOf('--concurrency') + 1] : 8);

// ---- 1. every id on the live site, keyed by filename stem ------------------
const idsByStem = new Map();          // stem -> Set(id)
const exact = new Map();              // exact filename -> full path (masters only)
for (const slug of SLUGS) {
  let html;
  try {
    const r = await fetch(`${BASE}/${slug}`);
    if (!r.ok) { console.warn(`  ${r.status} /${slug}`); continue; }
    html = await r.text();
  } catch (e) { console.warn(`  FAIL /${slug}: ${e.message}`); continue; }

  for (const m of html.matchAll(/\/uploads\/([A-Za-z0-9_-]{21})-([^"'\s)?]+)/g)) {
    const [, id, file] = m;
    const isDeriv = /-w\d+\.(webp|avif|jpg|jpeg|png)$/i.test(file);
    const stem = file
      .replace(/-w\d+\.(webp|avif|jpg|jpeg|png)$/i, '')
      .replace(/\.[a-z0-9]+$/i, '');
    if (!idsByStem.has(stem)) idsByStem.set(stem, new Set());
    idsByStem.get(stem).add(id);
    if (!isDeriv && !exact.has(file)) exact.set(file, `/uploads/${id}-${file}`);
  }
}
console.log(`live scan: ${idsByStem.size} stems, ${exact.size} masters referenced directly`);

// ---- 2. candidate paths for each local asset -------------------------------
const used = JSON.parse(fs.readFileSync('local-media-used.json', 'utf8'));
const refs = Object.keys(used).map((r) => r.replace(/^assets\//, ''));

/** Instatic's filename normalisation, as observed on this site. */
function normalise(name) {
  const dot = name.lastIndexOf('.');
  const stem = name.slice(0, dot).replace(/\./g, '_');
  let ext = name.slice(dot + 1).toLowerCase();
  if (ext === 'jpeg') ext = 'jpg';
  if (ext === 'avif') ext = 'jpg';        // AVIF is re-encoded before upload
  return `${stem}.${ext}`;
}

function candidates(name) {
  const out = new Set();
  const norm = normalise(name);
  for (const n of [name, norm]) {
    if (exact.has(n)) out.add(exact.get(n));
    const stem = n.slice(0, n.lastIndexOf('.'));
    for (const id of idsByStem.get(stem) || []) out.add(`/uploads/${id}-${n}`);
  }
  return [...out];
}

// ---- 3. verify by HEAD, first 200 wins -------------------------------------
const map = {};
const unresolved = [];
let done = 0;

async function resolve(name) {
  for (const path of candidates(name)) {
    try {
      const r = await fetch(BASE + path, { method: 'HEAD' });
      if (r.ok) { map[name] = path; return; }
    } catch { /* try the next candidate */ }
  }
  unresolved.push(name);
}

const queue = [...refs];
await Promise.all(Array.from({ length: CONC }, async () => {
  for (;;) {
    const name = queue.shift();
    if (!name) return;
    await resolve(name);
    if (++done % 25 === 0) process.stdout.write(`  ${done}/${refs.length}\n`);
  }
}));

fs.writeFileSync('instatic-media-map.json',
  JSON.stringify(Object.fromEntries(Object.entries(map).sort()), null, 1));
fs.writeFileSync('media-unresolved.json', JSON.stringify(unresolved.sort(), null, 1));
console.log(`\nresolved ${Object.keys(map).length}/${refs.length} (each confirmed 200)`);
console.log(`unresolved ${unresolved.length} -> media-unresolved.json`);
for (const u of unresolved) console.log('   ', u);
