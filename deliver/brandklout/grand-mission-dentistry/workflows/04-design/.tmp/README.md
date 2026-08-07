# Grand Mission Dentistry — landing page packages

Three self-contained HTML/CSS/JS packages for Asana parent task
[`1217040406855578`](https://app.asana.com/1/1210572425689866/task/1217040406855578).

| Package | Asana task | Chapters | Pinned scenes |
| :--- | :--- | :--- | :--- |
| [`implant-landing-page/`](implant-landing-page/) | `1217133289235653` | 8 | The Loss · The Answer · The Options |
| [`cosmetic-landing-page/`](cosmetic-landing-page/) | `1217072657902270` | 7 | The Work · The Standard · The Proof |
| [`thank-you-landing-page/`](thank-you-landing-page/) | `1217162605683014` | 6 | The Path · The Preparation · The Place |

Built to [DESIGN-STANDARD.md](../../../docs/DESIGN-STANDARD.md).

---

## Journey architecture — chapters, not bands

**This is the thing the second review round was about, and it is structural rather than
decorative.** The first build was a vertical stack of coloured strips — `section--light`,
`section--tint`, `stats section--dark` — each holding a grid of cards, each independent of the ones
above and below. You could swap any two and nothing broke, because nothing was ever connected.
Adding animation to that does not fix it; it produces a stack of cards with animation on it.

Every section on every page is now a **named narrative beat** carrying `data-chapter` and
`data-chapter-name`, in an order that cannot be shuffled. The class name says what the beat does to
the reader — `.ch-loss`, `.ch-candidacy`, `.ch-invitation` — never what colour it is. Atmosphere
moves through the arc via `data-theme` instead of two tints alternating forever.

> **Smell test.** If a section class is named for a background or a spacing value, that section has
> not been designed yet. `journey-audit.mjs` fails the page on exactly that.

### Implant — 8 chapters

| # | Chapter | Job | Scroll-driven? |
| :--- | :--- | :--- | :--- |
| 00 | Arrival | The offer, the price, the candidacy quiz | Entrance timeline + scrubbed departure |
| 01 | **The Loss** | What a gap actually costs | **Pinned + scrubbed** |
| 02 | **The Answer** | Why an implant, and the evidence | **Pinned + scrubbed** |
| 03 | **The Options** | The four things we place | **Pinned horizontal** |
| 04 | The Candidacy | Am I a candidate; what has to happen first | Wipes, drift, staggered reveals |
| 05 | The Specialist | Dr. Sung, real reviews, real cases | Velocity-reactive marquee, gallery drift |
| 06 | The Terms | Insurance, financing, and every objection under them | Scrubbed matrix rows |
| 07 | The Invitation | Reviews, offer restated, phone | Scrubbed glow |

Asana's seven-section spec maps on intact: hero (00), solution breakdown (01–03), eligibility and
preliminary procedures (04), insurance and financing matrix (06), doctor spotlight and testimonials
(05), FAQ (folded into 06, where the objection actually lands), reviews (07).

**01 The Loss** — the page stops and the sentence is written word by word as you scroll, while a
ridge gauge narrows in step with it and lands on the client's own figure: *up to 25% of jawbone
width lost in the first year*. The statement and the number are the same fact told twice.

**02 The Answer** — a scan line travels down a real implant photograph. The image resolves from grey
to full colour behind it (`clip-path` inset driven by scroll), and each of the six reasons lights as
the line reaches it. The two survival figures resolve at the same time.

**03 The Options** — the signature. The page holds and the four solutions travel sideways under a
fixed heading, with a progress bar driven by `self.progress` and the centre panel coming up to full
colour. On a phone this is a real swipe rail with scroll-snap — designed for the thumb, not a pin
that has been switched off.

### Cosmetic — 7 chapters

| # | Chapter | Job | Scroll-driven? |
| :--- | :--- | :--- | :--- |
| 00 | Arrival | Offer, free second opinion, form | Entrance + scrubbed departure |
| 01 | The Hands | The two dentists who do the work | Counter-drifting portraits |
| 02 | **The Work** | The six services | **Pinned + scrubbed** |
| 03 | **The Standard** | Why this practice | **Pinned + scrubbed** |
| 04 | **The Proof** | Eight real patient cases | **Pinned horizontal** |
| 05 | The Voices | Real reviews | Staggered reveals |
| 06 | The Invitation | Offer restated, phone | Scrubbed glow |

Asana order preserved exactly: hero (00), meet the cosmetic doctors (01), service offerings grid
(02), why choose Grand Mission (03), social proof and patient gallery (04), sticky mobile bar
(global), reviews (05).

**02 The Work** — a marker travels the six-item index continuously while the stage swaps to whatever
it has reached. Scroll position *is* which service you are looking at. A grid of six identical cards
says "we do six things"; this says "here is each one".

**03 The Standard** — the three reasons take the stage one at a time as the page holds.

**04 The Proof** — the signature. Eight real before/after cases travel sideways, the centre one
coming up to full colour.

### Thank-you — 6 chapters · shared archetype

Mason Park Dental has an identical four-section thank-you spec. Reuse this package there rather than
rebuilding: swap `PRACTICE` in `app.js` and the practice details in the markup. Nothing else is
client-specific.

| # | Chapter | Job | Scroll-driven? |
| :--- | :--- | :--- | :--- |
| 00 | Arrival | The receipt stamp — **signature moment** | Entrance + scrubbed departure |
| 01 | The Fast Track | Call now, and whether anyone is there | Lift-in, live open/closed pill |
| 02 | **The Path** | Three steps, no surprises | **Pinned + scrubbed** |
| 03 | **The Preparation** | The two things worth bringing | **Pinned + scrubbed** |
| 04 | The Team | Who you will actually meet | Wipe + drift |
| 05 | **The Place** | Where to go, and when they are open | **Pinned + scrubbed** |

Asana's four sections are all present and in order — status banner (00), fast-track call box (01),
what to expect (02), practice details and map (05). Chapters 03 and 04 are built from copy that was
already on the page, promoted out of the footer into beats of their own; nothing was invented.

**The receipt stamp** is the signature: the ring lands on a `back` ease, the check draws itself along
its own path via `stroke-dashoffset`, and a ripple expands past the ring. A confirmation page has one
emotional job — make it look like something actually happened.

---

## Continuity devices

- **Reading progress** along the bottom edge of the header, scrubbed against real document progress.
- **Chapter tags** — `01 · The Loss` — with a rule that draws itself in as the tag arrives.
- **A chapter readout in the header** (≥1080px): the number and name of the beat you are in, plus a
  bar showing how far through the arc that is.
- **Theme shifts** via `data-theme`, so the arc turns dark and comes back.

## Conversion floor

Motion serves the offer. The phone number and the form stay reachable at every scroll depth: fixed
header, sticky mobile call bar below 800px, and a CTA in every chapter. Verified, not assumed —
`form is reachable from the deepest point of the page` is a check.

**Per-page call-tracking numbers are deliberately distinct**: implant `(281) 747-5929`, cosmetic
`(281) 729-4615`, thank-you the main line `(281) 789-8836`. That is what makes paid-channel
attribution possible. See the open question below.

---

## Type scale — the fluid root

These packages carry the house fluid root font-size
([`deliver/process/04-design/fluid-root.md`](../../../../../process/04-design/fluid-root.md)). It is
the **first rule of `_vendor/kit/kit.css`**, above the brand `:root`. There is no `clamp()` on any
`font-size` anywhere in the build and no `px` font-size; `node scripts/fluid-root.mjs --check` on
this directory exits 0.

The root is flat 16px from 479 to 1440, so it only moves the design below 479 and above 1440. Two
consequences shaped the scale, and both are design decisions rather than mechanical swaps:

- **Text is anchored at 390, not 1440.** Body copy has to clear 16px on a phone, and at 390 the root
  is 13.76px, so `--body` is `1.17rem`. That forces the desktop size from 15.5px to 18.7px — there is
  no value that satisfies both, and the mobile floor wins. Every bare `rem` font-size in the build
  moved by the same 1.206 factor, so the relationships inside the text tier are unchanged.
- **Display type needs a staircase.** The hero was authored at `7vw` (46px at 390, 101px at 1440);
  a plain `rem` is constant across 479–1440 and cannot be both. `--d1` and `--h2` therefore step at
  1199 and 767 — px queries, tokens only, 1440 exact. The reasoning and the measured overflow
  ceilings are in the comment block in `kit.css`.

`_vendor/kit/kit.css` is the source of truth and is **manually copied** into each package. After
editing it:

```bash
for p in implant-landing-page cosmetic-landing-page thank-you-landing-page; do
  cp _vendor/kit/kit.css $p/assets/kit.css; cp _vendor/kit/wz.js $p/assets/wz.js
done
```

Forget the re-sync and every gate reports the old behaviour, because the pages never load the file
you edited.

---

## Verification

```
node verify.mjs               # all three pages, one process each
node verify.mjs implant       # one package
node qa-shots.mjs             # six breakpoints per page → ../../08-qa/.tmp/screenshots/
node ../../../../../../scripts/fluid-root.mjs --check .   # fluid root compliance
```

**146 checks, all passing.** Screenshots at 360 / 390 / 768 / 1024 / 1440 / 1920, no horizontal
overflow at any breakpoint.

### The scrub proof

The check that matters. For every pinned chapter, `verify.mjs` reads the range off the live
`ScrollTrigger`, steps the page to **25%, 50% and 75%** of it, and asserts the scene is in three
*different* intermediate states. A scene that snaps between two states is a triggered scene wearing a
costume, and this is what catches it.

Chapters declare what to sample with `data-scrub-probe` in the markup, so the proof knows nothing
about what any individual scene is doing — it reads `transform`, `clip-path` and text content and
compares. It also asserts each pin holds the viewport while it plays and releases cleanly at both
ends.

### Traps that cost real time here

- **`body { overflow-x: hidden }` hides horizontal overflow from every document-level check.**
  `qa-shots.mjs` compares `documentElement.scrollWidth` against `innerWidth` and reported "no
  overflow at any breakpoint" while a hero headline was pushing 142px past its column and being
  silently clipped. Only a per-element `scrollWidth > clientWidth` sweep finds it. The related trap:
  measuring the *grid item* is circular, because `min-width: auto` already stretched it to fit the
  word — measure the `.shell`, which has an explicit width and cannot absorb the overflow.
- **A long word, not the line, caps display type.** `min-width: auto` on a grid item refuses to
  shrink below the widest single word, so the hero ceiling is set by "destination" (5.71em) in the
  cosmetic h1 — 4.2rem at 320px, where the shell is only 290px. Measure the ceiling by setting the
  token live and reading `shell.scrollWidth`; do not estimate it from glyph widths.
- **CDP cannot serialise `-0`.** A pinned element sitting a sub-pixel above the viewport top rounds
  to `-0`, which arrives as `unserializableValue` with `value` undefined. Reading `.value` returned
  undefined and reported three working pins as broken.
- **SplitText `autoSplit` vs pins.** When the webfont swapped, SplitText re-split every headline and
  replaced those nodes — including headings living inside a ScrollTrigger pin-spacer. The next
  refresh threw `NotFoundError: insertBefore` while unwrapping, *between* its revert and re-apply
  phases: spacers gone, triggers keeping stale start/end, document silently ~3,700px shorter than
  ScrollTrigger believed. Every `scrollTo` then landed in the wrong chapter. `wzFlush()` now waits
  for `document.fonts.ready` (raced against 1.8s) before anything is pinned.
- **Never kill a GSAP-owned tween inside a `matchMedia` cleanup.** The context already reverts
  everything created inside it; killing it again double-reverts and strips the pin spacers. Return a
  cleanup only for state GSAP does not own — class toggles, event listeners.
- **`ScrollTrigger.maxScroll(window)`, not `body.scrollHeight - innerHeight`,** is the authoritative
  scroll maximum under ScrollSmoother. The latter over-reports and made a correct progress bar look
  like it lagged by 40%.
- **`offsetTop` reads 0** inside the smoother's transformed content. Use `getBoundingClientRect`.
- **A scrubbed ScrollTrigger with no animation attached never fires `onUpdate`** — it has nothing to
  interpolate. Scrub a proxy object and paint from that.
- **Test in a focused tab.** A backgrounded renderer freezes timers, and the symptom is not "the
  animation looks wrong" — it is the CDP call never returning at all.
- **One browser per page.** A single long-lived instance driving three heavy pinned pages wedged its
  renderer at a different point on nearly every run. `verify.mjs` with no argument now spawns one
  process per page.
- **ScrollSmoother breaks full-page captures**, so `qa-shots.mjs` runs the reduced-motion pass —
  where no smoother exists and every chapter is painted at its resolved state.
- **Cross-origin iframes never paint into `captureBeyondViewport`.** The location map looks blank in
  every screenshot and is fine; it is proven by its `load` event instead.
- **`position: fixed` bars render at the top of a full-page shot.** The sticky call bar appearing
  mid-page in a capture is the capture, not the page.

### What screenshot review caught that behaviour checks could not

- The hero eyebrow was `--blue` on navy — a mid-blue picked for white grounds, barely legible on the
  arrival chapter, which is the one place `.label` sits on a dark background without a `data-theme`
  to catch it.
- `.doc--rev` swapped the doctors' *order* but not the grid track, so Dr. Nguyen's portrait rendered
  at nearly twice the size of Dr. Sung's.
- `.ch__pin`'s `min-height: 100svh` still applied below the pin breakpoint, leaving a screenful of
  dead space above and below short content on exactly the devices with the least of it.
- The thank-you header CTA wrapped to two lines at 360px and crowded the logo.
- `.status__meta` centred its row, so once it wrapped the last item floated alone under two
  full-width ones.

---

## Content rules

Every headline, bio, review, price and offer is the client's own — from the two vendor originals
attached to the Asana parent task and from grandmissiondentistry.com. Nothing about a real dental
practice is invented: no fabricated testimonials, patient stories or statistics. The four figures in
the implant page (96.8% ten-year survival, up to 25% ridge loss, ~40 years documented, 1,700+ Google
reviews) all come from the client's own published material.

The rebuild changed **how the pages are built, not what they say.**

## Still open with Brandklout

1. **Which implant price is live** — the client's site says *"starts at $2,999"*; the vendor page
   sells *$3,499 with $500 off paid in full*. One value in `app.js`.
2. **Which financing partners are current** — live site names Cherry only; the originals name
   Alphaeon, LendingClub and CareCredit. The matrix currently lists all four.
3. **GHL endpoint** — both lead tasks require the form to post to GoHighLevel and no grant exists.
   `LEAD_ENDPOINT` is `null`; the forms validate, trap bots and show their success state, so the
   pages review end to end without GHL.
4. **Call-tracking numbers** — if the per-page numbers belong to the outgoing ad company they may be
   disconnected at handover, at which point every CTA on those pages dies silently. Fallback to the
   main line is a two-line change in each `app.js`.
5. **Office hours** — the two vendor pages publish two different sets. These pages follow the
   client's own current site.
6. **Build destination** — the live site is already Webflow, which needs a per-client grant that does
   not exist yet.
