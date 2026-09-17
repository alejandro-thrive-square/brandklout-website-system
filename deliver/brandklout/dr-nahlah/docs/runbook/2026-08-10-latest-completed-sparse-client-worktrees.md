## Latest completed: sparse client worktrees (2026-08-10)

Commit `e1e47c8`. `bash scripts/new-client-worktree.sh <client-slug>` — see **SYSTEM_RULES §4.2.0**.
**722 files instead of 2,438.** Cone = `deliver/process` + pillar `docs/`/`scripts/` + client folder
+ `scripts`, `mcp-servers`, `.claude`.

- **Cone mode always materialises repo-root files**, so `CLAUDE.md` / `AGENTS.md` /
  `SYSTEM_RULES.md` / `deliver/DELIVER_SYSTEM_RULES.md` arrive unlisted. Agents keep their
  directives — verified present, and other clients verified absent.
- **Sparse narrows the working tree, never commits.** A commit from a sparse worktree still carried
  all 461 giovanni-serrano, 445 farewell-agency and 66 sales files; diff vs main was the one edited
  file. Merging from a sparse worktree deletes nothing. Verified directly.
- **The `post-checkout` seeding hook does NOT fire in the sparse flow** — it only acts on a null
  previous HEAD, and sparse checks out in a second step (`--no-checkout` → `sparse-checkout set` →
  `checkout`). The script therefore seeds assets explicitly. Do not "simplify" that away.
- Widen later with `git sparse-checkout add <path>`; `git sparse-checkout disable` goes full.
- Sparse config is per-worktree (`.git/worktrees/<name>/info/sparse-checkout`); main is untouched.
- On Windows, `git worktree remove` can fail with "Permission denied" if anything still holds the
  directory. Retry, then `rm -rf` + `git worktree prune`.
