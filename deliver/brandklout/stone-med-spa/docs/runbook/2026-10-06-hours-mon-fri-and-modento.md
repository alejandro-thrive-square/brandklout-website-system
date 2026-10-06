# 2026-10-06 — Hours Mon–Fri 9–5 and a Modento "Book online" line on /book, production

The ask (Jessica, for the client): "update the hours on her Westlake and Stone Surgical Arts site to be
M-F 9am - 5pm" and "add this link on those sites as well: https://book.modento.io/stonesurgicalarts/patient-details".
Both Stone sites were done in one session; Surgical Arts is in bk-stone's runbook, same date.

The link is Dental Intelligence (Modento) **online booking** for Stone Surgical Arts' account, not
a patient-forms page. Placement was the user's choice: on /book, beside the form; the GHL form stays the
main contact point.

## Done (production published, staging draft only)

- **Hours** were Mon & Tue 9–5, Wed 9–3, Thu 9–5, Fri 9–4, weekend closed.
  - Footer table, all 27 pages: Wed and Fri now `9:00AM – 5:00PM` (the seven-row table stays).
  - "Hours" fact on `/`, `/about`, `/book`: `Mon – Fri: 9:00 AM – 5:00 PM` / `Sat & Sun: Closed`.
- **/book**: "Prefer to pick a time yourself? **Book online**." between the form title and the GHL
  form — a clone of the privacy note under the form (class `form_privacy`), the link with
  `text-style-link` (underlined). Same tab.
- New `05-instatic-upload/set-hours-modento.mjs` (dry run / `--apply` / `--publish`, backup, one
  incremental save, SEO cells re-applied, guard). Idempotent.
- Local source: `partials/footer.html`, `pages/{home,about,book}.body.html`, `seo.json`
  (openingHoursSpecification → Mon–Fri 09:00–17:00); `final-site` rebuilt.
- **PRODUCTION** published twice (`{"publishedPages":27}` each): the change, then the link class.
  Backups `.tmp/backup-prod-2026-10-06211359-seq31-pre-hours-modento` and `…211952…`.
- **STAGING draft only** (save seq 34, 35): its draft still holds unpublished edits from before
  (see the GHL lazy run, same day), so it was not published.

## Verified live

Every page's footer and the three facts read the new hours (no 3:00/4:00 PM anywhere); `<title>`,
meta description and og:description identical to before; `/book` line sits directly before the form,
link underlined (12px, `form_privacy` grey) at 1440 and 390; `form-test.mjs` FAIL none; GHL
`check-embed.mjs` ok. No JSON-LD is published on this site, so `seo.json`'s hours are local only.

## Next

- Tell Jessica: done on both sites; the Modento link books into **Stone Surgical Arts'** calendar,
  which is what was sent — confirm that is right for med-spa patients.
- Staging gets these with its next publish (the draft already has them).

## Gotchas

- **A link cloned from the privacy note has no class** and rendered as plain grey text, the same
  colour as the sentence (first publish, fixed 6 minutes later). Give any new link `text-style-link`,
  looked up by name in `site.styleRules` — class ids differ between staging and production.
- Hours live in two shapes here: footer `dt`/`dd` rows per day, and the facts' `base.text` lines
  separated by `br` containers. Changing the number of lines means deleting the `br` nodes too.

## Version Control

Tracked. Committed with the work it describes.
