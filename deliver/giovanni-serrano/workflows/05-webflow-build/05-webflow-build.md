# Workflow: 05 - Webflow Build (Giovanni Serrano)

## Client-Facing Overview
We build the approved Figma designs in Webflow with clean structure, responsive behavior, CMS setup, and all integrations.

## Operational Purpose
Reproduce approved Figma designs (Home + Service template) in Webflow with CMS-first structure, component reusability, and responsive coverage across all 4 pages.

## Inputs
- Approved Figma files from Phase 03 (Home + Service template).
- Final content and SEO package from Phase 04.
- WEBFLOW_DEVELOPER_BRIEF.md (component library, form specs, CMS collections, animation guidelines).

## Execution Steps
1. Create/open Webflow project and scaffold CMS Collections:
   - Testimonials (Name, Role/Title, Photo, Quote, Page tag, Date)
   - Case Studies (future schema)
   - Blog/Insights (future schema)
2. Build global style system: colors, typography, spacing tokens.
3. Build reusable components (build once, instance everywhere):
   - Navigation (with hamburger under ~900px)
   - Footer (3-column + copyright)
   - Sub-page hero (eyebrow, headline, sub, meta row)
   - Section eyebrow (light + dark variants)
   - Card grid (2-col, collapses to 1-col under ~768px)
   - Process steps (numbered circle + title + body)
   - Sample Card (most complex — header, 2-col grid, metrics row, commentary)
   - Inline CTA band (terracotta full-width)
   - Dark background section (navy + gold accent)
   - FAQ accordion (Webflow native or custom interaction)
   - Contact form (page-specific goal options)
   - Related sub-pages teaser (2-card grid)
4. Build Home page from Figma.
5. Build Invest page from service template (first — longest section list, good template).
6. Duplicate/adapt service template for Scale page.
7. Duplicate/adapt service template for Develop page.
8. Wire up contact forms with page-specific goal options.
9. Publish to staging and prepare build manifest for QA.

## Project-Specific Notes
- Background rhythm: canvas -> bone -> canvas -> bone -> dark -> canvas (preserve from HTML).
- Animation: restrained, analytical brand. Soft fade-ins, minor hover states, smooth scroll only.
- Fonts: Lora Bold + Inter via Google Fonts (not base64).
- Mobile responsive: full discretion, HTML is desktop-only.

## Output Artifacts
- deliver/giovanni-serrano/workflows/05-webflow-build/.tmp/build-manifest.json
- deliver/giovanni-serrano/workflows/05-webflow-build/.tmp/visual-diff/
- deliver/giovanni-serrano/workflows/05-webflow-build/.tmp/cms-import.json

## Version Control
- All changes to this workflow must follow the version control rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md).
- **.tmp/ folder**: Commit lightweight artifacts that support review, replay, handoff, or agent continuity. Binary/media assets remain gitignored and synced to the VPS.
- **Branch naming:** deliver/giovanni-serrano-webflow-build-<change>

## Infrastructure
- **Hosting:** Hostinger VPS
- **OS:** Ubuntu 24.04 LTS
