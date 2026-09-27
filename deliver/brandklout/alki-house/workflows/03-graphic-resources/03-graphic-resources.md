# Workflow: 03 - Graphic Resources

## Client-Facing Overview
We prepare the visual resources the website will need, such as illustrations, icons, imagery, 3D assets, and supporting graphics. These resources are planned from the wireframes so the final design feels intentional instead of patched together.

> [!IMPORTANT]
> **Integrity Rule**: Any change to the Python executor or technical logic of this workflow must be documented here immediately.

## Operational Purpose
Create or collect the visual assets required by the approved wireframes and brand direction before high-fidelity design begins. For Figma-to-Webflow, migration, and improvement work, this module may be reduced to an asset readiness or source asset inventory check.

## Inputs From Sales / Previous Phase
- Approved final wireframes from `02-wireframe`.
- Initial brand assets, references, image library, logo files, and guidelines from `deliver/[client-name]/workflows/00-client-delivery-initialization/.tmp/client-handoff/`.
- Asset needs identified in each wireframe section.

## Execution Steps
1. Audit each wireframe for required visuals and reusable asset types.
2. Define art direction for illustrations, icons, photography, 3D, motion, or screenshots.
3. Collect, create, or request missing assets.
4. Prepare assets for Design with clear names, usage notes, and source/licensing notes when relevant.

## Alki House adaptation (2026-09-13)

Three reproducible pipelines replaced manual collection; all live in this module's `.tmp/`:

1. **Product photography** — `harvest-product-images.mjs`: per-product web image search (DuckDuckGo
   `i.js` with dimensions, Bing `/images/async` as fallback with its own dimensions), host/size/
   white-corner scoring, Pillow verification, perceptual-hash de-duplication, up to five angles,
   `manifest.json` with source and page URL per file. Doubtful matches are listed in the runbook.
2. **Scenes** — `generate-scenes.mjs`: Freepik API behind the `MAGNIFIC` key — Mystic 2k renders
   in the brand palette, Kling 2.5 image-to-video loops, licensed stock via `/v1/resources`.
   Prompts carry "unbranded, no markings, no text"; every render is eyeballed and rejects are kept.
3. **Preparation** — `04-design/.tmp/site-src/prepare-assets.py`: scenes to WebP; product shots
   flood-filled off white grounds (plus a bounded region-grow for drop shadows) into transparent
   WebP cut-outs, indexed with a `cutout` flag the templates use.

Outputs: `asset-direction.md`, `asset-inventory.json`, `scenes/scenes-manifest.json`,
`product-images/manifest.json`.

## Offer-Specific Adaptations
- **Development from Scratch**: Required before high-fidelity design.
- **Figma to Webflow**: Validate that Figma assets, images, icons, fonts, and licensing notes are available for build; request only missing assets.
- **Migration to Webflow**: Inventory source-site media, reusable brand assets, documents, and CMS images that must be migrated or replaced.
- **Webflow Improvements & Updates**: Use only when the approved request includes new visual assets, brand updates, media cleanup, or new page/section graphics.
- **AI Site with Claude, Vercel & Airtable**: Use when the approved Claude wireframes require new imagery, icons, illustration, motion assets, or prepared media before design refinement.

## Technical Setup
- **Executor status**: Placeholder.
- **Future automation**: Generate asset inventories, resize/compress assets, check missing alt-text candidates, and keep workflow-owned assets in `.tmp/` for VPS sync.
- **Likely integrations**: Figma, image-generation tools, asset optimization tools, `manage/brand-assets/`.

## Output Artifacts
- `deliver/[client-name]/workflows/03-graphic-resources/.tmp/asset-inventory.json`
- `deliver/[client-name]/workflows/03-graphic-resources/.tmp/asset-direction.md`
- `deliver/[client-name]/workflows/03-graphic-resources/.tmp/missing-assets.md`
- `deliver/[client-name]/workflows/03-graphic-resources/.tmp/source-asset-inventory.json` (migration only)
- `deliver/[client-name]/workflows/03-graphic-resources/.tmp/extracted-assets/` (workflow-owned client assets; lightweight files committed, heavy media synced to VPS)

## Version Control
- All changes to this workflow must follow the version control rules in [SYSTEM_RULES.md - Section 4](../../../SYSTEM_RULES.md).
- **`.tmp/` folder**: Commit lightweight artifacts that support review, replay, handoff, or agent continuity. Binary/media assets remain gitignored and synced to the VPS.
- **Branch naming**: `deliver/[client-name]-graphic-resources-<change>` once cloned into a client folder.
- **Commit discipline**: Atomic commits with descriptive messages. One logical change per commit.

## Infrastructure
- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
