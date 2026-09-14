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

### Gotchas

- Railway GraphQL `projects { ... }` answers **Not Authorized** with the CLI's OAuth token, while
  `project(id:)` works. Get the ids from `railway list --json`.
- `railway variables --set` triggered the redeploy immediately. `deployment list` showed it within 3 s.
- The shared `CLOUDFLAREAPI` still cannot read `dns_records` (10000). Mint a scoped token and revoke it afterwards.
