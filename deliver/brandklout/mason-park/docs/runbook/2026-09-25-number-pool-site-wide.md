# 2026-09-25 — The number pool on every production page, not only the ad pages

The client: "The swapping number seems not to be working ... Is working only on the landing pages".

**Why:** the pool script was only ever installed on the ad pages (a per-page Embed copied from the
Webflow ports). The rest of the site never loaded it. GHL shows the pool (`haD8dfHnprszNglZQtBV`) as
"All Visitors", 4 numbers, forwarding to (281) 769-8878: it is built to run site-wide.

**Done on production. Staging now has no pool.**

## What changed

- `.tmp/bugherd/set-site-pool.mjs`, read-merge-write on `brandklout.embed-origins`:
  - `siteScripts` gains `number_pool.js` and `user_session.js`, after Termly;
  - `connectOrigins` gains `https://services.leadconnectorhq.com` and `https://services.msgsndr.com`.
    Pages without an Embed run a strict CSP, and a missing connect-src silently turns the swap off.
  - The script refuses staging.
- `.tmp/bugherd/strip-page-pool.mjs` removed the per-page pool Embed from the 6 `/ads-landing-pages/`
  on both instances. Loading the pool twice would ask GHL for two numbers per visitor from a pool of
  four.
- `place-ad-embeds.mjs` has `SITE_WIDE_POOL = true`: it places no per-page pool, and later pushes will
  not bring it back.
- Staging: no pool anywhere, so agency reviewers no longer take real numbers.
- Not consent-gated (client, 2026-09-22).

## Verified

- Published HTML: one `number_pool.js` and one `user_session.js` on the home page, a service page,
  Contacts, the privacy policy, an ad page and an article. The CSP allows both hosts.
- `.tmp/bugherd/check-site-pool.mjs` (one visitor, cookie banner never accepted): home, a service
  page, an article, Contacts and an ad page all show **(281) 595-9422**, from a single
  `assign-number` call. Each run uses one pool number.

## Gotchas

- `siteScripts` load `async` in `<head>`. The pool script handles that itself (it waits for
  DOMContentLoaded when the DOM is not ready).
- The six retired root ad forwarders load the pool too, before they redirect. The visitor's pool
  cookie carries the number to the landing page.
- Strict-CSP pages already refuse Cloudflare's analytics beacon (`static.cloudflareinsights.com`) and a
  `data:` font. This predates the pool and is not part of it; the gate ignores it.

## Open

- A pool of 4 "All Visitors" numbers across the whole site means numbers are shared between concurrent
  visitors, so attribution is approximate at busy times. That is a GHL setting (pool size / tracking
  option) for the client.

## Version Control

This run file follows the runbook rules in [SYSTEM_RULES.md §5](../../../../../SYSTEM_RULES.md).
