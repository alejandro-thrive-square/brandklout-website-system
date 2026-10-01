# 2026-10-01 — "HIPAA Disclosure" in every footer, both instances

Follow-up to [`2026-10-01-hipaa-disclosure-page.md`](./2026-10-01-hipaa-disclosure-page.md): a footer link to
`/hipaa-disclosure` in the existing legal row, right after Privacy Policy, with the same markup and separator
as its neighbours. Footer link only.

## Done

- **There is no shared footer component** (`GET /components` → `[]`): every page row inlines its footer. So
  each row's `.footer_legal` was edited, nothing else. In each one the Privacy Policy link node and the
  separator text after it are **cloned** (new ids) and inserted after Privacy, so the new link has exactly
  that row's markup: `<a href="/hipaa-disclosure" target="_self">HIPAA Disclosure</a>`, punctuated `·` on the
  rebuilt pages and `|` on production's old rows. Tool: `.tmp/hipaa/add-footer-link.mjs` (dry run /
  `--apply --publish`, idempotent).
- **Staging:** 65 rows (backup `.tmp/backup-staging…2026-10-01T14-02-05.json`, seq 149 → 150, then the template
  repair below; published 14:02:35Z and 14:03:46Z).
- **Production:** 89 rows: 65 rebuilt pages (`·` row) and 24 old production-only pages (`|` row:
  "© 2026 … | phone | address | Privacy Policy | HIPAA Disclosure | Terms of Service"). The six root ad
  forwarders (`/invisalign`, `/new-patient-special` and their consultation/thank-you pages) have no footer and
  were skipped. Backup `.tmp/backup-www…2026-10-01T14-06-06.json`, seq 74 → 75, **one publish** (14:06:49Z).
- **Source:** the same link in the footer of all 231 `home/**/index.html` pages and in both footer generators
  (`prune-nav.mjs` `LEGAL`, `build-ads-landing-pages.mjs`), so a push chain keeps it. The blog and stamp
  generators copy the chrome from existing pages. `check.mjs`: 231 pages, 0 errors.
- Not touched: the `/ads-landing-pages/` pages' separate in-body `lp-legal_links` line (it is not the footer).

## Verified

- Both instances were draft == published before writing; no row outside the change set moved.
- **Every published URL** (`.tmp/hipaa/snapshot-site.mjs`: page rows + all 161 articles), normalised for the
  per-publish tokens and compared with a snapshot taken just before:
  - staging: 224/224 return 200, the link is in all 224, and every page is byte-identical once the link is removed;
  - production: 254/254 return 200, the link is in 248 (the 6 forwarders have no footer), and every page is identical once the link is removed.
  - `/hipaa-disclosure` returns 200 on both. The branded 404 (unmatched URLs return 404) carries the link too.
- Real Chrome, 1440 and 390, rebuilt and old-style footer: the row's height and line count are unchanged in every case
  (45px/2 lines at 1440; 87px/4 at 390; old row 109px/5 at 390), and "HIPAA Disclosure" never splits across
  lines. The only split link, "Privacy Policy" at 390, was split before too. No horizontal overflow.

## Gotchas

- **A site-document save drops template flags, even a footer-only incremental one.** On staging, `blog-article`
  and `404` were in the change set; after the publish **all 161 `/blog/<slug>` returned 404 for about a minute**
  (and the 404 template was gone) until `apply-blog-template.mjs` + `apply-404-template.mjs` restored the flags
  and staging was published a second time. `add-footer-link.mjs` now records each row's
  `templateEnabled/templateTarget/templatePriority` before the save and PATCHes them back before it publishes;
  production went through that path in a single publish with no gap. **Any tool that saves those two rows
  through site-document must do the same.**
- On production, Termly's `brandklout-consent-preferences.js` adds "Cookie Preferences" after the second legal
  link it recognises, and its list includes `hipaa`. So the row now reads **Privacy Policy · HIPAA Disclosure ·
  Cookie Preferences · Terms of Service** (it was Privacy · Terms · Cookie Preferences). The separators are right.
  To keep Cookie Preferences after Terms, change the shared consent kit, not this site.
- Screenshots of the footer need Termly's banner hidden (`#termly-code-snippet-support{display:none}`) or it
  covers the row.

## Version Control

This run file follows the runbook rules in [SYSTEM_RULES.md §5](../../../../../SYSTEM_RULES.md).
