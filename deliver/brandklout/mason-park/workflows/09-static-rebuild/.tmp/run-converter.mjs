// Put container-convert.ts into the Instatic container and run it.
//
//   RAILWAY_ENV_NAME=staging node run-converter.mjs
//
// The converter is ~9 KB of base64 and `railway ssh` takes its payload on the
// command line, failing SILENTLY past roughly 10 KB -- the same trap
// ship-payload.mjs documents. So the file is chunked, reassembled and its
// sha256 compared on both sides before anything is executed. Running a
// truncated converter would produce plausible-looking nonsense.
//
// It MUST land in /app and run from /app: the `@core/*` and `@modules/*`
// aliases resolve against /app/tsconfig.json, so the identical file in /tmp
// dies with "Cannot find module '@core/htmlImport'".
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROJECT = "e4a73ef0-64a3-48e5-b3c3-b2ea60737acc";
const ENVIRONMENTS = {
  production: "f2bfcbee-c7c9-48be-b404-cc43937d30a2",
  staging: "a05d3098-3049-452c-aea7-32b7e898c457",
};
const ENV_NAME = process.env.RAILWAY_ENV_NAME || "staging";
const ENVIRONMENT = ENVIRONMENTS[ENV_NAME];
if (!ENVIRONMENT) throw new Error(`RAILWAY_ENV_NAME=${ENV_NAME} is not one of: ${Object.keys(ENVIRONMENTS).join(", ")}`);
const SERVICE = "8a9bb8d3-ed09-418d-9a67-b5c8bf0f19fb";
const CHUNK = 7000;

console.log(`railway environment: ${ENV_NAME}`);

const shq = (s) => `'${String(s).replace(/'/g, `'\\''`)}'`;
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
const sshOnce = (cmd) => execFileSync(
  "bash",
  ["-c", `${railwayCommand} ssh -p ${PROJECT} -e ${ENVIRONMENT} -s ${SERVICE} ${shq(cmd)}`],
  { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, env: BASH_ENV },
);
const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
const ssh = (cmd, tries = 5) => {
  let last;
  for (let i = 1; i <= tries; i++) {
    try { return sshOnce(cmd); } catch (e) { last = e; if (i < tries) sleep(1000 * i); }
  }
  throw last;
};

const src = fs.readFileSync(path.join(HERE, "container-convert.ts"));
const b64 = src.toString("base64");
const sha = crypto.createHash("sha256").update(b64).digest("hex");
const chunks = [];
for (let i = 0; i < b64.length; i += CHUNK) chunks.push(b64.slice(i, i + CHUNK));
console.log(`container-convert.ts ${src.length} bytes -> ${b64.length} base64 in ${chunks.length} chunks`);

ssh("rm -rf /tmp/mpconv && mkdir -p /tmp/mpconv");
for (let i = 0; i < chunks.length; i++) {
  ssh(`printf '%s' '${chunks[i]}' > /tmp/mpconv/${String(i).padStart(4, "0")}`);
}
ssh("cat /tmp/mpconv/* > /tmp/convert.b64");
const remote = ssh("sha256sum /tmp/convert.b64 | cut -d' ' -f1").trim().split(/\s+/).pop();
if (remote !== sha) {
  console.error(`MISMATCH local ${sha} remote ${remote} - refusing to run a truncated converter`);
  process.exit(1);
}
console.log("converter verified intact");

ssh("base64 -d /tmp/convert.b64 > /app/mp-convertall.ts");
console.log("running bun /app/mp-convertall.ts ...");
const out = ssh("cd /app && bun run /app/mp-convertall.ts 2>&1", 1);
console.log(out.split("\n").filter((l) => !/Using SSH key/.test(l)).join("\n"));
