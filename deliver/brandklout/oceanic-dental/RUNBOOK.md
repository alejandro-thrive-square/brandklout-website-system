# oceanic-dental runbook

Standing state: what is true now, what is next, the traps. Each step's own history is in its
`output/RUNBOOK.md`; add a row below for every run.

## Standing

**Oceanic Dental** (Dr. Krystal Pham; Huntington Beach + Fountain Valley, CA), a Brandklout client.
Start at [`docs/project-overview.md`](./docs/project-overview.md).

- **Scope now: redesign + migrate Webflow -> Instatic** (scenarios 1 and 0, started 2026-10-02 from
  `b7657446`, the Livewell model; scope still to confirm). The older Webflow work (contact pages, DNI,
  consent, 2026-09-22) lives in `docs/runbook/`, `workflows/`, `site-scripts/` (pre-v2 layout).
- **Instatic:** production https://oceanic-dental-production.up.railway.app (empty), staging
  https://oceanic-dental-staging.up.railway.app. Alejandro and Sang on both; three plugins on both.
- **Concept deck live:** https://oceanic-dental-staging.up.railway.app/concepts, five homepages.
  **The client has not picked yet.** Source: `scenario-0-new-site/01-client-inquiry/output/concepts/`.
- Old site: scraped in full (106 pages), all assets downloaded, homepage screenshotted.
- `INSTATIC_BASE_URL` is PRODUCTION; prefix the staging URL explicitly for any staging write.

## Runs

| Date | Scenario / step | What happened | Commit |
| --- | --- | --- | --- |
| 2026-10-02 | scenario-0 / 01-client-inquiry | Railway instance + staging, logins, plugins; five-concept deck built and published to staging | `933f8103` |
| 2026-10-02 | scenario-1 / 01-old-site-capture | 106-page scrape, 782 assets, homepage screenshots | `933f8103` |

## Version Control

Follows [SYSTEM_RULES.md §5](../../../SYSTEM_RULES.md).
