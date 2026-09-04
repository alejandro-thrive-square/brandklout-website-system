// npm postinstall -> scripts/sparsify-worktree.sh
//
// Orca's per-repo setup hook for this repo is `npm install`, which is how a
// newly created worktree gets narrowed to one client. Two Windows facts make
// the obvious one-liner ("bash scripts/sparsify-worktree.sh || true") wrong:
//
//   1. npm runs scripts through cmd.exe, where `|| true` is not a shell
//      construct — cmd reports `"true" no se reconoce como un comando`.
//   2. `bash` on PATH under cmd.exe resolves to the WSL stub in WindowsApps
//      before Git Bash, and WSL sees a different filesystem, so the script
//      failed with "not inside a git repository".
//
// So: locate a real Git Bash, run the script through it, and never fail the
// install — a worktree that stayed full is a nuisance, a broken setup hook is
// a blocked agent.

const { spawnSync, execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const script = path.join(__dirname, "sparsify-worktree.sh");

function findBash() {
  if (process.platform !== "win32") return "bash";

  const candidates = [];
  // git.exe lives in <git>/cmd or <git>/bin; bash.exe is its sibling in <git>/bin.
  try {
    const gitExe = execFileSync("where", ["git"], { encoding: "utf8" })
      .split(/\r?\n/)
      .find((line) => line.trim().toLowerCase().endsWith("git.exe"));
    if (gitExe) {
      const gitRoot = path.dirname(path.dirname(gitExe.trim()));
      candidates.push(path.join(gitRoot, "bin", "bash.exe"));
    }
  } catch {
    // `where` missing or git not on PATH; the fixed paths below still apply.
  }
  candidates.push(
    "C:\Program Files\Git\bin\bash.exe",
    "C:\Program Files (x86)\Git\bin\bash.exe",
  );

  return candidates.find((c) => fs.existsSync(c)) || null;
}

const bash = findBash();
if (!bash) {
  console.log(
    "postinstall: no Git Bash found — skipping the worktree narrowing.\n" +
      "  Run it by hand from Git Bash:  bash scripts/sparsify-worktree.sh",
  );
  process.exit(0);
}

const result = spawnSync(bash, [script], { stdio: "inherit" });
if (result.error) {
  console.log(`postinstall: could not run ${script} (${result.error.message}) — skipped.`);
}
// Always succeed. The narrowing is a convenience, not a precondition.
process.exit(0);
