# Webzite Studio — Site Redesign (Internal Project)

Webzite Studio's own site, redesigned from scratch as an awwwards-caliber build. Run through the standard Deliver process with Webzite as its own client.

> [!IMPORTANT]
> This is an **internal** project. There is no Sales handoff package and no signed offer. The delivery path below was chosen directly rather than routed through [OFFER_ROUTING.md](../../process/OFFER_ROUTING.md).

## Current State

| Field | Value |
| :--- | :--- |
| Live site | https://www.webzite.studio |
| Platform | Webflow |
| Redesign scope | Full redesign, starting with the home page |
| Current phase | `04-design` — **home page drafted & self-verified** (`04-design/.tmp/final-design/`) |
| Stop point | Design HTML only — no Webflow paste yet |
| Open item | Per-page pricing shown on the page is the canonical rate; confirm before any public launch. |

## Delivery Path

Adapted `Development from Scratch`, minus the handoff phase (internal project):

`00` → `01` → `02` → `03` → `04` → `05` → `06` → `07` → `08` → `09`

`10-handoff-support` is not cloned — there is no external client to hand off to.

## Locked Decisions

Decided 2026-07-17 with Alejandro before the design phase opened.

| Decision | Choice | Consequence |
| :--- | :--- | :--- |
| Design system base | Brand-led, from `manage/brand-assets` | Not a library taxonomy style. The `--wz-*` token system is the source of truth. |
| Positioning | **Studio-of-one (hybrid)** | "We" for the work, a named face for the relationship. Resolves the live site's freelancer/Studio contradiction. |
| Asset scope | Brand kit in, old-site media out | See Asset Rules below. |
| 3D scroll frame sequence | **Deferred** | Magnific/Freepik 3D → frame-sequence is a later enhancement pass, not this build. |
| Webflow target | **Undecided** | Ships as design HTML. Target chosen after design review. |

## Design System

Source of truth: `manage/brand-assets/`. Seeded into `workflows/00-client-delivery-initialization/.tmp/design-system/`.

The design system is **v2.0, an editorial specimen document** — high-contrast, premium, motion-led. It already ships the ambient dust canvas (`initDust()`, pointer-reactive) that this redesign builds on. It is not a website mock; it is the vocabulary the site is built from.

### Tokens

```
color      --wz-ink #111114   --wz-paper #f7f5ef   --wz-white
           --wz-blue #466fff  --wz-red #ff4646     --wz-yellow #ffec46
           --wz-mist #dce6ff
structure  --wz-max 1440px    --wz-gutter clamp(20px, 4vw, 64px)
           --wz-radius 8px    --wz-radius-lg 18px
space      --wz-space-1..8    (4px lattice: 4/8/16/24/40/64/96/156)
motion     --wz-ease cubic-bezier(0.19, 1, 0.22, 1)
           --wz-micro 220ms   --wz-base 420ms      --wz-slow 780ms
type       --wz-font Inter    --wz-mono JetBrains Mono
```

Use the tokens. Do not introduce new hex values, new spacing steps, or new easing curves.

## Asset Rules

> [!WARNING]
> **Do not reuse any media from the live webzite.studio site.** Text and structure were captured for analysis; media was deliberately not downloaded.

**Approved** — from `manage/brand-assets/assets/`:
- `logos/` — `webzite-logo-white.svg`, `webzite-logo-white-alt.svg`, `webzite-logo-black.png`, `webzite-mark.svg`, `favicon.png`
- `textures/` — `webzite-texture-long.jpg`, `webzite-texture-noise.png`
- `3d/` — `logo-3d-blue-yellow.png`, `logo-3d-red-blue.png`, `logo-3d-yellow.png` (brand marks only)
- `motion/` — `headline-rotation*.json` (Lottie)

**Placeholder instead** — old-site carryover, awaiting fresh art:
- `work-covers/*`, `3d/webzite-home-hero.png`, `testimonials/avatar-*`, `pricing/*`

## Current Site Audit

Full inventory: [`workflows/01-content-intake/.tmp/current-site-scrape/`](../workflows/01-content-intake/.tmp/current-site-scrape/). Homepage + 5 project pages verified; several nav-linked pages returned no content and need a visual pass.

### Content worth carrying forward
- The **"Strategy + Experience + Functionality = Profit"** thesis — strong concept, weak current execution.
- Credibility metrics: 35+ projects, 4+ years, 25+ clients, 4.5 stars on Upwork.
- Substantial project portfolio — should become a central proof system, not a grid.
- Concrete performance-score proof and migration operational proof (80 blog posts migrated, 160 URLs redirected).

### Debt the redesign must fix
- **Placeholder text is live in the navigation** ("This is some text inside of a div block.").
- At least two inconsistent site generations across pages; nav differs between home and project pages.
- Footer years disagree (2024 vs 2025). Homepage Terms link points to Upwork's ToS.
- Duplicated dropdown categories and duplicated CTA labels in the DOM.
- Typos: `portofolio`, `maintainance`, `Convertions`, `URL's`.
- Inconsistent casing: `webflow`/`Webflow`, `Wordpress`/`WordPress`.
- CMS empty states exposed publicly ("No items found.", "Not Available.").
- Generic case-study result bullets that contradict stated project scope.

## Motion Direction

Awwwards-caliber, driven by the design system's motion spec:
- Scroll-driven reveals — masked fade + translate, 720–780ms on `--wz-ease`.
- **Dust interactions** — the pointer-reactive ambient canvas, already built.
- Grain overlay for depth.
- Marquee, magnetic buttons, split-text as supporting patterns.
- **Full `prefers-reduced-motion` fallback is mandatory**, matching the design system's existing behavior.

## MCP Access

See [`mcp-access.md`](./mcp-access.md). The `webflow-webzite` server is registered but **out of scope** until a Webflow target is chosen.

## Version Control
- Follows [SYSTEM_RULES.md - Section 4](../../../SYSTEM_RULES.md).
- Branch naming: `deliver/webzite-<description>`.
- Never commit binary/media assets — brand media stays in `manage/brand-assets` and syncs to the VPS.

## Infrastructure
- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
