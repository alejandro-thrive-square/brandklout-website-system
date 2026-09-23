# Specialty sitemap templates

Five starting sitemaps, one per practice type, built from what 14 Brandklout client sites actually publish. They are drawn on the FigJam board [Sitemap](https://www.figma.com/board/COB1NVbhZFDvCUgEB5izba/Sitemap), one section each, below the Relume ads-landing-page sitemap.

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
- **No count**: a sub-page placed by convention under a counted parent (the classifier counts "Restorative", not "Root Canal").
- Page types on none of the group's sites, and not standard, were dropped.

Pediatric and Med Spa rest on one site each, so treat them as a first draft, not a pattern.

## Sections on every page

Each page carries its section flow, drawn in the Relume format of the reference sitemap (a column per page, one card per section, name and what goes in it). The flows come from 191 real client pages: `outline-pages.py` fetched up to three pages per page type per specialty and recorded their headings and components in order (`outlines.txt`), and each flow in `section-flows.py` is the best combination of what those pages do. What the sampled pages share:

- Treatment pages: hero, what it is, options, steps (4–6), before and after, testimonial (video beats written), FAQ, then the form.
- Trust pages (about, doctor, team): bio or story, credentials timeline, affiliations, a human section, reviews.
- Money pages (cost, financing, membership): price block first, then what changes the cost, partners, FAQ.
- Location pages: local hero, services at that office, team, why locals choose it, local reviews, map and hours, local FAQ.

`python section-flows.py` rewrites `detailed-sitemaps.json` (flows plus every page's flow key and subject), the data the FigJam sections were drawn from.

## Umbrella (multi-location) structure

Every template separates brand pages from location pages. Brand pages (About, Services, Patients, Results, Blog, Contact) live at the root. Each location is a clone of the `[City]` branch under `/locations/[city]/`, carrying the city's own landing page, its top services, team and contact. Four of the six general practices already run location pages, as `/[city]-dentist/[service]` (Legacy, Marvel) or `/[city]/[service]` (Livewell); `/locations/[city]/` is the template's recommendation, change it per client if an existing URL scheme must be kept.

## Files

- `specialty-sitemaps.txt`: the five templates as `depth|page|path|count` lines, the source the board was drawn from.
- `page-type-coverage.json`: how many sites in each group have each page type.
- `sources.json`: URLs collected per site and how.
- `sitemaps.json`, `navcrawl.json`: the raw page lists (sitemap.xml where published, otherwise a same-host link crawl from the homepage).
- `outline-pages.py`, `outlines.json`, `outlines.txt`: sampled pages and their section outlines.
- `section-flows.py`, `detailed-sitemaps.json`: the section flows and the per-page mapping.
- `fetch-sitemaps.py`, `crawl-nav.py`, `classify.py`: rerun in this folder to refresh (`python fetch-sitemaps.py <domain>…`, `python crawl-nav.py <domain>…`, `python classify.py`). The classifier is regex on the URL path, and a page may match several types.

Gathered 2026-09-22. IFA, Mason Park, Mason Park Pediatric, Stone Surgical Arts and Westlake publish no sitemap.xml, so their lists come from a link crawl and may miss pages that no menu links to.

## Version Control

Lightweight analysis artifacts, committed per [SYSTEM_RULES.md §4](../../../../../SYSTEM_RULES.md).
