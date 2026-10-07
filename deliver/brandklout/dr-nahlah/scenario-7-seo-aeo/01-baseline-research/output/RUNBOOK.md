# scenario-7-seo-aeo · 01-baseline-research · runbook

Newest run first. Each run: date, what was done (with the commit), what is next, and the gotchas.

## 2026-10-07b — search volumes from Ahrefs

**Done**
- The user signed in to Ahrefs in Chrome; three Codex runs read Keywords Explorer (US):
  `ahrefs-2026-10-07.tsv`, 129 keywords. Run 2 was interrupted and its KD column may be shifted, so
  those KD values are marked "(unverified)"; run 3 re-read the 16 it missed column by column.
- Finding: city-named searches are 10–800 a month each ("dentist alexandria va" 800 is the largest);
  the demand is in generic treatment searches that Google answers locally ("dental implants" 252K,
  "dentures" 93K, "full mouth dental implants" 64K, "dental implants cost" 41K, "all on 4 dental
  implants" 40K, its cost 2.7K, "snap in dentures" 6.3K, "same day dental implants" 4.4K).
- `keyword-map.csv`: the 15 hubs moved to their generic term (the region stays in H1 and title), the
  office versions keep the city terms; `volume` filled on 40 rows (the rest are navigational pages or
  posts). This also settles last run's open question: the hubs' live H1s ("Dental Implants in McLean &
  Alexandria, VA") already contain the generic term. Baseline gate now **42 FAIL** (was 63).
- `gap-report.md` re-ranked by demand: dentures, cost pages and same-day (if offered) rise to High;
  nearby towns to Medium (Arlington: 200–450 a month per term).

**Next**: gate 1 (the team agrees the map) stays open; volumes no longer block it.

**Gotchas**
- Codex reading a long Ahrefs table can stop midway and mis-order columns: tell it to read by header
  names (now in `tools/seo-aeo/ahrefs-instruction.txt`) and re-run the gaps with `--model gpt-6.1-sol`.

## 2026-10-07 — first run, from the SEO & AEO plan

**Done**
- `site-audit.{json,md}`: 81 URLs, every page with one H1, a title and a description; JSON-LD median
  18 KB; FAQPage on 12 pages, **none on the home page**; Vienna, Arlington, Falls Church, Great Falls,
  Fairfax named on no page.
- `serp-2026-10-07/report.md` (16 Google searches, location set per office city, via Codex): #1 for
  "prosthodontist mclean va" and "prosthodontist alexandria va", #4 "prosthodontist northern virginia",
  **not shown for any of 13 treatment searches**; our ads show on "dental implants mclean va" and
  "all on 4 dental implants alexandria va".
- `autocomplete-checks.json` (93 keywords), `competitors.md`, `gap-report.md` (11 gaps, 5 High).
- `keyword-map.csv`: 101 rows (38 live pages, 43 posts, 20 planned office/gap pages), the `h1` column
  carries the 19 H1s drafted in the plan doc. Hubs target "Northern Virginia", the planned office pages
  the city terms. `keyword-gate-baseline.log`: 1,108 passed, **63 FAIL** (45 H1, 18 title), the step 02
  work list.
- `serp-queries.txt` (15 searches) + `serp-instruction.txt`: the monthly rank check; never change it.
- Plan doc: https://claude.ai/code/artifact/877a645f-bf8a-4797-bab0-31d6412b4cbf (tabs: plan, Keyword map,
  Schema template).

**Next**
1. **Gate 1: the team agrees the map.** Open question in it: five hubs' live H1s say "McLean &
   Alexandria, VA" while their keywords say "Northern Virginia" (by design once office pages exist;
   the team decides whether hubs change before or with step 03).
2. Search volumes: sign in to Ahrefs in Chrome, then re-run the Codex lookup (instruction in the session
   scratchpad; 87 keywords), fill `volume` / `volume_source`.
3. Search Console access from the practice.

**Gotchas**
- `scenario.mjs` takes `--dry`, not `--dry-run`: an unknown flag runs the real start.
- Ahrefs v3 API key = 0-unit trial (403 everywhere); the web app needs a signed-in Chrome.
- Google blocks after ~16 automated searches; keep `serp-queries.txt` at 15.

## Version Control

Follows [SYSTEM_RULES.md §5](../../../../../../SYSTEM_RULES.md).
