/**
 * Convert the six landing pages to Instatic node graphs, inside the container.
 *
 *   node ship-convert-fetch.mjs
 *
 * Output: converted-pages.json (gitignored)
 *
 * Instatic stores a page as a node tree, not HTML, and the tool that turns HTML
 * into nodes is an MCP `site_*` tool that proxies to a live browser editor.
 * Calling Instatic's own importer inside the container is what makes this
 * headless - the whole reason the main-site import worked. See
 * 09-static-rebuild/.tmp/container-convert.ts for the two bun/happy-dom
 * workarounds that make it run at all.
 *
 * The converter is GENERATED from that file rather than copied, so the
 * happy-dom selector shim has exactly one source. Only the two temp paths are
 * rewritten, onto `lp-` names so a landing-page run can never collide with a
 * main-site run's artifacts inside the container.
 *
 * `railway ssh` constraints, all learned the hard way on the main-site import:
 *   - it fails SILENTLY past roughly 10 KB of command line, so writes are chunked
 *   - it intermittently reports a transport error for a command that DID run, so
 *     each chunk goes to its own numbered file (a retry overwrites rather than
 *     appends) and both directions are sha256-verified
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const NINE = path.join(HERE, "..", "..", "09-static-rebuild", ".tmp");

const PROJECT = "e4a73ef0-64a3-48e5-b3c3-b2ea60737acc";
const ENVIRONMENT = "f2bfcbee-c7c9-48be-b404-cc43937d30a2";
const SERVICE = "8a9bb8d3-ed09-418d-9a67-b5c8bf0f19fb";
const CHUNK = 7000;
const PART = 200000;

const PAYLOAD = "/tmp/lp-payload.b64";
const NODES = "/tmp/lp-nodes.b64";
const PARTS = "/tmp/lpparts";
const SCRIPT = "/app/mp-lp-convert.ts";

// Go through bash, not cmd.exe: `railway` on PATH is a .cmd shim and cmd.exe
// mangles the single-quoted payload.
const shq = (s) => `'${String(s).replace(/'/g, `'\\''`)}'`;
const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
const sshOnce = (cmd) => execFileSync(
  "bash",
  ["-c", `railway ssh -p ${PROJECT} -e ${ENVIRONMENT} -s ${SERVICE} ${shq(cmd)}`],
  { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
);
const ssh = (cmd, tries = 5) => {
  let last;
  for (let i = 1; i <= tries; i++) {
    try { return sshOnce(cmd); } catch (e) { last = e; if (i < tries) sleep(1000 * i); }
  }
  throw last;
};

/** Chunked, order-safe, sha-verified write of a base64 string to a remote path. */
function shipB64(b64, remotePath, label) {
  const sha = crypto.createHash("sha256").update(b64).digest("hex");
  const chunks = [];
  for (let i = 0; i < b64.length; i += CHUNK) chunks.push(b64.slice(i, i + CHUNK));
  console.log(`${label}: ${(b64.length / 1024).toFixed(0)} KB base64 in ${chunks.length} chunks`);

  ssh(`rm -rf ${PARTS} ${remotePath} && mkdir -p ${PARTS}`);
  for (let i = 0; i < chunks.length; i++) {
    // printf '%s' avoids echo's newline, which would corrupt the base64 stream.
    // Zero-padded so the concatenating glob stays in order past part 9.
    ssh(`printf '%s' '${chunks[i]}' > ${PARTS}/${String(i).padStart(4, "0")}`);
    if ((i + 1) % 10 === 0 || i === chunks.length - 1) console.log(`  ${i + 1}/${chunks.length}`);
  }
  ssh(`cat ${PARTS}/* > ${remotePath} && rm -rf ${PARTS}`);

  const remote = ssh(`sha256sum ${remotePath} | cut -d' ' -f1`).trim().split(/\s+/).pop();
  if (remote !== sha) {
    console.error(`MISMATCH on ${remotePath}\n  local  ${sha}\n  remote ${remote}`);
    process.exit(1);
  }
  console.log(`  verified intact (${sha.slice(0, 16)}...)`);
}

// ------------------------------------------------------------ 1. the pages

const pages = fs.readdirSync(path.join(HERE, "out", "pages"))
  .map((f) => JSON.parse(fs.readFileSync(path.join(HERE, "out", "pages", f), "utf8")))
  .map(({ slug, title, description, html }) => ({ slug, title, description, html }));
const raw = Buffer.from(JSON.stringify(pages));
console.log(`${pages.length} pages, ${(raw.length / 1024).toFixed(0)} KB raw`);
shipB64(zlib.gzipSync(raw, { level: 9 }).toString("base64"), PAYLOAD, "payload");

// -------------------------------------------------------- 2. the converter

const src = fs.readFileSync(path.join(NINE, "container-convert.ts"), "utf8");
if (!src.includes("/tmp/payload.b64") || !src.includes("/tmp/nodes.b64")) {
  console.error("container-convert.ts no longer uses the expected temp paths - check it before re-running.");
  process.exit(1);
}
const converter = src
  .replaceAll("/tmp/payload.b64", PAYLOAD)
  .replaceAll("/tmp/nodes.b64", NODES);
shipB64(Buffer.from(converter, "utf8").toString("base64"), `${SCRIPT}.b64`, "converter");
// It MUST live in and run from /app: the `@core/*` aliases resolve against
// /app/tsconfig.json, so the same file under /tmp fails to import htmlImport.
ssh(`base64 -d ${SCRIPT}.b64 > ${SCRIPT} && rm -f ${SCRIPT}.b64 && wc -c ${SCRIPT}`);

// ------------------------------------------------------------- 3. converting

console.log("\nrunning the converter in /app (this takes a minute)...");
const log = ssh(`cd /app && bun run ${SCRIPT} 2>&1`, 2);
console.log(log.trim().split("\n").map((l) => `  ${l}`).join("\n"));
if (!log.includes("RESULT")) {
  console.error("the converter did not report a RESULT line - stopping.");
  process.exit(1);
}

// ----------------------------------------------------------- 4. fetching back

const remoteSha = ssh(`sha256sum ${NODES} | cut -d' ' -f1`).trim().split(/\s+/).pop();
const size = Number(ssh(`wc -c < ${NODES}`).trim().split(/\s+/).pop());
console.log(`\nnodes: ${(size / 1024).toFixed(0)} KB base64, sha ${remoteSha.slice(0, 16)}...`);

let got = "";
for (let off = 0; off < size; off += PART) {
  const n = Math.min(PART, size - off);
  got += ssh(`dd if=${NODES} bs=1 skip=${off} count=${n} 2>/dev/null`).trim();
  console.log(`  ${Math.min(off + PART, size)}/${size}`);
}
const localSha = crypto.createHash("sha256").update(got).digest("hex");
if (localSha !== remoteSha) {
  console.error(`MISMATCH fetching nodes\n  remote ${remoteSha}\n  local  ${localSha}`);
  process.exit(1);
}

const converted = JSON.parse(zlib.gunzipSync(Buffer.from(got, "base64")).toString("utf8"));
fs.writeFileSync(path.join(HERE, "converted-pages.json"), JSON.stringify(converted, null, 2));
console.log(`\nconverted-pages.json: ${converted.length} pages, `
  + `${converted.reduce((a, p) => a + p.nodeCount, 0)} nodes total`);
for (const p of converted) {
  console.log(`  ${p.slug.padEnd(34)} ${String(p.nodeCount).padStart(5)} nodes`
    + `  styleCss ${p.styleCss.length}b  stripped ${(p.stripped ?? []).length}`);
}
