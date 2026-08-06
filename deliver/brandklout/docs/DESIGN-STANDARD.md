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
| `data-chapter` | 9 | Named narrative beats — the journey spine |
| `scrub:` | 12 | Scroll *drives* the content, rather than triggering it |
| `pin: true` | 2 | The page holds while a scene plays out |
| **`IntersectionObserver`** | **0** | Deliberately none — see below |

That last row is the single sharpest difference. The reference contains **zero**
`IntersectionObserver` calls; the first-round Arvada and Mason Park builds are made almost entirely
of them (6 and 7 respectively, with no GSAP at all). An observer can only say *"this is now
visible"* — it cannot express *how far through* something you are, which is what every scrubbed and
pinned moment in the reference depends on.

## Journey architecture — chapters, not bands

**This is the structural rule, and it is the one the first build round missed.** Adding animation
to a stack of cards does not produce the reference. The reference is a different *architecture*.

### The failure mode, named

Audited 2026-08-06 across the first 12 pages. Their section markup looks like this:

```html
<section class="section band-base">
<section class="section band-paper">
<section class="section band-summit" style="--band-bg:var(--navy)">
<section class="section section--light">
```

Every one of those class names describes **a strip with a background colour**. That is the tell:
the page was composed as *a vertical stack of interchangeable bands*, each holding a grid of cards,
each independent of the ones above and below. Scroll is pure transport — it moves you past content
that would read identically as a printed PDF. Swap any two sections and nothing breaks, because
nothing was ever connected.

The reference is composed the opposite way:

```html
<section class="ch-arrival"        data-chapter="0" data-chapter-name="Arrival">
<section class="ch-reality"        data-chapter="1" data-chapter-name="The Reality">
<section class="ch-difference"     data-chapter="2" data-chapter-name="The Difference">
<section class="ch-specialist"     data-chapter="3" data-chapter-name="The Specialist">
<section class="ch-transformation" data-chapter="4" data-chapter-name="Transformation" data-theme="light">
<section class="ch-path"           data-chapter="5" data-chapter-name="The Path">
<section class="ch-standard"       data-chapter="6" data-chapter-name="The Standard">
<section class="ch-proof"          data-chapter="7" data-chapter-name="The Proof" data-theme="dark">
<section class="ch-invitation"     data-chapter="8" data-chapter-name="Invitation" data-theme="dark">
```

Nine **named narrative beats**, in an order that cannot be shuffled. The name says what the beat
*does to the reader*, never what widget sits inside it. Scroll is the medium the story is told in.

> **Smell test.** If your section classes are `band-*`, `section--light`, `section--paper`,
> `section--tight` — you built bands. Rename them to the beat they perform. If you cannot name the
> beat, the section has no reason to exist and should be merged or cut.

### What each chapter owes the page

A chapter is a **scene**, not a container. Each one must:

1. **Arrive** — a deliberate entrance, not a fade-up. The reference tweens the chapter tag in from
   the left, splits and reveals the headline, and wipes the media.
2. **Do something while it is on screen** — scroll *drives* it. Scrubbed, pinned, or reactive.
3. **Depart** — recede as you leave. The reference scrubs an exit timeline on
   `start:'top top', end:'bottom top'`, so leaving a chapter feels like leaving a room.

A section that only fades in and then sits there is a band with an animation on it.

### Scroll must do work — at minimum three times per page

Per page, at least **three** chapters where scroll position *is* the interaction, not a trigger:

| Mechanism | Reference example |
| :--- | :--- |
| **Pinned + scrubbed statement** | Ch. 01 — the page holds still and the copy is written word by word as you scroll |
| **Pinned + scrubbed before/after** | Ch. 04 — one pin drives three image wipes; the slider position *is* scroll progress |
| **Pinned horizontal journey** | Ch. 05 — the treatment path travels sideways with a progress bar driven by `self.progress` |
| **Velocity-reactive motion** | Ch. 02 — a marquee that reacts to how fast you are scrolling |
| **Scrubbed counters / parallax** | Ch. 02, 03, 06, 07 — figures count and media drifts against the scroll |

`IntersectionObserver` toggling a CSS class is **not** choreography. It is a trigger. It fires once,
it is binary, and it cannot express progress. Every page in the first round leaned on it —
Arvada `brand.js` and Mason Park `mpd.js` are built almost entirely from it, with **no GSAP at all**
— and that single choice is most of why the output reads as a plain card site. Scrubbing requires a
timeline bound to scroll progress. Use GSAP.

### Continuity devices — what makes it feel like one journey

Chapters alone still read as a list unless the page tells you where you are:

- **A reading-progress indicator.** The reference pins a 2px scaled bar to the top edge of the nav
  (`.nav-progress` → `transform:scaleX()`).
- **Chapter tags.** `Chapter 04 · The Transformation` — visible, animated in, numbering the journey.
- **Theme shifts between chapters.** `data-theme="light"` / `"dark"` so the page changes atmosphere
  as the story turns, rather than alternating two background tints forever.
- **A signature moment** the visitor would describe to someone else afterwards.

### Adapting the journey to a paid landing page

A landing page is shorter than the reference home page and has one job, so compress to **6–8
chapters** — but keep it a narrative arc. The dental-LP shape:

| # | Beat | Job |
| :--- | :--- | :--- |
| 00 | **Arrival** | Offer and promise, in motion |
| 01 | **The Problem** | Name the pain the visitor arrived with — pinned, scrubbed |
| 02 | **The Answer** | The treatment, revealed rather than listed |
| 03 | **The Transformation** | Real before/after, scroll-scrubbed |
| 04 | **The Practice** | Doctors, credentials, technology — trust |
| 05 | **The Path** | What actually happens, step by step, horizontally |
| 06 | **The Proof** | Genuine reviews and patient stories from client material |
| 07 | **The Invitation** | Offer restated, form, phone, location |

FAQ, financing and insurance fold **into** the beat they answer — financing belongs inside The Path
or The Invitation where the objection actually lands, not as its own band.

## Minimum per page

1. **6–8 named chapters** with `data-chapter` / `data-chapter-name`, in a non-shuffleable order.
2. **A hero with real motion** — split-text headline reveal, media wipe or scale, layered entrance.
   Not a static image with text on top.
3. **At least 3 scroll-driven chapters** — pinned and scrubbed, per the table above. Fade-up-on-
   scroll does not count, and neither does an `IntersectionObserver` class toggle.
4. **Chapter arrival *and* departure** — leaving a chapter is animated, not just entering it.
5. **Continuity devices** — reading progress, chapter tags, theme shifts across the arc.
6. **Interaction on every interactive element** — magnetic or cursor-aware CTAs, hover states with
   real transitions, animated accordions/tabs/sliders.
7. **Considered typography** — scale, weight contrast, and rhythm doing visible work. Fluid
   `clamp()` sizing.
8. **A signature moment** — one thing per page a visitor would remember and describe.
9. **`prefers-reduced-motion` honoured throughout.** Non-negotiable, medical audience.
10. **Mobile is designed, not degraded.** Most paid dental traffic is mobile; motion must survive.

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

- **Scrubbing is real** — step scroll through a pinned chapter and assert the content is at a
  *different intermediate state* at 25%, 50% and 75% of its range. A scrubbed scene that snaps
  between two states is a triggered scene wearing a costume, and this is the check that catches it.
- Pinned chapters actually pin, and release cleanly at both ends
- Reveals actually trigger at their scroll positions
- Counters, sliders, accordions, drawers work
- The reading-progress indicator tracks real document progress
- `prefers-reduced-motion: reduce` disables motion without hiding content
- No console errors; nothing depends on a plugin that failed to register

**Test in a focused tab.** Background tabs freeze transitions, IntersectionObserver, and timers,
so a backgrounded check will report broken animation that is actually fine.

### The static gate — `journey-audit.mjs`

Run before claiming a page is done:

```
node deliver/brandklout/scripts/journey-audit.mjs <page-dir> [...]
node deliver/brandklout/scripts/journey-audit.mjs --all      # from the orchestration checkout
```

It resolves linked CSS/JS before counting — a body-only grep reports a false zero when the motion
layer lives in a shared external file — and it scores chapters, pins, scrubs, GSAP usage, band-named
sections and reduced-motion guards.

Passing it is **necessary, not sufficient**: it catches the architectural failure, which is visible
in source, and cannot tell you whether a scrub actually scrubs. The focused-tab scrub proof and the
screenshot pass are still required. Baseline on 2026-08-06: **0 / 13 pages passed.**

## Responsive QA — screenshots, every page, every breakpoint

Separate from motion verification, and it needs the opposite tool. **Screenshots are the right
instrument for layout and responsiveness** — they are simply the wrong one for animation.

Capture every page full-height at each breakpoint and **look at the images**:

| Width | Represents |
| :--- | :--- |
| 360 | Small Android |
| 390 | iPhone |
| 768 | Tablet portrait |
| 1024 | Tablet landscape / small laptop |
| 1440 | Desktop |
| 1920 | Large desktop |

Store under `workflows/08-qa/.tmp/screenshots/<page-slug>/<width>.png`.

Check for, and fix:

- **Horizontal overflow** — the single most common failure. Assert
  `document.documentElement.scrollWidth <= window.innerWidth`. A page that scrolls sideways on
  mobile is broken, and it is invisible in a desktop-only check.
- Text clipped, overlapping, or shrunk below ~14px on mobile
- Tap targets under 44×44px
- Sticky/fixed bars covering content or each other — especially a sticky mobile call bar sitting on
  top of the form submit
- Images distorted, stretched, or overflowing their container
- Hero text unreadable over its media at narrow widths
- Nav/drawer opening, closing, and trapping focus correctly
- Motion that works at 1440 but breaks or janks at 390

Paid dental traffic is mostly mobile, so 360 and 390 matter more than 1920.

### Capture gotchas

- Use full-page capture (`captureBeyondViewport`), not just the viewport.
- **Let the page settle before capturing.** Pending fonts and per-section script embeds can
  truncate a capture silently; allow a generous settle window and confirm the image is not a
  partial paint.
- Lazy-loaded images often half-paint — scroll the page first, then capture.
- **ScrollSmoother breaks full-page captures.** Capture per-viewport-step and stitch, or
  temporarily disable smoothing for the capture pass only — never ship that change.
- Do not pipe capture scripts through `head`; SIGPIPE truncates the run mid-way.

## Definition of done

A page is not done when the sections exist. It is done when **all** of these hold:

1. **6–8 named chapters** in a fixed narrative order — no `band-*` / `section--<colour>` sections left
2. **At least 3 chapters where scroll drives the content**, pinned and scrubbed — not triggered
3. Chapters both arrive and depart; continuity devices present (progress, chapter tags, theme shifts)
4. Hero motion, interaction states on every interactive element, and a signature moment
5. `prefers-reduced-motion` disables motion without hiding content
6. Behaviour verified by driving the page on a **focused** tab — not by screenshots
7. Screenshots captured at all six breakpoints and **reviewed**, with responsive issues fixed
8. Zero horizontal overflow at 360 and 390
9. Offer, phone and form reachable at every scroll depth on mobile

The one-sentence test: **would a visitor describe this as a place they went, or a page they read?**
If it reads as a stack of cards with animation on it, it fails — rebuild the architecture, keep the
content. If it would not look out of place on awwwards, it passes.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../SYSTEM_RULES.md).
