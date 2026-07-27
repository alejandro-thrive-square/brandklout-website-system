# Doors + Roofing Pages — Paste & Component-Reuse Runbook

**Date**: 2026-07-08 · **Site**: Clifton Exteriors + LUTUM (`6a234fcd5732d1f0a674156f`)
**Pages**: Doors (`6a24696a6c87c45a3aa672e4`, `/doors`) · Roofing (`6a24696d1de5486071628fdc`, `/roofing`)

## What this is

Two new service pages built exactly like the `/windows` rebuild: content 1:1 from
cliftonexteriors.com, design per the windows section system, ONE single-root paste
per page. New this time: **component reuse** — sections that structurally match the
existing `Section / Windows *` components get pasted only as placeholders, then
replaced with component instances via MCP (props re-set per page) so the site does
not accumulate duplicate structures. The `windows` naming in component names is a
known separate cleanup task — do NOT create new page-named components.

## Artifacts

| File | What |
|:---|:---|
| `page-doors/paste_01_page_doors.html` | Doors whole-page copy page (522 nodes, single `.page_doors` root) |
| `page-roofing/paste_01_page_roofing.html` | Roofing whole-page copy page (582 nodes, single `.page_roofing` root) |
| `page-doors/component-replacements.json` | Post-paste MCP recipe for doors (component ids, prop ids, values, asset ids) |
| `page-roofing/component-replacements.json` | Same for roofing |
| Sources | `../04-design/.tmp/final-design/page-doors.html`, `page-roofing.html` |

QA: `wf_tools.py qa` ALL CHECKS PASSED for both, `--against`
page-windows + section-reviews + section-cta-quote + each other →
**0 cross-page collisions** (shared classes are def-identical and merge; the only
new classes are `page_doors`, `page_roofing`, `win-hero__sub`, `win-invite__copy-3`,
and the `is--five` upgrades-grid combo).

All images needed for component props are Webflow assets already (8 uploaded
2026-07-08 via Data API + S3; the rest existed from the teammate's build). Asset ids
are inline in the manifests.

## Per-section plan (both pages)

| Section | Doors | Roofing |
|:---|:---|:---|
| Hero | paste (H2 not propped) | paste (H2 + extra `win-hero__sub` lines) |
| Financing | → component (image prop) | → component (image prop) |
| Feature 1 (invite) | paste (3 paragraphs vs 2 props) | paste (3 paragraphs vs 2 props) |
| Upgrades | paste (5 cards vs 4 props; `is--five` grid) | → component (exactly 4 cards) |
| Feature 2 (curb) | → component | → component |
| Portfolio | → component (6 photos across 9 slots) | → component (6 photos across 9 slots) |
| Confidence | → component (zero prop changes) | → component (Card 01 = "10 Year…") |
| Pricing | → component (2 bullets/tier) | paste (3 bullets/tier vs 2 props) |
| Process | → component (paragraph prop) | → component (paragraph prop) |
| FAQ | paste (own 2 Q&As) | paste (own 6 Q&As) |
| Reviews | insert (see step 4) | insert (see step 4) |
| Contact | → component (zero prop changes) | → component (zero prop changes) |
| Closing | paste (heading differs) | paste (heading differs) |

## Procedure

### 1. Paste (Claude-in-Chrome on the logged-in Designer; one page at a time)

1. Open `paste_01_page_doors.html` locally, click Copy (standalone click; re-copy
   fresh on a paste miss; Ctrl+0 if Designer zoom drifted).
2. In the Designer, **first paste onto a throwaway test page** — confirm no `-2`
   classes in the Style panel, embeds render, layout right.
3. On the **Doors** page: keep the page scaffold (`page-wrapper`, Global Styles,
   Navigation, `main-wrapper`, Footer — same skeleton as the windows page).
   Paste the payload **inside `main-wrapper`**. Delete the teammate's old section
   instances inside `main-wrapper` only after the new content is verified
   (⚠ deleting the old sections needs Alejandro's explicit go — flag before doing it).
4. Repeat for **Roofing** with `paste_01_page_roofing.html`.

### 2. Post-paste MCP pass (headless Data API; no bridge app needed)

For each page, walk `component-replacements.json` in order:

1. `query_elements` by the section's `root_class` to find the pasted twin.
2. `insert_component_instance` (creation_position `after`, parent = the pasted
   section element) with the listed component id.
3. `set_component_instance_prop_values` with the listed props
   (image props take the assetId as `string_value`).
4. Visually verify (screenshot / staging), then `remove_element` on the pasted twin.
5. For `keep_pasted` sections, apply `relink_images` via `set_image_asset`
   (kills the fragile WordPress hotlinks; hero bg + trust badges + feature-1 image).
6. Finally, move all remaining sections up out of the `.page_doors`/`.page_roofing`
   wrapper into `main-wrapper` (`move_element`) and delete the empty wrapper —
   matching the windows page structure (instances as direct children of
   `main-wrapper`).

### 3. Contact form

The converter can't emit native forms. In each pasted Contact… wait — Contact gets
replaced by `Section / Windows Contact`, which carries the same interim
"Get Your Quote" button as windows. Adding the real native quote form inside the
component's form slot is a single site-wide fix (do it once in the component,
all pages get it).

### 4. Reviews wall (still missing on windows too!)

The `section_reviews-v2` payload was never pasted on the windows page — the
FAQ→Contact gap exists on `/windows` today. Plan:

1. Paste `section-reviews/paste_01_section_reviews-v2.html` ONCE (e.g. on the Doors
   page), drag it between FAQ and Contact.
2. `transform_element_to_component` → name it `Section / Reviews Wall`
   (content identical site-wide → global, no props needed per the props rule).
3. `insert_component_instance` between FAQ and Contact on Roofing AND Windows via MCP.

### 5. Verify & publish

- Publish to staging (needs explicit confirmation) → verify on a **focused** tab
  (background tabs freeze IO/rAF: hero word reveal + marquees look broken otherwise).
- Check: hero word roll-up + Ken-Burns zoom, portfolio drag marquee both directions,
  process type marquee, FAQ accordion (first item open), 5-card doors upgrades grid
  at 991px/479px, roofing hero support lines, pricing bullets (3 on roofing).

## Content deviations from the live pages (logged)

- Doors FAQ A1: live says "our roofing team" on the doors page — corrected to
  "our door installation team".
- Roofing hero H2 title-cased ("Trust Our Expertise For All Your Roof Replacement
  And New Roof Installation Needs") for the display-heading idiom; wording verbatim.
- Eyebrow labels are additive design elements (same rule as windows).
- Doors financing visual = DL_Resizer5 (house exterior; live page has no distinct
  financing image), feature-1 visual = doorCliftonsections_resizer1 (wooden door).
  Roofing feature-1 visual = bigstock shingle close-up (live page og:image).
  Swap in the Designer if unsuitable.
- Portfolio marquees show 6 unique photos in 9 slots (3 repeats) — the component
  has 9 image props and the marquee loops, so repeats read naturally.

## Version Control
Follows [SYSTEM_RULES.md - Section 4](../../../../../SYSTEM_RULES.md); lightweight `.tmp/` artifacts committed for review/replay/handoff.

## Infrastructure

- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
