## Latest completed: Instatic on Railway — volume bloat diagnosed & pruned (2026-08-18)

**Symptom** was "Instatic/the MCP is broken": code assets applied on create but vanished on overwrite,
large payloads silently failed to land, publishes flapped. **Root cause was disk, not the MCP.**

Instatic is self-hosted on Railway (workspace/project `Brandklout` → service `Dr Nahlah`,
`ghcr.io/corebunch/instatic:latest`, `https://encorercm.com`, volume `/app/storage` 500 MB).
Instatic writes a ~5 MB `site_snapshots` row **and** a full copy of every `published_runtime_assets`
row on every publish, keyed to the version, and **never prunes** — `server/publish/publishRow.ts` has
no retention logic at all. 26 pages had accumulated 468 versions / 30,140 asset rows / a 200 MB `cms.db`
on a 434 MB volume at 90% full. At that fill level writes fail **silently** — `railway logs --http`
showed a 0.0% error rate the whole time.

**Fix applied (keep 3 versions/page): `cms.db` 200 MB → 36.5 MB, volume 90% → 47%.**
Deleted 24,419 stale runtime assets, 390 versions, 15 orphaned snapshots; `integrity_check: ok`,
0 FK violations; `/`, `/veneers`, `/dental-implants`, `/sedation-dentistry` all verified 200.
Verified backup at `_railway-backups/cms-backup-2026-08-18.db` (207,564,800 b, sha256
`dd7461a4d89fff8588d4bf70d14aaadc9bffffccafa2f488b97e2826a21d08b7`) — outside the repo, do not commit.
On-box copy at `/tmp/cms-backup.db` (lost on redeploy).

### Gotchas
- **`VACUUM` alone reclaims nothing** here — freelist was 1 MB; the space was live rows. Delete first.
- **`VACUUM` needs a full-size copy** and the volume had 45 MB free. `SQLITE_TMPDIR=/tmp TMPDIR=/tmp`
  puts the temp file on the container overlay (1.8 TB free). Ran in 1.1 s.
- **Batch the deletes** (500 rows + `PRAGMA wal_checkpoint(TRUNCATE)` between) or the WAL outgrows the
  free space and fills the disk while you are trying to empty it.
- Container has **no `sqlite3` and no real Node** — `node` is Bun 1.3, so use `bun:sqlite`
  (`node:sqlite` will not resolve). Ship scripts via `base64 -w0` then `base64 -d` over ssh.
- **The `railway` CLI needs Windows paths**; a `~/.ssh/...` style path fails with "Key not found".
- **`railway ssh` prints a banner, so it corrupts binary output**; use raw `ssh` for `cat file > local`.
- First connect needs `ssh -o StrictHostKeyChecking=accept-new` against `ssh.railway.com`.
- **Railway has no volume-resize API** — `VolumeInstanceUpdateInput` is only mountPath/serviceId/state.
  Growing the volume is dashboard-only.
- 6 pages show 0 versions (`about`, `contact`, `all-on-4`, `cosmetic-dentistry`, `emergency-dentistry`,
  `unused-placeholder`) — **pre-existing unpublished drafts, confirmed against the backup**, not prune damage.

### Still open
- **Volume still 500 MB** — grow it in the Railway dashboard (Service → Volume). No API for it.
- **No retention policy exists** — bloat returns with every publish. Needs a scheduled prune or an
  upstream issue at `github.com/corebunch/instatic`.
- **`/admin/api/cms/site-socket` 403 loop** (every ~31 s, 130 of 1.8K requests) — separate, unresolved.
  Quiet now only because no admin tab is polling; reproduce with the editor open.
- `about` and `contact` being unpublished drafts may itself be wrong — worth checking.
