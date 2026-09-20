# Runbook

The **standing** state of this project: what is true now, what is next, and the traps.
Dated run history is one file per run under [`runbook/`](./runbook/INDEX.md) — read the index,
then only the runs you need. Do not read them all.


## Standing

- **The new system diagram now has a concrete architecture proposal:**
  [SYSTEM_ARCHITECTURE.md](../SYSTEM_ARCHITECTURE.md). It separates system and client project
  version control, defines R2 recovery and transferable project requirements, and sequences a
  pilot before rollout. Project repository topology, remote scheduler host, production bucket,
  and pilot client remain open. This is a documentation pass; no infrastructure or client
  migration has occurred. See [the run](./runbook/2026-09-19-system-architecture-proposal.md).

- **Technology selection remains advice, not approval.** The follow-up recommendation is
  GitHub for code/history, R2 with rclone for versioned media recovery, and the existing VPS
  as the first continuous automation host. Namespace remains an optional cloud workstation;
  its idle lifecycle needs explicit handling for unattended work. Git LFS is a valid media
  alternative; the current gap is our exclusion policy plus unfinished backup, not a GitHub
  inability to store images. See [the comparison](./runbook/2026-09-19-storage-and-runtime-guidance.md).

- **There is a cloud mirror of this workstation: the `Brandklout` devbox on namespace.so.** The
  clone, all 15 sparse client worktrees, `~/.webzite/.env` and the Python/Playwright runtime are
  there, under `/workspaces/`. Reach it with `devbox ssh Brandklout` (the CLI is installed locally;
  the login expires 2026-10-19). **One devbox per user** — `devbox create` fails while it exists.
  MCP/OAuth sign-ins are not mirrored, and Orca does not run there. The media was pushed once over
  the wire, ~3 hours for 10 GB; there is still no asset source but this workstation. See
  [2026-09-19](./runbook/2026-09-19-namespace-devbox-mirror.md).

- **Client images are not in git and not on the VPS — they live only in each worktree folder.**
  `.gitignore` excludes all media and `rclone` is not installed here, so removing a worktree
  deletes that client's images. Five clients' images are still only in the old
  `Webzite Agentic Workflow` folder; do not delete it. A full copy of every ignored file, a bundle,
  `pre-cleanup-2026-09-18/*` tags and `backup/2026-09-18/*-wip` branches exist as of 2026-09-18.
  An asset mirror and the directive cleanup are next, in that order. See
  [2026-09-18](./runbook/2026-09-18-full-backup-before-system-cleanup.md).

- **R2 passed a trial as that asset mirror, but nothing is built yet.** IFA's 1,582 files (1.6 GB)
  were pushed, pulled and hash-verified against bucket `brandklout-assets-test` in Alejandro's
  *personal* Cloudflare account (`CLOUDFLARETESTING` in the master `.env`, expires 2026-12-18).
  There is no `scripts/assets.mjs`, no manifest and no schedule — the worktrees are still the only
  working home of the media. Waiting on his go-ahead to build it. See
  [2026-09-19](./runbook/2026-09-19-r2-asset-mirror-trial.md).

- **The repo is an Obsidian vault.** `.obsidian/` at the root is tracked, so the graph and its
  colour groups are the same on every machine and every `bk-*` worktree. `.tmp/`,
  `node_modules/` and friends are excluded, which leaves 368 real docs. Obsidian cannot see
  dot-folders, so `.claude/` runbooks are absent from the graph. Links are relative markdown
  links, never wikilinks. See [2026-09-17](./runbook/2026-09-17-obsidian-vault-setup.md).

- **Google Drive works** through `node scripts/drive.mjs` (search, ls, get, pull), signed in as
  alejandro@thrivesquare.com. The app is in Testing, so the sign-in expires every 7 days:
  `invalid_grant` means run `node scripts/drive.mjs auth`. See
  [2026-09-16](./runbook/2026-09-16-google-drive-access.md).
