# 2026-09-24 - pediatricdentistkatytx.com: redirect to masonparkpediatricdental.com, prepped

The practice's old domain should 301 to `masonparkpediatricdental.com`. **The Cloudflare side is
done and tested. The redirect goes live the moment the nameservers move, and that step needs the
Squarespace account owner.**

### Where the domain is

- **Registrar: Squarespace Domains. Registry NS: `nsc1-4.squarespacedns.com`** (RDAP). The
  domain is **not** delegated to Cloudflare. It resolves to SiteGround `34.174.211.179`, which answers
  every path with `503` + `X-Suspended-Vhost: 1`, so the domain has been down.
- The Cloudflare zone `05ca6d0daa47593ec9f16404e3b6690d` (BrandKlout account, Free) has been
  **pending since 2026-08-31**. Its assigned NS are **`ajay.ns.cloudflare.com`, `ruth.ns.cloudflare.com`**.
- Nobody on our side has Squarespace access. The SiteGround account is suspended, and
  `ssh.pediatricdentistkatytx.com` no longer resolves. **There is no route to the redirect that avoids
  Squarespace.** The user sent a teammate a note asking the account owner either to add our agency
  email as a domain manager or to set the two nameservers above.

### Done in the zone (API, 2026-09-24)

- **Worker `pediatricdentistkatytx-redirect`** (source: `workflows/.tmp/legacy-domain/worker.js`):
  301 to `https://masonparkpediatricdental.com` + path + query, with `Cache-Control: max-age=3600`.
  Routes: `pediatricdentistkatytx.com/*` and `www.pediatricdentistkatytx.com/*`. workers.dev is
  enabled for testing.
- Apex and `www` A records are **proxied** (a Worker route needs the orange cloud). The origin is never
  contacted. Every mail record stays **DNS only**: MX x3 `mailspamprotection.com`, SPF, DKIM
  `default._domainkey`, DMARC, `mail`, `autodiscover`, `autoconfig`, `ftp`, `ssh`. The mail itself
  still depends on SiteGround.
- Deleted `localhost -> 127.0.0.1` (a scan import; same-site-scripting smell).
- Temp token `3fa0e2ec…` (zone DNS/Workers Routes/SSL + account Workers Scripts, 2 h) minted and
  **revoked**.
- `verify.mjs --via`: 3/3 pass on workers.dev (path and query kept).

### Next

1. When someone reports the NS change: run `node workflows/.tmp/legacy-domain/verify.mjs`. It prints
   the registry NS and checks apex, `www` and http on the real host. Cloudflare activates the zone
   within minutes to hours of the switch; Universal SSL follows.
2. When the new design replaces the WordPress mirror on masonparkpediatricdental.com, old WP paths
   that stop existing need their 301 map on **that** domain (a Worker; Instatic has no redirects).
   The blog map is `build-blog.mjs --list`. `/services/*` already 404s today, as it did on the old site.

### Gotchas

- **Redirect Rules cannot be written with an account-owned token**, whatever scope is minted.
  A Worker plus routes is the API route.
- A pending zone is not served at the edge; test the Worker on its workers.dev address.

## Version Control

Tracked with the client runbook, per [SYSTEM_RULES.md §4](../../../../../SYSTEM_RULES.md).
