# Workflow: 11 - Content Export & Import

## Client-Facing Overview
We export existing WordPress or Shopify content, clean it, map it to Webflow CMS fields, import it, and record any content issues that need review.

> [!IMPORTANT]
> **Integrity Rule**: Any change to the Python executor or technical logic of this workflow must be documented here immediately.

## Operational Purpose
Move approved source content into Webflow without losing posts, pages, products, categories, tags, media references, metadata fields, or content relationships.

## Inputs From Sales / Previous Phase
- Approved migration plan from `10-migration-audit-plan`.
- Source-site access or export files.
- Target Webflow CMS architecture from the migration plan or `05-webflow-build`.
- Content volume, media requirements, and field mapping constraints.

## Execution Steps
1. Export source content from WordPress, Shopify, or provided source files.
2. Clean and normalize CSV data, rich text content, slugs, dates, authors, categories, tags, products, and media references.
3. Map source fields to Webflow CMS collections, reference fields, multi-reference fields, and template requirements.
4. Import content into Webflow staging and record import errors, manual cleanup items, and missing media.
5. Produce a content migration report before QA begins.

## Technical Setup
- **Executor status**: Placeholder.
- **Future automation**: Transform WordPress/Shopify exports, prepare Webflow import CSVs, map media URLs, and validate imported CMS items.
- **Likely integrations**: WordPress API, Shopify API, Webflow API, CSV tooling, OpenAI/Anthropic.

## Output Artifacts
- `deliver/process/11-content-export-import/.tmp/source-export/`
- `deliver/process/11-content-export-import/.tmp/webflow-import.csv`
- `deliver/process/11-content-export-import/.tmp/media-map.csv`
- `deliver/process/11-content-export-import/.tmp/import-issues.json`
- `deliver/[client-name]/docs/content-migration-report.md` (final, persisted)

## Version Control
- All changes to this workflow must follow the version control rules in [SYSTEM_RULES.md - Section 4](../../../../SYSTEM_RULES.md).
- **`.tmp` folder**: Commit lightweight artifacts that support review, replay, handoff, or agent continuity. Binary/media assets remain gitignored and synced to the VPS.
- **Branch naming**: `deliver/[client-name]-content-migration-<change>` once cloned into a client folder.
- **Commit discipline**: Atomic commits with descriptive messages. One logical change per commit.

## Infrastructure
- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
