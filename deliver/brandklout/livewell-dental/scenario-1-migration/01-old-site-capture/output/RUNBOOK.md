# scenario-1-migration · 01-old-site-capture · runbook

Newest run first. Each run: date, what was done (with the commit), what is next, and the gotchas.

## 2026-10-01 · Scrape of all 60 pages, homepage screenshots

### Done

- `scrape_site.py`: 60/60 pages to `scrape/` (markdown, JSON, `site-data.json`, 517 media URLs).
- `screenshot-pages.mjs` on the homepage only: `screenshots/w1440/home.png`, `w390/home.png`, rendered
  text `screenshots/pages/home.md`. Summary: `docs/migration/old-site-capture.md`.

### Next

- The rest of the checklist: every-page screenshots, assets, mirror + scan, Wayback + URL inventory,
  email DNS, tracking, Webflow CMS CSV export, drive upload.

### Gotchas

- `scrape/html/` (5.8 MB raw HTML) is gitignored here; re-scrape or pull it from R2.
- The ReputationHub widget's server page lists eight reviews with full text; the homepage quotes in
  the deck come from there.

## Version Control

Follows [SYSTEM_RULES.md §5](../../../../../../SYSTEM_RULES.md).
