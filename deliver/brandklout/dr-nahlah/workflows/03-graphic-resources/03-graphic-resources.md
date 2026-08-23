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

## Client Adaptation — Dr. Nahlah (2026-07-30)

Source-asset extraction from the existing site is **done**, ahead of wireframes,
because the rebuild's asset strategy (re-use vs. reshoot) is an open scope question
that affects price. Art direction and any net-new asset creation still follow the
normal order, after `02-wireframe`.

**Extracted**: 911 files / 156 MB, grouped to 587 logical assets, 0 download failures.

| Artifact | What it is |
| :--- | :--- |
| `.tmp/downloads/` | Every file, mirroring the remote path (gitignored, VPS via rclone) |
| `.tmp/ASSETS.md` | Categorised catalogue + findings — **start here** |
| `.tmp/asset-catalogue.csv` | Logical assets by category, size variants folded together |
| `.tmp/asset-manifest.csv` | Every URL: local path, bytes, status, where it was found |
| `.tmp/video-embeds.csv` | 25 YouTube videos by ID and the pages using them |
| `.tmp/inline-svg/` | 4 inline `<svg>` elements saved as standalone files |
| `.tmp/extract_assets.py` | Extractor/downloader (re-runnable) |
| `.tmp/catalogue_assets.py` | Builds ASSETS.md + asset-catalogue.csv from `downloads/` |

**This supersedes** `01-content-intake/.tmp/current-site-scrape/media-manifest.csv`,
which listed only 284 image URLs and downloaded nothing. That manifest was built from
`<img>`/`<source>` tags alone and structurally missed `srcset` variants, CSS
`background-image` refs, stylesheet-referenced art, favicons, `<video>`/`poster`,
documents, and video embeds. Use the artifacts above instead.

**Blocking questions for this phase** (also in `docs/project-overview.md`):
no vector logo exists; Adobe Stock licensing is unverified; at least one image is
named for a different practice; patient-photo consent for the 99 before/after cases
is unconfirmed.

Re-run with:
```bash
python .tmp/extract_assets.py     # discover + download (--dry-run to skip download)
python .tmp/catalogue_assets.py   # rebuild ASSETS.md from downloads/
```

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
