# institute-for-advanced-dentistry runbook

Standing state: what is true now, what is next, the traps. Each step's own history is in its
`output/RUNBOOK.md`; add a row below for every run.

## Standing

- `/hipaa-disclosure` is live on production (2026-10-01); on staging it ships with the next full
  site-src push. Not linked from any footer yet. See 06-post-launch.

## Runs

| Date | Scenario / step | What happened | Commit |
| --- | --- | --- | --- |
| 2026-10-01 | scenario-0-new-site / 06-post-launch | HIPAA Disclosure page injected on production (one page, other 59 byte-identical); staging copy added to `site-src/pages/` for the next replace push | `ee7f64db` |

## Version Control

Follows [SYSTEM_RULES.md §5](../../../SYSTEM_RULES.md).
