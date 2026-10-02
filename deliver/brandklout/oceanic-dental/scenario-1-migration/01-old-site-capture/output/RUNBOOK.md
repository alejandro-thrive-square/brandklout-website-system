# scenario-1-migration · 01-old-site-capture · runbook

Newest run first. Each run: date, what was done (with the commit), what is next, and the gotchas.

## 2026-10-02 · Scrape of all 106 pages, every asset, homepage screenshots

### Done

- `scrape_site.py`: 106/106 pages to `scrape/` (markdown, JSON, `site-data.json`, 243 media URLs).
- `extract_assets.py` + `catalogue_assets.py`: 782/783 assets, 171 MB, in `assets/` (gitignored, R2).
- `screenshot-pages.mjs` on the homepage: `screenshots/w1440/home.png`, `w390/home.png`, `pages/home.md`.
  Summary and client findings: `docs/migration/old-site-capture.md`.

### Next

- The rest of the checklist: every-page screenshots, mirror + scan, Wayback + URL inventory, email
  DNS, tracking, Webflow CMS CSV export, drive upload.

### Gotchas

- `extract_assets.py` found 0 pages on this Webflow site until given `--site-data scrape/site-data.json`
  (it only looked for `sitemap_index.xml`). Fixed on main the same day: it now finds `site-data.json`
  next to `--html-dir` and falls back to `sitemap.xml`.
- Phone numbers in the screenshots and `pages/home.md` are DNI-swapped; take them from `scrape/`.
- `capture.gitignore` was written for a `capture/` folder; this copy adds `scrape/html/` and `assets/`.

## Version Control

Follows [SYSTEM_RULES.md §5](../../../../../../SYSTEM_RULES.md).
