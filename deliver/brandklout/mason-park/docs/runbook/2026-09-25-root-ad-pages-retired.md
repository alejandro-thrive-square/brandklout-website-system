# 2026-09-25 — The six root ad pages retired: each forwards to its /ads-landing-pages/ twin

The client: "remove the ads landing pages that are not in the ads landing pages folder please".

The six are the Webflow ports at the root slugs: `/invisalign`, `/invisalign-consultation`,
`/invisalign-thank-you`, `/new-patient-special`, `/new-patient-special-consultation`,
`/new-patient-thank-you`. The live Google Ads, and the old GHL forms' redirects, may still point
at these URLs, and Instatic has no server redirects. The user chose **"redirect, then remove"**
over deleting outright.

**Done on production** (staging never had them).

## What changed

- `.tmp/bugherd/retire-root-ad-pages.mjs --apply` replaced each row's body (84 to 491 nodes) with
  one Embed block:
  - `location.replace(twin + location.search + location.hash)`, which keeps `gclid`, UTMs and the hash;
  - a meta refresh inside `<noscript>`;
  - a visible "This page has moved" link.

  Titles are now "Moved | Mason Park Dental". The rows, ids and slugs stay, so the URLs never 404.
- Backup of the old bodies: `backup-www...2026-09-25T19-34-10.json`. To restore a page, put its row's
  `cells.body` back through `site-document`.

## Verified

- `.tmp/bugherd/check-root-ad-forwards.mjs`: 6/6 forward to the right twin with the query string
  and hash intact (GHL blocked, so no pool numbers were used).
- `check-contact-forms-live.mjs` 253 URLs and `doctor-names.py --live` 253 URLs: 0 problems.

## Gotchas

- **A bare `<meta refresh content=0>` before the script wins the race** and drops the query string.
  It has to sit inside `<noscript>`.
- **NordVPN Threat Protection strips `gclid` and `utm_*` from every Chrome navigation on this
  workstation**, even on a plain page opened directly, before any script runs. A browser test
  with those parameters fails here while the site passes them through (curl gets them). The gate
  uses a neutral parameter for that reason.
- `10-lp-instatic/.tmp/type-diff.mjs --all` compared these pages with Webflow. It no longer applies:
  there is nothing left to compare.
- `mason-park-lp.css` and `lp-faq.js` are still installed, scoped to these six page ids, and now
  unused. They are harmless; remove them in a later cleanup.

## Open

- Move the Google Ads final URLs to `/ads-landing-pages/...` so ad clicks skip the forwarding hop.
  The forwarding pages can then be deleted outright.

## Version Control

This run file follows the runbook rules in [SYSTEM_RULES.md §5](../../../../../SYSTEM_RULES.md).
