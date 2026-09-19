# Runbook

The **standing** state of this project: what is true now, what is next, and the traps.
Dated run history is one file per run under [`runbook/`](./runbook/INDEX.md) — read the index,
then only the runs you need. Do not read them all.


## Standing

- **Client images are not in git and not on the VPS — they live only in each worktree folder.**
  `.gitignore` excludes all media and `rclone` is not installed here, so removing a worktree
  deletes that client's images. Five clients' images are still only in the old
  `Webzite Agentic Workflow` folder; do not delete it. A full copy of every ignored file, a bundle,
  `pre-cleanup-2026-09-18/*` tags and `backup/2026-09-18/*-wip` branches exist as of 2026-09-18.
  An asset mirror and the directive cleanup are next, in that order. See
  [2026-09-18](./runbook/2026-09-18-full-backup-before-system-cleanup.md).

- **The repo is an Obsidian vault.** `.obsidian/` at the root is tracked, so the graph and its
  colour groups are the same on every machine and every `bk-*` worktree. `.tmp/`,
  `node_modules/` and friends are excluded, which leaves 368 real docs. Obsidian cannot see
  dot-folders, so `.claude/` runbooks are absent from the graph. Links are relative markdown
  links, never wikilinks. See [2026-09-17](./runbook/2026-09-17-obsidian-vault-setup.md).

- **Google Drive works** through `node scripts/drive.mjs` (search, ls, get, pull), signed in as
  alejandro@thrivesquare.com. The app is in Testing, so the sign-in expires every 7 days:
  `invalid_grant` means run `node scripts/drive.mjs auth`. See
  [2026-09-16](./runbook/2026-09-16-google-drive-access.md).
