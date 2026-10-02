# Oceanic Dental · old-site capture (partial)

Captured 2026-10-02 with scenario 1 step 01's scripts. **Partial:** the scrape and the asset download
cover the whole site; screenshots cover the homepage only, because the task was the concept deck.

- **Platform:** Webflow, site `66cd6c49cbb85d43d9e41a7c`. Blog images live on a second Webflow asset
  host, `682138d7f666525258b6422c`.
- **Pages:** 106 in the sitemap (services, location landing pages, 40+ resource articles, 13
  aftercare pages), all scraped to markdown + JSON (`scrape/`), 243 distinct media URLs
  (`scrape/media-manifest.csv`).
- **Assets:** 782 of 783 downloaded (171 MB) to `assets/downloads/` with `asset-manifest.csv`,
  `asset-catalogue.csv`, `ASSETS.md`; 5 YouTube films in `video-embeds.csv`; 9 Webflow-hosted mp4
  clips (iTero scan, digital X-ray, Dr. Tanaka, Invisalign day, full-mouth rehab, Dr. Noh, no-prep
  veneers patient, Dr. Pham comfort, Dr. Pham consultation). Media is gitignored and backed up to R2.
- **Homepage:** screenshots at 1440 (10,685 px tall) and 390; rendered text in `screenshots/pages/home.md`.
  13 sections, mapped in `scenario-0-new-site/01-client-inquiry/output/concepts/content.md`.
- **Brand:** Webflow variables deep teal `#1a3743`, teal `#29999a`, oceanic blue `#64b5b6`, aqua
  `#afe7e5` / `#d1f5f4`, sand `#eee9e0`, cream `#fdf3e2`, blush `#ffd1ca`, clay `#8f5433`. Type: a
  custom display face "Oceanic Font" (TTF on the Webflow CDN, CORS open) and Nunito; Exo and Open Sans
  are loaded but barely used.

## Findings for the client

- The homepage's "Dr Cantrell and Dr Bonin" photo shows a doctor who is no longer on the Our Team page.
  The deck uses the 2026 doctors group photo instead.
- "The Orange County Record People's Choice Awards" should read Orange County **Register**.
- The rendered homepage shows DNI pool numbers on both offices; the real numbers are in `docs/facts.md`.

Not done yet (step 01 checklist): every-page screenshots, mirror + scan, Wayback and URL inventory,
email DNS snapshot, tracking inventory, CMS export (Webflow CSV), drive upload.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../../SYSTEM_RULES.md).
