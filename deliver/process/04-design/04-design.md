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

## What a Brand Handoff Actually Supplies

Added 2026-09-01, from the Stone Surgical Arts home rebuild.

> Alejandro: *"When we are handed off with a design or style guide or a brand guideline, we should
> be extracting color palette and font and that's it. The rest should be elevated, because I think
> we already have a cap in terms of design."*

**Take the palette and the typefaces. Take nothing else.** A client board, a style guide or a
picked design template is authority over IDENTITY, not over composition. Reproducing its section
order, its centred headers and its symmetric grids reproduces its ceiling, and that ceiling is what
gets a build called "very ugly and simple" at review.

Concretely, on every build:

- Express the board's colours and typefaces as tokens and **do not touch them afterwards**.
- Put everything else in a layer of your own with its own namespace, so the identity file stays
  diffable and the composition can be replaced without touching it.
- Display type steps almost always need to go ABOVE what a board specifies. A board's h1 is a
  heading; an editorial page needs a statement, which is typically 1.5x to 2x that again.

### The five things that make a build read as cheap

Check a first draft against these before showing it. They are ordered by how much damage each does,
and every one of them was true of the Stone v1 draft:

1. **One ground, no material.** Every section on the same flat colour. Look for what the client's
   own current or retired site used: stone, paper, a photographic ground. Reproduce the MATERIAL,
   not the layout.
2. **Everything centred, everything 50/50.** Nothing overlapping, nothing bleeding off an edge,
   nothing deliberately the wrong size.
3. **No scale contrast.** An h1-to-body range of about 4x. Editorial pages run 10x, and the quiet
   parts have to be genuinely quiet for the loud parts to land.
4. **Sections, not chapters.** A list of equal-weight blocks does not build an argument, so there is
   no reason to reach the bottom. Each section should make a MOVE.
5. **Every image the same aspect ratio, each in a box.** A library of 16:9 assets forces every
   section to be a horizontal band. Tall frames are what let a layout overlap and bleed, and
   cropping 16:9 to 2:3 throws away two thirds of the picture. Generate at the aspect the
   composition needs.

**An icon in a bordered box is an empty image slot with a drawing in it.** If a slot is for an
image, it gets an image.

### Where copy length actually comes from

"Big chunks of text" is a MEASURE problem before it is a length problem: a paragraph allowed to run
the full container width reads as a wall at any word count. Cap body columns (34rem is a good
default) before cutting words. Then cut words.

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

> [!IMPORTANT]
> **Scroll-driven motion fails SILENTLY, so it has to be asserted, not eyeballed.** A pin that never
> creates, a scrub that never advances and a bundle that throws after boot all leave a page that
> looks correct in a screenshot. Reference implementation:
> `deliver/brandklout/stone-dental-implant-center/workflows/04-design/.tmp/surgical-arts/site-src/journey-test.mjs`.
>
> - **Assert the positive, and assert the MAGNITUDE.** "A pin exists" passed while a pinned
>   horizontal chapter travelled 144px, which is technically working and visually nothing. Assert
>   "the track moved more than 400px". The Nahlah build shipped a guard clause that reported PASS
>   while ScrollSmoother was silently dead.
> - **Wait for the page to stop moving.** `scroll-behavior: smooth` is normal on these builds and
>   makes every scroll-then-read a mid-glide sample. Disable it in the test page and poll `scrollY`
>   until it settles.
> - **Never use `offsetTop` on anything pinned.** ScrollTrigger inserts a pin-spacer, so `offsetTop`
>   is measured inside it. Scroll to `trigger.start` / `trigger.end`.
> - **`page.evaluate(aString, arg)` drops the arg.** Puppeteer evaluates a string as an expression;
>   only a real function receives arguments.
> - **Verify all three failure branches**, not just the happy one: no JavaScript at all, the motion
>   library absent but the site bundle fine, and `prefers-reduced-motion` (which must produce ZERO
>   pins and leave nothing hidden).
>
> **Gates must read code, not prose.** A CSS or copy check that scans raw source will report a
> comment explaining a fixed bug as the bug. Strip comments first. This has now bitten twice, in
> `check-copy.mjs` and in `audit.mjs`.
>
> **A relative `url()` in a bundled stylesheet resolves against the BUNDLE, not the site root.** An
> asset check that resolves against the site root cannot catch a broken texture path, and one went
> undetected across eighteen live pages for two days.

> [!IMPORTANT]
> **Step 17 says capture screenshots AND review them visually. Both halves.** On the Stone rebuild
> six widths passed an automated overflow gate and three of them were visibly broken when the
> pictures were finally opened, including a navbar that had been clipping its own booking button on
> every page of the site since the first build. An assertion answers the question you thought to
> ask; the screenshot answers the ones you did not.
>
> **Overflow is two questions, not one, and one check cannot answer both:**
>
> 1. *Does the page scroll sideways?* `document.scrollWidth <= clientWidth`. This is what a reader
>    feels, and it is the hard gate.
> 2. *Is anything clipped out of reach?* Here `overflow-x` alone cannot decide. An editorial layout
>    bleeds images off the page edge on purpose and relies on a clipping ancestor, so excusing every
>    clipped element hides real bugs and excusing none flags every deliberate bleed. Ask about
>    CONTROLS instead: **no visible link, button or input may sit past the right edge** unless it is
>    inside a genuinely scrollable rail. A photograph bleeding off the page is the design; a button
>    doing it cannot be clicked.
>
> **Verify a new check by breaking the thing it is meant to catch.** Disable the fix, watch the
> check fail by name, restore the fix, watch it pass. A check that has never failed has proved
> nothing.

> [!IMPORTANT]
> **Scroll performance is part of "responsive", and it has to be measured THROTTLED.** At 1x every
> build looks smooth on the machine that made it, which is why janky sites ship. Drive the scroll
> through CDP at 4x CPU throttle and read the frame timeline: reference implementation is
> `deliver/brandklout/stone-dental-implant-center/workflows/04-design/.tmp/surgical-arts/site-src/perf.mjs`.
> On the Stone home page that found a chapter parallaxing twice, and took the worst zone from 13% of
> frames below 30fps to 9% with no main-thread blocks at all.
>
> - **Never animate `background-position`.** It is a paint property, so a scrubbed one repaints the
>   whole painted area every frame. Move a layer with `transform`, or let `background-attachment:
>   fixed` do it. Check you are not doing both: on Stone the CSS and the JS were producing the same
>   parallax and only the JS one cost anything.
> - **`will-change: transform` on scrub targets, scoped to the class your runtime sets.** An idle
>   `will-change` holds a compositor layer open for an element nothing will animate.

> [!WARNING]
> **Three CSS traps that produce layouts nobody wrote, all found on the Stone rebuild:**
>
> - **A `max-width` media rule reaches every width below it.** A rule added for the 992-to-1279 band
>   was written after the 991 mobile block, so it also matched at 768 and its two-column grid beat
>   the single-column mobile rule. Bound a band on both sides:
>   `@media (min-width: 992px) and (max-width: 1279px)`.
> - **`aspect-ratio` together with `max-height` shrinks the WIDTH as well.** The capped height is
>   transferred back through the ratio, so a full-width hero rendered as a 504px square with bare
>   background beside it. Add an explicit `width: 100%` when the box must stay full width.
> - **`min(<rem>, <vh>)` is a switch, not a curve.** It picks one arm and stays there, so above a
>   certain viewport the rem always wins and the element stops responding: a hero on
>   `min(44rem, 92vh)` was 704px on a 2560x1440 monitor, less than half the window, while every
>   section below it scaled. Use `clamp(floor, vh, ceiling)` when the intent is "fluid between
>   limits".

> [!TIP]
> **Use height queries for height problems, and check the widest screen against the narrowest
> asset.** "Too tall for the screen" lives on the vertical axis and a `max-width` query cannot see
> it. And a full-bleed section is the one place an image can be asked to exceed its source, because
> every other section stops at the content width: at 2560 the Stone hero's column was 1254px against
> a 1200px file, so the most important photograph on the page was the only soft one.
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
- All changes to this workflow must follow the version control rules in [SYSTEM_RULES.md - Section 4](../../../SYSTEM_RULES.md).
- **`.tmp/` folder**: Commit lightweight artifacts that support review, replay, handoff, or agent continuity. Binary/media assets remain gitignored and synced to the VPS.
- **Central library**: `deliver/process/design-system-library/` is committed once at the process level and is not duplicated wholesale into client folders.
- **Branch naming**: `deliver/[client-name]-design-<change>` once cloned into a client folder.
- **Commit discipline**: Atomic commits with descriptive messages. One logical change per commit.

## Infrastructure
- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
