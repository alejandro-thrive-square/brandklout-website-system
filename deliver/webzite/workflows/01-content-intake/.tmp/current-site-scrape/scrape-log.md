# Current Site Scrape Log

Scrape date: 2026-07-17

## Method

- Used the browser fetcher for text extraction from live pages.
- Attempted direct access to sitemap, robots, nav pages, and project pages.
- Local PowerShell `Invoke-WebRequest` was unavailable because the environment could not connect to the remote server.

## Verified Sources

- Homepage: https://www.webzite.studio/
- Mused Agency: https://www.webzite.studio/projects/mused-agency
- Excellent Facets: https://www.webzite.studio/projects/excellent-facets
- Wealth Group: https://www.webzite.studio/projects/wealth-group
- Ivy RX: https://www.webzite.studio/projects/ivy-rx
- Verde Energy Group: https://www.webzite.studio/projects/verde-energy-group

## Attempted Sources With No Content Returned

- https://www.webzite.studio/sitemap.xml
- https://www.webzite.studio/robots.txt
- https://www.webzite.studio/projects/amble
- https://www.webzite.studio/projects/amble-studio
- https://www.webzite.studio/projects/valiant
- https://www.webzite.studio/projects/valiant-design-studios
- https://www.webzite.studio/projects/michael-sjosten
- https://www.webzite.studio/projects/michael-sjosten-film-director
- https://www.webzite.studio/process
- https://www.webzite.studio/portfolio
- https://www.webzite.studio/pricing
- https://www.webzite.studio/faq
- https://www.webzite.studio/contact

## Known Scrape Limitations

- The scrape is text-first. It captures labels, headings, copy, visible form states, link labels, and image alt/labels when exposed by the fetcher.
- It does not include pixel screenshots or raw image binaries.
- Some Webflow interactions may hide content from text extraction.
- Some discovered pages did not return content in this environment, so they should be checked manually or with an authenticated/visual browser pass before final redesign strategy.

## Follow-Up Capture Recommended

- Full-page desktop screenshots for each live page.
- Mobile screenshots for homepage and every case study.
- Raw asset export from Webflow or the current published site.
- Webflow CMS collection export for case studies, pricing, testimonials, and global components.
- Live form integration check.
- Search Console/PageSpeed/analytics export if performance and traffic history should inform redesign priorities.


## Version Control

This document follows the root-level version control rules in [SYSTEM_RULES.md](/SYSTEM_RULES.md). Commit only non-secret, repo-friendly workflow context and artifacts.

## Infrastructure

- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
