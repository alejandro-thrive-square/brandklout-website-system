# Design Standard — awwwards-grade, motion-led

**Applies to every page built under `deliver/brandklout/`.** Non-negotiable.

Set 2026-08-06 after the first Grand Mission output came back as a plain, templatised landing
page. That is the failure mode this document exists to prevent.

## The bar

These are paid-traffic pages for dental practices, competing against a handful of identical
PPC templates that every competitor is already running. A page that *looks like* a template
converts like one. The target is **awwwards-grade**: high interaction, motion-led, memorable.

**Reference implementation:** the Dr. Nahlah build in this repo —
`deliver/brandklout/dr-nahlah/workflows/04-design/.tmp/site-src/`
(11 pages, `pages/*.body.html` + `partials/`). Read it before designing. It is the standard,
not an inspiration.

> [!IMPORTANT]
> "Beautiful" is not a spec and produced plain output. The checklist below is the spec.

## What the reference actually does

Measured from the Dr. Nahlah source:

| Technique | Usage | Purpose |
| :--- | :--- | :--- |
| `data-split` (SplitText) | 77 | Per-line / per-character headline reveals |
| ScrollTrigger | 19 | Scroll-bound section choreography |
| ScrollSmoother | 11 | Smoothed scroll as the spine of the page |
| `gsap.to` / `from` / `fromTo` | 44 | Section entrances and state transitions |
| `data-anim` | 11 | Declarative hooks, markup-driven not hard-coded |
| `clip-path` | 6 | Image and section wipe reveals |
| `gsap.quickTo` | 3 | Cursor-follow / magnetic interaction |
| `prefers-reduced-motion` | 4 | Accessibility guards |
| `backdrop-filter`, sticky | 3 | Depth and pinned UI |

## Minimum per page

1. **A hero with real motion** — split-text headline reveal, media wipe or scale, layered entrance.
   Not a static image with text on top.
2. **At least 2–3 scroll-choreographed sections** — pinned sequences, horizontal moves, parallax,
   scrubbed counters, staggered grids. Fade-up-on-scroll alone does not count.
3. **Interaction on every interactive element** — magnetic or cursor-aware CTAs, hover states with
   real transitions, animated accordions/tabs/sliders.
4. **Considered typography** — scale, weight contrast, and rhythm doing visible work. Fluid
   `clamp()` sizing.
5. **A signature moment** — one thing per page a visitor would remember and describe.
6. **`prefers-reduced-motion` honoured throughout.** Non-negotiable, medical audience.
7. **Mobile is designed, not degraded.** Most paid dental traffic is mobile; motion must survive.

## Conversion is still the job

Motion serves the offer, never buries it. The phone number, the offer, and the form stay
immediately reachable — sticky mobile call bar, visible CTA at every scroll depth. A page that
wins on craft and loses the lead has failed. Section order comes from the Asana brief and the
vendor originals; the *execution* is ours.

## GSAP gotchas — learned the hard way, do not rediscover

- **All GSAP plugins are free since 3.13** — ScrollTrigger, ScrollSmoother, SplitText included.
- **Register plugins in `<body>`, not `<head>`** — otherwise ScrollSmoother silently dies with no
  error and the page merely feels flat.
- **ScrollSmoother breaks full-page screenshots.** Verify with real interaction, not captures.
- **Scrubbed scale must never land exactly on `1`** — causes edge flicker.
- A fixed header's `z-index` can trap its own close button under an open drawer.
- Fixed side rails need a real layout gutter plus a scrim, and inversion over light sections.

## Verification — interaction, not screenshots

A screenshot cannot tell you whether a reveal fired, a counter ran, or reduced-motion is
respected. Verify by driving the page (Chrome CDP or equivalent) and asserting behaviour:

- Reveals actually trigger at their scroll positions
- Counters, sliders, accordions, drawers work
- `prefers-reduced-motion: reduce` disables motion without hiding content
- No console errors; nothing depends on a plugin that failed to register

**Test in a focused tab.** Background tabs freeze transitions, IntersectionObserver, and timers,
so a backgrounded check will report broken animation that is actually fine.

## Definition of done

A page is not done when the sections exist. It is done when it has the hero motion, the
scroll-choreographed sections, the interaction states, the signature moment, working
reduced-motion, and verified behaviour on a focused tab at mobile and desktop.

If a page would not look out of place on awwwards, it passes. If it looks like a dental PPC
template, it does not — rebuild the execution, keep the content.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../SYSTEM_RULES.md).
