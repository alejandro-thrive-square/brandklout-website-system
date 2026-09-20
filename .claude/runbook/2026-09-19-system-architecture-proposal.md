# 2026-09-19 - Diagram-based system architecture proposal

## Done

- Inspected the user's target diagram against local rules, process index, setup/deployment
  scripts, and the September 19 R2 and Namespace runbooks. Starting commit: `7a0595b6`.
- Added [SYSTEM_ARCHITECTURE.md](../../SYSTEM_ARCHITECTURE.md) with layer responsibilities,
  current gaps, project/asset contracts, migration phases, and explicit unresolved choices.
- Linked the proposal from root and Deliver rules and updated the standing runbook.
- This run is documentation only. No project extraction, remote changes, credential changes,
  installation, or live-service verification was performed. The resulting commit is discoverable
  with `git log -1 --format=%H -- SYSTEM_ARCHITECTURE.md` after committing this change.

## Next

- Resolve project repository topology (shared sites repository versus per-client repositories),
  primary remote execution host, agency-owned R2 destination, and a pilot client before migration.
- Implement the recovery baseline and verified asset restore ahead of project extraction.
- Reconcile legacy root/Deliver documentation as each implementation milestone changes behavior.

## Gotchas

- Sparse client worktrees are still part of one repository; visibility isolation does not
  establish independent client version control or independent transferable histories.
- The screenshot labels project version control separately but does not unambiguously require
  one repository per client. That is a proposal, not an approved decision.
- The Namespace media transfer was incomplete at the time of its runbook. This pass did not
  check whether it subsequently finished.
- R2 evidence covers one client's media. A full client recovery also requires code, dependencies,
  CMS data, and scoped configuration. A mutable mirror alone is not a recoverable backup.
- Root asset tools still hardcode the old Webzite VPS path. Do not use documentation statements
  that the VPS is authoritative as proof that this repo's assets can actually be restored.
- `main` client runbooks are snapshots; future migration must use each client's latest branch.

## Version Control

Follow [SYSTEM_RULES.md section 4](../../SYSTEM_RULES.md#4-version-control--asset-management).
Commit this run with the proposal and documentation pointers. No media or secrets are included.

## Infrastructure

Planning performed on Windows. Supported VPS baseline is Ubuntu 24.04 LTS on Hostinger;
Namespace remains a candidate execution host. Existing runtimes are unchanged.
