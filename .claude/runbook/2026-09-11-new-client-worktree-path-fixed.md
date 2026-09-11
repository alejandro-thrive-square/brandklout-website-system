## 2026-09-11: `new-client-worktree.sh` default path fixed

### Done

- `scripts/new-client-worktree.sh` defaulted to `$(dirname "$MAIN")/../orca/workspaces/<repo>/<branch>`.
  The main checkout is at `~/Documents/Webzite Studio/Brandklout Website System`, so that resolved to
  **`~/Documents/orca/...`**, not `~/orca/workspaces/...` where Orca keeps every other worktree.
  It is now `${ORCA_WORKSPACES:-$HOME/orca/workspaces}/<repo>/<branch>`. A dry run prints
  `/c/Users/ACER/orca/workspaces/Brandklout Website System/bk-<slug>`.
- Found while creating `bk-brandklout-website` (Brandklout's own site, see that branch's
  `deliver/brandklout/brandklout-website/docs/RUNBOOK.md`). That worktree was moved into place
  with `git worktree move`. The stray `~/Documents/orca/` folder is gone.

### Gotchas

- The failure is quiet. The script prints `=== ready`, and anything that then writes to the
  *intended* path creates a plain folder with no `.git`. The first sign is `MODULE_NOT_FOUND`
  from `env-sync.mjs` or an `insta-api.mjs` import. `git worktree list` settles it.
- No other worktree was affected. All thirteen existing `bk-*` worktrees were made through Orca,
  which has its own path logic.

## Version Control

Follows [SYSTEM_RULES.md §4](../../SYSTEM_RULES.md).
