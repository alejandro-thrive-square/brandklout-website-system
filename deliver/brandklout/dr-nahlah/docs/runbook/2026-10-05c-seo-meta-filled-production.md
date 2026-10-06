# 2026-10-05c — SEO meta: audit after a reported ranking drop, CMS SEO fields filled, duplicate descriptions fixed (PRODUCTION)

## Why
User reported a "massive drop in SEO" and asked to fill the SEO meta data on production now.

## Audit (live, before any change)
- 81 sitemap URLs: all 200, one `<title>` / one description / one self-canonical each, no noindex. Staging is `X-Robots-Tag: noindex, nofollow`.
- All 190 old WordPress URLs in `drnahlah_301` still land on a 200 (checked one at a time with curl; Node fetch in parallel gives false "fetch failed" here).
- **Wrong descriptions:** `/all-on-4`, `/meet-dr-nahlah` and all 19 `/ads-landing-pages/*` published the HOME description (their open-graph override had no `description` and the page row had no `seoDescription`).
- **Instatic Pages table:** `seoTitle` / `seoDescription` empty on 55 of 59 rows (only index + hipaa-disclosure filled).
- Likely drivers of a ranking drop, NOT changed today (need the user's call): every title and description was rewritten at migration; "McLean" titles 42 → 32 of 76; home title lost "Top Rated Prosthodontist in McLean, VA"; `/dental-implants` title lost McLean; service pages ~35% fewer words (32,953 → 21,482), posts ~22% fewer; posts have 2 H1s each; the 43 posts were 404 until 2026-08-25; **no Search Console access in the master .env**, so the drop's date is unconfirmed.

## Done (production, published 59 pages)
- Backup: `22-instatic-api-sync/.tmp/backups/pages-rows-full-pre-seo-cells-2026-10-06T00-01-04-407Z.json` (gitignored, local).
- `seoTitle` / `seoDescription` cells written on the 38 flat-slug rows (36 pages + 404 + post template), values = the live head (= `seo.json`), except all-on-4 / meet-dr-nahlah which take `seo.json`'s own description. Title, slug and body verified unchanged per row.
- open-graph overrides: `description` added to all-on-4 and meet-dr-nahlah (from `seo.json`), and new overrides with per-page descriptions on the 19 ads pages (`push-ads-descriptions.mjs`, wording only from each page's own copy).
- Verified with `verify-seo-meta.mjs`: 100 URLs, all 200, 1 title + 1 description each, og:description = description everywhere, only duplicate = the ChatGPT clone ↔ alexandria-all-on-4 (both noindex, intended).

## Gotchas
- **The open-graph plugin reads `seoTitle`/`seoDescription` cells** (`deriveFromPage`, `syncMetaDescription`), so the header of `push-page-seo-cells.mjs` saying they are inert is outdated on this instance.
- **Nested-slug pages cannot keep SEO cells.** A cells PATCH flattens `ads-landing-pages/x` to `ads-landing-pages-x`; the site-document re-save (`.tmp/reassert-slug.mjs`) restores the route AND wipes the cells. Give nested pages their meta through open-graph overrides only. (Happened once today on the ChatGPT page, draft only, repaired before publish.)
- Staging untouched.

## Next
- Get Search Console access to date the drop and see which queries/pages fell.
- Decide with the client whether to restore "McLean, VA" in the titles that lost it (home, /dental-implants and others) and whether to restore page depth.
