# Scenario 7 · 03 Office Pages

## Purpose

Rank in each office's own city. Every practice that won an office-city search in the Nahlah research
had a page written for that one city; a page titled for two cities ranked in neither. One domain,
a full page per office, and each office's own version of the money service pages.

## Inputs

- The keyword map's `planned` office rows (step 01) and the gap report.
- Per office: name, address, phone, hours, map, parking, Business Profile URL and its reviews, which
  doctors work there and on which days, photos **of that office**.

## Checklist

- [ ] URLs decided by the team
- [ ] A full page per office
- [ ] Each office's version of the money service pages, written separately
- [ ] Twins at or under 25% shared text
- [ ] Schema: each office department's `url` is its page
- [ ] Each Business Profile's website link points at its office page

## Steps

1. **URLs.** The team decides: grow the existing contact or location pages (keeps their links), or a
   `/<city>/` section with 301s from the old URLs. New builds use Scenario 0's
   `/locations/<city>/` branch. Put the answer in the keyword map.
2. **The office page** holds everything in the
   [standard's list](../../tools/seo-aeo/README.md#an-office-page-holds): name, address, phone, hours,
   map, parking, directions from local landmarks, that office's photos, who the patient sees there,
   the services offered with links, that office's Google reviews, financing in brief, the towns served,
   and a local FAQ with its FAQPage. **Which office a photo shows** is checked, not assumed: match it to
   that office's Business Profile photos (cover, interior) before it goes on a page; shared folders are
   rarely labelled, and existing pages may already carry the other office's photos. **Landmarks and
   directions** come from the practice, its site or its Business Profiles, never from general knowledge.
3. **The office's money pages**, one per money service (the map's `office` column). Write each one for
   that office: its own introduction, who does the treatment there, the logistics of that office, a
   patient story or review from it, a local FAQ, and a link up to the service hub. Never copy the other
   office's version and swap the town.
4. **Overlap gate.** Every twin pair, and each office version against its hub:
   `node ../../tools/seo-aeo/page-overlap.mjs --pairs output/twins.txt > output/overlap.log`: CLEAN at 25%.
   The gate strips only `header`, `nav` and `footer`: site chrome built from plain divs (a menu drawer
   listing every page, both offices' phones and hours) counts on every pair. Measure that floor first;
   it can be a fifth of the page. Then the blocks a page template repeats (a booking block listing
   every office, a "before you come" list) are what is left to write per office.
5. **Schema.** Each office department's `url` is its office page; office pages carry their FAQPage;
   the department lists the towns it serves.
6. **Links.** Hub ↔ office versions, office page ↔ its services, the footer's office blocks link to
   the office pages, the sitemap includes them (rebuild it: Scenario 0 step 06).
7. **Business Profiles.** Each profile's website link goes to its office page. Whoever holds the
   profile changes it; through Codex only with access and the user's yes.
8. **Gates:** keyword gate with the new rows set to `target`, the overlap gate, `seo-head-check`,
   Scenario 2's QA; staging first, then production.

## Conditionals

- **One office:** one office page; skip the twins.
- **Towns with no office:** named on the nearest office page and in its schema, never given pages.
- **No photo of an office yet:** ask the practice; never show the other office's building.

## Do / Don't

- Do write the second office's pages from that office's facts, not from the first office's text.
- Don't build a second website per office, or town pages with the name swapped.
- Don't point both Business Profiles at the home page once office pages exist.

## Tools

- [`tools/seo-aeo/`](../../tools/seo-aeo/README.md): `page-overlap.mjs`, `keyword-gate.mjs`
- `tools/instatic-site/gates/seo-head-check.mjs`

## Outputs

- `output/twins.txt`, `output/overlap.log`, `output/keyword-gate-production.log`, the run in `output/RUNBOOK.md`

## Evidence

bk-dr-nahlah 2026-10-07: the two contact pages shared 98% of their text and ranked for neither city;
dentalcareofalexandriaandmclean.com (same two cities, every service written per office, 5.5% shared)
ranked in both; town-swapped pages (95% shared) showed only on long-tail searches.
bk-dr-nahlah 2026-10-08 (staging): the rebuilt office pages first shared 58.2%, 107 shingles of it the
site-wide menu drawer; per-office booking and "before you come" blocks brought them to 23.0%.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../SYSTEM_RULES.md).
