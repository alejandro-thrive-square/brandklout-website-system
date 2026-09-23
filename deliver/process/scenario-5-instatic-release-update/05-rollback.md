# Scenario 5 · 05 Rollback

## Purpose

Put a site back on the release it ran before, fast, and only touch its data if the data itself is
damaged. Most failures are code (a plugin, the editor, the publisher); the volume is untouched and
the image rollback alone fixes them.

## Inputs

- The backup folder from step 02 for this site (`record.json` holds the previous digest and release).
- The failing `update.json` or `verify.json`.

## Checklist

- [ ] Round stopped, no other site touched
- [ ] Previous digest read from the backup record
- [ ] Image back on the previous release, deployment SUCCESS, digest proven
- [ ] Data checked: counts, quick_check, pages, media
- [ ] DB restored only if damaged
- [ ] `verify-data` PASS against the backup
- [ ] Owner told what failed and what was lost, if anything

## Steps

1. **Stop.** No further updates in this round until the cause is known.
2. **Dry run.** `node ../../process/tools/instatic-release/rollback.mjs --backup <dir>`. It shows the image it
   will set: the recorded release tag (never `latest`), or `image@sha256:` when the digest has no tag.
3. **Image back.** Same with `--apply`. It deploys, waits, and proves the running digest equals the
   recorded one.
4. **Prove whether the data is damaged.** `verify-data.mjs --backup <dir> --db`. Damaged means: `quick_check`
   not ok, fewer page rows, data rows, tables, media or users than before, a page body gone, or a site
   `seq` that moved when nobody edited. Different published HTML or a plugin error is **not** data damage.
5. **Restore the database only if damaged.** `rollback.mjs --backup <dir> --apply --restore-db`. It refuses
   when the live DB looks intact (`--force-restore` overrides; write why). It checks the copy's
   integrity, stages it as `cms.db.new`, removes `cms.db`, `-wal` and `-shm`, moves the copy in, and
   restarts the service so the server opens the restored file. Edits made after the backup are lost; the
   backup's `seq` tells you whether there were any.
6. **Uploads.** If media or plugin files are missing, untar `/app/storage/backups/uploads-<stamp>.tgz`
   over `/app/storage` from `railway ssh`. If the volume itself is lost, restore the Railway volume backup
   from the dashboard (`volumeInstanceBackupRestore`).
7. **Verify again** and run `check-origins`. Then the runbook: what failed, the evidence, what was
   restored, what the owner was told.

## Conditionals

- **If the new release ran a migration that rewrites rows** (0.0.20's `030_iso_timestamps`): the old
  image now runs on a newer schema. If it boots and `verify-data` passes, keep it and plan a forward fix.
  If it fails to boot or data looks wrong, restore the `VACUUM INTO` copy (step 5): that copy has the old
  schema.
- **If a plugin broke on the new API:** the image rollback is enough; the plugin files and settings are on
  the volume. Fix the plugin, then try the round again.
- **If the site had pending unpublished drafts:** they are in the database. An image rollback keeps them;
  a DB restore keeps only what the backup had.
- **If the environment has no volume:** there is nothing to roll back to in the container. Restore from
  the API snapshot and the downloaded DB copy onto a new volume.
- **If the recorded digest was `latest`:** the tool pins its release tag instead, so `latest` cannot move
  the site forward again.

## Do / Don't

- Do roll the image back first and the data second; an old binary must boot on the old schema.
- Don't restore the database just to be safe. It throws away every edit since the backup.
- Don't use Railway's "redeploy from source" or set `:latest` to roll back; both pull the newest release.

## Tools

- `tools/instatic-release/rollback.mjs`: image to the recorded release; `--restore-db` swaps the copy in.
- `tools/instatic-release/verify-data.mjs`: proves whether data changed.
- `tools/instatic-api-sync/prune-versions.mjs`: the swap pattern `rollback.mjs` follows.
- Railway dashboard: volume backups, deployment history.

## Outputs

- `.tmp/instatic-release/<stamp>-rollback-<project>-<env>/rollback.json`
- Client runbook run, repo round runbook updated with the failure

## Evidence

bk-dr-nahlah 2026-08-18 volume bloat and the 2026-08-21 prune swap (`rm cms.db` frees nothing while the
server holds it; copy first, restart after; plain redeploy, never from source); bk-brandklout-website
2026-09-14 (restore: stop, copy over `cms.db`, delete `-wal`/`-shm`, start), 2026-09-16 Restore version
emptied pages (recovered from `site_snapshots`); upstream `runMigrations.ts` (each migration in one
transaction, recorded in `schema_migrations`). Memory: instatic-db-backup-vacuum-into.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../SYSTEM_RULES.md).
