## Gotchas — 2026-08-21 session (worktree move + wrap-up)

Concrete, because each of these cost real time.

**`git add -A` aborts the ENTIRE run on one bad path.** It exits 128, names the
offending file, and stages nothing — the message does not tell you that one path
killed everything, so it reads like a repo-wide failure. Two separate causes hit
here:
- `deliver/.../03-graphic-resources/.tmp/downloads/wp-content/uploads/elementor/google-fonts/fonts/nunitosans-*.woff2`
  -> `Filename too long` (Windows path limit).
- `deliver/.../13-content-export-import/.tmp/nul` -> `No such file or directory`.
  `nul` is a **Windows reserved device name**, left by a stray `> nul` redirect.
  It cannot be opened at all.

Both are now in `.gitignore` (with comments). If `git add -A` starts failing
again, run it capturing stderr to a file and read the FIRST error — do not pipe
to `head`.

**Never pipe a git command to `head` while judging its exit code.** SIGPIPE makes
`git add -A` report success (or 128) misleadingly; I twice believed staging had
worked when it had not. Redirect to a file instead.

**655 "modified" files were 652 line-ending churn.** `git status --short` counts
CRLF normalisation as modified. The real number comes from
`git diff --ignore-all-space --name-only` — that showed **3**. Check that before
writing a commit message claiming hundreds of changes.

**Moving a client into its worktree: the branch is the easy half.** Fast-forward
moved the commits; **4,058 of 6,229 files were untracked or gitignored** and had
to be copied separately (1,417 MB). Never-committed folders included
`00-client-delivery-initialization`, `01-content-intake`, `02-wireframe`,
`03-graphic-resources`. Recipe:
- `git log --oneline main..<branch>` and `git status --short` in the worktree
  FIRST, to confirm nothing unique is there;
- `git -C <worktree> merge --ff-only main` (fails loudly rather than merging);
- `robocopy <src> <dst> /E` — **never `/MIR`**, which deletes;
- copy `.env` by hand. **The tooling walks UP the tree for it**, so it must sit
  at the worktree root or every script fails to authenticate;
- **preserve the worktree's existing `.claude/RUNBOOK.md`** before overwriting —
  it holds that worktree's own history. Saved here as
  `.claude/RUNBOOK.pre-move-2026-08-21.md` (the SESSION 5 detail).

**`du` times out on this tree in Git Bash** (1.4 GB / 6,229 files). Use
PowerShell: `Get-ChildItem -LiteralPath <p> -Recurse -File -Force | Measure-Object -Property Length -Sum`.

**The Stop hook said "No runbook existed. I have written it from the template."
That was wrong** — the 166 KB runbook was intact. Check the file before believing
it and re-writing from scratch.

**Prove a worktree works, do not just count files.** After the move I ran
`node insta-api.mjs whoami` (auth) and `node compare-local.mjs index .ch-transformation`
(path-dependent) FROM the worktree; the latter returned the identical 12
differences as from main. A byte-count match does not prove the pipeline runs.

**Instatic-specific traps are NOT repeated here** — they are in
`deliver/brandklout/dr-nahlah/workflows/15-instatic-api-sync/15-instatic-api-sync.md`
(CSP, step-up auth rotating the session cookie, happy-dom dropping `clamp()`,
space-less `@media(...)` converting to nothing, the four cascade-order traps,
and `--window-size` not being the viewport). Read that file; it is the expensive
knowledge.
