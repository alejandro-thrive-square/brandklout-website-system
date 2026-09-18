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
- **Chapter tags.** `The Transformation` — visible, animated in, naming the beat the reader is in.
  **Named, never numbered.** A visible "Chapter 04" counts sections the visitor has not read yet,
  and on a template-driven page the same beat lands on a different number depending on how much
  copy that page happens to carry — so the numeral is noise that also contradicts itself between
  pages. Keep `data-chapter` on the section (the motion runtime binds to it); drop the numeral from
  the tag and from the fixed readout.
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

**A paid set is three pages, in the agency's reference flow, and it is not the service page.**
(Added 2026-09-18.) Mason Park's first cut derived its ad pages from the organic service page and
added a form chapter near the bottom; the agency rejected it: *"these landing pages should have the
same flow of information that Livewell has."* The reference set is
`www.livewelldentalva.com/ads-landing-pages/`. Per campaign: a **landing** page with the lead form
**in the hero**, the emotional journey, why here, the dentist, options, the process, proof, the
space, a dedicated FAQ and a final CTA with credentials and a disclaimer; a **consultation** page
that is the form first, then patient proof and the dentist; a **thank-you** page that is the phone
first, what to expect on the call, why here, the FAQ, and **no form**. All three live under
`/ads-landing-pages/`, and every landing CTA goes to the consultation page. The flow is the
agency's; the section shapes, photography and copy are the client's own. Where a client publishes
no before-and-after cases the gallery is not reproduced: use their reviews and their rooms. The
dedicated FAQ is the one deliberate exception to the folding rule above.

**Name nothing on a paid page `ad`.** Classes such as `is-ad`, `ad-hero` and `ad-rail` are on ad
blockers' cosmetic lists, and the published element collapses for every blocked visitor while the
local render stays perfect. Use `lp-*`.

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
7. **Considered typography** — scale, weight contrast, and rhythm doing visible work, sized off the
   **fluid root font-size** (see [fluid-root.md](../../process/04-design/fluid-root.md)). Type,
   spacing and radii in `rem`; **no `px` font-sizes and no `clamp()` font-sizes** — the fluid root
   already does that job, and `clamp()` on top of it scales twice.
8. **A signature moment** — one thing per page a visitor would remember and describe.
9. **`prefers-reduced-motion` honoured throughout.** Non-negotiable, medical audience.
10. **Mobile is designed, not degraded.** Most paid dental traffic is mobile; motion must survive.

## Brand palette — sample the token layer, not a stray rule

Take the palette from the client's **published stylesheet token block**, not from whichever colours
happen to appear in it. Fetch `https://cdn.prod.website-files.com/<siteId>/css/<shortName>.webflow.shared.*.css`
and read the `:root` primitives — Webflow writes the real design tokens there under names like
`--_primitives---brand--gold`. Confirm the pick by frequency across the whole file: the brand
colour is the one used dozens of times, and the page ground is whatever `body{background-color:…}`
resolves to.

The Arvada build got this wrong and all six landing pages had to be re-themed after the client saw
them. The source comment said the palette was "sampled from the practice's own stylesheet", and
`#03c5ec` genuinely *was* in that stylesheet — on three leftover template classes
(`.button.round.bleu`, `.button.nav.white`). The actual brand, `--_primitives---brand--gold`
`#c8b282`, appeared 51 times and was missed. A cyan-on-near-black journey shipped for a
champagne-gold-on-cream practice.

Two rules fall out of that:

- **Frequency beats presence.** A colour existing in the CSS proves nothing. Rank by use count and
  cross-check against the `:root` primitives before committing.
- **Match the client's light/dark polarity.** Arvada's body is `#fdf8ef` and 57 of its 69 section
  scheme classes are the light one. A dark journey was off-brand regardless of accent colour.

When a palette does have to be swapped later, note that gold-family accents **cannot carry text on
a light ground** — `#c8b282` on `#fdf8ef` is 1.96:1. Keep the bright tone for fills, rules and
icons, and darken it for anything with a glyph in it (`#6e5c34` gives 6.0:1). Gate the result with
a computed-contrast pass over every text node, not screenshots: light text left on a newly-light
ground still renders, it is just invisible.

## Conversion is still the job

Motion serves the offer, never buries it. The phone number, the offer, and the form stay
immediately reachable — sticky mobile call bar, visible CTA at every scroll depth. A page that
wins on craft and loses the lead has failed. Section order comes from the Asana brief and the
vendor originals; the *execution* is ours.

## No wall of text

**A page may not render an undifferentiated block of body copy.** This is a conversion rule, not a
taste one, and it came back from the client twice — first on the homepage, then on
`/services/invisalign/`: *"These chunks of text are not good for conversions or user experience at
all. Remove this and make this a system rule. You shouldn't be doing this anymore."*

It bites hardest on migrations. Imported WordPress copy is written for a crawler and structured for
an editor with no components: a 2,000-word treatment page arrives as one column, its real sections
flattened into bold paragraphs, its lists typed as glyphs, and a "call us today" wedged after every
heading. Pouring that into a template preserves the problem and adds a hero to it.

### The rule, in four parts

1. **A ceiling on unbroken prose.** No more than **~110 words of consecutive paragraphs** before
   something breaks the column — a list, a sub-heading, a figure, a table, a pull quote. The
   ceiling is on the *run*, not the section: 400 words carrying two lists and three sub-headings is
   fine, 200 words in one column is not. That is deliberate, because it means the fix available to
   the page is *add structure*, never *cut clinical detail*.
2. **Everything past the ceiling folds, it does not vanish.** The tail goes into a closed
   `<details>`. The wall is gone from the page; the copy stays in the HTML, indexed and reachable.
   On a site that earns traffic from these pages, deleting a few hundred words of ranking copy to
   tidy a layout is a trade nobody asked for.
3. **Dead paragraphs are removed outright.** A bare "Call us today at …", a naked "Learn more
   about X", an address already in the header and the footer, and the SEO coda that closes a
   section by restating it with the search terms in it. These carry no information, and the page
   already has four real calls to action.
4. **Structure the editor implied is restored, not invented.** A heading typed as a bold paragraph
   becomes a heading. A list label typed as a heading becomes a lead-in. A list typed as glyph-
   prefixed lines becomes a list. This is re-tagging, not rewriting — and it does most of the work,
   because these walls are usually several real sections that the CMS flattened into one.

### The fifth part: measure how many times the page makes the same point

The ceiling above is about *runs*. It cannot see the other half of the problem, which is a page
that obeys it perfectly and still says one thing four times.

Mason Park's Invisalign page had four lists — *Who is it for*, *When to consider*, *Benefits*,
*Why choose us* — 21 items and 600 words, and 21 near-duplicate pairs between them. It made
"virtually invisible" 16 times, "removable, eat what you like" 18, "no metal, no irritation" 28,
"custom-fit from a 3D scan" 20. Every run was under the ceiling; three of the eighteen desktop
screens were the same six sentences rewritten. That is what a client means by *"users don't
scroll to a page that has that much text"* — not that the page is long, that it is **redundant**.

**So measure repetition, not just run length.** A Jaccard pass over the page's own list items and
a count of each selling point's synonyms takes a minute and tells you which chapters are copies of
each other. The workflow's `.tmp/measure.mjs` reports screens, words and list heights per chapter;
run it before deciding what to cut.

**The fix is a fold, not a delete** — the same trade as rule 2, made at chapter and at row level:

- **Row level.** `ul.lf-ticks.is-compact`: the label is the visible row and the practice's own two
  sentences sit under it in a native `<details>`. Six benefits go from 622px to 288px and the
  reader scans six labels in four seconds. Nothing leaves the HTML.
- **Chapter level.** When two sections are the same argument, the weaker one folds whole into a
  `details.lf-more` inside the stronger. *When to consider* and *Why choose us* both folded; the
  chapter still answers its own question above the fold.

Result on that page: **2,155 visible words to 1,450, and mobile from 22.4 screens to 16.9**, with
every original word still in the file and still indexed.

### What may never be done to fix a wall

- **Never rewrite, paraphrase or summarise clinical copy.** Removal and re-tagging only. A practice
  is legally and professionally accountable for what its pages say about treatment; we are not the
  authors of it.
- **Never invent copy to fill a beat.** A page with no cost section gets no cost chapter.
- **Never trim a review to make it fit.** Reviews are real people's words under their own names.
  Show it whole or do not show it. If a component cannot hold the long ones, the component is
  wrong — that is exactly how a proof rail shipped with one card in it.
- **Be conservative with the removal rules.** Across 35 treatment pages there are ~1,900
  paragraphs, so a rule that is 95% right still bins ~95 paragraphs of a real practice's clinical
  copy. Where a pattern is ambiguous, the rule must decline to fire. Print the counts on every
  build and read them.

### Pictures are half of it

The other half of the same note: *"To add more images overall. This is not a good services page
right now."* An imported treatment page carries exactly one image — the featured photograph the
hero already uses — so below the fold it ran two thousand words with nothing for the eye to stop
on.

- **Every long-form page carries at least one photograph below the hero**, and one roughly every
  two sections after that.
- **A photograph on a treatment page may show the practice** — the rooms, the team, a patient in
  the chair. **It may not be presented as showing that treatment**, its result, or its patient.
  Caption the building and the visit, never the procedure. Matching a stock image to a page by
  keyword is how a photo of somebody else's teeth ends up captioned as this practice's work.
- **The pool is shared and deterministic**, seeded off the page slug: the same page gets the same
  pictures on every build, or every screenshot gate compares two different pages.

### The gate

Enforced on the **built HTML**, not on the build pass, and it has to be. The first version of this
rule was defeated by a wrapper the reader cannot see — Elementor nests its paragraphs six divs
deep, so the pass matched nothing, folded nothing, and reported success on a page that was still a
404-word wall. `audit.mjs` fails the build on any rendered section over the limit and warns on any
long-form page with no photograph below the hero. See `09-static-rebuild/.tmp/site/prose.mjs` for
the implementation and `photos.mjs` for the picture rules.

## GSAP gotchas — learned the hard way, do not rediscover

- **All GSAP plugins are free since 3.13** — ScrollTrigger, ScrollSmoother, SplitText included.
- **Register plugins in `<body>`, not `<head>`** — otherwise ScrollSmoother silently dies with no
  error and the page merely feels flat.
- **ScrollSmoother breaks full-page screenshots.** Verify with real interaction, not captures.
- **Scrubbed scale must never land exactly on `1`** — causes edge flicker.
- A fixed header's `z-index` can trap its own close button under an open drawer.
- Fixed side rails need a real layout gutter plus a scrim, and inversion over light sections.
- **The runtime's breakpoints must agree with the stylesheet's, and nothing enforces it.** If a
  media query changes a scene's layout at 900px, the script that decides whether to pin it has to
  test the same 900px. Mason Park's path scene guarded on `(hover:none) and (pointer:coarse)`,
  which catches phones and tablets — and misses **a non-touch window between 768 and 899px**, a
  resized laptop browser. There the CSS had already made the track a scroll region while GSAP
  pinned it and translated a track its own container was clipping: a 1,051px scene inside a
  4,064px section, **three thousand pixels of scroll in which nothing moved**, on the client's
  approved homepage. Screenshot gates pass it (no overflow, no small text, everything visible);
  only measuring the section against the scene inside it finds it. **Assert `sectionHeight ≈
  sceneHeight + travel` at every breakpoint on both sides of the boundary.**
- **A progress bar that cannot progress must be hidden, not left inert.** The same scene rendered
  its scrub bar below 900 where there is no scrub.

## Brand Authority and Canary Gate

Before designing, inventory every Brandklout/client source that can define identity or structure:
Asana attachments, downloaded reference sites, current production/staging pages, Figma, and Webflow
embeds. Read the embedded content before calling a page empty. Record which source controls brand,
structure, content, and interaction; unresolved conflicts stop the batch.

For a multi-page assignment, finish one representative canary page first. Review its 390 and 1440
renderings and drive its signature interaction before copying the system across the other pages.
Freeze the approved token set, shell, type scale, and interaction runtime for that batch. A static
gate score cannot approve visual direction, brand fidelity, typography scale, or composition.

### The second canary: a shared component is not proven until a second page uses it

Freezing one page's system and calling it a library is only half of the gate. **The first page
that reuses a part is what actually tests it**, and until then every place the component quietly
depends on that first page reads as working. Mason Park's homepage was frozen on 2026-09-01 and
the Invisalign service page was the first thing built on the frozen sheet; it found three of
these in one afternoon, none of them visible on the page they were written for:

- **A component with the first page's copy baked into a media query.** The comparison table
  hides its header row below 767px and restates each column name through `::before`. Those two
  strings were CSS literals — *"At Mason Park" / "Two practices"* — so the Invisalign table
  compared Invisalign with traditional braces on desktop and said "At Mason Park" over all five
  rows on every phone. **Correct at the width it was reviewed at, wrong at the width most people
  read it at.** Content belongs in the markup: `attr(data-label)` now, literal as a fallback.
- **A direct-child selector reaching a container the new page nests one level deeper.**
  `.text-rich-text > * + *` gave the homepage its rhythm; a service page wraps its prose in
  `<section class="lf-section">`, so consecutive paragraphs rendered with *no* space between
  them — the paragraph break, the one piece of structure a long clinical page still has, gone.
  The homepage had no such section and could not show it.
- **A rule written for one variant of a frame and a reset written for both.** The section
  heading was styled under `.lf-layout.is-solo` only, while `.lf-split .lf-section:first-child
  h3` already cancelled a `border-top` that nothing set. **A reset with no rule above it is the
  tell** — read those before trusting a frame you have not rendered.

So: **the second page carries the same review weight as the canary, and its review is what
promotes the frozen set from "one page's CSS" to a system.** Render it at every breakpoint, and
read the mobile branch of every shared component it touches — not just the page.

### "It looks different on that page" — measure the report before acting on it

A client reported that the service page's navbar had changed and asked for the homepage's to be
imported into it. **The markup was byte-identical** — it had been lifted verbatim — and a probe
of both rendered pages returned identical geometry, background, transparency, link colour, logo
filter, measured header height and hero offset. Nothing about the navbar differed at all.

What differed was **the photograph behind it**. The homepage's hero is mid-dark across the top,
so the veil's 0.72 band carries white links comfortably; the service page's featured image is a
bright close-up whose blown highlight sits exactly under the last nav item and the phone number.
Same component, same colours, unreadable.

Two things follow, and both are general:

- **Reproduce a visual report as a measurement before you change anything.** "Import the
  homepage's navbar" would have been a no-op that shipped, and the complaint would have come
  back. A dozen computed properties across both pages took one script and named the real cause.
- **A component that floats over client photography must guarantee its own contrast.** Not by
  picking a darker photograph — there are 34 more treatment pages and 34 more featured images
  nobody has chosen yet — but by making the scrim under the chrome dark enough for white text
  *whatever* is behind it. Fixed on the inner-page hero variant only, so the approved homepage
  hero is untouched.

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

**Colour that JS paints needs its own pass, with motion ON.** Any check that runs under
`prefers-reduced-motion` — which is most of them, because it is the only state where a
scroll-driven page renders complete — never executes the timelines, so it cannot see a colour a
tween writes. On Arvada that hid a `sweepWords` call tweening its non-accent words to `#ffffff`
on a cream ground: 15 of every 21 swept words animated to invisible, through a contrast pass
and a full-page capture that both reported clean. Same exposure for any state a *click* reveals
(selected quiz option, open FAQ) — those are tweened as rgba strings too.

Scroll with motion on, collect console errors and exceptions, drive the controls, and read back
the colour actually painted on the element. `workflows/08-qa/.tmp/runtime-colour.mjs` and
`interact-colour.mjs` on the Arvada build are the reference implementations.

One trap in writing those probes: **Webflow wraps every embed in a div carrying the same class**,
so `querySelector('[class*="quiz__opt"]')` returns the wrapper, and a click on it never reaches
the button. The probe then reports "nothing changed" and reads as a passing test. Qualify by
tag — `button[class*="quiz__opt"]`.

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

1. Brand/source authority recorded and the canary direction approved before batch multiplication
2. **6–8 named chapters** in a fixed narrative order — no `band-*` / `section--<colour>` sections left
3. **At least 3 chapters where scroll drives the content**, pinned and scrubbed — not triggered
4. Chapters both arrive and depart; continuity devices present (progress, chapter tags, theme shifts)
5. Hero motion, interaction states on every interactive element, and a signature moment
6. `prefers-reduced-motion` disables motion without hiding content
7. Behaviour verified by driving the page on a **focused** tab — not by screenshots
8. Screenshots captured at all six breakpoints and **reviewed**, with responsive issues fixed
9. Zero horizontal overflow at 360 and 390
10. Offer, phone and form reachable at every scroll depth on mobile
11. **Fluid root installed and clean** — `node scripts/fluid-root.mjs --check <package>` exits 0

The one-sentence test: **would a visitor describe this as a place they went, or a page they read?**
If it reads as a stack of cards with animation on it, it fails — rebuild the architecture, keep the
content. If it would not look out of place on awwwards, it passes.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../SYSTEM_RULES.md).
