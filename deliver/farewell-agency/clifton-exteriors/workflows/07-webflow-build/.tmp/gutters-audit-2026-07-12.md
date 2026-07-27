# Gutters Page Audit & Fix Log — 2026-07-12

Executed per [SOP-COMPONENT-AUDIT.md](../SOP-COMPONENT-AUDIT.md). Page `6a2469700786361962ad425e` (/gutters), site `6a234fcd5732d1f0a674156f`. All changes headless via MCP Data API. **UNPUBLISHED — Designer draft only.**

## Findings & Fixes

### Layer 1 (instance props) — FIXED
- 4 windows-leftover alt texts replaced (Financing "Bedroom windows", Invite "New windows installed…", Curb "Tall windows", Portfolio "Window installation project…") → gutters-specific alts.

### Layer 2 (definition internals) — FIXED
- `Section / FAQ Gutters` (0988b616, 1 instance) had 6 hardcoded accordion items: 4 gutters + **2 windows Q&A rendering live**. Old-site inventory (C.5: 4 Q&A) + paste artifact (`section-components/page-gutters/paste_10`: 4 questions) confirmed intent → removed items 5–6 (`…da0a1a`, `…da0a24`), verified 4 remain.
- Broader vocab sweep (vinyl/shingle/roofing/siding/door/lorem/defaults) across all 12 section definitions: clean (3 benign hits: ShingleMaster badge logo, "Nextdoor", "Vinyl gutters" FAQ answer).

### Assets — GAP CLOSED
All 18 previously-bound images were the 2026-07-08 **windows-page upload batch**. Fetched the old site /gutters/ page directly (no bot challenge this time; python + truststore for the proxy cert), downloaded 9 correct images, uploaded via create_asset + S3 (all HTTP 201), rebound 13 image props:

| Section / prop | Old (windows batch) | New asset | New ID |
|---|---|---|---|
| Hero "Image" (bg) | DL_Resizer1 | DL_Resizer10.webp (old gutters hero, preload/high) | 6a531a561b0cfa936c12d30d |
| Financing Image 1 | windowsCliftonsections_resizer5 | IMG_2248-scaled.jpg | 6a531a574cd6203ae8461e13 |
| Invite Image 1 | DL_Resizer5 | gutterCliftonsections_resizer2.webp ("new gutter installation") | 6a531a564f3f80abb5c6849c |
| Curb Image 1 | windowsCliftonsections_resizer2 | gutterCliftonsections_resizer1.webp ("new gutter cover") | 6a531a564f3f80abb5c68484 |
| Portfolio 1–9 | 9 windows IMG_* | old 6-photo gutters gallery + 3 repeats (marquee loops): Gutters1 / IMG_2248 / gutters-project-image / IMG_0235 / bigstock-458841205 / bigstock-466977831 / Gutters1 / project-image / IMG_0235 | 6a531a56fbf725c829eef07a, 6a531a574cd6203ae8461e13, 6a531a579538f5ffd5a431e9, 6a531a57fbf725c829eef0f5, 6a531a57cde6ec457952082a, 6a531a5722a35f9c7b0e4acd |

(`image.jpg` renamed `gutters-project-image.jpg`; bigstock files renamed `bigstock-gutters-*` on upload.)

## Deliberately left
- Hero "Cert Text" = roofing certs, hidden (`Cert Visible: false`) — style + reword when roofing config lands.
- Services Contact / Reviews vestigial default props ("This is a heading", lorem) — not rendered.
- URL-mode button links — consistent with the whole services-page family.
- Hero trust badges (GAF/ProVia/ShingleMaster/Nextdoor/5-star) — correct as-is.

## Open items
- **FAQ Insurance (74f06610)** carries the same 2 windows Q&A — visibility unverified; fix on the insurance-claims pass.
- FAQ Siding leftovers hidden (`visibility:false`) — cosmetic cleanup optional.
- Visual QA (focused-tab / Playwright staging shots) after publish.
- **Publish pending user OK.**

## Version Control
Workflow artifact under `.tmp/` per SYSTEM_RULES; superseded by the next audit run.

## Infrastructure

- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
