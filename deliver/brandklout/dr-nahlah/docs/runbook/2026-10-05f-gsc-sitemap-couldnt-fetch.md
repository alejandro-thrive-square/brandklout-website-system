# 2026-10-05f — Search Console "Couldn't fetch" on the sitemap: legacy WordPress sitemaps 301'd

The user reported that Search Console (domain property `sc-domain:drnahlah.com`) said the sitemap
"couldn't fetch". They asked for a Cloudflare-side fix, without touching Search Console.

## Diagnosis
- `https://www.drnahlah.com/sitemap.xml` returns 200 `application/xml` with 81 URLs and valid XML.
  Real Googlebot (`clientAsn` 15169, 66.249.65.3) fetched it with a **200** at 02:26 UTC.
- Bot Fight Mode, AI-bot blocking and crawler protection are all off, and there are no custom WAF
  rules. The firewall blocks on a "Googlebot" user agent were scanners from other ASNs.
- Google *was* still requesting the old WordPress sitemaps (`/category-sitemap.xml` 404 on
  2026-10-02, `/sitemap_index.xml` 404). Those 404ing rows are what Search Console shows as
  "Couldn't fetch".

## Done
- **11 Bulk Redirect rows** in `drnahlah_301` (198 → 209): `sitemap_index.xml`, `wp-sitemap.xml`,
  `page-/post-/category-/post_tag-/author-/local-/attachment-sitemap.xml`, `page-/post-sitemap1.xml`
  → 301 `https://www.drnahlah.com/sitemap.xml`. These are apex sources with include_subdomains, added
  by `redirect-legacy-sitemaps.mjs`. Verified on www (1 hop) and apex (2 hops), ending at 200 XML.
- **Worker `drnahlah-seo` code uploaded** (`--script-only`). robots.txt now embeds Cloudflare's
  content-signals policy verbatim (`CF_POLICY`) plus the `Sitemap:` line, and no longer fetches the
  origin. The live sitemap is unchanged (200, 81 URLs).
- `deploy-worker.mjs`: routes are now `www.drnahlah.com/sitemap.xml*` and `www.drnahlah.com/robots.txt*`,
  and `--apply` deletes the retired exact patterns. Directive: gotcha 1 is amended and gotcha 8 is added.

## Next
- **Bind two routes in the Cloudflare dashboard** (Workers Routes, zone drnahlah.com, worker
  `drnahlah-seo`): `www.drnahlah.com/robots.txt*` and `www.drnahlah.com/sitemap.xml*`. Then delete
  the exact `www.drnahlah.com/sitemap.xml` and `drnahlah.com/sitemap.xml` routes. Until then:
  - robots.txt still has no `Sitemap:` line;
  - `/sitemap.xml?x` still 404s. This doesn't matter for Search Console.
- Search Console re-reads the legacy rows on its own schedule. They should clear without action.

## Gotchas
- **`CLOUDFLAREDIAGNOSIS` is read-only.** It reads routes, settings, bot management and GraphQL
  analytics, but returns 403 on script upload, route writes and ruleset writes.
- **`CLOUDFLAREAPI` (the `[shared]` default) can write account lists and upload the worker script.**
  It returns 403 on zone routes, rulesets, settings and analytics.
- **No token we hold can bind a Worker route or write a Single Redirect rule.** Those are dashboard
  jobs, or need a new token.
- Bulk-list rows take about 1 minute to propagate. The first verify showed 404 on 10 of 11 rows.
