## Latest completed: automatic worktree → main asset mirror (2026-08-10)

Commits `0389f15` (mirror) and `f721525` (LF attribute). Not pushed. Closes the gap that made
merged designs render broken in `main`. Full rules in **SYSTEM_RULES.md §4.2.1**.

`scripts/mirror-assets.sh` + `scripts/hooks/post-commit`, wired by
`git config core.hooksPath <main>/scripts/hooks` (now also done by `bootstrap.sh`; **one-time per
clone**). After every commit in every worktree, ignored asset files under the project paths that
commit touched are copied into `main`. Additive only — never deletes.

Verified end to end: a real commit in `bk-mason-park` auto-copied 2 new assets into main, and the
same from `bk-grand-mission`. Test commits were reset and both worktrees left at their original
SHAs; `04-design` folders re-verified identical afterwards.

**New worktrees are seeded too** (`c02ec28`). `git worktree add` checks out tracked files only — a
fresh worktree had 9/9 image refs broken. `scripts/hooks/post-checkout` now seeds from main when the
previous HEAD is the null SHA (new worktree/clone only, not branch switches), inferring the client
from the branch name by progressively shorter prefixes. Verified on a throwaway worktree: 84 files
seeded, all 51 local refs resolve, folder identical to main.

**The mirror covers `_vendor/` as well as media.** Designs load GSAP from
`.tmp/_vendor/gsap/*.min.js` — ignored, and not a media extension. Mirroring images but not those
gives a page that renders and never moves, which *looks correct in a screenshot*. That is the
dangerous kind of failure; a missing image at least announces itself.

**Three traps hit while building it — do not re-learn these:**

1. **Hooks are shared but worktrees are not.** `.git/hooks` lives in the common dir, so one hook
   fires from every worktree. But the hook first resolved `mirror-assets.sh` from the *calling*
   worktree, which did not have the file (new + uncommitted), so `[[ -f ]] || exit 0` made it
   silently do nothing. It now resolves from the main worktree via `git worktree list`.
2. **`core.hooksPath` must be absolute.** A relative path resolves against each worktree's own root,
   which reintroduces trap 1 for any branch predating `scripts/hooks/`.
3. **`${FLAG:+...}` on a "true"/"false" string always expands.** The summary line printed
   "(dry run)" on real runs. Compare with `[[ "$FLAG" == true ]]`.

Also: extensionless hooks fall under `* text=auto` and check out CRLF. Git Bash tolerates a CRLF
shebang (tested), Ubuntu does not — pinned with `scripts/hooks/** text eol=lf`.
