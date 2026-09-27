/**
 * Step 3 of the Instatic import: install `container-convert.ts` into the
 * running container and run it there.
 *
 *   node run-convert.mjs
 *
 * The conversion has to happen INSIDE the container because it uses Instatic's
 * own `@core/htmlImport` - the same importer the editor's `site_insert_html`
 * calls - so the node graphs come out correct by construction instead of being
 * reverse-engineered out here.
 *
 * It MUST be written to /app and run from /app: the `@core/*` and `@modules/*`
 * aliases resolve against /app/tsconfig.json, so the same file in /tmp fails
 * with "Cannot find module '@core/htmlImport'".
 *
 * The parent practice did this step by hand, pasting a base64 blob into a
 * shell. That is worth automating for one reason beyond convenience: the
 * script is ~8 KB base64 and `railway ssh` truncates a command line past
 * roughly 10 KB SILENTLY, so a hand-pasted blob is one edit away from
 * arriving corrupt and failing in a way that looks like a code bug. Chunked
 * and sha-verified, same as the payload.
 *
 * /app is ephemeral - a redeploy erases it - so this re-installs every run
 * rather than checking whether the file is already there.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { ssh } from "./railway-ssh.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CHUNK = 7000;
const REMOTE = "/app/mpk-convertall.ts";

const src = fs.readFileSync(path.join(HERE, "container-convert.ts"));
const b64 = src.toString("base64");
const sha = crypto.createHash("sha256").update(src).digest("hex");
console.log(`container-convert.ts: ${src.length} bytes, ${b64.length} base64`);

const chunks = [];
for (let i = 0; i < b64.length; i += CHUNK) chunks.push(b64.slice(i, i + CHUNK));
console.log(`${chunks.length} chunk(s)`);

ssh(`rm -rf /tmp/mpkconv ${REMOTE} && mkdir -p /tmp/mpkconv`);
for (let i = 0; i < chunks.length; i++) {
  const n = String(i).padStart(4, "0");
  ssh(`printf '%s' '${chunks[i]}' > /tmp/mpkconv/${n}`);
}
ssh(`cat /tmp/mpkconv/* | base64 -d > ${REMOTE}`);

const remoteSha = ssh(`sha256sum ${REMOTE} | cut -d' ' -f1`).trim().split(/\s+/).pop();
console.log(`local  sha ${sha}`);
console.log(`remote sha ${remoteSha}`);
if (remoteSha !== sha) {
  console.error("MISMATCH - the converter did not arrive intact. Not running it.");
  process.exit(1);
}
console.log("converter installed intact\n");

/* bun's own output is the record of what converted and what failed, so it is
   passed through verbatim rather than summarised. */
console.log(ssh(`cd /app && bun run ${REMOTE} 2>&1`, 2));
console.log(`\nnext: node fetch-nodes.mjs`);
