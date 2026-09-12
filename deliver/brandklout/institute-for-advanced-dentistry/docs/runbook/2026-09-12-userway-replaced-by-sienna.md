## 2026-09-12: UserWay removed, Sienna is IFA's accessibility widget

### Done

- Sienna now reaches every Instatic site through `brandklout.embed-origins` 1.6.0 `siteScripts`
  (see main's `.claude/runbook/2026-09-12-sienna-accessibility-on-every-instatic-site.md`). On IFA
  that put **two widgets** in the bottom-left corner, because the WordPress clone was still
  replaying UserWay (account `GXP9ESQoa0`).
- The UserWay loader was registry item `aWbk_r8s8t` in the `src/scripts/site.js` shell asset,
  referenced from all 59 pages. Its code is now a comment. The id stays in the dictionary, so no
  page write was needed and every `data-wz-head` list still resolves.
- The accessibility statement read "with the assistance of UserWay Accessibility." It now reads
  "with the assistance of the accessibility menu available on every page of this site." The row
  was patched with its cells spread, so `seoTitle`, `seoDescription` and `slug` are unchanged (checked).
- The draft matched live before the edit, so only these two changes shipped (published at
  04:35Z). Live checks: the bundle `site-QERXD5UG.js` has no `cdn.userway.org`; headless Chrome
  finds 1 `asw-container` and 0 UserWay elements; the screenshot shows a single button.
- Source: `prepare-wp.mjs` now skips any script mentioning `cdn.userway.org`, with the reason in
  `skipped`, so a rebuild cannot bring it back.

### Gotchas

- **The page HTML does not show the site's third-party widgets.** They are injected at runtime
  from the `site.js` registry. Grep the shell asset (or the published `site-*.js` bundle) for a
  vendor, not the page. That is why the pre-rollout check missed UserWay.
- **The statement text came from the WordPress scrape.** Re-running the page import from
  `current-site-scrape` would restore the UserWay sentence. Fix the text in the import, or re-apply it.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../../SYSTEM_RULES.md).
