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

## Execution Steps
All `.tmp/` paths below resolve to `deliver/[client-name]/workflows/04-design/.tmp/`.

### Phase 1: Style Direction
1. Read the approved final wireframes, prepared graphic resources, project overview, and initialized selected design-system package.
2. Review the copied reference package in `00-client-delivery-initialization/.tmp/design-system/`.
3. Merge client brand guidelines with the selected reference package into a custom token set.
4. Document the style direction rationale.
5. **Output**: `.tmp/style-direction.md`, `.tmp/design-tokens.json`

### Phase 2A: Claude Design Path
6. Compose self-contained HTML/CSS/JS prototypes for each approved page template.
7. Create a prototype manifest listing page composition, sections, and animations.
8. Export the first-draft HTML/CSS/JS package into `.tmp/final-design/`.
9. Convert the HTML package into a Figma file through the approved HTML-to-Figma workflow.
10. Publish the first-draft design package to Vercel for client review.
11. **Output**: `.tmp/prototypes/*.html`, `.tmp/prototype-manifest.json`, `.tmp/final-design/`, `.tmp/figma-conversion-log.json`, `.tmp/vercel-preview-url.txt`

### Phase 2B: Figma From Scratch Path
6. Create first-draft Figma designs directly from the tokens, wireframes, and graphic resources.
7. Apply auto-layout, components, constraints, and responsive breakpoints.
8. Publish a reviewable static package to Vercel so the client receives both Figma and Vercel review links.
9. **Output**: Figma file/link plus `.tmp/figma-conversion-log.json` and `.tmp/vercel-preview-url.txt`

### Phase 3: Review Handoff
12. Document component specifications, CMS bindings, and responsive behavior.
13. Capture screenshots across breakpoints and run a token-consistency audit.
14. Send the Figma link and Vercel review URL to the client for first-round feedback.
15. Record the selected design path and move approved corrections into `05-design-revisions`.
16. **Output**: `.tmp/component-spec.json`, `.tmp/screenshots/`, `.tmp/token-violations.json`, `deliver/[client-name]/docs/design-draft-review.md`

## Client Adaptation — Dr. Nahlah (2026-07-30)

**Path**: Claude Design (coded HTML/CSS/JS package).
**Scope this pass**: home page only, at the client's direction.

Design started **before** `02-wireframe`, at the client's request, using the reference
site's section order as the structural wireframe. The reference was used for
**structure only** — the visual direction is built from Dr. Nahlah's own brand.

**Delivered**:

| Artifact | Notes |
| :--- | :--- |
| `.tmp/final-design/index.html` | Self-contained home page, 12 sections, 12 interactions, no animation library |
| `.tmp/final-design/assets/` | 13 assets pulled from `03-graphic-resources` (gitignored) |
| `.tmp/design-tokens.json` | Brand gold sampled from the client wordmark; Raleway kept from the live site |
| `.tmp/style-direction.md` | Rationale, motion system, responsive behaviour, open questions |
| `.tmp/prototype-manifest.json` | Section/interaction/asset map + Webflow conversion notes |
| `.tmp/interaction-test.mjs` | 31-check headless functional test — **31/31 passing** |
| `.tmp/screenshots/` | Full-page and sliced captures at 1440 and 390 |

**Verification is functional, not visual-only.** `interaction-test.mjs` drives headless
Chrome and asserts font loading, preloader release, reveal firing after a full-page
scroll, counter end values, compare-slider drag *and* keyboard control, case-tab image
swaps, video playback, broken images, horizontal overflow at both widths, mobile drawer
open/close/aria, and `prefers-reduced-motion`. Re-run with:

```bash
python -m http.server 8899 --directory .tmp/final-design
node .tmp/interaction-test.mjs http://127.0.0.1:8899/index.html
```

> [!WARNING]
> **Screenshot-only QA is not sufficient for this package.** Reveals are
> IntersectionObserver-driven, so a `captureBeyondViewport` full-page shot leaves
> below-fold content at `opacity:0`, and counters photograph mid-animation. Use the
> scroll-slice driver or the interaction test for anything behavioural.

### Two directions delivered

| | v1 — `final-design/` | v2 — `final-design-gsap/` |
| :--- | :--- | :--- |
| Approach | No animation library, hand-rolled IO + rAF | GSAP 3.15, vendored locally (204KB) |
| Structure | Sections | **Seven-chapter journey** + fixed chapter rail |
| Code layout | Global CSS + one script | **Per-section `<style>` + `<script>`** — each chapter is a self-contained paste unit |
| Before/after | Drag + keyboard, 3 tabs | Pinned, **scroll-scrubbed** through 3 cases |
| Process | Sticky vertical rail | Pinned **horizontal travel** |
| Height @1440 | ~8,700px | ~12,000px |
| Verified | 31/31 (`interaction-test.mjs`) | 45/45 (`interaction-test-gsap.mjs`) |
| Docs | `style-direction.md`, `prototype-manifest.json` | `style-direction-gsap.md`, `prototype-manifest-gsap.json` |

**Revision 2026-07-30** — the left chapter rail was removed from v2 at the client's
request and replaced by a reading-progress bar on the top edge of the nav. A fixed
side rail needs its own layout gutter, its own scrim, and a light/dark inversion to
stay legible; that cost was not worth the navigation it added.

**Structural gap largely closed 2026-07-30.** An audit against 16 viewport captures of
the reference home (`.../lakenonadentist-reference/.audit/`) found it has **14 blocks**
while v2 had 7 chapters and dropped 7 of them. Four were then built, taking v2 to
**9 chapters / 61 checks**:

| Added | Chapter | Content source |
| :--- | :--- | :--- |
| Us vs. Other Clinics | 02 The Difference | Practice's own credentials |
| Doctor bio + 8 credentials | **03 The Specialist** (new) | Verbatim from `/dr-esam-nahlah/` |
| Technology / in-house lab | **06 The Standard** (new) | Real client photography |
| Google reviews grid | 07 The Proof | ⚠️ **Placeholder copy** |

Still missing (all need client content): case-study carousel, award badges, secondary
services list. Full audit: [`.tmp/structure-comparison.md`](./.tmp/structure-comparison.md).

> [!CAUTION]
> **Two content-integrity items before this page goes anywhere public.**
> 1. The reviews grid carries **placeholder copy** — generic text, initials-only
>    authors, marked `data-placeholder="true"`. No testimonial is attributed to a real
>    patient. Wire it to the live Google Business Profile feed first.
> 2. Building the doctor chapter surfaced **factual errors in the earlier draft copy**,
>    now corrected against the practice's own published material: he has practised since
>    **2003** (not "25+ years") and moved to Northern Virginia in **2013** (not 1999);
>    the invented "10,000+ implants" and "4.9 rating" figures were replaced with
>    verifiable ones. All four homepage stats are now sourced. **No invented numbers
>    remain** — the earlier open question about unverified stats is resolved for v2,
>    but v1 still carries the old figures.

**Asset sourcing**: no stock imagery was needed. The 911-asset extraction already
contained a real photo of the in-house lab bench, 3D imaging, a sedation photo and a
practice interior. Real client photography was used throughout. A Freepik/Magnific key
is available from the client if stock is ever required, but is not currently wired up.

Both are live and maintained. v2 is the stronger award-site direction; v1 is the
cheaper Webflow build and the fallback if budget or timeline tightens. Client picks.

```bash
# v1
python -m http.server 8899 --directory .tmp/final-design
node .tmp/interaction-test.mjs      http://127.0.0.1:8899/index.html
# v2
python -m http.server 8901 --directory .tmp/final-design-gsap
node .tmp/interaction-test-gsap.mjs http://127.0.0.1:8901/index.html
```

> [!WARNING]
> **v2 additionally breaks full-page capture.** ScrollSmoother transforms
> `#smooth-content`, so `captureBeyondViewport` produces a wrong image. Use the
> scroll-slice driver (`screenshots-gsap/`) for v2 review shots.

**GSAP build notes for `07-webflow-build`**: plugins are vendored under
`final-design-gsap/assets/gsap/` for offline work — in Webflow, load the same 3.15
versions from the GSAP CDN in Page Settings. Register plugins in the **footer** embed,
never the head: ScrollTrigger initialises against `document.body`, and registering
before body exists breaks ScrollSmoother.

**Still outstanding for this phase**: wireframe sign-off (skipped to get here), Figma
conversion, Vercel review URL, `component-spec.json`, and the remaining page templates.
Stats, testimonial attribution and patient-photo consent are unverified — see the open
questions in `style-direction.md`.

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
