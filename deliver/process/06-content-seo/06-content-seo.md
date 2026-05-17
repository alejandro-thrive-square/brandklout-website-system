# Workflow: 06 - Content & SEO

## Client-Facing Overview
We refine the website copy, page titles, descriptions, image text, and search structure so the site is clear to visitors and ready for search engines.

> [!IMPORTANT]
> **Integrity Rule**: Any change to the Python executor or technical logic of this workflow must be documented here immediately.

## Operational Purpose
Refine the questionnaire-sourced content into approved on-page copy, metadata, schema plans, keyword mapping, and alt text before content reaches Webflow. Migration-specific content export/import and redirect planning remain in the dedicated migration modules.

## Inputs From Sales / Previous Phase
- Content-intake summary from `01-content-intake`.
- Approved final design package from `05-design-revisions`.
- Sales handoff package, audience notes, and keyword or positioning notes.
- Existing client copy, voice references, and approved page goals.

## Execution Steps
1. Map each page to a primary keyword, secondary terms, audience intent, and CTA goal.
2. Refine questionnaire-sourced copy using the approved structure and brand voice.
3. Write metadata, schema recommendations, and alt text.
4. Route copy for approval and freeze final content for the Webflow build.

## Offer-Specific Adaptations
- **Development from Scratch**: Refine the full questionnaire-derived content package before Webflow build.
- **Figma to Webflow**: Validate that final copy, metadata, alt text, CMS content, and SEO requirements are present before build; do not rewrite design-approved copy unless scoped.
- **Migration to Webflow**: Use this module only for new copy or on-page SEO work beyond the dedicated migration modules.
- **Webflow Improvements & Updates**: Use only when the approved change list includes SEO, content, metadata, accessibility text, CMS content, or performance-related content cleanup.

## Technical Setup
- **Executor status**: Placeholder.
- **Future automation**: Generate keyword maps, draft page copy, validate heading hierarchy, create JSON-LD, and detect missing alt text.
- **Likely integrations**: OpenAI/Anthropic, Ahrefs/Semrush, schema validators, Webflow CMS export/import.

## Output Artifacts
- `deliver/[client-name]/workflows/06-content-seo/.tmp/keyword-map.json`
- `deliver/[client-name]/workflows/06-content-seo/.tmp/copy/`
- `deliver/[client-name]/workflows/06-content-seo/.tmp/metadata.json`
- `deliver/[client-name]/workflows/06-content-seo/.tmp/schema/`
- `deliver/[client-name]/workflows/06-content-seo/.tmp/alt-text.json`
- `deliver/[client-name]/docs/copy-final.md` (final, persisted)

## Version Control
- All changes to this workflow must follow the version control rules in [SYSTEM_RULES.md - Section 4](../../../SYSTEM_RULES.md).
- **`.tmp/` folder**: Commit lightweight artifacts that support review, replay, handoff, or agent continuity. Binary/media assets remain gitignored and synced to the VPS.
- **Branch naming**: `deliver/[client-name]-content-seo-<change>` once cloned into a client folder.
- **Commit discipline**: Atomic commits with descriptive messages. One logical change per commit.

## Infrastructure
- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
