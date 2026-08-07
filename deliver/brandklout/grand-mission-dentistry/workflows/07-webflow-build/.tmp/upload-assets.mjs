#!/usr/bin/env node
/**
 * upload-assets.mjs — put the design packages' images on Webflow's CDN and
 * record the mapping.
 *
 * The three landing-page packages reference their media as RELATIVE paths
 * (`assets/case-1.jpeg`). Those resolve to nothing on webflow.io, which is one
 * of the two ways a converted page silently arrives broken (the other being the
 * motion layer — see build-pages.mjs). Every image therefore has to exist as a
 * site asset first, and the embed HTML has to point at the hosted URL.
 *
 * Webflow's upload is two steps: `create_asset` mints metadata from a filename
 * plus the file's MD5 and hands back a pre-signed S3 form; the bytes then go to
 * S3 as multipart/form-data. Webflow content-addresses on that MD5, so
 * re-running this script is idempotent for unchanged files.
 *
 *   node upload-assets.mjs              # upload anything missing, write asset-map.json
 *   node upload-assets.mjs --dry        # list what would be uploaded
 *
 * Output: asset-map.json  { "<filename>": { assetId, hostedUrl } }
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { callTool } from './wfmcp.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = '698111847e9608eb30ee21c6';
const ANY_PAGE = '6a724b6977f9b0019d2a03f8';
const DESIGN = path.resolve(HERE, '../../04-design/.tmp');
const PKGS = ['implant-landing-page', 'cosmetic-landing-page', 'thank-you-landing-page'];
const DRY = process.argv.includes('--dry');

/**
 * Every `assets/<file>` referenced by any package's index.html, excluding the
 * local JS/CSS (those become page custom code instead).
 *
 * Deliberately matches ANY attribute, not just src/href: the cosmetic page
 * carries five icons only as `data-icon="assets/icon-N.svg"` and swaps them
 * into src at runtime, so an src-only scan silently under-collects and the page
 * ships with five dead icon requests.
 */
function neededImages() {
  const want = new Set();
  for (const p of PKGS) {
    const html = fs.readFileSync(path.join(DESIGN, p, 'index.html'), 'utf8');
    for (const m of html.matchAll(/(["'])assets\/([^"'/]+)\1/g)) {
      if (!m[2].endsWith('.js') && !m[2].endsWith('.css')) want.add(m[2]);
    }
  }
  return [...want].sort();
}

function locate(file) {
  for (const p of PKGS) {
    const c = path.join(DESIGN, p, 'assets', file);
    if (fs.existsSync(c)) return c;
  }
  return null;
}

const md5 = (buf) => crypto.createHash('md5').update(buf).digest('hex');

/**
 * The MCP layer hands back `uploadDetails` with camelCased keys, but an S3
 * pre-signed POST is signed against the literal AWS field names — post the
 * camelCase versions and S3 answers 403 AccessDenied with no hint as to why.
 * Anything not listed here is already correctly named (acl, bucket, key, ...).
 */
const S3_FIELD = {
  xAmzAlgorithm: 'X-Amz-Algorithm',
  xAmzCredential: 'X-Amz-Credential',
  xAmzDate: 'X-Amz-Date',
  xAmzSignature: 'X-Amz-Signature',
  xAmzSecurityToken: 'X-Amz-Security-Token',
  policy: 'Policy',
  successActionStatus: 'success_action_status',
  contentType: 'Content-Type',
  cacheControl: 'cache-control',
};

async function main() {
  const files = neededImages();
  const map = fs.existsSync(path.join(HERE, 'asset-map.json'))
    ? JSON.parse(fs.readFileSync(path.join(HERE, 'asset-map.json'), 'utf8'))
    : {};

  console.log(`${files.length} images referenced across the three packages`);
  let uploaded = 0;
  let skipped = 0;

  for (const file of files) {
    if (map[file]?.hostedUrl) { skipped++; continue; }
    const local = locate(file);
    if (!local) { console.error(`  !! ${file} — not found in any package's assets/`); continue; }
    const bytes = fs.readFileSync(local);
    const hash = md5(bytes);

    if (DRY) { console.log(`  would upload ${file} (${bytes.length} bytes, md5 ${hash})`); continue; }

    // 1. metadata + pre-signed S3 form
    const { text } = await callTool('data_assets_tool', {
      context: 'Uploading landing page design images to the site asset library so the built pages do not reference dead relative paths.',
      actions: [{ label: `create ${file}`, create_asset: { site_id: SITE, file_name: file, file_hash: hash } }],
    });
    const created = JSON.parse(text).result;
    const { uploadUrl, uploadDetails, id, hostedUrl } = created;

    // 2. bytes to S3 (skipped when Webflow already had this exact hash)
    if (uploadUrl && uploadDetails) {
      const form = new FormData();
      for (const [k, v] of Object.entries(uploadDetails)) {
        if (v == null) continue;
        form.append(S3_FIELD[k] ?? k, String(v));
      }
      // S3 requires the file part LAST — everything after it is ignored.
      form.append('file', new Blob([bytes], { type: uploadDetails.contentType || 'application/octet-stream' }), file);
      const r = await fetch(uploadUrl, { method: 'POST', body: form });
      if (!r.ok) throw new Error(`S3 upload failed for ${file}: ${r.status} ${(await r.text()).slice(0, 300)}`);
    }

    map[file] = { assetId: id, hostedUrl };
    uploaded++;
    console.log(`  ok ${file.padEnd(24)} ${String(bytes.length).padStart(8)}B  ${hostedUrl}`);
    fs.writeFileSync(path.join(HERE, 'asset-map.json'), JSON.stringify(map, null, 1));
  }

  if (!DRY) {
    fs.writeFileSync(path.join(HERE, 'asset-map.json'), JSON.stringify(map, null, 1));
    const missing = files.filter((f) => !map[f]?.hostedUrl);
    console.log(`\nuploaded ${uploaded}, already mapped ${skipped}, still missing ${missing.length}`);
    if (missing.length) { console.error('MISSING: ' + missing.join(', ')); process.exitCode = 1; }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
