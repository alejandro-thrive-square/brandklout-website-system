# Workflow: 05 - Design Revisions (Giovanni Serrano)

## Client-Facing Overview
After the first design draft is reviewed, we apply the approved correction list, update the design files, and prepare the final design package for development.

> [!IMPORTANT]
> **Integrity Rule**: Any change to the Python executor or technical logic of this workflow must be documented here immediately.

## Operational Purpose
Own Giovanni's post-design correction loop before Webflow development begins.

## Inputs From Sales / Previous Phase
- First-draft design package from `04-design`
- Client correction documents and approved revision notes

## Execution Steps
1. Receive and normalize the approved client correction set.
2. Store the authoritative correction notes in `.tmp/final-changes/`.
3. Duplicate `04-design/.tmp/final-design/` into `05-design-revisions/.tmp/final-design/`.
4. Apply approved revisions to the copied package.
5. Republish the revised design for review when needed.
6. Record the final approved package for Webflow Build.

## Offer-Specific Adaptations
- **Development from Scratch**: Required after Design and before Content & SEO/Webflow Build.
- **Figma to Webflow**: Not applicable.
- **Migration to Webflow**: Not applicable.
- **Webflow Improvements & Updates**: Not applicable.

## Project-Specific Notes
- `05-design-revisions/.tmp/final-changes/` is the sole authoritative location for Giovanni's final correction notes.

## Output Artifacts
- `deliver/giovanni-serrano/workflows/05-design-revisions/.tmp/final-changes/`
- `deliver/giovanni-serrano/workflows/05-design-revisions/.tmp/revision-manifest.json`
- `deliver/giovanni-serrano/workflows/05-design-revisions/.tmp/final-design/`
- `deliver/giovanni-serrano/workflows/05-design-revisions/.tmp/vercel-preview-url.txt`
- `deliver/giovanni-serrano/docs/final-design-approval.md` (final, persisted)

## Version Control
- All changes to this workflow must follow the version control rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md).
- **`.tmp/` folder**: Commit lightweight artifacts that support review, replay, handoff, or agent continuity. Binary/media assets remain gitignored and synced to the VPS.
- **Branch naming:** `deliver/giovanni-serrano-design-revisions-<change>`

## Infrastructure
- **Hosting:** Hostinger VPS
- **OS:** Ubuntu 24.04 LTS
