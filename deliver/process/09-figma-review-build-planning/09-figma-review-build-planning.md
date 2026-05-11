# Workflow: 09 - Figma Review & Build Planning

## Client-Facing Overview
We review the approved Figma file before development so the Webflow build can start with clear pages, breakpoints, assets, interactions, CMS needs, and known gaps.

> [!IMPORTANT]
> **Integrity Rule**: Any change to the Python executor or technical logic of this workflow must be documented here immediately.

## Operational Purpose
Validate that a development-only Figma-to-Webflow engagement is ready for Webflow implementation without forcing Deliver through original wireframing or design creation.

## Inputs From Sales / Previous Phase
- Signed contract and approved scope.
- Sales handoff package with `selected_offer` set to `Figma to Webflow`.
- Figma view/edit link, final copy status, animation notes, CMS requirements, fonts, assets, and known constraints.

## Execution Steps
1. Review all scoped Figma pages, components, variants, and breakpoints.
2. Identify missing design items such as mobile layouts, hover states, form states, CMS templates, or interaction notes.
3. Confirm font licensing, exportable assets, image readiness, icon readiness, and third-party embeds.
4. Define the Webflow build plan, including page/template list, CMS collections, interaction approach, staging expectations, and build risks.

## Technical Setup
- **Executor status**: Placeholder.
- **Future automation**: Pull Figma file metadata, detect missing breakpoints, export asset lists, and generate a build-readiness report.
- **Likely integrations**: Figma API/MCP, Webflow API, ClickUp, OpenAI/Anthropic.

## Output Artifacts
- `deliver/process/09-figma-review-build-planning/.tmp/figma-review.json`
- `deliver/process/09-figma-review-build-planning/.tmp/missing-design-items.md`
- `deliver/process/09-figma-review-build-planning/.tmp/build-plan.md`

## Version Control
- All changes to this workflow must follow the version control rules in [SYSTEM_RULES.md - Section 4](../../../SYSTEM_RULES.md).
- **`.tmp` folder**: Commit lightweight artifacts that support review, replay, handoff, or agent continuity. Binary/media assets remain gitignored and synced to the VPS.
- **Branch naming**: `deliver/[client-name]-figma-review-<change>` once cloned into a client folder.
- **Commit discipline**: Atomic commits with descriptive messages. One logical change per commit.

## Infrastructure
- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
