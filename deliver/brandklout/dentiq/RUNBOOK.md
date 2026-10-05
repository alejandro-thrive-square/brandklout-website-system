# dentiq runbook

Standing state: what is true now, what is next, the traps. Each step's own history is in its
`output/RUNBOOK.md`; add a row below for every run.

## Standing

- **Site:** Webflow `6a5f81effe0aee1d204818dd`, live on `dentiq.dental` + `www.`; staging
  `dentiq-dental-houston.webflow.io` ([docs](./docs/project-overview.md)). Stays on Webflow until the
  planned move to Instatic.
- **Live:** published 2026-09-30, still the OLD hours (weekly Monday).
- **Applied but unpublished (on staging):** the new office hours on 225 pages (footer, `/contact`,
  two area pages, JSON-LD on 68 pages). **Also pending and not ours:** a home-page edit from
  2026-09-30 and a site-level edit from 2026-10-05 07:28 UTC. The next live publish ships all of it.
- **Site scripts:** `BrandkloutConsentPreferences` 1.3.0 (registered); Termly line in the head.
- **Traps:** `set_text` inside a component needs `scope_component_id`; `/lp/` pages are not in the
  sitemap; the hours also live in the per-page JSON-LD field ([facts](./docs/facts.md)).

## Runs

| Date | Scenario / step | What happened | Commit |
| --- | --- | --- | --- |
| 2026-10-05 | S6 01-03 | Client started. Office hours changed to Tue-Fri 7-3 + every other Monday 8-12 in the draft, staging verified 225/225; live publish awaiting go-ahead | see `git log` on bk-dentiq |

## Version Control

Follows [SYSTEM_RULES.md §5](../../../SYSTEM_RULES.md).
