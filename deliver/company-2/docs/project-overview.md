# Project Overview — company-2

## Engagement Summary
- **Client**: company-2
- **Selected offer**: `Migration to Webflow` ([offer-migration-to-webflow.md](../../../sales/process/01-define-offers/offers/offer-migration-to-webflow.md))
- **Source platform**: `WordPress`
- **Sales handoff**: [deliver-handoff-company-2.md](../../../sales/process/04-contract-onboarding/.tmp/deliver-handoff-company-2.md)
- **Initialization**: Performed via `00-client-delivery-initialization` directive (manual scaffold).

## Approved Scope
_TBD — pull from Sales handoff once finalized. Confirm 1:1 rebuild vs. light refresh vs. redesign, page count, CMS collection mapping, functionality replacements, and out-of-scope exclusions._

## Timeline
_TBD — start date, audit completion, content import, build complete, QA, cutover/launch date, post-launch monitoring window._

## Migration Inputs (from handoff)
| Field | Value |
|-------|-------|
| `source_platform` | `WordPress` |
| `existing_site_url` | _TBD_ |
| `content_volume` | _TBD — small (<50) / medium (50–200) / large (200+); drives pricing tier_ |
| `redirect_required` | `true` (default) |
| `redesign_scope` | `none` (default) |

## Routed Workflow Modules
Per `deliver/process/OFFER_ROUTING.md` for `Migration to Webflow`:

| # | Module | Status | Notes |
|---|--------|--------|-------|
| 10 | `10-migration-audit-plan` | Copied | Crawl WordPress site; inventory pages, CMS, plugins, ACF; produce migration plan. Customized with WordPress-specific scope. |
| 11 | `11-content-export-import` | Copied | WordPress export → cleanup → field mapping → Webflow import → import issue report. |
| 12 | `12-migration-seo-redirects` | Copied | URL inventory, 301 redirect map, metadata preservation, sitemap, redirect validation. |
| 05 | `05-webflow-build` | Copied | CMS architecture, style system, pages, publish to staging. |
| 06 | `06-qa` | Copied | Visual fidelity, responsiveness, SEO, forms, functionality, accessibility, Lighthouse — plus content and redirect QA. |
| 07 | `07-launch` | Copied | DNS cutover, SSL, redirect activation, smoke test, old-site snapshot. |
| 08 | `08-handoff-support` | Copied | Walkthrough, handoff packet, migration notes, monitoring outcomes, 3-week support. |

## Conditional Phases (Not Copied by Default)
| # | Module | Copy In When |
|---|--------|--------------|
| 01 | `01-wireframe` | New IA or major page-structure changes are scoped. |
| 02 | `02-graphic-resources` | Brand refresh, new visual assets, or significant source-asset reprocessing scoped. |
| 03 | `03-design` | Visual redesign is scoped. |
| 04 | `04-content-seo` | Required for migrations per OFFER_ROUTING (metadata preservation, redirects, migrated content). _Recommend copying in once content audit completes — currently omitted pending scope confirmation._ |

> **Note**: `04-content-seo` is marked _Required_ for migrations in the routing matrix. Copy it in from `deliver/process/04-content-seo/` once confirmed during `10-migration-audit-plan`.

## WordPress-Specific Inventory Checklist (owned by phase 10)
- [ ] WordPress version
- [ ] Active theme (custom or off-the-shelf)
- [ ] Active plugins — flag WooCommerce, ACF, multilingual (WPML/Polylang), membership, forms, page builders
- [ ] Custom post types and counts
- [ ] ACF field groups and mappings
- [ ] Menu structure
- [ ] Media library size and file types
- [ ] Existing 301 redirects (Yoast/Rank Math/`.htaccess`)
- [ ] Search Console / Analytics ownership

## Setup Items
_TBD — WordPress admin access (Editor+), hosting/DNS access, Webflow workspace invite, Search Console transfer, Analytics access._

## Open Questions
_TBD — resolve before audit kicks off._

## Folder Layout
- `docs/` — project documentation (this file, plus `migration-plan.md`, `qa-report.md`, `walkthrough.md`, `handoff-packet.md`).
- `workflows/` - copied workflow modules listed above. Each preserves `.md`, `.py`, `TRIGGER_PROMPT.txt`, and `.tmp/`; client assets and source-site exports live in the owning workflow `.tmp/` folder.

## Version Control
- All changes to this document must follow the version control rules in [SYSTEM_RULES.md](../../../SYSTEM_RULES.md).
- **Branch naming:** `deliver/company-2-<change>`.
- **Commit discipline:** Atomic commits with descriptive messages. One logical change per commit.

## Infrastructure
- **Hosting:** Hostinger VPS
- **OS:** Ubuntu 24.04 LTS
