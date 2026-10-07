# Scenario 7 · 01 Baseline & Research

## Purpose

Know where the site stands and what it should target before anything changes: a saved baseline,
the searches that bring patients and who wins them, and a keyword map the team agrees.

## Inputs

- The live origin and, for each office, its address, phone and Google Business Profile
  (`docs/facts.md`, or the site's own schema).
- Search Console access. Ask the practice now: step 05 cannot measure without it.
- Any example a reviewer sent (a schema, a competitor page). Take it from the live page, never a chat
  copy ([gotchas](../../tools/seo-aeo/README.md#gotchas)).

## Checklist

- [ ] Baseline audit saved
- [ ] Demand: Autocomplete for every service × place
- [ ] Rank check with the searcher's location set (≤15 searches a run)
- [ ] Competitors crawled; their location pattern and twin overlap measured
- [ ] Keyword map covering every sitemap page
- [ ] Gap report
- [ ] Plan doc shared; **the team agrees the map**

## Steps

1. **Baseline.** `node ../../tools/seo-aeo/site-audit.mjs <origin> --places "<office cities>,<nearby towns>" --out output/site-audit.json > output/site-audit.md`.
   Keep both files: they are the "before" every later step is compared with.
2. **Seeds and places.** The services in patients' words (from the site's service pages: "dental
   implants", "all on 4", "dentures"), the specialty ("prosthodontist"), and the places: each office
   city, the name patients use for it ("Tysons Corner" for McLean), the region, and the 4–6 towns
   around each office. Then
   `node ../../tools/seo-aeo/autocomplete.mjs --seeds "…" --places "…" --suffixes "cost,near me" --out output/autocomplete.json > output/autocomplete.tsv`.
3. **Rank check.** `output/serp-queries.txt`, one search per line with its place
   (`dental implants mclean va @ McLean,Virginia,United States`): the specialty and the top services in
   each office city, two or three nearby towns, the region. At most 15 lines per run.
   `node ../../tools/seo-aeo/serp-instruction.mjs --queries output/serp-queries.txt > output/serp-instruction.txt`,
   then run it with [`codex_cu.mjs`](../../tools/codex-computer-use/README.md) (`--out output/serp-<date>`).
   Record per search: our position or "not shown" (and how many results were visible), the #1 organic
   result, the map pack's top three with review counts, and whether our ad shows.
4. **Competitors.** The domains that win two or more of the searches, organic or map pack. For each:
   sitemap size, how they handle locations (a page per office, service × office pages, town pages,
   separate domains), word count of the pages that beat ours, schema types, FAQs, cost pages,
   galleries. Measure their office twins with `page-overlap.mjs` to see how they avoid duplication.
5. **Keyword map.** `output/keyword-map.csv` from
   [`keyword-map.template.csv`](../../tools/seo-aeo/keyword-map.template.csv). Every sitemap page gets a
   row (`target` or `exempt`), every gap becomes a `planned` row with its future path. One primary
   keyword per page, the city in it when the intent is local, never the same keyword on two pages.
   Volumes from Keyword Planner in the client's Ads account when we have it, otherwise leave the column
   empty and say so in `volume_source`; never estimate.
6. **Gap report.** `output/gap-report.md`: each gap with its evidence URL, a priority (High = a money
   service in an office city where we are not shown; Medium = cost and commercial pages; Low =
   explainers, towns, galleries) and the work it takes (new page, rewrite, off-site). Include each
   office's map-pack review gap (our count against the top three).
7. **Plan doc.** A Claude Docs doc for the team on the model of *Dr. Nahlah — SEO & AEO Plan*:
   strategy at a glance, a status scorecard, the rank board, the gaps as tasks with priority tags, the
   keyword map as a tab, open questions grouped by who answers them. Share it. **Gate: the team
   agrees the map.** Put the practice's questions to them the same day (Search Console, Business
   Profile editors, copy sign-off, credentials they can document, office photos).
8. `node ../../tools/seo-aeo/keyword-gate.mjs <origin> --map output/keyword-map.csv > output/keyword-gate-baseline.log`:
   the failures it lists are step 02's work list.

## Conditionals

- **One office:** the map still names the city on local pages; step 03 is one office page.
- **Webflow site:** the same research; the edits go through Scenario 6.
- **No sitemap:** the scripts read the home page and its links; add a sitemap in Scenario 2 first.
- **A reviewer's example schema:** compare it node by node (types, FAQ, `areaServed`, credentials,
  offices) with ours. Length is not the goal: Nahlah's was already twice the example's size.

## Do / Don't

- Do write "not shown" with the number of results Google displayed.
- Don't run more than 15 Google searches a run, and never solve a CAPTCHA.
- Don't estimate volumes or rank competitors on traffic you cannot verify.
- Don't change the site in this step.

## Tools

- [`tools/seo-aeo/`](../../tools/seo-aeo/README.md): `site-audit.mjs`, `autocomplete.mjs`,
  `serp-instruction.mjs`, `page-overlap.mjs`, `keyword-gate.mjs`, `keyword-map.template.csv`
- [`tools/codex-computer-use/`](../../tools/codex-computer-use/README.md) for the Google rank check

## Outputs

- `output/site-audit.{json,md}`, `output/autocomplete.{tsv,json}`, `output/serp-queries.txt`,
  `output/serp-<date>/report.md`, `output/competitors.md`, `output/keyword-map.csv`,
  `output/gap-report.md`, `output/keyword-gate-baseline.log`, the plan doc's link in `output/RUNBOOK.md`

## Evidence

bk-dr-nahlah 2026-10-07: #1 for "prosthodontist" in McLean and Alexandria, not shown for any of 13
treatment searches; the two-office competitor ranking in both cities wrote every service per office;
Ahrefs trial key answers 403 on every data endpoint; Google showed a CAPTCHA after 16 searches.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../SYSTEM_RULES.md).
