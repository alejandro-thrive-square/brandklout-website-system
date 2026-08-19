#!/usr/bin/env node
/**
 * check-dupes.mjs — did the upload run create duplicates?
 *
 * harvest-media-map.mjs skipped `-w<N>.webp` derivatives, which is right for
 * building the map but WRONG for deciding what is missing: an upload whose
 * original is only ever referenced through a derivative (the hero poster is
 * exactly this) looks absent when it is not. This re-harvests including
 * derivatives, folds each one back to its original name, and reports any name
 * that now has two upload ids.
 */
import fs from 'node:fs';

const BASE = 'https://encorercm.com';
const SLUGS = ['', 'about', 'all-on-4', 'contact', 'cosmetic-dentistry', 'crowns-and-bridges',
  'dental-conditions', 'dental-implant-faq', 'dental-implants', 'doctor-referral',
  'emergency-dentistry', 'financing', 'implant-cost', 'implant-supported-dentures',
  'meet-dr-nahlah', 'oral-surgery', 'our-facility', 'our-team', 'patient-center',
  'patient-stories', 'privacy-policy', 'sedation-dentistry', 'smile-gallery',
  'smile-makeover', 'teeth-whitening', 'terms-conditions', 'veneers'];

const byName = new Map();   // original-ish name -> Set(id)
for (const slug of SLUGS) {
  let html;
  try {
    const r = await fetch(`${BASE}/${slug}`);
    if (!r.ok) continue;
    html = await r.text();
  } catch { continue; }
  for (const m of html.matchAll(/\/uploads\/([A-Za-z0-9_-]{21})-([^"'\s)?]+)/g)) {
    const [, id, file] = m;
    // fold the derivative back: name-w640.webp -> name.<whatever>; compare stems
    const stem = file.replace(/-w\d+\.(webp|avif|jpg|jpeg|png)$/i, '').replace(/\.[a-z0-9]+$/i, '');
    if (!byName.has(stem)) byName.set(stem, new Set());
    byName.get(stem).add(id);
  }
}

const map = JSON.parse(fs.readFileSync('instatic-media-map.json', 'utf8'));
const uploadedNow = new Set(
  JSON.parse(fs.readFileSync('media-missing.json', 'utf8'))
    .map((r) => r.replace(/^assets\//, '')));

let dupes = 0, preexisting = [];
for (const name of uploadedNow) {
  const stem = name.replace(/\.[a-z0-9]+$/i, '').replace(/\./g, '_');
  const alt = name.replace(/\.[a-z0-9]+$/i, '');
  const ids = byName.get(stem) || byName.get(alt);
  if (!ids) continue;                       // genuinely new, nothing on the live site
  const mapped = map[name];
  const mappedId = mapped && /\/uploads\/([A-Za-z0-9_-]{21})-/.exec(mapped)?.[1];
  if (mappedId && !ids.has(mappedId)) { dupes++; preexisting.push([name, [...ids][0], mappedId]); }
}
console.log(`${uploadedNow.size} names uploaded this run`);
console.log(`${dupes} of them ALREADY existed on the live site under a different id:`);
for (const [n, was, now] of preexisting) console.log(`   ${n}\n     live: ${was}\n     new : ${now}`);
if (!dupes) console.log('   (none — the upload run created no duplicates)');
