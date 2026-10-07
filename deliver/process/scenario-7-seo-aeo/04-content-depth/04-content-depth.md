# Scenario 7 · 04 Content Depth & Gaps

## Purpose

Build the pages competitors rank with that the site lacks, and deepen the money pages until they
answer what patients search for, with every claim confirmed by the practice.

## Inputs

- The gap report and the keyword map's remaining `planned` rows (step 01).
- The rank-check report's "People also ask" and Autocomplete suggestions for each topic.
- The practice's confirmed facts (`docs/facts.md`, Scenario 0 step 02's claims list).

## Checklist

- [ ] Gap pages in priority order
- [ ] Money pages deepened
- [ ] Explainers that answer one question each
- [ ] The practice signed off the copy
- [ ] Schema rebuilt, gates CLEAN

## Steps

1. **Order** by the gap report: High, then Medium, then Low.
2. **A brief per page** before any copy: primary and secondary keywords, the intent, the questions
   people ask (Autocomplete, "People also ask"), what the pages beating ours cover and how long they
   are, and which confirmed facts it can use.
3. **Money pages** gain the sections patients look for: who is a candidate, the steps and timeline,
   recovery, risks, alternatives compared, what drives the cost, financing, a FAQ. Aim at the length
   of the pages that win the search only with real substance; never pad.
4. **Explainers for AI answers**: one question per page or section ("prosthodontist vs periodontist",
   "All-on-4 vs snap-in dentures"), the direct answer in the first two sentences, then the detail, and
   the FAQ mirrored in schema.
5. **Cost pages** state what drives the price and the ranges the practice confirms; no invented
   numbers.
6. **Galleries by treatment** when the practice has the before-and-afters.
7. **Sign-off.** The practice approves the copy (medical claims, prices, credentials) before it is
   published. **Gate.**
8. **Publish** through Scenario 2 or 6, rebuild the schema from the new content, set the rows to
   `target`, and run the keyword gate on staging and production.

## Conditionals

- **A service the practice does not offer** (same-day teeth, a sedation level): no page, and say so
  if a patient might expect it.
- **A comparison naming another practice or chain:** only with the practice's approval and strictly
  factual wording.

## Do / Don't

- Do answer the question first, then explain.
- Don't publish a price, statistic or credential the practice has not confirmed.
- Don't write a page for a keyword another page already owns.

## Tools

- [`tools/seo-aeo/`](../../tools/seo-aeo/README.md): `autocomplete.mjs`, `keyword-gate.mjs`, `site-audit.mjs` (word counts)

## Outputs

- `output/briefs/<page>.md`, the practice's sign-off in `output/RUNBOOK.md`, `output/keyword-gate-production.log`

## Evidence

bk-dr-nahlah 2026-10-07: no full-mouth implants, full-mouth reconstruction or dentures page while
competitors ranked with them; one cost page against G4's fifteen; service pages of 500–1,100 words
against 2,100–3,500 on the pages that won.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../SYSTEM_RULES.md).
