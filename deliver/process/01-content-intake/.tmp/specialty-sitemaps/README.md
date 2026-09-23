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

## Umbrella (multi-location) structure

Every template separates brand pages from location pages. Brand pages (About, Services, Patients, Results, Blog, Contact) live at the root. Each location is a clone of the `[City]` branch under `/locations/[city]/`, carrying the city's own landing page, its top services, team and contact. Four of the six general practices already run location pages, as `/[city]-dentist/[service]` (Legacy, Marvel) or `/[city]/[service]` (Livewell); `/locations/[city]/` is the template's recommendation, change it per client if an existing URL scheme must be kept.

## Files

- `specialty-sitemaps.txt`: the five templates as `depth|page|path|count` lines, the source the board was drawn from.
- `page-type-coverage.json`: how many sites in each group have each page type.
- `sources.json`: URLs collected per site and how.
- `sitemaps.json`, `navcrawl.json`: the raw page lists (sitemap.xml where published, otherwise a same-host link crawl from the homepage).
- `fetch-sitemaps.py`, `crawl-nav.py`, `classify.py`: rerun in this folder to refresh (`python fetch-sitemaps.py <domain>…`, `python crawl-nav.py <domain>…`, `python classify.py`). The classifier is regex on the URL path, and a page may match several types.

Gathered 2026-09-22. IFA, Mason Park, Mason Park Pediatric, Stone Surgical Arts and Westlake publish no sitemap.xml, so their lists come from a link crawl and may miss pages that no menu links to.

## Version Control

Lightweight analysis artifacts, committed per [SYSTEM_RULES.md §4](../../../../../SYSTEM_RULES.md).
