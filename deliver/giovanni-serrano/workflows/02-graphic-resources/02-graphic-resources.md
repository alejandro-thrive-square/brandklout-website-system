# Workflow: 02 - Graphic Resources (Giovanni Serrano)

## Client-Facing Overview
We extract and organize the visual assets from the brand guidelines and client-provided materials so the design phase has everything it needs.

## Operational Purpose
Process the brand guidelines v4.0, extract the design system (colors, typography, logo), and prepare all graphic assets for the design phase.

## Inputs
- deliver/giovanni-serrano/workflows/01-wireframe/.tmp/client-handoff/giovanni_brand_guidelines_v4.pdf
- deliver/giovanni-serrano/workflows/01-wireframe/.tmp/client-handoff/*.html (wireframes with embedded assets)
- deliver/giovanni-serrano/workflows/03-design/.tmp/ (cloud design outputs)

## Execution Steps
1. Extract color system from brand guidelines:
   - Canvas (#F4F1DE warm cream)
   - Bone (slightly darker cream)
   - Dark navy (#3D405B)
   - Terracotta accent
   - Gold accent (for dark sections)
2. Extract typography: Lora Bold (headings) + Inter (body) — currently base64-embedded in HTML, replace with Google Fonts references.
3. Extract Gio's photo from base64 embed in the About section of index.html. Save as standalone asset.
4. Inventory all visual elements in the HTML wireframes: icons, decorative lines, card accents, section dividers.
5. Document asset licensing notes and source files.
6. Prepare asset inventory for the Design phase.

## Output Artifacts
- deliver/giovanni-serrano/workflows/02-graphic-resources/.tmp/asset-inventory.json
- deliver/giovanni-serrano/workflows/02-graphic-resources/.tmp/asset-direction.md
- deliver/giovanni-serrano/workflows/02-graphic-resources/.tmp/missing-assets.md
- deliver/giovanni-serrano/workflows/02-graphic-resources/.tmp/extracted-assets/ (workflow-owned extracted assets - Gio photo, logo, etc.)

## Version Control
- All changes to this workflow must follow the version control rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md).
- **.tmp/ folder**: Commit lightweight artifacts that support review, replay, handoff, or agent continuity. Binary/media assets remain gitignored and synced to the VPS.
- **Branch naming:** deliver/giovanni-serrano-graphic-resources-<change>

## Infrastructure
- **Hosting:** Hostinger VPS
- **OS:** Ubuntu 24.04 LTS
