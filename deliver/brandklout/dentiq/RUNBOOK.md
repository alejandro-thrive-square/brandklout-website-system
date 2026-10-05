# dentiq runbook

Standing state: what is true now, what is next, the traps. Each step's own history is in its
`output/RUNBOOK.md`; add a row below for every run.

## Standing

- **Site:** Webflow `6a5f81effe0aee1d204818dd`, live on `dentiq.dental` + `www.`; staging
  `dentiq-dental-houston.webflow.io` ([docs](./docs/project-overview.md)). Stays on Webflow until the
  planned move to Instatic.
- **Live:** published 2026-10-05 to `dentiq.dental` + `www.` with the new office hours (Tue-Fri 7-3, every other Monday 8-12); 225/225 pages verified on a cache MISS. Nothing applied but unpublished. That publish also shipped the two earlier pending edits (home 2026-09-30, site-level 2026-10-05 07:28 UTC), on the user's go-ahead.
- **Site scripts:** `BrandkloutConsentPreferences` 1.3.0 (registered); Termly line in the head.
- **Traps:** `set_text` inside a component needs `scope_component_id`; `/lp/` pages are not in the
  sitemap; the hours also live in the per-page JSON-LD field ([facts](./docs/facts.md)).

## Runs

| Date | Scenario / step | What happened | Commit |
| --- | --- | --- | --- |
| 2026-10-05 | S6 01-03 | Client started. Office hours changed to Tue-Fri 7-3 + every other Monday 8-12 in the draft, staging verified 225/225 | 9712755a |
| 2026-10-05 | S6 03 | Live publish on the user's go-ahead (shipped the two foreign pending edits too); 225/225 live pages verified | see `git log` |

## Version Control

Follows [SYSTEM_RULES.md §5](../../../SYSTEM_RULES.md).
