# Workflow: 12 - Migration SEO & Redirects

## Client-Facing Overview
We preserve search visibility during migration by mapping old URLs to Webflow URLs, preserving metadata, preparing redirects, and defining post-launch checks.

> [!IMPORTANT]
> **Integrity Rule**: Any change to the Python executor or technical logic of this workflow must be documented here immediately.

## Operational Purpose
Protect migration SEO equity through URL inventory, redirect mapping, metadata preservation, sitemap/Search Console readiness, and redirect validation requirements.

## Inputs From Sales / Previous Phase
- Migration plan from `10-migration-audit-plan`.
- Content migration report from `11-content-export-import` when content has been exported or imported.
- Source URL inventory, target Webflow URL structure, metadata requirements, and redirect requirements.

## Execution Steps
1. Build the source URL inventory from crawl results, CMS exports, sitemap data, and known high-value URLs.
2. Map each changing URL to its target Webflow URL and mark unchanged URLs that need verification only.
3. Preserve or update meta titles, descriptions, Open Graph data, canonical notes, and schema recommendations.
4. Prepare sitemap and Google Search Console launch tasks.
5. Define redirect validation checks for QA, launch, and post-launch monitoring.

## Technical Setup
- **Executor status**: Placeholder.
- **Future automation**: Crawl URLs, compare source/target slugs, generate redirect CSVs, validate metadata, and run post-launch redirect checks.
- **Likely integrations**: Webflow API, crawling tools, Google Search Console, schema validators, OpenAI/Anthropic.

## Output Artifacts
- `deliver/process/12-migration-seo-redirects/.tmp/url-inventory.csv`
- `deliver/process/12-migration-seo-redirects/.tmp/redirect-map.csv`
- `deliver/process/12-migration-seo-redirects/.tmp/metadata-preservation.csv`
- `deliver/process/12-migration-seo-redirects/.tmp/redirect-validation.json`
- `deliver/[client-name]/docs/seo-redirect-plan.md` (final, persisted)

## Version Control
- All changes to this workflow must follow the version control rules in [SYSTEM_RULES.md - Section 4](../../../../SYSTEM_RULES.md).
- **`.tmp` folder**: Commit lightweight artifacts that support review, replay, handoff, or agent continuity. Binary/media assets remain gitignored and synced to the VPS.
- **Branch naming**: `deliver/[client-name]-migration-seo-<change>` once cloned into a client folder.
- **Commit discipline**: Atomic commits with descriptive messages. One logical change per commit.

## Infrastructure
- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
