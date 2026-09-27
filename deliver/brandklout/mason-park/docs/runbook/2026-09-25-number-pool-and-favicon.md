# 2026-09-25 — The client's number pool, never consent-gated; and a favicon at last

The client:

> [the two scripts] This is the correct number pool script. We need to update and make sure the cookie
> consent does not block it

> Also the favicon please

**Both are done and live on staging and production.**

## Number pool

- **New**: location `9tm8C3iReDUyrhdV01Kd`, pool `haD8dfHnprszNglZQtBV` (the same GHL location as the
  three forms added this morning). **Old**: location `mZ2q3yXtue090i2YLcrj`, pool `IEOmxFRkrrKh72B8hqHg`.
  `user_session.js` is unchanged. Both pool scripts are the same code with different ids, and they call
  the same hosts, so the ad pages' CSP already covered the new one.
- Swapped live by `.tmp/bugherd/swap-number-pool.mjs` on staging (the 6 `/ads-landing-pages/`) and
  production (those 6 plus the 6 root Webflow-port ad pages the live ads use). The source,
  `10-lp-instatic/.tmp/out/tracking.json`, was updated too, so later pushes keep it.
- **Consent**: the pool is deliberately not gated (client decision, 2026-09-22). Termly runs with
  `autoBlock=off`, and the pool tags carry no `type="text/plain"` or `data-categories`.
- **Proof**: one fresh Chrome on production `/invisalign` with UTM params and the Termly banner up,
  nothing accepted. The new pool script loaded, `number-pools/assign-number` returned 201, every
  `tel:` link read **(281) 215-7453** (the old pool showed (281) 645-5375), and the console had no CSP
  errors. That test consumed one pool number.

## Favicon

- Instatic has no favicon setting and serves nothing at `/favicon.ico`, so every tab had a blank
  icon. The old WordPress and Webflow sites had none either.
- The icon is the practice's tree mark in white on the site's copper (`#8c6349`, the theme-color).
  `.tmp/favicon/render-favicon.mjs` renders it with Chrome at 512, 192, 180, 48 and 32px, with a
  thicker stroke at 48 and 32.
- **`brandklout.open-graph` 1.2.0**: new `favicon` and `appleTouchIcon` settings, written into every
  published page by its `publish.html` filter, ahead of the social-tag early return. Pages that name
  their own icon are left alone. The plugin was promoted to `deliver/process/18-instatic-embeds/open-graph/`
  (the dr-nahlah copy is still 1.1.2). Installed on both instances; every existing setting survived
  the upgrade (saved first in `.tmp/bugherd/og-settings-*-2026-09-25.json`).
- `.tmp/bugherd/set-favicon.mjs` uploads the icons and sets both settings read-merge-write, then
  publishes. Every page carries the icon: production 253/253, staging 223/223.
- The build's own `<link rel="icon">` (230 pages and the ad generator) now points at
  `mp-favicon-48.png` too, instead of the wide logo.

## Gotchas

- **The shared toolkit cached one session for every host.** `deliver/process/18-instatic-embeds/lib/insta-api.mjs`
  kept a single `.tmp/.session`. A cookie from 16 September 401'd the install on staging, and then
  staging's cookie 401'd production. It is now keyed by host (`.session-<host>`), as Mason Park's
  own `insta.mjs` has been since 31 August.
- A root ad page still carries the old Google Ads form (location `mZ2q3…`) beside the new pool
  (location `9tm8C3…`). Calls and form leads now land in different GHL locations on those six pages.

## Open

- Whether the six root ad pages should move to the new forms too (the ads and their GHL redirects
  point there).
- The form redirects (`/thank-you-invisalign`, `/thank-you-new-patient`): the user is setting them in GHL.

## Version Control

This run file follows the runbook rules in [SYSTEM_RULES.md §5](../../../../../SYSTEM_RULES.md).
