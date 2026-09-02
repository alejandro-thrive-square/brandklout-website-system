/**
 * Step 4 of the Instatic import: pull the converted node graphs back out of
 * the container.
 *
 *   node fetch-nodes.mjs
 *
 * Output goes over ssh stdout, which has no command-line length limit, but a
 * single multi-MB read is fragile - `railway ssh` intermittently answers
 * "error decoding response body". So the file is split remotely and fetched
 * part by part with retries, then checked against the remote sha256.
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { ssh } from "./railway-ssh.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PART = 200000;

const remoteSha = ssh("sha256sum /tmp/nodes.b64").trim().split(/\s+/)[0];
const total = Number(ssh("wc -c < /tmp/nodes.b64").trim().split(/\s+/).pop());
const parts = Math.ceil(total / PART);
console.log(`remote ${total} bytes, sha ${remoteSha}, ${parts} parts`);

ssh(`rm -rf /tmp/mpkout && mkdir -p /tmp/mpkout && split -b ${PART} -a 4 -d /tmp/nodes.b64 /tmp/mpkout/p`);

let b64 = "";
for (let i = 0; i < parts; i++) {
  const n = String(i).padStart(4, "0");
  // `cat` alone can pick up a trailing newline from the transport; strip CR/LF,
  // which cannot appear inside base64 anyway.
  const chunk = ssh(`cat /tmp/mpkout/p${n}`).replace(/[\r\n]/g, "");
  b64 += chunk;
  if ((i + 1) % 4 === 0 || i === parts - 1) console.log(`  ${i + 1}/${parts}  (${b64.length}/${total})`);
}

const localSha = crypto.createHash("sha256").update(b64).digest("hex");
console.log(`local sha  ${localSha}`);
if (localSha !== remoteSha) {
  console.error(`MISMATCH: got ${b64.length} bytes, expected ${total}. Not writing.`);
  process.exit(1);
}

const json = zlib.gunzipSync(Buffer.from(b64, "base64")).toString("utf8");
const pages = JSON.parse(json);
fs.writeFileSync(path.join(HERE, "converted-pages.json"), JSON.stringify(pages, null, 1));
console.log(`verified intact -> converted-pages.json  (${pages.length} pages, ${(json.length / 1048576).toFixed(1)} MB)`);
ssh("rm -rf /tmp/mpkout");
