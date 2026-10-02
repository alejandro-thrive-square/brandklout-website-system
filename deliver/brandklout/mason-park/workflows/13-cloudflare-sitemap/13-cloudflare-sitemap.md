# Workflow 13 — Cloudflare sitemap (www.masonparkdental.com)

> [!IMPORTANT]
> **Integrity Rule**: when the inclusion rules, the scripts or the routes change, update this file in
> the same commit. The rules live only in `build-sitemap.mjs`. Never edit the generated Worker.

## Client-Facing Overview

Search engines find a site's pages through `/sitemap.xml`. Instatic does not generate one, so the
sitemap is built from the live production site and served by Cloudflare in front of it. It lists
every public page and blog article, and leaves out pages nobody should land on from search.

## Operational Purpose

Instatic has no sitemap route and no setting for one, and on the Free plan a Cloudflare Worker is
the only option that works (module 19, on `bk-dr-nahlah`). This is Stone's
`06-cloudflare-sitemap` (on `bk-stone-med-spa`), adapted to this site: www is canonical, and the
Articles collection is listed alongside the pages.

## Run

From this folder:

```bash
node build-sitemap.mjs        # production admin API -> .tmp/out/; every URL must be 200, self-canonical, not noindex
node ../12-legacy-redirects/cf-token.mjs mint
CLOUDFLARE_API_TOKEN=$(cat ../12-legacy-redirects/.tmp/.cf-token) node deploy-sitemap.mjs           # dry run
CLOUDFLARE_API_TOKEN=$(cat ../12-legacy-redirects/.tmp/.cf-token) node deploy-sitemap.mjs --apply
node verify-sitemap.mjs       # must end "FAIL  none"
node ../12-legacy-redirects/cf-token.mjs revoke
# undo: deploy-sitemap.mjs --rollback --apply (with a token)
```

**Rebuild and redeploy whenever a page or article is added, removed or renamed.** The sitemap is baked
into the Worker; it does not follow the site by itself.

## What is deployed (2026-10-02)

- Worker `masonparkdental-sitemap` on the BrandKlout account.
- One route, `www.masonparkdental.com/sitemap.xml*`. The apex already 301s `/sitemap.xml` to www.
  Staging has no route.
- 241 URLs: 80 pages and 161 articles. `<loc>` is `https://www.masonparkdental.com/<slug>` with no
  trailing slash, matching every page's canonical.
- **Left out:** the `blog-article` template, `404`, `thank-you`, the six root ad forwarders
  (`invisalign`, `new-patient-special` and their consultation/thank-you pages), and the whole
  `/ads-landing-pages/` set (paid traffic only).
- **Kept:** the old production-only pages that still serve (`team/*`, `faq-page`, `dental-implant-costs*`,
  `toothpaste-chart` and the rest). They are live and self-canonical. If one is retired or redirected,
  add it to `EXCLUDE` and redeploy.

## Gotchas

- **A route ending in `/sitemap.xml` does not match `/sitemap.xml?x=1`.** The route ends in `*`, and
  the Worker answers only the exact pathname.
- **Never route `/robots.txt` through the Worker.** It would replace Cloudflare's content-signals
  file. So robots.txt names no sitemap. **Submit `https://www.masonparkdental.com/sitemap.xml` in
  Google Search Console and Bing Webmaster Tools by hand.**
- `09-static-rebuild/home/sitemap.xml` is the pre-launch build, on the old `bestdentistinkatytx.com`
  origin. Instatic never served it; do not deploy it.
- The token comes from workflow 12's `cf-token.mjs` (account-wide zone and Workers permissions, 3 hours).
  Always revoke it.

## Version Control

The scripts, this directive and `.tmp/out/` (the record of what was deployed) are committed. No token is
ever written to the repo: `.cf-token` is gitignored under workflow 12.
