# Horizon — New Home-Page Sections: Paste Guide

Six pasteable components for https://horizon-build.webflow.io home page, recreated
from https://www.horizonbuildingcorp.com (content kept, layouts redesigned to match
the new site's system).

Source design: `../../04-design/.tmp/new-sections/new-sections.html` (+ `sections.css`,
`preview.css` for local preview). Regenerate with `html_to_webflow.py --split` (see
`deliver/giovanni-serrano/workflows/07-webflow-build/`).

## Paste order (all AFTER the Turn-Key section, inside Main Wrapper)

| # | File | Section |
|---|------|---------|
| 1 | `paste_01_u-section.html` | Projects (featured card + 4-card grid) |
| 2 | `paste_02_u-section.html` | Why Choose Us (numbered rows) |
| 3 | `paste_03_u-section.html` | Testimonials (3×2 quote grid + Google 5.0 header) |
| 4 | `paste_04_u-section.html` | FAQ (sticky intro + accordion) |
| 5 | `paste_05_u-section.html` | CTA (image panel) |
| 6 | `paste_06_footer-main_component.html` | Footer (columns + contact + social) |

For each file: open it in the logged-in Chrome, click the copy button, focus the
Webflow Designer (zoom reset Ctrl+0), select the previous section, paste. One file
at a time; re-copy fresh if a paste misses.

## After pasting

1. **FAQ accordion JS** — add `webflow-custom-code.js` (this folder) to Page settings
   → Before `</body>` tag, wrapped in `<script>…</script>`. Without it the accordion
   stays collapsed.
2. **Footer** — `footer-main_component` is a NEW element (class names don't collide
   with the existing minimal `footer_component`). Move it OUTSIDE Main Wrapper (as a
   direct Body child, like the current footer) and delete/keep the old
   `footer_component` as desired.
3. **Divider span** — each section header divider uses combo `u-heading_divider is--span`
   (`grid-column: 1 / -1`). If a divider shows as a short line in cell 1, set its grid
   span to full width manually.

## Class-system notes

- Shared classes (`u-section`, `u-heading_row`, `u-heading_divider`, `u-heading`,
  `u-paragraph`, `u-card`, `card_image`, `card_image-overlay`, `card_content`,
  `card_link`, `button`, `is-alternate`, `button-group`) are pasted with definitions
  replicated from the published site CSS, so Webflow merges them by name with the
  existing Designer classes.
- New classes follow the site's naming: `section_projects/why/testimonials/faq/cta`
  combos on `u-section`, `u-section-content` / `u-section-heading` shared utilities,
  and `projects_* / why_* / testimonials_* / faq_* / cta_* / footer-main_*` families.
- The stray `hbc-*` classes already in the project are from an older attempt — unused
  here; safe to clean up in the Designer's Style Manager.

## Known gaps / follow-ups

- **Images hotlink the OLD site's Webflow CDN** (horizonbuildingcorp.com asset buckets).
  They render fine, but re-upload to this site's assets for long-term safety
  (5 project photos + CTA background + BBB badge SVG).
- Project card links use the old site's `/projects/<slug>` paths; `View Portfolio`
  → `/portfolio`, CTA/footer buttons → `/contact-us`. Update to the new site's URL
  structure when those pages exist.
- Testimonials show 6 of the 22 Google reviews scraped (full set in the content
  inventory / old-site scrape under `.tmp/scrape/`). Consider a CMS collection if
  all 22 are wanted.

## Version Control

Follows [SYSTEM_RULES.md](../../../../../../SYSTEM_RULES.md). Lightweight artifacts in
this folder are committable; do not commit binaries.

## Infrastructure

- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
