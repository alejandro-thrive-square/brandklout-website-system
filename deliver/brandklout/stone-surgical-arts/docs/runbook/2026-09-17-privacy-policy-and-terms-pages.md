# 2026-09-17 — Privacy Policy and Terms of Service pages built. Local, not published

## Done

- Two new pages, `privacy-policy` and `terms-of-service`, adapted from the sister practice's live
  policies at stonedentalimplantcenter.com (effective 2026-08-27). Same legal entity, Stone Surgical
  Arts PLLC, so the structure carried over; the content did not. Each body file's header comment
  lists what changed and why. The short version:
  - This practice's own NAP: (817) 918-3666, 72 Andorra Dr #110. The source has the dental
    centre's (817) 383-8361, suite #110A.
  - Email is `info@stonesurgicalarts.com`. The domain still has Google Workspace MX (checked over DoH).
  - Third parties are only the ones this site uses: Modento, Sunbit, CareCredit, Google Maps and
    the social links. The source's GHL, Cherry, LendingClub, Proceed, GA and GTM are not here, and
    cannot be, because of the CSP (trap 29). The cookie section says no tracking cookies.
  - The sister site's separate SMS Terms page is **section 05 of the terms page** (`#sms`).
  - Terms section 07 calls the fees a guide and the written quote the binding figure, because
    every fee on the site is still unconfirmed.
- Built on the journal article template (60-journal.css), plus `css/61-legal.css` for the h3s,
  bulleted lists (a class sets the bullets so reset.css cannot strip them) and the contact card.
  `photoHero`, `motion` and `cta` are all false.
- The footer's three legal links and the book form's consent link now point at the new pages,
  not at stonedentalimplantcenter.com.
- Both slugs added to `build-import-input.mjs`, `verify-live.mjs` ROUTES and `compare-live.mjs`.
- Gates: build, audit (54 pages), check-copy, blog-validate, all-pages (54 x 3), blog-test 243/243
  all pass. Screenshots at 390, 1440 and 1920 show no overflow and live bullets.

## Next

- **Publish.** Staging first (`INSTATIC_BASE_URL=https://staging.dfwsurgicalarts.com`), then promote.
  Expect two additions. Then `verify-live` and `compare-live privacy-policy` / `terms-of-service`.
- **Have the practice (or their counsel) approve the text.** It is adapted, not legal advice.
- If this site gets its own A2P 10DLC campaign, the book form needs a **separate, optional SMS
  consent checkbox**. The current consent box bundles phone, text and email together.

## Gotchas

- The site's copy uses British spellings (anaesthesia, centre). The legal pages use American
  spellings on purpose, because the entity is in Texas and the source policies are American.
- The effective date "September 17, 2026" appears in both body files. Change both when the text changes.
