# 2026-10-01 — HIPAA Disclosure page injected, published seq 26

**Commit:** see the client `RUNBOOK.md` row. An injection: one new page, nothing else written.

## Done

- **`/hipaa-disclosure`** is live at
  `https://west-la-implants-production.up.railway.app/hipaa-disclosure` (200), title
  `HIPAA Disclosure | West LA Implants`, indexable, canonical on the page's own URL. It is the HHS model
  Notice of Privacy Practices our Webflow sites carry (Stone Dental Implant Center, Grand Mission),
  verbatim, with only these swapped: entity and display name **West LA Implants**, 12301 Wilshire
  Blvd, Suite 205, Los Angeles, CA 90025, phone (310) 481-0111 (the current-patient line, the same
  one the privacy page gives for privacy questions), Privacy Policy link → `/privacy-policy`,
  Effective Date October 1, 2026.
- **Production only.** It is the client's only Instatic instance (`sites.json` has no alternates);
  there is no staging copy to write.
- **How:** `workflows/21-instatic-upload/add-hipaa-page.mjs` clones the live `/privacy-policy` row
  (nav, drawer, footer, mobile bar, the cover and invitation chapters), replaces the two detail
  chapters with the journal's prose chapter (`.b-prose .pr2-body`, an aside with Privacy Policy /
  Accessibility / Contact), and writes one `changedPages` entry incrementally (seq 25 → 26), then the
  SEO cells through a read-merge-write `PATCH /data/rows`. Each h3 section is a `.dt-col` so it takes
  the privacy page's own sub-heading style. No shell rule, component, site.js or other row touched.
- **Source of truth matches:** the text lives once in `04-design/.tmp/site-src/lib/hipaa-notice.mjs`;
  `pages/legal.mjs` renders it (so a later full push keeps the page) and the script reads the same
  list. `seo.json` gained the one entry. `check-local.mjs` treats the page as a legal page (no pin
  floor), like `/privacy-policy`.
- **Guarded publish:** draft matched published before the write; after it, no other row moved and
  the shell was unchanged, so the site-wide publish carried only this page (87 pages).
- **Verified:** all 86 other pages compared with the seq-25 published snapshot
  (`21-instatic-upload/.tmp/after-reviews-2026-09-30/html/`, itself byte-equal to a pre-write fetch):
  identical apart from the per-publish asset folder id in three script URLs and the homepage's
  `embed-origins` module `?v=26 → 27`, which every publish rewrites. Live gate
  `check-local.mjs hipaa-disclosure --base=…` green at 1440 and 390 (console clean, SEO injected, no
  overflow); screenshots in `08-qa/.tmp/screenshots/hipaa-disclosure/`.

## Next

- **The practice to confirm the legal entity.** Neither this site's privacy notice nor the old
  WordPress site names one, so the practice name stands in. Swap `HIPAA.entity` in
  `lib/hipaa-notice.mjs`, rebuild, and re-run `node add-hipaa-page.mjs --apply --publish` (it
  rebuilds the row in place).
- **No email** is published anywhere for the practice, so the contact block has none (the Webflow
  original has one). Add it there when the practice gives one.
- **Footer:** the footer has a legal-links row (`.footer-links`: social links, Zocdoc, Privacy,
  Accessibility). No HIPAA link was added; that is a later decision.

## Gotchas

- **Publish is site-wide** on Instatic; the script refuses when `draftMatchesPublished` is false
  before the write or anything else moved after it.
- **Byte-hash "before/after" will always differ** after a publish: the per-page
  `/_instatic/assets/<id>/` folder and module `?v=` change. Normalise those before comparing.
- **`.pr2-body p:first-of-type`** styles the first paragraph inside each `.dt-col` as a lead, so a
  section that opens with a paragraph shows it larger than its siblings. Left as is (no site CSS in
  this task); a `.dt-col p:first-of-type` rule would fix it in a CSS pass.
- `$TEMP` in Git Bash is shared with other sessions: a "before" copy saved there was overwritten by
  an IFA run. Keep evidence in the session scratchpad.

## Version Control

Tracked with the client runbook on `bk-west-la-implants`; see the repository's SYSTEM_RULES.md §4.
