## 2026-09-14 - masonparkpediatricdental.com points at the Instatic site on Railway

### Done

- **Delegation was already correct.** Registrar is Squarespace; RDAP shows NS `cory`/`gail.ns.cloudflare.com`,
  no DS (DNSSEC off). The Cloudflare zone `190398a3ac1d772f94e19a8352d97d92` (Agency@brandklout.com's account)
  was active and empty. No mail on this domain, so no MX/SPF to carry.
- **Railway** (project `a135c5ec-...`, service `Mason Park Kids`, env `f9cddccd-...`, port 8080):
  `customDomainCreate` for apex and `www`.
- **Cloudflare records**, all DNS-only:
  - `@` CNAME `rilrbg82.up.railway.app`, `www` CNAME `rfgntzcj.up.railway.app`
  - `_railway-verify` and `_railway-verify.www` TXT (tokens from the domain's `status`)
  - `gneb33nrpgdr` CNAME `gv-b4vlaco2psmlmq.dv.googlehosted.com`, a Google verification record copied from
    the Squarespace custom records (inactive there since the NS moved)
  - SSL/TLS set `full` -> `strict`.
- **Certs**: both hosts reached `VALID` about 3.5 min after the records went in. Both return 200.
- **PUBLIC_ORIGIN** = `https://www.masonparkpediatricdental.com,https://masonparkpediatricdental.com,https://mason-park-kids.up.railway.app`.
  The redeploy (`5eceaac6`) appeared and succeeded. `check-origins.mjs` shows all three OK, exit 0.
  `sites.json` updated. `INSTATIC_BASE_URL` is unchanged, since the Railway host still passes.
- The temporary zone-scoped Cloudflare token (id `7c4bc415...`) was minted from `CLOUDFLAREAPI` and revoked.

### Next

- **Canonical / og:url on every page still say `https://pediatricdentistkatytx.com/`.** Decide which
  domain is primary. If it is this one, change the site URL used by `deliver/process/19-instatic-seo`
  and republish. Either way, `pediatricdentistkatytx.com` (SiteGround redirect) should 301 here.
- `/sitemap.xml` returns 404 on this host.
- Optional: proxy apex and `www` (SSL is already strict), then add an apex -> www redirect rule.
  Until then both hosts serve the same pages.

### Later the same day - the new design moves to staging; WordPress should take the domain

The user decided the new design is **not ready for production**. The target is
`masonparkpediatricdental.com` serving the old WordPress site, with the new design on staging.

- **Staging is done.** `staging.masonparkpediatricdental.com` is a Railway custom domain (CNAME
  `h7jea8a1.up.railway.app`, TXT `_railway-verify.staging`, both DNS-only). The certificate was VALID in
  about 1 min. `PUBLIC_ORIGIN` is now staging, www, apex, then the railway host. The redeploy is `1be98212`, and
  `check-origins` passes. A second temporary CF token was minted and revoked.
- **WordPress is BLOCKED: the SiteGround site is suspended.** `pediatricdentistkatytx.com` returns
  `503` with `x-suspended-vhost: 1` and the "Site Currently Unavailable" page. The SSH key
  `.secrets/sg_pediatric_recovery` is now `Permission denied (publickey)`. Only the SiteGround Client
  Area can lift the suspension. The reason (billing, cancellation, or a security hold after the 31-Aug
  intrusion attempt) is unknown.
- `pediatricdentistkatytx.com` finished its registrar transfer: it is now at **Squarespace
  Domains** with Squarespace DNS, A `34.174.211.179` (SiteGround), and MX at `mailspamprotection.com`.
- **Not done, pending the user:** apex and `www` still point at the new design on Railway. Pulling
  them now would leave the domain blank. To serve WordPress there once it is un-suspended, SiteGround
  needs `masonparkpediatricdental.com` added (as a parked domain or new primary) with SSL, the WP
  `home`/`siteurl` changed (or a redirect to the old domain), and the SiteGround Site Tools redirect removed. Then point
  apex/`www` at SiteGround and drop them from Railway and from `PUBLIC_ORIGIN`.
- Staging has **no `noindex`** and `/robots.txt` is a 404.

### Later again - the old site is back on the domain, from the local static copy

The user remembered a local copy. It is the mirror from 27 Aug:
`workflows/01-site-recovery/.tmp/recovered/mirror/`. It is gitignored, so it exists on this disk only.
It holds 40 pages and 767 files (62 MB). Every URL is root-relative, and external `<script>`/`<iframe>` tags are
stripped. `.tmp/verify-safe.mjs` still passes 8/8.

- Deployed as-is to **Cloudflare Pages project `mason-park-kids-wp`** (<https://mason-park-kids-wp.pages.dev>).
  `wrangler pages project create` failed: wrangler 4.131 delegates it to Workers and reported "could not
  detect a directory". Creating the project with `POST /accounts/{id}/pages/projects` worked, and then
  `wrangler pages deploy <mirror> --project-name mason-park-kids-wp --branch main` uploaded it.
- The apex and `www` are attached as Pages custom domains. Their CNAMEs were PATCHed to
  `mason-park-kids-wp.pages.dev`, **proxied**. The `_railway-verify` TXT for apex/www was deleted. Both
  domains went `active` in about 2 minutes. `www` served 522 for about a minute in between.
- The apex and `www` were removed from Railway (`customDomainDelete`). `PUBLIC_ORIGIN` is now
  `https://staging.masonparkpediatricdental.com,https://mason-park-kids.up.railway.app`, redeploy `4e9a83e9`.
  `check-origins --all` is clean.
- Verified on the real domain: pages 40/40 and homepage + about assets 96/96, all 200.
  Staging still serves the new design.
- Booking still works statically. The site books through `flexbook.me/masonpark/1` and `tel:` links.
- The third temp CF token (account Pages Write + zone DNS Write) was revoked.

**Known gaps. The first two are faithful to the old site, not caused by the copy:**
- 17 `/services/*` menu links 404. They already 404'd on the live WordPress (see 2026-08-28).
- The 157 blog posts were never mirrored. Post links (for example `/teeth-stages-childrens-dentist-katy/`) 404.
  The WXR and DB dump are in `.tmp/recovered/` if the posts are ever wanted.
- The one contact form (`/before-after/`, CF7) cannot submit. Maps and embeds were stripped.
  The theme's demo pages (shop, cart, wishlist, blog-masonry) remain, as they did on the live site.

### Gotchas

- `x-suspended-vhost: 1` on a SiteGround 503 means the account or site is suspended, not that WordPress crashed.
  Look at the headers before debugging PHP.

- Railway GraphQL `projects { ... }` answers **Not Authorized** with the CLI's OAuth token, while
  `project(id:)` works. Get the ids from `railway list --json`.
- `railway variables --set` triggered the redeploy immediately. `deployment list` showed it within 3 s.
- The shared `CLOUDFLAREAPI` still cannot read `dns_records` (10000). Mint a scoped token and revoke it afterwards.
