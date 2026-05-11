# Workflow: 05 - Webflow Build

## Client-Facing Overview
We build the approved design in Webflow with clean structure, responsive behavior, CMS setup, custom code, and the integrations needed for the website to work properly.

> [!IMPORTANT]
> **Integrity Rule**: Any change to the Python executor or technical logic of this workflow must be documented here immediately.

## Operational Purpose
Reproduce approved Figma designs in Webflow with CMS-first structure, token consistency, responsive coverage, and staging readiness.
For migration and improvement work, this module adapts from full-page production into scoped implementation using the dedicated planning modules that precede it.

## Inputs From Sales / Previous Phase
- Approved design files, screenshots, tokens, component specs, and final content.
- Required Webflow workspace access, integrations, CMS requirements, and tracking scripts.
- Approved scope and constraints from the Sales handoff.
- For Figma-to-Webflow: build plan from `09-figma-review-build-planning`.
- For migrations: migration plan from `10-migration-audit-plan`, content migration report from `11-content-export-import`, and SEO/redirect plan from `12-migration-seo-redirects`.
- For improvements: scoped implementation plan from `13-improvement-intake-audit`.

## Execution Steps
1. Create or open the Webflow project and scaffold CMS Collections.
2. Build the global style system before page components.
3. Build each page/template from the approved design and content.
4. Publish to staging and prepare a build manifest for QA.

## Offer-Specific Adaptations
- **Development from Scratch**: Build the approved full-site Figma design and CMS model after phases `01` through `04` are approved.
- **Figma to Webflow**: Build from the approved `09` build plan; do not use this module to resolve missing Figma readiness issues that should have been caught in `09`.
- **Migration to Webflow**: Build or rebuild the Webflow CMS architecture and pages using the outputs of `10`, `11`, and `12`.
- **Webflow Improvements & Updates**: Implement only the approved change list from `13`. Respect existing site structure unless cleanup is explicitly scoped.

## Technical Setup
- **Executor status**: Placeholder.
- **Future automation**: Sync design tokens, create CMS schemas, import CMS content, run staging publishes, and generate visual diff screenshots.
- **Likely integrations**: Webflow API, Figma API/MCP, Lighthouse, analytics and marketing scripts.

## Output Artifacts
- `deliver/process/05-webflow-build/.tmp/build-manifest.json`
- `deliver/process/05-webflow-build/.tmp/visual-diff/`
- `deliver/process/05-webflow-build/.tmp/cms-import.json`
- `deliver/process/05-webflow-build/.tmp/change-manifest.json` (improvements only)

## Version Control
- All changes to this workflow must follow the version control rules in [SYSTEM_RULES.md - Section 4](../../../../SYSTEM_RULES.md).
- **`.tmp/` folder**: Commit lightweight artifacts that support review, replay, handoff, or agent continuity. Binary/media assets remain gitignored and synced to the VPS.
- **Branch naming**: `deliver/[client-name]-webflow-build-<change>` once cloned into a client folder.
- **Commit discipline**: Atomic commits with descriptive messages. One logical change per commit.

## Infrastructure
- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
