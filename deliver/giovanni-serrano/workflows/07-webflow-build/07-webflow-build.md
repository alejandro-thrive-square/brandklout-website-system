# Workflow: 07 - Webflow Build (Giovanni Serrano)

## Client-Facing Overview
We build the approved design in Webflow with clean structure, responsive behavior, CMS setup, and the integrations needed for the website to work properly.

> [!IMPORTANT]
> **Integrity Rule**: Any change to the Python executor or technical logic of this workflow must be documented here immediately.

## Operational Purpose
Reproduce Giovanni's approved revised design package in Webflow with CMS-first structure, token consistency, and responsive coverage.

## Inputs From Sales / Previous Phase
- Approved final design package from `05-design-revisions`
- Final copy, metadata, alt text, and SEO decisions from `06-content-seo`
- Webflow developer brief and approved project scope

## Execution Steps
1. Create or open the Webflow project and scaffold required CMS Collections.
2. Build the global style system before page components.
3. Build Home plus the shared Service template for Invest, Scale, and Develop.
4. Wire page-specific forms and interactions.
5. Publish to staging and prepare the build manifest for QA.

## Offer-Specific Adaptations
- **Development from Scratch**: Required after approved `05` and `06` outputs.
- **Figma to Webflow**: Not applicable.
- **Migration to Webflow**: Not applicable.
- **Webflow Improvements & Updates**: Not applicable.

## Project-Specific Notes
- Keep the approved 4-page scope only.
- Preserve the restrained visual and motion direction defined in the approved design package.

## Output Artifacts
- `deliver/giovanni-serrano/workflows/07-webflow-build/.tmp/build-manifest.json`
- `deliver/giovanni-serrano/workflows/07-webflow-build/.tmp/visual-diff/`
- `deliver/giovanni-serrano/workflows/07-webflow-build/.tmp/cms-import.json`

## Version Control
- All changes to this workflow must follow the version control rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md).
- **`.tmp/` folder**: Commit lightweight artifacts that support review, replay, handoff, or agent continuity. Binary/media assets remain gitignored and synced to the VPS.
- **Branch naming:** `deliver/giovanni-serrano-webflow-build-<change>`

## Infrastructure
- **Hosting:** Hostinger VPS
- **OS:** Ubuntu 24.04 LTS
