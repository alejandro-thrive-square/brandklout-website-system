# Scenario 0 · 02 Research & Sitemap

## Purpose

Learn what the best practices in the same specialty publish, find the gaps, and turn that into an
approved sitemap with a strategy the client can read. Also lock the facts the copy will claim.

## Inputs

- Step 01 outputs (form, facts, style pick).
- For a migration: the old site capture and URL inventory from Scenario 1.

## Checklist

- [ ] Competitor research
- [ ] Content gap analysis
- [ ] Sitemap from the specialty template
- [ ] Strategy document on staging
- [ ] Prices and claims list confirmed by the client

## Steps

1. **Pick three competitors** in other towns that offer the same services or expertise and rank best.
   Record candidates and evidence in `competitor-screen.csv`: same lead procedure, comparable size
   (0.5x to 2x the client's page count), independent operator (two domains of one business are one
   data point), and a machine-readable sitemap. Name the runner-up and why it lost. Never state a
   rejection reason you did not check on the live site.
2. **Capture them** with Scrapling: desktop screenshots and HTML converted to markdown per page.
3. **Analyse** their content structure and pages, then find content gaps and keyword opportunities on
   SpyFu. Keep a keyword map: page, primary keyword, secondary terms, intent, CTA.
4. **Start the sitemap from the specialty template** on the FigJam Sitemap board (General, Implant,
   Oral Surgery, Pediatric, Med Spa); data and section flows in
   [`tools/specialty-sitemaps/`](../tools/specialty-sitemaps/README.md). Adjust it with the research.
5. **Strategy page.** A small HTML with the reasoning behind the sitemap and a canvas of the sitemap,
   uploaded to Instatic staging for the client.
6. **Prices and claims.** List every price, fee, warranty, claim, credential and statistic the copy
   will use, and have the client confirm it in writing. Unconfirmed items stay out of the copy.

## Conditionals

- **If the practice has more than one office:** brand pages at the root, one `/locations/<city>/` branch
  per office. Each office has its own phone, number pool, GHL form, hours and map.
- **If the client runs ads:** plan the three-page combo per campaign under `/ads-landing-pages/`
  ([Scenario 3](../scenario-3-ads-landing-pages/README.md)).
- **If the client has blog posts:** a CMS collection with a template page, not static pages.
- **If this is a migration:** start from the old URL inventory, keep the pages that rank at their URL
  when possible, and plan nested slugs carefully (Instatic flattens `a/b` to `a-b` after some writes).
- **If there is no local catchment** (online shop): build from the client's catalogue, not competitors.

## Do / Don't

- Do design the sitemap for future locations: the `[City]` branch must clone for a new office.
- Don't publish a price or claim the client has not confirmed.
- Don't rank competitors on traffic numbers you cannot verify.

## Tools

- `tools/specialty-sitemaps/` — templates, section flows, and the scripts that built them.
- Scrapling (Python) for capture; SpyFu for keywords.

## Outputs

- `workflows/02-research-sitemap/.tmp/competitor-screen.csv`, `competitors/<site>/` captures
- `workflows/02-research-sitemap/.tmp/keyword-map.csv`
- `workflows/02-research-sitemap/.tmp/sitemap.json` and the strategy HTML
- `docs/claims-confirmed.md`

## Evidence

Runbooks: bk-stone 2026-09-09 fees to confirm (44 unconfirmed fees went live); bk-stone 2026-09-04
split into three projects; bk-alki-house 2026-09-13 catalogue build; bk-ifa-dentistry 2026-09-11
WordPress URL parity; repo 2026-09-22 specialty sitemaps.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../SYSTEM_RULES.md).
