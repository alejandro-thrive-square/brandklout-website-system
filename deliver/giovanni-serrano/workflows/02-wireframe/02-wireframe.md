# Workflow: 02 - Wireframe (Giovanni Serrano)

## Client-Facing Overview
We validate the client-provided page structures so everyone agrees on the website flow before visual design begins.

> [!IMPORTANT]
> **Integrity Rule**: Any change to the Python executor or technical logic of this workflow must be documented here immediately.

## Operational Purpose
Validate Giovanni's client-provided HTML wireframes against the approved scope and Webflow developer brief instead of creating new wireframes from scratch.

## Inputs From Sales / Previous Phase
- Client-provided HTML wireframes from `00-client-delivery-initialization/.tmp/client-handoff/`
- `WEBFLOW_DEVELOPER_BRIEF.md`
- Approved 4-page scope from `docs/project-overview.md`

## Execution Steps
1. Confirm the approved page list and shared Service template structure.
2. Review the supplied HTML wireframes for Home, Invest, Scale, and Develop.
3. Validate sitemap, shared components, CMS-bound regions, and conversion paths.
4. Record any IA gaps or structural questions.
5. Store the approved validation artifacts before design begins.

## Offer-Specific Adaptations
- **Development from Scratch**: Adapted because approved HTML wireframes already exist.
- **Figma to Webflow**: Not applicable.
- **Migration to Webflow**: Not applicable.
- **Webflow Improvements & Updates**: Not applicable.

## Project-Specific Notes
- This workflow is an IA validation pass only; no new wireframe package is required unless the approved scope changes.
- Current sitemap: Home -> Invest -> Scale -> Develop.

## Output Artifacts
- `deliver/giovanni-serrano/workflows/02-wireframe/.tmp/sitemap.json`
- `deliver/giovanni-serrano/workflows/02-wireframe/.tmp/ia-validation-report.md`
- `deliver/giovanni-serrano/docs/ia-approval.md` (final, persisted)

## Version Control
- All changes to this workflow must follow the version control rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md).
- **`.tmp/` folder**: Commit lightweight artifacts that support review, replay, handoff, or agent continuity. Binary/media assets remain gitignored and synced to the VPS.
- **Branch naming:** `deliver/giovanni-serrano-wireframe-<change>`

## Infrastructure
- **Hosting:** Hostinger VPS
- **OS:** Ubuntu 24.04 LTS
