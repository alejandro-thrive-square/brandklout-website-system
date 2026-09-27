# Workflow 06 — Cloudflare sitemap (westlaketxmedspa.com)

## Client-Facing Overview

Search engines find a site's pages through `/sitemap.xml`. Instatic does not generate one, so the
med spa's sitemap is built from the live site and served by Cloudflare, in front of it. It lists
every public page and nothing else.

## Operational Purpose

Instatic has no sitemap route and no setting for one. Module 19 (`deliver/process/19-cloudflare-launch/`,
on the `bk-dr-nahlah` branch, not on `main`) shows every alternative is closed and a Cloudflare
Worker is the one that works on the Free plan. This workflow is the slice of module 19 this site
needs: it has **no old platform**, so there is no 301 map, and it serves the sitemap only.

## Run

```bash
node build-sitemap.mjs                          # pages from the production admin API; every URL must be 200
CF_TOKEN=<scoped> node deploy-sitemap.mjs        # dry run
CF_TOKEN=<scoped> node deploy-sitemap.mjs --apply
node verify-sitemap.mjs                          # must end "FAIL  none"
# undo: CF_TOKEN=<scoped> node deploy-sitemap.mjs --rollback --apply
```

**Rebuild and redeploy whenever a page is added, removed or renamed.** The sitemap is baked into the
Worker; it does not follow the site by itself.

### The token

The shared `CLOUDFLAREAPI` token has no zone permissions. Mint a 4-hour token from it with
`POST /accounts/{id}/tokens`. Scope it to zone `2625d8f91522c96d64e0a2d01799a574` with Workers
Routes Write, and give it account-wide Workers Scripts Write. Keep the value in the scratchpad only.
Pass it as `CF_TOKEN`, then `DELETE` it when you are done. The Stone Surgical Arts permission set
does **not** include Workers Scripts; add it by name from `/tokens/permission_groups`.

## What is deployed

- Worker `westlaketxmedspa-sitemap` on the Brandklout account.
- Routes `westlaketxmedspa.com/sitemap.xml*` and `www.westlaketxmedspa.com/sitemap.xml*`.
- `<loc>` uses the apex, `https://westlaketxmedspa.com`: it is the admin URL, the Railway public
  domain and the `seo.json` origin. www also serves 200 and has no redirect.
- `/thank-you` is excluded: it is the booking confirmation, not a page to land on from search.

## Gotchas

- **A route ending in `/sitemap.xml` does not match `/sitemap.xml?x=1`.** The request falls through
  to Instatic's `404 application/json`. The routes end in `*`, and the Worker answers only the exact
  pathname.
- **Never route `/robots.txt` through the Worker.** The Cloudflare-generated content-signals file
  would be replaced (module 19, trap 1). So robots.txt names no sitemap: **submit
  `https://westlaketxmedspa.com/sitemap.xml` in Search Console and Bing** by hand.
- Staging (`staging.westlaketxmedspa.com`) has no route and is noindex. It must never serve this
  file, and `verify-sitemap.mjs` checks that.

## Version Control

Scripts, this directive and `.tmp/out/` (the record of what was deployed) are committed. No token is
ever written to disk in the repo.
