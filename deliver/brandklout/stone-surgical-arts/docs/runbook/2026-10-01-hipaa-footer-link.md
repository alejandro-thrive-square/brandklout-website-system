# 2026-10-01, later — HIPAA Disclosure linked in the footer legal row (55 pages, both hosts)

## Done

- The footer's legal row (`.footer_legal`) now reads `© … | Privacy Policy | HIPAA Disclosure |
  Terms of Service | SMS Terms` on **every page** of staging and production. Production also shows the
  runtime-inserted Cookie Preferences control after HIPAA Disclosure (Termly preferences script).
- How: `workflows/21-instatic-upload/add-hipaa-footer-link.mjs`. The footer is inlined in every page
  row (no shared component on this site), so the script clones each page's own Privacy Policy
  `base.link` (it has no class; same `target` and attributes), retargets it to `/hipaa-disclosure`,
  inserts it right after, and writes all 55 rows in ONE incremental `PUT /site-document` with every
  row's `seq` in `baseSeqs`; then re-applies `seoTitle`/`seoDescription` (dropped by that write) and
  publishes once per host. Backups: `.tmp/backup-<host>-2026-10-01T14-0*-pre-hipaa-footer.json`.
- **Fixed on the way:** `/hipaa-disclosure` had inherited `aria-current="page"` on its footer Privacy
  Policy link (it was cloned from `/privacy-policy`). It now sits on its own HIPAA Disclosure link.
- Source: `site-src/partials/footer.html` carries
  `<a href="hipaa-disclosure.html"{{CUR_HIPAA_DISCLOSURE}}>HIPAA Disclosure</a>` after Privacy Policy,
  so a full push keeps it. Not built (other agents' work in the tree).

## Verified

- Draft == published on both hosts before writing (55/55); 55/55 rows read back with the link right
  after Privacy Policy and SEO cells intact.
- For every page on both hosts: the published HTML after the publish, minus the one new `<a>` (and on
  `/hipaa-disclosure` the aria-current move), equals the baseline byte for byte, after normalising the
  per-publish tokens (runtime asset folder ids, `module-js ?v=N`, Cloudflare `data-cfemail`). All 55
  pages 200, `/hipaa-disclosure` 200.
- Headless Chrome at 1440 and 390 on `/`, `/blog`, `/hipaa-disclosure`, both hosts: no link wraps
  internally, no horizontal overflow, the new link computes the same font, colour and decoration as
  Privacy Policy. 1440: one line. 390: three centred lines (copyright / Privacy · HIPAA · Terms /
  SMS Terms), the row's normal `flex-wrap`.

## Gotchas

- A site-document page write drops `seoTitle`/`seoDescription`; every multi-page script here must
  re-apply them (this one does, by full-cells PATCH).
- A page built by cloning another inherits that page's `aria-current` footer link.
- Production screenshots are covered by the Termly banner on a fresh profile; staging shows none.

## Next

- Nothing for this change. The Terms/Privacy "available at our office and on request" wording could
  now link to the page (not done, not asked).
