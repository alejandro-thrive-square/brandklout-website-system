# Workflow: 04 - Content & SEO (Giovanni Serrano)

## Client-Facing Overview
All page copy is already finalized and locked in the HTML wireframes. This phase handles metadata, schema markup, alt text, and SEO structure — not copywriting.

## Operational Purpose
Produce SEO metadata, Schema.org recommendations, and alt text for all images using the locked HTML copy. No copy changes without client approval.

## Inputs
- All 4 HTML wireframes (copy source of truth).
- Approved design files from Phase 03.
- WEBFLOW_DEVELOPER_BRIEF.md section 11 (SEO basics and suggested meta descriptions).

## Execution Steps
1. Map each page to primary keyword, secondary terms, audience intent, and CTA goal:
   - Home: multifamily investment San Diego, real estate advisor
   - Invest: first-time multifamily buyer San Diego, house-hacking
   - Scale: multifamily portfolio scaling, DCF analysis, underwriting
   - Develop: San Diego lot development, ADU conversion, infill building
2. Apply locked copy from HTML files — no modifications.
3. Write metadata:
   - Unique title tags per page
   - Meta descriptions (use brief-suggested versions or refine)
   - Open Graph titles, descriptions, and image recommendations
4. Schema.org recommendations:
   - RealEstateAgent schema on home (DRE #02282434 in identifier field)
   - LocalBusiness schema with San Diego service area
   - FAQ schema on Invest page
5. Write alt text for all images, icons, and decorative elements.
6. Freeze final content and SEO package for Webflow build.

## Project-Specific Notes
- Copy is locked. Do not modify headlines, section titles, body text, or CTAs without explicit client approval.
- Geographic specificity: San Diego, not Southern California.
- Meta descriptions already suggested in the brief — use as starting point.

## Output Artifacts
- deliver/giovanni-serrano/workflows/04-content-seo/.tmp/keyword-map.json
- deliver/giovanni-serrano/workflows/04-content-seo/.tmp/metadata.json
- deliver/giovanni-serrano/workflows/04-content-seo/.tmp/schema/
- deliver/giovanni-serrano/workflows/04-content-seo/.tmp/alt-text.json

## Version Control
- All changes to this workflow must follow the version control rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md).
- **.tmp/ folder**: Commit lightweight artifacts that support review, replay, handoff, or agent continuity. Binary/media assets remain gitignored and synced to the VPS.
- **Branch naming:** deliver/giovanni-serrano-content-seo-<change>

## Infrastructure
- **Hosting:** Hostinger VPS
- **OS:** Ubuntu 24.04 LTS
