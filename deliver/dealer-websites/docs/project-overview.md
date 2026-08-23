# Dealer Websites - Project Overview

## Selected Offer
**Webflow Improvements & Updates** - Maintenance work on a Webflow site built previously by the studio. Per engagement scope, **only the Webflow Build (`07-webflow-build`) workflow is in scope** for this client folder.

## Approved Scope
- **Engagement type:** Maintenance / updates on an existing Webflow site originally built by the studio.
- **Active workflow:** `07-webflow-build` only. This folder was created lean, scoped to the Webflow Build toolchain, because the site is already live and no new design, content intake, wireframe, or launch pipeline is required for the current maintenance work.
- **Source of truth for changes:** the approved change list / spec. Capture it here under *Open Questions / Change List* once defined, or in a dedicated spec doc under `docs/`.

> [!NOTE]
> The canonical offer route for **Webflow Improvements & Updates** is
> `00` -> `15` -> `07` -> `08` -> optional `09` -> adapted `10`
> (see [OFFER_ROUTING.md](../../process/OFFER_ROUTING.md)). For this lean
> engagement, only `07-webflow-build` was copied into the client workspace; the
> intake/audit (`15`), QA (`08`), launch (`09`), and handoff (`10`) phases are
> intentionally **not** instantiated here. Re-open them if a request grows
> beyond the build toolchain.

## Current Delivery Decision
- **Webflow status:** Existing site maintained directly in Webflow via the Webflow MCP. No Vercel/Airtable path.
- **Build toolchain:** `deliver/dealer-websites/workflows/07-webflow-build/` (self-contained HTML -> Webflow clipboard converter, diagnostics, config orchestrator).
- **Operational MCP:** [mcp-access.md](./mcp-access.md)

## Project Details
| Field | Value |
|---|---|
| Client | Dealer Websites |
| Domain | `<TBD>` |
| Offer | Webflow Improvements & Updates |
| Engagement model | `<one-time / hourly / retainer>` |
| Webflow site ID | `69c8c0f16c14c214b2451dcf` (confirmed 2026-08-08) |
| Timeline | Per [PRICING_TIMELINE_RULES.md](../../../sales/PRICING_TIMELINE_RULES.md) - page-based formula applies only to pages added/redesigned; other maintenance changes are ad-hoc/hourly. |

## Routed Workflows
| # | Workflow | Status | Notes |
|---|---|---|---|
| 00 | Client Delivery Initialization | Not instantiated | Lean maintenance engagement; this `project-overview.md` + `mcp-access.md` replace the full init workspace |
| 15 | Improvement Intake & Audit | Not instantiated | Re-open if a formal change-list audit is needed |
| 07 | Webflow Build | **Active** | Self-contained toolchain cloned from `deliver/process/07-webflow-build/`; per-project values live in `webflow-build.config.json` |
| 08 | QA | Not instantiated | Re-open when staged changes need a formal QA pass |
| 09 | Launch | Not instantiated | Re-open only when publishing / production release is in scope |
| 10 | Handoff & Support | Not instantiated | Re-open when a delivery note or support/retainer summary is needed |

## Asset Locations
- **Build toolchain + config:** `deliver/dealer-websites/workflows/07-webflow-build/`
- **Build artifacts:** `deliver/dealer-websites/workflows/07-webflow-build/.tmp/`
- **Source HTML/CSS for conversion:** `<TBD - point webflow-build.config.json.css and .pages at the approved source once known>`

## Change Log

### 2026-08-08 - Alternating feature rows on the industry pages

The `Section Feature Row` component only rendered one direction (copy left / image right), so the
industry pages read as seven identical rows. Split into a matched pair and alternated:

| Component | ID | Instances |
|---|---|---|
| `Section Feature Row - Image Right` (renamed original) | `7034366f-9b59-23e6-df68-be7e59671951` | 32 (rows 1, 3, 5, 7 on 8 pages) |
| `Section Feature Row - Image Left` (duplicate) | `8e93bc64-7800-ad7d-aec5-417791d27668` | 24 (rows 2, 4, 6 on 8 pages) |

- The mirror is a **combo class**, not a restructured tree: `.layout1_image-wrapper.is-image-left`
  sets `order: -1` at base and resets to `order: 0` at the `small` breakpoint, so the image takes the
  left grid column on desktop/tablet while both variants still stack **copy first** on mobile. DOM
  order is identical in both components, so prop IDs, bindings, and content stay interchangeable.
- Pages updated (7 rows each): Car Dealer Websites, Commercial Truck, Boat, Powersports, RV,
  Trailer, Equipment, Auto Repair Shops.
- Applied headlessly via the Data API MCP. **Left in the Designer, not published.**

> [!IMPORTANT]
> **Gotcha - component instances are not valid insert/move anchors.** `insert_component_instance`
> rejects an instance as `parent_element_id` ("the Designer rejects inserts that use a component
> instance as the anchor"), and `move_element` fails with a bare "internal error" against the same
> anchor. Since every sibling section on these pages is an instance, the working pattern is:
> append the new instance to the **parent** (`.main-wrapper`), then restore order by re-appending
> every following sibling to that parent in the desired sequence. Duplicated components keep the
> **same prop IDs** as their source, so instance content copies across verbatim.

## Setup Items Needed
- [x] Confirm Webflow site ID for `dealer-websites` (via `list_sites`) and record it in [mcp-access.md](./mcp-access.md)
- [ ] Confirm production domain
- [ ] Locate / supply approved source HTML + CSS, then fill in `webflow-build.config.json` (`asset_base`, `css`, `pages`)
- [ ] Authenticate the Webflow MCP via `/mcp`, selecting only the Dealer Websites site

## Open Questions
- What is the current change list / spec for this maintenance cycle?
- Where does the approved source HTML/CSS live (local copy, live-site export, or existing design folder)?
- Is this a one-time update, hourly engagement, or retainer?

## Version Control
- All changes to this document must follow the version control rules in [SYSTEM_RULES.md](../../../SYSTEM_RULES.md).
- **Branch naming:** `deliver/dealer-websites-<change>`
- **Commit discipline:** Atomic commits with descriptive messages. One logical change per commit.

## Infrastructure
- **Hosting:** Hostinger VPS
- **OS:** Ubuntu 24.04 LTS
