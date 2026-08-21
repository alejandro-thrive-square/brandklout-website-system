#!/usr/bin/env node
/**
 * sync-assets.mjs — refresh the local mirror of the site's asset library.
 *
 *   node sync-assets.mjs
 *
 * `check-images.mjs` gates every image on this file, so a stale mirror reports
 * a freshly uploaded asset as NO SUCH ASSET — a false failure that looks
 * exactly like a typo'd id. Run this after any upload.
 *
 * Paged deliberately: `GET /v2/assets` returns 100 at a time and rate-limits
 * hard, and once it does, unrelated tools start failing too because
 * `get_all_elements` and `query_elements` both read assets server-side.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { call, SITES } from './wf.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, 'assets.json');
const before = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')).length : 0;

const seen = new Map();
let total = Infinity;
for (let offset = 0; offset < total; offset += 100) {
  const res = call('data_assets_tool',
    [{ label: 'a', list_assets: { limit: 100, offset } }], { site: SITES.legacy });
  const r = (Array.isArray(res) ? res[0] : res)?.result;
  if (!r) { console.log('list_assets returned nothing at offset ' + offset); process.exit(1); }
  total = r.pagination?.total ?? 0;
  for (const a of r.assets || []) seen.set(a.id, a);
}

fs.writeFileSync(OUT, JSON.stringify([...seen.values()]));
console.log(`assets.json: ${seen.size} asset(s)` + (before ? ` (was ${before})` : ''));
if (seen.size !== total) console.log(`WARNING: the API reports ${total}; ${seen.size} were collected`);
