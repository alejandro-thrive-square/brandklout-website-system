# Style Direction v2 — the Stone journey

The home page rebuilt as an editorial journey, 2026-08-31.

| | |
| :--- | :--- |
| **Trigger** | Brandklout's team reviewed the first build: *"the design is very ugly and simple"* |
| **North Star** | [drnahlah.com](https://drnahlah.com) — *"the best one we have"* |
| **Scope** | The home page only. The vocabulary is written to roll onto the other seventeen |
| **Package** | [`surgical-arts/site-src/`](./surgical-arts/site-src/) — `pages/home.body.html`, `css/50-journey.css`, `js/10-journey.js` |
| **v1** | Kept verbatim at `site-src/pages/_home-v1.body.html`. Not built. There to diff against |
| **Gates** | `audit.mjs` FAIL none / WARN none · `check-copy.mjs` clean · `journey-test.mjs` **33/33** |
| **For review** | https://claude.ai/code/artifact/8b745715-0d68-4bbc-af0c-d2214396b0b6 |

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

## The nine chapters

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
| 07 | **Results & memberships** | Mirrored, each image running off a different page edge | ivory |
| 08 | **Questions** | The accordion with a sticky photograph beside it | Carrara |
| 09 | **The invitation** | Twenty-one towns set as type, then the practice and the practical facts | ivory |

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

## What this does not fix

Everything already on the [HANDOFF](./surgical-arts/HANDOFF.md) blocker list is still open, and none
of it is a design problem:

1. **The before/after gallery is still empty on purpose.** A generated or stock "case" on a surgical
   practice's site is a fabricated clinical outcome, and it is the one claim a patient actually
   relies on. Needs consented photography.
2. **Clinical review of all twelve treatment pages.**
3. **Abby has no photograph** and nothing may stand in for her.
4. Real Google reviews widget, the forms, and the domain.

## Next

**Get a decision on the direction before rolling it out.** Chapters 02, 03, 04, 05 and 07 are
general components (`.stone-panel`, `.stone-band`, `.ways_*`, `.dealt_component`, `.rail_component`,
`.offer_*`, `.ledger_component`), so applying the system to `treatments`, `about`, `results`,
`memberships` and `book` is composition rather than a rewrite. Doing that before the direction is
approved is seventeen pages of rework if it moves.

Then: re-import to Instatic, which needs `push-site.mjs --force` and a check of the pages'
`updatedAt` first (see the runbook), plus a check that Instatic's converter does not strip the
`data-j` / `data-chapter` attributes the runtime binds to.

## Version Control
- Follows the version control rules in [SYSTEM_RULES.md - Section 4](../../../../../SYSTEM_RULES.md).
- `site-src/` and the vendored `js/vendor/*.js` are committed; image binaries are gitignored and
  sync to the VPS.
