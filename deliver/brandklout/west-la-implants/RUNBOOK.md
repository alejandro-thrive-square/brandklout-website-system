# west-la-implants runbook

Standing state: what is true now, what is next, the traps. Each step's own history is in its
`output/RUNBOOK.md`; add a row below for every run.

## Standing

- **2026-10-09: STAGING EXISTS and carries the Client-First migration (staging only; production untouched).**
  `https://west-la-implants-staging.up.railway.app` (Railway env `staging`, same login as production, Railway host
  only: the client's zone is on GoDaddy, so no `staging.<domain>` and no edge noindex header; the runtime writes
  `meta robots noindex` + staging `og:url` host-conditionally, marker `WZ_STAGING_NOINDEX` in `src/scripts/site.js`;
  the GHL number-pool `siteScripts` lines are off on staging). `--site west-la-implants:staging` resolves.
  On it (seq 10): stylesheets in the registry, Framework 17 colours + the 10 house spacing steps, **502 class renames**
  (`workflows/class-standard/class-map.json`), 6 combo classes (`combo-map.json`); gates EDITABLE · IN BOUNDS ·
  CLEAN · editor canvas ok, css 0 real at 1440/390/1920, runtime OK, head 0/87. The local source and the
  `21-instatic-upload` draft-patch scripts carry the same names and tokens (`css/00-framework-tokens.css` is the
  Framework mirror). **Production still has the old class names**: the production rollout is a separate, reviewed
  step (fleet runbook on main); until then `site-src` must NOT be pushed to production (its classes no longer match).
  Open for a person: `heading-style-display` stays split (chip + a late ambient rule; the blog H1 small combo sits
  between), 5 contextual overrides the tool refuses. Run:
  [`docs/runbook/2026-10-08-staging-clone-and-class-standard.md`](./docs/runbook/2026-10-08-staging-clone-and-class-standard.md).

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
- **2026-10-07 (night): the main site's forms are real GHL embeds (seq 36)**: GHL Contact (new site)
  `DCNQTSgl14CNZ93H7Fi3` in every Invitation chapter (80 pages), Referral (new site)
  `dnR28L5agKj0fQiuZcuH` on /referring-doctors, both emailing the practice. Until then the prototype form
  answered "Thank you" and sent nothing. **After ANY full push run `apply-ghl-site-forms.mjs --apply
  --publish`** (`site-src` still renders the prototype). The same round (BugHerd #19-#38, seq 35-38)
  covered the Playfair Display H1s, dead YouTube/Zocdoc links, copy, the /dental-implants services list
  and the FAQ photo. #25 waits on the reviewer's image. Run: `docs/runbook/2026-10-07-bugherd-main-site-round.md`.
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
  **The patient films are on Vimeo and play on the page (seq 31).** They're in the agency team
  account, folder "West LA Implants" (`30817251`), with descriptions linking westlaimplants.com,
  and open in a lightbox (`src/scripts/wla-films.js`).
  **Seq 32: every practice film on the site is on Vimeo and plays on the page**: nine films in the
  folder; Invisalign's own video stays on YouTube.
  **2026-10-08: the Contact (new site) form is styled for the dark site** (Custom CSS: no-shift block + `scenario-3-ads-landing-pages/03-qa-and-launch/output/code/ghl-form-contact-dark.css`, incl. the Service dropdown; gate ok, embed full width at 1440/390). The Referral (new site) form `dnR28L5agKj0fQiuZcuH` is still on GHL's white default.
  Open: conversion tags, one test lead per campaign. **Form redirects stay on the Railway host
  until production is published and approved** (user, 2026-10-07). Details in the step 03 runbook.
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
| 2026-10-07 | 3 · 03 QA and launch | DNI live (seq 30): embed-origins 1.8.0, pool scoped to the ad pages, ads show 481-0111; form email notifications on; 3-on-6 consent sentence | `feec3b96` |
| 2026-10-07 | 3 · 03 QA and launch | Patient films on the agency Vimeo (folder West LA Implants) and played in a lightbox on the four film pages, published seq 31 | `1374252a` |
| 2026-10-07 | organic + 3 | Six more practice films to Vimeo; 38 film links on 20 pages to Vimeo, lightbox site-wide (frameOrigins), published seq 32 | `d97b017f` |
| 2026-10-07 | 3 · 03 QA and launch | BugHerd #29-#34: hero copy top-aligned, pinned chapters fit (or flow) on every desktop size, ScrollTrigger re-measures after the GHL form grows; thank-you copy without "new-patient line" (seq 33-34) | `2a576bbb` |
| 2026-10-07 | organic · 21 instatic upload | Brandklout BugHerd round (#19-#38): GHL contact + referral forms embedded on 80 pages, Playfair Display H1s, dead YouTube/Zocdoc links fixed site-wide, copy, /dental-implants services, FAQ photo; 14 closed, #25 waiting (seq 35-38) | _this commit_ |
| 2026-10-08 | 3 · 03 QA and launch | Contact (new site) form `DCNQTSgl14CNZ93H7Fi3` restyled for the dark site (dark block + dropdown rules pasted via Claude in Chrome after two Codex browser drops); `--standard` ok, embed 100% width at 1440/390 | _this commit_ |
| 2026-10-08 | staging (new) | Railway env + volume + host, seeded (87 pages, 455 media rows, 3,702 files), embed-origins cloned, runtime noindex guard, DNI lines off; diff-sites 87/87, rendered leak gate clean except the header line (Railway host) | `b3e69195` |
| 2026-10-08/09 | class-standard · phase 1 (staging) | tokens/review css into the registry (seat flip on `.display` fixed forward), Framework 17 vars, 502 renames; css 0 real at 3 widths, runtime OK, head 0/87, EDITABLE · IN BOUNDS · CLEAN; local source + patch scripts renamed | _this commit_ |
| 2026-10-09 | class-standard · phase 2 (staging) | 10 spacing steps + 245 values on tokens (5% → 40%), 6 combos (overrides 11 → 5), fold-split 0 (1 left for a person); css 0 real at 3 widths, runtime p2-before→p2-after OK, head 0/87; local source the same | _this commit_ |

## Version Control

Follows [SYSTEM_RULES.md §5](../../../SYSTEM_RULES.md).
