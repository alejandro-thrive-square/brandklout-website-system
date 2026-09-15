# 2026-09-15 — Staging created, and the sitemap is live

Two asks: create a staging copy of the med spa, and give the site a sitemap.

## Done

### Staging: `https://staging.westlaketxmedspa.com` (admin: `/admin`)

- **Railway environment** `staging` (`ca87e7fd-2965-4fad-a082-0eaec9e8e3cf`) in project
  `Stone Med Spa` (`ad4db12e…`), duplicated from production.
  - Its own volume at `/app/storage` (`0ce58364…`).
  - `PUBLIC_ORIGIN=https://staging.westlaketxmedspa.com` and nothing else.
  - **No generated `*.up.railway.app` host was ever created**, so the only way in is through
    Cloudflare.
- **Admin** created through `/admin/api/cms/setup` with the same `INSTATIC_EMAIL`/`INSTATIC_PASSWORD`
  as production, so one login works on both. Sang is **not** on staging.
- **Seeded from production** with `bk-mason-park`'s `deliver/process/21-instatic-staging-clone`
  (`d1baa68d`), run from a scratch copy:
  - `clone-site --strategy replace --media`: a 6.82 MB bundle, 11 pages and 73 media, in 6.3 s.
  - `clone-plugins`: Embed Origins 1.6.0 with its 6 settings. It is production's only plugin; the
    files were pulled off the production container with `railway ssh`.
  - `publish-rows`: 0 of 0, because this site has no collections.
  - Published: 11 pages.
- **Edge**
  - CNAME `staging` → `fhshpnvc.up.railway.app` plus the `_railway-verify.staging` TXT. The CNAME
    was DNS-only until Railway reported `CERTIFICATE_STATUS_TYPE_VALID`, then proxied.
  - A response-header Transform Rule (ruleset `8b554b88…`, the zone's first) sets
    `X-Robots-Tag: noindex, nofollow` for `http.host eq "staging.westlaketxmedspa.com"` only.
- **Gates**
  - `diff-sites`: 11/11 content-equivalent, 0 differences. `srcset` is 111 against 0, the known
    variant gap.
  - `check-noindex`: OK.
  - `check-origins --all`: exit 0, and the staging admin is OK.
  - `verify-live` against staging: `FAIL` only on titles, and production fails the same way (see
    Next 1).
- `sites.json` has the `stone-med-spa-staging` entry.

### The sitemap: `https://westlaketxmedspa.com/sitemap.xml`

- New workflow `workflows/06-cloudflare-sitemap/`, with a builder, deployer, verifier and directive.
  It is module 19's sitemap Worker (on the `bk-dr-nahlah` branch) cut down to the sitemap: this site
  has no old platform and so no 301 map.
- 10 URLs on the apex, taken from the production admin API, each 200. `/thank-you` is excluded.
- Worker `westlaketxmedspa-sitemap`, routes `westlaketxmedspa.com/sitemap.xml*` and
  `www.westlaketxmedspa.com/sitemap.xml*`. `robots.txt` is not routed, so it is still Cloudflare's
  1248 B file.
- `verify-sitemap.mjs`: `FAIL  none`.
- The Cloudflare token was minted from `CLOUDFLAREAPI` for 4 hours, scoped to this zone, with
  Workers Scripts added. It has been **revoked**.

## Next

1. **Every production page has the same `<title>`**:
   `Westlake Medical Aesthetics | Westlake, TX &amp; Dallas Forth Worth Area`. "Forth" is a typo.
   - On 2026-09-04 and 2026-09-10, `verify-live` reported 11/11 distinct titles. The pages'
     `publishedAt` is now **2026-09-12**, after our last push, so someone changed them in the
     admin, probably through the site-wide meta title.
   - Check the audit log before touching it. It is a client-side edit, not ours.
2. **Submit the sitemap** in Google Search Console and Bing Webmaster Tools. robots.txt cannot name
   it (see the gotchas).
3. **Still no canonical and no `og:url`** on production. The Open Graph plugin is not installed here;
   `check-noindex` notes it too.
4. **Sang on staging**, if he needs it. Copy the row the way the 2026-09-10 run did.
5. Rebuild and redeploy the sitemap whenever a page is added or renamed. It is baked into the Worker.

## Gotchas

- **Set `PUBLIC_ORIGIN` first, and never mint the generated Railway host.** This avoids both Surgical
  Arts traps from the same morning:
  - The deploy that `volumeCreate` triggered booted with the staging origin already set, and there
    was no `403 invalid origin`.
  - There was no unprotected door to delete afterwards.
  - Setup is claimed through the custom host once Railway verifies it. Until then nobody can reach
    it.
- **This workstation's resolver returned NXDOMAIN for the new subdomain** long after the record
  existed, even after `ipconfig /flushdns`. The VPN caches upstream.
  - The claim went through `curl --resolve staging.westlaketxmedspa.com:443:<ip from DoH>`, because
    setup was open and could not wait.
  - The Node toolkit ran with `node -r doh-lookup.cjs`, a preload that overrides `dns.lookup` for
    `*.westlaketxmedspa.com` with a Cloudflare DoH answer. It works with global `fetch`.
  - A process caches the answer, so a probe run right after proxying still hits Railway directly.
    Start a new process.
- **A Worker route ending in `/sitemap.xml` does not match `/sitemap.xml?x=1`.** The request fell
  through to Instatic's `404 application/json`. The first deploy's routes were replaced with `…*`.
- **The Stone Surgical Arts token permission set has no Workers Scripts.** Its upload answers
  `10000 Authentication error`. Add `Workers Scripts Write` by name from `/tokens/permission_groups`.
- The staging-clone module is still only on the `bk-mason-park` branch as `21-…`, and it collides
  with `21-instatic-upload` elsewhere. The two gotchas above belong in its directive when it is
  promoted.

## Version Control

Tracked. Committed with the work it describes.
