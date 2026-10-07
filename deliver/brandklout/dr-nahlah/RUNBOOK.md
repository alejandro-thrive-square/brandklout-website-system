# dr-nahlah runbook

Standing state: what is true now, what is next, the traps. Each step's own history is in its
`output/RUNBOOK.md`; add a row below for every run.

## Standing

- **The project's full standing state is still in [`docs/RUNBOOK.md`](./docs/RUNBOOK.md)** (this client
  predates the v2 layout: its work lives in `workflows/`). This file indexes the v2 scenarios only.
- **Scenario 7 · SEO & AEO started 2026-10-07.** Step 01 outputs are in; **gate 1 is open: the team
  has not agreed the keyword map** (`scenario-7-seo-aeo/01-baseline-research/output/keyword-map.csv`,
  101 rows: 38 pages, 43 posts, 20 planned). Plan doc for the team:
  https://claude.ai/code/artifact/877a645f-bf8a-4797-bab0-31d6412b4cbf. Search volumes are still empty
  (Ahrefs is not signed in on this workstation's Chrome).
- **Live schema bug, not yet fixed:** `/financing` and `/implant-cost` publish the three lenders with
  `"url": "https://www.undefined"`. The promoted build drops those values; shipping it is a 2-block push
  (staging first), see `02-on-page/output/RUNBOOK.md`.

## Runs

| Date | Scenario / step | What happened | Commit |
| --- | --- | --- | --- |
| 2026-10-07 | 7 · 01 Baseline & Research | Baseline audit (81 URLs), keyword map in the seo-aeo format with 19 drafted H1s, rank check (16 location-set searches), Autocomplete demand, competitors, gap report; baseline keyword gate 63 FAIL (step 02's work list) | this commit |
| 2026-10-07 | 7 · 02 On-Page Pass (prep) | `seo-config.json` + `schema-base.json` for `tools/instatic-site/seo/`, transcribed from seo-v3 and proven read-only against the live graph (identical bar the lender fix) | this commit |

## Version Control

Follows [SYSTEM_RULES.md §5](../../../SYSTEM_RULES.md).
