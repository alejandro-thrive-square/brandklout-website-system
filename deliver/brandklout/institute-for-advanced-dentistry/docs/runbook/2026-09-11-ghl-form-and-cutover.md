# 2026-09-11 — GoHighLevel contact form, and the live cutover state

**Ask:** replace every instance of the WordPress contact form with the practice's GoHighLevel form
(`api.leadconnectorhq.com/widget/form/cxtQ5q29TfUr3cYlMmDB`).

## Done

- Inventoried the Fluent forms in the scrape. **#1** (the contact form) is on 57 pages, **#6** (a
  short variant) is on `dental-services/dental-implants`, **#3** (Refer a Patient, for dentists) is
  on `patient-referrals`, and `cosmetic-dentistry-ppc` has none.
- `prepare-wp.mjs` now replaces the `.fluentform` wrapper of #1 and #6 with an Embed block carrying
  the GHL snippet verbatim (`GHL_FORM`, `GHL_REPLACES`, passed into the in-browser `transform`).
  Rebuilt, shipped and force-pushed. Before the force push, every page row still carried the first
  push's `updatedAt` (19:50:42Z), so no admin edit was lost. Published `{"publishedPages":59}`.
- New gate `verify-ghl-form.mjs`: **all ok**. The GHL iframe is on the 58 expected routes, no
  contact Fluent form is left, and in Chrome it renders 516×682 at 1440 and 314×782 at 390, with
  6 fields, `form_embed.js` 200 and no CSP violation.
- **The nameservers were switched** at Squarespace by the user around 21:40Z; the zone went active
  at 21:44Z. Every email record is live on `ajay`/`ruth`: 5 MX, SPF, DMARC, and both DKIM
  selectors. The apex `ifadentistry.com` is on Railway (custom domain, CNAME
  `133e393p.up.railway.app`, certificate valid) and serves Instatic.
- `www.ifadentistry.com` was **down** with Cloudflare Error 1000: its record still held the old
  Cloudflare proxy IPs. Added `www.ifadentistry.com` as a Railway custom domain; it needs a CNAME
  to `wshw0478.up.railway.app`.

## Next

- Cloudflare: set `www` to CNAME `wshw0478.up.railway.app` (proxied), replacing the A/AAAA records.
- Create the rules in `../dns/URL-RULES.md`. Until then, nested URLs and `/about/` 404 on the
  domain.
- `PUBLIC_ORIGIN` is still only the Railway host, so admin saves through the domain fail with a
  403. Set it per `20-instatic-domain-origins`. That causes a redeploy, so the site is briefly down.
- Refer a Patient (#3) still posts to WordPress: it needs its own GHL form.
- Once both hosts answer: `node verify-wp-urls.mjs https://www.ifadentistry.com` and
  `node verify-ghl-form.mjs https://www.ifadentistry.com`.

## Gotchas

- `prepare-wp.mjs`'s DOM work runs in the browser through `tab.evaluate(transform, …)`. A module
  constant is not visible there, so pass it in the argument object.
- `verify-live-wp.mjs` compares against **www.ifadentistry.com**. Since the cutover that is no
  longer WordPress, so the gate cannot run as-is. Point it at WordKeeper's origin, or retire it.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../../SYSTEM_RULES.md).
