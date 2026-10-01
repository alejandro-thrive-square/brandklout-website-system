# 2026-10-01 — The whole site rebuilt on the approved home's system, and published on staging

Alejandro: "The client approved the homepage design so we need to build the rest of the site please."
Scenario 1 (migration) continues as Scenario 0 step 03 (Design & Build): started for this client today
(`scenario-0-new-site/`), core pages approved (the home), so: freeze the system, build every page, push to
staging for the team review.

## Done

- **57 pages on `https://staging.ifadentistry.com`, published (seq 12)**, every one at its WordPress URL:
  the home, the services hub and 16 service pages, the smile gallery, 5 about pages, testimonials, patient
  referrals, contact and thank-you, the journal index, 20 articles at their root slugs, 5 category pages,
  privacy, terms, accessibility, and a branded 404 (Instatic's notFound template). Production untouched.
- **The system is frozen from the approved home.** `home.css` / `home.js` were split into layers
  (`site-src/css/00-30`, `js/00-core`, `10-home`, `20-kit`, `90-boot`) and the home is rebuilt from a
  multi-page source. Proven identical: the home gate 65/65 locally and 64/64 on staging, and an
  element-by-element diff against the prototype differs only by one added footer link (Patient stories).
- **A section kit for every other page** (`css/40-pages.css`, `js/30-pages.js`, documented in
  `site-src/KIT.md`): four heroes, scroll-lit statement, photo rows, pinned option stack, real before/after
  slider swept by the scroll, drawn timeline, counted figures, drawn checklists, patient quotes and films,
  related lists with a cursor-following photo, folds, comparison table, mosaic, scrubbed band, tiles,
  gallery + lightbox, visit + map, article layout. Light grounds only, named chapter tags, no em dashes.
- **Real material only.** The practice's photoshoot, office photos, and **~120 before/after cases from the
  Drive's Smile Gallery** (pulled with `drive.mjs thumbs`, indexed in `output/library/library.json`,
  contact sheets in `output/library/sheets/`). 332 cuts in the ledger `output/images.csv`; no original feeds
  more than two files (`site-src/tools/media.py` refuses); `image-reuse` gate 0 problems (article cards
  allowlisted: an article's featured image on its own card is the point).
- **Built in parallel** by five builders (implants, cosmetic + gallery, general care, about, journal +
  legal), each in its own files; the hub and the integration by me.
- **The live Google reviews are in the source now** (`data-embed="elfsight-reviews"`), on the home,
  testimonials and the cosmetic ads page; a re-push no longer drops them.
- **New push pipeline** `scenario-0-new-site/03-design-build/output/code/push/` (README there), generalised
  from `workflows/21-instatic-upload/home/`, which it replaces. Staging-locked.
- **Gates:** local sweep 57 pages x 1440/390 zero failures (console, failed requests, overflow, one h1,
  every internal link and anchor resolves); same sweep on staging zero real failures (only Cloudflare's bot
  beacon and the 404 page's intended 404, both now filtered in `tools/sweep.mjs`); home gate 64/64 on
  staging; `image-reuse` 0.

Commits: `5804ac65` (system + kit + Dental Implants), `e2912e5a` (push pipeline), and this run's commit.

## Next

1. **Team review on BugHerd** (project 542527 is still on staging and now covers every page). Asana
   *team complete site review*: in progress + comment (confirm first).
2. **WebKit pass at 1512x735** (the reviewer's Safari). Only Chrome has been driven.
3. **The open questions below to Brandklout** before the client sees the full site.
4. **SEO step (launch prep):** per-page meta descriptions through the open-graph plugin (the publisher
   renders only the site-level one; titles are per page already), schema, OG cards per page.
5. **Redirects at launch:** `/about-our-practice/articles/page/2/`, `/category/implants-and-full-arch-solutions/page/2/`,
   `/category/uncategorized/page/2/` (production's rewrite rules 1-2 point them at flat slugs that will no
   longer exist).
6. **Promotion to production** is a separate, confirmed step (BugHerd uninstall first; see 2026-09-21).

## Open, for Brandklout / the client

- Figures and claims in the old copy that are **not** in `docs/facts.md`, left out everywhere:
  "$79 exam / consultation" (we say free/complimentary), "lifetime warranty" (we say results-based; the
  old seal is not used), "up to 90% of natural chewing power" / "20% with dentures", "since 2016",
  "#1 Cosmetic Specialist", "five mastermind dental groups", Top Dentist **three** years (old site) vs
  **four** (facts.md, used). 2,500+ vs 2,800+ implants is still open (2,500+ used).
- Articles kept verbatim but contradicting facts.md: *why-prosthodontist* promises a "lifetime warranty on
  implants"; *implant-crown* names "Spear Education" and "Top Dentist 2023 and 2024"; several say
  "Institute for Advanced Dentistry & Implants". Recommend refiling the two cosmetic posts and
  *new-smile-in-one-day* under Cosmetic Dentistry (that category and Advanced Treatment have no posts).
- **Consent / names:** patient first names on films and quotes (Helen, Mark, Lisa, Philip, Marilyn, Tommy,
  Thomas, Pascale), and full-face case portraits in the smile gallery (service pages use mouth framing).
- **Missing material:** team names and roles (headshots exist, no team section built); a referral form or
  fax for dentists (the page offers phone and the consultation form); a better original of Marilyn's
  portrait; photos for bonding and whitening; patient quotes for TMJ, sleep apnea, sedation and
  biocompatible; whether to use the TMJ Vimeo video (1091943339).
- The WordPress cosmetic page repeats its veneer text under "Dental Implants"; the new page uses the
  practice's implant wording from the home instead.
- Still open from earlier runs: GoHighLevel save-and-exit and the visible hidden consent fields on the form.

## Gotchas

- **This instance cannot route a nested slug** (a page stored as `dental-services/x` answers a JSON 404).
  Pages are stored flat (`dental-services-x`, `about-our-practice-articles`, `category-x`,
  `contact-us-thank-you`) and the **zone-wide** Cloudflare rewrites in `docs/dns/URL-RULES.md` (no host
  condition) serve them at the WordPress URLs on staging and production alike. Links keep the nested URLs.
  A new nested section needs a new rewrite rule.
- **The standard `tools/instatic-site/push/` pipeline is not used here**, on purpose: it would type
  buttons, images, videos and form controls (dropping the `data-*`/`aria-*` every control runs on) and
  convert the stylesheet into the registry (losing custom properties, `svh` and source order). See the push
  README.
- **Parallel builders:** `build.mjs --out <dir> --only a,b` and `serve.mjs <port> <dir>`; never share
  `dist/`. Media specs are one file per group (`data/media/*.json`). The session scratchpad is shared
  between subagents: builders overwrote each other's helper scripts there.
- **Kit fixes found by the builders (fixed in the shared files):** a stack card tweened `filter` from `none`
  and flashed near-black mid-deal (start at `brightness(1)`); `.vs tbody th` kept 22% width on phones;
  `.tile__img` as a `<span>` ignored its aspect ratio (now `display:block`). The lightbox must live outside
  `#smooth-content` (ScrollSmoother transforms it): `js/52-cosmetic.js` moves it to `<body>`.
- **Hidden placeholders count as reuse**: the cursor-following preview and the lightbox now start without a
  `src` (the script fills them), or every page "repeats" a photo.
- Python cannot open some Drive originals in this worktree (path over MAX_PATH); Node can.
- Git Bash: `MSYS_NO_PATHCONV=1` for any `/route` argument, but **not** for `ship.sh` (it turns
  `/c/Users/...` into `C:\c\Users\...` for node). Long bash heredocs with apostrophes fail in this harness:
  write scripts with the file tool.
- Backups before the first push today: DB `/app/storage/backups/cms-2026-10-01-pre-site-push.db` (VACUUM
  INTO), API snapshots `push/.tmp/staging-snapshot-pre-*` (this worktree), git tag
  `ifa-staging-pre-site-push-2026-10-01`.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../../SYSTEM_RULES.md). Ids and hostnames only; no secrets.
