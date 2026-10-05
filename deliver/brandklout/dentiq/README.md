# dentiq

Client folder. Each started scenario mirrors `deliver/process/<scenario>/` from main (untracked,
refreshed with `node scripts/scenario.mjs sync`); each step's `output/` holds its assets, code and
runbook and is the only part tracked here. Never fix a directive or script in this folder: fix it on
main, then sync.

## Scenarios

| Scenario | Started | From commit |
| --- | --- | --- |
| scenario-6-webflow-sites | 2026-10-05 | 4ba143b6 |

## Version Control

Follows [SYSTEM_RULES.md §4](../../../SYSTEM_RULES.md). Only files in this folder change on the client's branch.
