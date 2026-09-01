# Style Direction v2 — the Stone journey

The home page rebuilt as an editorial journey, 2026-08-31.

> [!IMPORTANT]
> **2026-09-01: the client kept the home page and nothing else.** This document is why the home page
> looks the way it does, so it survives intact — but two of its sections described rolling the
> system out to `treatments.html` and to the twelve service pages, and those pages have been
> deleted. Both sections are now a summary rather than instructions; the detail is in git history
> with the pages. Everywhere below that counts "all eighteen pages" is a statement about the site as
> it was on 2026-08-31, and is left alone because the reasoning it supports has not changed.

| | |
| :--- | :--- |
| **Trigger** | Brandklout's team reviewed the first build: *"the design is very ugly and simple"* |
| **North Star** | [drnahlah.com](https://drnahlah.com) — *"the best one we have"* |
| **Scope** | The home page. It was the home page, `treatments.html` and twelve service pages until 2026-09-01; the rest were deleted, and the home page is the site |
| **Package** | [`surgical-arts/site-src/`](./surgical-arts/site-src/) — `pages/home.body.html`, `css/50-journey.css`, `js/10-journey.js` |
| **v1** | Was kept at `site-src/pages/_home-v1.body.html` to diff against. Deleted 2026-09-01; recover it from history if a diff is ever wanted |
| **Gates** | `audit.mjs` FAIL none / WARN none · `check-copy.mjs` clean · `journey-test.mjs` **47/47** |
| **For review** | home <https://claude.ai/code/artifact/8b745715-0d68-4bbc-af0c-d2214396b0b6> |

## The diagnosis

Both versions were screenshotted at 1440 and read side by side. The team is right, and the problem
is structural rather than decorative. Five things, in the order they matter:

| | What v1 did | Why it reads as cheap |
| :-- | :--- | :--- |
| 1 | **One ground.** Every section on flat ivory | The practice's OWN retired site ran marble: as the page ground, as a panel behind copy, and as one dark break band. That is where its editorial feel came from and none of it survived |
| 2 | **Everything centred, everything 50/50.** Fourteen sections, each a centred header over a symmetric grid | Nothing overlapped, nothing bled off an edge, nothing was ever the wrong size on purpose |
| 3 | **No scale contrast.** h1 4.75rem against body 1.125rem | A 4x range. Editorial pages run 10x, and the quiet parts have to be genuinely quiet for the loud parts to land |
| 4 | **Sections, not chapters** | A list of equal-weight blocks does not build an argument, so there is no reason to reach the bottom |
| 5 | **Every image 16:9, in a box** | Which is why every section is a horizontal band. Tall frames are what let a layout overlap and bleed |

And one bug that was doing more damage than any of them: **the CTA band and every inner-page hero
were meant to sit on the stone texture and never have.** `38-cta.css` said
`url("assets/texture-stone.jpg")`, but `site.css` is served FROM `assets/`, so the browser was
asking for `assets/assets/texture-stone.jpg`. The band has been flat ivory on all eighteen pages
since the first build. `audit.mjs` resolved CSS `url()` against the site root rather than against
the stylesheet, so it never caught it. **Both are fixed.**

## What was taken from Dr. Nahlah, and what was not

The brief was explicit: *"we don't need to copy it exactly. You just need to understand the
fundamentals that made it like that."*

**Taken** — the chapter structure, where each chapter makes a MOVE in an argument rather than
listing a service; the persistent sense of place (a progress bar and a readout that names where you
are); one pinned horizontal chapter, so the page changes direction; scrubbed reveals tied to
scroll position rather than to a timer; and dealing a credential list out one line at a time.

**Not taken** — its palette, its typefaces, its copy, its section order, and its nine-chapter
count. Nothing about Nahlah's brand is in this page.

**Deliberately not taken:** ScrollSmoother. Nahlah vendors it; here it complicates headless
verification, breaks full-page capture, and buys a smoothing effect that is not what makes that
site good. GSAP, ScrollTrigger and SplitText are vendored; ScrollSmoother is not.

## The eleven chapters

| # | Chapter | The move it makes | Ground |
| :-- | :--- | :--- | :--- |
| 00 | **Arrival** | Asymmetric split: the headline on the page gutter, a tall photograph running to the viewport edge with the Carrara ground showing as an L around it | Carrara |
| — | *the ledger* | The four published figures as hairlines and alignment, not four bordered boxes | ivory |
| 01 | **The idea** | Dr. Stone's own sentence, at the size of the argument. Words brighten as you arrive | ivory |
| 02 | **What we do** | Four tall photographs on a staggered baseline | ivory |
| 03 | **The surgeon** | A marble panel carrying the copy, the portrait overlapping its edge and bleeding off the page | Carrara |
| 04 | **The path** | **Pinned.** You travel sideways through the three visits | Carrara |
| 05 | **The standard** | The one dark chapter, and the press index becomes the evidence under a claim | dark marble |
| 06 | **The proof** | One review at the size of a statement, the rest on a rail | ivory |
| 07 | **The results** | The image runs off the left page edge, copy in a narrow column right | ivory |
| 08 | **Memberships** | Mirrored: copy left, image off the right edge | ivory |
| 09 | **Questions** | The accordion with a sticky photograph beside it | Carrara |
| 10 | **The invitation** | Twenty-one towns set as type, then the practice and the practical facts | ivory |

Three moves carry most of the difference:

1. **The pull-quote was promoted to the thesis and moved to chapter 01.** It was the best sentence
   on the site and it was buried in the middle, between the surgeon section and the process steps,
   which is the part of a page nobody reads.
2. **The four categories became photographs.** They were four bordered boxes with line-drawn icons.
   An icon in a box is an empty image slot with a drawing in it, and the brief says no slot may be
   empty.
3. **The three process steps became travel.** You are no longer told there is a process.

## Content: nothing was invented

Every figure, quotation, credential, fee, town and press item is the same sourced string v1 carried,
from [`SURGICAL-ARTS-BRIEF.md`](../../01-content-intake/.tmp/SURGICAL-ARTS-BRIEF.md). Where a layout
wanted a fact that does not exist, the layout gave way.

What DID change is length. The surgeon chapter ran two full paragraphs and then repeated their
content as four chips; it is now one paragraph and the credentials dealt as a list. The brief says
*"big chunks of text are not good for conversions"*, and the chunk is a MEASURE problem before it is
a length problem: `.measure` caps a body column at 34rem so no paragraph can run the container width
again.

**No em dashes**, per [SYSTEM_RULES.md](../../../../../SYSTEM_RULES.md). Gated by `check-copy.mjs`
on the built output.

## Tokens: palette and type only, exactly as briefed

> *"When we are handed off with a design or style guide or a brand guideline, we should be
> extracting color palette and font and that's it. The rest should be elevated."*

`01-tokens.css` is **untouched**. Sculpted Ivory's five colours and two typefaces are the client's
board verbatim, including the documented accessibility deviation on brand green.

`50-journey.css` adds only what the board has no opinion about:

```css
--size-display:    calc(8rem    * var(--t-display));  /* above the old h1 */
--size-display-sm: calc(5.25rem * var(--t-display));
--size-numeral:    calc(6.5rem  * var(--t-display));
--gutter: max(5vw, calc((100vw - 80rem) / 2));
```

All in `rem`, all multiplied by the existing `--t-display` step, so they inherit the fluid root and
break at the same four widths as everything else. No `px`, no `clamp()` for font-size
([fluid-root.md](../../../../process/04-design/fluid-root.md)).

## Imagery: eight new files, and why each exists

`generate-images.mjs` gained per-slot `aspect`, `maxWidth`, `style`, `negative` and `detail`, because
every asset in the library was 16:9 and cropping a 16:9 frame to 2:3 throws away two thirds of the
picture.

| File | Aspect | For |
| :--- | :--- | :--- |
| `tex-carrara.webp` | 2:1 | the Carrara ground, and now the CTA band on all 18 pages |
| `tex-marble-dark.webp` | 2:1 | chapter 05 |
| `hero-arrival.webp` | 2:3 | chapter 00 |
| `cat-face-tall.webp` | 2:3 | Face |
| `cat-neck-tall.webp` | 2:3 | Neck & Jawline |
| `cat-skin-tall.webp` | 2:3 | Skin |
| `cat-nonsurgical-tall.webp` | 2:3 | Non-Surgical |
| `ask-reception-tall.webp` | 2:3 | chapter 08 |

**Two were thrown away and regenerated.** The first Face image was an operating room with a
green-draped table: the honest subject, and completely the wrong register for the first card a
nervous cosmetic patient meets on a home page. It reads as institutional, not boutique. It is now a
carved marble profile on a travertine plinth, which says structure and proportion, is unmistakably
an artwork rather than a patient, and happens to be the practice's own name. The first Neck image
was one small ambiguous object on a crumpled cloth, legible as nothing at card size; it is now a row
of instruments.

**The rules from the earlier passes all still hold.** No faces, no people, no before/after, and an
explicit negative prompt on every slot. Textures get their own style string (flat even light, no
depth of field, no subject) because type sits on top of them and any vignette shows up as a stain
behind a sentence.

**Two real client photographs were retired**, both for the same reason the client already gave once:

- `office-exterior.webp` is misnamed. It is not an exterior, it is the reception interior, shot so
  the practice's own name reads "STON" and the sister brand's neon green fills the left edge. It is
  the crop the client rejected on the v1 hero, and `ssa-front-desk.webp` is the better photograph of
  the same subject.
- `texture-stone.jpg` is a cold grey slab inside a warm ivory palette, which is why it was barely
  used even where it did load.

Both are still in the client's Drive export if they are ever wanted. `banner-ssa.avif` IS the real
building and would have been the honest choice for the closing chapter, except that it is the 2021
ribbon-cutting and several people in it are masked; a dated photograph on a 2026 home page says
something about the practice that is not true.

## Motion

GSAP 3.15 + ScrollTrigger + SplitText, vendored into `js/vendor/` and emitted as a **separate**
`assets/vendor.js` that only pages with `motion: true` request. `site.js` ships to all eighteen
pages; the vendor bundle is 122KB and only the home page uses it, so the other seventeen are
byte-for-byte what they were.

| Interaction | Chapter | Technique |
| :--- | :--- | :--- |
| Masked line reveal | 00, 02, 03, 04, 06, 08, 09 | SplitText lines, each wrapped in a clipping span |
| Photograph settle and drift | 00 | `fromTo` scale on load, scrubbed `yPercent` on exit |
| Counters | ledger | tweened object; lands on the element's own published string |
| Word-by-word brighten | 01 | scrubbed `progress` toggling `.is-lit` across wrapped words |
| Differential drift | 02 | four `yPercent` scrubs at slightly different rates |
| **Pinned horizontal travel** | 04 | `.path_viewport` pinned, track `x` tied to scroll |
| Marble drift | 05 | scrubbed `backgroundPositionY` |
| Progress bar and readout | global | `scrub` on `scaleX`; an IntersectionObserver band across the viewport middle names the chapter |

**Three failure branches, all verified rather than assumed:**

- **No JS at all.** Every hidden state in `50-journey.css` is scoped to `.js`, which only an inline
  head script adds, and a 2.5s timer removes it if the bundle never signals ready. Verified with
  JavaScript disabled: `.js` absent, 0 elements hidden, 6,251 characters and 13 images present.
- **GSAP missing but site.js fine.** Every effect falls back to the IntersectionObserver reveal the
  rest of the site already uses.
- **`prefers-reduced-motion`.** A real branch: **zero pins**, no split, no scrub, and the path
  chapter stays an ordinary snap rail. Verified.

## Verification

`node journey-test.mjs` drives headless Chrome through 33 checks. Every assertion is POSITIVE
("the track moved 619px"), never an absence check, because the Nahlah build shipped a guard clause
that reported PASS while ScrollSmoother was silently dead.

```bash
cd site-src
node build-site.mjs && node audit.mjs && node check-copy.mjs && node journey-test.mjs
```

It asserts: no horizontal overflow and a clean console at 360, 390, 768, 1024, 1440 and 1920; that
GSAP, ScrollTrigger and SplitText all loaded; that the pin exists and the track really travels; that
both progress bars fill; that the readout names chapter 04 while you are parked in it; that the
counters land on their published values and not on a rounded tween; that reduced motion produces
zero pins and hides nothing; and that the page is complete with JavaScript off.

## Second pass: what looking at the screenshots found

The first pass gated six widths for horizontal overflow and moved on. Opening them found three
defects the gate could not see:

- **The navbar overflowed from 992 to about 1150, on all eighteen pages.** "Book a consultation"
  was clipped at the viewport edge and the Treatments caret dropped to a second line. Pre-existing
  since the first build. Fixed in two steps so the full menu survives as long as it fits: gaps
  tighten at 1279, and the phone number, which is repeated three times elsewhere on the page,
  drops at 1199.
- **The tablet hero cropped a portrait photograph to landscape.** `aspect-ratio` with a
  `max-height` transfers the cap into the width as well, so at 768 the hero was a 504px square in a
  768px column. Tablets now get a portrait frame on the left gutter, which keeps the desktop
  asymmetry; the height cap belongs to phones, where its only job is holding the headline above the
  fold.
- **The headline broke to three lines from 992 to 1279.** The copy column now takes more of the row
  in that band.

Three changes came out of the same look:

- **The hero caption is gone.** "One surgeon. One room. One plan." is the sub-headline directly
  above it said again in fewer words, and it was an opaque plate fighting the photograph at 1024,
  768 and 390. Two reasons to cut it and none to keep it.
- **The category names went up a step**, from `--size-h4` to `--size-h3`. They are the four things
  this page exists to route people to and they were smaller than the lede beside the section
  heading, so the photograph carried the card and the word read as a caption.
- **The closing band sits on the spine now.** The page spent nine chapters building a left-hand
  rhythm and then closed on the one centred block that looks like every other template. **Scoped to
  `.journey_page`**, so the other seventeen pages keep exactly the band they have while the
  direction is under review; rolling it out later is deleting one selector.

The gate is now 39 checks rather than 33, and the new one is the interesting one: **no visible
control may sit past the right edge** unless it is inside a rail the reader can scroll. It was
verified by disabling the navbar fix and watching it fail with `Book a consultation`, then pass
again, because a check that has never failed has proved nothing.

## Third pass: fluid proportions, measured against Nahlah

Client, 2026-09-01: *"This should have fluid responsive sizes. Let's have the proportions that we
have on the nahlah site... Everything should be local."*

`site-src/measure.mjs` is what this pass was built on. It reports, per screen size, which chapters
exceed the viewport, whether every reveal fired, and what the gutter and content width resolve to.

### The proportions, side by side

| | Nahlah | Stone, before | Stone, now |
| :--- | :--- | :--- | :--- |
| Section rhythm | `clamp(4.5rem, 9vw, 9.5rem)` | fixed `8rem` | `clamp(4rem, 7vw, 8.5rem)` |
| Gutter | `clamp(1.25rem, 4vw, 4.5rem)` | `max(5vw, (100vw - 80rem)/2)` | `max(clamp(1.25rem, 4vw, 4.5rem), (100vw - 97.5rem)/2)` |
| Content max | 1560px | **1280px** | 1560px |
| Display 1 | 6.66rem | **8rem** | 6.9rem |
| Display 2 | 4.68rem | 5.25rem | 4.75rem |
| h2 | 3.24rem | 3.25rem | unchanged |
| Mid heading | 1.71rem | **2.25rem** | 1.85rem, journey layer only |

The two in bold were doing most of the damage. At 1920 the page was giving away 280px of content
width to margin, so every chapter read narrower and taller than the reference; and a two-line
headline at 8rem is 240px of type before any padding, which is most of why the hero measured 1.35
screens on a laptop.

`--size-h3` itself is untouched, because it lives in `01-tokens.css` and all eighteen pages use it.
The journey layer sets `--size-h3-j` instead, so the home page moves and nothing else does.

### The sections that were too tall were not the ones that looked long

Measured at 1440x800, a 13-inch laptop with browser chrome:

| | Before | Now |
| :--- | :--- | :--- |
| Hero | 1.35 screens | **0.92** |
| Pinned path frame | **1.04 screens** | 0.71 |
| Surgeon portrait | **1.13 screens** | 0.79 |
| Questions photo (sticky) | 707px under a 112px offset | capped at `100vh - 10rem` |
| Whole page | 17.4 screens | 15.0 |

The pinned one mattered most: the chapter holds the screen still and then does not fit on it, so you
travel sideways through panels whose bottoms you cannot see. All four are capped in `vh` now, which
is the only unit that can promise "fits the screen" at every size.

### The animation was firing, at the wrong moment

Every `data-j` element did get `.is-in`; nothing was stuck. But the class went on the stagger
CONTAINER, and the containers run to 1.6 screens, so the instant `.ways_grid`'s top edge appeared
all four category cards animated and three of them played off-screen. By the time you reached the
fourth it had finished long ago.

The class goes on each child now. The `nth-child` delays still apply, which is what keeps a row of
four that genuinely do enter together reading as a stagger rather than a jump, while a stacked list
ignores them because its items arrive one at a time anyway.

The observer also moved from `threshold: 0.08` to `threshold: 0` plus a `rootMargin`, because a
fractional threshold on an element taller than the viewport can never be met, and several chapters
here are taller than the viewport.

### Everything local

Both typefaces were still fetched from `fonts.googleapis.com` on every page view. On a medical
practice's site that hands a third party the IP of everyone who visits, and it left a design that IS
two typefaces one blocked request away from Georgia and Arial.

`site-src/get-fonts.mjs` downloads the seven cuts the stylesheets actually use (a grep of `css/` for
`font-weight` shows the head was requesting five cuts nobody sets), latin subset only, and generates
`css/03-fonts.css`. 161KB. Two new gates hold the line: **no off-origin requests**, and **both
typefaces actually loaded**, because a fallback renders perfectly happily and simply looks wrong.

## Fourth pass: short screens, and eleven chapters

**The page is eleven chapters now, not nine.** `Results & memberships` measured 1.69 screens, the
tallest thing on the page after the pin, because it held two complete bands under one heading. It is
`07 The results` and `08 Memberships`; Questions and The invitation renumbered to 09 and 10. The
markup and the spacing are unchanged, the section was cut at the seam that was already there. A
reader meets the two offers one at a time and the chapter readout should say which one they are in.

**Short laptops are where tall frames stop being an asset.** At 1440x650 a 2:3 category frame is
82% of the viewport, so the card fills the screen and its own name and description sit permanently
below the fold. New rules under `@media (min-width: 992px) and (max-height: 760px)` compress the
category, offer and invite frames and step the hero's display size down, so the hero fits a 650px
window. These are HEIGHT queries: a width query cannot see the problem, and would have squared the
cards off on a 1440x1080 monitor where they are perfectly fine.

Everything keeps its designed proportion at any normal window height. Only a genuinely short one
compresses.

**The drawer and the keyboard were verified for the first time.** Both were built in the first pass
and had only ever been asserted around. The drawer is 343px wide, scrolls its own overflow (1388px
of content against an 844px phone), keeps all 23 links on screen and scroll-locks the page behind
it; a Tab walk makes 39 stops and every one paints a focus ring. Nothing was wrong. Both are in the
gate now, because a control that happens to work is one refactor away from not.

`pin-shot.mjs` is new and captures the pinned chapter at the start, middle and end of its travel.
It is the one part of this design a full-page screenshot cannot show, and it had been asserted but
never looked at until now.

## Fifth pass: scroll performance, and the two bugs only big screens had

Every check up to here asked what the page looks like standing still. This design does real work on
every frame: a pin, four scrubbed timelines, four parallax tweens, a fixed-attachment marble band
and a backdrop-filter. `site-src/perf.mjs` drives the scroll for real through CDP at **4x CPU
throttle** and reads the frame timeline back.

| Pass | Before | After |
| :--- | :--- | :--- |
| hero into ways | 13% of frames over 32ms, worst 67ms | 9%, worst 34ms |
| through the pin | 12%, worst 66ms, one 65ms long task | 8%, worst 50ms, no long tasks |
| the marble band | 5% | 2% |
| proof to the end | 2% | 0% |

**The marble band was parallaxing twice.** `.stone-band` carries `background-attachment: fixed`,
which IS a parallax, and the runtime then scrubbed `backgroundPositionY` on top of it.
`background-position` is a paint property, so every frame repainted a full-viewport marble image,
plus a ScrollTrigger to decide by how much, to produce a second copy of an effect the stylesheet
gives away for free. The JS is gone; the CSS effect stays, and still drops to `scroll` below 991 and
under reduced motion.

**Two bugs that only exist on a big monitor:**

- The hero was `min-height: min(44rem, 92vh)`. `min()` picks the rem arm on any viewport over about
  765px tall, so on a 2560x1440 screen the hero was 704px, less than half the window, while every
  chapter below it scaled. It is `clamp(32rem, 84vh, 54rem)` now, which is what "fluid" actually
  means: `min()` of a rem and a vh is a switch, not a curve.
- The arrival is full-bleed, so its media column grows with the VIEWPORT while every other chapter
  stops at 1560px. At 2560 that column was 1254px against a 1200px source, so the most striking
  photograph on the page was the only one being enlarged past itself and going soft. The chapter and
  the ledger under it now cap at the same content width as everything else on screens over 1700px,
  which is what the reference build does and what lines the hero up with the ledger beneath it.

## The rollout, and where it went

The system WAS rolled out, to `treatments.html` and then to all twelve service pages, and both went
with those pages on 2026-09-01. The ideas worth carrying forward:

- **The rollout was a stylesheet scope, not a rewrite.** A page joined by gaining `.journey_page` on
  its wrapper and left by losing it; a block at the foot of `50-journey.css` then re-framed the
  components the earlier sheets already provided. Not one line of `treatments.body.html` moved
  except the wrapper. That was the test of whether the home page produced a *system* or one nice
  page, and it passed. If a page comes back, that is still how it should join.
- **Editorial width for the argument, reading width for the reference.** Inside `.journey_page` the
  Client-First wrappers resolved to the journey spine, so an inner page started its content at the
  same 58px the home page does instead of at 145px — two pages of one site with two different left
  margins is the most visible thing about a screenshot of both. But the fee schedule and the
  comparison FAQ were capped at 76rem and LEFT-aligned, because a sixty-row price table stretched to
  1560px puts a hand's width between a treatment and its price. That distinction is the useful part
  and it is written down nowhere else.
- **The five things a patient came to find out belong above the fold** — fee, anaesthetic, time off
  work, when it settles, how long it lasts — as a hairline ledger under the headline, not in a
  sidebar card halfway down. And a five-hundred-word column does not read as broken up merely
  because its headings are inside it: the fix was a lede plus one row per section, heading on the
  left spine, sticky above 991px and static below. If the service pages return, start there rather
  than from the original.

## What this does not fix

Everything already on the [HANDOFF](./surgical-arts/HANDOFF.md) blocker list is still open, and none
of it is a design problem:

1. **Photography.** The hero is a generated room where the board specifies a studio portrait, and
   any before/after work needs consented photography — a generated or stock "case" on a surgical
   practice's site is a fabricated clinical outcome, and it is the one claim a patient relies on.
2. **The domain**, the button-label colour, the real logo and the favicon.

*(Clinical review of the twelve treatment pages, Abby's missing portrait and the reviews widget were
on this list until 2026-09-01. They belong to deleted pages and come back with them.)*

## Next

**The direction is decided, and it arrived as a deletion rather than an approval.** The previous
version of this section warned that rolling out before approval was "seventeen pages of rework if it
moves". It moved.

Chapters 02, 03, 04, 05 and 07 are still general components (`.stone-panel`, `.stone-band`,
`.ways_*`, `.dealt_component`, `.rail_component`, `.offer_*`, `.ledger_component`), so any page that
comes back is composition rather than a rewrite. That was the argument for building them as
components, and it is the one thing the cut did not cost.

Then: re-import to Instatic, which needs `push-site.mjs --force` and a check of the pages'
`updatedAt` first (see the runbook), plus a check that Instatic's converter does not strip the
`data-j` / `data-chapter` attributes the runtime binds to. **The live site is still the
eighteen-page version**; publishing is an atomic PUT of the whole tree, so it will drop the other
seventeen.

## Version Control
- Follows the version control rules in [SYSTEM_RULES.md - Section 4](../../../../../SYSTEM_RULES.md).
- `site-src/` and the vendored `js/vendor/*.js` are committed; image binaries are gitignored and
  sync to the VPS.
