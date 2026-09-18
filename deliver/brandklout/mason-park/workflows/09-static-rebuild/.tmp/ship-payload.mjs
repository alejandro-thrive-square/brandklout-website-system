/**
 * Push the exported pages into the Instatic container as one gzipped+base64
 * file, in chunks.
 *
 *   node ship-payload.mjs
 *
 * `railway ssh` takes its payload on the command line and fails SILENTLY past
 * roughly 10 KB, so the transfer is chunked and then verified by comparing a
 * sha256 computed on both sides. Without that check a truncated payload looks
 * exactly like a successful one until the converter produces nonsense.
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROJECT = "e4a73ef0-64a3-48e5-b3c3-b2ea60737acc";
// Which Railway ENVIRONMENT to convert in. Production is the default only
// because that is where this pipeline was first run; it is NOT the safe
// default. Staging is a full clone with its own volume, so a redesign should
// be converted and reviewed there first:
//   RAILWAY_ENV_NAME=staging node ship-payload.mjs
// Ids come from the railway CLI (railway environment) on project e4a73ef0-....
const ENVIRONMENTS = {
  production: "f2bfcbee-c7c9-48be-b404-cc43937d30a2",
  staging: "a05d3098-3049-452c-aea7-32b7e898c457",
};
const ENV_NAME = process.env.RAILWAY_ENV_NAME || "production";
const ENVIRONMENT = ENVIRONMENTS[ENV_NAME];
if (!ENVIRONMENT) throw new Error(`RAILWAY_ENV_NAME=${ENV_NAME} is not one of: ${Object.keys(ENVIRONMENTS).join(", ")}`);
console.log(`railway environment: ${ENV_NAME}`);
const SERVICE = "8a9bb8d3-ed09-418d-9a67-b5c8bf0f19fb";
const CHUNK = 7000;

// Go through bash, not cmd.exe: `railway` on PATH is a .cmd shim and cmd.exe
// mangles the single-quoted payload ("El sistema no puede encontrar la ruta").
const shq = (s) => `'${String(s).replace(/'/g, `'\\''`)}'`;
// On Windows, `bash` can resolve the npm shell shim even when Node is not
// installed inside WSL. Use Railway's bundled native executable directly in
// that case so the transport does not depend on a second Node installation.
const toWslPath = (p) => {
  const m = String(p).match(/^([A-Za-z]):[\\/](.*)$/);
  return m ? `/mnt/${m[1].toLowerCase()}/${m[2].replace(/\\/g, "/")}` : p;
};
const bundledRailway = process.env.APPDATA
  ? path.join(process.env.APPDATA, "npm", "node_modules", "@railway", "cli", "bin", "railway.exe")
  : "";
// WHICH bash answers depends on who is asking: from PowerShell it is WSL and
// the drive is /mnt/c; from a Git Bash session it is MSYS and the drive is /c.
// Assuming WSL failed with "No such file or directory" from Git Bash on
// 2026-09-18, so ask the bash we actually got which spelling it can execute.
const toMsysPath = (p) => {
  const m = String(p).match(/^([A-Za-z]):[\\/](.*)$/);
  return m ? `/${m[1].toLowerCase()}/${m[2].replace(/\\/g, "/")}` : p;
};
// MSYS rewrites anything that looks like a POSIX path before a native .exe
// sees it, which would turn the remote "/tmp/..." into a Windows temp path.
// Both switches are inert under WSL.
const BASH_ENV = { ...process.env, MSYS_NO_PATHCONV: "1", MSYS2_ARG_CONV_EXCL: "*" };
const runsInBash = (p) => {
  try {
    return execFileSync("bash", ["-c", `test -x ${shq(p)} && echo yes`], { encoding: "utf8", env: BASH_ENV }).trim() === "yes";
  } catch { return false; }
};
const bundledInBash = process.platform === "win32" && fs.existsSync(bundledRailway)
  ? [toWslPath(bundledRailway), toMsysPath(bundledRailway)].find(runsInBash)
  : null;
const railwayCommand = bundledInBash ? shq(bundledInBash) : "railway";
// `railway ssh` intermittently dies with "Failed to fetch: error decoding
// response body" - a transport hiccup, and the command may well have run. So
// every chunk is written to its OWN numbered file rather than appended: a
// retry then overwrites instead of duplicating, and the parts are concatenated
// in order at the end.
const sshOnce = (cmd) => execFileSync(
  "bash",
  ["-c", `${railwayCommand} ssh -p ${PROJECT} -e ${ENVIRONMENT} -s ${SERVICE} ${shq(cmd)}`],
  { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, env: BASH_ENV },
);
const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
const ssh = (cmd, tries = 5) => {
  let last;
  for (let i = 1; i <= tries; i++) {
    try { return sshOnce(cmd); } catch (e) {
      last = e;
      if (i < tries) sleep(1000 * i);
    }
  }
  throw last;
};

// `--dir <name>` ships a DIFFERENT folder under instatic/ instead of pages/.
// The blog template pages are converted in their own pass so the 49 static
// pages, already imported, are not re-shipped and re-converted to add two.
const di = process.argv.indexOf("--dir");
const DIR = di > -1 ? process.argv[di + 1] : "pages";
const pagesDir = path.join(HERE, "instatic", DIR);
console.log(`payload dir: instatic/${DIR}`);
const pages = fs.readdirSync(pagesDir)
  .map((f) => JSON.parse(fs.readFileSync(path.join(pagesDir, f), "utf8")))
  .map(({ slug, title, description, html }) => ({ slug, title, description, html }));

const payload = Buffer.from(JSON.stringify(pages));
const b64 = zlib.gzipSync(payload, { level: 9 }).toString("base64");
const sha = crypto.createHash("sha256").update(b64).digest("hex");

console.log(`${pages.length} pages -> ${(payload.length / 1024).toFixed(0)} KB raw, ${(b64.length / 1024).toFixed(0)} KB base64`);
const chunks = [];
for (let i = 0; i < b64.length; i += CHUNK) chunks.push(b64.slice(i, i + CHUNK));
console.log(`${chunks.length} chunks of <=${CHUNK} bytes`);

ssh("rm -rf /tmp/mpparts /tmp/payload.b64 && mkdir -p /tmp/mpparts");
for (let i = 0; i < chunks.length; i++) {
  // printf '%s' avoids echo's newline, which would corrupt the base64 stream.
  // Zero-padded so the concatenating glob stays in order past part 9.
  const n = String(i).padStart(4, "0");
  ssh(`printf '%s' '${chunks[i]}' > /tmp/mpparts/${n}`);
  if ((i + 1) % 10 === 0 || i === chunks.length - 1) console.log(`  ${i + 1}/${chunks.length}`);
}
ssh("cat /tmp/mpparts/* > /tmp/payload.b64");

const remote = ssh("sha256sum /tmp/payload.b64 | cut -d' ' -f1").trim().split(/\s+/).pop();
const size = ssh("wc -c < /tmp/payload.b64").trim().split(/\s+/).pop();
console.log(`local  sha ${sha}`);
console.log(`remote sha ${remote}  (${size} bytes, expected ${b64.length})`);
if (remote !== sha) {
  console.error("MISMATCH - the payload did not arrive intact. Do not run the converter.");
  process.exit(1);
}
console.log("payload verified intact");
