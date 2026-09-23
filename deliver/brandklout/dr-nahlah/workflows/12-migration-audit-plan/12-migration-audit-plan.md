# Workflow: 12 - Migration Audit & Plan

## Client-Facing Overview
We audit the current WordPress or Shopify site before rebuilding it in Webflow so pages, content, functionality, URLs, assets, and migration risks are known before execution begins.

> [!IMPORTANT]
> **Integrity Rule**: Any change to the Python executor or technical logic of this workflow must be documented here immediately.

## Operational Purpose
Turn the signed migration scope into a concrete migration plan that separates 1:1 rebuild work, redesign work, content migration, functionality replacement, and SEO preservation.

## Inputs From Sales / Previous Phase
- Signed contract and approved scope.
- Sales handoff package with `selected_offer` set to `Migration to Webflow`.
- `source_platform`, `existing_site_url`, `content_volume`, `redirect_required`, `redesign_scope`, known integrations, and available source-site access or exports.

## Execution Steps
1. Crawl and review the existing site for public pages, templates, navigation, forms, integrations, and custom functionality.
2. Inventory CMS/content types, item counts, media assets, taxonomies, authors, products, collections, and structured data.
3. Identify functionality to replicate, replace, simplify, or exclude in Webflow.
4. Decide the migration approach: 1:1 rebuild, redesign path through `01`-`03`, or hybrid.
5. Produce the migration plan and confirm any scope risks before content export/import or Webflow build begins.

## Technical Setup
- **Executor status**: Placeholder.
- **Future automation**: Crawl source sites, count CMS entities, extract plugin/app lists, inspect metadata, and generate migration plan drafts.
- **Likely integrations**: WordPress API, Shopify API, crawling tools, Webflow API, OpenAI/Anthropic.

## Output Artifacts
- `deliver/process/12-migration-audit-plan/.tmp/site-audit.json`
- `deliver/process/12-migration-audit-plan/.tmp/page-inventory.csv`
- `deliver/process/12-migration-audit-plan/.tmp/cms-inventory.json`
- `deliver/process/12-migration-audit-plan/.tmp/functionality-map.md`
- `deliver/[client-name]/docs/migration-plan.md` (final, persisted)

## Version Control
- All changes to this workflow must follow the version control rules in [SYSTEM_RULES.md - Section 4](../../../../../SYSTEM_RULES.md).
- **`.tmp` folder**: Commit lightweight artifacts that support review, replay, handoff, or agent continuity. Binary/media assets remain gitignored and synced to the VPS.
- **Branch naming**: `deliver/[client-name]-migration-audit-<change>` once cloned into a client folder.
- **Commit discipline**: Atomic commits with descriptive messages. One logical change per commit.

## Infrastructure
- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
