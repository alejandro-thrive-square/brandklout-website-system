# Scenario 5 · 01 Assess the Release

## Purpose

Know what the new release changes and what every site runs today, before anything is touched.
The output is a short go / wait decision the owner agrees to, and the list of sites in this round.

## Inputs

- The target release (a version tag such as `0.0.21`), or "the newest".
- Railway CLI logged in (`railway whoami`); the tools read `~/.railway/config.json` `user.accessToken`.
- `~/.brandklout/.env` with a section per site (credentials for the API snapshot later).

## Checklist

- [ ] Inventory saved: image, digest, release per site and environment
- [ ] Changelog read from the current release up to the target
- [ ] Database migrations listed
- [ ] Plugin API changes checked against our plugins
- [ ] Breaking changes and fixes that affect us noted
- [ ] Round planned: which sites, staging order, production order
- [ ] Owner agreed: go, or wait

## Steps

1. **Inventory.** `node deliver/process/tools/instatic-release/inventory.mjs --origins`. It lists every
   service in the Railway workspace (not only `sites.json`), maps each running digest to its ghcr version
   and flags `UNPINNED`, `NO-VOLUME`, `DRIFT`, `VOLUME>80%`, `NOT-REGISTERED`, `NO-CREDS`. Keep the JSON
   it writes; it is the "before" of this round.
2. **Stop on NO-VOLUME.** A service with no volume at `/app/storage` loses its whole site on the next
   deploy. Fix that first (`volumeCreate`, then `PUBLIC_ORIGIN`, then redeploy), outside this scenario.
3. **Read the changelog** for every release between the oldest one running and the target:
   `https://github.com/corebunch/instatic/releases` and `CHANGELOG.md` at the target tag. Note fixes we
   were waiting for and anything marked breaking. The project is pre-1.0: breaking changes can land in
   any patch release.
4. **List the migrations.** Compare tags on GitHub
   (`/repos/corebunch/instatic/compare/v<from>...v<to>`) and open `server/db/migrations-sqlite.ts`. Each
   migration has an id (`030_iso_timestamps`) and runs once at boot, inside a transaction, recorded in
   `schema_migrations`. Mark each one **additive** (new table or column) or **rewriting** (changes
   existing rows or rebuilds a table). A rewriting migration makes the image rollback alone unsafe; see
   step 05.
5. **Plugin API.** In the same compare, read the files under `server/plugins/host/`,
   `server/handlers/cms/plugins/`, `docs/features/plugin-system.md` and any `plugin-sdk` change. Check our plugins:
   `brandklout.embed-origins`, `aeo-schema`, `open-graph`, and any client-only plugin (see each site's
   plugin list in the backup). Look for renamed hooks, new permission names, changed `definePlugin`
   config, and CSP changes (newer releases publish `script-src 'self'`).
6. **Publisher changes.** Anything about CSS pruning, CSP, image `sizes`, script loading or SEO fields
   changes the published HTML on the next publish, not on the image change. Note them; step 03
   republishes staging to see them.
7. **Plan the round.** Staging instances first, in any order. Production after, lowest risk first (a
   site with no pending client work), the most visible site last. Leave out any site mid-launch or mid
   BugHerd round.
8. **Decide with the owner.** Post the summary: target release, what it fixes, migrations (additive or
   rewriting), plugin risk, the order. Go, or wait for the next release.

## Conditionals

- **If a migration rewrites existing rows** (0.0.20's `030_iso_timestamps` rewrites every timestamp
  column): the backup's `VACUUM INTO` copy is the only way back to the old release. Say so in the plan.
- **If the plugin API changed:** mark the plugin as "reinstall or upgrade on staging" and prepare the
  new package (`tools/instatic-plugins/plugins.mjs test` then `pack`) before step 03.
- **If staging already runs a newer release than production:** that is the `latest` drift. Treat the
  production update as a real upgrade across every release in between, not a no-op.
- **If the target release only exists as `latest`:** wait for the version tag; never deploy `latest`.

## Do / Don't

- Do read the migrations, not only the release notes; the notes do not say which changes are one way.
- Don't upgrade because a release exists. Upgrade for a fix or feature we need, or to pin.
- Don't plan to patch the image if a plugin breaks; plan a plugin fix or wait.

## Tools

- `tools/instatic-release/inventory.mjs`: every service, image, digest, release, volume, flags (read only).
  `--origins` adds `PUBLIC_ORIGIN`, `--db` adds cms.db facts over `railway ssh`.
- GitHub: releases, `CHANGELOG.md`, the compare API for migrations and plugin SDK changes.

## Outputs

- `output/instatic-release/<stamp>-inventory.json` (repo root)
- `.claude/runbook/YYYY-MM-DD-instatic-<version>-release.md` opened with the plan and the owner's answer

## Evidence

Repo runbook 2026-08-28 both Instatic admins fixed (`latest` equals 0.0.16 "is luck", pin by digest);
inventory run 2026-09-23 (four releases in use, all `:latest`); upstream CHANGELOG 0.0.20 and
`migrations-sqlite.ts` (027 to 030); repo 2026-09-18 Gage/Jessica accounts (a staging site is not
always a `staging` environment: Mason Park Kids); memory: prefer plugins over patching vendor builds,
Instatic CSP blocks third-party scripts.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../SYSTEM_RULES.md).
