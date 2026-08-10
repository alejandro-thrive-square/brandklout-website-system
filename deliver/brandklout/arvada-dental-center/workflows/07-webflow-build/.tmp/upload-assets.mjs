#!/usr/bin/env node
/**
 * upload-assets.mjs — get every image the six landing pages reference onto the
 * Webflow site, and write the real hosted URLs to asset-map.json.
 *
 * WHY
 * ---
 * The pages were pasted with img srcs of the form
 * `https://cdn.prod.website-files.com/<filename>` — no site id, no asset hash.
 * That is not a Webflow asset URL, it is a guess, and every one of them 403s.
 * This script uploads the real bytes and produces the filename -> hostedUrl map
 * that remap-assets.mjs then applies to the live pages.
 *
 * `create_asset` only writes the metadata row and hands back a presigned S3
 * POST (uploadUrl + uploadDetails). Until the bytes land the asset exists in
 * the library with a dead hostedUrl, so the two steps are done together here.
 * The presigned policy expires after ~1 hour.
 *
 * THE FIELD NAMES MUST BE TRANSLATED. The MCP hands uploadDetails back
 * camelCased (`xAmzSignature`, `policy`, `contentType`, `cacheControl`) but the
 * presigned policy is signed over the canonical S3 names (`X-Amz-Signature`,
 * `Policy`, `Content-Type`, `Cache-Control`). Forwarding the keys verbatim
 * makes S3 answer every POST with `403 AccessDenied` and no hint as to which
 * field is wrong. Decode the `policy` blob if this ever drifts — it lists the
 * exact names it expects in its conditions array.
 *
 *   node upload-assets.mjs [--dry]
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { callTool } from './wfmcp.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = '693c51e685b19f0d0c149cab';
const ASSET_DIR = path.resolve(HERE, '../../04-design/.tmp/_shared/assets');
const DRY = process.argv.includes('--dry');

/** camelCased key from the MCP -> the name the presigned policy was signed over. */
const S3_FIELD = {
  xAmzAlgorithm: 'X-Amz-Algorithm',
  xAmzCredential: 'X-Amz-Credential',
  xAmzDate: 'X-Amz-Date',
  xAmzSignature: 'X-Amz-Signature',
  policy: 'Policy',
  successActionStatus: 'success_action_status',
  contentType: 'Content-Type',
  cacheControl: 'Cache-Control',
};

const CT = { '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' };
const ctOf = (f) => CT[path.extname(f).toLowerCase()] || 'application/octet-stream';

const want = Object.keys(JSON.parse(fs.readFileSync(path.join(HERE, 'payload/assets.json'), 'utf8')).assets);
const existing = JSON.parse(fs.readFileSync(path.join(HERE, 'site-assets.json'), 'utf8'));
const byName = new Map(existing.map((a) => [a.displayName, a]));

const map = {};
const todo = [];
for (const f of want) {
  const hit = byName.get(f);
  if (hit) { map[f] = hit.hostedUrl; continue; }
  if (!fs.existsSync(path.join(ASSET_DIR, f))) { console.log(`  !! no local file for ${f}`); continue; }
  todo.push(f);
}
console.log(`${Object.keys(map).length} already on the site, ${todo.length} to upload`);
if (DRY) { console.log(todo.join('\n')); process.exit(0); }

let ok = 0;
const failed = [];
for (const f of todo) {
  const bytes = fs.readFileSync(path.join(ASSET_DIR, f));
  const md5 = crypto.createHash('md5').update(bytes).digest('hex');

  const { text } = await callTool('data_assets_tool', {
    actions: [{ label: 'c', create_asset: { site_id: SITE, file_name: f, file_hash: md5 } }],
  });
  const res = JSON.parse(text).result;
  const { uploadUrl, uploadDetails, hostedUrl, id } = res;

  const form = new FormData();
  for (const [k, v] of Object.entries(uploadDetails)) {
    if (v == null) continue;
    form.append(S3_FIELD[k] ?? k, String(v));
  }
  form.append('file', new Blob([bytes], { type: ctOf(f) }), f);

  const r = await fetch(uploadUrl, { method: 'POST', body: form });
  if (r.status === 201 || r.status === 204 || r.ok) {
    ok++;
    map[f] = hostedUrl;
    console.log(`  ${r.status}  ${f.slice(0, 58).padEnd(58)} ${(bytes.length / 1024).toFixed(0)}KB  ${id}`);
  } else {
    const body = await r.text();
    failed.push({ f, status: r.status, body: body.slice(0, 400) });
    console.log(`  ${r.status}  ${f}  FAILED`);
  }
}

fs.writeFileSync(path.join(HERE, 'asset-map.json'), JSON.stringify(map, null, 2));
console.log(`\n${ok}/${todo.length} uploaded; asset-map.json has ${Object.keys(map).length}/${want.length} entries`);
for (const x of failed) console.log(`\n${x.f} (${x.status}):\n${x.body}`);
process.exit(failed.length ? 1 : 0);
