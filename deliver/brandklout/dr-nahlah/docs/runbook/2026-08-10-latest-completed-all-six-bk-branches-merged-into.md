## Latest completed: all six `bk-*` branches merged into main (2026-08-10)

`bk-arvada`, `bk-dr-nahlah`, `bk-grand-mission`, `bk-livewell`, `bk-mason-park`, `bk-stone` are all
now fully contained in `main` (`git rev-list --count main..<branch>` = 0 for each). Merge commits:
`3988bbc` (livewell, fast-forward), `2e97910` (grand-mission), `77378aa` (mason-park). Not pushed.

Two conflicts, both in **shared** files — note that per-client branching did not prevent them, it
only deferred them:

- `deliver/process/07-webflow-build/PASTEABLE-COMPONENTS.md` — purely additive. Grand Mission and
  Mason Park each appended a lessons section at the same anchor (line 109). Both kept, Grand
  Mission first. Nothing dropped.
- `deliver/brandklout/scripts/staging-verify.mjs` — a real semantic clash. Both branches fixed the
  same false-failure in the settle loop differently: Grand Mission added a 20s wait for
  ScrollTrigger to actually register scenes (without it the harness measured before the page built
  anything and reported `0 pinned` on pages that had 3); Mason Park raised the settle deadline
  15s → 30s (the layout ramp runs 804 → 13270px past 15s). **Both were kept** — either alone
  reintroduces the other's bug. Mason Park's `stable < 4` + 4px tolerance auto-merged below the
  conflict. `node --check` passes.

### Gotcha: the merge aborted on untracked files

`git merge bk-grand-mission` refused to start because five untracked files in main
(`mcp-servers/webflow-clientfirst/{lib.mjs,server.mjs,setup.md}` + 2 vocab JSONs) collided with
files the branch commits. All five were byte-identical to the branch versions (`git hash-object` vs
`git rev-parse <branch>:<path>`) so deleting them lost nothing. **Always hash-compare before
removing — do not blindly `rm` to unblock a merge.**

### Gotcha: "main has old designs" was an asset problem, not a merge problem

`.gitignore:28-38` excludes all media by extension because heavy assets are supposed to live on the
VPS, synced by `scripts/sync-assets.sh`. **rclone is not installed on this machine**, so that second
track has never run here. Git carried every byte it was allowed to; the images were never in its
remit. Copied 270 ignored files (mason-park 96, grand-mission 174; ~9.5 MB) from the two worktrees
into main by hand — enumerated with
`git ls-files --others --ignored --exclude-standard -- <client-path>` run inside each worktree.
Verified: both `04-design` folders now `diff -rq --strip-trailing-cr` clean against their worktrees,
and all **104** local asset refs across every design HTML/CSS resolve on disk.

This drift **will return** on the next client — the copy is a one-off, the ignore rule is unchanged.
The rule is over-broad: it cannot distinguish a 40 KB hero image the design needs from a 200 MB
scrape (main holds 771 MB of media overall; the render-critical design assets are only ~10 MB).

Unrelated cosmetic difference, not staleness: main checks these files out CRLF, the `bk-*` worktrees
LF, so `diff -rq` reports every text file as differing. Use `--strip-trailing-cr`.

**Open decision**: whether to keep per-client worktrees. User's concern with a single shared tree is
that agents in different tabs commit each other's half-finished client folders. See "Open questions".
