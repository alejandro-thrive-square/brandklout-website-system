# 2026-09-15 — The 301 map built (not deployed), and staging created

Two asks: prepare the 301 redirects from the old site, and create a staging copy of the live site.

## Done

### Staging: `https://staging.dfwsurgicalarts.com`

- **Railway environment**
  - `staging` (`7c0d13f8-824e-4d81-8ebb-531abf478aeb`) in project `b3cae5d8…`, duplicated from
    production.
  - Its own volume at `/app/storage` (`4f53d463…`).
  - `PUBLIC_ORIGIN=https://staging.dfwsurgicalarts.com` and nothing else.
- **Admin**
  - Created through `/admin/api/cms/setup` with the same `INSTATIC_EMAIL`/`INSTATIC_PASSWORD` as
    production, so one login works on both.
  - Sang is **not** on staging yet.
- **Seeded from production** with `bk-mason-park`'s `deliver/process/21-instatic-staging-clone`
  (`d1baa68d`), run from a scratch copy:
  - `clone-site --strategy replace --media` gave 52 pages and 124 media in one 15.4 MB import.
  - `clone-plugins` installed Embed Origins 1.6.0 with its 6 settings. Its files were pulled off
    the production container first.
  - Published: 52 pages.
- **Gates, all clean**
  - `diff-sites` against production: 52/52 content-equivalent. `srcset` is 336 against 0, which is
    the known variant gap.
  - `verify-live.mjs` against staging: `FAIL  none`.
  - `check-noindex`: exit 0.
- **Edge**
  - CNAME `staging` → `ryx1ui8k.up.railway.app`, first DNS-only with the `_railway-verify.staging`
    TXT, then proxied once Railway reported the certificate `VALID`.
  - A response-header Transform Rule on the dfw zone (ruleset `30db9516…`) sets
    `X-Robots-Tag: noindex, nofollow` for `http.host eq "staging.dfwsurgicalarts.com"` only.
  - The generated `stone-surgical-arts-staging.up.railway.app` host was **deleted**, because it
    bypasses Cloudflare. It now answers 404.
- `sites.json` has the staging entry.

### The 301 map: built and dry-run, NOT live

- `workflows/14-migration-seo-redirects/`: builder, deployer, verifier and the client directive.
  - **185 known old URLs go to 50 destinations**, every destination 200 on www.
  - 48 of the URLs are articles, derived from `source` in `blog-data.mjs`.
- `stonesurgicalarts.com` today has one Single Redirect, expression `true`, that sends every path to
  `https://dfwsurgicalarts.com` and drops the path. The deploy replaces it with a Worker. The
  directive explains why this isn't a Bulk list.
- **The dry run read the zone correctly**: 1 catch-all, no Worker routes. **Nothing on the old
  domain has changed.**
- The Cloudflare token used today was a 4-hour token minted from `CLOUDFLAREAPI`, scoped to the two
  Stone zones. It has been **revoked**.

## Next

1. **Approve and deploy the map.**
   - Mint a scoped token (see the directive).
   - `deploy-redirects.mjs --apply`, then `verify-redirects.mjs` must end `FAIL  none`.
   - `--rollback --apply` restores today's behaviour.
2. **The 19 skin and non-surgical URLs are `provisional`** and go to `/treatments`. Where they
   should go was not decided. The user was unsure, and the med spa at `westlaketxmedspa.com` is the
   other candidate.
3. **Production has no canonical tag, no sitemap and no privacy/HIPAA page.**
   - `check-noindex` notes the missing canonical. `/sitemap.xml` is a 404.
   - Module 19's sitemap Worker (on the `bk-dr-nahlah` branch) is the known fix for the sitemap.
   - A medical practice site without a privacy page is worth raising.
4. **Sang on staging.** Copy the row the way the 2026-09-10 run did, if he needs it.
5. **`apex` and `www` both serve production with 200.** A canonical-host redirect (apex → www) is
   still open; module 19's `deploy-canonical-host.mjs` is the pattern. The map already targets www.

## Gotchas

- **A duplicated Railway environment comes with NO volume.**
  - `environmentCreate` with `sourceEnvironmentId` copied the variables, including production's
    `PUBLIC_ORIGIN` verbatim. It copied no domains and no volume instance.
  - Instatic without `/app/storage` would lose everything on the next deploy.
  - `volumeCreate` it, mount path `/app/storage`, **before** seeding.
- **`skipInitialDeploys: true` did not keep it from deploying.**
  - One of the volume or domain mutations triggered a deploy, and that deploy booted with
    production's `PUBLIC_ORIGIN`.
  - As a result, setup answered `403 invalid origin`, even though the variable had already been
    changed.
  - `serviceInstanceRedeploy` after the variable change fixed it. **Until the admin is claimed,
    setup is open to anyone who can reach the host**, so claim it immediately.
- **Instatic 0.0.19 has no URL-redirect layer.**
  - There is only `data_row_redirects`, for renamed collection rows. `/admin/api/cms/redirects` is
    a 404.
  - A legacy map has to live at the edge.
- **`bk-mason-park` promoted staging-clone as `deliver/process/21-…`**, which collides with this
  worktree's `21-instatic-upload`. It is not merged to `main`. Settle the number when either is
  promoted. The two gotchas above belong in that module's directive.
- `lib.mjs` in the staging-clone module throws when no `.env` is found walking up from the
  script's directory. A scratch copy needs one holding only the two `INSTATIC_*` keys. Delete it
  after.

## Version Control

Tracked. Committed with the work it describes.
