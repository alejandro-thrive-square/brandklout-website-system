# 2026-09-22 — The worktree and client folder exist

## Done

- Orca worktree `bk-oceanic-dental` created from `main` at `78a57f13`; Orca named the branch
  `alejandro-thrive-square/bk-oceanic-dental`, renamed to the bare `bk-oceanic-dental`.
- Client folder `deliver/brandklout/oceanic-dental/` scaffolded: `docs/project-overview.md`,
  `docs/RUNBOOK.md`, this runbook, and `workflows/00-client-delivery-initialization/.tmp/client-handoff/`.
- Worktree is sparse: the shared context plus this client (`git sparse-checkout add deliver/brandklout/oceanic-dental`).

## Next

See [`../RUNBOOK.md`](../RUNBOOK.md) — Asana, scope, assets.

## Gotchas

- A brand-new client folder is outside the sparse cone: Orca's setup narrowed the worktree to the
  shared context before the folder existed, `git add` refused the new files, and
  `sparsify-worktree.sh --client oceanic-dental` did not help because it only matches folders
  already tracked. `git sparse-checkout add deliver/brandklout/<slug>` is the fix.
