# dr-nahlah

Client folder. Each started scenario mirrors `deliver/process/<scenario>/` from main (untracked,
refreshed with `node scripts/scenario.mjs sync`); each step's `output/` holds its assets, code and
runbook and is the only part tracked here. Never fix a directive or script in this folder: fix it on
main, then sync.

## Scenarios

| Scenario | Started | From commit |
| --- | --- | --- |
| scenario-7-seo-aeo | 2026-10-07 | 0075c5ee |

## Version Control

Follows [SYSTEM_RULES.md §4](../../../SYSTEM_RULES.md). Only files in this folder change on the client's branch.
