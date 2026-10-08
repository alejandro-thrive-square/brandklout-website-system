# dr-nahlah runbook

Standing state: what is true now, what is next, the traps. Each step's own history is in its
`output/RUNBOOK.md`; add a row below for every run.

## Standing

- **The project's full standing state is still in [`docs/RUNBOOK.md`](./docs/RUNBOOK.md)** (this client
  predates the v2 layout: its work lives in `workflows/`). This file indexes the v2 scenarios only.
- **Scenario 7 · SEO & AEO started 2026-10-07.** Step 01 outputs are in; **gate 1 is open: the team
  has not agreed the keyword map** (`scenario-7-seo-aeo/01-baseline-research/output/keyword-map.csv`,
  101 rows: 38 pages, 43 posts, 20 planned). Plan doc for the team:
  https://claude.ai/code/artifact/877a645f-bf8a-4797-bab0-31d6412b4cbf. Search volumes are in (Ahrefs US, `ahrefs-2026-10-07.tsv`):
  the demand is in generic treatment searches; hubs now target those, office pages their city terms.
- **Scenario 7 is on STAGING, production untouched (2026-10-08).** Steps 02 (schema, keyword H1s,
  titles, alts, home FAQ, `/contact` H1) and 03 (both office pages on their current URLs, twins 23%
  shared) are live on staging.drnahlah.com; keyword gate 1016 passed, 1 failed (`/our-facility`, held).
  The user's rule: no sitemap change (new pages, URL moves) until the teammates review the proposal;
  production only after their yes. Run order for production: each step's `output/RUNBOOK.md` Next.
- **Live schema bug still on production:** `/financing` and `/implant-cost` publish the lenders with
  `"url": "https://www.undefined"`; fixed on staging, ships with the production schema push.

## Runs

| Date | Scenario / step | What happened | Commit |
| --- | --- | --- | --- |
| 2026-10-07 | 7 · 01 Baseline & Research | Baseline audit (81 URLs), keyword map in the seo-aeo format with 19 drafted H1s, rank check (16 location-set searches), Autocomplete demand, competitors, gap report; baseline keyword gate 63 FAIL (step 02's work list) | this commit |
| 2026-10-07 | 7 · 01 (volumes) | Ahrefs US volumes for 129 keywords; hubs moved to generic terms; gap report re-ranked by demand; baseline gate 42 FAIL | this commit |
| 2026-10-07 | 7 · 02 On-Page Pass (prep) | `seo-config.json` + `schema-base.json` for `tools/instatic-site/seo/`, transcribed from seo-v3 and proven read-only against the live graph (identical bar the lender fix) | this commit |
| 2026-10-07/08 | 7 · 02 On-Page Pass (staging) | Schema fixes + towns, keyword H1s on 16 pages + home + `/contact`, 19 titles, 114 alts, home local FAQ; gate 1016/1 | `8d8c645b` + this commit |
| 2026-10-08 | 7 · 03 Office Pages (staging) | Both office pages rebuilt on their URLs: own heroes, details, FAQ, treatments; Alexandria photos + gallery; twins 98% → 23% shared | `c29e34e7` |
| 2026-10-08 | 7 · 04 Content Depth (staging) | Dentures hub: brief + 7-question snap-in dentures FAQ (FAQPage); gap pages held for the sitemap review, deeper medical sections for the practice's facts | this commit |

## Version Control

Follows [SYSTEM_RULES.md §5](../../../SYSTEM_RULES.md).
