## 2026-10-05b: `/doctor-referral` promoted from staging to production. PUBLISHED AND VERIFIED

The client approved the staging page (see the 2026-10-02b run). Production's `/doctor-referral`
now has the same four sections:

**hero › #referral-forms › #referral-form › #patient-reviews**

It also carries the 2026-10-03 change that never had a run of its own. The native webhook form
was replaced by the **GoHighLevel survey "Patient Referral Survey - Website"**
(`KXFNR4JPqxonXEFTtme0`, McLean sub-account `xJDu1mFoW5jFYTNqmuk7`). Sung ruled the custom
webhook form not HIPAA compliant, so the referral data now stays inside GHL. The embed lives in
`partials/referral-survey.html`. `partials/referral-form.html` (the native form) is kept in git
but no longer used. That source work is committed with this run.

### How

- Staging's **published** page was outlined first (`.tmp/referral/outline.mjs`: sections, texts,
  links, iframes, images). It matched the local source exactly, so nothing had been hand-edited on
  staging that the script would miss.
- Staging's *draft* (the unreviewed class map) was never read or copied. The push builds from
  production's own row.
- `push-referral-page.mjs` was run against production with plan, then `--apply`, then
  `--publish`. Production still had the old layout, so this was the full restructure:
  - **392 → 277 nodes**;
  - the preview card was uploaded to production media with its alt text;
  - no other rows moved, and the shell is identical;
  - the publish guard passed.
- **No production update was undone.** The row's snapshot before the write
  (`.tmp/referral/prod-row-before.json`) has the same `footer` subtree, byte for byte, as the
  row after it, including today's "Find Us Online" social row. The row has no SEO cells to drop:
  only title, slug and body. The title is unchanged.

### Verified (production)

- The outline of the live page is **identical to staging's**.
- In headless Chrome (`.tmp/referral/live-check.mjs`):
  - the survey iframe returns 200, is 3169px tall and renders its fields;
  - the review wall renders (1171px, one ReputationHub frame);
  - there are no CSP violations. The embed opens `frame-src`/`script-src` to `https:` on this
    page only.
  - The footer social row is present.

  Staging gives the same numbers.
- `/patient-referral-form.pdf` and `/about-dr-nahlah.pdf` 302 to the drnahlah-files Worker on www.
- The footer sweep was re-run: **83/83**.
- **No test referral was submitted**, because that would create a contact in the live GHL
  sub-account.

### Still open

- Asana `1219086723228800` "Add Referral Form to Website": comment and complete it.
- Staging still lacks the footer social row (its draft is busy; see the 2026-10-05 run).
- The 2026-10-02b leftovers still stand: no office alert, the TEST contacts, the abandoned GHL
  builder form `NZgQWT70a54fLzOUe1b0`, and the media not yet pushed to R2.

### Version Control

Committed on `bk-dr-nahlah`.

## Addendum, same day: "About Dr. Nahlah (PDF)" button removed; both Asana tasks closed

- **Client instruction:** remove the "About Dr. Nahlah (PDF)" button from `#referral-forms`. The
  sentence that pointed at it ("The second sheet introduces Dr. Nahlah, his training and his
  qualifications.") went with it.
- Production: `one-offs/drop-about-pdf-button.mjs`, run with plan, then `--apply`, then
  `--publish`.
  - The page went from 277 to 276 nodes, and the body is exactly as planned.
  - No other rows moved, and the shell is untouched.
  - The live outline differs from before by exactly that button and that sentence. The survey,
    reviews and footer are unchanged, and there are no CSP errors.
- Site source: `doctor-referral.body.html` was edited and `final-site/` rebuilt.
  `push-referral-page.mjs` now expects ONE button in `#referral-forms`.
- `/about-dr-nahlah.pdf` still 302s to the Worker. Nothing links to it now.
- **Staging still shows the button** (and lacks the footer social row), because its draft is busy
  with the class map. Once that draft clears, run the same one-off against staging.
- Asana: commented on and completed `1219086723228800` (referral form) and `1219087019480243`
  (social profiles).
