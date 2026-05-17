# Workflow: 06 - Content & SEO (Giovanni Serrano)

## Client-Facing Overview
We refine page titles, descriptions, image text, and search structure so the site is clear to visitors and ready for search engines.

> [!IMPORTANT]
> **Integrity Rule**: Any change to the Python executor or technical logic of this workflow must be documented here immediately.

## Operational Purpose
Prepare Giovanni's approved content package, metadata, schema plan, keyword mapping, and alt text before content reaches Webflow.

## Inputs From Sales / Previous Phase
- Approved revised design package from `05-design-revisions`
- Client-provided wireframe copy and developer brief from `00-client-delivery-initialization`
- Approved scope and project context from `docs/project-overview.md`

## Execution Steps
1. Map each approved page to keyword intent and CTA goals.
2. Preserve approved page copy unless a separately approved revision changes it.
3. Write metadata, schema recommendations, and alt text.
4. Freeze the final content and SEO package for the Webflow build.

## Offer-Specific Adaptations
- **Development from Scratch**: Required before Webflow Build.
- **Figma to Webflow**: Not applicable.
- **Migration to Webflow**: Not applicable.
- **Webflow Improvements & Updates**: Not applicable.

## Project-Specific Notes
- Approved pages: Home, Invest, Scale, Develop.
- Geographic focus remains San Diego.

## Output Artifacts
- `deliver/giovanni-serrano/workflows/06-content-seo/.tmp/keyword-map.json`
- `deliver/giovanni-serrano/workflows/06-content-seo/.tmp/copy/`
- `deliver/giovanni-serrano/workflows/06-content-seo/.tmp/metadata.json`
- `deliver/giovanni-serrano/workflows/06-content-seo/.tmp/schema/`
- `deliver/giovanni-serrano/workflows/06-content-seo/.tmp/alt-text.json`
- `deliver/giovanni-serrano/docs/copy-final.md` (final, persisted)

## Version Control
- All changes to this workflow must follow the version control rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md).
- **`.tmp/` folder**: Commit lightweight artifacts that support review, replay, handoff, or agent continuity. Binary/media assets remain gitignored and synced to the VPS.
- **Branch naming:** `deliver/giovanni-serrano-content-seo-<change>`

## Infrastructure
- **Hosting:** Hostinger VPS
- **OS:** Ubuntu 24.04 LTS
