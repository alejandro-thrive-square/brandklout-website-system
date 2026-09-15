# 2026-09-15 — BugHerd staging loops launched in three worktrees

Orchestration only: no client files changed here. Each worktree runs its own `/loop` session and
writes its own runbook.

## Done

BugHerd, checked from main before dispatch:

| Worktree | Project | What is new | Staging target |
| :--- | :--- | :--- | :--- |
| `bk-mason-park` | 539151 | No new tasks. All 48 from 09-10 still todo; 32 (#1–#33) touched 2026-09-14 19:32–19:34Z with no new comments. The session has to work out what changed. | staging.masonparkdental.com |
| `bk-mason-park-kids` | 540564 | 27 todo tasks (#1–#28, no #5), 2026-09-14/15 | staging.masonparkpediatricdental.com |
| `bk-west-la-implants` | 541030 | 5 todo (#14–#18), 2026-09-14; #1–#13 done | the instance in each task's url |

Each worktree got a new Orca terminal titled `BugHerd staging round`. `claude team
--permission-mode bypassPermissions` was started in each, and a `/loop` brief sent to each. The
brief says: pull every task by id with its screenshots, fix locally, push to staging only, verify
live, reply on BugHerd and close only what is verified live, never write to Asana, commit, write a
runbook entry, stop. All three receipts reached `turn_started`.

## Gotchas

- **A brief containing `"` never arrives from PowerShell 5.1.** No receipt, empty prompt. The Kids
  and West LA briefs had to be resent with single quotes. Now noted in
  `deliver/brandklout/docs/ORCHESTRATION.md`.
- The Kids and West LA worktrees had modified or untracked `.tmp` files before dispatch. Each
  brief tells its session to inspect them before committing.

## Next

- Read each worktree's runbook when its loop stops. The Mason Park session may find there is nothing
  new, which is a valid outcome.
- Merge the three branches back to main after review.

## Version Control

Follows [SYSTEM_RULES.md](../../SYSTEM_RULES.md). Runbooks are tracked.
