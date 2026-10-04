# Runbook

The **standing** state of this project: what is true now, what is next, and the traps.
Dated run history is one file per run under [`runbook/`](./runbook/INDEX.md) — read the index,
then only the runs you need. Do not read them all.


## Standing

- **`system-v2` is merged into `main` (2026-09-27).** This checkout is `main`: the system. Every
  `bk-*` branch fast-forwarded to it; client worktrees do not check out `deliver/process/`. See
  [the run](./runbook/2026-09-27-system-v2-merged-clients-consolidated-media-in-r2.md).

- **`deliver/process/` is now scenarios plus tools** (2026-09-23): `scenario-0-new-site`, `scenario-1-migration`,
  `scenario-2-updates-expansions`, `scenario-3-ads-landing-pages`, `scenario-4-update-plugins`,
  `scenario-5-instatic-release-update`, and unnumbered `tools/`. The old 00–23 modules were dropped
  (recoverable from tag `backup/main-pre-v2-merge-2026-09-27`). Open questions
  and next steps: [the run](./runbook/2026-09-23-process-reshaped-into-scenarios.md).

- **Figma is readable by API and editable through Chrome.** `FIGMASECRET` is a working PAT. The
  Deliver SOP board and the Sitemap board (Relume ads sitemap + five specialty templates) live in
  FigJam; Scenario 0 step 02 starts every sitemap from a specialty template. REST cannot
  write FigJam — see [the run](./runbook/2026-09-22-figma-sop-board-and-specialty-sitemaps.md).

- **`SYSTEM_ARCHITECTURE.md` was deleted on 2026-09-28** (a 2026-09-19 proposal overtaken by the
  scenario layout and R2). Its reasoning and open decisions stay in
  [the proposal run](./runbook/2026-09-19-system-architecture-proposal.md).

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
  MCP/OAuth sign-ins are not mirrored, and Orca does not run there. All 12 GB of client media was
  pushed once over the wire (~4½ hours) and verified per worktree; there is still no asset source
  but this workstation, so the next box costs those hours again. See
  [2026-09-19](./runbook/2026-09-19-namespace-devbox-mirror.md).

- **Client media is backed up to R2 by `scripts/assets.mjs`** (push / pull / status, manifest
  `deliver/brandklout/<client>/assets.tsv`): 60,728 files, 19.5 GB, 16 clients on 2026-09-27. The
  bucket `brandklout-assets-test` and token `CLOUDFLARETESTING` (expires 2026-12-18) are in
  Alejandro's *personal* Cloudflare account; move them to an agency account before relying on it.
  The VPS/rclone asset flow is retired (`sync-assets.sh` deleted 2026-09-28). `recovered/` dumps and
  session cookies are never uploaded. See
  [2026-09-27](./runbook/2026-09-27-system-v2-merged-clients-consolidated-media-in-r2.md).

- **The repo is an Obsidian vault.** `.obsidian/` at the root is tracked, so the graph and its
  colour groups are the same on every machine and every `bk-*` worktree. `.tmp/`,
  `node_modules/` and friends are excluded, which leaves 368 real docs. Obsidian cannot see
  dot-folders, so `.claude/` runbooks are absent from the graph. Links are relative markdown
  links, never wikilinks. See [2026-09-17](./runbook/2026-09-17-obsidian-vault-setup.md).

- **Google Drive works** through `node scripts/drive.mjs` (search, ls, get, pull), signed in as
  alejandro@thrivesquare.com. The app is in Testing, so the sign-in expires every 7 days:
  `invalid_grant` means run `node scripts/drive.mjs auth`. See
  [2026-09-16](./runbook/2026-09-16-google-drive-access.md).
