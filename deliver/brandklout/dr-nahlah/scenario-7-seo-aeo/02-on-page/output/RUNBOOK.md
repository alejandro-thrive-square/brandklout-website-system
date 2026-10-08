# scenario-7-seo-aeo · 02-on-page · runbook

Newest run first. Each run: date, what was done (with the commit), what is next, and the gotchas.

## 2026-10-07/08 — the on-page pass on STAGING (production untouched)

The user's brief: run the plan doc all the way on staging; no sitemap change (no new pages, no URL
moves) until the teammates review the proposal. Everything below is on staging.drnahlah.com only.

**Done** (checkpoint `8d8c645b`, the rest in this run's commit)
- **Backups first:** status of both hosts (59 pages, draft = published); full staging exports in
  `2026-10-07-staging/backup-staging/` and `backup-staging-2/` (14 MB each, untracked: R2 only).
- **Schema:** `areaServed` + Vienna, Falls Church, Great Falls, Reston, Fairfax; the lender
  `https://www.undefined` URLs gone (`/financing`, `/implant-cost`); each office department lists the
  towns its page names (McLean: McLean, Tysons Corner, Vienna, Great Falls, Falls Church, Reston;
  Alexandria: Alexandria). FAQPage now on home and both office pages. VOCAB CLEAN, SCHEMA CLEAN.
- **Keyword H1s:** `push-keyword-h1` on 16 pages (`--only`, `/our-facility` held), hero-look
  "HEADLINES IDENTICAL, ONE H1 EACH". Home by hand (`output/code/push-home-faq.mjs`: the tagline is
  the H1 "Prosthodontist & Dental Implants in McLean & Alexandria, VA"); `/contact` by hand
  (`output/code/push-contact-h1.mjs`: "Contact Our McLean & Alexandria Dental Offices", "Where to go."
  a `<p id="contactTitle">`), `output/code/text-style.mjs` compare STYLE IDENTICAL at 1440 and 390.
- **Titles/descriptions:** 19 pages from `2026-10-07-staging/page-seo.json` via `ops/set-page-seo.mjs`.
- **Alt text:** 114 images (106 gallery cases, 8 service pairs) via `ops/set-media-alt.mjs`.
- **Home local FAQ:** `#local-faq`, 7 questions from stated facts, before `#invitation`.
- **Keyword gate on staging:** 1016 passed, 1 failed (`/our-facility`, held), 22 warnings
  (`2026-10-07-staging/gate-after-offices.log`, gitignored). Baseline was 42 FAIL.

**Next**
1. The team reviews the plan doc and the staging pages; nothing ships to production before that.
2. `/our-facility`: its H1 is McLean's but its photos are of the Alexandria office (the 2025-09-24
   shoot). Decide: retitle it for both offices, or swap in McLean photos (none exist yet).
3. Production, after the yes: the same scripts with `--allow-production`, in this order: schema,
   keyword H1s, `/contact`, home, page SEO, alts; then `plugin-stores.mjs` to keep staging level.

**Gotchas**
- A renamed section heading stops `build-schema` (`BUILD STOPPED: … no section heading matches`):
  `seo-config.json` keys sections by heading regex. The Alexandria "What to bring" rename needed
  `"bring": "^Before your first visit"`.
- `text-style.mjs` finds elements by text: a split headline wraps its words in divs, a tagline sits in
  a wrapper div; it takes the first non-div element with the exact text.
- Every page save drops `seoTitle`/`seoDescription`; `insta-api` restores them ("restored page cells
  the save dropped") and the scripts check them on read-back.

## 2026-10-07 — config for the promoted Instatic SEO tools (no writes)

**Done**
- `seo-config.json` and `schema-base.json` for `tools/instatic-site/seo/` (main `a4caccbd`), transcribed
  from this client's `workflows/22-instatic-api-sync/seo-v3/` by the promotion run. The keyword map is
  read from step 01 (`files.keywordMap` left at its default). Proven read-only on 2026-10-07: the
  generalised build matches the live graph on 81 URLs except 6 values (the lender fix below);
  `vocab-check` VOCAB CLEAN; `verify-schema` SCHEMA CLEAN on production and staging; a staging scan
  (Client-First class names) builds the same graph.

**Next**
1. **Lender fix:** `/financing` and `/implant-cost` publish `"url": "https://www.undefined"` for all
   three lenders (seo-v3 read each domain from copy that no longer names them; every gate stayed green).
   The new build drops those values: `push-schema --apply` on staging, verify, then production (2 blocks).
2. After gate 1: `push-keyword-h1` plan → `--apply` on staging, `hero-look` before/after, then
   production. Its plan with the drafted H1s: 14 pages writable, 6 already pass, 10 need a decision
   (home and contact heroes are built differently, 5 rows have no H1 yet, 3 drafts lack their keyword).
3. Home-page local FAQ (visible section first), wider `areaServed`.

**Gotchas**
- Production still uses the pre-Client-First class names, staging the new ones: the config's `markup`
  carries both. Check which host a run targets.
- None of the write paths (`--apply`, `--publish`) has been run against a real instance yet.

## Version Control

Follows [SYSTEM_RULES.md §5](../../../../../../SYSTEM_RULES.md).
