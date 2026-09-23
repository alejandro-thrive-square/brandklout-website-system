#!/usr/bin/env node
/**
 * dump-media.mjs — pull the whole Instatic media library into instatic-media.json
 * and rebuild instatic-media-map.json from it.
 *
 * WHY THIS IS THE AUTHORITY, and the live site is not
 * ---------------------------------------------------
 * The first pass built the map by scraping `/uploads/...` out of the published
 * HTML, skipping `-w<N>.webp` derivatives. That is fine for the map but wrong
 * for deciding what is MISSING: any upload referenced only through a derivative
 * (the hero poster, and 33 gallery masters) reads as absent. Acting on that list
 * uploaded 33 files that were already there. `content_list_media` returns
 * filename + publicPath directly, so ask it.
 *
 * It is flaky rather than unavailable: a large `limit` comes back as an
 * unparsed text blob and the Content workspace connection drops in and out. So
 * page it in small batches with retries, and union by id.
 *
 *   node dump-media.mjs [--batch 50] [--rounds 3]
 */
import fs from 'node:fs';
import { callJson } from './instatic-mcp.mjs';

const argv = process.argv.slice(2);
const BATCH = Number(argv.includes('--batch') ? argv[argv.indexOf('--batch') + 1] : 50);
const ROUNDS = Number(argv.includes('--rounds') ? argv[argv.indexOf('--rounds') + 1] : 3);

const seen = new Map();
let total = null;

async function grab(args, label) {
  for (let attempt = 0; attempt < 4; attempt++) {
    let r;
    try { r = await callJson('content_list_media', args); }
    catch { await new Promise((s) => setTimeout(s, 1500)); continue; }
    if (!Array.isArray(r.media)) { await new Promise((s) => setTimeout(s, 1500)); continue; }
    if (typeof r.total === 'number') total = r.total;
    let added = 0;
    for (const m of r.media) if (!seen.has(m.id)) { seen.set(m.id, m); added++; }
    return added;
  }
  console.warn(`  ${label}: no JSON after 4 attempts`);
  return 0;
}

// `content_list_media` has no cursor, only `query`. A plain batch call returns
// the newest N, so vary the query to reach the rest: every letter and digit, and
// the substrings that dominate this library's filenames.
const QUERIES = [null, ...'abcdefghijklmnopqrstuvwxyz0123456789'.split(''),
  'case', 'veneers', 'ao4', 'double', 'single', 'whitening', 'porcelain', 'makeover',
  'fullarch', 'pt-', 'team', 'office', 'practice', 'dental', 'implant', 'sedation',
  'tooth', 'crown', 'bridge', 'denture', 'logo', 'hero', 'poster', 'lab', 'tech'];

for (let round = 0; round < ROUNDS; round++) {
  let addedThisRound = 0;
  for (const q of QUERIES) {
    addedThisRound += await grab(q ? { query: q, limit: BATCH } : { limit: BATCH }, q || '(all)');
  }
  console.log(`round ${round + 1}: ${seen.size} known${total != null ? ` of ${total}` : ''} (+${addedThisRound})`);
  if (total != null && seen.size >= total) break;
  if (!addedThisRound) break;
}

const media = [...seen.values()];
fs.writeFileSync('instatic-media.json', JSON.stringify(media, null, 1));
console.log(`\n${media.length} media${total != null ? ` of ${total} reported` : ''} -> instatic-media.json`);

// ---- rebuild the map, oldest id wins ---------------------------------------
// Where a filename exists twice (the 33 duplicates this session created), keep
// the ORIGINAL so the pages point at what the live site already serves and the
// duplicates stay unreferenced, i.e. safe to prune.
const byName = new Map();
for (const m of media) {
  const prev = byName.get(m.filename);
  if (!prev || (m.createdAt ?? 0) < (prev.createdAt ?? 0)) byName.set(m.filename, m);
}
const map = {};
for (const [name, m] of byName) map[name] = m.publicPath;
fs.writeFileSync('instatic-media-map.json', JSON.stringify(
  Object.fromEntries(Object.entries(map).sort()), null, 1));
console.log(`${Object.keys(map).length} distinct filenames -> instatic-media-map.json`);

const dupNames = [...new Set(media.map((m) => m.filename))]
  .filter((n) => media.filter((m) => m.filename === n).length > 1);
if (dupNames.length) {
  fs.writeFileSync('media-duplicates.json', JSON.stringify(dupNames.sort(), null, 1));
  console.log(`${dupNames.length} filenames exist more than once -> media-duplicates.json`);
}
