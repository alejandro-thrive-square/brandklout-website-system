# Runbook — bk-oceanic-dental

The **standing** state of this project: what is true now, what is next, and the traps.
Dated run history is one file per run under [`runbook/`](./runbook/INDEX.md) — read the index,
then only the runs you need. Do not read them all.

## Objective

**Oceanic Dental**, a Brandklout client. This worktree owns Oceanic Dental and nothing else.

Start at [`project-overview.md`](./project-overview.md).

## Status: CONSENT + DNI + LOCATION CONTACT PAGES LIVE (2026-09-22)

Platform: **Webflow**, existing live site `66cd6c49cbb85d43d9e41a7c` (www.oceanicdental.com), reached
through the dedicated `webflow-oceanic-dental` instance. See [`mcp-access.md`](./mcp-access.md).

What is live (published 21:40, DNI 1.2.0 at ~21:46): `/contact-fountain-valley` and `/contact-huntington-beach` with their GHL forms;
Termly (autoBlock off) first in the head; the Google Ads gtag tagged; the consent bridge 2.2.0 plus
`OceanicDNI` 1.2.0 (FV pool site-wide, HB pool on the HB contact page, **not** consent-gated, by the user's choice) as header site
scripts; a Consent Preferences link in the footer. Details are in
[`runbook/2026-09-22-contact-pages-forms-dni-consent.md`](./runbook/2026-09-22-contact-pages-forms-dni-consent.md).

## Next

1. Run `consent-kit.mjs check` on both contact pages, and look at the footer link.
2. By hand: move GA4 `G-2HMERPBQ7R` out of Webflow's Google Analytics integration into a tagged head
   snippet, and delete `/brighten`'s duplicate GA4 tags.
3. Decide the fate of `/contact` (chooser page or a 301).
4. Asana task/project IDs and scope, still unrecorded in `project-overview.md`.

## Gotchas

- The DNI loader lives in [`../site-scripts/dni-loader.js`](../site-scripts/dni-loader.js). Change it
  there, minify with terser, register a new version, `cmp` the hosted copy, then re-apply with
  `add_site_script` (header). **It runs before consent on purpose** (the user, 2026-09-22): don't
  "fix" it back to the kit's gated form.

- `webflow-oceanic-dental` and `webflow-brandklout` share a URL but hold separate grants. Do not
  re-authorize `webflow-brandklout` to add Oceanic: that replaces its grant, and any client left
  unticked loses access.

## Version Control

Tracked on the `bk-oceanic-dental` branch — commit it. See [SYSTEM_RULES.md §5](../../../../SYSTEM_RULES.md).
