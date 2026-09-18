# Workflow: 04 - Design

## Client-Facing Overview
We apply the brand, visuals, and design principles to make the website clear, polished, responsive, and easy to act on. The goal is to turn the approved structure into a high-quality first design draft before development starts.

> [!IMPORTANT]
> **Integrity Rule**: Any change to the Python executor, technical logic, or design library of this workflow must be documented here immediately.

## Operational Purpose
Produce the first approved design draft that can be reproduced 1:1 in Webflow. Each client uses one of two valid paths:
- **Claude Design**: Create and export HTML/CSS/JS design packages, then convert them into Figma.
- **Figma from scratch**: Create approved Figma designs directly.

This module uses the selected design-system package initialized during `00-client-delivery-initialization`. It is required when Deliver owns design creation or redesign, and skipped when the signed offer is development-only from approved design files.

## Non-Negotiable Foundations
- **Fluid root font-size**: every site scales from one fluid `html { font-size }`, so every `rem`
  is viewport-relative. Mandatory on all builds. Generate with `node scripts/fluid-root.mjs`, and
  size type, spacing and radii in `rem` — never `px`, and never `clamp()` for font-size. Full rules
  and the approved scale: [fluid-root.md](./fluid-root.md).

## Design-System Source
- The reusable source of truth lives at `deliver/process/design-system-library/`.
- Sales discovery selects one approved reference from that library.
- Client initialization copies only the selected package into `deliver/[client-name]/workflows/00-client-delivery-initialization/.tmp/design-system/`.
- All project-specific runtime outputs go to `deliver/[client-name]/workflows/04-design/.tmp/`.

## Inputs From Sales / Previous Phase
- Approved final wireframes from `deliver/[client-name]/workflows/02-wireframe/.tmp/final-wireframes/`.
- Prepared graphic resources from `deliver/[client-name]/workflows/03-graphic-resources/.tmp/`.
- Project overview with audience, brand, positioning from `deliver/[client-name]/docs/project-overview.md`.
- Sales strategy handoff, audience notes, positioning direction, and the initialized selected design-system package from `deliver/[client-name]/workflows/00-client-delivery-initialization/.tmp/design-system/`.

### Brand-Authority Preflight

Before choosing tokens or composing pages, inspect every client- or partner-owned source that can
carry design direction: handoff files, brand guidelines, moodboards, the current public site,
Webflow page/component embeds, Figma files, and approved reference URLs. Do not classify a source
as empty from its Webflow style count or page shell; read embeds and linked assets first.

Write `.tmp/reference-inventory.md` with each source, what it controls (structure, identity,
content, or interaction), whether its assets were downloaded into the active worktree, conflicts,
and the selected authority. If brand identity or reference priority is unresolved, stop before the
batch build and request the decision.

## Execution Steps
All `.tmp/` paths below resolve to `deliver/[client-name]/workflows/04-design/.tmp/`.

### Phase 1: Style Direction
1. Read the approved final wireframes, prepared graphic resources, project overview, and initialized selected design-system package.
2. Review the copied reference package in `00-client-delivery-initialization/.tmp/design-system/`.
3. Merge client brand guidelines with the selected reference package into a custom token set.
4. Install the fluid root snippet (`node scripts/fluid-root.mjs --css`) as the first rule of the
   project's shared stylesheet, and express the token set in `rem` so it inherits the fluid scale.
5. Document the style direction rationale.
6. **Output**: `.tmp/style-direction.md`, `.tmp/design-tokens.json`

### Phase 2A: Claude Design Path
7. Build one representative **canary page** (or the shared shell plus its most complex section)
   before multiplying the system across the remaining pages.
8. Verify the canary at mobile and desktop against the selected authority: typography, palette,
   density, responsive geometry, interaction, reduced motion, and console state. Record the result
   in `.tmp/canary-review.md` and obtain internal/user approval of the direction.
9. Freeze the approved tokens, shared shell, component vocabulary, and interaction runtime for this
   batch. Later pages may vary in composition and content, but must not silently choose a new system.
10. Compose self-contained HTML/CSS/JS prototypes for the remaining approved page templates.
11. Create a prototype manifest listing page composition, sections, animations, and the canary
    baseline commit/artifact.
12. Export the first-draft HTML/CSS/JS package into `.tmp/final-design/`.
13. Convert the HTML package into a Figma file through the approved HTML-to-Figma workflow.
14. Publish the first-draft design package to Vercel for client review.
15. **Output**: `.tmp/prototypes/*.html`, `.tmp/prototype-manifest.json`, `.tmp/final-design/`, `.tmp/figma-conversion-log.json`, `.tmp/vercel-preview-url.txt`, `.tmp/canary-review.md`

### Phase 2B: Figma From Scratch Path
7. Create first-draft Figma designs directly from the tokens, wireframes, and graphic resources.
8. Apply auto-layout, components, constraints, and responsive breakpoints.
9. Publish a reviewable static package to Vercel so the client receives both Figma and Vercel review links.
10. **Output**: Figma file/link plus `.tmp/figma-conversion-log.json` and `.tmp/vercel-preview-url.txt`

### Phase 3: Review Handoff
16. Document component specifications, CMS bindings, and responsive behavior.
17. Capture screenshots at 360, 390, 768, 1024, 1440, and 1920; review them visually and assert
    zero horizontal overflow at 360 and 390.
18. Run interaction checks in a focused browser tab, computed-style/token consistency checks, and
    the fluid-root gate: `node scripts/fluid-root.mjs --check <package>` must exit 0.
19. Send the Figma link and Vercel review URL to the client for first-round feedback.
20. Record the selected design path and move approved corrections into `05-design-revisions`.
21. **Output**: `.tmp/component-spec.json`, `.tmp/screenshots/`, `.tmp/token-violations.json`, `deliver/[client-name]/docs/design-draft-review.md`

## Offer-Specific Adaptations
- **Development from Scratch**: Required after approved wireframes and graphic resources. Produces the first draft, Figma output, and required Vercel review URL before `05-design-revisions`.
- **Figma to Webflow**: Skipped unless the signed scope includes design changes, missing breakpoints, or unresolved component states that Deliver is responsible for designing.
- **Migration to Webflow**: Required only when the migration includes redesign or significant visual changes.
- **Webflow Improvements & Updates**: Optional for scoped redesign work, new page designs, or brand-system updates.
- **AI Site with Claude, Vercel & Airtable**: Required. Use the Claude Design path to produce the approved coded design package that `17-ai-site-build-airtable` turns into the final Vercel site.

## Technical Setup
- **Executor status**: Placeholder.
- **Future automation**: Export Figma variables, generate component specs, capture screenshots, detect non-tokenized design drift, auto-compose prototypes from wireframe structure, and trigger review deployments.
- **Likely integrations**: Figma API/MCP, html.to.design, Vercel CLI, ClickUp, OpenAI/Anthropic.

## Output Artifacts
- `deliver/[client-name]/workflows/04-design/.tmp/style-direction.md`
- `deliver/[client-name]/workflows/04-design/.tmp/design-tokens.json`
- `deliver/[client-name]/workflows/04-design/.tmp/reference-inventory.md`
- `deliver/[client-name]/workflows/04-design/.tmp/canary-review.md`
- `deliver/[client-name]/workflows/04-design/.tmp/prototypes/*.html`
- `deliver/[client-name]/workflows/04-design/.tmp/prototype-manifest.json`
- `deliver/[client-name]/workflows/04-design/.tmp/final-design/`
- `deliver/[client-name]/workflows/04-design/.tmp/figma-conversion-log.json`
- `deliver/[client-name]/workflows/04-design/.tmp/vercel-preview-url.txt`
- `deliver/[client-name]/workflows/04-design/.tmp/component-spec.json`
- `deliver/[client-name]/workflows/04-design/.tmp/screenshots/`
- `deliver/[client-name]/workflows/04-design/.tmp/token-violations.json` (on failure)
- `deliver/[client-name]/docs/design-draft-review.md`

## Version Control
- All changes to this workflow must follow the version control rules in [SYSTEM_RULES.md - Section 4](../../../../../SYSTEM_RULES.md).
- **`.tmp/` folder**: Commit lightweight artifacts that support review, replay, handoff, or agent continuity. Binary/media assets remain gitignored and synced to the VPS.
- **Central library**: `deliver/process/design-system-library/` is committed once at the process level and is not duplicated wholesale into client folders.
- **Branch naming**: `deliver/[client-name]-design-<change>` once cloned into a client folder.
- **Commit discipline**: Atomic commits with descriptive messages. One logical change per commit.

## Infrastructure
- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
