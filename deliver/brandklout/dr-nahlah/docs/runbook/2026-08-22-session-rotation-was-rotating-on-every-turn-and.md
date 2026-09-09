## DONE 2026-08-22: session rotation was rotating on EVERY turn, and typing blind — `fa9bb1c`

**This is why this session opened with `/exit/exit` and the kickoff prompt three
times.** Not a Claude bug and not Orca — our own `scripts/session-*.mjs`.

`session-guard.mjs` suppressed a repeat rotation only while
`tokens < CONTEXT_WARN`, which a session that has *just rotated* never is. So
every subsequent `Stop` found the tree clean and the runbook fresh and rotated
**again**, each pass spawning another `session-rotate.mjs` to race the first for
the same terminal. Proven by running the pre-fix script three times against one
payload: three rotations. `bk-marvel-dental` was hit by the same thing the same
day — its terminal preview shows the launch line typed into a prompt box.

`session-rotate.mjs` then made it visible, because it typed `/exit`, the launch
command and the kickoff prompt **blind on a fixed 9-second sleep**.

Fixed, all covered by `node scripts/session-rotation.test.mjs` (17/17 here,
8 failing against the pre-fix scripts, so the tests are not vacuous):

- rotation is keyed to the `session_id` it fired for and is silent afterwards;
- `session-rotate.mjs` takes an exclusive `.claude/rotate.lock` (`wx`, stale
  after 5 min) before touching the terminal;
- after `/exit` it **reads the terminal back** until Claude is gone AND a shell
  prompt is positively recognised, then aborts if it cannot establish that in
  30 s;
- the kickoff prompt is **off by default** (`WEBZITE_ROTATE_KICKOFF=1` restores
  it). `session-resume.mjs` already injects the runbook at SessionStart.

**The trap inside the trap:** matching Claude's status footer is NOT enough to
tell "TUI still up" from "back at a shell". A session sitting on the `--resume`
picker draws a modal with **no footer at all** —

```
  > 1. Resume from summary (recommended)
  Enter to confirm - Esc to cancel
```

— and one of the six live terminals on this machine was in exactly that state
while I was testing. A footer-only check reads it as a shell and types the
launch line into the dialog. Hence the second predicate: require a **positive**
shell-prompt match, so the unknown case aborts rather than types.

**Also fixed: this runbook was costing ~44k tokens at every SessionStart.** It
had reached **177 KB / 2,552 lines** and `session-resume.mjs` injected all of
it — a quarter of the 200k budget the rotation rule exists to protect, on every
single session. It now injects the head only, capped at 40,000 chars and cut at
a section boundary, with a marker naming what was dropped. Measured: 44,291
tokens' worth of characters down to **8,853**, with everything from `2026-08-22`
back to `2026-08-20` still intact. Override with `WEBZITE_RUNBOOK_MAX_CHARS`.

Sections in this file are newest-first, which is what makes the head the right
half to keep. **Do not reorder it.** Consider archiving pre-2026-08-19 sections
to `.claude/RUNBOOK.archive.md` if it grows past ~200 KB again.

### Not done, and it matters

`scripts/` is tracked, so **every other worktree still has the buggy copy** —
`bk-marvel-dental` demonstrably so. This fix is on `bk-dr-nahlah` only. It needs
to reach `main` and then the other `bk-*` worktrees, and that is the operator's
call, not something to merge unasked.

### Gotchas

- **The Bash tool mangles a doubled backslash inside a quoted heredoc** (it
  arrives as a single one), so a JS regex written that way is a syntax error.
  `\+` and `\/` survive. Write those lines with the Edit tool instead.
- **Node cannot `execFileSync` a `.cmd`** on Windows (EINVAL, since the CVE
  fix), so an `orca` stub on `PATH` cannot be a batch file — Node skips it and
  silently finds the real `orca.exe` further along `PATH`, and your "stub" test
  quietly drives the real Orca. The real binary is
  `…/Programs/orca/resources/bin/orca.exe`. Test the predicates directly
  instead; that is what `session-rotation.test.mjs` does.
- **`orca terminal read --limit N --json` is the way to see what a terminal is
  actually showing.** `terminal list`'s `preview` field concatenates successive
  redraws, so one line being typed looks like six repetitions of itself. That is
  what made this look like six rotations before I counted properly.
