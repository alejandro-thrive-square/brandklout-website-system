# 2026-10-07 — SEO & AEO as a standard: Scenario 7 and tools/seo-aeo

## Done

- **`deliver/process/tools/seo-aeo/`**: the SEO & AEO standard (9 rules, each with its gate) from the
  Dr. Nahlah analysis and Trong Huynh's review (DriveRank), and five scripts, all keyless, sitemap-driven,
  no dependencies:
  - `site-audit.mjs` (baseline report), `keyword-gate.mjs` (map, coverage, H1, title, description,
    alt, FAQ visibility; exit 1), `page-overlap.mjs` (office twins ≤25% shared; exit 1),
    `autocomplete.mjs` (demand signal), `serp-instruction.mjs` (location-set Google rank check for
    Codex; reproduces the `uule` values that worked), `keyword-map.template.csv`.
  - Tested on drnahlah.com: audit 81 URLs; the gate caught a duplicate keyword, brand-line H1s and a
    title missing "Northern"; overlap read the two contact pages at 98% (FAIL) and implants vs
    All-on-4 at 15.8% (ok).
- **Scenario 7 · SEO & AEO (live sites)**: 01 Baseline & Research (gate: the team agrees the map),
  02 On-Page Pass, 03 Office Pages, 04 Content Depth & Gaps, 05 Measure (monthly). Edits go through
  Scenario 2 (Instatic) or 6 (Webflow).
- **Hooks**: Scenario 0 step 02 (keyword research and map in the toolkit's format; multi-office =
  office page + each office's money pages written separately, never a second site), 03 (keyword H1
  above the designed headline), 05 (local FAQ, `areaServed`, keyword gate CLEAN), 06 (baseline, then
  Scenario 7); Scenario 2 step 02 (re-run the keyword gate after a heading/title/page change).
  PROCESS_INDEX (scenario + toolkit rows, "Used by" updated) and DELIVER_SYSTEM_RULES §1.

## Next

1. ~~FigJam lane~~ **Done 2026-10-07:** section `388:1840` on *Deliver SOP's*, 105 cards cloned from the Scenario 6 lane (title, description, five steps × Checklist / Context Actions / Conditionals / AI Models / Do / Don't), card heights from measured word wrap (Inter Medium 16 wraps past ~690 px in a 696 card), confirmed on the server through REST `/nodes`.
2. Run Scenario 7 on Dr. Nahlah first (its plan doc is the step 01 output), then the other multi-office
   clients.
3. ~~Promote Nahlah's schema chain and keyword H1~~ **Done 2026-10-07** (`a4caccbd`): `tools/instatic-site/seo/`,
   driven by a per-client `seo-config.json`; tested read-only on drnahlah.com (run `2026-10-07-instatic-seo-promotion`).
4. A volume source: Keyword Planner access per client, DriveRank, or a paid Ahrefs plan.

## Gotchas

- The shared `AHREFS_API_KEY` is a 0-unit trial: every v3 data endpoint answers 403 "Insufficient plan".
- Google showed a CAPTCHA after ~16 automated searches from one IP; `serp-instruction.mjs` warns over 15.
- Place counts on Instatic sites include site-wide blocks outside `<footer>`; `site-audit.mjs` subtracts
  the lowest count across pages.
- A JSON-LD copied out of Teams does not parse (`%22` for closing quotes): take examples from the live page.
