# 2026-10-06d — SEO/AEO: the rest of the audit, live on production and staging

## Why
User: "Let's go all the way with all of the improvements that we have for SEO and AEO." The
remaining items of the 2026-10-05e audit, after SEO v3 (2026-10-05g).

## Done (production + staging, published, all gates green)
- **One H1 per Journal post** (43): every collection body opened with its own `<h1>` under the
  template's hero H1. `seo-v3/push-posts-v3.mjs` removes the body's (rows patched, read back, then
  each row published with `POST /data/rows/:id/publish`; a site publish does not promote post rows).
  `publish-post-rows.mjs` showed 0 stale rows on both hosts first, so nothing else shipped.
- **43 post meta descriptions written from the articles** (`seo-v3/post-descriptions.json`,
  110–160 chars). They replace the WordPress-era ones ("Click here", "Come to our office today!",
  six with "Dental Group of Tysons"). Each description's specific claims were checked against the
  post text by script; 19 first drafts named things the post does not say and were rewritten.
  Written to the row `seoDescription`, the open-graph override and the BlogPosting `description`.
- **Per-office profiles in the schema**: each office's `sameAs` = its Facebook, Google Business
  Profile (as `maps.google.com/?cid=…`) and Yelp, from `footer-reviews-links.mjs` (the practice's
  list, 2026-10-06c). Alexandria's `hasMap` was a directions link; it is now its GBP (CID
  15116285013112467378, resolved from `g.page/r/CbIvIUIh1cfREAE`). The org `sameAs` has both Facebook
  pages, Instagram and the practice's YouTube channel "Dr. Esam Nahlah". `paymentAccepted` reads
  cleanly (the lenders by name, not "the three partners below").
- **`/llms.txt`** (llmstxt.org, 22 KB, 74 links: practice facts, both offices, every page and post
  with its own description) from `seo-v3/build-llms-txt.mjs`, served by the `drnahlah-seo` Worker.
  The route `www.drnahlah.com/llms.txt*` was bound in the dashboard by Codex computer use (no token
  we hold can bind a route). It is in `deploy-worker.mjs` ROUTES.
- **Sitemap `<lastmod>` = 2026-10-06** on all 81 URLs (every page's structured data changed).
- **Trailing-slash 301s**: 80 rows in `drnahlah_301` (209 → 289), `www.drnahlah.com/<path>/` →
  the page, www only (staging unaffected), query string preserved. `14-migration-seo-redirects/
  add-trailing-slash-redirects.mjs`.
- Local source: `site-src/seo.json` `sameAs` no longer names the dead `/DentalGroupofTysons/`.
- Staging: post push applied there too, the plugin stores copied, staging published (its page
  draft matched its published version first). `seo-v2/parity-check.mjs` = STAGING MATCHES PRODUCTION.
- Process lesson on **main** `a4825465` (not pushed): aeo-schema README "Blocks built from the page's
  content" + 05-launch step 2.

## Verified
`verify-seo-v3.mjs` CLEAN and `verify-posts-v3.mjs` POSTS CLEAN on **both** hosts; `verify-seo-v2.mjs`
ALL CLEAN on production; `vocab-check.mjs` VOCAB CLEAN; live checks: `/llms.txt` 200 text/plain,
robots 200, sitemap 81 × 2026-10-06, `/dental-implants/?utm_source=t` → 301 with the query kept.

## Gotchas
- **The scan and gate read class names**: `pk-crumb`/`bl-rc`/`bl-related`/`quote-by` on production,
  `breadcrumb_component`/`article_rail-card`/`article_related`/`pull-quote_author` on staging since
  the Client-First migration. Both are accepted now; check `class-standard/class-map.json` if more
  names move.
- `verify-seo-v3.mjs` refuses to call fewer than 50 URLs clean. Staging serves an empty sitemap, so
  the gate then reads production's paths on the staging host. It passed with **0 URLs** before
  this guard was added.
- The YouTube library films belong to "The Wellness Hour" channel: no `publisher` on them.
- Post titles come from the hero H1 now: the body H1 is gone, so `scan-sections.mjs` reads the page's.

## Open — needs the client or a decision
- H1s in the keyword form of the Hackensack reference ("Dental Implants in McLean, VA"), and
  service-page copy depth (~35% shorter than the WordPress pages).
- "Dental Group of Tysons" still in 14 post bodies (CS item since 2026-10-02).
- 7,000 (/about) vs 18,000+ (home, /meet-dr-nahlah) implants placed; identical hours for both offices.
- Submit the sitemap (and `/llms.txt` needs nothing) in Search Console; watch Enhancements.
