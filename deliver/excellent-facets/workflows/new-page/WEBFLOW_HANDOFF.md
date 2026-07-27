# Excellent Facets Documents Page — Webflow Handoff

## Delivered

- Standalone HTML/CSS/JS design: `.tmp/final-design/`
- Mobile-first mockups: `.tmp/screenshots/mobile-first-view.png` and `.tmp/screenshots/mobile-full.png`
- Desktop mockup: `.tmp/screenshots/desktop-full.png`
- Dropdown mockups: `.tmp/screenshots/mobile-dropdown-open.png`, `.tmp/screenshots/desktop-dropdown-open.png`, `.tmp/screenshots/desktop-entity-dropdown-open.png`
- Five pasteable Webflow components: `.tmp/webflow/documents/paste_01_*.html` through `paste_05_*.html`
- Canonical 21-file manifest: `.tmp/document-manifest.json`
- Production URL map: `.tmp/production-link-map.json`
- Public-site structure/style scrape: `.tmp/site-reference/`
- Browser, download, PDF, and converter QA: `.tmp/qa/`

The page is bilingual EN/FR, mobile-first, public, free of login/email capture, and intentionally has no site navigation. Its visual system reuses the live site's wordmark, Scotch Display and Kantumruy Pro typography, dark green, warm off-white, charcoal, and sand palette.

### Download dropdowns + hover + square corners (client revision)

Per client feedback, every download on the page now lives behind a dropdown:

- **All 11 download locations** use a single "Download / Télécharger" trigger that opens a menu of language options: the 5 document cards (Sustainability Reports 2024/2023, Company Overview, Supplier Code of Conduct, Approved Mine Sources List) **and** the 6 Customer Onboarding entity rows (KYC + Identification, each for Inc./SAS./SA). There are no more inline EN/FR buttons anywhere.
- **Hover-to-open on desktop only**: the menu opens on mouse-in and closes on mouse-out (with a short grace delay across the trigger→menu gap). Hover is driven by Pointer Events and gated to `pointerType === "mouse"`, so a touch tap's synthetic `pointerenter` never pre-opens the menu — that pre-open is what used to make the native `<summary>` toggle close it straight back (the "opens on the second tap" mobile bug). The mouse click on the trigger is suppressed on desktop (hover owns it), while **touch taps open on the first tap** and keyboard (Enter/Space), Escape, outside-click, one-open-at-a-time and auto-close-on-download all still work.
- **Border-radius removed globally** (`--ef-radius` / `--ef-radius-small` set to 0, plus the one literal on menu items) — cards, buttons, menus and form cards are now square-cornered.

Implementation notes:

- Built on native `<details>`/`<summary>`, so each menu opens, closes and downloads **even with JavaScript disabled** (no regression to the direct-download behaviour).
- `documents.js` adds the UX polish only (hover, one-at-a-time, outside-click/Escape close, arrow-key nav, auto-close on download).
- Show/hide is driven by the real `[open]` attribute via `display` (instant, never stuck), with a subtle open animation. The state CSS rides inside the library component's `<style data-embed>` (raw CSS) because parent-state selectors (`.ef-dropdown[open] > .ef-dropdown-menu`) cannot be baked into Webflow's flat single-class model.
- The trigger caret is a CSS border chevron (an empty `<span>` with right+bottom borders), not a text glyph, so its 180° flip rotates exactly about its center — a text glyph sits on the font baseline and looks off-centre/orbiting when rotated. Verified the pivot is fixed to 0 px on both axes.
- Verified by headless-browser tests: all 11 dropdowns open (hover on desktop, tap on touch) with correct item counts, one-at-a-time, keyboard nav, border-radius 0 on cards/triggers/menus/items/form-cards, no horizontal overflow at 390 px / 1440 px, zero console errors, and the no-JS fallback opens + downloads.
- All 21 download links and `data-file-key` hooks are preserved, so `apply_production_links.py` and the CORS `fetch` direct-download path still work unchanged.

## Asset URL Step Required Before Production Paste

The generated design preview uses local relative PDF URLs so all 21 supplied files can be tested locally. Before the final Webflow paste:

1. Upload or externally host every canonical file listed in `.tmp/document-manifest.json`.
2. Fill all empty values in `.tmp/production-link-map.json`.
3. Run:

   ```bash
   python deliver/excellent-facets/workflows/new-page/.tmp/apply_production_links.py
   ```

4. Regenerate the payloads:

   ```bash
   python deliver/process/07-webflow-build/html_to_webflow.py \
     --html deliver/excellent-facets/workflows/new-page/.tmp/final-design/webflow-source.html \
     --css deliver/excellent-facets/workflows/new-page/.tmp/final-design/documents.css \
     --asset-base https://excellentfacets.com \
     --split deliver/excellent-facets/workflows/new-page/.tmp/webflow/documents

   python deliver/process/07-webflow-build/wf_tools.py qa \
     deliver/excellent-facets/workflows/new-page/.tmp/webflow/documents
   ```

Two verified compressed PDFs already exist on the live Webflow CDN and are prefilled in the map: the 2023 EN report and 2024 FR report. The current English sustainability page appears to point its “2024” button at a file named as a 2023 report, so that URL was not reused.

The supplied 2024 EN/FR reports are approximately 98.7 MB and 107.8 MB, and both company brochures are approximately 17.1 MB. Confirm the target hosting limit. Compress large files or use public object storage/download endpoints. The download enhancement uses CORS-enabled `fetch()` to produce an actual file download; the preferred production host should also return `Content-Disposition: attachment`.

## Webflow Paste Sequence

1. Create a scratch page first; do not paste directly into production.
2. Set the eventual page slug to `documents`.
3. Delete all existing scratch-page body content and clean unused styles.
4. Open and copy each component in filename order:
   - `paste_01_ef-skip-link.html`
   - `paste_02_ef-docs-topbar.html`
   - `paste_03_ef-docs-hero.html`
   - `paste_04_documents-library.html`
   - `paste_05_ef-docs-footer.html`
5. Paste each component as a direct body child with the Relume Chrome extension active.
6. No page-level CSS or footer JavaScript is required; section-specific CSS and download JavaScript travel inside the components as Webflow HtmlEmbed elements.
7. Do not add the page to any navigation menu.
8. Keep the page public with no password, login, form, or email gate.
9. Keep `<meta name="robots" content="noindex,follow">` or configure equivalent page-level indexing controls if direct/QR access should remain the only intended discovery path.
10. Publish to the Webflow staging domain only after target-site confirmation. Production publishing still requires explicit approval.

## QA Result

- 21 of 21 PDFs open successfully and are not encrypted.
- 21 of 21 download links are present.
- Mobile 390 px and desktop 1440 px render with zero horizontal overflow.
- One H1 and three H2 group headings are present.
- Browser console errors: zero.
- Direct-download test succeeded for a supplied PDF.
- All 11 download locations use the dropdown (11 `<details>`/`<summary>` triggers, 21 menu items = 21 links); no inline EN/FR buttons remain.
- Dropdown: hover-to-open on desktop, tap on touch; Escape and outside-click close; one-open-at-a-time; arrow-key navigation; auto-closes on download; no-JS fallback opens and downloads; zero console errors.
- Border-radius: 0 on cards, download triggers, dropdown menu/items and form cards (verified in computed styles and in the baked Webflow classes).
- Webflow payload QA: all checks passed; zero class conflicts and zero missing JavaScript hooks.

## Version Control

Follow [SYSTEM_RULES.md — Section 4](../../../../SYSTEM_RULES.md). Commit lightweight HTML/CSS/JS, JSON, and documentation artifacts when useful. Do not commit PDFs, screenshots, secrets, or other binary/media files; sync those through the project asset workflow.

## Infrastructure

- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
