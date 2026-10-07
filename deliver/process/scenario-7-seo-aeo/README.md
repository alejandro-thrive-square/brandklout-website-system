# Scenario 7 · SEO & AEO (live sites)

Make a live client site rank for the searches that bring patients, in each office's city, and be the
practice AI answers name. It is a cycle: run it once fully, then step 05 every month and the earlier
steps again when the measurements say so. Works on Instatic and Webflow sites: this scenario decides
**what** changes; the edits themselves go through [Scenario 2](../scenario-2-updates-expansions/README.md)
(Instatic) or [Scenario 6](../scenario-6-webflow-sites/README.md) (Webflow), staging first.

The standard and the scripts are in [`tools/seo-aeo/`](../tools/seo-aeo/README.md); the Instatic writers
(content-built schema, keyword H1) in [`tools/instatic-site/seo/`](../tools/instatic-site/seo/README.md). Built 2026-10-07
from the Dr. Nahlah analysis and Trong Huynh's (DriveRank) review. A new site gets the same rules
inside [Scenario 0](../scenario-0-new-site/README.md) (steps 02, 03, 05, 06); run this scenario on it
after launch.

| Step | Directive | Gate to leave the step |
| --- | --- | --- |
| 01 | [Baseline & Research](./01-baseline-research/01-baseline-research.md) | Baseline saved; keyword map and gap report written; **the team agrees the map** |
| 02 | [On-Page Pass](./02-on-page/02-on-page.md) | `keyword-gate.mjs` CLEAN on staging, then production; home-page local FAQ live |
| 03 | [Office Pages](./03-office-pages/03-office-pages.md) (multi-office or local-first practices) | Office pages and each office's money pages live, `page-overlap.mjs` ≤25%, every Business Profile links to its office page |
| 04 | [Content Depth & Gaps](./04-content-depth/04-content-depth.md) | The practice approved the copy; gap pages live; gate CLEAN |
| 05 | [Measure](./05-measure/05-measure.md) (monthly) | Snapshot saved and compared with the baseline; next actions written |

The FigJam board *Deliver SOP's* should gain a Scenario 7 lane drawn from this table.

## Roles

- **Team** agrees the keyword map (gate 1) and decides URLs.
- **The practice** gives Search Console and Business Profile access, confirms every claim, and signs
  off rewritten copy (gate 3). Ask early: these are what stall the cycle.
- **Web dev** applies the changes through Scenario 2 or 6 and runs the gates.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../SYSTEM_RULES.md).
