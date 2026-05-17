# Deliver Offer Routing

This document is the canonical bridge between signed Sales offers and Deliver execution. Sales owns offer definition, proposal sending, discovery meeting, contract onboarding, and the handoff package. Deliver starts only after the contract is signed, runs `00-client-delivery-initialization`, then uses the handoff package's normalized `selected_offer` value to copy the right workflow templates into the client workspace.

> [!IMPORTANT]
> **Integrity Rule**: Any change to Sales offer names, Deliver phase names, handoff fields, or routing rules must be reflected in this file and in `deliver/process/PROCESS_INDEX.md` immediately.

> [!IMPORTANT]
> **Pricing & duration**: All per-page rates and execution durations referenced below come from [PRICING_TIMELINE_RULES.md](../../sales/PRICING_TIMELINE_RULES.md). Do not declare different numbers in client workflows.

## 1. Routing Keys

| `selected_offer` | Canonical offer file | Default delivery path | Per-page duration formula |
| :--- | :--- | :--- | :--- |
| `Development from Scratch` | `sales/process/01-define-offers/offers/offer-development-from-scratch.md` | `00`, then `01` -> `02` -> `03` -> `04` -> `05` -> `06` -> `07` -> `08` -> `09` -> `10` | `pages x 2 days` |
| `Figma to Webflow` | `sales/process/01-define-offers/offers/offer-figma-to-webflow.md` | `00`, then `11` -> optional `06` -> `07` -> `08` -> `09` -> `10` | `pages x 1 day` (dev only) |
| `Migration to Webflow` | `sales/process/01-define-offers/offers/offer-migration-to-webflow.md` | `00`, then `12` -> optional `01`/`02`/`03`/`04`/`05` -> `13` -> `14` -> `07` -> `08` -> `09` -> `10` | Rebuild: `pages x 1 day` (or `x 2` if redesigned). Migration-specific work scheduled separately. |
| `Webflow Improvements & Updates` | `sales/process/01-define-offers/offers/offer-webflow-improvements.md` | `00`, then `15` -> `07` -> `08` -> optional `09` -> adapted `10` | Per-page formula applies only to pages added/redesigned. Other changes ad-hoc/hourly. |

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
- `selected_design_system_reference` when Deliver owns design creation or redesign
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
| `01-content-intake` | Required | Optional when new content is needed | Optional for new/redesigned content | Optional for new copy-heavy work |
| `02-wireframe` | Required | Skipped unless IA gaps are found | Required only for redesigns or major IA changes | Skipped unless new page structure is scoped |
| `03-graphic-resources` | Required | Adapted to asset readiness check | Adapted to source asset inventory and migration needs | Optional for new sections, pages, or brand updates |
| `04-design` | Required | Skipped unless design changes are scoped | Required only for redesigns | Optional for scoped redesign work |
| `05-design-revisions` | Required | Optional when Deliver owns design revisions | Optional when redesign enters client review | Optional for scoped redesign review loops |
| `06-content-seo` | Required | Adapted to content/SEO validation | Optional for new copy or on-page SEO beyond migration modules | Optional for SEO/performance requests |
| `07-webflow-build` | Required | Required, starts after Figma review and build planning | Required, includes CMS architecture and imported content | Required, scoped to approved change list |
| `08-qa` | Required | Required | Required, includes content and redirect QA | Required, scoped to changed surfaces and regression risks |
| `09-launch` | Required | Required when production launch is in scope | Required, includes DNS/redirect launch and monitoring | Optional; use only when publishing or production release is in scope |
| `10-handoff-support` | Required | Required | Required, includes migration notes and monitoring outcomes | Adapted to delivery note, support summary, or retainer loop |
| `11-figma-review-build-planning` | Not used | Required | Not used | Not used |
| `12-migration-audit-plan` | Not used | Not used | Required | Not used |
| `13-content-export-import` | Not used | Not used | Required | Not used |
| `14-migration-seo-redirects` | Not used | Not used | Required | Not used |
| `15-improvement-intake-audit` | Not used | Not used | Not used | Required |
| `16-vercel-deployment` | Optional for extra static deployments beyond required design review URLs | Optional for CLI-managed previews | Optional for CLI-managed previews | Optional for CLI-managed review URLs or static delivery |

## 4. Offer Paths

### Development from Scratch
- **Start phase**: `01-content-intake`.
- **Initialization**: Always run `00-client-delivery-initialization` first.
- **Required modules**: `01-content-intake`, `02-wireframe`, `03-graphic-resources`, `04-design`, `05-design-revisions`, `06-content-seo`, `07-webflow-build`, `08-qa`, `09-launch`, `10-handoff-support`.
- **Route**: `01` -> `02` -> `03` -> `04` -> `05` -> `06` -> `07` -> `08` -> `09` -> `10`.
- **Design review requirement**: `04-design` must produce both a Figma output and a Vercel review URL; `05-design-revisions` owns correction intake and final design approval before build.
- **Completion criteria**: The live Webflow site is launched, QA-approved, handed off to the client, and support terms are documented.
- **Optional Vercel path**: Use `16-vercel-deployment` only when an additional static deployment is needed beyond the design-review URLs already handled inside `04` and `05`.

### Figma to Webflow
- **Start phase**: `11-figma-review-build-planning`.
- **Route**: `11` -> optional `06` -> `07` -> `08` -> `09` -> `10`.
- **Skipped modules**: `01` through `05`, unless the handoff explicitly includes new content, IA, asset, design, or revision work.
- **Required pre-build module**: `11-figma-review-build-planning` validates Figma completeness, breakpoint coverage, CMS requirements, component states, interactions, fonts, assets, and licensing notes.

### Migration to Webflow
- **Start phase**: `12-migration-audit-plan`.
- **Route**: `12` -> optional `01`/`02`/`03`/`04`/`05` -> `13` -> `14` -> `07` -> `08` -> `09` -> `10`.
- **Required modules**: `12-migration-audit-plan`, `13-content-export-import`, `14-migration-seo-redirects`, `07-webflow-build`, `08-qa`, `09-launch`, and `10-handoff-support`.
- **Conditional modules**: `01` through `05` are required only when the migration includes new content, redesign, new IA, or a client revision loop.

### Webflow Improvements & Updates
- **Start phase**: `15-improvement-intake-audit`.
- **Route**: `15` -> `07` -> `08` -> optional `09` -> adapted `10`.
- **Required modules**: `15-improvement-intake-audit`, adapted `07-webflow-build`, and `08-qa`.
- **Conditional modules**: `01` through `06` apply only when the approved request includes intake, IA, asset, design, revision, content, SEO, or CMS planning work.

## 5. Routing Validation
Before copying workflow templates into `deliver/[client-name]/workflows/`, confirm:
1. The handoff includes a valid `selected_offer`.
2. The selected offer maps to a complete delivery path in this file.
3. Required handoff fields are present, including offer-specific fields.
4. `00-client-delivery-initialization` created `deliver/[client-name]/docs/`, `deliver/[client-name]/workflows/`, `deliver/[client-name]/workflows/00-client-delivery-initialization/.tmp/client-handoff/`, and when design work is scoped, `deliver/[client-name]/workflows/00-client-delivery-initialization/.tmp/design-system/`; each copied workflow preserves its `.tmp/` asset/artifact folder.
5. Skipped phases are intentionally skipped and noted in the client workflow or `project-overview.md`.
6. Any adapted phase explains how its standard steps changed for the offer.

## Version Control
- All changes to this routing document must follow the version control rules in [SYSTEM_RULES.md - Section 4](../../SYSTEM_RULES.md).
- **Branch naming**: `deliver/process-<change>` for routing changes.
- **Commit discipline**: Atomic commits with descriptive messages. One logical change per commit.

## Infrastructure
- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
