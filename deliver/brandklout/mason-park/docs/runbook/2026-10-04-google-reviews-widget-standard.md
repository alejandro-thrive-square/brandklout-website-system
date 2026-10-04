# 2026-10-04 — Google reviews widget swapped to the in-section standard

## Done
- **New Elfsight Google Reviews widget `e30c1531-deaf-4e44-b3de-61cf3426bce9`** (Trong's account,
  "Mason Park Dental - Google Reviews") on Mason Park Dental of Katy, 21830 Kingsland Blvd #104A
  (place `ChIJ713d50AnQYYRM-GW5sa4Gvo`), 4.9 / 1,087 reviews. Created by Codex, one widget.
- It replaces the practice's **All-in-One Reviews `32926aff`** (other Elfsight account): that app's
  header says "Overall Rating" with no Google logo, so it cannot meet the in-section standard
  (`deliver/process/tools/elfsight-reviews/README.md` on main). `32926aff` still exists, off the site.
- Styled to the standard: no widget title (the sections carry "What Katy families actually say." and
  "The rest of them, whole."), header layout 1 (Google logo, 4.9, (1,087), *Review us on Google*),
  button `#8C6349` Karla uppercase 1.92px 2px radius (Custom CSS with `!important`), cards
  **sand `#EDE2D5`** (the widget sits on paper `#F7F3EE` on `/` and white on `/patient-reviews`, so
  one token apart from both), 2px radius, outline body at 12%, review photos off.
- Source: `.tmp/elfsight-snippet.mjs` `WIDGET_ID`, the `data-elfsight-reviews` slots in
  `home/index.html` and `home/patient-reviews/index.html`; `add-elfsight-reviews.mjs` now refreshes
  **any** Elfsight embed in place (it matched only the old id).
- Staging then production: backups `backup-staging…-2026-10-04T17-06-22.json`,
  `backup-www…-2026-10-04T17-35-02.json`; `add-elfsight-reviews.mjs --apply --publish` on each
  (2 pages, snippet exact, no lazy attribute). Gate
  `check-widget.mjs e30c1531… --style … --render <page>`: **ok** on `/` and `/patient-reviews`, staging and www.

## Next
- Nothing open on the widget. If a page is rebuilt from source, the chain keeps it (the slot carries the new id).

## Gotchas
- Elfsight's Carousel template turns **review photos on**; a review with photos is never shortened
  (14-line cards next to 3-line ones). Off.
- Plain Custom CSS loses to Elfsight's own class rules inside the shadow root: every declaration `!important`.
