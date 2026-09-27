# 2026-09-11 — Old URLs, admin origin, and the Cloudflare conflicts after the cutover

**Ask:** make the old URLs and the admin origin work on the live domain, and fix any conflicts on
Cloudflare. The user had already switched the nameservers at Squarespace.

## Done

- **URL rewrites.** `docs/dns/set-url-rules.mjs --apply` created 8 rules through the API (ruleset
  `925d309d…`). The shared token *can* write the `http_request_transform` phase, so
  `/about` and `/contact` are rewrites too.
- **`PUBLIC_ORIGIN`** set through Railway GraphQL `variableUpsert` to
  `https://www.ifadentistry.com,https://ifadentistry.com,https://…-production.up.railway.app`. A new
  deployment followed on its own (`917ce5ee`, 21:57Z). `sites.json` is updated.
- **Cloudflare conflicts.** The zone came from Cloudflare's import scan of the agency's zone:
  - `www` had 2 A and 2 AAAA records holding the agency's Cloudflare edge IPs, so it answered
    Error 1000. They were deleted, and `www` is now a CNAME to `wshw0478.up.railway.app` after
    adding `www` as a Railway custom domain.
  - Always Use HTTPS was off; it is now on.
  - The imported `_domainconnect` (Squarespace) record was proxied; it is now DNS-only.
  - The Google Workspace verification CNAME `52sz77enrdng` → `gv-jao53t4ibtm6xt.dv.googlehosted.com`
    was missing, because the import scan cannot guess it. It was copied from the (inactive)
    Squarespace DNS.
  - Redirect rule `ifadentistry.com` → `https://www.ifadentistry.com` (301, path and query kept)
    via `docs/dns/set-redirect-rules.mjs` (ruleset `d214c80b…`).
- The shared token gets 403 on DNS, redirect rules and settings, but holds **Account API Tokens
  Write**. A 2-hour token scoped to this zone was minted from it, used, then **revoked**, and its
  local copy deleted.
- **Verified on `https://www.ifadentistry.com`:** `verify-wp-urls.mjs` 61/61, `verify-ghl-form.mjs`
  all ok, `check-origins.mjs --all` clean (give `https://www.ifadentistry.com/admin`). Email records
  are intact (5 MX, SPF, DMARC, both DKIM).

## Next

- Refer a Patient (`patient-referrals`, Fluent #3) cannot submit: it needs its own GHL form.
- Once WordPress is retired: drop `a:bill.wordkeeper.net`, `mx` and `a` from SPF.
- Cancel the agency's WordPress hosting only after the client confirms nothing else lives there.
- `verify-live-wp.mjs` compares against www.ifadentistry.com, which is now Instatic. Retarget it or
  retire it.

## Gotchas

- **A proxied custom domain on Railway never validates from its CNAME alone**, because Railway
  sees Cloudflare's IPs. It needs `_railway-verify.<label>` TXT = the `verificationToken` from
  `domains{customDomains{status{verificationDnsHost verificationToken}}}`, and in practice the
  certificate only issued after the CNAME was set **DNS-only** for a few minutes (VALID at 22:20Z).
  Then turn the proxy back on: the URL rewrites and the apex redirect only run on proxied traffic.
- The redirect to `www` must go in **after** `www` serves, or it takes the whole domain down.
- Cloudflare's import scan copies the *old* zone's proxied records as the edge IPs themselves.
  Every such A/AAAA record is an Error 1000 waiting to happen once the zone is active.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../../SYSTEM_RULES.md).
