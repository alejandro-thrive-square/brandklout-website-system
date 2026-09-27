# 2026-09-16 — /customer-stories and /book emptied by "Restore version"; restored (seq 44)

## Asked

Sang (via Alejandro): "did you figure out what happened to this page? it disappeared from the
editor". The screenshot showed `/customer-stories` in the Pages list. Then Alejandro: restore it.

## Found

- `/customer-stories` **and** `/book` had no `body` (and no SEO cells) in the draft. Both were
  published blank (about 1.1 KB of HTML).
- Audit: Sang ran `version.restore` on customer-stories v13 at 12:12:12 UTC and on book v13 at
  12:34:54. Each page's collab doc was reset in that same second. He then unpublished, set to draft
  and republished customer-stories (12:45–12:56). Every site publish after that shipped both pages blank.
- Cause: `data_row_versions.cells_json` stores only `{title, slug}`, so any restore empties the page.
- Site snapshot `4IhX6gyIoZ-I-trrNrqtz` (11:57:43 UTC publish) still held both pages in full
  (357 and 174 nodes). All class ids still exist, and the class combinations match
  `class-site/*.html` exactly, so seq 42's tightening didn't affect them.

## Done

- Backups: `.tmp/backup-2026-09-16-pre-page-restore/` (API site + pages + HTML, seq 43) and
  `.tmp/backup-2026-09-16-snapshot-1157-lost-pages/pages.json` (the two pages from the snapshot).
- Commit `da9c9e6d`. `.tmp/restore-lost-pages.mjs --apply`: incremental save (seq 44). SEO title and description from
  `site-src/seo.json` went in by read-merge-write, and the read-back node counts matched.
  `--publish`: draft matched published beforehand, so only these two pages changed. The new
  snapshot differs from 23:14 only in these pages plus `updatedByUserId`. Shell identical.
- Live: `/customer-stories` 35.5 KB, `/book` 14.5 KB, content present.
- Directive `21-instatic-upload.md`: two new traps (restore version; empty page scope).

## Found on the way (NOT fixed — waiting for Alejandro)

- **`src/styles/site.css` (the code asset) loads on no page.** `site.runtime.styles` has
  `scope: {type:'pages', pageIds: []}`, first seen in Sang's 07:57:06 UTC publish (snapshot
  `TZODJCi09jeq1HT9zv0Ud`). Before that the entry was absent (= all pages). Missing everywhere
  since then: the house fluid root (1920+/≤479 sizing), the `@keyframes` and the Calendly shell rules.
  `verify-live` fails on it ("no userStyles stylesheet"), and did before this restore.
  Fix: delete that entry (or set `scope: {type:'all-pages'}`) in a shell save, then publish.
- The page `<meta name="description">` is the site default on every page, not the SEO cell.
  That was already true before this run (seq 27 backup too).

## Next

- Alejandro: approve the code-asset scope fix.
- Tell the team: don't use "Restore version" on pages.

## Gotchas

- Page versions don't hold content. Recover pages from `site_snapshots.site_json`
  (`json_extract` / `JSON.parse`, `pages[]` by id), read-only over `railway ssh`.
- Published CSS is generated from the snapshot on request. It isn't stored in
  `published_runtime_assets` or on the volume, so compare snapshots, not files.
- CSS hashes change when a page returns: Instatic emits only the rules pages use.
- The DB holds deleted rows from the seq 30 wipe with the same slugs (`deleted_at` set).
  Query by row id, not slug.
- The working tree already had 73 uncommitted build files (`class-site/`, `final-site/`,
  `site-src/`) before this run. They aren't from this run and weren't committed.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../../SYSTEM_RULES.md).
