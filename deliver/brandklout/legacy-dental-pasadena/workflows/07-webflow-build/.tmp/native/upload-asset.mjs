#!/usr/bin/env node
/**
 * upload-asset.mjs — put a local file into the site's Webflow asset library.
 *
 *   node upload-asset.mjs <file> [displayName]
 *
 * Two steps, because that is what the Assets API is:
 *
 *   1. `create_asset` with the file name and the **MD5 of the raw bytes**.
 *      Webflow answers with `uploadUrl` (an S3 bucket) and `uploadDetails`
 *      (the form fields S3 requires, including its own policy and signature).
 *   2. A `multipart/form-data` POST to that bucket with those fields FIRST and
 *      the file LAST. S3 ignores anything after the file part, so ordering is
 *      not a style choice — put `file` anywhere but last and the upload fails
 *      with a signature error that reads like a credentials problem.
 *
 * The hash must be MD5 of the exact bytes being uploaded. Not SHA, not base64,
 * not the filename. Webflow content-addresses on it and S3 verifies it as the
 * ETag, so a mismatch fails at the second step with no useful message.
 *
 * ADDING an asset is additive and safe on this live site. UPDATING or DELETING
 * one is not, and this script does neither.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { call, SITES } from './wf.mjs';

const file = process.argv[2];
if (!file) { console.log('usage: upload-asset.mjs <file> [displayName]'); process.exit(1); }
const abs = path.resolve(file);
const bytes = fs.readFileSync(abs);
const name = process.argv[3] || path.basename(abs);
const hash = crypto.createHash('md5').update(bytes).digest('hex');

console.log(`${name}  ${bytes.length} bytes  md5 ${hash}`);

const res = call('data_assets_tool',
  [{ label: 'new', create_asset: { file_name: name, file_hash: hash } }],
  { site: SITES.legacy });

const r = Array.isArray(res) ? res[0] : res;
const data = r?.result ?? r?.data ?? r;
const uploadUrl = data?.uploadUrl;
const details = data?.uploadDetails;
if (!uploadUrl || !details) {
  console.log('create_asset did not return an upload target:\n' + JSON.stringify(res).slice(0, 700));
  process.exit(1);
}

/**
 * `uploadDetails` comes back in camelCase; the signed S3 policy is written
 * against the canonical field names. Posting the keys as returned earns a bare
 * `403 AccessDenied` with no hint that the problem is spelling — decode the
 * base64 `policy` and its conditions name every field exactly as below.
 */
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
// Every S3 policy field first...
for (const [k, v] of Object.entries(details)) {
  if (k === 'file') continue;
  form.append(S3_FIELD[k] || k, String(v));
}
// ...and the bytes last. S3 discards whatever follows the file part.
form.append('file', new Blob([bytes], { type: details.contentType || 'application/octet-stream' }), name);

const up = await fetch(uploadUrl, { method: 'POST', body: form });
if (!up.ok) {
  console.log(`S3 upload failed ${up.status}: ${(await up.text()).slice(0, 500)}`);
  process.exit(1);
}

const id = data.id || data._id || data.assetId;
console.log(`uploaded. asset id ${id}`);

// Read it back rather than trusting the create response: the hostedUrl is what
// every later step needs, and it is only final once S3 has the bytes.
const back = call('data_assets_tool', [{ label: 'a', get_asset: { asset_id: id } }], { site: SITES.legacy });
const got = (Array.isArray(back) ? back[0] : back)?.result;
console.log('hostedUrl: ' + (got?.hostedUrl || '(not yet available, re-read in a moment)'));
