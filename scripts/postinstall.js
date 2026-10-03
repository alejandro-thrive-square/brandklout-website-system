// npm postinstall -> scripts/sparsify-worktree.sh
//
// Orca's per-repo setup hook for this repo is `npm install`, which is how a
// newly created worktree gets narrowed to one client. Three Windows facts make
// the obvious one-liner ("bash scripts/sparsify-worktree.sh || true") wrong:
//
//   1. npm runs scripts through cmd.exe, where `|| true` is not a shell
//      construct — cmd reports `"true" no se reconoce como un comando`.
//   2. `bash` on PATH under cmd.exe resolves to the WSL stub in WindowsApps
//      before Git Bash, and WSL sees a different filesystem, so the script
//      failed with "not inside a git repository".
//   3. `where git` answers <git>/mingw64/bin/git.exe first, whose sibling bin/
//      holds no bash.exe — the real one is under the Git install ROOT.
//
// Paths here are written with FORWARD slashes on purpose. Windows accepts them,
// and this file is regularly rewritten through a bash heredoc, which halves
// backslashes: "C:\Program Files\Git\bin\bash.exe" silently became a string
// containing a backspace character.
//
// Never fail the install: a worktree that stayed full is a nuisance, a broken
// setup hook is a blocked agent.

const { spawnSync, execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const script = path.join(__dirname, "sparsify-worktree.sh");

function findBash() {
  if (process.platform !== "win32") return "bash";

  const candidates = [];
  try {
    const roots = execFileSync("where", ["git"], { encoding: "utf8" })
      .split(/\r?\n/)
      .filter((line) => line.trim().toLowerCase().endsWith("git.exe"))
      // <git>/cmd/git.exe and <git>/mingw64/bin/git.exe both sit under the
      // install root; walk up until a bin/bash.exe appears.
      .map((line) => path.dirname(line.trim()));
    for (const dir of roots) {
      for (let up = dir; up !== path.dirname(up); up = path.dirname(up)) {
        candidates.push(path.join(up, "bin", "bash.exe"));
      }
    }
  } catch {
    // `where` missing or git not on PATH; the fixed paths below still apply.
  }
  candidates.push(
    "C:/Program Files/Git/bin/bash.exe",
    "C:/Program Files (x86)/Git/bin/bash.exe",
  );

  return candidates.find((c) => fs.existsSync(c)) || null;
}

// No early exit when bash is missing: the credential sync below is pure Node
// and must still run.
const bash = findBash();
if (!bash) {
  console.log(
    "postinstall: no Git Bash found — skipping the worktree narrowing.\n" +
      "  Run it by hand from Git Bash:  bash scripts/sparsify-worktree.sh",
  );
} else {
  const result = spawnSync(bash, [script], { stdio: "inherit" });
  if (result.error) {
    console.log(`postinstall: could not run ${script} (${result.error.message}) — skipped.`);
  }
}

// Resolve the master credential file into this worktree's .env. Runs in the
// MAIN worktree too, unlike the narrowing above — main gets [shared] only.
// Node, not bash, so it works even where findBash() came up empty.
const envSync = spawnSync(process.execPath, [path.join(__dirname, "env-sync.mjs")], {
  stdio: "inherit",
});
if (envSync.error) {
  console.log(`postinstall: could not run env-sync.mjs (${envSync.error.message}) — skipped.`);
}

// Rebuild the client's process mirror from the `main` ref. deliver/process is tracked on main
// only; a client worktree reads it through this untracked mirror. No-op on main.
const mirror = spawnSync(process.execPath, [path.join(__dirname, "scenario.mjs"), "sync", "--quiet"], {
  stdio: "inherit",
});
if (mirror.error) {
  console.log(`postinstall: could not run scenario.mjs sync (${mirror.error.message}) — skipped.`);
}

process.exit(0);
