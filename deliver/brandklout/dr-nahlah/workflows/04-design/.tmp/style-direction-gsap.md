# Style Direction — Home v2 (GSAP Journey)

Second version of the home page, built on GSAP 3.15 and restructured as a
**nine-chapter journey**. Package: [`final-design-gsap/index.html`](./final-design-gsap/index.html).

v1 ([`final-design/`](./final-design/)) is unchanged and still valid — this is an
alternative direction, not a replacement. Same brand, same assets, same content
argument; different ambition for motion and narrative.

## The brief

> Make a second version using GSAP. Keep all the custom code inside of the section.
> More scroll animations and beautiful interactions. Convert the page into a journey.

## What "journey" changed structurally

v1 was a sequence of well-behaved sections. v2 is a **narrated progression** with a
persistent sense of place: a nav readout that names where you are, a reading-progress
bar, and chapters that advance the argument rather than just listing services.

| # | Chapter | The move it makes |
| :-- | :--- | :--- |
| 00 | **Arrival** | Who this is. Headline splits into masked lines; the chapter recedes as you leave it. |
| 01 | **The Reality** | Names the visitor's situation — "you have probably been told this is complicated" — then reframes it. Copy brightens word by word, tied to scroll. |
| 02 | **The Difference** | The specialist argument — counters, a velocity-reactive marquee, and the us-vs-other-clinics comparison. |
| 03 | **The Specialist** | The doctor, his bio and eight verified credentials dealt in one line at a time. |
| 04 | **Transformation** | **Pinned.** Scroll physically wipes before → after across three real cases. |
| 05 | **The Path** | **Pinned horizontal.** You travel sideways through the four visits. |
| 06 | **The Standard** | In-house lab, 3D imaging, IV sedation, the practice — everything under one roof. |
| 07 | **The Proof** | Video, a patient's words, and the Google reviews grid. |
| 08 | **The Invitation** | Two offices, then the ask. |

The two pinned chapters are what make it read as travel rather than scroll. In
chapter 03 the visitor's own scrolling performs the transformation — the most
persuasive asset the practice owns becomes something you *do*, not something you look
at. Chapter 04 turns direction sideways, which resets attention right before the
close.

## Section-scoped code, as asked

Every `<section>` contains its own `<style>` **and** its own `<script>`. Nothing in
the global layer knows anything about a section's internals.

```html
<section class="ch-transformation" id="transformation" data-chapter="3" data-theme="light">
  <style> /* only this chapter's CSS */ </style>
  ...markup...
  <script> WZ.add(function(W){ /* only this chapter's animations */ }); </script>
</section>
```

The one shared piece is a ~40-line bootstrap exposing `WZ.add()`. Sections queue
their setup instead of running it immediately, and the flush block at the end of
`<body>` creates ScrollSmoother **first**, then runs the queue, then refreshes
ScrollTrigger. That ordering is not optional — see Gotchas.

This makes each chapter a self-contained paste unit for the Webflow build: copy the
section, its embed comes with it.

## Motion system

GSAP 3.15 with ScrollTrigger, ScrollSmoother, SplitText, ScrollToPlugin, Observer —
**all vendored locally** into `assets/gsap/` (204KB) so the package runs offline and
headless verification is deterministic. The Webflow build should load the same
versions from the GSAP CDN via Page Settings instead.

| Interaction | Chapter | Technique |
| :--- | :--- | :--- |
| Smooth scrolling | global | ScrollSmoother, `smooth: 1.05`, native on touch |
| Nav progress bar | global | `scrub` tween on `scaleX` from scroll start to `end:'max'` |
| Chapter readout | global | ScrollTrigger per section updates number + name in the nav |
| Masked line reveal | 00, 05, 06 | SplitText `type:'lines', mask:'lines'` |
| Hero departure | 00 | Scrubbed timeline — copy lifts, portrait drifts, veil darkens |
| Word-by-word brighten | 01 | SplitText words + scrubbed stagger, final clause resolves to gold |
| Photo drift | 01, 05 | `fromTo` yPercent/scale, `scrub` |
| Counters | 02 | Tweened object, `onUpdate` paints with locale formatting |
| Velocity marquee | 02 | Infinite `modifiers` loop, `quickTo` on `timeScale` from `getVelocity()` |
| **Scrubbed before/after** | 03 | Pinned 3.2 viewports; timeline drives `--pos` through three cases |
| **Horizontal travel** | 04 | Pinned; track `x` tied to scroll, `containerAnimation` triggers per card |
| Film scale | 05 | Scrubbed scale 1.16 → 1, plays only in view |
| Clip-path wipe | 05 | `inset(0 0 100% 0)` → `inset(0 0 0% 0)` |
| Magnetic buttons | global | `quickTo` on x/y, pointer-fine only |

## Accessibility

`prefers-reduced-motion` is a real branch, not a CSS afterthought:
- ScrollSmoother is never created
- **No pinning at all** — verified: `ScrollTrigger.getAll().filter(t => t.pin).length === 0`
- Chapter 03 renders the finished result rather than an un-wiped "before"
- Chapter 04 becomes a normal horizontally-scrollable region
- Counters print final values immediately

The progress bar is `aria-hidden` decoration; every chapter is reachable from the
nav, the drawer and the footer. ScrollSmoother is paused while the mobile drawer is open so
background content cannot drift under it.

## Verification — 61/61

`interaction-test-gsap.mjs` drives headless Chrome through 61 checks. It asserts the
things this build newly risks: that the transformation chapter really pins and for a
real distance, that scrolling actually moves `--pos`, that the wipe advances through
all three cases, that the horizontal track translates while pinned, that both the
path and nav progress bars fill, that the left rail is gone, that ScrollSmoother
constructed, that every section carries its own `<style>` and `<script>`, and that
reduced motion removes every pin.

```bash
python -m http.server 8901 --directory .tmp/final-design-gsap
node .tmp/interaction-test-gsap.mjs http://127.0.0.1:8901/index.html
```

## Gotchas found while building this

1. **Do not register GSAP plugins in `<head>`.** ScrollTrigger initialises against
   `document.body`; in `<head>` that does not exist, its internals end up undefined,
   and ScrollSmoother later dies with `Cannot read properties of undefined (reading
   'indexOf')` inside `getScrollFunc`. Register in the end-of-body flush.
2. **A fixed side rail needs reserved layout space**, or it sits on top of content —
   it needs a real gutter, its own scrim, and a light/dark inversion. That cost is why
   it was cut in favour of a nav progress bar. Lesson kept for future builds.
3. **`captureBeyondViewport` full-page screenshots are meaningless here** —
   ScrollSmoother transforms `#smooth-content`, so the capture is wrong. Use the
   scroll-slice driver.
4. **Test assertions must scroll to what they assert.** Three "failures" in this build
   were the test checking a reveal while parked above it.
5. **Guard clauses can pass vacuously.** `!smoother || smoother.paused()` reported PASS
   while ScrollSmoother was silently broken. Assert the positive.

## v1 vs v2 — which to show the client

| | v1 (`final-design/`) | v2 (`final-design-gsap/`) |
| :--- | :--- | :--- |
| Dependencies | none | GSAP 3.15 (204KB vendored) |
| Page height @1440 | ~8,700px | ~12,000px |
| Before/after | drag + keyboard, 3 tabs | scroll-scrubbed through 3 cases while pinned |
| Process | sticky rail, vertical | pinned horizontal travel |
| Structure | sections | 9 named chapters + nav progress |
| Webflow build cost | lower — IX2 covers most of it | higher — needs GSAP and custom embeds |
| Checks | 31/31 | 61/61 |

v2 is the stronger award-site submission. v1 is the safer, cheaper build and degrades
more gracefully on old hardware. My recommendation is to show the client v2 and keep
v1 as the fallback if the Webflow budget or timeline tightens.

## Open questions

**Resolved in v2**: the unverified stats. All four homepage figures now come from the
practice's own published material, and three factual errors in the earlier draft were
corrected (see `structure-comparison.md`). **v1 still carries the old figures.**

**Still blocking**: Google review text (the grid ships as marked placeholder), patient
photo consent for the before/after cases, no vector logo, and the McLean phone-number
conflict. See [`style-direction.md`](./style-direction.md).

## Version Control
- Follows the version control rules in [SYSTEM_RULES.md - Section 4](../../../../SYSTEM_RULES.md).
- `final-design-gsap/index.html` and the vendored `assets/gsap/*.js` are committed;
  image, video and screenshot binaries are gitignored and sync to the VPS.

## Structural gap vs. the reference — largely closed

The reference home has **14 blocks**. v2 originally had 7 chapters and dropped 7 of
them; four were then built (comparison table, doctor bio + credentials, technology /
in-house lab, reviews grid), taking v2 to **9 chapters**. Remaining: case-study
carousel, award badges, secondary services list — all need client content. Full audit
and the factual corrections it surfaced: [`structure-comparison.md`](./structure-comparison.md).

**No stock imagery was used** — the client's own asset library covered every gap.
