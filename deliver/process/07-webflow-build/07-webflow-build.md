# Workflow: 07 - Webflow Build

## Client-Facing Overview
We build the approved design in Webflow with clean structure, responsive behavior, CMS setup, custom code, and the integrations needed for the website to work properly.

> [!IMPORTANT]
> **Integrity Rule**: Any change to the Python executor or technical logic of this workflow must be documented here immediately.

## Operational Purpose
Reproduce the approved final design source in Webflow with CMS-first structure, token consistency, responsive coverage, and staging readiness. Valid approved sources include revised Claude Design HTML/CSS/JS packages and Figma designs.

## Inputs From Sales / Previous Phase
- Approved final design package from `05-design-revisions`.
- Final copy, metadata, alt text, and SEO decisions from `06-content-seo`.
- Required Webflow workspace access, integrations, CMS requirements, and tracking scripts.
- Approved scope and constraints from the Sales handoff.
- For Figma-to-Webflow: build plan from `11-figma-review-build-planning`.
- For migrations: migration plan from `12-migration-audit-plan`, content migration report from `13-content-export-import`, and SEO/redirect plan from `14-migration-seo-redirects`.
- For improvements: scoped implementation plan from `15-improvement-intake-audit`.

## Execution Steps
1. Create or open the Webflow project and scaffold CMS Collections.
2. Build the global style system before page components.
3. Build each page/template from the approved design and content.
4. Publish to staging and prepare a build manifest for QA.

## Offer-Specific Adaptations
- **Development from Scratch**: Build the approved full-site design source and CMS model after `01` through `06` are approved.
- **Figma to Webflow**: Build from the approved `11` build plan.
- **Migration to Webflow**: Build or rebuild the Webflow CMS architecture and pages using the outputs of `12`, `13`, and `14`.
- **Webflow Improvements & Updates**: Implement only the approved change list from `15`.

## Technical Setup
- **Executor status**: Placeholder.
- **Current operating model**: Manual developer build is the primary production path.
- **Experimental path**: Webflow MCP-assisted build remains under evaluation until it is reliable enough to become standard.
- **Future automation**: Sync design tokens, create CMS schemas, import CMS content, run staging publishes, and generate visual diff screenshots.
- **Likely integrations**: Webflow API/MCP, Figma API/MCP, Lighthouse, analytics and marketing scripts.

## Output Artifacts
- `deliver/[client-name]/workflows/07-webflow-build/.tmp/build-manifest.json`
- `deliver/[client-name]/workflows/07-webflow-build/.tmp/visual-diff/`
- `deliver/[client-name]/workflows/07-webflow-build/.tmp/cms-import.json`
- `deliver/[client-name]/workflows/07-webflow-build/.tmp/change-manifest.json` (improvements only)

## Version Control
- All changes to this workflow must follow the version control rules in [SYSTEM_RULES.md - Section 4](../../../SYSTEM_RULES.md).
- **`.tmp/` folder**: Commit lightweight artifacts that support review, replay, handoff, or agent continuity. Binary/media assets remain gitignored and synced to the VPS.
- **Branch naming**: `deliver/[client-name]-webflow-build-<change>` once cloned into a client folder.
- **Commit discipline**: Atomic commits with descriptive messages. One logical change per commit.

## Infrastructure
- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
