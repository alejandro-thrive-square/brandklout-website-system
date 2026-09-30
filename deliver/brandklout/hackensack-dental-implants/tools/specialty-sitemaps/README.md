# Specialty sitemap templates

Five starting sitemaps, one per practice type, built from what 14 Brandklout client sites actually publish.
The source is [`specialty-sitemaps.txt`](./specialty-sitemaps.txt); the section order of each page type is
[`section-flows.md`](./section-flows.md). The same templates are drawn on the FigJam board
[Sitemap](https://www.figma.com/board/COB1NVbhZFDvCUgEB5izba/Sitemap), one section each; when the two
disagree, the text files win.

| Specialty | Sites it is based on |
| --- | --- |
| General & Family Dentistry | Arvada Dental Center, Grand Mission, Legacy Dental Pasadena, Livewell, Marvel, Mason Park |
| Implant & Full-Arch (Prosthodontics) | Dr. Nahlah, West LA Implants, Arvada Dental Implants, IFA |
| Oral & Maxillofacial Surgery | Stone Dental Implant Center, Stone / DFW Surgical Arts |
| Pediatric Dentistry | Mason Park Pediatric |
| Med Spa & Facial Aesthetics | Westlake TX Med Spa |

## How a page earns its card

- **Core**: the page type is on half or more of the group's sites.
- **Optional**: on fewer than half. Drawn grey.
- **Standard**: no site in the group had it, but every site needs it (Contact, legal, doctor, financing, reviews, locations). Kept and labelled.
- **No count**: a sub-page placed by convention under a counted parent (the count is on "Restorative", not "Root Canal").
- Page types on none of the group's sites, and not standard, were dropped.

Pediatric and Med Spa rest on one site each, so treat them as a first draft, not a pattern.

## Sections on every page

[`section-flows.md`](./section-flows.md) holds the section order for every page type, taken from 191 real client pages
(up to three per page type per specialty, sampled 2026-09-22). What the sampled pages share:

- Treatment pages: hero, what it is, options, steps (4–6), before and after, testimonial (video beats written), FAQ, then the form.
- Trust pages (about, doctor, team): bio or story, credentials timeline, affiliations, a human section, reviews.
- Money pages (cost, financing, membership): price block first, then what changes the cost, partners, FAQ.
- Location pages: local hero, services at that office, team, why locals choose it, local reviews, map and hours, local FAQ.

Ads landing pages are a campaign combo, not one page: `/ads-landing-pages/` is a noindex folder, and each campaign is
**landing → consultation → thank you**, one Go High Level form per campaign redirecting to its own thank-you page, where
the Google Ads conversion fires. Their section flow lives in
[scenario 3, step 02](../../scenario-3-ads-landing-pages/02-build-the-combo/02-build-the-combo.md) only.

## Umbrella (multi-location) structure

Every template separates brand pages from location pages. Brand pages (About, Services, Patients, Results, Blog, Contact) live at the root. Each location is a clone of the `[City]` branch under `/locations/[city]/`, carrying the city's own landing page, its top services, team and contact. Four of the six general practices already run location pages, as `/[city]-dentist/[service]` (Legacy, Marvel) or `/[city]/[service]` (Livewell); `/locations/[city]/` is the template's recommendation, change it per client if an existing URL scheme must be kept.

## Files

- `specialty-sitemaps.txt`: the five templates as `depth|page|path|count` lines.
- `section-flows.md`: the section order per page type, and which template pages use each one.
- `sources.json`: how many URLs were collected per site, and how.

Gathered 2026-09-22 from each site's sitemap.xml, or a same-host link crawl from the homepage where there was none (IFA,
Mason Park, Mason Park Pediatric, Stone Surgical Arts and Westlake), which may miss pages no menu links to. The scrapers,
raw page lists and section outlines were one-off analysis and were removed on 2026-09-28; they are in git history before
that date.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../SYSTEM_RULES.md).
