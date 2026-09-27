# 2026-09-27 — system-v2 merged into main, every client folder consolidated, media backed up to R2

Repo-level. Alejandro asked to merge the system rebuild into `main` without losing main's files, drop
`deliver/process/` from every client worktree (a copy per worktree stopped findings reaching main),
bring every client folder onto main beside the others, and get all assets somewhere the cloud can
reach, ahead of the cloud migration. He chose R2 for media and agreed to drop the retired folders.

## Done

- **Backup tag** `backup/main-pre-v2-merge-2026-09-27` on the old main (`1c31b393`), then `system-v2`
  fast-forwarded into `main`. Dropped by the rebuild (recoverable from the tag): the numbered
  `deliver/process/NN-*` modules, `deliver/workflow-test/`, `design-system-library/`,
  `manage/browser-tools/playwright-browser`, the consulting-agreement `.md`.
- **Uncommitted client work committed on its own branch first** (`wip(snapshot)` commits on
  brandklout-website, dr-nahlah, legacy, mason-park, stone, stone-med-spa, west-la). None over 20 MB,
  no secrets found.
- **16 `merge(<client>)` commits** (`-s ours` + the branch's `deliver/brandklout/<client>/`), so each
  branch is an ancestor of main and its history is kept. Every client tree on main is byte-identical
  to its branch. Clients keep the old `workflows/NN-*` layout until moved to scenario folders.
  bk-mason-park had deleted 540 Webflow-era files main still had; the branch was followed.
- **Process edits made inside the worktrees ported to the scenario layout** (`56065a1f`): Cloudflare
  Bulk Redirect lessons, `check-dns.mjs`, the merged `sites.json`, fluid-root's resolver, drive
  `thumbs`, embeds per-host session, open-graph 1.2.3, staging-clone run five, api-sync gotchas,
  Termly for Oceanic and Stone Dental, the Stone/IFA/Mason Park design lessons, QA content-fit pass.
- **Worktrees**: every `bk-*` branch fast-forwarded to main; the sparse cone is now the client folder
  + `deliver/docs`, `deliver/scripts`, `scripts`, `mcp-servers`, `.claude` — no `deliver/process`.
  `scenario.mjs` reads the process from the main checkout. `new-client-worktree.sh` and
  `sparsify-worktree.sh` use the same cone. Untracked run outputs left in the old process folders
  moved to `deliver/brandklout/<client>/process-outputs/` (gitignored); `.session*` cookies deleted.
- **The branches' own `.gitignore` rules reached main** (`9075b8ea`) — without them, sessions, a live
  PHPSESSID, `recovered/` DB dumps and scrape mirrors showed untracked once the worktrees followed main.
- **`scripts/assets.mjs`** (push / pull / status). Full push from all worktrees plus the old
  `Webzite Agentic Workflow` repo (which still held arvada, marvel, legacy, grand-mission and livewell
  media): **60,728 files, 19.5 GB, 16 clients, 0 failed**; `status` shows every manifest entry in R2;
  `pull livewell-dental` into an empty folder verified 14/14 by sha256. Manifests committed as
  `deliver/brandklout/<client>/assets.tsv`, one commit per client.
- `check-scope.mjs` no longer dies with ENOBUFS on large diffs.

## Next

1. **Push `main` and the `bk-*` branches to origin** — not done without Alejandro's go: a push to main
   triggers the VPS deploy.
2. **Move R2 to an agency-owned Cloudflare account** before relying on it: the bucket
   `brandklout-assets-test` and token `CLOUDFLARETESTING` (expires 2026-12-18) are his personal account.
   Only `R2_TOKEN` / `R2_BUCKET` in `~/.webzite/.env [shared]` change; rerun `push`.
3. Move each client folder from `workflows/NN-*` to the scenario layout (`scenario.mjs start`).
4. Schedule `assets.mjs push` (nightly, and before any worktree is removed).

## Gotchas

- **Never upload what `SENSITIVE` in `assets.mjs` matches**: `.session*`, `cookies.json`, keys,
  `.env*`, `recovered/` (DB dumps with credentials and patient-adjacent PII), `php_errorlog`. The first
  full push was stopped at alki-house when these surfaced; none had been uploaded.
- **`recovered/` is local only**: Mason Park Kids' WordPress recovery (`db.sql.gz`, `content.xml`,
  mirrors) is in the bk-mason-park-kids worktree and nowhere else. Stone's `google-drive-images/`
  (identifiable before/after patient photos) IS in R2 — private bucket.
- Loose files at the root of `deliver/brandklout/` are never read, on purpose. The dr-nahlah worktree
  and the old repo hold a **1Password Emergency Kit PDF** there; move it somewhere safe.
- A clash (same path, different size in two checkouts) keeps the newer file: 104, all re-rendered
  scrapes in the old repo vs the worktree.
- `git merge --ff-only` in a worktree keeps ignored media; `sparse-checkout set` removes only tracked
  files, so the old `deliver/process` folders had to be emptied by hand.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../SYSTEM_RULES.md).
