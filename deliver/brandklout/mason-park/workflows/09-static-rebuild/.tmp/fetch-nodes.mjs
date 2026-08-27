/**
 * Pull the converted node graphs back out of the container.
 *
 *   node fetch-nodes.mjs
 *
 * Output goes over ssh stdout, which has no command-line length limit, but a
 * single 2 MB read is fragile - `railway ssh` intermittently answers "error
 * decoding response body". So the file is split remotely and fetched part by
 * part with retries, then checked against the remote sha256.
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROJECT = "e4a73ef0-64a3-48e5-b3c3-b2ea60737acc";
const ENVIRONMENT = "f2bfcbee-c7c9-48be-b404-cc43937d30a2";
const SERVICE = "8a9bb8d3-ed09-418d-9a67-b5c8bf0f19fb";
const PART = 200000;

const shq = (s) => `'${String(s).replace(/'/g, `'\\''`)}'`;
const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
const ssh = (cmd, tries = 5) => {
  let last;
  for (let i = 1; i <= tries; i++) {
    try {
      return execFileSync("bash",
        ["-c", `railway ssh -p ${PROJECT} -e ${ENVIRONMENT} -s ${SERVICE} ${shq(cmd)}`],
        { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
    } catch (e) { last = e; if (i < tries) sleep(1000 * i); }
  }
  throw last;
};

const remoteSha = ssh("sha256sum /tmp/nodes.b64").trim().split(/\s+/)[0];
const total = Number(ssh("wc -c < /tmp/nodes.b64").trim().split(/\s+/).pop());
const parts = Math.ceil(total / PART);
console.log(`remote ${total} bytes, sha ${remoteSha}, ${parts} parts`);

ssh(`rm -rf /tmp/mpout && mkdir -p /tmp/mpout && split -b ${PART} -a 4 -d /tmp/nodes.b64 /tmp/mpout/p`);

let b64 = "";
for (let i = 0; i < parts; i++) {
  const n = String(i).padStart(4, "0");
  // `cat` alone can pick up a trailing newline from the transport; strip CR/LF,
  // which cannot appear inside base64 anyway.
  const chunk = ssh(`cat /tmp/mpout/p${n}`).replace(/[\r\n]/g, "");
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
ssh("rm -rf /tmp/mpout");
