# QA Report — Arvada Dental Center &amp; Implants

**Asana parent task**: `1217040406855586`
**Six landing pages, rebuilt as journeys and re-verified 2026-08-06.**

The client reviewed the first round and rejected it as *"a plain card website design"* rather than
*"an interactive journey"*. That was an architecture problem, not a polish problem, so the pages were
rebuilt rather than patched. This report is the evidence for the rebuild.

Every number below comes from a script in this folder, and every script can be re-run.

---

## What is being verified, and by what

Four gates, because they answer four different questions and none of them substitutes for another.

| Gate | Question | Instrument |
| :--- | :--- | :--- |
| [`journey-audit.mjs`](../../../../scripts/journey-audit.mjs) | Is this a journey or a stack of bands? | Static read of the shipped HTML, with external CSS/JS resolved |
| [`content-gate.mjs`](content-gate.mjs) | Has a fabrication got back in? | Static read of the shipped HTML |
| [`scrub-proof.mjs`](scrub-proof.mjs) | Is the motion **real**, or triggered? | Chrome DevTools Protocol, focused tab |
| [`shots.mjs`](shots.mjs) | Does it hold together at every width? | Six-breakpoint capture, overflow assertion, interaction pass |
| [`price-check.mjs`](price-check.mjs) | Can any price ever display a figure the practice does not charge? | CDP, 60 scroll samples per page |

> [!IMPORTANT]
> **A screenshot cannot verify this build, and the static audit cannot verify the motion.** The pages
> are scroll-driven: a full-page capture photographs the document at scroll 0, where the pinned
> chapters are deliberately mid-assembly. And a static audit can prove a page *has* `pin: true` and
> `scrub:` but not that anything actually moves. Both driven checks are required, and both run on a
> **focused tab** — a background tab freezes transitions and timers and reports working motion as
> broken.

Machine-readable results: [`scrub-proof.json`](scrub-proof.json), [`shots-report.json`](shots-report.json).

---

## Gate 1 — Journey architecture

`node deliver/brandklout/scripts/journey-audit.mjs <page-dir>`

| Page | Chapters | Pins | Scrubs | GSAP | split | IO | band | reduced-motion | Verdict |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | :--- |
| `implants` | 8 | 3 | 10 | 80 | 16 | 0 | 0 | 3 | **PASS** |
| `aox` | 8 | 3 | 10 | 76 | 16 | 0 | 0 | 3 | **PASS** |
| `veneers` | 8 | 3 | 10 | 82 | 16 | 0 | 0 | 3 | **PASS** |
| `emergency` | 7 | 3 | 10 | 75 | 16 | 0 | 0 | 3 | **PASS** |
| `dentist-near-me` | 7 | 3 | 10 | 71 | 16 | 0 | 0 | 3 | **PASS** |
| `next-door` | 7 | 3 | 10 | 73 | 16 | 0 | 0 | 3 | **PASS** |

**6/6 pass.** Before the rebuild it was **0/6**, with `chapters 0, pins 0, scrubs 0, GSAP 0` and 6–11
`band-*` sections per page.

Two notes on reading that table honestly:

- **`scrub: 10` counts 8 of ours plus 2 inside `ScrollSmoother.min.js`.** The audit inlines local
  `.js` files and the vendored plugin contains the literal string twice. The real per-page figure is
  **8 authored scrubs** — 6 in the page's own chapter scripts and 2 in the shared boot.
- **`IO: 0` is the point of the exercise.** The previous build's entire motion layer was 6
  `IntersectionObserver` calls. An observer can only report *this is now visible*; it cannot express
  *how far through* a scene you are, which is what every scrubbed moment depends on.

---

## Gate 2 — Content and fabrication guard

`node content-gate.mjs` — **192/192 checks pass.**

This is the check with real-world consequences for a real dental practice, and it survived the
architecture rebuild unchanged in substance. Per page it asserts:

- **The three fabrications Brandklout flagged stay out.** The 4.8 / 1,000+ review aggregate and any
  star or rating language; the named finance partners and the soft-pull credit claim that rode on
  them; before/after and "real patient" framing. Also `aggregateRating` in structured data, which is
  a Google policy violation on top of the credibility problem.
- **Claims this practice cannot honestly make stay out** — 24/7, walk-ins, *guaranteed* same-day,
  "painless", unsourced success rates.
- **The conflicting `$14,999` price variant and the `(720)` tracking line stay out** pending answers
  (Open Questions 1 and 2).
- **No commercial terms of ours anywhere** — Brandklout is a partner engagement, so
  `PRICING_TIMELINE_RULES.md` does not apply here. The practice's own patient-facing prices are page
  content and are expected.
- **Journey integrity** — 6–8 chapters, numbered `0..n` with no gaps, unique names, and no section
  class or chapter name derived from a background colour or a spacing value.
- **Conversion survives the redesign** — a `tel:` link in the nav, the body and the action bar; a
  lead form; the sticky mobile bar; the skip link; the reading-progress bar; the chapter readout.
- **Accessibility basics** — every `<img>` has `alt`, the reduced-motion guard and the no-JS fallback
  are declared *in the page* rather than only in the shared kit, and GSAP registers in `<body>`.

One false positive surfaced while writing this and was fixed: the rating regex was matching
`aspect-ratio: 4/5` in CSS. The guard now strips `<style>` blocks before reading copy, but keeps
`<script>` in scope, because chapter captions genuinely live in the per-chapter scripts.

---

## Gate 3 — Scrub proof (the new one)

`node scrub-proof.mjs` — driven over CDP on a **focused** tab.

For every pinned chapter the harness step-scrolls to 25 %, 50 % and 75 % of that chapter's own scroll
range and takes a **state signature**: opacity, transform matrix, colour, clip-path, position and
leaf text of every descendant. The three signatures must be **mutually distinct**. Anything that snaps
between two states is triggered, not scrubbed, and fails here.

It also asserts per pin that ScrollTrigger's own `progress` tracks the target (0.25 / 0.50 / 0.75),
that the element is genuinely held while pinned, and that the pin releases cleanly at both ends.

| Page | Pinned + scrubbed chapters | States distinct | Pin held | Clean release |
| :--- | :--- | :---: | :---: | :---: |
| `implants` | 01 The Gap · 02 The Anatomy · 05 The Path | 3/3 each | ✓ | ✓ |
| `aox` | 01 The Verdict · 03 The Four · 04 The Day | 3/3 each | ✓ | ✓ |
| `veneers` | 01 The Mirror · 03 The Design · 04 The Method | 3/3 each | ✓ | ✓ |
| `emergency` | 01 Right Now · 02 The First Minutes · 04 When You Arrive | 3/3 each | ✓ | ✓ |
| `dentist-near-me` | 01 The Search · 02 The Offer · 04 The Practice | 3/3 each | ✓ | ✓ |
| `next-door` | 01 Twenty-Two Years · 03 The Whole Household · 04 The Voices | 3/3 each | ✓ | ✓ |

**18/18 pinned chapters proven scrubbed.** Plus, per page:

- **Reading progress tracks real document progress** — the bar's `scaleX` compared against
  `scrollY / (scrollHeight - innerHeight)` at three depths, tolerance 0.18.
- **The action bar is armed past the fold**, carrying both a `tel:` link and a route to the offer.
- **`prefers-reduced-motion: reduce` disables motion without hiding content** — zero pinned triggers,
  ScrollSmoother never created, and zero leaf text nodes left at `opacity < 0.05` or
  `visibility: hidden`.
- **Zero console errors** across all twelve page loads.

### Four harness bugs worth recording, because every one of them blamed the page

None was a page fault, and each could have been "fixed" by weakening the pages instead.

1. **Measuring the `<section>` instead of the pinned element.** ScrollTrigger pins the inner stage
   and grows the section to hold the pin-spacer, so the section keeps scrolling normally. Every pin
   reported `pinned: no`. Read `trigger.pin`, not the section.
2. **CDP serialises `-0` as `unserializableValue`, with no `value` field.** A pin held *perfectly*
   measures a rect top of exactly `-0`, so a probe reading `result.value` alone got `undefined` and
   reported the element as missing — for the pins that were working best. Ten of eighteen apparent
   failures were this. Normalised with `| 0`, plus an `unserializableValue` fallback.
3. **`scrollTo` is instant; ScrollSmoother is not.** Native `scrollY` jumps immediately while
   ScrollTrigger follows the *smoothed* position for about a second afterwards. Comparing the two
   before the glide settles reported the progress bar as mistracking and a released pin as still
   engaged. Settle waits raised to ~1.5 s after every programmatic scroll.
4. **A fixed remote-debugging port.** When a previous run's Chrome had not fully exited it kept the
   port; the next launch exited immediately and the run died with *"Chrome did not expose a debugging
   port"*. That produced several apparent page failures and one silently stale result file. The port
   is now derived per process, and the consolidation step refuses to merge a result file whose
   recorded page name does not match the page it is being merged as.

---

## Gate 4 — Responsive capture, six breakpoints

`node shots.mjs` → `screenshots/<page-slug>/<width>.png`

360 · 390 · 768 · 1024 · 1440 · 1920, every page, full height, **and reviewed**. A second set at
`screenshots/<page-slug>/motion/<width>.png` shows the shipped motion state parked mid-journey.

**Why the required `<width>.png` files are captured under `prefers-reduced-motion: reduce`:** a
full-page capture photographs the document at scroll 0, and the pinned chapters are deliberately
mid-assembly until scrolled. Capturing them cold photographs empty stages and tells you nothing about
layout. Reduced motion is the one state where every chapter renders complete and in normal flow, so
it is the honest full-page view — and it doubles as evidence that reduced motion hides nothing.

ScrollSmoother is disabled for both capture passes (`?nosmooth=1` for the motion pass) because it
transforms the content rather than scrolling it, which breaks `captureBeyondViewport`. That flag is a
capture-time URL parameter and appears nowhere in the shipped markup.

Asserted at every width, in **both** the reduced and the shipped motion state:

| Check | Result |
| :--- | :--- |
| `documentElement.scrollWidth <= innerWidth` — zero horizontal overflow | 72/72 |
| Broken images (`complete && naturalWidth === 0`) | 0 |
| Console errors | 0 |
| Tap targets under 40 × 40 px | 0 |
| Text under 11.5 px | 0 |

### Interaction, at 390 — where the traffic actually is

Run once per page against the shipped motion build:

| Check | Result |
| :--- | :--- |
| Offer, phone or action bar reachable at 0 / 25 / 50 / 75 / 100 % scroll depth | 6/6 |
| FAQ opens and reports `aria-expanded` | 6/6 |
| Stepped qualifier advances to question 2 | 2/2 — implants and aox, the only pages with one |
| Lead form rejects an empty submit with a styled inline error | 6/6 |
| Lead form confirms in place and captures the payload | 6/6 |

---

## Defects found by this pass, and fixed

Screenshot review is worth nothing unless it changes something. Three things did.

1. **The nav logo was near-invisible.** The dark-blue lockup was sitting on the near-black nav bar at
   roughly 1.5:1. The practice publishes a light variant of the same mark, and the nav now uses that
   one — no filter hacks and no recolouring of someone else's logo.
2. **Pinned chapter headlines could slide under the fixed nav.** A pinned stage centres its content
   in the viewport and the nav is fixed on top of it. Reserving top padding was not enough on its
   own, because `align-content: center` overflows a too-tall scene *equally* in both directions.
   Fixed centrally with `align-content: safe center` / `justify-content: safe center`, which falls
   back to `start` the moment the content does not fit — centred when it fits, fully readable when it
   does not.
3. **Native validation was pre-empting the styled inline errors.** Clicking submit on a form with
   `required` fields let the browser block the event before the page's own handler ran, so the
   styled, `aria-live` field errors never appeared. The forms now carry `novalidate`; `required`
   stays for assistive tech, and one consistent validation path owns the messaging.
4. **A scrubbed price displayed a price the practice does not charge.** The `dentist-near-me`
   capture caught the offer chapter reading **"YOUR FIRST VISIT — $43"** mid-scrub, on the way to
   $109. A scrubbed number does not animate past a wrong value, it *sits* at it for as long as the
   visitor stays there. **No published price on any of these six pages counts up any more.** The
   offer total now reads as pending (`—`) until every line item is in, then arrives; the two
   `$18,795` figures animate their entrance, not their value. Counting is still used where the
   intermediate values are true and meaningful — the year running 2003→2025, implants placed 0→4,
   and the four-step emergency dial.

   This one is worth generalising for the batch: **animate the arrival of a number, never its
   value, when the number is a price.**

   It is now a standing gate rather than a one-off fix. `price-check.mjs` walks each page in 60
   scroll steps and asserts that every `.price`, `.offer__price` and offer total displays **only**
   its real value at every depth:

   | Page | Values ever displayed |
   | :--- | :--- |
   | `implants`, `aox` | `$18,795` |
   | `dentist-near-me` | `—` then `$109` |
   | `next-door` | `$109` |
   | `veneers` | `Free` |
   | `emergency` | no price element |

---

## What this report does **not** cover

- **Live traffic readiness.** Twelve Open Questions remain in
  [project-overview.md](../../../docs/project-overview.md). The three that block launch are the
  conflicting full-arch price, the phone number paid traffic should use, and where form submissions
  should post. All six pages currently use the practice's main line — **no per-page call-tracking
  numbers were supplied**, so they are not distinct.
- **Image rights.** Every image is client-hosted from `arvadadentalcenter.com`, but several are
  evidently licensed stock the practice already runs. Nothing on these pages is captioned or framed
  as a patient, a result, or a before/after — the three scenes that wanted a transformation are SVG
  illustrations labelled as such — but rights still need confirming.
- **Clinical sign-off** on the veneer service-life ranges carried from the vendor's `index_1.html`
  (Open Question 12). They are presented as general characteristics of the materials, not as a
  promise by this practice.

## Addendum — the house fluid root font-size (2026-08-07)

The pages now carry the house fluid root
([`deliver/process/04-design/fluid-root.md`](../../../../../process/04-design/fluid-root.md)),
installed once as the first rule of `_shared/journey.css`. `html` font-size interpolates with the
viewport on `webzite-house-v1`: 12px at 320, ramping to **16px at 479, flat to 1440**, then 18px at
1920 and 20px at 2400.

**A fifth gate**, [`root-proof.mjs`](./root-proof.mjs), was added for it. The static check
(`scripts/fluid-root.mjs --check`) can only see that the snippet is in the file; it cannot see a
reset, a vendor sheet or a stray `html{font-size}` winning later in the cascade. `root-proof.mjs`
asks a real, focused browser what the computed root font-size actually is at 26 widths and compares
it with the generator's own table, then measures what the reader gets.

| Check | Result |
| :--- | :--- |
| `fluid-root.mjs --check` | **7/7 pages**, 0 problems (was 0/7, 47 `clamp()` font-sizes) |
| computed root vs `webzite-house-v1` | **156/156 measurements exact** (26 widths x 6 pages) |
| reading text below 480px | **>= 16px everywhere**, at every real phone width |
| tap targets | 0 under 44px |
| 479/480 seam | root 16.00 -> 16.00, largest type step **0.0%** |
| journey-audit / content-gate | 6/6 and 192/192, unchanged |
| shots | 72 captures, 72 no-overflow, 0 broken images, 0 console errors, 6/6 interaction |
| scrub-proof / price-check | 18/18 pins, prices clean |

### Why the pages needed more than a search-and-replace

The rule is "no `clamp()` font-size", and the replacement is "the plain `rem` that preserves the
rendered size at 1440". That is sufficient only where the `clamp()`'s `vw` term was inactive. It was
not, for display type: `--d1` was `clamp(2.4rem, 6.4vw, 6.4rem)`, which rendered **49px at 768** and
92px at 1440. The 1440-preserving `5.76rem` renders 92px at *both*, because the root is flat across
that whole range — the hero headline would have nearly doubled on a tablet.

So display type is `calc(<rem> * var(--s-d1))` and the responsive curve lives in one block of `px`
media queries that step five multipliers. Each band is solved against a width where the old
rendering is known, so **768, 1024 and 1440 reproduce the approved sizes exactly** and 360/390 land
within 3%. The text multiplier `--s-tx` runs the other way: below 479 the root ramps down to 12px,
so text has to grow in `rem` terms to hold its size, and grow further to clear the 16px floor. Its
bands are solved at each band's *narrow* end, because 320, 375, 412 and 414 are all real phones and
all sit near a band edge.

Body copy below 480px now renders 16.3-17.6px, against 15.2px in the approved design. Above 480 the
approved sizes are untouched.

### Two defects the inspection turned up

- **`.faq__q` fell to 40px tall at 320**, under the 44px touch minimum, without a single declaration
  changing: the row is built from `rem` padding and the fluid root shrinks a `rem` to 12px there. It
  now carries `min-height:44px` in `px`, deliberately outside the scale.
- **The nav's open/closed pill never hid.** `.status{display:inline-flex}` is defined after
  `.nav-status{display:none}` at equal specificity, so source order beat the author's intent at
  every width, and on a 360px screen the pill pushed **the phone number — the primary CTA — off the
  right edge**. `body{overflow-x:hidden}` is why the overflow assertion never saw it. Pre-existing,
  unrelated to the fluid root, fixed here because it was visible in this round's evidence.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../../../SYSTEM_RULES.md).
