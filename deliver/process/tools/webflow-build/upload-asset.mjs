#!/usr/bin/env node
/**
 * upload-asset.mjs — put a local file into a Webflow site's asset library over the MCP.
 *
 * Promoted 2026-09-23 from legacy-dental-pasadena/workflows/07-webflow-build/.tmp/native/
 * upload-asset.mjs (the same approach ran on marvel-dental's sync-assets). Generalised: site id
 * from --site / WF_SITE_ID, async wf.mjs.
 *
 *   node upload-asset.mjs --site <id> <file> [displayName]   > .tmp/upload.log 2>&1
 *
 * Two steps, because that is what the Assets API is:
 *   1. create_asset with the file name and the MD5 of the raw bytes. Webflow answers with an
 *      S3 `uploadUrl` and `uploadDetails` (policy fields). Not SHA, not base64: MD5 of the exact
 *      bytes, or S3 fails at step 2 with no useful message.
 *   2. multipart POST to S3: every policy field FIRST, the file LAST (S3 ignores what follows
 *      the file). The fields come back camelCase but the policy is signed on canonical names;
 *      posting them as returned earns a bare 403 AccessDenied.
 * Then read the asset back: its s3 `hostedUrl` is what an Image binds to. An image pointed at a
 * cdn.prod.website-files.com URL instead ships unmanaged.
 *
 * Adding an asset is additive and safe on a live site. This script never updates or deletes.
 * Webflow skips an upload whose name it already has: a re-cut image needs a NEW file name.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { call, result } from './wf.mjs';

const argv = process.argv.slice(2);
const si = argv.indexOf('--site');
const site = si >= 0 ? argv.splice(si, 2)[1] : process.env.WF_SITE_ID;
const [file, display] = argv;
if (!site || !file) { console.error('usage: upload-asset.mjs --site <id> <file> [displayName]'); process.exit(2); }

const abs = path.resolve(file);
const bytes = fs.readFileSync(abs);
const name = display || path.basename(abs);
const hash = crypto.createHash('md5').update(bytes).digest('hex');
console.log(`${name}  ${bytes.length} bytes  md5 ${hash}`);

const data = result(await call('data_assets_tool', [{ label: 'new', create_asset: { file_name: name, file_hash: hash } }], { site }));
const uploadUrl = data?.uploadUrl;
const details = data?.uploadDetails;
if (!uploadUrl || !details) { console.error('create_asset returned no upload target:\n' + JSON.stringify(data).slice(0, 700)); process.exit(1); }

const S3_FIELD = {
  xAmzAlgorithm: 'X-Amz-Algorithm',
  xAmzCredential: 'X-Amz-Credential',
  xAmzDate: 'X-Amz-Date',
  xAmzSignature: 'X-Amz-Signature',
  successActionStatus: 'success_action_status',
  contentType: 'Content-Type',
  cacheControl: 'cache-control',
};
const form = new FormData();
for (const [k, v] of Object.entries(details)) if (k !== 'file') form.append(S3_FIELD[k] || k, String(v));
form.append('file', new Blob([bytes], { type: details.contentType || 'application/octet-stream' }), name);

const up = await fetch(uploadUrl, { method: 'POST', body: form });
if (!up.ok) { console.error(`S3 upload failed ${up.status}: ${(await up.text()).slice(0, 500)}`); process.exit(1); }

const id = data.id || data._id || data.assetId;
console.log(`uploaded. asset id ${id}`);
const back = result(await call('data_assets_tool', [{ label: 'a', get_asset: { asset_id: id } }], { site }));
console.log('hostedUrl: ' + (back?.hostedUrl || '(not yet available, re-read in a moment)'));
