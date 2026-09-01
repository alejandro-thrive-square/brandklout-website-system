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
5. Where stock is standing in for photography the client does not yet own, source it through a **slot table**, not ad hoc. See below.

### Sourcing stock through the Magnific / Freepik API

The key is `MAGNIFIC` in the repo-root `.env` — gitignored and **per-worktree**, so a fresh worktree needs the line copied across (it currently originates in `bk-dr-nahlah`). It is Freepik-family: search and download at `api.freepik.com` with an `x-freepik-api-key` header, serving `magnific.com` resources.

Reference implementation: `deliver/brandklout/stone-dental-implant-center/workflows/04-design/.tmp/surgical-arts/site-src/get-stock.mjs`.

Drive it from a **slot table** — one entry per image the markup asks for, each with the target filename, the search term, a `prefer` list that re-ranks results and an `avoid` list that drops them. The filename is what the markup points at, so changing a query never renames a file and never breaks a page. Write a `stock-manifest.json` beside it recording each asset's id, title, author, licence and page URL, and **commit the manifest** — `.tmp/` images are gitignored under the binary rules, so the manifest is what makes the attribution survive.

> [!WARNING]
> **On a medical or health site, no stock image may contain a face.** A stock model on a surgery page reads as a patient, and a stock face beside a treatment name reads as that treatment's result. Both are misrepresentation whatever the alt text says. Restrict slots to rooms, objects, instruments and textures, assert the API's people-exclude filter, and keep a per-slot `avoid` list as a second line of defence. This is a content-integrity rule, not a stylistic preference.

Practical notes:

- **The orientation filter is not honoured.** A `horizontal` query returned a 1600×2400 flat-lay twice. Enforce the aspect with a centre crop at build time instead of trusting the API.
- **Downloads are full-resolution originals** — 5,376px, up to 16 MB each. Eight raw files came to 55 MB and shipped at ~730 KB after a 16:9 crop, a 1600px resize and WebP at quality 82. Resizing is not optional.
- **There is no ImageMagick and no `sharp` on the Windows workstation.** `convert` on PATH is the Windows filesystem utility — do not reach for it. **Pillow** does the image work, shelled out to from Node; ffmpeg is present as a fallback.
- **Assets are premium-licensed against the client's own key**, so the licence runs with their subscription. Record it as a launch item: the subscription must still be active at go-live, and the terms need re-checking if the site is ever handed to a third party.
- **Check the client's existing photography for the wrong branding.** On the Stone build a genuine photograph of the surgeon had the *sister* practice's signage legible on a screen behind her; it had to come off the page it was on.

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
- `stock-manifest.json` beside whichever build consumes the stock — id, title, author, licence and source URL per slot. **Committed**, because the images themselves are gitignored and this is the attribution record.

## Version Control
- All changes to this workflow must follow the version control rules in [SYSTEM_RULES.md - Section 4](../../../SYSTEM_RULES.md).
- **`.tmp/` folder**: Commit lightweight artifacts that support review, replay, handoff, or agent continuity. Binary/media assets remain gitignored and synced to the VPS.
- **Branch naming**: `deliver/[client-name]-graphic-resources-<change>` once cloned into a client folder.
- **Commit discipline**: Atomic commits with descriptive messages. One logical change per commit.

## Infrastructure
- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
