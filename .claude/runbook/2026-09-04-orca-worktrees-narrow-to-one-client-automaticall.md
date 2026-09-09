## 2026-09-04 — Orca worktrees narrow to one client automatically (`7fb5ed13` + follow-up)

A worktree created from the **Orca app** is a plain `git worktree add`, so it landed with all
thirteen Brandklout client folders visible — the duplication that makes it impossible to tell which
client a workspace is for. `scripts/new-client-worktree.sh` already solved this, but only for
worktrees created from the command line.

### Done

- `scripts/sparsify-worktree.sh` — narrows an **existing** worktree (cone: `deliver/process`, the
  pillar's `docs/` + `scripts/`, the client, `scripts`, `mcp-servers`, `.claude`; root files come
  free in cone mode). `--client`, `--add`, `--force`, `--undo`, `--dry-run`.
- `package.json` gained `postinstall` → `scripts/postinstall.js`. Orca's per-repo setup hook for this
  repo is `npm install`, so this fires on every worktree Orca creates. **No Orca-side config.**
- **All thirteen worktrees are narrowed.** `bk-ifa-dentistry` needed
  `--client institute-for-advanced-dentistry`. `bk-dr-nahlah`, `bk-legacy-dental` and
  `bk-mason-park` first tripped the dirty-tree guard, then went through with `--force` once every
  changed path was confirmed to sit inside the client being kept (94 / 2 / 110 uncommitted changes,
  all still present afterwards).
- Verified end to end: created a throwaway Orca worktree, ran `npm install` in it, watched it narrow
  to `livewell-dental`, removed it.

### Next

- Push. The commits are on local `main` only.
- `core.hooksPath` is unset — see the gotcha below; `bash scripts/bootstrap.sh` fixes it.

### Gotchas

- **Orca prefixes the branch with the git username**: `alejandro-thrive-square/bk-livewell`, not
  `bk-livewell`. Stripping a leading `bk-` therefore matched nothing, and **every** Orca-created
  worktree fell through to the no-client path. Derivation now tries the worktree **directory** name
  first (exactly what was typed into Orca), then the branch's last path segment.
  `scripts/hooks/post-checkout` had the identical bug — asset seeding never fired for an Orca
  worktree. Fixed there too; keep the two derivations in step.
- **`core.hooksPath` is currently unset in this repo**, so `scripts/hooks/post-checkout` does not run
  at all. `bash scripts/bootstrap.sh` sets it. Until then a new worktree gets narrowed but **not**
  asset-seeded — designs will render with broken images.
- **npm runs scripts through cmd.exe on Windows.** `bash x.sh || true` fails twice over: `|| true`
  is not a cmd construct, and `bash` on PATH under cmd resolves to the **WSL stub** in WindowsApps
  before Git Bash, which reports "not inside a git repository". Hence the Node wrapper.
- **`where git` answers `<git>/mingw64/bin/git.exe` first**, and that sibling `bin/` holds no
  `bash.exe`. The real one is `<git-root>/bin/bash.exe`; the wrapper climbs to the root.
- **Writing `postinstall.js` through a bash heredoc silently halved its backslashes**, so
  `"C:\Program Files\Git\bin\bash.exe"` became a string containing a backspace and
  `existsSync` was false. All Windows paths in that file are forward slashes now, which Windows
  accepts and no heredoc can mangle. Same family as the `.mjs` heredoc trap already recorded.
- **The first leftover-detection pass told the user to `rm -rf deliver/process/*`.** It globbed
  `deliver/*/*/` and did not check membership in the cone, so every process module read as an
  orphan. It now skips anything inside — or an ancestor of — a cone entry. Nobody ran the command.
- **A dirty worktree is still narrowable when the changes sit inside the client you keep** — that
  is what `--force` is for, and cone mode always keeps repo-root files, so a modified
  `SYSTEM_RULES.md` or `.env.example` is never at risk. Check first:
  list the changed paths and confirm none falls outside the planned cone. Git leaves modified
  out-of-cone files on disk with "not up to date and were left despite sparse patterns" rather than
  discarding them, but do not rely on that as the safety net.
- **Use `git sparse-checkout set --cone`, never `init --cone` then `set`.** The split version passes
  through a root-only cone first: it strips the whole tree, warns that directories the real cone
  *keeps* (`deliver/process/`, the client's own `workflows/`) "contain untracked files, but are not
  in the sparse-checkout cone", then puts everything back. The warnings are pure noise from the
  intermediate state and read like a failure. One step, no warnings.
- Sparse-checkout removes **tracked** files only. Mirrored assets are git-ignored, so other clients
  can persist as asset-only directories; the script lists them and prints the `rm -rf` but never
  deletes.
