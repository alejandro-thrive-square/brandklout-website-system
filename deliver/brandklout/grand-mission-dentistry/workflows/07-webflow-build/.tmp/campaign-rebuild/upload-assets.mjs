#!/usr/bin/env node
// Upload every image in the campaign package to Webflow site assets.
// Uses wfmcp.mjs (sibling dir) for the MCP create_asset call, then POSTs the
// bytes to the presigned S3 target. Writes asset-map.json {file -> {id, hostedUrl}}.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SITE = '698111847e9608eb30ee21c6';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const WFMCP = path.join(HERE, '..', 'wfmcp.mjs');
const IMGDIR = path.resolve(HERE, '../../../../docs/grand-mission-campaigns/assets/images');
const OUT = path.join(HERE, 'asset-map.json');

const map = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
const files = fs.readdirSync(IMGDIR).filter(f => /\.(webp|jpe?g|png)$/i.test(f));
console.log('files:', files.length, 'dir:', IMGDIR);

for (const f of files) {
  if (map[f]?.id) { console.log('skip (done):', f); continue; }
  const bytes = fs.readFileSync(path.join(IMGDIR, f));
  const md5 = crypto.createHash('md5').update(bytes).digest('hex');
  const name = 'gmc-' + f; // campaign prefix so assets are findable in the panel
  const args = {
    context: 'Upload campaign image assets so new landing page elements can reference them.',
    actions: [{ label: f, create_asset: { site_id: SITE, file_name: name, file_hash: md5 } }],
  };
  const argFile = path.join(HERE, '.args-upload.json');
  fs.writeFileSync(argFile, JSON.stringify(args));
  const outRaw = execFileSync('node', [WFMCP, 'call', 'data_assets_tool', '--file', argFile], { encoding: 'utf8' });
  let created = null;
  // response contains uploadUrl + uploadDetails + id + hostedUrl
  const m = outRaw.match(/\{[\s\S]*\}/);
  const dig = (o) => {
    if (!o || typeof o !== 'object') { return; }
    if (o.uploadUrl && o.uploadDetails) { created = o; return; }
    for (const k of Object.keys(o)) {
      if (created) return;
      if (typeof o[k] === 'string' && o[k].includes('uploadUrl')) { try { dig(JSON.parse(o[k])); } catch { } }
      else dig(o[k]);
    }
  };
  try { dig(JSON.parse(m[0])); } catch (e) { /* try line split */ }
  if (!created) {
    // maybe concatenated objects
    let depth = 0, start = -1;
    for (let i = 0; i < outRaw.length; i++) {
      const c = outRaw[i];
      if (c === '{') { if (depth === 0) start = i; depth++; }
      else if (c === '}') { depth--; if (depth === 0) { try { dig(JSON.parse(outRaw.slice(start, i + 1))); } catch { } } }
    }
  }
  if (!created) { console.error('NO uploadUrl for', f, outRaw.slice(0, 400)); process.exitCode = 1; continue; }
  const fd = new FormData();
  // Webflow returns camelCased keys; the signed S3 policy expects canonical names.
  const S3KEY = {
    xAmzAlgorithm: 'X-Amz-Algorithm', xAmzCredential: 'X-Amz-Credential',
    xAmzDate: 'X-Amz-Date', xAmzSignature: 'X-Amz-Signature',
    successActionStatus: 'success_action_status', contentType: 'Content-Type',
    cacheControl: 'cache-control',
  };
  for (const [k, v] of Object.entries(created.uploadDetails)) fd.append(S3KEY[k] ?? k, v);
  const ext = f.split('.').pop().toLowerCase();
  const type = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
  fd.append('file', new Blob([bytes], { type }), name);
  const resp = await fetch(created.uploadUrl, { method: 'POST', body: fd });
  if (!(resp.status === 201 || resp.status === 204 || resp.ok)) {
    console.error('S3 FAIL', f, resp.status, (await resp.text()).slice(0, 300));
    process.exitCode = 1; continue;
  }
  map[f] = { id: created.id, hostedUrl: created.hostedUrl, name };
  fs.writeFileSync(OUT, JSON.stringify(map, null, 2));
  console.log('uploaded:', f, '->', created.id);
}
console.log('done. mapped:', Object.keys(map).length);
