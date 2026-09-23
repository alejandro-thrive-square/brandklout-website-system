# Livewell Dental — Elevated Home, r1 design notes

- **Package**: `final-design/index.html` (self-contained, single file)
- **Previews**: `final-design/preview-1440.png`, `final-design/preview-390.png` (rendered headless via `shot.mjs`, Chrome CDP)
- **Built**: 2026-07-27
- **Status**: internal r1. Not sent to Brandklout, not pasted to Webflow.

## What this is
A restructure of the home page against **Dr. Chris's own requested flow** (comment thread
`6a4111b3d8e9fcc8a06c85b5`), not a restyle of the current one. His nine steps map to the sections
below. See `../../15-improvement-intake-audit/.tmp/home-page-brief.md` for the evidence trail.

| His step | Section built |
| :--- | :--- |
| WHY livewell dental | Hero: positioning line, headline, dual CTA, 320+ reviews badge, credential marquee |
| About me | Meet Dr. Chris, using his approved copy verbatim |
| Livewell Difference | Six pillars **with a button to the page** (he flagged it had none) |
| Which problem do we solve | Three patient problems in his own words, each routed to a service |
| Patient testimonial | Video slot, flagged pending the correct file |
| Proof via before/afters | Two real cases, drag-to-compare |
| Promotions | Placeholder band, flagged pending client input |
| Dental services | Eleven services in his approved order (thread `67`) |
| CTA | Closing conversion block with address, hours, phone |

Each of these appears **once**. The current live page repeats services, Dr. Chris, patient
highlights, and testimonials twice each, which is what prompted "it goes everywhere back and forth."

## Brand fidelity
Tokens were lifted from the site's own compiled CSS (`livewelldentalva.shared.bb9994d33.min.css`),
not invented:

| Token | Value | Source variable |
| :--- | :--- | :--- |
| Navy | `#0b2c41` | `--color-scheme-1--green` |
| Gold | `#d3aa5a` | `--color-scheme-1--golden` |
| Teal | `#376b7b` | `--color-scheme-1--green-300` |
| Heading font | Marcellus | `--_typography---font-styles--heading` |
| Body font | Lato | `--_typography---font-styles--body` |
| Radii | 4 / 8 / 16 | `--_ui-styles---radius--*` |

The live site also declares `Calaya` as a tagline font. It is a custom upload, not a Google font, so
this package uses tracked-uppercase Lato for eyebrows. If Calaya matters, it needs to be uploaded to
the Webflow project and swapped in.

## Client directives honoured
- **No stock imagery** (Dr. Chris, five separate threads). Every image is their own asset from the
  Webflow CDN: real patient results, the practice, Dr. Chris, credential logos.
- **No em dashes** (Trong, thread 4). Zero in the visible copy. The only occurrences in the file are
  developer comments and the `<title>`, none of which survive conversion.
- **Approved copy used verbatim** where it exists: the About H2 (thread 71), the "Some dental problems
  keep coming back" paragraph (72), the four credential bullets (73), and the "comprehensive dental
  care should connect the dots" line (70). These were signed off by the client. Do not rewrite them.
- **"Dr. Chris" not "Dr. Kim"** in running copy (threads 60, 61, 62).
- **Hours corrected** to Mon/Tue 8-5, Wed/Thu 8-4, Fri 8-1 (thread 24).
- **Positioning** reframed to cosmetic, implant, and full mouth reconstruction (thread 59, open).

## Image selection note
The first render used `photo-35` and `office-30` for two of the three problem cards. Checked both
against the source files: `photo-35` is a staff group photo and `office-30` is the office dog on a
chair. Neither belongs in a card about failing dental work. Both were replaced with real patient
result portraits (`hs-after`, implant and All-on-X; `bk-after`, full mouth reconstruction), which are
shot on black studio backgrounds and sit correctly against the navy section.

## Motion
Three dynamic behaviours, all dependency-free:
1. **Credential marquee** in the hero, pauses on hover
2. **Drag-to-compare before/after** sliders, pointer events plus arrow-key support and ARIA slider roles
3. **Staggered scroll reveals** via IntersectionObserver, with hover states on service rows, cards, and buttons

`prefers-reduced-motion: reduce` disables all of it and forces content visible. The previews were
rendered in reduced-motion mode for exactly that reason, so what you see is the settled state.

## Open placeholders (deliberate, flagged in-page)
1. **Patient story video** — the live one is the dCOE video, flagged wrong by three people. The
   replacement is a Google Drive link in the comments that we cannot reach. Poster is a stand-in.
2. **Promotions** — in his flow but no offer exists anywhere on the site. Written to be replaced.
   If there is no offer, cut the section rather than fill it.

## Conversion readiness for `07-webflow-build`
Built to paste as **one single-root payload**:
- Everything lives inside `<div class="lw-home">`, with the `<style>` and `<script>` **inside** that
  root, so the section travels without Page Settings changes. This is the pattern that made the
  whole-page one-paste work on Giovanni; a multi-root payload is what crashes the Designer.
- Responsive CSS uses **only** Webflow's breakpoints (991 / 767 / 479). No custom media queries.
- Class prefix `lw-` throughout to avoid collisions with the existing Relume-derived class system.
  A vocabulary check against the live site's classes should still run before pasting.
- **One caveat if we go via `data_whtml_builder` instead of the clipboard converter**: that endpoint
  rejects `@keyframes`, and the credential marquee uses one. Either move the marquee to an HtmlEmbed
  or drop to a static logo row for that path. The clipboard converter path has no such limit.

## Next
1. Internal review, then send previews to Brandklout for Dr. Chris.
2. Resolve the two placeholders and the positioning question before build.
3. On approval, run the converter and produce the pasteable payload.

---

# No Prep Veneers page — r1 design notes

- **Package**: `final-design/page-no-prep-veneers.html` (self-contained, single file)
- **Previews**: `final-design/preview-veneers-1440.png`, `final-design/preview-veneers-390.png`
- **Source page**: `https://livewelldentalva.webflow.io/services/no-prep-veneers`
- **Built**: 2026-07-28
- **Status**: internal r1. Not sent to Brandklout, not pasted to Webflow.

## What this is

A rebuild of the live no-prep-veneers service page: **content 1:1** (deviations listed below),
redesigned in the Livewell system established by the home package, and structured as **components
in the Clifton Exteriors idiom** so the page converts and componentizes the same way.

### Component structure (per `deliver/farewell-agency/clifton-exteriors`)

| # | Section root | What it is |
| :-- | :--- | :--- |
| 1 | `section_vnr-hero` | Dark hero: eyebrow, masked word roll-up H1, three chips, dual CTA, Ken-Burns portrait, breadcrumb rail |
| 2 | `section_vnr-stakes` | The hesitation: pull-quote question + three numbered cards + closing line |
| 3 | `section_vnr-guide` | Meet Dr. Chris: portrait split + three credential rows |
| 4 | `section_vnr-layers` | **Signature.** Scroll-scrubbed enamel comparison, then the definition and four outcomes |
| 5 | `section_vnr-candidate` | **Signature.** Four selectable candidacy traits with a live readout |
| 6 | `section_vnr-gallery` | **Signature.** Draggable case marquee |
| 7 | `section_vnr-virtual` | Three-step virtual consultation with a scroll progress line |
| 8 | `section_vnr-elab` | Dark eLab band with an oversized scrolling type backdrop |
| 9 | `section_vnr-faq` | Seven-item accordion |
| 10 | `section_vnr-cta` | Closing CTA with address, hours, phone |

Conventions carried over from Clifton: `section_*` roots, BEM `__` sub-parts, `is--` modifiers,
and **two HtmlEmbeds per section** authored as `<style data-embed>` (runtime-only rules: JS-applied
states, ancestor-hover chains, keyframes, reduced-motion guards) and `<script data-embed>` (the
section's IIFE, double-init guarded, zero dependencies). All static styling is in the top `<style>`
block so it converts to native, Designer-editable Webflow classes.

Nav and footer sit **outside** `.page_veneers` as preview chrome, because they are site-wide
components on the real site.

## The signature section

`section_vnr-layers` is the page's argument made visual. Two cross-sections scrub together as you
scroll a pinned stage: on the traditional path the enamel band collapses and porcelain fills the
space it left, so the stack total holds and the finished surface lands exactly on the dashed
"original surface" marker. On the no-prep path the enamel band holds and a thin porcelain layer is
added **outside** that marker. The caption resolves to "Same finished surface. A very different
amount of natural tooth left underneath."

> [!IMPORTANT]
> The comparison is deliberately **qualitative — no millimetre figures**. Specific enamel-reduction
> numbers are a clinical claim and are not on the live page. If Dr. Chris wants numbers on the
> diagram he should supply them; do not invent them.

## Brand fidelity

Same tokens as the home package, repeated verbatim on `.page_veneers` so both payloads reconcile
when pasted into the same project: navy `#0b2c41`, gold `#d3aa5a`, teal `#376b7b`, radii 4/8/16,
Marcellus headings, Lato body. Shared atoms (`lw-btn`, `lw-eyebrow`, `lw-shell`, `lw-sec`,
`lw-stars`) are byte-identical to the home package so Webflow's paste reconciliation merges them
by name instead of forking `-2` copies.

## Content deviations from the live page

Everything else is verbatim. These are the only changes, all deliberate:

| Live page | This build | Why |
| :--- | :--- | :--- |
| H1 "No Prep Veneers In Livewell Dental" | "No Prep Veneers at Livewell Dental" | "In Livewell Dental" is not grammatical |
| "Virtual consultaion" | "Virtual Consultation" | Typo on the live page |
| "...worth exploring &mdash; or whether..." | "...worth exploring, or whether..." | No em dashes (Trong, comment thread 4) |
| FAQ: "Dr. Kim will discuss..." | "Dr. Chris will discuss..." | "Dr. Chris" not "Dr. Kim" in running copy (threads 60, 61, 62) |
| No gallery | `section_vnr-gallery` added | Additive. Uses the page's own case photography, with a results-vary line |
| No breadcrumb | Breadcrumb rail added | The page is three levels deep with no way back up |

Client directives honoured: **no stock imagery** (every image is the client's own Webflow CDN
asset, all already present on this page), **no em dashes** in visible copy, **"Dr. Chris"** in
running copy, hours as corrected in thread 24.

## Motion

Dependency-free, IO-gated, `prefers-reduced-motion` aware throughout. Content is **never
CSS-hidden** — reveals are JS-applied, and the scrub's CSS default is the *finished* state so the
section is fully legible with JS off.

1. **Hero** — masked word-by-word roll-up on the H1 (JS-split spans) plus an 11s Ken-Burns zoom
2. **Layers** — the scroll scrub above, rAF-throttled and IO-gated
3. **Candidate** — selectable trait cards driving a meter and a live verdict line
4. **Gallery** — rAF drift marquee with pointer drag, pause on hover, IO-gated
5. **Virtual consultation** — scroll progress line that lights each step as it lands
6. **eLab** — oversized type backdrop drifting on CSS keyframes

Verified headlessly with motion enabled (`behave.mjs` pattern, Chrome CDP): at scrub p=0.85 the
traditional stack reads porcelain 17% / enamel 13% and the no-prep stack porcelain 8.5% /
enamel 30%, rail at 85%, caption resolved; three selected traits light three ticks and swap the
verdict; the accordion keeps exactly one item open; the marquee track transform advances; six
hero word masks are created. **Zero JS errors.**

> [!WARNING]
> **That verification was incomplete and the layers section was broken for weeks because of
> it.** `.section_vnr-layers` had `overflow:hidden`, which made it the sticky scrollport and
> silently disabled `.vnr-lay__stage{position:sticky}` — the 280vh track scrolled past with
> the diagram fixed inside it, so the signature scrub played entirely off-screen. Every number
> above was still correct, because they are all derived from *scroll position*, not from
> whether the stage actually pinned. Fixed 2026-07-28 with `overflow: clip` (clips without
> creating a scroll container) in the source, the payload, and the live page.
>
> **Lesson for every pinned section: assert the GEOMETRY, not just the state.** Sample
> `stage.getBoundingClientRect().top` across the scroll range — it must stay ~0 while the
> track's top goes negative. If the two move together one-to-one, it is not pinning.
> `sticky-audit.mjs` now checks this statically across a whole page, and `wf_tools.py qa`
> check `[4]` catches it in the payload (it previously only inspected root nodes and was
> blind to it).

## Conversion — DONE (2026-07-28)

Payload: `../../07-webflow-build/.tmp/page-veneers/paste_01_page_veneers.html` — **one paste,
637 nodes, 196 styles.** Full paste procedure, verification table and gotchas:
[VENEERS-RUNBOOK.md](../../07-webflow-build/.tmp/VENEERS-RUNBOOK.md).

- Single `.page_veneers` root, so it is ONE paste. A multi-root payload is what crashes the
  Designer (Giovanni precedent).
- 20 embeds survive as HtmlEmbeds: 10 `<style>` + 10 `<script>`, two per section.
- **No `webflow-custom-code.js`** and no head CSS beyond a Google Fonts `@import` (and Marcellus
  and Lato are already the site's own brand fonts, so that is likely discardable). The page pastes
  with **zero Page-Settings changes**.
- `wf_tools.py qa` ALL PASS, `collisions` 0, **0 class names with more than one definition** so
  nothing can fork to `-2`.
- Responsive CSS uses **only** Webflow's breakpoints (991 / 767 / 479).
- FAQ triggers are `div role="button"`, not native `<button>` — a native button falls back to an
  HtmlEmbed in the converter and loses its class styles (Clifton precedent).
- **`data_whtml_builder` caveat**: that endpoint rejects `@keyframes`, and the hero zoom plus the
  eLab type drift both use them. Irrelevant on the clipboard path used here, but it rules out the
  headless builder for this page.

### Two changes the conversion forced back into the design package

1. **Every styled element now carries its own class** (Client-First flat classes, the 07
   directive's going-forward standard). 129 elements had none, which made the converter invent
   tag-derived names — the payload was shipping classes called literally `p`, `div`, `span`, `a`,
   `h3`. Webflow merges classes by **name site-wide**, so those would have collided with
   Livewell's existing Relume-derived classes or littered their project. Structural pseudos
   (`p:first-child`, `:last-child`) became explicit classes at the same time, since those do not
   survive the converter cleanly either.
2. **Four unused shared atoms were removed** (`lw-h2`, `lw-h3`, `lw-lede`, `lw-stars`, plus
   `vnr-micro`). An unused class definition has no element to attach to, so the converter had to
   emit it as head CSS. Dropping them is what got the head CSS down to the font import alone.

Both changes were made to the design source and re-verified: the rendered page is unchanged and
all six behaviours still pass with zero JS errors.

### Converter gap found and fixed

The residual auto-names that flat classes cannot remove (element-level base rules like
`.page_veneers p{margin:0}` must be split onto a companion class) are namespaced by the engine's
`page_prefix`. **That was never exposed as a CLI flag**, so every payload ever generated from the
command line shipped bare `p` / `div` / `span` classes. Added `--page-prefix` to
`html_to_webflow.py`, wired it through `convert()` and `convert_sections()`, documented it in
[07-webflow-build.md](../../07-webflow-build/07-webflow-build.md) and
[html-to-webflow-clipboard.md](../../07-webflow-build/html-to-webflow-clipboard.md) per the
Integrity Rule, and propagated all three files to the canonical
`deliver/process/07-webflow-build/`. All 22 converter regression tests pass. **Payloads generated
for other clients before 2026-07-28 should be re-checked** with the snippet in the clipboard
directive.

## Open questions for Brandklout / Dr. Chris

1. **Gallery labelling.** The case photos are labelled by design intent ("Edge design", "Shade and
   translucency"). If any of these are before/after pairs, we need to know which is which before
   they can be labelled that way.
2. **Millimetre figures** on the layers diagram (see the note above).
3. **Form.** The audit found 54 of 57 pages have no form at all. This page keeps the live page's
   pattern (CTA to `/cosmetic-smile-virtual-consult` and `/contact-us`). Adding a real form to the
   service-page template is the higher-leverage fix and is a separate decision.

## Preview rendering note

`shot.mjs` gained a `settleMs` argument and a pre-capture pass. Both were necessary here and matter
for any page built this way:

- A pending external stylesheet (Google Fonts) blocks inline script execution, which **blocks the
  parser**. With ten per-section script embeds the tail of the document was still unparsed several
  seconds in, and previews silently rendered a truncated page. Pages with per-section embeds need
  `settleMs` around `13000`.
- `captureBeyondViewport` does not trigger `loading="lazy"` images and only rasterizes tiles the
  compositor has already produced, so lazy images came out half-painted. The renderer now forces
  lazy images eager, walks the page, waits on every image, and resizes the viewport to the full
  document before capturing.

Render both previews with:
```bash
cd deliver/brandklout/livewell-dental/workflows/04-design/.tmp
node shot.mjs "file:///<abs-path>/final-design/page-no-prep-veneers.html" "final-design/preview-veneers-1440.png" 1440 reduced 13000
node shot.mjs "file:///<abs-path>/final-design/page-no-prep-veneers.html" "final-design/preview-veneers-390.png"  390  reduced 13000
```

## Version Control
Follows [SYSTEM_RULES.md - Section 4](../../../../../SYSTEM_RULES.md). The HTML package and PNG
previews are lightweight and committable. Downloaded source imagery stays out of the repo; the
package references the client's Webflow CDN URLs directly.

---

# Cosmetic dentistry landing page — r1 design notes

- **Package**: `final-design/livewell-cosmetic-dentistry-landing.html` (self-contained, single file)
- **Previews**: `final-design/preview-cosmetic-1440.png`, `final-design/preview-cosmetic-390.png`
- **Behaviour probe**: `behave-cosmetic.mjs` (motion enabled, Chrome CDP)
- **Built**: 2026-07-28
- **Status**: internal r1. Not sent to Brandklout, not pasted to Webflow.

## What this is

The client supplied their own HTML for a cosmetic dentistry conversion landing page. It was
**rebuilt**, not restyled. The supplied file used an invented palette (forest `#2C4438`, wine
`#8C3B40`, sand, Fraunces serif) that belongs to no part of Livewell's brand, a flat section
stack with no component roots, and markup that converts badly (five `<button>`, a `<cite>`,
fourteen inline `<svg>`, em dashes throughout).

Rebuilt against the system already established here: the home package's tokens, the veneers
page's component idiom, and the client directives from the audit.

| # | Section root | What it is |
|:-- | :--- | :--- |
| 1 | `csm-bar` | Review + phone bar |
| 2 | `csm-head` | Sticky header |
| 3 | `section_csm-hero` | Dark hero, masked word roll-up H1, drag-to-compare before/after |
| 4 | `section_csm-marks` | Credential logo marquee |
| 5 | `section_csm-stakes` | The hesitation, four numbered cards |
| 6 | `section_csm-collection` | **Signature.** Smile Collection scope selector driving an upper arch |
| 7 | `section_csm-gallery` | **Signature.** Draggable case marquee |
| 8 | `section_csm-process` | **Signature.** Three steps with a scroll progress line |
| 9 | `section_csm-guide` | Meet Dr. Chris, four credential rows |
| 10 | `section_csm-words` | Dark band, drifting type backdrop, quote + three facts |
| 11 | `section_csm-faq` | Five-item accordion |
| 12 | `section_csm-cta` | Closing CTA + lead form |
| 13 | `csm-foot` / 14 `csm-rail` | Footer, mobile CTA rail |

Unlike the veneers page, the nav and footer are **inside** the root: this is a stand-alone
conversion landing page with its own chrome, not a page in the site nav. Only a preview reset
sits outside `.page_cosmetic`.

## The signature section

`section_csm-collection` makes the offer names legible. Selecting a scope lights exactly those
teeth on a ten-tooth upper arch (Perfect 1 = the central, Magic 4 = the four front teeth,
Social 10 = all ten), and the verdict line and CTA label follow. The arch is built from
**native Blocks, not an SVG**, so it stays Designer-editable and costs no embed. It cycles once
on first view to teach the interaction, then stops permanently on first interaction. The default
markup state is Magic 4 lit, so the section reads correctly with JS off.

> [!IMPORTANT]
> The arch is a **scope diagram, not a diagnosis**, and says so in-page. Same rule as the
> veneers layers diagram: no clinical claims without Dr. Chris.

## Client directives honoured
- **No stock imagery.** Every image is the client's own Webflow CDN asset: the matched
  before/after pair, seven real case photos, the Dr. Chris portrait, and five credential logos.
- **No em dashes** in visible copy. Zero. The only occurrences are developer comments, which do
  not survive conversion.
- **"Dr. Chris"** in running copy, never "Dr. Kim" (the footer legal line keeps the full name).
- **Hours** as corrected in thread 24: Mon/Tue 8-5, Wed/Thu 8-4, Fri 8-1.

## Motion
Six behaviours, dependency-free, IO-gated, `prefers-reduced-motion` aware. Content is **never
CSS-hidden**: reveals are JS-applied and the arch's CSS default is a finished state.

1. **Hero** masked word-by-word roll-up, plus drag/touch/keyboard before-after compare with
   `role="slider"` and live `aria-valuenow`
2. **Collection** scope selector driving the arch, with a teach-once cycle
3. **Gallery** rAF drift marquee with pointer drag, paused on hover and off screen
4. **Credential marquee** seamless drift, paused on hover
5. **Process** scroll progress line lighting each step bullet, rAF throttled
6. **Words** oversized type backdrop drifting on CSS keyframes

Verified with motion enabled: 9 hero word masks; compare slider 52 → 60 on two ArrowRight;
Perfect 1 lights `[4]`, Magic 4 `[3,4,5,6]`, Social 10 all ten with exactly one option active;
both marquees advance; process rail 100% with three bullets lit; accordion holds exactly one
open; form swaps to confirmation; **50 of 50 reveals resolve, 0 stuck**. **Zero JS errors.**

### Rendering caveat: run the CDP tools ONE AT A TIME

Chaining `shot.mjs` / `crop.mjs` / `behave-cosmetic.mjs` in a single shell command produced
a false failure: the probe reported 0 reveals and both marquees stalled, and two renders came
out with blank image boxes. Re-running each tool **alone** passed cleanly every time. Several
headless Chrome instances competing for the same CDN assets starve each other, so images and
the per-section script embeds miss the settle window. Symptoms look exactly like a page bug.
Render and probe one at a time, and treat any all-zero probe result as suspect until it
reproduces in isolation. `crop.mjs` additionally does **not** force `loading="lazy"` images
eager (only `shot.mjs` does), so crops below the fold half-paint by design.

### One motion bug the probe caught
Both marquees started from `window.addEventListener('load', start)` and never moved
(`transform: none`). A single slow or 404ing CDN image delays `load` indefinitely, so the
measure-and-start never ran. Both now measure and start immediately and re-measure as images
arrive. **Any marquee that sizes itself from image widths needs this pattern** — waiting on
`load` is not safe with external assets.

## Conversion — DONE (2026-07-28)

Payload: `../../07-webflow-build/.tmp/page-cosmetic/paste_01_page_cosmetic.html` — **one paste,
539 nodes, 187 styles.** Procedure, verification table and open items:
[COSMETIC-LANDING-RUNBOOK.md](../../07-webflow-build/.tmp/COSMETIC-LANDING-RUNBOOK.md).

- Single `.page_cosmetic` root, so it is ONE paste.
- 21 embeds: 10 `<style>` + 10 `<script>` + 1 form.
- **`form` is the only non-native tag embedded** (down from `button` ×5, `cite` ×1, `form` ×1 in
  the first pass). FAQ triggers are `div role="button"`, the attribution is a `<p>`, and every
  icon is a typographic glyph rather than inline SVG — the veneers idiom, which is what keeps
  the payload native and Designer-editable.
- **No head CSS beyond the font `@import`**, no Page Settings changes.
- `qa` ALL PASS, **0 cross-page collisions against `page-veneers`**, 0 classes with more than
  one definition, 0 bare tag-named classes.
- Responsive CSS uses **only** Webflow's breakpoints (991 / 767 / 479).

### Two conversion traps worth carrying forward

1. **A shared atom can silently fork even when the CSS is copied verbatim.** `lw-eyebrow` was
   byte-identical in source yet resolved *differently* from the veneers payload, having absorbed
   `box-sizing` and `margin:0`. The converter only routes base rules onto a companion class via
   `_split_single_utility`, and that fires **only for class names that appear in a multi-class
   stack somewhere on the page**. Veneers has one; this page did not. Because Webflow merges by
   name and the first-pasted definition wins, the eyebrow would have lost its margin reset on
   whichever page pasted second. Fixed by giving the atom a real modifier
   (`lw-eyebrow--center`) so it re-enters the split. **`--avoid` does not catch this** — it only
   renames auto-named classes, and `lw-eyebrow` is a source class name. The check that catches
   it is `qa --against <other page>`; run it on every future page.
2. **An unused tag rule forces head CSS.** The heading reset listed `h4` while the markup has no
   `<h4>`. A rule with no element to attach to cannot become a Webflow class, so it was emitted
   as head CSS. Same class of bug as the four unused atoms removed from the veneers package:
   carry only what the markup applies.

## Open questions for Brandklout / Dr. Chris

1. **Target slug.** The file arrived with no site-map placement and reads as a stand-alone
   paid-traffic landing page, which is not the same as `/services/cosmetic-dentistry`. Confirm
   the URL, and whether it keeps its own header/footer or gets wrapped in the site nav.
2. **The lead form does not deliver leads.** It converts to a functional HtmlEmbed but its
   submit only shows a confirmation. Wire it to the CRM/booking endpoint or replace it with a
   native Webflow Form before launch.
3. **Hero imagery.** The matched before/after pair is a tight macro. `Amanda-6 cropped.webp` is
   the aspirational alternative if Brandklout prefers it, at the cost of moving the compare down.
4. **Gallery captions** are labelled by treatment type; if any are before/after pairs we need to
   know which is which.
5. **"320+ five star reviews" and the $0 consultation** are the client's own claims. Confirm both
   are current before launch.

---

# Implant eligibility quiz + thank-you page — r1 design notes

- **Packages**: `final-design/livewell-implant-quiz.html`, `final-design/livewell-thank-you.html`
- **Previews**: `preview-quiz-1440.png` / `preview-quiz-390.png`,
  `preview-ty-1440.png` / `preview-ty-390.png`
- **Reference captures**: `smartarches/refs/quiz-1440.png`, `quiz-390.png`,
  `ty-1440.png`, `ty-390.png`
- **Reference quiz structure**: `smartarches/refs/quiz-steps.json` (all 11 steps, walked live)
- **Behaviour probes**: `smartarches/behave-quiz.mjs`, `smartarches/behave2.mjs`
- **Built**: 2026-08-07
- **Status**: internal r1. Not sent to Brandklout, not pasted to Webflow.

## What this is

Clones of two Smart Arches Dental pages, rebuilt on the Livewell system:

| Reference | Livewell page |
| :--- | :--- |
| `https://smartarchesdental.com/quiz/` | Dental implant eligibility quiz |
| `https://start.smartarchesdental.com/thank-you` | Post-enquiry thank-you page |

The reference quiz is a Gravity Forms multi-page form that loads each step over AJAX, so the
questions are not in the page source. All eleven steps were walked live with a CDP driver and
recorded to `smartarches/refs/quiz-steps.json`; the Livewell quiz is built from that, not from
guesswork.

## Brand fidelity

Tokens were read **live from the Livewell Webflow project** through the `webflow-brandklout` MCP
(site `69d03fdbe999e9907724a69d`), not lifted from compiled CSS this time. They match the values
the earlier packages recorded:

| Token | Value | Webflow variable |
| :--- | :--- | :--- |
| Navy | `#0b2c41` | `--color-scheme-1--green` |
| Gold | `#d3aa5a` | `--color-scheme-1--golden` |
| Teal | `#376b7b` | `--color-scheme-1--green-300` |
| Bone | `#f6f3ee` | `--off-white-bg` |
| Grey | `#949c94` | `--grey` |
| Heading font | Marcellus | `--_typography---font-styles--heading` |
| Body font | Lato | `--_typography---font-styles--body` |
| Radii | 4 / 8 / 16 | `--_ui-styles---radius--*` |

Shared atoms (`lw-shell`, `lw-sec`, `lw-eyebrow`, `lw-btn` and its modifiers) are byte-identical
to the home, veneers and cosmetic packages so Webflow's paste reconciliation merges them by name.

## Section maps

**Quiz** (single root `.page_quiz`)

| # | Root | What it is |
| :-- | :--- | :--- |
| 1 | `qz-bar` | Review + phone bar |
| 2 | `qz-head` | Sticky header, logo + phone + CTA |
| 3 | `section_qz-hero` | **Signature.** Dark split hero with the working eleven-step quiz card |
| 4 | `section_qz-stories` | Draggable patient-story rail, click to play |
| 5 | `section_qz-proof` | Dark band, drifting type backdrop, reviews, credential marquee |
| 6 | `qz-foot` / 7 `qz-rail` | Footer, mobile CTA rail |

**Thank you** (single root `.page_ty`)

| # | Root | What it is |
| :-- | :--- | :--- |
| 1 | `ty-head` | Minimal header, logo + call pill |
| 2 | `section_ty-hero` | Call-first hero: pulsing phone glyph, badge, big call CTA, reviews |
| 3 | `section_ty-expect` | **Signature.** Three call steps on a scroll-scrubbed progress rail, next to four delay consequences, closing on a reassurance callout |
| 4 | `section_ty-why` | Experience / Care / Cost |
| 5 | `section_ty-faq` | Seven-item accordion |
| 6 | `section_ty-cta` | Dark closing card with call, address and hours |
| 7 | `ty-marks` / 8 `ty-foot` / 9 `ty-rail` | Credential strip, footer, mobile rail |

## Deliberate deviations from the reference

Smart Arches' own facts are **not** Livewell's, and none of them were transplanted. Their
1,200+ reviews, 20,000+ cases, 99% success rate, board-certified-surgeons strip, six clinic
locations and `$19,999 per arch / $274 a month` pricing are all absent. What replaced them:

| Reference | This build | Why |
| :--- | :--- | :--- |
| `1,200+ 5-Star Google Reviews` | `320+ five star reviews` | Livewell's own claim, already used across the other packages |
| `20,000+ patients treated, 99% success rate, board-certified surgeons` | Dr. Chris's five real credential marks | Those figures are Smart Arches', and Livewell has published nothing equivalent |
| Q6 states a starting price per arch and a monthly figure | Question kept, no number | Livewell has published neither. Flagged in-page for Dr. Chris |
| Q9 "Location to contact", six clinics | "What matters most to you as you decide?" | Livewell has one location, so the question has no analogue. Flagged |
| Q10 first responder / teacher / veteran | Kept verbatim | On the reference it exists because those groups get a discount. Flagged: asking it with no offer behind it sets an expectation |
| Q4 and Q5 name Smart Arches | Name Livewell Dental | |
| Thank-you FAQ: procedure length, recovery time, surgical risk | Left out | Clinical, and Livewell has published nothing on them. Better absent than invented |
| Thank-you FAQ: bone volume, implant lifespan | Added | Livewell's own published answers, from their implants landing package |
| Video carousel of three patient films | Three real Livewell films | The Vimeo patient testimonial, Dr. Chris on implant care, the lab partnership |

Client directives honoured: **no stock imagery** (every image and film is the client's own
Webflow CDN asset), **no em dashes** in visible copy, **"Dr. Chris"** in running copy, hours as
corrected in thread 24, address `9027 Silverbrook Rd Ste. F, Fairfax Station, VA 22039`.

## Motion

Dependency-free, IO-gated, `prefers-reduced-motion` aware. Verified with motion enabled and
**zero JS errors** on both pages.

Quiz: the eleven-step quiz itself (progress meter, back, per-step validation, multi-select on
step 2, keyboard activation, result screen); a drifting and draggable story rail whose stages
ship with **no `<video>` or `<iframe>` at all** and inject a player on click; a credential
marquee; a drifting oversized type backdrop; staggered scroll reveals.

Thank you: a scroll-scrubbed rail lighting the three call steps in order; a pulsing ring on the
hero phone glyph; a single-open accordion; a credential marquee; staggered reveals.

## Bugs this build surfaced in the existing packages

Two of the defects found here are **not specific to these pages** and affect work already pasted
to Webflow:

1. **`.page_x p{margin:0}` and the `h1,h2,h3` reset out-specify every flat class.** The reset is
   (0,1,1), a single class is (0,1,0), so every `margin-top` on a paragraph or heading class
   computes to 0. The veneers and cosmetic packages both carry this reset.
2. **The credential SVGs are white artwork.** `section_csm-marks` on the cosmetic landing page
   puts them on `--bone`, so that marquee renders as an empty band on the live page.

Both are one-line fixes. Full detail, plus six converter-level gotchas, in
[QUIZ-AND-THANK-YOU-RUNBOOK.md](../../07-webflow-build/.tmp/QUIZ-AND-THANK-YOU-RUNBOOK.md).

## Open questions for Brandklout / Dr. Chris

1. **The payment-plan step has no price.** Supply a starting figure and a monthly figure if you
   want them shown.
2. **The swapped question 9.** Keep the "what matters most" qualifier, or drop the step and run
   the quiz to ten?
3. **Question 10** implies a first responder / teacher / senior / veteran programme. Does one
   exist? If not, cut the step.
4. **Clinical copy** needs sign-off: the four delay consequences, the three call steps, and the
   `$1,900 to $2,800` single-implant range carried over from the implants landing package.
5. **Neither page delivers a lead.** The quiz's submit shows a confirmation and nothing more.
6. **Slugs.** A `thank-you-for` page already exists on the site. Replace it, or take a new slug?

## Version Control

Follows [SYSTEM_RULES.md - Section 4](../../../../../SYSTEM_RULES.md). The HTML packages and PNG
previews are lightweight and committable. The packages reference the client's Webflow CDN URLs
directly rather than carrying imagery.
