# RUNBOOK - `bk-alki-house`

The **standing** state of this project: what is true now, what is next, and the traps.
Dated run history is one file per run under [`runbook/`](./runbook/INDEX.md) — read the index,
then only the runs you need. Do not read them all.

**This worktree holds exactly one site: Alki House, in `deliver/brandklout/alki-house/`.**
Nothing else.

## Where the site is, as of 2026-09-12

Nothing built yet. The worktree, branch and client folder exist; the site is a from-scratch build.
Facts and open questions are in [`project-overview.md`](./project-overview.md).

| | State |
| :--- | :--- |
| Worktree | `~/orca/workspaces/Brandklout Website System/bk-alki-house`, branch `bk-alki-house`, sparse, cut from `da1612b1` |
| `.env` | Generated: `[shared]` + `[alki-house]`. The client section is empty. |
| Hosting | None. No Instatic instance, no Railway service, no domain recorded. |
| Workflows | None copied yet. |

## Next

1. Record the domain and the Asana task GID in `project-overview.md`.
2. Collect brand assets into `workflows/00-client-delivery-initialization/.tmp/client-handoff/`.
3. Design and build, to [`../../docs/DESIGN-STANDARD.md`](../../docs/DESIGN-STANDARD.md).

## Gotchas

- `scripts/env-sync.mjs` refuses a worktree with no matching master section; the `[alki-house]`
  section in `~/.webzite/.env` exists for that reason, even while empty.
- The worktree was made with `scripts/new-client-worktree.sh`, not from inside Orca, so the branch
  is bare `bk-alki-house` with no Orca prefix. If Orca does not list it, add it as an existing
  worktree rather than creating a new one.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md).
