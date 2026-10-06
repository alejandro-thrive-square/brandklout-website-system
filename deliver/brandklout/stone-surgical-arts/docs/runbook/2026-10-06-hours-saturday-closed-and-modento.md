# 2026-10-06 — Saturday closed (Mon–Fri 9–5) and "Book online" (Modento) in the footer, staging + production

The ask (Jessica, for the client): "update the hours on her Westlake and Stone Surgical Arts site to be
M-F 9am - 5pm" and "add this link on those sites as well: https://book.modento.io/stonesurgicalarts/patient-details".
Both Stone sites were done in one session; Westlake Medical Aesthetics is in bk-stone-med-spa's runbook.

This site already read Mon–Fri 9–5 with **Saturday by appointment**; the user's call: Saturday closed.
`/book` already linked Modento three times ("Pick a slot online", the form note, the "Book online"
button); the user chose to add it to the footer of every page as well.

## Done

- Footer hours table, all 55 pages: Saturday `By appointment` → `Closed`.
- "Hours" fact (8 on 7 pages: `/`, `/about`, `/book` ×2, `/blepharoplasty`, `/face-and-neck-lift`,
  `/myellevate-neck-lift`, `/neck-lift`): `Saturday by appointment` → `Closed on weekends`.
- Footer page list (`nav[aria-label=Footer]`), all 55 pages: **Book online** → Modento, right after
  "Book a consultation", a clone of that link (same class, `aria-current` dropped). Same tab.
- New `21-instatic-upload/set-hours-modento.mjs` (dry run / `--apply` / `--publish`, backup, one
  incremental save, SEO cells re-applied, guard). Idempotent.
- Local source: `partials/footer.html` (Saturday, the link, the NAP comment), the eight facts in
  `pages/*.body.html`; `seo.json` already said Mon–Fri 09:00–17:00. `final-site` rebuilt — which also
  brought in the HIPAA footer link the built copy never got on 2026-10-01 (source and live had it).
- **STAGING** published (`{"publishedPages":55}`), checked, then **PRODUCTION** published
  (`{"publishedPages":55}`). Backups `.tmp/backup-staging-2026-10-06211201-seq15-pre-hours-modento`,
  `.tmp/backup-prod-2026-10-06211458-seq40-pre-hours-modento`.

## Verified live

Footer reads Mon – Fri 9:00 – 5:00 / Saturday Closed / Sunday Closed; "Book online" after "Book a
consultation" (screenshot 1440 + 390); facts read "Closed on weekends"; `<title>`, meta description
and og:description identical to before; GHL `check-embed.mjs` ok. No template rows or slash slugs on
either instance, so the site-document save could not drop template flags.

## Next

- Tell Jessica: Surgical Arts already had M–F 9–5 and Modento on /book; Saturday is now closed and the
  link is in every footer.

## Gotchas

- The first `/book` link found by a naive search is the **Primary** nav; the footer list is the nav
  with `aria-label="Footer"`. Target it explicitly.
- `final-site` had drifted from `site-src` (HIPAA link); rebuild after any source change.

## Version Control

Tracked. Committed with the work it describes.
