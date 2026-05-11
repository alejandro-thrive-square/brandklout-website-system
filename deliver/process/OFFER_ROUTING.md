# Deliver Offer Routing

This document is the canonical bridge between signed Sales offers and Deliver execution. Sales owns offer definition, proposal sending, discovery meeting, contract onboarding, and the handoff package. Deliver starts only after the contract is signed, runs `00-client-delivery-initialization`, then uses the handoff package's normalized `selected_offer` value to copy the right workflow templates into the client workspace.

> [!IMPORTANT]
> **Integrity Rule**: Any change to Sales offer names, Deliver phase names, handoff fields, or routing rules must be reflected in this file and in `deliver/process/PROCESS_INDEX.md` immediately.

> [!IMPORTANT]
> **Pricing & duration**: All per-page rates and execution durations referenced below come from [PRICING_TIMELINE_RULES.md](../../sales/PRICING_TIMELINE_RULES.md). Do not declare different numbers in client workflows.

## 1. Routing Keys

The `selected_offer` field in the Sales handoff must match one of the canonical Sales offer files:

| `selected_offer` | Canonical offer file | Default delivery path | Per-page duration formula |
| :--- | :--- | :--- | :--- |
| `Development from Scratch` | `sales/process/01-define-offers/offers/offer-development-from-scratch.md` | `00`, then `01` -> `02` -> `03` -> `04` -> `05` -> `06` -> `07` -> `08` | `pages × 2 days` |
| `Figma to Webflow` | `sales/process/01-define-offers/offers/offer-figma-to-webflow.md` | `00`, then `09` -> optional `04` -> `05` -> `06` -> `07` -> `08` | `pages × 1 day` (dev only) |
| `Migration to Webflow` | `sales/process/01-define-offers/offers/offer-migration-to-webflow.md` | `00`, then `10` -> optional `01`/`02`/`03` -> `11` -> `12` -> `05` -> `06` -> `07` -> `08` | Rebuild: `pages × 1 day` (or `× 2` if redesigned). Migration-specific work scheduled separately. |
| `Webflow Improvements & Updates` | `sales/process/01-define-offers/offers/offer-webflow-improvements.md` | `00`, then `13` -> `05` -> `06` -> optional `07` -> adapted `08` | Per-page formula applies only to pages added/redesigned. Other changes ad-hoc/hourly. |

## 2. Shared Handoff Fields

Every Deliver handoff package must include:

- `selected_offer`
- `approved_scope`
- `timeline`
- `pages_or_templates`
- `content_status`
- `assets_status`
- `platform_access_needed`
- `launch_or_delivery_expectation`
- `open_questions`

Migration handoffs must also include:

- `source_platform`
- `existing_site_url`
- `content_volume`
- `redirect_required`
- `redesign_scope`

Improvement handoffs must also include:

- `request_type`
- `change_list`
- `priority`
- `existing_webflow_access`
- `engagement_model` (`one-time`, `hourly`, or `retainer`)

## 3. Offer-to-Delivery Matrix

| Deliver module | Development from Scratch | Figma to Webflow | Migration to Webflow | Webflow Improvements & Updates |
| :--- | :--- | :--- | :--- | :--- |
| `00-client-delivery-initialization` | Required | Required | Required | Required |
| `01-wireframe` | Required | Skipped unless IA gaps are found | Required only for redesigns or major IA changes | Skipped unless new page structure is scoped |
| `02-graphic-resources` | Required | Adapted to asset readiness check | Adapted to source asset inventory and migration needs | Optional for new sections, pages, or brand updates |
| `03-design` | Required | Skipped unless design changes are scoped | Required only for redesigns | Optional for scoped redesign work |
| `04-content-seo` | Required | Adapted to content/SEO validation | Required for metadata preservation, redirects, and migrated content | Optional for SEO/performance requests |
| `05-webflow-build` | Required | Required, starts with Figma review and build planning | Required, includes CMS architecture and imported content | Required, scoped to approved change list |
| `06-qa` | Required | Required | Required, includes content and redirect QA | Required, scoped to changed surfaces and regression risks |
| `07-launch` | Required | Required when production launch is in scope | Required, includes DNS/redirect launch and monitoring | Optional; use only when publishing or production release is in scope |
| `08-handoff-support` | Required | Required | Required, includes migration notes and monitoring outcomes | Adapted to delivery note, support summary, or retainer loop |
| `09-figma-review-build-planning` | Not used | Required | Not used | Not used |
| `10-migration-audit-plan` | Not used | Not used | Required | Not used |
| `11-content-export-import` | Not used | Not used | Required | Not used |
| `12-migration-seo-redirects` | Not used | Not used | Required | Not used |
| `13-improvement-intake-audit` | Not used | Not used | Not used | Required |

## 4. Offer Paths

### Development from Scratch

- **Start phase**: `01-wireframe`.
- **Initialization**: Always run `00-client-delivery-initialization` first to create the client folder and copy the routed workflow templates.
- **Required modules**: `01-wireframe`, `02-graphic-resources`, `03-design`, `04-content-seo`, `05-webflow-build`, `06-qa`, `07-launch`, `08-handoff-support`.
- **Route**: `01` -> `02` -> `03` -> `04` -> `05` -> `06` -> `07` -> `08`.
- **Completion criteria**: The live Webflow site is launched, QA-approved, handed off to the client, and support terms are documented.

### Figma to Webflow

- **Start phase**: `09-figma-review-build-planning`.
- **Initialization**: Always run `00-client-delivery-initialization` first to create the client folder and copy the routed workflow templates.
- **Route**: `09` -> optional `04` -> `05` -> `06` -> `07` -> `08`.
- **Skipped modules**: `01-wireframe` and `03-design`, unless the handoff explicitly includes IA or design changes.
- **Adapted modules**: `02-graphic-resources` becomes an asset readiness check; `04-content-seo` validates final copy, metadata, alt text, and CMS content readiness.
- **Required pre-build module**: `09-figma-review-build-planning` validates Figma completeness, breakpoint coverage, CMS requirements, component states, interactions, fonts, assets, and licensing notes.
- **Completion criteria**: The Webflow build matches approved Figma designs, passes QA, launches if scoped, and includes Editor walkthrough/handoff notes.

### Migration to Webflow

- **Start phase**: `10-migration-audit-plan`.
- **Initialization**: Always run `00-client-delivery-initialization` first to create the client folder and copy the routed workflow templates.
- **Route**: `10` -> optional `01`/`02`/`03` -> `11` -> `12` -> `05` -> `06` -> `07` -> `08`.
- **Required modules**: `10-migration-audit-plan`, `11-content-export-import`, `12-migration-seo-redirects`, `05-webflow-build`, `06-qa`, `07-launch`, and `08-handoff-support`.
- **Conditional modules**: `01-wireframe`, `02-graphic-resources`, and `03-design` are required only when the migration includes redesign, new IA, or new visual direction.
- **Migration audit requirements**: `10-migration-audit-plan` owns the existing-site crawl, page inventory, CMS/content inventory, plugin/app/functionality review, migration approach, and source asset inventory.
- **Content migration requirements**: `11-content-export-import` owns source export, cleanup, field mapping, media mapping, Webflow import, and import issue reporting.
- **SEO/redirect requirements**: `12-migration-seo-redirects` owns URL inventory, redirect map, metadata preservation, sitemap/Search Console tasks, and redirect validation requirements.
- **Completion criteria**: Webflow site is launched with migrated content, redirects verified, metadata preserved, critical URLs smoke-tested, and monitoring outcomes recorded.

### Webflow Improvements & Updates

- **Start phase**: `13-improvement-intake-audit`.
- **Initialization**: Always run `00-client-delivery-initialization` first to create the client folder and copy the routed workflow templates.
- **Route**: `13` -> `05` -> `06` -> optional `07` -> adapted `08`.
- **Required modules**: `13-improvement-intake-audit`, adapted `05-webflow-build`, and `06-qa`.
- **Conditional modules**: `01` through `04` apply only when the approved request includes IA, asset, design, content, SEO, or CMS planning work.
- **Launch handling**: Use `07-launch` only when DNS, publishing, or a production release is part of the request.
- **Handoff handling**: Use adapted `08-handoff-support` as a delivery note, support summary, or retainer loop update.
- **Completion criteria**: Approved change list is implemented, regression-tested, delivered or published according to scope, and documented for the client.

## 5. Routing Validation

Before copying workflow templates into `deliver/[client-name]/workflows/`, confirm:

1. The handoff includes a valid `selected_offer`.
2. The selected offer maps to a complete delivery path in this file.
3. Required handoff fields are present, including offer-specific fields.
4. `00-client-delivery-initialization` created `deliver/[client-name]/docs/` and `deliver/[client-name]/workflows/`, and each copied workflow preserves its `.tmp/` asset/artifact folder.
5. Skipped phases are intentionally skipped and noted in the client workflow or `project-overview.md`.
6. Any adapted phase explains how its standard steps changed for the offer.

## Version Control
- All changes to this routing document must follow the version control rules in [SYSTEM_RULES.md - Section 4](../../SYSTEM_RULES.md).
- **Branch naming**: `deliver/process-<change>` for routing changes.
- **Commit discipline**: Atomic commits with descriptive messages. One logical change per commit.

## Infrastructure
- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
