/**
 * Step 2 of the Instatic import: push the exported pages into the container as
 * one gzipped+base64 file, in chunks.
 *
 *   node ship-payload.mjs
 *
 * `railway ssh` takes its payload on the command line and fails SILENTLY past
 * roughly 10 KB, so the transfer is chunked and then verified by comparing a
 * sha256 computed on both sides. Without that check a truncated payload looks
 * exactly like a successful one until the converter produces nonsense.
 *
 * Run `to-instatic.mjs --media instatic-media-map.json --lean` FIRST. This
 * ships `instatic/pages/*.json` as they are on disk, so if the media pass has
 * not run, what lands in the container still points at local `/assets/` paths
 * and every image on the imported site is broken.
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { ssh } from "./railway-ssh.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CHUNK = 7000;

const pagesDir = path.join(HERE, "instatic", "pages");
const pages = fs.readdirSync(pagesDir)
  .map((f) => JSON.parse(fs.readFileSync(path.join(pagesDir, f), "utf8")))
  .map(({ slug, title, description, html }) => ({ slug, title, description, html }));

/* Cheap guard against shipping the pre-media pass by mistake - the failure is
   invisible until the pages are live and every image is a broken icon. */
const stillLocal = pages.filter((p) => p.html.includes("/assets/"));
if (stillLocal.length) {
  console.error(`${stillLocal.length} page(s) still reference /assets/ - the --media pass has not run.`);
  console.error(`Run: node push-media.mjs && node to-instatic.mjs --media instatic-media-map.json --lean`);
  process.exit(1);
}

const payload = Buffer.from(JSON.stringify(pages));
const b64 = zlib.gzipSync(payload, { level: 9 }).toString("base64");
const sha = crypto.createHash("sha256").update(b64).digest("hex");

console.log(`${pages.length} pages -> ${(payload.length / 1024).toFixed(0)} KB raw, ${(b64.length / 1024).toFixed(0)} KB base64`);
const chunks = [];
for (let i = 0; i < b64.length; i += CHUNK) chunks.push(b64.slice(i, i + CHUNK));
console.log(`${chunks.length} chunks of <=${CHUNK} bytes`);

ssh("rm -rf /tmp/mpkparts /tmp/payload.b64 && mkdir -p /tmp/mpkparts");
for (let i = 0; i < chunks.length; i++) {
  // printf '%s' avoids echo's newline, which would corrupt the base64 stream.
  // Zero-padded so the concatenating glob stays in order past part 9, and one
  // file per chunk so a transport retry overwrites instead of duplicating.
  const n = String(i).padStart(4, "0");
  ssh(`printf '%s' '${chunks[i]}' > /tmp/mpkparts/${n}`);
  if ((i + 1) % 10 === 0 || i === chunks.length - 1) console.log(`  ${i + 1}/${chunks.length}`);
}
ssh("cat /tmp/mpkparts/* > /tmp/payload.b64");

const remote = ssh("sha256sum /tmp/payload.b64 | cut -d' ' -f1").trim().split(/\s+/).pop();
const size = ssh("wc -c < /tmp/payload.b64").trim().split(/\s+/).pop();
console.log(`local  sha ${sha}`);
console.log(`remote sha ${remote}  (${size} bytes, expected ${b64.length})`);
if (remote !== sha) {
  console.error("MISMATCH - the payload did not arrive intact. Do not run the converter.");
  process.exit(1);
}
console.log("payload verified intact");
console.log(`\nnext: base64 -w0 container-convert.ts, then via railway ssh:`);
console.log(`  echo <b64> | base64 -d > /app/mpk-convertall.ts && cd /app && bun run /app/mpk-convertall.ts`);
