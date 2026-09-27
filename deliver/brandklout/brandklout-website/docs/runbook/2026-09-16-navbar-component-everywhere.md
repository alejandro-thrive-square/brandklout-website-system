# 2026-09-16 — NavBar component on every page (seq 45)

## Asked

Alejandro: the nav bar differs between pages. Put the Instatic NavBar component on every page and
remove the old nav. Nav only. Don't re-push page code.

## Found

- Component `navbar` (`s3Y95a2nYC3qahyAIqw55`, `GET /admin/api/cms/components`). Sang last edited
  it 2026-09-16 12:51 UTC. A page uses it through a node
  `{moduleId:'base.visual-component-ref', props:{componentId, propOverrides:{}}}`.
- 7 pages already used it (index, guarantee, authority-score, ava story, dental-implant,
  ai-growth-engine, ai-search-authority). 23 still had the old `<nav aria-label="Primary">`
  (17 nodes, `body[1]`). authority-score's "Assessment sections" nav is a different element and was left alone.
- The component has **"Stories" and the "Menu" button set to `hidden: true`** (Sang's edit). At
  ≤991px `.nav-links-box` is `display:none` until Menu adds `.open`, so on tablets and phones
  the links can't be opened. That was already true on Sang's 7 pages; now it's every page.

## Done

- Backup: `.tmp/backup-2026-09-16-pre-navbar-component/` (site + all 30 full rows + component).
- Commit `4f96cdf7`. `.tmp/navbar-component.mjs --apply`: on the 23 pages, the old nav subtree was removed and a
  component ref put at the same index. No other node was touched. SEO cells were read, then written
  back by read-merge-write, and all read-backs were ok. The legal template stayed a template. Saved seq 45, then `--publish`.
  Draft matched published before the save.
- Live: all 29 routes return 200 with exactly one Primary nav, and every one includes "Growth System".
- Nothing re-pushed: no shell, CSS or other content change.

## Next

- Alejandro/Sang: unhide "Menu" in the component (and "Stories", if wanted), or phones and
  tablets have no nav. It's one component edit, and it applies to all pages.
- Still open from the restore run: the code asset scoped to no pages.

## Gotchas

- **`site-document` page saves drop SEO cells**: always read-merge-write them afterwards (the script does).
- Components aren't in `GET /site`. They're rows of the `components` table (`/admin/api/cms/components`).
- `hidden: true` on a node removes it from the published HTML entirely, at every width.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../../SYSTEM_RULES.md).
