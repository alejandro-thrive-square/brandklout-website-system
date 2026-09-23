# tools/instatic-release

Executables for [Scenario 5 · Instatic Release Update](../../scenario-5-instatic-release-update/README.md):
see which release every site runs, back one up, move it to a pinned release, prove nothing was lost,
and roll it back. Written 2026-09-23.

**Why a separate toolkit and not `instatic-site/release/`:** these scripts work on Railway service
instances across every client at once (the inventory reads the whole workspace, credentials come from
the sectioned `~/.webzite/.env` like `instatic-embeds/rollout-site-scripts.mjs`), while
`instatic-site` scripts target one site through the worktree `.env` and refuse to run without
`INSTATIC_BASE_URL`. They reuse `instatic-site` rather than copy it.

| Reused, not copied | For |
| --- | --- |
| `../instatic-site/ops/backup-site.mjs` | the API snapshot (shell, page rows, published HTML, `seq`), run as a child process |
| `../instatic-site/staging-clone/lib.mjs` | login and `api(base, cookie, …)` against an explicit host |
| `../instatic-domain-origins/check-origins.mjs` | the admin login origin check on every `PUBLIC_ORIGIN` host |
| `../instatic-site/setup/provision-instance.mjs` | the Railway GraphQL pattern (`serviceInstanceUpdate`, `serviceInstanceDeployV2`) |
| `../instatic-api-sync/prune-versions.mjs` | `railway ssh -p -s -e` addressing, the Windows `railway.exe` lookup, the DB swap pattern |

## Scripts

| Script | Purpose | Usage | Writes to Railway or the site? |
| --- | --- | --- | --- |
| `inventory.mjs` | Every service in the workspace: image, running digest and its ghcr release, deployment, volume, hosts, flags (`UNPINNED`, `NO-VOLUME`, `DRIFT`, `VOLUME>80%`, `NOT-REGISTERED`, `NO-CREDS`) | `[--origins] [--db] [--json] [--only <project>]` | No. `--db` runs a readonly bun script over `railway ssh` |
| `backup.mjs` | `record.json` (ids, image, digest, release, volume, `PUBLIC_ORIGIN`), DB facts, API snapshot plus plugins, media and publish status, `VACUUM INTO` copy with integrity and row check, uploads tar, optional Railway volume backup and local download | `--site <section>\|--project <id\|name> --env <env> [--snapshot] [--apply] [--label pre-x.y.z] [--railway-backup] [--download]` | Dry by default. `--apply` writes backup files only |
| `update-image.mjs` | Set the image to `ghcr.io/corebunch/instatic:<version>` (or `@sha256`), deploy, wait, assert digest, mount and `/health` | `--site … --env … --version x.y.z\|--pin-current --backup <dir> [--apply] [--by-digest]`; production adds `--allow-production --staging-proof <verify dir>` or `--no-staging` | Dry by default |
| `verify-data.mjs` | Compare a backup with now: seqs, rows, slugs, bodies, media, plugins, published routes and their SEO and script tags, DB counts and migrations, `check-origins`; writes `verify.json` (the staging proof) | `--backup <dir> [--db] [--expect <digest>] [--no-origins]` | No (logs in and reads) |
| `rollback.mjs` | Image back to the recorded release; `--restore-db` swaps the `VACUUM INTO` copy in only if the live DB is damaged | `--backup <dir> [--apply] [--restore-db] [--force-restore] [--by-digest]` | Dry by default |
| `lib.mjs` | Railway GraphQL (`user.accessToken`, refreshed with `railway whoami`), workspace listing, `PUBLIC_ORIGIN` read, ghcr tags and digests, `railway ssh`, master env, target picking | imported | — |

## Conventions

- Run from the client folder so outputs land in its `.tmp/instatic-release/` (gitignored). The inventory
  can run anywhere.
- Railway token: `~/.railway/config.json` `user.accessToken` only. `user.token` is null and the shared
  `RAILWAY_TOKEN` is rejected. Never printed.
- `PUBLIC_ORIGIN` is the only variable any script reads out; the query returns secrets too, and they are
  dropped unread.
- Staging is decided by the host (`staging.` / `stg.`), not the environment name: Mason Park Kids'
  only environment is called `production` and serves `staging.masonparkpediatricdental.com`.
- Git Bash: `MSYS_NO_PATHCONV=1` is set for every `railway ssh` call. Do not pipe a Node 24 script's
  output on Windows; redirect to a file.
- Five failed logins lock an Instatic account: the scripts stop at the first login error.

## Tested

2026-09-23: `inventory.mjs` and `--origins` run against the live workspace (read only). Dry runs of
`update-image.mjs` (staging, production, `--pin-current`) and `backup.mjs`. Not yet run for real: any
`--apply`, `--db`, `--snapshot`, `verify-data.mjs`, `rollback.mjs`. The first real round must start on
one staging instance and read every output.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../SYSTEM_RULES.md). Scripts and this README are committed;
outputs go to the client's `.tmp/`. No token or password is ever written here.
