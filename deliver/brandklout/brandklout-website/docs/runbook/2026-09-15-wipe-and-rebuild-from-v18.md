## 2026-09-15: wipe the instance blank, rebuild everything from v18 (seq 30)

Reported (Alejandro, after a call with Sang): "we want to wipe out everything on Instatic, leave it
blank, and re-upload everything based on the v18 version. Make sure it works properly."

### What "everything" meant, and what stayed

Wiped (new `21-instatic-upload/wipe-instance.mjs`, dry run then `--apply`): all 30 pages, the
style registry (2,267 rules), both code assets, the 7 site conditions, the 2 installed font
families (files + shell entries), all 28 media assets (trashed, then purged), the `legal` table
and its 3 rows, the one sample row in the system `posts` table, and the `brandklout.embed-origins`
plugin. The blank state was seq 28 with nothing left but the four system tables.
**Kept**: the two accounts (Alejandro, Sang), roles, the site name and settings. The blank state
was NOT published: the live site kept serving seq 27 until the rebuild published over it, and a
full publish swaps the whole slot, so nothing from before survives on the live side either.

### Backups before the wipe (all still there; the rollback path)

- git tag `brandklout-website-live-seq27` (d121d546).
- API snapshot `.tmp/backup-2026-09-15-seq27/` (site shell + 30 page rows + published HTML),
  `.tmp/plugin-settings-seq27.json`, `.tmp/media-backup-2026-09-15-seq27/` (all 28 files + list).
- Container: `/app/storage/backups/cms-2026-09-15-seq27-pre-wipe.db` (VACUUM INTO, 155MB) and
  `/app/storage/backups/uploads-2026-09-15-seq27-pre-wipe.tgz` (the media files, 5MB).

### Rebuild, in order (each step against the blank base)

1. `install-fonts.mjs --apply` — DM Sans + Manrope, 4 files each (seq 29).
2. `upload-media.mjs` — 22 images uploaded fresh (new ids; the three practice logos Sang had
   uploaded in the admin came from the local image cache, `.tmp/remote-images/bk-*`);
   `set-alt.mjs --apply` — 22 alt texts written.
3. Plugin: `deliver/process/18-instatic-embeds` `pack-plugin.mjs` + `install-plugin.mjs --apply`
   (**1.5.1**, this branch's source; 1.6.0 had been live — it only adds `siteScripts`, the
   accessibility-widget hook removed on 2026-09-15, and a CSP de-dupe for that case; 1.6.0 lives on
   `bk-alki-house`), then `.tmp/restore-plugin-settings.mjs` put back embedPolicy compatible,
   autoTrust on, frameOrigins YouTube (both hosts), connectOrigins sheetdb.io + formsubmit.co.
4. `build-import-input.mjs` (new media map) → `ship.sh` (0 warnings) → `push-site.mjs --apply
   --force` (saved seq 30, 30 pages, template flag + bindings) → `cms-sync.mjs --apply` (table
   `legal` + 3 rows published) → publish (30 pages).

No `prepare-source` / `class-system` rerun was needed: the local build from the v18 run is the
source; only ids on the instance changed.

### Gates on the rebuilt site

- `verify-live` FAIL none (32 routes, 214 asset references, 10 retired routes 404).
- Instance state check: 30 pages, 2,267 rules, 2 files, 7 conditions, breakpoints 1279/991/767/479,
  fonts DM Sans x4 + Manrope x4, 22 media, tables pages/posts/legal/components/layouts, legal rows
  3 published, plugin 1.5.1 enabled+active, users Alejandro + Sang, template page present.
- Home at 1440 eyeballed: Manrope/DM Sans loaded (7 faces), 23 images, none broken, slider and
  client strip intact.
- `css-parity` FAIL none; `visual-diff` 1440: index 0.133%, worst 0.271% (reputation-engine;
  authority-score, 1.894% on the seq 27 run, is no longer in the top three); `visual-diff 390`:
  index 0.268%, worst 0.335%; `form-probe`: the three forms post (aborted by the probe, as
  designed), the three legal entries read "Effective Date…", disc bullets, no draft note.

### Gotchas

- `DELETE /data/tables/:id` refuses while rows exist: delete the rows first. System tables cannot
  be deleted; the `posts` sample row can.
- `DELETE /media/:id` only trashes; `?purge=1` on the trashed asset removes the file.
- Zero pages is a valid site document in replace mode; nothing forces an index page to exist.
- The media list is `{ assets: [...] }`, not `items`.
- Install the plugin BEFORE `push-site`: the push preserves the shell's settings, and the Embed
  block on `/book` needs the module registered before the page is published.
- A freshly installed plugin has empty origins; settings are restored read-merge-write from the
  dump (`siteScripts` deliberately left out).

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../../SYSTEM_RULES.md).
