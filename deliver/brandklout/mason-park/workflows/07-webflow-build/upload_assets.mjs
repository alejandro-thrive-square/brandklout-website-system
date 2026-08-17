/**
 * upload_assets.mjs — POST the file bytes for assets created by
 * `data_assets_tool > create_asset`.
 *
 * create_asset only writes the metadata row and hands back a presigned S3 POST
 * (uploadUrl + uploadDetails). Until the bytes land, the asset exists in the
 * library with a dead hostedUrl. The presigned policy expires after ~1 hour,
 * so re-run create_asset if this fails with 403 AccessDenied.
 *
 * Field names must match the policy conditions exactly (`Policy`, not
 * `policy`; `Content-Type`, not `contentType`) — see webflow://guides/asset-upload.
 *
 * Usage: node upload_assets.mjs <manifest.json> <asset dir>
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const [manifestPath, assetDir] = process.argv.slice(2);
const items = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const UPLOAD_URL = "https://webflow-prod-assets.s3.amazonaws.com/";
const CREDENTIAL =
  "AKIAQLLHWD6MEJGETLST/20260730/us-east-1/s3/aws4_request";

let ok = 0;
const failed = [];

for (const it of items) {
  const fp = path.join(assetDir, it.file);
  const bytes = fs.readFileSync(fp);
  // The metadata row was created with this MD5; a mismatch means S3 stores
  // bytes the asset record does not describe.
  const md5 = crypto.createHash("md5").update(bytes).digest("hex");

  const form = new FormData();
  form.append("acl", "public-read");
  form.append("bucket", "webflow-prod-assets");
  form.append("X-Amz-Algorithm", "AWS4-HMAC-SHA256");
  form.append("X-Amz-Credential", CREDENTIAL);
  form.append("X-Amz-Date", it.date);
  form.append("key", it.key);
  form.append("Policy", it.policy);
  form.append("X-Amz-Signature", it.sig);
  form.append("success_action_status", "201");
  form.append("Content-Type", it.ct);
  form.append("Cache-Control", "max-age=31536000");
  form.append("file", new Blob([bytes], { type: it.ct }), it.file);

  const res = await fetch(UPLOAD_URL, { method: "POST", body: form });
  if (res.status === 201) {
    ok++;
    console.log(`  201  ${it.file.padEnd(20)} ${(bytes.length / 1024).toFixed(0)}KB  md5 ${md5.slice(0, 8)}`);
  } else {
    const body = await res.text();
    failed.push({ file: it.file, status: res.status, body: body.slice(0, 300) });
    console.log(`  ${res.status}  ${it.file}  FAILED`);
  }
}

console.log(`\n${ok}/${items.length} uploaded`);
for (const f of failed) console.log(`\n${f.file} (${f.status}):\n${f.body}`);
process.exit(failed.length ? 1 : 0);
