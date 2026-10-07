# west-la-implants runbook

Standing state: what is true now, what is next, the traps. Each step's own history is in its
`output/RUNBOOK.md`; add a row below for every run.

## Standing

- **The organic site** (80 pages, Dark Surgical Luxury, on the client's Instatic instance): its
  standing state and eight earlier runs are in [`docs/RUNBOOK.md`](./docs/RUNBOOK.md) and
  [`docs/runbook/INDEX.md`](./docs/runbook/INDEX.md). The folder still uses the old
  `workflows/NN-*` layout; the build is `workflows/04-design/.tmp/site-src/`, the upload chain
  `workflows/21-instatic-upload/`.
- **The ads landing pages** (scenario 3): six pages live at
  `https://west-la-implants-production.up.railway.app/ads-landing-pages/` since 2026-09-30,
  published **seq 24**: `all-on-6`, `all-on-6-consultation`, `thank-you-all-on-6`, `3-on-6`,
  `3-on-6-consultation`, `thank-you-3-on-6`. Noindex, out of the menu.
- **Not ready for traffic.** The two campaign GHL forms exist since 2026-10-05 (All-on-6
  `XaCEV96A0QuF9ufEmkSc`, 3-on-6 `P15UYHonJj8oH5G8xwKX`, gates and style ok, in `combo.json`) but
  are **live on the four form pages since 2026-10-05, published seq 28** (`workflows/21-instatic-upload/add-ghl-forms.mjs`;
  re-run it after any `push-site.mjs`). `verify-form.mjs` 1440 + 390 clean. No conversion tag and no number pool is on the instance, and the host the ads will point at is
  undecided (the client's domain is still WordPress). The asks are in
  [`ADS-LANDING-COMMENT.md`](./ADS-LANDING-COMMENT.md); the full list in scenario 3's
  [`INTAKE.md`](./scenario-3-ads-landing-pages/01-campaign-intake/output/INTAKE.md).
- **2026-10-07: Brandklout review round 1 is live on the ad pages, published seq 29**, as a
  surgical edit of the live draft (`workflows/21-instatic-upload/apply-lp-review.mjs`), not a push:
  readability, sharp crops, campaign thank-you copy, accessibility button above the call bar,
  `og:image` 200. Two new shell code assets carry it: `src/styles/wla-lp-review.css` and
  `src/scripts/wla-sharp-crops.js`. **From now on change this site by patching the live draft**
  (user, 2026-10-07: never override other sessions' work); see 21-instatic-upload trap 46.
  Later the same day (seq 30): **DNI live** on the six ad pages. The ads now show the main line
  (310) 481-0111, which the GHL pool swaps (user's choice), using embed-origins 1.8.0
  `siteScripts #pages=ads-landing-pages/*`. `dni-proof` swapped on all four pages walked.
  **Campaign form email notifications are on** (same recipients as the WordPress contact form).
  Both forms carry "Consent is not a condition of purchase."
  Open: videos to Vimeo (needs a human verification in Chrome first), conversion tags, one test
  lead per campaign. Details in the step 03 runbook.
- **2026-10-04: the reviews widget is on the in-section standard** (Elfsight editor only, live at once): no widget title, Google-logo header with the count, gold `#C4A36A` square uppercase button, dark `#161613` cards with cream text. Gate `check-widget.mjs 670ca31c-8602-42c1-a126-f46f653fe07f --render https://west-la-implants-production.up.railway.app/` ok.
- **The site contact form** `BAZZebJdjQAdGkda1fEE` (live on the WordPress `/contact`) is on the
  GHL standard since 2026-10-05: Service dropdown (12), two consent boxes naming Tony Barriere
  Dental Corp DBA West LA Implants, captcha, no-shift CSS, styled for the white WordPress page.
  Restyle it for the dark site at the domain switch.
- **The Google reviews widget** (Elfsight `670ca31c-8602-42c1-a126-f46f653fe07f`, the practice's
  listing, 4.9 / 209) is live in the homepage proof chapter since 2026-09-30, published **seq
  25**, as an Embed block where the three static cards were. Run
  [`docs/runbook/2026-09-30-elfsight-google-reviews-on-homepage.md`](./docs/runbook/2026-09-30-elfsight-google-reviews-on-homepage.md).
  **A re-import drops it**: after any `push-site.mjs`, run
  `workflows/21-instatic-upload/add-elfsight-reviews.mjs --apply --publish`.
- **HIPAA Disclosure** (`/hipaa-disclosure`) live since 2026-10-01, published **seq 26**, injected
  page-only by `workflows/21-instatic-upload/add-hipaa-page.mjs` (text in `site-src/lib/hipaa-notice.mjs`).
  Linked from both footer legal rows (after Privacy) since seq 27. Legal entity unconfirmed
  (practice name used), no email published. Run
  [`docs/runbook/2026-10-01-hipaa-disclosure-page.md`](./docs/runbook/2026-10-01-hipaa-disclosure-page.md).
- **Backups before the 2026-09-30 pushes**: ads: tag `wla-pre-ads-2026-09-30`,
  `/app/storage/backups/cms-2026-09-30-seq23-pre-ads.db` on the container; reviews: API snapshot
  `workflows/21-instatic-upload/.tmp/backup-2026-09-30-pre-reviews/` (seq 24). The live state now
  is `workflows/21-instatic-upload/.tmp/after-reviews-2026-09-30/` (seq 25).
- **Any push is still a full replace with `--force`.** Compare a fresh `backup-live.mjs` snapshot
  with `after-reviews-2026-09-30/` first: identical means nobody edited in the admin.

## Runs

| Date | Scenario / step | What happened | Commit |
| --- | --- | --- | --- |
| 2026-09-30 | 3 · 01 campaign intake | Two Asana tasks pulled, `combo.json` and `INTAKE.md`, patient film transcripts found | `b9b96a5c` |
| 2026-09-30 | 3 · 02 build the combo | Six pages built in `site-src`, pushed and published seq 24; upload chain repaired (imports, media list) | `b9b96a5c` |
| 2026-09-30 | 3 · 03 QA and launch | Live gates clean except forms and conversion, which wait on Brandklout; three new checks | `b9b96a5c` |
| 2026-09-30 | organic · 21 instatic upload | Elfsight Google Reviews Embed block in the homepage `#proof` (three static cards out), `.pf-embed` rule + site.js guard, published seq 25, verified in real Chrome (718 px, 4.9 / 209, console clean) | `ba81ca90` |
| 2026-10-01 | organic · 21 instatic upload | HIPAA Disclosure page injected page-only (cloned privacy chrome + prose notice), published seq 26; 86 other pages identical modulo per-publish asset ids | `6e31792a` |
| 2026-10-01 | organic · 21 instatic upload | "HIPAA Disclosure" footer link after Privacy on all 87 pages (site + ads footers) and in the source footers, published seq 27; ads footer wraps at 390 (needs CSS go-ahead) | _this commit_ |
| 2026-10-05 | 3 · 03 QA and launch | GHL forms via Codex: All-on-6 `XaCEV96A0QuF9ufEmkSc` and 3-on-6 `P15UYHonJj8oH5G8xwKX` built new (gate `--landing`/`--combo` ok, style ok), contact form `BAZZebJdjQAdGkda1fEE` brought to standard; ids in `combo.json` | `44ce721a` |
| 2026-10-05 | 3 · 03 QA and launch | Both campaign forms placed on landing + consultation pages by `add-ghl-forms.mjs` (page-only Embed blocks), published seq 28; `verify-form` 1440/390 clean, `verify-combo-live` forms + redirects ok | _this commit_ |
| 2026-10-05 | 3 · 03 QA and launch | Campaign forms restyled for the dark site (white inputs/frame fixed: GHL input specificity, inline frame, button `<p>`), previewed then pasted by Codex; checked in the live cards at 1440 and 390 | _this commit_ |
| 2026-10-07 | 3 · 03 QA and launch | Review round 1 live (seq 29) by surgical draft patch: readability CSS, sharp-crop script, `_large` case photos, campaign thank-you copy, Sienna above the call bar, og:image fix; All-on-6 marketing consent sentence via Codex | `9234859f` |
| 2026-10-07 | 3 · 03 QA and launch | DNI live (seq 30): embed-origins 1.8.0, pool scoped to the ad pages, ads show 481-0111; form email notifications on; 3-on-6 consent sentence | _this commit_ |

## Version Control

Follows [SYSTEM_RULES.md §5](../../../SYSTEM_RULES.md).
