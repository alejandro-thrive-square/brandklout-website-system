# 2026-10-04 — Elfsight in-section reviews standard: SOP, Codex brief, `check-widget.mjs` gate

## Done
- **SOP** in `deliver/process/tools/elfsight-reviews/README.md`, section *In-section widget standard
  (SOP)*: carousel, **widget title off** (the site section carries the heading), **header layout 1**
  with the Google logo + *Reviews*, rating and **review count**, *Write a review* button in the site's
  main CTA style, cards in the site font/colours, transparent plate, AI summary off. Steps 1–8 from
  site style to render gate. Row in `PROCESS_INDEX.md`.
- **Codex brief** `tools/elfsight-reviews/codex-instruction.txt` (fill `{{…}}`, `codex_cu.mjs --allow-writes`).
- **Gate** `tools/elfsight-reviews/check-widget.mjs <id> [--style site-style.json] [--render <page>]`:
  keyless, reads the widget's settings from the boot API; `--style` compares with
  `ghl-forms/site-style.mjs` output; `--render` loads the page in headless Chrome, scrolls the
  mount in and walks the shadow roots. Tested on Mason Park Kids `d359c3c4…`: header already right,
  fails on widget title, padding, header plate, default blue/grey, font (11 problems, render 8 cards).

## Next
- Apply it per client when a reviews section is built or fixed; first real run should confirm the
  Codex brief's setting names against the Elfsight editor and split it if a run stops halfway.

## Gotchas
- The boot API (`core.service.elfsight.com/p/boot/?w=<id>`) returns **every** editor setting,
  theme and Custom CSS included, without a login: read state there, not in the editor.
- `headerElements: title` **is** the Google logo + "Reviews"; `widgetTitle` is the separate
  "What Our Customers Say" heading above it. Turning the wrong one off loses the logo.
- Style with the stable `es-*` classes (`es-header-write-review-button`,
  `es-header-rating-reviews-count`, `es-widget-title-container`, `es-review-container`); the
  `…__X-sc-hash` classes change per release.
- Nothing was changed in Elfsight in this run; no widget edited.

## Update (later 2026-10-04): tested on Mason Park General and Kids
- **Kids `d359c3c4`**: restyled by Codex (4 small runs), gate **ok** on `/` and `/patient-reviews`
  (from 17 problems). Reference widget for the standard.
- **General**: the All-in-One `32926aff` (other account) has no Google logo in its header, so a
  **new Google Reviews widget `e30c1531`** (#104A, 4.9 / 1,087, 32/50 slots) was created, styled and
  swapped in on `/` and `/patient-reviews`, staging then production; gate **ok** on all four pages.
  Client commits: `bk-mason-park` `d2a48432`, `bk-mason-park-kids` `ec839d27`.
- Gate hardened by the test: waits for the header, reads the visible copy of each element, measures
  the real inset, checks the section H2 colour and card vs section background, the rendered button
  case/font against the site, `!important` on Custom CSS, review photos off, and card text lines.
- Brief and SOP: editor URL `dash.elfsight.com/widget/<id>`, own-tab rule, `!important`, photos off,
  one card colour apart from every section a shared widget sits in.

## Gotchas (from the test)
- **Custom CSS without `!important` does nothing**: Elfsight's generated class rules in the shadow
  root have equal specificity and win.
- **The Carousel template turns review photos on**, and a review with photos is never shortened.
- `font: {}` is "Default (Apply from Website)"; the padding controls are hidden while the widget
  background is transparent (the stored 40/40 does nothing).
- site-style.mjs's `heading` is the hero H1 (often white): take the header text colour from the
  reviews section's H2, which `--render` reads.

## Update (evening 2026-10-04): every Instatic site's widget restyled (widget only, no site edits)
- User: change the widgets, not the Instatic sites. Done in the Elfsight editor by Codex, one run per widget:
  **Stone Med Spa `73fff4ec`** (live on westlaketxmedspa.com home; gate ok rendered), **Nahlah `da62eaec`**,
  **West LA `670ca31c`**, **IFA `7febe92d`** (not placed: settings gate ok, colours from the live
  site, light section assumed). Mason Park General + Kids done earlier.
- **Skipped: Stone Surgical `c92f78df`**: it is the floating badge in Stone Dental's (Webflow) footer;
  restyling it would change that site.
- Stone Med Spa needed a second pass: the white box around its embed is the **site's** padless card
  on a dark section, so the widget takes white + 32px padding and dark header text. The gate now
  checks header-text contrast against what is behind it and the gap to that box's edge.

## Gotchas (evening)
- A white panel around a widget in a screenshot may be the site's card, not Elfsight's: check
  `widgetBackground` in the boot data before choosing header colours.
- Stone Med Spa: with the widget title gone, its reviews have only the "In their words" eyebrow; a
  section H2 there is a site change, left to the owner.
