# 2026-10-02 — /sitemap.xml served by Cloudflare on www.masonparkdental.com

## Done

- New workflow [`workflows/13-cloudflare-sitemap`](../../workflows/13-cloudflare-sitemap/13-cloudflare-sitemap.md),
  ported from Stone's `06-cloudflare-sitemap`. It builds the sitemap from production's admin API
  (page rows plus the `/blog` Articles collection).
- Worker `masonparkdental-sitemap` deployed; route `www.masonparkdental.com/sitemap.xml*` (id `91b9f830…`).
- 241 URLs (80 pages, 161 articles), every one 200, self-canonical, no noindex.
- `verify-sitemap.mjs`: `FAIL  none`. www serves it as `application/xml`, with and without a query
  string. The apex 301s to it, robots.txt is still Cloudflare's, and staging returns 404.
- Token minted with `12-legacy-redirects/cf-token.mjs` and revoked the same session.
- Commit: see the client RUNBOOK row.

## Next

- **Submit `https://www.masonparkdental.com/sitemap.xml` in Google Search Console and Bing.**
  robots.txt cannot name it without replacing Cloudflare's file.
- Rebuild and redeploy after any page or article is added, removed or renamed.
- When the Google Ads final URLs move and the root forwarders go, nothing changes here: they are
  already excluded.

## Gotchas

- The old `09-static-rebuild/home/sitemap.xml` uses the `bestdentistinkatytx.com` origin. It is stale and
  was never served.
- No production page carries `noindex`, including the ad and thank-you pages. They are left out of
  the sitemap by rule (`EXCLUDE` plus the `ads-landing-pages/` prefix), not by a meta tag.
