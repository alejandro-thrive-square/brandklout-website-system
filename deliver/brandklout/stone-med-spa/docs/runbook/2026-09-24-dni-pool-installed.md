# 2026-09-24 — The med spa's own GoHighLevel number pool, on production

Asked: add the DNI pool to Westlake Med Spa and keep the display number as it is:
`…/loc/hNRZyhDNM7ZTpBZx63xO/pool/vHDCe45MFTjdydJul0cd/number_pool.js` + `user_session.js`.
This is the med spa's own GHL location, not Surgical Arts' (`AtD362nKfN6w4mwob4iV`).

## Done

- `05-instatic-upload/set-dni-pool.mjs --pool <url> --apply` on production. Embed Origins
  `siteScripts` is now Sienna, Termly (`autoBlock=off`), the pool, `user_session.js`.
  `connectOrigins` gained `services.leadconnectorhq.com` + `services.msgsndr.com`. Settings were
  read back, then the site republished (`{"publishedPages":13}`).
- No page content changed: the display number stays **(817) 674-2061**. Staging is untouched and has no pool.

## Verified

- Every sitemap route on production (12/12) has the pool tag, and its CSP `connect-src` allows
  `services.leadconnectorhq.com`. The staging home has no pool tag.
- **The swap is proven**, with the cookie banner never answered (no consent). In one headless
  Chrome visit, `assign-number` returned 201 with forwardingNumber `+18176742061` and assigned
  `(817) 309-6523`. The page's `tel:` links and text showed `(817) 309-6523`.
- Consent does not block it: the pool tags are untagged (no `type="text/plain"`/`data-categories`).

## Gotchas

- If a browser keeps showing the display number, try an incognito window first. Alejandro saw no
  swap on Surgical Arts in his normal browser and a working swap in incognito, likely an old pool
  session/cookie from before the change.
- Every proof visit claims a real pool number (one used here).

## Version Control

Tracked. Follows the runbook rules in [SYSTEM_RULES.md §5](../../../../../SYSTEM_RULES.md).
