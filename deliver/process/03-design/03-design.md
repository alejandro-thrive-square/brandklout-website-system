# Workflow: 03 - Design

## Client-Facing Overview
We apply the brand, visuals, and design principles to make the website clear, polished, responsive, and easy to act on. The goal is to turn the approved structure into a high-quality visual experience before development starts.

> [!IMPORTANT]
> **Integrity Rule**: Any change to the Python executor, technical logic, or design library of this workflow must be documented here immediately.

## Operational Purpose
Produce high-fidelity HTML/CSS/JS prototypes, Figma comps, design tokens, and component specifications that can be reproduced 1:1 in Webflow. This module uses a committed design reference library at `deliver/process/03-design/library/` to accelerate prototype generation.

This module is required when Deliver owns design creation or redesign, and skipped when the signed offer is development-only from approved design files.

## Design Reference Library
A committed library of pure HTML/CSS/JS reference patterns lives at `deliver/process/03-design/library/`. See `library/LIBRARY_INDEX.md` for the full taxonomy and usage rules.

**Key rules:**
- The library is NEVER copied to client folders. It is always referenced from `deliver/process/03-design/library/`.
- All runtime outputs (prototypes, tokens, screenshots) go to `deliver/[client-name]/workflows/03-design/.tmp/`.
- Library files are self-contained HTML (inline styles + scripts), previewable in browser, and compatible with html.to.design for Figma conversion.

**Library contents:**
- `library/foundations/` - Design tokens (6 styles), typography, spacing, color systems
- `library/sections/` - ~31 section-level building blocks (heroes, nav, features, testimonials, pricing, CTAs, footers, content)
- `library/pages/` - 10 full-page compositions
- `library/animations/` - 10 reusable JS animation modules (GSAP, Lottie CDN)
- `library/styles/` - Shared CSS (reset, utilities, animations)
- `library/design-systems/` - 5 brand design philosophy references (Stripe, Linear, Notion, Vercel, Apple)

## Inputs From Sales / Previous Phase
- Approved wireframes from `deliver/[client-name]/workflows/01-wireframe/.tmp/`.
- Prepared graphic resources from `deliver/[client-name]/workflows/02-graphic-resources/.tmp/`.
- Project overview with audience, brand, positioning from `deliver/[client-name]/docs/project-overview.md`.
- Sales strategy handoff, audience notes, and positioning direction.

## Execution Steps (4-Phase Workflow)

All `.tmp/` paths below resolve to `deliver/[client-name]/workflows/03-design/.tmp/` -- NOT the process template's `.tmp/`.

### Phase 1: Style Direction
1. Read approved wireframes from `deliver/[client-name]/workflows/01-wireframe/.tmp/`.
2. Read graphic resources from `deliver/[client-name]/workflows/02-graphic-resources/.tmp/`.
3. Read project overview for audience, brand, positioning from `deliver/[client-name]/docs/project-overview.md`.
4. Browse `deliver/process/03-design/library/LIBRARY_INDEX.md` and select the closest style from the taxonomy.
5. Review matching page references from `library/pages/` and token file from `library/foundations/tokens/`.
6. If the client brief matches a known brand style, read the corresponding file in `library/design-systems/`.
7. Merge client brand guidelines (colors, fonts, logo, imagery direction) into a custom token set.
8. Document the style direction rationale.
9. **Output**: `.tmp/style-direction.md`, `.tmp/design-tokens.json`

### Phase 2: HTML/CSS/JS Prototype Generation
10. For each page template from the approved wireframes, compose an HTML/CSS/JS prototype:
    - Select section patterns from `library/sections/` matching the wireframe structure (see `library/sections/SECTION_INDEX.md`).
    - Apply client tokens as CSS custom properties throughout.
    - Integrate client graphic resources (logos, images, brand elements).
    - Add animations from `library/animations/` appropriate to the style direction.
    - Ensure responsive breakpoints: 1440px (desktop), 1024px (tablet landscape), 768px (tablet), 375px (mobile).
    - Each prototype is a self-contained HTML file with inline styles and scripts.
11. Create a manifest listing all prototypes and their section composition.
12. **Output**: `.tmp/prototypes/*.html`, `.tmp/prototype-manifest.json`

### Phase 3: Figma Conversion
13. Convert prototypes to Figma via one of two methods:
    - **html.to.design plugin**: Open prototype HTML in browser, use the plugin to import to Figma.
    - **Figma MCP API**: Use Figma MCP tools to create designs programmatically.
14. Import design tokens as Figma Variables from the JSON token file.
15. Apply Figma auto-layout, components, and constraints for production-ready Figma files.
16. **Output**: `.tmp/figma-conversion-log.json`

### Phase 4: Refinement & Approval
17. Document component specifications: interaction states, CMS bindings, responsive behavior.
18. Capture screenshots of all pages at all breakpoints.
19. Run a token-consistency audit: verify all design values trace back to the token set.
20. Present designs to client for feedback and iterate.
21. Record client approval.
22. **Output**: `.tmp/component-spec.json`, `.tmp/screenshots/`, `.tmp/token-violations.json`, `deliver/[client-name]/docs/design-approval.md`

## Offer-Specific Adaptations
- **Development from Scratch**: Required after approved wireframes and graphic resources. Full 4-phase workflow.
- **Figma to Webflow**: Skipped unless the signed scope includes design changes, missing breakpoints, or unresolved component states that Deliver is responsible for designing.
- **Migration to Webflow**: Required only when the migration includes redesign or significant visual changes; otherwise preserve or rebuild the existing visual direction in Webflow.
- **Webflow Improvements & Updates**: Optional for scoped redesign work, new page designs, or brand-system updates.

## Technical Setup
- **Executor status**: Placeholder.
- **Future automation**: Export Figma variables, generate component specs, capture screenshots, detect non-tokenized design drift, auto-compose prototypes from wireframe structure.
- **Likely integrations**: Figma API/MCP, html.to.design, ClickUp, OpenAI/Anthropic.

## Output Artifacts
- `deliver/[client-name]/workflows/03-design/.tmp/style-direction.md`
- `deliver/[client-name]/workflows/03-design/.tmp/design-tokens.json`
- `deliver/[client-name]/workflows/03-design/.tmp/prototypes/*.html`
- `deliver/[client-name]/workflows/03-design/.tmp/prototype-manifest.json`
- `deliver/[client-name]/workflows/03-design/.tmp/figma-conversion-log.json`
- `deliver/[client-name]/workflows/03-design/.tmp/component-spec.json`
- `deliver/[client-name]/workflows/03-design/.tmp/screenshots/`
- `deliver/[client-name]/workflows/03-design/.tmp/token-violations.json` (on failure)
- `deliver/[client-name]/docs/design-approval.md` (final, persisted)

## Version Control
- All changes to this workflow must follow the version control rules in [SYSTEM_RULES.md - Section 4](../../../SYSTEM_RULES.md).
- **`.tmp/` folder**: Commit lightweight artifacts that support review, replay, handoff, or agent continuity. Binary/media assets remain gitignored and synced to the VPS.
- **`library/` folder**: Committed to the repository. Contains no binary assets. Uses CSS gradients, inline SVGs, and CDN placeholder images.
- **Branch naming**: `deliver/[client-name]-design-<change>` once cloned into a client folder.
- **Commit discipline**: Atomic commits with descriptive messages. One logical change per commit.

## Infrastructure
- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
