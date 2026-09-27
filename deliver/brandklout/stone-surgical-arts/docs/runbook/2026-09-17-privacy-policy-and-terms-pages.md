# 2026-09-17 — Privacy Policy and Terms of Service pages built, and PUBLISHED TO STAGING

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

### Published to staging (`https://staging.dfwsurgicalarts.com`)

- Scratch link dir `railway link -p b3cae5d8… -s "Stone Surgical Arts" -e staging`, then
  `INSTATIC_BASE_URL=https://staging.dfwsurgicalarts.com` on every step. `check-link.mjs` confirmed
  the container serves staging before anything shipped.
- `build-import-input.mjs` (54 pages, 0 warnings) -> `ship.sh` -> `push-site.mjs --force --apply`
  (`54 written, 0 deleted`, seq 1) -> `publish()` -> `{"publishedPages":54}`.
- `--force` is required on staging and always will be: it holds authored pages, and this toolkit
  writes in `mode: 'replace'`. That is safe here because the local build IS the whole site; it would
  not be safe against a site someone had edited in the admin.
- No media upload: the legal pages carry no images.
- Gates against staging: `verify-live.mjs` `FAIL none` (54 routes, 187 URLs, 606 asset refs),
  `compare-live.mjs` on both pages down to the Cloudflare email finding below.

## Next

- **Promote to production** once the text is approved. Same commands with
  `INSTATIC_BASE_URL=https://www.dfwsurgicalarts.com` and the link dir on `-e production`.
- **Have the practice (or their counsel) approve the text.** It is adapted, not legal advice.
- If this site gets its own A2P 10DLC campaign, the book form needs a **separate, optional SMS
  consent checkbox**. The current consent box bundles phone, text and email together.

## Gotchas

- **Staging had no font FILES, and the gate is the only thing that noticed.** `settings.fonts.items`
  was cloned from production, so the publisher emitted the `@font-face` rules, but
  `/uploads/fonts/...` 404'd: the clone copies media rows, not the font directory on the volume.
  Every page fell back to Georgia and Arial, `compare-live` said `fonts never loaded (live)` and
  reported ~50 width differences per page that were all one cause. Fix:
  `INSTATIC_BASE_URL=<staging> node install-fonts.mjs --apply`, which downloads them server-side.
  **This was not caused by the legal pages and was there since the 2026-09-15 clone**, which only
  ran `diff-sites`, `verify-live` and `check-noindex`, none of which look at `document.fonts`.
- **Instatic sends `Cache-Control: max-age=14400` on a 404 under `/uploads/`, and Cloudflare caches
  it.** Requesting a font before installing it therefore poisons the edge for four hours, and
  installing the file does not clear it. Purge the URLs.
- **Purging needs a minted token, and the token needs ~10 seconds.** `CLOUDFLAREAPI` has no zone
  permissions, so mint one with permission group `e17beae8b8cb423a99b1730f21238bed` (Cache Purge)
  scoped to `com.cloudflare.api.account.zone.<zone id>`, then revoke it. A purge attempted
  immediately answers `10000 Authentication error`, which looks like a wrong scope and is only
  propagation delay: retry after ten seconds before changing the policy.
- **Cloudflare Email Obfuscation rewrites every `mailto:` on these pages.** `verify-live` read
  `/cdn-cgi/l/email-protection` as a 404 link (it now skips `/cdn-cgi/`), and `compare-live` reports
  the live text as `[email protected]` with a shorter link box, because the gate runs with
  scripts OFF. In a browser both pages restore `mailto:info@stonesurgicalarts.com` (checked in
  Chrome). The remaining `compare-live` findings on these two pages are exactly this and nothing
  else. A reader with JavaScript disabled cannot see the address; the phone number beside it is
  plain text.

- The site's copy uses British spellings (anaesthesia, centre). The legal pages use American
  spellings on purpose, because the entity is in Texas and the source policies are American.
- The effective date "September 17, 2026" appears in both body files. Change both when the text changes.
