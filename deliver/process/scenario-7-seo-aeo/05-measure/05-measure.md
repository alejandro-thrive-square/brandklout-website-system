# Scenario 7 · 05 Measure (monthly)

## Purpose

Show whether the work moved rankings, clicks and calls, catch anything a later edit broke, and decide
the next month's work from evidence.

## Inputs

- Step 01's baseline: `site-audit.json`, `serp-queries.txt` and the first rank report.
- Search Console access; the call-tracking report per office (GoHighLevel number pools).

## Checklist

- [ ] Rank snapshot from the same query file
- [ ] Search Console clicks, impressions, position
- [ ] Calls and leads per office
- [ ] Audit and keyword gate re-run
- [ ] Next actions written; plan doc updated

## Steps

1. **Rank snapshot.** Re-run step 01's `serp-queries.txt` unchanged (same searches, same locations):
   `serp-instruction.mjs` → `codex_cu.mjs --out output/serp-<date>`. Write
   `output/rank-<date>.md`: search, position at baseline, last month, now, the #1 result, the map pack.
2. **Search Console**: clicks, impressions and average position for the mapped pages, last 28 days
   against the 28 before the work started.
3. **Calls per office** from the number pools, and form leads, against the month before.
4. **Drift check:** `site-audit.mjs` and `keyword-gate.mjs` on production. A later edit that dropped a
   keyword H1, a title or an SEO cell shows up here; fix it the same day.
5. **Next actions.** A page that has not moved in two snapshots goes back to step 02, 03 or 04 with a
   reason (thin, wrong keyword, no office version, a competitor with far more reviews).
6. **Report** in the plan doc: update the scorecard and the rank board, and add the month's row to
   `output/RUNBOOK.md`.

## Conditionals

- **No Search Console access yet:** report rankings and calls, and ask again.
- **Google blocks the run:** report the searches that did run; finish the rest the next day.

## Do / Don't

- Do compare like with like: same searches, same locations, same window.
- Don't change the query file between months; add new searches as a second file.

## Tools

- [`tools/seo-aeo/`](../../tools/seo-aeo/README.md): `serp-instruction.mjs`, `site-audit.mjs`, `keyword-gate.mjs`
- [`tools/codex-computer-use/`](../../tools/codex-computer-use/README.md)

## Outputs

- `output/rank-<date>.md`, `output/search-console-<date>.md`, `output/site-audit-<date>.md`,
  `output/keyword-gate-<date>.log`, the month's row in `output/RUNBOOK.md`

## Evidence

bk-dr-nahlah 2026-10-07: Search Console access was still missing two days after a ranking drop, so the
before-and-after could only be told from a one-off rank check.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../SYSTEM_RULES.md).
