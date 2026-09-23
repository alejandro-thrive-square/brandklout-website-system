# 2026-09-22 — `system-v2` worktree created for the system rebuild

## Why

The owner is about to restructure the system: delete many files and move folders. That work
happens on its own branch in its own folder so `main` and the 16 `bk-*` client worktrees keep
working untouched. Client site work goes back to the base folder; system rebuild work happens here.

## Done

- Branch `system-v2`, cut from `main` at `1c31b393`, checked out as a worktree at
  `C:\Users\ACER\Documents\Webzite Studio\Brandklout Website System v2` (sibling of the base folder).
- Pushed to `origin/system-v2` as the off-machine backup.
- Full checkout (6165 tracked files). `npm install` sparsified it to 323 files, because the
  postinstall treats every non-main worktree as a client workspace, so
  `bash scripts/sparsify-worktree.sh --undo` restored it.
- `~/.webzite/.env` backed up to `~/.webzite/backups/.env.before-system-v2-*`, then an empty
  `[system-v2]` section appended so env-sync resolves this worktree. Result: `[shared]` keys only,
  the same policy as main.
- `deliver/brandklout/termly-setup.html` (untracked scratch on main, holds Termly account emails)
  copied here as untracked. Deliberately not committed.
- Claude memory copied to `~/.claude-team/projects/C--Users-ACER-Documents-Webzite-Studio-Brandklout-Website-System-v2/memory`
  (memory is keyed by folder path; a new folder starts empty). The two copies now drift independently.

## Next

- Do the restructure here. Commit often; `git push` sends it to `origin/system-v2`, never to main.
- Merge into `main` only when v2 works end to end, and only after deciding what happens to the
  16 client branches, which still expect the old layout.

## Gotchas

- **Never `npm install` here without re-running `sparsify-worktree.sh --undo` afterwards**, until
  the restructure changes that postinstall. Otherwise most of the tree vanishes from disk
  (git still tracks it; nothing is lost, it just looks deleted).
- The base folder's `.env` still carries 29 `TERMLY_*` keys; v2's does not. The master moved
  them into `[vars]` (referenced by client sections only); the base `.env` predates that. v2 is
  the correct one. Re-running env-sync in the base would drop them too.
- Client media is not in git. It lives only inside the `bk-*` worktrees under
  `C:\Users\ACER\orca\workspaces\Brandklout Website System\`. Copy it over by hand if v2 needs it.
- Both folders share one `.git`: a branch checked out in one folder cannot be checked out in the
  other. Removing v2 later: `git worktree remove "../Brandklout Website System v2"` from the base.

## Version Control

Tracked on branch `system-v2`, per [SYSTEM_RULES.md §4](../../SYSTEM_RULES.md).
