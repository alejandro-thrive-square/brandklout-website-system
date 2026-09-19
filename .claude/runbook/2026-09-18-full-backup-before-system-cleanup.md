# 2026-09-18 — full backup before the system cleanup; client media found to live only in worktrees

Repo-level. Alejandro asked whether the design directive is consistent across `main` and the
worktrees before starting IFA's design. It is not (findings below), and a cleanup is planned. He
asked for a backup first that cannot lose anything, images above all. **Nothing was cleaned up in
this run — it is backup and audit only.**

## Done

- **Every branch is on GitHub.** Before this run 12 of the 15 `bk-*` branches had no remote and
  `main` was 57 commits ahead of `origin/main`. All pushed, no force. The repo is private.
- **Uncommitted work in seven worktrees saved without touching them**, as
  `backup/2026-09-18/<branch>-wip` branches (brandklout-website 214 files, stone-med-spa 28,
  mason-park 19, dr-nahlah 6, west-la 5, legacy 2, grand-mission 0 — line endings only). Made with a
  copy of the worktree's index (`GIT_INDEX_FILE`), `git add -A`, `write-tree`, `commit-tree`, so the
  worktree, its real index and its branch were not modified — an agent may have been live in any of
  them. Restore one file with `git checkout backup/2026-09-18/<branch>-wip -- <path>`.
- **Tags `pre-cleanup-2026-09-18/<branch>`** on `main` and all 15 client branches, pushed.
- **Bundle** of the whole history, verified:
  `Documents\Webzite Studio\_backups\brandklout-2026-09-18\brandklout-website-system.bundle`.
- **Every git-ignored file copied out** of all 16 worktrees to `_backups\brandklout-2026-09-18\ignored-files\<branch>\`
  (about 10.3 GB; `node_modules`, `.venv`, `__pycache__` skipped). File count and byte total checked
  per worktree: all 16 OK. Reports: `REPORT.txt`, `REPORT-pass2.txt` in that folder.
- **The old repository's images copied too**: 28,661 ignored files under
  `Webzite Agentic Workflow\deliver\brandklout\` to `_backups\...\old-repo-ignored-files\`, count OK.

## Found

- **Client media lives in exactly one place: the worktree folder.** `.gitignore` excludes every
  image, video and font and says the VPS is the source of truth through rclone — but `rclone` is
  not installed on this workstation, so that sync has not been running. `main` holds 0 media files.
  Removing an Orca worktree deletes that client's images for good.
- **The 2026-08-22 repo split carried the code and left the images behind.** The `bk-arvada`,
  `bk-marvel-dental`, `bk-legacy-dental`, `bk-grand-mission` and `bk-livewell` worktrees hold no
  media; theirs is still in the old repo's main folder (Arvada 11,454 files, Marvel 3,417, Legacy
  1,950, Grand Mission 275, Livewell 6; by path, Dr. Nahlah has up to 2,557 and Mason Park 186 there
  that the new worktrees lack). This is why a client site opens locally with code and no pictures.
- **The design directive has forked.** `DESIGN-STANDARD.md` gained 188 lines on `bk-mason-park`
  only; `04-design.md` gained 138 lines on `bk-stone` and 19 on `bk-stone-med-spa`; none reached
  `main`, and most branches are 42 commits behind it. `04-design.md` and its trigger prompt still
  describe Figma and Vercel and never mention Instatic. Breakpoints disagree (360/390/768/1024/
  1440/1920 in the directive, 1279/991/767/479 in practice).
- **279 per-client copies of process directives** (175 identical, 104 drifted, mostly
  `07-webflow-build`); no client folder links back to the canonical one. Link graph: 71 of 393 real
  notes are reachable from `CLAUDE.md`; 205 of the inbound links to `SYSTEM_RULES.md` are the
  Version Control footer.

## Next

1. **Asset safety before the cleanup**: a tracked per-client manifest (path, size, hash) plus an
   `assets push/pull` script to a cloud mirror, run nightly and at the end of each task, and a guard
   before removing a worktree. Waiting on Alejandro: R2 or Drive as the mirror.
2. Copy each client's images from the old folder into its new worktree (adds ignored files only).
   Not done — needs his go-ahead.
3. Then the directive cleanup on one `system-update` branch: merge the three stranded rule sets into
   `main`, rewrite `04-design` for Instatic, keep Webflow and Instatic as two separate build
   processes (**Webflow is still live for some clients**), replace client copies with pointers,
   remove `workflow-test`, `dentalpro-toolkit`, the consulting agreement and
   `RUNBOOK.pre-move-2026-08-21.md`. `manage/` stays — its Playwright directive has 13 inbound links.
   Roll out by merging `main` into one worktree at a time, IFA first.

## Gotchas

- **`git ls-files` quotes non-ASCII names**, so a file list fed to `tar -T` silently skips them
  (11 files across Alki House and Mason Park on the first pass). Use `-z`, and
  `tar --verbatim-files-from`.
- **Pushing `main` triggers `.github/workflows/deploy-vps.yml`**, which has failed within ten
  seconds on every push since 2026-08-23. Harmless, but it is noise that should be fixed or removed.
- **The backup folder is on the same disk as the originals.** It covers a cleanup mistake, not a
  drive failure.
- **Do not delete `Documents\Webzite Studio\Webzite Agentic Workflow`.** It is the only working
  home of five clients' images, and it has 26 uncommitted changes of its own.
- A stat-per-file size scan over the worktrees takes more than ten minutes under Git Bash; run it
  in the background.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../SYSTEM_RULES.md).
