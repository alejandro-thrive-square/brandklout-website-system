# institute-for-advanced-dentistry runbook

Standing state: what is true now, what is next, the traps. Each step's own history is in its
`output/RUNBOOK.md`; add a row below for every run.

## Standing

The live standing state of this client is in [docs/RUNBOOK.md](docs/RUNBOOK.md) (history in `docs/runbook/`). In short: production `www.ifadentistry.com` serves the WordPress clone; `staging.ifadentistry.com` serves the whole redesigned site (57 pages, 2026-10-01), awaiting the team review on BugHerd.

- `/hipaa-disclosure` is live on production (2026-10-01) and linked from every page's footer legal row;
  on staging page + footer link ship with the next full site-src push. See 06-post-launch.

## Runs

| Date | Scenario / step | What happened | Commit |
| --- | --- | --- | --- |
| 2026-10-01 | scenario-0 / 03-design-build | BugHerd round 1 re-verified and closed on the board: 40 done, #33 and #38 open ([run](docs/runbook/2026-10-01-bugherd-round-1-closed.md)) | 49d856fc |
| 2026-10-01 | scenario-0 / 03-design-build | Home approved; whole site built on its frozen system and published on staging ([run](docs/runbook/2026-10-01-full-site-on-staging.md)) | 5804ac65, e2912e5a, e8861d52 |
| 2026-10-01 | scenario-0-new-site / 06-post-launch | HIPAA Disclosure page injected on production (one page, other 59 byte-identical); staging copy added to `site-src/pages/` for the next replace push | `ee7f64db` |
| 2026-10-01 | scenario-0-new-site / 06-post-launch | HIPAA Disclosure added to the footer legal row on all 60 production pages, plus a wrap fix for that row (approved); site-src footer updated for staging | `ea7dd53c` |

## Version Control

Follows [SYSTEM_RULES.md §5](../../../SYSTEM_RULES.md).
