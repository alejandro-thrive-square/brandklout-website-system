# Workflow: 03 - Graphic Resources (Giovanni Serrano)

## Client-Facing Overview
We prepare the visual resources the website needs so the design phase can move from an organized asset set instead of scattered source material.

> [!IMPORTANT]
> **Integrity Rule**: Any change to the Python executor or technical logic of this workflow must be documented here immediately.

## Operational Purpose
Prepare the brand and visual assets required by the approved Giovanni wireframes and initialized design-system package before high-fidelity design begins.

## Inputs From Sales / Previous Phase
- Approved wireframe validation outputs from `02-wireframe`
- Initial handoff files from `00-client-delivery-initialization/.tmp/client-handoff/`
- Selected design-system package from `00-client-delivery-initialization/.tmp/design-system/`

## Execution Steps
1. Audit each approved page/template for required visual assets.
2. Extract and document the approved color, typography, and imagery direction from the handoff materials.
3. Collect, extract, or request missing assets.
4. Prepare reusable assets for Design with names, usage notes, and source notes where relevant.

## Offer-Specific Adaptations
- **Development from Scratch**: Required before high-fidelity design.
- **Figma to Webflow**: Not applicable.
- **Migration to Webflow**: Not applicable.
- **Webflow Improvements & Updates**: Not applicable.

## Project-Specific Notes
- Current source material includes the Giovanni brand guidelines, HTML wireframes, and initialized design-system package.
- Any extracted client media belongs in this workflow's `.tmp/extracted-assets/` path.

## Output Artifacts
- `deliver/giovanni-serrano/workflows/03-graphic-resources/.tmp/asset-inventory.json`
- `deliver/giovanni-serrano/workflows/03-graphic-resources/.tmp/asset-direction.md`
- `deliver/giovanni-serrano/workflows/03-graphic-resources/.tmp/missing-assets.md`
- `deliver/giovanni-serrano/workflows/03-graphic-resources/.tmp/extracted-assets/`

## Version Control
- All changes to this workflow must follow the version control rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md).
- **`.tmp/` folder**: Commit lightweight artifacts that support review, replay, handoff, or agent continuity. Binary/media assets remain gitignored and synced to the VPS.
- **Branch naming:** `deliver/giovanni-serrano-graphic-resources-<change>`

## Infrastructure
- **Hosting:** Hostinger VPS
- **OS:** Ubuntu 24.04 LTS
