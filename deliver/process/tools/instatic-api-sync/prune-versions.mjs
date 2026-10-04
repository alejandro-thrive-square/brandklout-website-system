#!/usr/bin/env node
/**
 * Prune Instatic's published version history and reclaim the Railway volume.
 *
 * Instatic writes a full site snapshot plus a complete copy of every runtime
 * asset on EVERY publish, and never garbage-collects them. A publish costs
 * ~15 MB across the site; the volume is 879 MB. Near full, writes fail SILENTLY
 * - no 5xx, no error - which is what makes this urgent rather than tidy.
 *
 *   node prune-versions.mjs            # report only
 *   node prune-versions.mjs --keep 3   # dry run of the prune
 *   node prune-versions.mjs --keep 3 --apply
 *
 * --apply deletes version history permanently and RESTARTS the service. Page
 * content is untouched: every row keeps its active version. What is lost is the
 * ability to roll back to an older publish from the platform UI.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const KEEP = Number(args[args.indexOf("--keep") + 1]) || 3;
const HEADROOM = 8 * 1024 * 1024; // never fill the volume to the brim

// On Windows `railway` on PATH is only a .cmd shim, and Node refuses to spawn
// .cmd without a shell - so reach for the real binary npm unpacked beside it.
const RAILWAY = (() => {
  const candidates = [
    process.env.RAILWAY_BIN,
    process.platform === "win32" && process.env.APPDATA
      ? join(process.env.APPDATA, "npm/node_modules/@railway/cli/bin/railway.exe")
      : null,
  ].filter(Boolean);
  return candidates.find((c) => existsSync(c)) ?? "railway";
})();
// Addressed explicitly rather than through `railway link`, which is per-directory
// global state a fresh clone will not have.
const TARGET = [
  "-p", process.env.INSTATIC_RAILWAY_PROJECT ?? "2536e8b9-026a-4a55-b0da-5dbb2eb8b6c5",
  "-s", process.env.INSTATIC_RAILWAY_SERVICE ?? "Dr Nahlah",
  "-e", process.env.INSTATIC_RAILWAY_ENV ?? "production",
];

const railway = (argv, opts = {}) =>
  execFileSync(RAILWAY, argv, {
    cwd: HERE, encoding: "utf8", maxBuffer: 64 * 1024 * 1024, timeout: 600_000, ...opts,
  });

const sh = (script, { quiet = false } = {}) => {
  const out = railway(["ssh", ...TARGET, script]);
  const body = out.replace(/^Using SSH key from file .*\n/, "");
  if (!quiet) process.stdout.write(body);
  return body;
};

const ship = (localFile, remote) => {
  const b64 = readFileSync(join(HERE, localFile)).toString("base64");
  sh(`echo ${b64} | base64 -d > ${remote}`, { quiet: true });
};

const freeBytes = () => {
  const out = sh(`df -B1 --output=avail /app/storage | tail -1`, { quiet: true });
  return Number(out.trim());
};

console.log(`--- volume ---`);
sh(`df -h /app/storage; ls -la /app/storage/data`);

ship("prune-versions.container.ts", "/tmp/prune.ts");
console.log(`\n--- prune (keep ${KEEP}) ---`);
const report = sh(`SQLITE_TMPDIR=/tmp TMPDIR=/tmp bun run /tmp/prune.ts ${KEEP}${APPLY ? " --apply" : ""}`);

if (!APPLY) process.exit(0);
if (!/every published row still has its active version/.test(report)) {
  console.error("\nprune did not reach the safety check - NOT swapping. Nothing was replaced.");
  process.exit(1);
}

// The swap. Two traps, both hit live on 2026-08-21:
//
//  1. `rm cms.db` frees NOTHING while the server has the file open - the inode
//     survives until the process exits. So the free-space check must assume the
//     old database is still occupying its full size, and the copy has to fit
//     ALONGSIDE it.
//  2. Consequently, never rm before the copy succeeds. Copy to a new name first;
//     a failure then leaves the original untouched and serving.
const staged = "/tmp/cms-compact.db";
const size = Number(sh(`stat -c %s ${staged}`, { quiet: true }).trim());
const avail = freeBytes();
console.log(`\nstaged ${(size / 1048576).toFixed(1)} MB, volume has ${(avail / 1048576).toFixed(1)} MB free`);

if (size + HEADROOM > avail) {
  console.error(
    `\nNot enough room to stage the swap alongside the live file.\n` +
    `Re-run with a smaller --keep (the compacted size falls roughly linearly with it).\n` +
    `Do NOT delete cms.db to make room: the running server holds the inode, so the\n` +
    `space does not come back until it restarts - and the staged copy is on /tmp,\n` +
    `which a restart wipes.`);
  process.exit(1);
}

sh(`set -e
cp ${staged} /app/storage/data/cms.db.new
chown root:root /app/storage/data/cms.db.new; chmod 644 /app/storage/data/cms.db.new
bun -e 'const {Database}=require("bun:sqlite");const d=new Database("/app/storage/data/cms.db.new",{readonly:true});const r=d.query("PRAGMA integrity_check").get().integrity_check;if(r!=="ok"){console.error("staged db failed integrity:",r);process.exit(1)}console.log("staged db integrity: ok")'
rm -f /app/storage/data/cms.db /app/storage/data/cms.db-wal /app/storage/data/cms.db-shm
mv /app/storage/data/cms.db.new /app/storage/data/cms.db
sync
echo "--- swapped ---"; ls -la /app/storage/data`);

// The old inode is only released when the process exits, so the restart is what
// actually reclaims the disk. Plain redeploy - NOT --from-source, which would
// re-pull :latest and could land a different Instatic build than the one this
// site was built and verified against.
console.log(`\n--- restarting service ---`);
railway(["redeploy", "-y", ...TARGET], { stdio: "inherit" });

console.log(`\nRestarted. Verify before you walk away:`);
console.log(`  curl -s -o /dev/null -w '%{http_code}\n' https://encorercm.com/`);
console.log(`  node ../instatic-site/gates/compare-live.mjs index   # content parity against the local build`);
console.log(`  node prune-versions.mjs               # confirm the reclaimed volume`);
