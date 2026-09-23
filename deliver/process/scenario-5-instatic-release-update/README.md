# Scenario 5 · Instatic Release Update

Move live Instatic sites on Railway to a new Instatic release without losing a page, an image, a
plugin setting or an admin login. Staging first, production one site at a time, a backup before
every change and a one-step way back.

Every Brandklout Instatic site is one Railway service running the `ghcr.io/corebunch/instatic`
image with its whole life on one volume at `/app/storage` (the SQLite `cms.db`, uploads, plugin
code). Changing the image never touches the volume, so a release update is safe **as long as**
the volume stays attached, the new release's database migrations work, and every plugin still
loads. This scenario checks those three things, in that order, on staging before production.

Run it when upstream publishes a release we want (security fix, a bug we hit, a feature), and
once now to stop the `:latest` drift below.

| Step | Directive | Gate to leave the step |
| --- | --- | --- |
| 01 | [Assess the Release](01-assess-release.md) | Inventory saved, changelog and migrations read, go / wait decided with the owner |
| 02 | [Backup](02-backup.md) | Every site in this round has a checked backup record taken on the digest it runs now |
| 03 | [Update Staging](03-update-staging.md) | Every staging instance on the pinned release, `verify-data` PASS, a republish looked at |
| 04 | [Update Production](04-update-production.md) | Owner said go; each production site updated, verified, admin login proven, one at a time |
| 05 | [Rollback](05-rollback.md) | Only when a step failed: previous digest running, data proven intact or restored |

## The state on 2026-09-23 (from `inventory.mjs`)

All 14 service instances run `ghcr.io/corebunch/instatic:latest`, unpinned. `latest` moved four
times under us, so every redeploy (a variable change, a restart, a clone) was a silent upgrade and
the sites now run four different releases:

| Release | Digest | Instances |
| --- | --- | --- |
| 0.0.16 | `d940465d2b0f` | Mason Park production |
| 0.0.17 | `4da065ea9cbc` | Mason Park staging, Dr. Nahlah production and staging |
| 0.0.19 | `3877eb3c4d04` | IFA, Stone Surgical Arts, Stone Med Spa, West LA Implants (production) |
| 0.0.20 (newest) | `968134b6187c` | Brandklout production and staging, IFA, Stone Surgical Arts and Stone Med Spa staging, Mason Park Kids |

Four staging instances already run a newer release than their production, so every staging to
production push since mid September crossed releases. Pin first (step 03 and 04, `--pin-current`),
then upgrade on purpose.

## Where things live

- **Tools:** [`../tools/instatic-release/`](../tools/instatic-release/README.md) (`inventory`,
  `backup`, `update-image`, `verify-data`, `rollback`). They reuse `tools/instatic-site/ops/backup-site.mjs`,
  `tools/instatic-site/staging-clone/lib.mjs`, `tools/instatic-domain-origins/check-origins.mjs`.
- **Run from** the client folder (`deliver/brandklout/<client>/`) on the client's branch, so backups
  land in that client's `.tmp/instatic-release/` (gitignored). The inventory and the release
  assessment can run from the repo root.
- **Runbook:** one repo run per release round in `.claude/runbook/` (versions, sites, results), plus a
  short run in each client's `docs/runbook/` that names its backup folder and the digest before and after.

## Hard rules

- Never deploy `:latest`. Pin a version tag (or `@sha256:`), and record the digest before and after.
- No image change without a backup record taken on the digest that is running now (the tool refuses).
- Staging before production. Production only after the owner says go, one site at a time, stop on the
  first failure.
- Never patch or fork the Instatic image to fix a break. Fix it through a plugin, or wait for upstream.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../SYSTEM_RULES.md).
