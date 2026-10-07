# Scenario 7 · 02 On-Page Pass

## Purpose

Make every existing page carry its mapped keyword where Google reads it (H1, title, description, alt
text) and give the home page the local questions AI answers draw on, without changing the design.

## Inputs

- The agreed `keyword-map.csv` and `keyword-gate-baseline.log` (step 01).
- Write access: Instatic admin (Scenario 2) or the Webflow MCP (Scenario 6).

## Checklist

- [ ] Keyword H1 on every target page
- [ ] Titles and descriptions rewritten from the map
- [ ] Alt text on the money pages and galleries
- [ ] Home-page local FAQ, visible and in schema
- [ ] `areaServed` widened to the map's towns
- [ ] Gate CLEAN on staging, then production

## Steps

1. **Make the edits through the platform's scenario**: Instatic in
   [Scenario 2 step 02](../../scenario-2-updates-expansions/02-build/02-build.md), staging first; Webflow in
   [Scenario 6 step 02](../../scenario-6-webflow-sites/02-build/02-build.md). Every rule of those steps
   applies (read-backs, every copy store, house copy rules).
2. **H1.** For each target page whose H1 lacks its keyword: add the keyword H1 set small above the
   designed headline, in the site's tagline style (`text-style-tagline`, never a class named
   `eyebrow`), and turn the old H1 into a paragraph with the same classes so it looks the same.
   Exactly one H1 per page. Compare the hero at 1440 and 390 before and after: the tagline is the
   only visible change.
3. **Title and description** by rules 3–4 of the [standard](../../tools/seo-aeo/README.md#the-standard).
   Instatic keeps them in the page's SEO cells, and in the Open Graph override for a nested slug that
   cannot keep cells; a site-document write drops the cells, so restore them
   (`tools/instatic-site/ops/restore-page-seo-cells.mjs`).
4. **Alt text** by rule 5 on every money page and gallery: what the photo shows, then the treatment
   and place where true. A new file name means a new upload.
5. **Home-page local FAQ.** Five to seven questions written as a visible section: what the specialty
   is and how it differs from a general dentist, cost in the city, where each office is, sedation,
   the first visit, same-day options if offered. Each answer names the office, city and phone. Then
   the FAQPage, built from that visible text (aeo-schema block; Webflow: the page's custom code).
6. **`areaServed`** (the aeo-schema organisation, or each office department) lists the towns in the
   keyword map. Credentials, awards and memberships only when the practice documents them.
7. **Rebuild the schema after any copy change**: the schema is built from page content, so a renamed
   heading or a new FAQ must reach it before publishing.
8. **Gates on staging:** `node ../../tools/seo-aeo/keyword-gate.mjs <staging origin> --map ../01-baseline-research/output/keyword-map.csv --no-coverage > output/keyword-gate-staging.log`
   (staging's noindex is a response header the gate does not read; coverage is checked on production),
   `tools/instatic-site/gates/seo-head-check.mjs`, and Scenario 2's QA. Publish production, then the
   same gate on production **with** coverage: CLEAN.

## Conditionals

- **The design has no headline to keep** (a plain page): the H1 is the visible headline, written
  around the keyword.
- **A WordPress clone:** check heads with `seo-head-check.mjs --render`.
- **The practice has not confirmed a claim** the FAQ needs (a price, a credential): leave it out.

## Do / Don't

- Do keep the brand line patients see; the keyword goes above it.
- Don't put two H1s on a page or hide an H1.
- Don't write a FAQ answer the page does not show, or one that is not true for that office.

## Tools

- [`tools/seo-aeo/keyword-gate.mjs`](../../tools/seo-aeo/README.md)
- `tools/instatic-site/gates/seo-head-check.mjs`, `ops/restore-page-seo-cells.mjs`
- [`tools/instatic-plugins/aeo-schema`](../../tools/instatic-plugins/aeo-schema/README.md)

## Outputs

- `output/keyword-gate-staging.log`, `output/keyword-gate-production.log`, before/after hero
  screenshots in `output/assets/`, the run in `output/RUNBOOK.md`

## Evidence

bk-dr-nahlah 2026-10-06/07: keyword H1s on 11 treatment pages as a tagline over the designed headline
(`seo-v3/push-keyword-h1.mjs`, gate `hero-look.mjs`, client-side); 19 pages still on brand-line H1s
and no home-page FAQ when Trong reviewed the site.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../SYSTEM_RULES.md).
