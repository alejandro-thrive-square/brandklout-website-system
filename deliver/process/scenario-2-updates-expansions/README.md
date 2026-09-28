# Scenario 2 · Updates and Expansions on Live Sites

## What it covers
Changes to an Instatic website that is already live and already carries real patients and paid
traffic. Typical requests:

- New pages on the live site: a contact page per location, a "v2" of an existing page.
- Section, copy, image and phone-number changes on existing pages.
- Site-wide code: cookie consent (Termly), the GHL consent bridge, DNI call tracking, tracker tags.
- Fixes reported by the client, Brandklout (Asana) or a reviewer (BugHerd).

Webflow sites have their own scenario, [`scenario-6-webflow-sites`](../scenario-6-webflow-sites/README.md).

## When to use it
- The site is on Instatic and is live (or has a live domain behind it).
- The request changes or adds to that site, not the whole site.

Use something else when:
- The site is on Webflow: `scenario-6-webflow-sites`.
- Building a new site: `scenario-0-new-site`.
- Moving an old site to a new platform: `scenario-1-migration`.
- Designing a paid-traffic combo from scratch: `scenario-3-ads-landing-pages` owns the flow, the
  design and the build.

## The steps
| Step | Directive | Output |
| :--- | :--- | :--- |
| 01 | [Request intake](./01-request-intake/01-request-intake.md): Asana/BugHerd request, environments, publish baseline, scope | `change-list.md`, baseline `publish-status-<env>.json` |
| 02 | [Build](./02-build/02-build.md): the change on the staging draft, then production | the change in the Instatic draft |
| 03 | [QA and publish](./03-qa-and-publish/03-qa-and-publish.md): gates, staging publish, production on go-ahead | verified staging and production, runbook run |

Per-request working folder: `deliver/brandklout/<client>/scenario-2-updates-expansions/<step>/output/<YYYY-MM-DD>-<slug>/`.

## The rules that matter most
1. **A publish ships the whole draft.** Read `publish/status` before the first write and before any
   publish; `draftMatchesPublished:false` means someone else's work would ship too.
2. **Staging first, production on go-ahead.** Staging has the same admin logins; a production
   change needs the user's explicit go-ahead in the conversation.
3. **Add, do not mutate.** New pages on a temporary slug; the original stays untouched until the new
   one is approved.
4. **Back up before writing.** `tools/instatic-site/ops/backup-site.mjs`. Never "Restore version" in
   the admin: it empties the page.

## Tools
Listed per step in its `tools.json`: `instatic-api-sync`, `instatic-site`, `instatic-embeds`,
`instatic-plugins`, `instatic-domain-origins`, `termly-ghl-consent`. Also
`deliver/scripts/asana-context.mjs` for the Asana brief.

## Version Control
Follows the root-level version control rules in [SYSTEM_RULES.md §4](../../../SYSTEM_RULES.md).
