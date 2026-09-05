## DONE 2026-08-22 (session 7): the Stop hook's runbook path is FIXED — `59afddf`

Third recurrence, now closed. `worktreeRoot()` resolves `git rev-parse --show-toplevel` (falling back to cwd, so a non-repo directory still behaves) and `runbookPath()` / `statePath()` go through it; `session-guard.mjs` and `session-resume.mjs` resolve the root up front so the git summary, the dirty check and the worktree `session-rotate.mjs` has to match a terminal against are all the root too — that second half is why rotation also typed blind.

Six new cases in `scripts/session-rotation.test.mjs` drive the hooks from `deliver/client/workflows/08-qa/.tmp`. **They fail 6/6 against the old code with exactly the observed symptom and pass with the fix; 23/23 green.** Verified non-vacuous by stashing the fix and re-running.

**Still to do: re-propagate `scripts/` to `main` and the seven `bk-*` branches**, exactly as `fa9bb1c` did. This worktree has the fix; the others do not.
