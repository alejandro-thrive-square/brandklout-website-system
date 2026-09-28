# Design Standard — awwwards-grade, motion-led

**Applies to every page built under `deliver/brandklout/`.** Non-negotiable.

Set 2026-08-06 after the first Grand Mission output came back as a plain, templatised landing
page. That is the failure mode this document exists to prevent.

## The bar

These are paid-traffic pages for dental practices, competing against a handful of identical
PPC templates that every competitor is already running. A page that *looks like* a template
converts like one. The target is **awwwards-grade**: high interaction, motion-led, memorable.

**Reference implementation:** the Dr. Nahlah build in this repo —
`deliver/brandklout/dr-nahlah/workflows/04-design/output/site-src/`
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
  copy that page carries, so the numeral contradicts itself between pages. Keep `data-chapter` on
  the section (the motion runtime binds to it); drop the numeral from the tag and the fixed readout.
- **Ground shifts between chapters.** The page changes atmosphere as the story turns, rather than
  alternating two background tints forever, within light tones only (see
  [Light grounds only](#light-grounds-only--dark-themes-do-not-convert)).
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

**A paid set is three pages in the agency's reference flow, and it is not the service page.**
(2026-09-18.) Mason Park's first cut derived its ad pages from the organic service page with a form
chapter near the bottom; the agency rejected it and pointed at Livewell's
`/ads-landing-pages/` set: landing (form **in the hero**), consultation (form first) and thank-you
(phone first, no form). The flow is the agency's; the section shapes, photography and copy are the
client's own. The full beat list is [Scenario 3](../process/scenario-3-ads-landing-pages/README.md);
its dedicated FAQ is the one deliberate exception to the folding rule above. **Name nothing on a
paid page `ad`**: `is-ad`, `ad-hero` and `ad-rail` are on ad blockers' cosmetic lists and collapse on
the published page while the local render stays perfect. Use `lp-*`.

## What a brand handoff supplies — palette and type, nothing else

Added 2026-09-01, from the Stone Surgical Arts home rebuild. Alejandro: *"When we are handed off with
a design or style guide or a brand guideline, we should be extracting color palette and font and
that's it. The rest should be elevated."* A client board, style guide or picked template is
authority over **identity**, not composition. Reproducing its section order, centred headers and
symmetric grids reproduces its ceiling, and that ceiling is what gets a build called "very ugly and
simple". (A finished design the client supplies as the site is different: it is imported verbatim.)

- Express the board's colours and typefaces as tokens and do not touch them afterwards. Everything
  else lives in a layer of your own, so the identity stays diffable.
- Display type almost always goes **above** what a board specifies. A board's h1 is a heading; an
  editorial page needs a statement, typically 1.5x to 2x that again.

### The five things that make a build read as cheap

Check a first draft against these before showing it; every one was true of the rejected Stone v1:

1. **One ground, no material.** Every section on the same flat colour. Look at what the client's
   own current or retired site used (stone, paper, a photographic ground) and reproduce the
   *material*, not the layout.
2. **Everything centred, everything 50/50.** Nothing overlapping, bleeding off an edge, or
   deliberately the wrong size.
3. **No scale contrast.** An h1-to-body range of about 4x. Editorial pages run 10x, and the quiet
   parts have to be genuinely quiet for the loud parts to land.
4. **Sections, not chapters.** Equal-weight blocks build no argument. Each section makes a move.
5. **Every image the same aspect ratio, each in a box.** A 16:9 library forces every section into a
   horizontal band. Tall frames are what let a layout overlap and bleed; source or generate at the
   aspect the composition needs.

**An icon in a bordered box is an empty image slot with a drawing in it.** If a slot is for an
image, it gets an image. And "big chunks of text" is a **measure** problem before it is a length
problem: cap body columns (34rem is a good default) before cutting words.

## Minimum per page

1. **6–8 named chapters** with `data-chapter` / `data-chapter-name`, in a non-shuffleable order.
2. **A hero with real motion** — split-text headline reveal, media wipe or scale, layered entrance.
   Not a static image with text on top.
3. **At least 3 scroll-driven chapters** — pinned and scrubbed, per the table above. Fade-up-on-
   scroll does not count, and neither does an `IntersectionObserver` class toggle.
4. **Chapter arrival *and* departure** — leaving a chapter is animated, not just entering it.
5. **Continuity devices** — reading progress, named chapter tags, ground shifts (light tones) across the arc.
6. **Interaction on every interactive element** — magnetic or cursor-aware CTAs, hover states with
   real transitions, animated accordions/tabs/sliders.
7. **Considered typography** — scale, weight contrast, and rhythm doing visible work, sized off the
   **fluid root font-size** (see [FLUID-ROOT.md](./FLUID-ROOT.md)). Type,
   spacing and radii in `rem`; **no `px` font-sizes and no `clamp()` font-sizes** — the fluid root
   already does that job, and `clamp()` on top of it scales twice.
8. **A signature moment** — one thing per page a visitor would remember and describe.
9. **`prefers-reduced-motion` honoured throughout.** Non-negotiable, medical audience.
10. **Mobile is designed, not degraded.** Most paid dental traffic is mobile; motion must survive.

## Light grounds only — dark themes do not convert

Set 2026-09-21 from Jessica (Brandklout): **dark-theme sites do not convert, so every Brandklout
site is a light one.** This overrides the reference build's polarity (Dr. Nahlah is largely dark).
Keep the journey architecture; change how the palette is applied:

- **Every ground is light.** The atmosphere still turns chapter to chapter, within light tones: a
  warm white, an ivory, a sand, pure white, and one cool tint taken from the brand's neutral. Four
  or five grounds is enough for eight chapters; never two neighbours the same.
- **The brand's dark colour is the ink**: text, hairlines, one secondary button. Never a ground.
- **The brand accent is a fill and a rule, not a glyph.** Most dental accents (gold, champagne,
  teal) sit near 2-3:1 on a light ground. Keep the bright tone for buttons, progress, ticks, icons
  and rules, and derive a deep variant for any accent TEXT (IFA: `#c3972b` fills, `#74560f` text).
- **Panels over photographs are light glass**, not dark glass, with ink text.
- **Dark is allowed only where it is functional, not thematic**: the scrim behind a playing video,
  the shade over a hero film that carries white type, a checked chip, a secondary button.
- **Scroll-written copy inverts too**: unlit words are a mid grey that already clears 4.5:1 on the
  light ground, and they fill to ink.
- Author the stylesheet light-by-default with ground-aware tokens (`--fg`, `--fg-dim`,
  `--accent-text`, `--rule`), so there is no second theme to fall back into. IFA's `home.css` is the
  worked example; its re-theme was a token swap plus a dozen surface rules, not a rewrite.

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
  scheme classes are the light one. A dark journey was off-brand regardless of accent colour. Since 2026-09-21 every
  site is light whatever the client's polarity (see above).

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
taste one, and it came back from the client twice (Mason Park, homepage then `/services/invisalign/`):
*"These chunks of text are not good for conversions or user experience at all. Remove this and make
this a system rule."* It bites hardest on migrations: imported WordPress copy arrives as one column,
its real sections flattened into bold paragraphs, its lists typed as glyphs, and a "call us today"
after every heading.

1. **A ceiling on unbroken prose.** No more than **~110 words of consecutive paragraphs** before
   something breaks the column: a list, a sub-heading, a figure, a table, a pull quote. The ceiling
   is on the *run*, not the section, so the fix is always *add structure*, never *cut clinical detail*.
2. **Everything past the ceiling folds, it does not vanish.** The tail goes into a closed
   `<details>`. The copy stays in the HTML, indexed and reachable.
3. **Dead paragraphs are removed outright**: a bare "Call us today at …", a naked "Learn more about
   X", an address already in the header and footer, the SEO coda that restates a section with the
   search terms in it.
4. **Structure the editor implied is restored, not invented.** A heading typed as a bold paragraph
   becomes a heading; a list typed as glyph-prefixed lines becomes a list. Re-tagging, not rewriting.
5. **Measure repetition, not just run length.** Mason Park's Invisalign page had four lists (21
   items, 600 words) with 21 near-duplicate pairs between them; "virtually invisible" appeared 16
   times. Every run was under the ceiling and three of eighteen desktop screens were the same six
   sentences. A Jaccard pass over the page's own list items finds which chapters copy each other.
   The fix is a fold at row level (label visible, the practice's own sentences in a `<details>`) or at
   chapter level (the weaker of two same-argument sections folds whole into the stronger). Result:
   2,155 visible words to 1,450, mobile 22.4 screens to 16.9, every word still indexed.

**Never** rewrite, paraphrase or summarise clinical copy (removal and re-tagging only); never invent
copy to fill a beat; never trim a review to fit (if a component cannot hold the long ones, the
component is wrong). Be conservative with removal rules: across 35 treatment pages a rule that is 95%
right still bins ~95 real paragraphs, so an ambiguous pattern must decline to fire, and the build
prints its counts.

**Pictures are half of it** (*"add more images overall"*): every long-form page carries a photograph
below the hero and roughly one every two sections after. A practice photo on a treatment page may
show the rooms, the team, a patient in the chair, but is never captioned as that treatment or its
result ([IMAGES.md](./IMAGES.md)). Pick deterministically (seeded off the page slug) so every build
and every screenshot gate sees the same page.

**Gate the built HTML, not the build pass.** The first version was defeated by Elementor nesting its
paragraphs six divs deep: the pass matched nothing and reported success on a 404-word wall. The
reference implementation (`prose.mjs`, `photos.mjs`, `audit.mjs`) is in the bk-mason-park worktree
under `workflows/09-static-rebuild/.tmp/site/` (untracked).

## GSAP gotchas — learned the hard way, do not rediscover

- **All GSAP plugins are free since 3.13** — ScrollTrigger, ScrollSmoother, SplitText included.
- **Register plugins in `<body>`, not `<head>`** — otherwise ScrollSmoother silently dies with no
  error and the page merely feels flat.
- **ScrollSmoother breaks full-page screenshots.** Verify with real interaction, not captures.
- **Scrubbed scale must never land exactly on `1`** — causes edge flicker.
- A fixed header's `z-index` can trap its own close button under an open drawer.
- Fixed side rails need a real layout gutter plus a scrim, and inversion over light sections.
- **A decorative fixed rail is `pointer-events: none`.** On IFA it overlaid the right gutter and
  swallowed every click meant for the review arrows beneath it. No screenshot shows that; only a
  written `page.click` does.
- **Never pin an element that holds an `<iframe>`, and never put a form embed inside a pinned
  chapter.** A pin lifts its element out of the page and back on every ScrollTrigger refresh, and the
  browser reloads the iframe each time. On IFA the GoHighLevel form reloaded 25 times in four seconds
  inside a card frozen at its pre-load height. A lead form never gets `autoAlpha` either: it must not
  depend on an animation to be visible.
- **"Submission in progress" on an untouched GoHighLevel form** is GHL's `enableSaveExitConfirmation`
  meeting the consent bridge's URL prefill, not a site bug. Turn it off in GHL;
  `check-ghl-form.mjs` ([`tools/termly-ghl-consent/gates`](../process/tools/termly-ghl-consent/termly-ghl-consent.md)) reads the flag.
- **`clip-path` does not contain overflow.** A film scaled 1.14 inside a clipped window still widens
  the layout: on a phone the layout viewport grew from 390 to 418 px, the page rendered 7 % small and
  the fixed call bar fell off the bottom. Give the window `overflow: hidden` as well.
- **Measure mobile overflow against the device width, not `innerWidth`.** When a page overflows on a
  phone, `innerWidth` grows with it, so `scrollWidth - innerWidth` reads 0 on a broken page.
- **A pinned scene has one viewport to fit in.** Check it at the reviewer's 1512×735 and at
  1366×768, not only 1440×900; step the display scale down under `max-height: 820px` rather than let
  the last line clip.
- **The runtime's breakpoints must agree with the stylesheet's, and nothing enforces it.** Mason
  Park's path scene guarded its pin on `(hover:none) and (pointer:coarse)` while the CSS turned the
  track into a scroll region below 900px. A non-touch window between 768 and 899px got both: a
  1,051px scene in a 4,064px section, three thousand pixels of scroll in which nothing moved, and
  every screenshot gate green. **Assert `sectionHeight ≈ sceneHeight + travel` at every breakpoint on
  both sides of each boundary.** A progress bar that cannot progress is hidden, not left inert.

## Brand Authority and Canary Gate

Before designing, inventory every Brandklout/client source that can define identity or structure:
Asana attachments, downloaded reference sites, current production/staging pages, Figma, and Webflow
embeds. Read the embedded content before calling a page empty. Record which source controls brand,
structure, content, and interaction; unresolved conflicts stop the batch.

For a multi-page assignment, finish one representative canary page first. Review its 390 and 1440
renderings and drive its signature interaction before copying the system across the other pages.
Freeze the approved token set, shell, type scale, and interaction runtime for that batch. A static
gate score cannot approve visual direction, brand fidelity, typography scale, or composition.

**The canary is built at the review bar, not below it (2026-09-03).** Two builds in a row were
rejected whole at first review: Stone Surgical Arts v1 ("very ugly and simple") and Stone Med Spa v1
("we need to elevate it way more... high-end interactions and animations, scroll-based animations,
way more imagery and less text"), eleven correct static pages on flat ivory. So from the first
canary: every page opens on a photograph with the navbar over it, the GSAP bundle ships from day
one, at least three scroll-driven moves per page, the ground changes chapter by chapter, body copy is
one sentence per idea. A restrained v1 "to elevate later" costs a session and is thrown away.
Techniques may repeat between two clients' sites; section shapes may not. Reference motion
vocabulary: bk-stone-med-spa `workflows/04-design/.tmp/med-spa/site-src/css/40-motion.css` and
`js/20-motion.js` (`data-split`, `data-wipe`, `data-parallax`, `data-count`, `data-hero-pin`,
`data-hscroll`, `data-stack`, `data-words`, …) with its three rules: nothing is hidden unless the root
carries `.js`; GSAP is optional and every hidden state has a class fallback; reduced motion is a
branch, not a shorter duration.

### The second canary: a shared component is not proven until a second page uses it

**The first page that reuses a part is what actually tests it.** Mason Park's first service page,
built on the frozen homepage sheet, found three defects in one afternoon, none visible on the page
they were written for:

- **The first page's copy baked into a media query.** The comparison table restated its column
  names below 767px through `::before` literals (*"At Mason Park" / "Two practices"*), so on every
  phone the Invisalign table said "At Mason Park" over all five rows. Content belongs in the markup:
  `attr(data-label)`, literal as a fallback.
- **A direct-child selector reaching a container the new page nests deeper.**
  `.text-rich-text > * + *` gave the homepage its rhythm; the service page wraps prose in a section,
  so its paragraphs rendered with no space between them.
- **A reset with no rule above it is the tell** that a rule was written for one variant of a frame
  only. Read those before trusting a frame you have not rendered.

So the second page carries the same review weight as the canary: render it at every breakpoint and
read the mobile branch of every shared component it touches.

### "It looks different on that page" — measure the report before acting

A client asked for the homepage navbar to be imported into a service page. The markup was
byte-identical and a probe of both pages returned identical geometry, colours and heights. What
differed was **the photograph behind it**: a bright close-up under the last nav items. Reproduce a
visual report as a measurement before changing anything, and make any component that floats over
client photography guarantee its own contrast (a scrim dark enough for white text whatever is
behind it), not rely on the next photo being dark.

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

**Scroll-driven motion fails silently, so assert it** (Stone rebuild; reference
`journey-test.mjs` in bk-stone `workflows/04-design/.tmp/surgical-arts/site-src/`):

- **Assert the magnitude, not just the presence.** "A pin exists" passed while a pinned sideways
  chapter travelled 144px: working, and visually nothing. Assert "the track moved more than 400px".
  The Nahlah build shipped a guard that reported PASS while ScrollSmoother was dead.
- **Wait for the page to stop moving.** With `scroll-behavior: smooth` every scroll-then-read is a
  mid-glide sample. Disable it in the test page and poll `scrollY` until it settles.
- **Never use `offsetTop` on anything pinned**: the pin-spacer makes it relative. Scroll to
  `trigger.start` / `trigger.end`.
- **`page.evaluate(aString, arg)` drops the arg.** Only a real function receives arguments.
- **Verify all three failure branches**: no JavaScript, the motion library absent with the site
  bundle fine, and `prefers-reduced-motion` (zero pins, nothing hidden).
- **Gates read code, not prose.** A check that scans raw source reports a comment explaining a fixed
  bug as the bug; strip comments first (bit twice, `check-copy.mjs` and `audit.mjs`).
- **A relative `url()` in a bundled stylesheet resolves against the bundle, not the site root.** An
  asset check resolving against the root missed a broken texture path on eighteen live pages.
- **Verify a new check by breaking the thing it catches.** Disable the fix, watch the check fail by
  name, restore, watch it pass. A check that has never failed has proved nothing.

**Scroll performance is measured throttled.** At 1x every build is smooth on the machine that made
it. Drive the scroll through CDP at 4x CPU throttle and read the frame timeline (reference
`perf.mjs`, same folder). On Stone that found a chapter parallaxing twice (CSS and JS both), and cut
the worst zone from 13% of frames under 30fps to 9%. **Never animate `background-position`** (a
paint property: every frame repaints); move a layer with `transform`. Put `will-change: transform`
on scrub targets only under the class the runtime sets, not idle.

**Colour that JS paints needs its own pass, with motion ON.** Any check that runs under
`prefers-reduced-motion` — which is most of them, because it is the only state where a
scroll-driven page renders complete — never executes the timelines, so it cannot see a colour a
tween writes. On Arvada that hid a `sweepWords` call tweening its non-accent words to `#ffffff`
on a cream ground: 15 of every 21 swept words animated to invisible, through a contrast pass
and a full-page capture that both reported clean. Same exposure for any state a *click* reveals
(selected quiz option, open FAQ) — those are tweened as rgba strings too.

Scroll with motion on, collect console errors and exceptions, drive the controls, and read back
the colour actually painted on the element. `scenario-0-new-site/04-qa/output/runtime-colour.mjs` and
`interact-colour.mjs` on the Arvada build are the reference implementations.

One trap in writing those probes: **Webflow wraps every embed in a div carrying the same class**,
so `querySelector('[class*="quiz__opt"]')` returns the wrapper, and a click on it never reaches
the button. The probe then reports "nothing changed" and reads as a passing test. Qualify by
tag — `button[class*="quiz__opt"]`.

### The static gate — `journey-audit.mjs`

Run before claiming a page is done:

```
node deliver/scripts/journey-audit.mjs <page-dir> [...]
node deliver/scripts/journey-audit.mjs --all      # from the orchestration checkout
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

Store under `scenario-0-new-site/04-qa/output/screenshots/<page-slug>/<width>.png`.

Check for, and fix:

- **Horizontal overflow** — the single most common failure. Assert
  `document.documentElement.scrollWidth <= document.documentElement.clientWidth` (or the device
  width). Not `innerWidth`: on a phone it grows with the overflow, so the difference reads 0 on a
  broken page. A page that scrolls sideways on mobile is broken, and it is invisible in a
  desktop-only check.
- **Controls clipped out of reach** — the second overflow question, which the first cannot answer.
  An editorial layout bleeds images off the edge on purpose, so ask about controls instead: no
  visible link, button or input may sit past the right edge unless it is inside a real scrolling
  rail. On Stone a navbar clipped its own booking button on every page for a week while six widths
  passed the overflow gate. **Open the screenshots**: an assertion answers the question you thought
  to ask; the picture answers the rest.
- Text clipped, overlapping, or shrunk below ~14px on mobile
- Tap targets under 44×44px
- Sticky/fixed bars covering content or each other — especially a sticky mobile call bar sitting on
  top of the form submit
- Images distorted, stretched, or overflowing their container
- Hero text unreadable over its media at narrow widths
- Nav/drawer opening, closing, and trapping focus correctly
- Motion that works at 1440 but breaks or janks at 390

Paid dental traffic is mostly mobile, so 360 and 390 matter more than 1920.

### CSS traps that produce layouts nobody wrote (Stone rebuild)

- **A `max-width` media rule reaches every width below it.** A 992-1279 fix written after the 991
  block also matched at 768 and beat the mobile rule. Bound a band on both sides:
  `@media (min-width: 992px) and (max-width: 1279px)`.
- **`aspect-ratio` with `max-height` shrinks the width too.** A full-width hero rendered as a 504px
  square. Add `width: 100%` when the box must stay full width.
- **`min(<rem>, <vh>)` is a switch, not a curve.** A hero on `min(44rem, 92vh)` was 704px on a
  2560x1440 monitor. Use `clamp(floor, vh, ceiling)` for "fluid between limits" (heights; font sizes
  stay on the fluid root).
- **Height problems need height queries**; a `max-width` query cannot see "too tall for the screen".
- **Check the widest screen against the narrowest asset.** A full-bleed section is the one place an
  image can exceed its source: at 2560 the Stone hero column was 1254px against a 1200px file.

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
9. Zero horizontal overflow at 360 and 390, and no control clipped past the right edge
10. Offer, phone and form reachable at every scroll depth on mobile
11. **Fluid root installed and clean** — `node scripts/fluid-root.mjs --check <package>` exits 0

The one-sentence test: **would a visitor describe this as a place they went, or a page they read?**
If it reads as a stack of cards with animation on it, it fails — rebuild the architecture, keep the
content. If it would not look out of place on awwwards, it passes.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../SYSTEM_RULES.md).
