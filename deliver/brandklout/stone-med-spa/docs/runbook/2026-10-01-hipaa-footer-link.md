# 2026-10-01, latest — "HIPAA Disclosure" in the footer's legal row, staging and production

This follows the `/hipaa-disclosure` injection ([run](./2026-10-01-hipaa-disclosure-page.md)). The task was a footer link right after
Privacy Policy, using the same markup as its neighbours, on every page. No other edits.

## Done

- The site has **no shared footer component** (`explorer.components` is empty). The footer is inlined on
  each page. The new **`05-instatic-upload/add-hipaa-footer-link.mjs`** therefore edits just the legal row
  (`.footer_legal`) on every page. On each page it clones that page's own Privacy Policy link node (same
  module, classes, `target`), sets `href` to `/hipaa-disclosure`, and places it right after Privacy. `aria-current="page"` is set only on
  `/hipaa-disclosure` itself, which is what `build-site.mjs`'s `{{CUR_*}}` does for the other two. The row
  has no separator glyphs; `.footer_legal` spaces its items with flex `gap`.
  It makes one incremental save of all 27 pages with baseSeqs, then **re-applies seoTitle/seoDescription per row**
  (the save drops them), with node counts checked. The publish guard is the same as before: the draft must match live before
  the write, the shell seq must be unchanged, and no row may move beyond our save.
- **Staging:** shell seq 24 is unchanged, pages saved at seq 27, `{"publishedPages":27}`. **Production:** shell seq 28 is unchanged,
  pages saved at seq 30, `{"publishedPages":27}`. Backups are in
  `.tmp/backup-{staging,prod}-2026-10-01*-pre-hipaa-footer/`.
- **Site source:** `site-src/partials/footer.html` gains
  `<a href="hipaa-disclosure.html"{{CUR_HIPAA_DISCLOSURE}}>HIPAA Disclosure</a>`. `build-import-input.mjs`
  rewrites any `x.html` to `/x`, so a full push emits `/hipaa-disclosure`. `final-site/*.html` was rebuilt
  (26 pages, footer lines only).

## Verified

- On both hosts, all 27 published pages (full bodies saved before and after) contain exactly one link,
  in the order Privacy Policy → HIPAA Disclosure → Terms of Service. Each page is otherwise **identical** once that anchor is removed and
  the per-publish tokens (`/_instatic/assets/<id>/`, `?v=N`) are normalised. `aria-current` is correct. `/hipaa-disclosure`
  returns 200.
- **Geometry on `/about`:** at 1440 everything sits on one line, 53px row, on both hosts. At 390 on production, Termly's runtime Cookie
  Preferences link adds a fourth item, giving © / Privacy · HIPAA · Cookie Preferences / Terms of Service, three centred lines,
  106px. On staging there is no Termly, giving two lines, 79px. Every item is 20px tall, so no link breaks inside, and there is no horizontal overflow.
  The extra line at 390 is the row's own `flex-wrap` making room for a fourth item.

## Next

- `final-site/assets/site.css` is stale against `site-src` (the 2026-10-01 review-panel padding from
  `b8a9a12d` was never rebuilt into it). It was left out of this commit, so it can be rebuilt and committed separately.
- The sitemap still lacks `/hipaa-disclosure` (see the page run).

## Gotchas

1. **The source footer now links a page that exists only on the instances.** A local `final-site`
   preview 404s on it, and a full `push-site.mjs` (replace) deletes the page while keeping the link.
   After any full push, re-run `add-hipaa-page.mjs --apply --publish`, then check the link resolves.
2. **Rebuilding `final-site` picks up unrelated source drift** (here, `site.css`). Diff before
   committing and keep only your own lines.
3. A raw-HTML matcher for a link must not assume attribute order: Instatic emits
   `aria-current` **before** `href`.

## Version Control

Tracked runbook, per [SYSTEM_RULES.md §5](../../../../../SYSTEM_RULES.md). Committed with the work it describes. Not pushed and not merged.
