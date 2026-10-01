# institute-for-advanced-dentistry runbook

Standing state: what is true now, what is next, the traps. Each step's own history is in its
`output/RUNBOOK.md`; add a row below for every run.

## Standing

The live standing state of this client is in [docs/RUNBOOK.md](docs/RUNBOOK.md) (history in `docs/runbook/`). In short: production `www.ifadentistry.com` serves the WordPress clone; `staging.ifadentistry.com` serves the whole redesigned site (57 pages, 2026-10-01), awaiting the team review on BugHerd.

- `/hipaa-disclosure` is live on production (2026-10-01); on staging it ships with the next full
  site-src push. Not linked from any footer yet. See 06-post-launch.

## Runs

| Date | Scenario / step | What happened | Commit |
| --- | --- | --- | --- |
| 2026-10-01 | scenario-0 / 03-design-build | Home approved; whole site built on its frozen system and published on staging ([run](docs/runbook/2026-10-01-full-site-on-staging.md)) | 5804ac65, e2912e5a, (this run) |
| 2026-10-01 | scenario-0-new-site / 06-post-launch | HIPAA Disclosure page injected on production (one page, other 59 byte-identical); staging copy added to `site-src/pages/` for the next replace push | `ee7f64db` |

## Version Control

Follows [SYSTEM_RULES.md §5](../../../SYSTEM_RULES.md).
