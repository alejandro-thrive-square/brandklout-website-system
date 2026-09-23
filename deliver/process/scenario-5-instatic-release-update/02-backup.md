# Scenario 5 · 02 Backup

## Purpose

A full, checked backup of every instance in the round, taken right before its image changes, so
any failure is one command away from where we started. Admin edits live only in the database; a
git tag covers our source and nothing else.

## Inputs

- The round plan from step 01.
- Credentials for each site in `~/.webzite/.env`; `railway` CLI logged in.
- Nobody editing in the admin on that site (ask the team; a deploy drops unsaved editor state).

## Checklist

- [ ] Volume attached at `/app/storage` (else stop)
- [ ] Database facts read: migrations, row counts, quick_check ok
- [ ] Unpublished drafts noted
- [ ] API snapshot: shell, pages, published HTML, plugins, media
- [ ] `VACUUM INTO` copy on the volume, integrity ok, row count matches
- [ ] Uploads tar on the volume
- [ ] Running image and digest recorded
- [ ] Git tag of the client state

## Steps

1. **From the client folder**, per instance:
   `node ../../process/tools/instatic-release/backup.mjs --site <section> --env staging` (plan only),
   then the same with `--apply --label pre-<version>`. For production add `--railway-backup`.
2. **What `--apply` does**, in order, and stops on the first problem:
   - `record.json`: project, environment, service ids, image ref, **running digest and its release**,
     deployment id, volume id, `PUBLIC_ORIGIN`, base URL. This is what rollback restores.
   - `db-before.json`: `schema_migrations`, counts (`data_rows`, `media_assets`, `installed_plugins`,
     `users`, `site_snapshots`), `quick_check`, free space. Opened readonly over `railway ssh`.
   - `api/`: `tools/instatic-site/ops/backup-site.mjs` (shell, every page row, each route's published
     HTML, `seq`) plus `plugins.json` (ids, versions, settings), `media.json`, `publish-status.json`.
   - `VACUUM INTO /app/storage/backups/cms-<stamp>-<label>.db` with bun (the container has no
     `sqlite3`), then `integrity_check` on the copy and its row count against the live DB.
   - `tar czf /app/storage/backups/uploads-<stamp>-<label>.tgz` of `/app/storage/uploads` (media and
     plugin code; plugins are not in the DB).
   - `--railway-backup`: a native Railway volume backup, the only copy that survives losing the volume.
   - `--download`: pulls the DB copy to this machine and checks its sha256.
3. **Git tag** the client's current state as the tool prints it
   (`git tag instatic-<client>-<env>-pre-<version>-<date>`) and push it with the branch.
4. **Note `seq`.** Check it again right before step 03 or 04. A new `seq` means someone edited since the
   backup: back up again.
5. **Pending drafts.** If `publish-status` says the draft does not match the published site, write it in
   the runbook and tell the owner. The update itself does not publish, but step 03's republish would.

## Conditionals

- **If there is no volume at `/app/storage`:** the tool refuses. Nothing else in this scenario may run
  on that instance until the volume exists and the site is rebuilt or restored onto it.
- **If the volume has less free space than twice the DB:** the tool refuses. Run
  `tools/instatic-api-sync/prune-versions.mjs` (keep 3) first; Instatic never prunes publish history.
- **If `quick_check` is not ok:** stop. The database is already damaged; escalate before any update.
- **If the site has pending drafts:** back up anyway, and do not republish that site in step 03 or 04
  without the owner's go.
- **If a login fails:** stop after the first failure; five failures lock the account.

## Do / Don't

- Do take the backup immediately before the change, on the digest that is running now.
- Don't `cp cms.db`. Recent writes sit in `cms.db-wal`; only `VACUUM INTO` gives a consistent copy.
- Don't keep the only copy in `/tmp`; a restart wipes it. `/app/storage/backups/` is on the volume.
- Don't rely on Instatic's page "Restore version": page versions hold only title and slug.

## Tools

- `tools/instatic-release/backup.mjs`: record, DB facts, API snapshot, `VACUUM INTO`, uploads tar,
  optional Railway volume backup and download. Dry by default; `--snapshot` is read only.
- `tools/instatic-site/ops/backup-site.mjs`: the API snapshot it runs.
- `tools/instatic-api-sync/prune-versions.mjs`: free the volume first when it is too full.

## Outputs

- `deliver/brandklout/<client>/.tmp/instatic-release/<stamp>-backup-<project>-<env>/` (`record.json`,
  `db-before.json`, `db-copy.json`, `api/`)
- `/app/storage/backups/cms-<stamp>-<label>.db` and `uploads-<stamp>-<label>.tgz` on the volume
- Git tag `instatic-<client>-<env>-pre-<version>-<date>`

## Evidence

bk-brandklout-website 2026-09-14 v16 published (three backups, `seq` checked twice), 2026-09-15 wipe
and rebuild (VACUUM INTO plus uploads tar plus plugin settings), 2026-09-16 Restore version emptied
pages; bk-dr-nahlah 2026-08-18 volume bloat (VACUUM needs a full-size copy, writes fail silently near
90%, `/tmp` copy lost on redeploy); bk-stone-med-spa 2026-09-17 production push (backup first); repo
2026-09-18 full backup; inventory 2026-09-23 (native Railway volume backups exist on only 4 of 14
volumes). Memory: instatic-db-backup-vacuum-into, instatic-restore-version-empties-page.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../SYSTEM_RULES.md).
