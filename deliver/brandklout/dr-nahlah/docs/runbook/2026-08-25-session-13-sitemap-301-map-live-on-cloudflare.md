## DONE 2026-08-25 (session 13): sitemap + 301 map LIVE on Cloudflare

**Deployed and verified against production — `verify-live.mjs` is 210/210.**
Zone `drnahlah.com` (Free plan), account `45ec80048aabfb983a20f415546f62c7`.

- Worker `drnahlah-seo` serves `/sitemap.xml` (79 URLs) on www + apex.
- Bulk Redirect list `drnahlah_301`, 190 rows, all 190 land correctly.
- apex -> www Single Redirect, query string preserved.
- Nothing about Instatic changed. Cloudflare Free covers all of it; Pro was
  considered and is NOT needed (Pro does not add regex to redirect rules --
  that is Business).

Everything is generated: `build_cloudflare.mjs` -> `.tmp/out/`, gated by
`verify_cloudflare.mjs` (32 assertions incl. a live fetch of all 79 sitemap URLs),
deployed by `deploy-*.mjs`, checked by `verify-live.mjs`. Full write-up and the
seven gotchas are in `14-migration-seo-redirects.md`.

### The three that will bite the next person

- **Never route `/robots.txt` through a Worker on this site.** That
  content-signals robots.txt comes from CLOUDFLARE, not Instatic. I routed it,
  the Worker's origin fetch 404'd, and the file went 1248 B -> 70 B in
  production. Routes removed, restored. Cost: robots.txt has no `Sitemap:` line.
- **`http_request_dynamic_redirect` runs BEFORE `http_request_redirect`** --
  backwards from the names. Single Redirects beat Bulk Redirects, so apex + an
  old URL is two hops. Not worked around: a redirect-kind list cannot be
  referenced in a boolean expression (`20127`), and enumerating the paths would
  duplicate the map.
- **`Account Filter Lists` != `Mass URL Redirects`.** The first owns the list,
  the second owns the rules. Missing the first gives a 403 that reads like a bad
  token. Also: account-owned tokens 401 on `/user/tokens/verify` while being
  perfectly valid.

### NOT done

1. **Sitemap not yet submitted to Google Search Console.** That is the next step
   and it matters: the 43 articles were 404 until 2026-08-25, so anything Google
   recrawled in that window was dropped.
2. **The Cloudflare token is still live**, expires 2026-11-23, and can see all
   7 Brandklout zones. Revoke it when the work is finished.
3. **The 6 review cards are still on the Instatic DRAFT, unpublished** (from
   session 12c). `draftMatchesPublished: false`. The reviews widget was empty
   because the client changed a password and disconnected it at the vendor --
   NOT an Instatic fault. Once reconnected the cards are redundant; revert from
   `15-instatic-api-sync/.tmp/backups/pre-review-wall-index.json` or publish.
4. **No `<link rel="canonical">` anywhere** and no og:/twitter tags. That is the
   `publish.html` SEO plugin, still unbuilt. It needs a per-page og:image set,
   which does not exist yet.
5. Nothing committed.
