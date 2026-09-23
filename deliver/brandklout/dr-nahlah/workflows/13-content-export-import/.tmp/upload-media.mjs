#!/usr/bin/env node
/**
 * upload-media.mjs — push the images the revised local build needs but Instatic
 * does not have yet, and extend instatic-media-map.json with the results.
 *
 * Input  : media-missing.json  (written by harvest-media-map.mjs)
 * Output : instatic-media-map.json, updated in place after every successful
 *          upload, so an interrupted run resumes instead of re-uploading.
 *
 * NOTES
 * -----
 * - `media_upload` accepts JPEG, PNG, GIF, WebP and SVG only, and sniffs the
 *   type from the BYTES, so renaming does not help. `broll.mp4` is therefore
 *   skipped and stays a known difference from the local build (the home page's
 *   proof film uses hero.mp4 on Instatic, which is already uploaded).
 * - Alt text is lifted from the local build's own `alt` attribute for that file,
 *   so the library carries the same honest description the page does rather than
 *   a filename.
 * - The bridge flaps; callJson already retries, but a failed upload is recorded
 *   and reported rather than aborting the run.
 *
 *   node upload-media.mjs [--limit N] [--dry]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { callJson } from './instatic-mcp.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(HERE, '../../04-design/.tmp/final-site');
const argv = process.argv.slice(2);
const LIMIT = argv.includes('--limit') ? Number(argv[argv.indexOf('--limit') + 1]) : Infinity;
const DRY = argv.includes('--dry');

const SKIP = new Set(['assets/broll.mp4']);          // media_upload takes images only

const missing = JSON.parse(fs.readFileSync(path.join(HERE, 'media-missing.json'), 'utf8'));
const mapFile = path.join(HERE, 'instatic-media-map.json');
const map = JSON.parse(fs.readFileSync(mapFile, 'utf8'));

// ---- alt text, from the local build itself ---------------------------------
const alt = new Map();
for (const f of fs.readdirSync(SITE).filter((n) => n.endsWith('.html'))) {
  const html = fs.readFileSync(path.join(SITE, f), 'utf8');
  for (const m of html.matchAll(/<img[^>]*\bsrc="(assets\/[^"]+)"[^>]*>/g)) {
    const a = /\balt="([^"]*)"/.exec(m[0]);
    if (a && a[1] && !alt.has(m[1])) alt.set(m[1], a[1]);
  }
}

const todo = missing.filter((r) => !SKIP.has(r)).slice(0, LIMIT);
console.log(`${missing.length} missing, ${missing.length - todo.length} skipped, uploading ${todo.length}`);
if (DRY) { for (const r of todo) console.log('  ', r, '|', alt.get(r) || '(no alt)'); process.exit(0); }

const failed = [];
let done = 0;
for (const ref of todo) {
  const file = path.join(SITE, ref);
  const filename = path.basename(ref);
  if (map[filename]) { console.log(`  = ${filename} (already mapped)`); continue; }
  if (!fs.existsSync(file)) { console.warn(`  ! ${ref} not on disk`); failed.push(ref); continue; }

  const data = fs.readFileSync(file).toString('base64');
  try {
    const r = await callJson('media_upload', {
      filename,
      data,
      altText: alt.get(ref) || '',
    });
    const publicPath = r.publicPath || r.media?.publicPath;
    if (!publicPath) throw new Error(`no publicPath in response: ${JSON.stringify(r).slice(0, 200)}`);
    map[filename] = publicPath;
    fs.writeFileSync(mapFile, JSON.stringify(map, null, 1));
    done++;
    console.log(`  + ${filename} -> ${publicPath}`);
  } catch (e) {
    console.warn(`  ! ${filename}: ${e.message}`);
    failed.push(ref);
  }
}

console.log(`\nuploaded ${done}, failed ${failed.length}`);
if (failed.length) {
  fs.writeFileSync(path.join(HERE, 'media-upload-failed.json'), JSON.stringify(failed, null, 1));
  console.log('  -> media-upload-failed.json');
}
