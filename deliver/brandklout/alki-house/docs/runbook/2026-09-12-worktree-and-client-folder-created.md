# 2026-09-12 — worktree and client folder created

## Done

- `bash scripts/new-client-worktree.sh alki-house` from the root `main` checkout. No folder
  matched, so the script treated it as a new client under `deliver/brandklout/alki-house`.
  Result: branch `bk-alki-house`, worktree at
  `~/orca/workspaces/Brandklout Website System/bk-alki-house`, sparse cone
  `deliver/process deliver/brandklout/docs deliver/brandklout/scripts deliver/brandklout/alki-house scripts mcp-servers .claude`
  (296 files on disk against 5,982 in a full checkout). Asset seeding had nothing to do.
- Branched from local `main` at `da1612b1`, recorded as `process_baseline_commit`.
- Appended an empty `[alki-house]` section to `~/.webzite/.env`, then `node scripts/env-sync.mjs`
  wrote the worktree `.env` (`[shared]` + `[alki-house]`, 11 keys). The `.env` is gitignored.
- Wrote `docs/project-overview.md`, `docs/mcp-access.md`, `docs/RUNBOOK.md` and this runbook.

## Next

- The domain, the Asana task GID, brand assets and the Instatic instance are all unrecorded; see
  the open questions in `project-overview.md`.

## Gotchas

- The first `env-sync` run failed with `no master section matches 'bk-alki-house'`. It derives the
  section from the branch name; `bk-alki-house` matches `[alki-house]` by name, so no
  `[aliases]` entry was needed.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../../SYSTEM_RULES.md).
