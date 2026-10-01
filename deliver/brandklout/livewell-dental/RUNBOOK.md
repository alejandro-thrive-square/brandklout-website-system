# livewell-dental runbook

Standing state: what is true now, what is next, the traps. Each step's own history is in its
`output/RUNBOOK.md`; add a row below for every run.

## Standing

**Livewell Dental** (Dr. Chris Kim, Fairfax Station VA), a Brandklout client. Start at
[`docs/project-overview.md`](./docs/project-overview.md).

- **Scope now: redesign + migrate Webflow -> Instatic** (scenarios 1 and 0, started 2026-10-01 from
  `d4d9b8ba`). The older Webflow-improvement work lives in `workflows/`, `process-outputs/` and
  `docs/runbook/` (pre-v2 layout, kept as history).
- **Instatic:** production https://livewell-dental-production.up.railway.app (empty), staging
  https://livewell-dental-staging.up.railway.app. Alejandro and Sang on both; three plugins on both.
- **Concept deck live:** https://livewell-dental-staging.up.railway.app/concepts, five homepages.
  **The client has not picked yet.** Source: `scenario-0-new-site/01-client-inquiry/output/concepts/`.
- Old site: scraped in full, homepage screenshotted; the rest of the capture is open.
- `INSTATIC_BASE_URL` is PRODUCTION; prefix the staging URL explicitly for any staging write.

## Runs

| Date | Scenario / step | What happened | Commit |
| --- | --- | --- | --- |
| 2026-10-01 | scenario-0 / 01-client-inquiry | Railway instance + staging, logins, plugins; five-concept deck built and published to staging | (this commit) |
| 2026-10-01 | scenario-1 / 01-old-site-capture | 60-page scrape, homepage screenshots, partial summary | (this commit) |

## Version Control

Follows [SYSTEM_RULES.md §5](../../../SYSTEM_RULES.md).
