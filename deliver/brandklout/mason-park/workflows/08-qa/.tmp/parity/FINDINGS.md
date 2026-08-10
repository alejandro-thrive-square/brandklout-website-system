# Staging vs local design — parity findings and fix (2026-08-10)

Source Asana task GID: 1217040406855582

The gates that existed before this session (scrub-proof, staging-verify,
pin-fit) all passed, and they were right about what they measure — motion,
reachability, fit. None of them asked whether the built page **looks like the
approved design**, which is what the client asked. Three new gates do:

| gate | question | run |
| :--- | :--- | :--- |
| `parity.mjs` | is the same CONTENT there — copy, assets, icons | `node parity.mjs [page]` |
| `deep-diff.mjs` | does every element RENDER the same | `node deep-diff.mjs [page]` |
| `class-parity.mjs` | order-free cross-check, immune to nth drift | `node class-parity.mjs` (after deep-diff) |

Reports land in `08-qa/.tmp/parity/`.

## Where it ended up

`parity.mjs`: **staging matches the design on every fingerprint** — all three
pages, text / images / icons, and **zero** computed-style differences across
186, 163 and 80 comparable text elements.

| page | height design / staging | text | images | icons | style diffs |
| :--- | :--- | :--- | :--- | :--- | :--- |
| invisalign | 14082 / **14082** | 241/241 | 10/10 | 37/37 | **0** |
| thank-you | 10496 / **10496** | 97/97 | 10/10 | 4/4 | **0** |
| new-patient-special | 14149 / 14089 | 191/191 | 13/13 | 37/37 | **0** |

Every nps *section* measures identically; the 60px sits between sections and is
the one number still unexplained. Gates alongside: scrub-proof 60/60,
staging-verify 21/21 x3.

Nothing real remains in the element diff. What is left is the pale-cyan
`cor-card` border, which is mid-tween and lands a shade apart between captures;
the `rating` / `arr-cue` crosswise pair; and the converter's pin-class dedupe.
All three are covered under "Not defects" below.

## What was wrong, and what fixed it

Content was never the problem — 241/241 text runs, every asset correctly mapped
(the CDN keeps the design's own basename after the 24-char asset id), every icon
geometry present. Nothing needed re-pasting or re-uploading. The drift was
entirely in styling, from three roots that are really one root: **a rule the
Webflow class model cannot hold.**

Fixed by `07-webflow-build/.tmp/parity-patch.css`, installed into each page's
head custom code (it loads after the Webflow stylesheet, so an equal-specificity
rule wins on source order), plus one `update_style` where a class record was
simply short a declaration.

1. **Both dark chapters carried the LIGHT palette.** The section backgrounds
   converted correctly; the four `[data-theme="dark"]` *descendant* overrides did
   not, so chapter tags sat at `#007E9B` and leads at `#525A64` on near-black.
   7 elements on invisalign, 7 on nps, 8 on thank-you. The `data-theme`
   attributes themselves survived the paste, which is what made this cheap.
2. **Webflow's bare-tag defaults beat the design's reset.**
   `figcaption{text-align:center}` centred every testimonial and team caption
   subtree — 24/33/9 elements from that one rule. Also `blockquote`'s 5px grey
   bar, `label`'s bold (the consent lines), and `sup`'s collapsed line box.
3. **Descendant rules with no class to live on.** `.faq .answer-wrap` was
   *functional*: the accordion animates `grid-template-rows` and the `is-open`
   half was already installed, so there was nothing to animate. Plus
   `.site-foot .fine`, `.progress span.on`, and the two
   `.ch-invitation .inv-close` overrides.
4. **Two short class records.** `.chip` had no `background` and `display:flex`
   instead of `inline-block` (chips rendered as transparent rows, not white
   pills) — fixed with `update_style`. `.offer-rail` kept its font and lost
   everything that makes it a rail; restored in the patch, deliberately WITHOUT
   `display`, because the record's `main:flex / small:none / tiny:none` ladder is
   correct and restating it would flatten the responsive behaviour.
5. **The token layer is gone.** The conversion baked it out completely — the
   Webflow stylesheet holds **zero** `var()` references. That is fine except for
   one survivor: the form's step legend came through inside a verbatim embed
   still carrying `font-family:var(--display)`, so it fell back to Inter.
   Defining just `--display` and `--t-body` restores the serif without reviving
   the whole layer. `.ledger`'s scoped `--accent` remap needed the same
   treatment.

## The embed wrapper — the fix that mattered most

Every inline `<svg>` and every `<sup>` came through as a verbatim HtmlEmbed, and
a Webflow embed is a `<div>`. That box sits in the middle of a sentence and
splits the inline run, so the icon or the mark drops onto its own line. The FAQ
question span measured 222x95 against the design's 379x34; the offer chips
145x112 against 165x43, while the tick inside them was a correct 14x14 on both
sides. The box between them was the entire difference.

**CSS cannot fix this, and that took proving.** `display:contents` was applied
and confirmed in the computed style — the span still measured 222x95.
`display:inline` did nothing. Removing the div from the DOM, and only that,
produced 198x34 against the design's 198x34.

So `parity-unwrap.js` removes it: for every embed holding a single svg or sup it
hoists the embed's `<style>` to the end of `<head>` (which keeps its place in
the cascade) and lifts the child out. Then, because a `<div>` is not phrasing
content and the PARSER has already closed any `<p>` before it, the mark and the
rest of the sentence are re-appended into that paragraph. It sets
`html.mpd-unwrapped`, which switches off the CSS fallbacks in
parity-patch.css — without the script they keep the pages readable; with it they
would render 41px where the design is 43px, because they compensate for a
wrapper that is no longer there.

The durable fix is still upstream: the converter should emit a real Webflow Span
instead of an embed for inline SVGs and marks.

### Two more that only surfaced once the wrapper was gone

- **`sup` takes `revert`.** The design has no `sup` rule, so "undo Webflow's
  author rule" IS the specification. Hand-restating the values went wrong twice:
  `line-height:normal` put the mark on its own baseline, and `line-height:inherit`
  was worse — it copies the parent's COMPUTED 23.1px where the design's unitless
  1.65 is re-resolved against the mark's own smaller font-size, which inflated
  every line box holding a mark and pushed the chips from 91px to 112px.
- **`.chapter-body` padding was baked short on two of seven sections.** The
  design's `padding-block: var(--chapter-y)` was resolved to fixed values per
  generated class, and #proof and #invitation each came out exactly 43px under.
  Restating the clamp fixes those two and is a no-op for the five already
  correct (verified: #provider unchanged at 1263). `--chapter-y` is also defined
  as a token, separately, because a chapter script assigns
  `pin.style.paddingBlock = 'var(--chapter-y)'` at runtime.

## Not defects — verified, do not "fix" these

- **Off-by-one element pairing.** `rating` ↔ `arr-cue`, `foot-base`, `foot-grid`,
  `answer` ↔ `answer-wrap` appear in `deep-diff` with swapped values. Their
  class-keyed values are **identical** on both sides and only the nth differs by
  one. `class-parity.mjs` exists to settle exactly this.
- **Converter class dedupe.** `#prepPin` and `#findPin` carry `next-pin`, and
  `#visPin` carries `cov-pin`, because those classes had identical definitions
  and the converter merged them. Rendering is identical and the ids — which the
  JS and ScrollTrigger use — are intact. A maintenance wart, not a defect.
- **Page-suffixed renames.** `name` → `name-ty`, `chips` → `chips-nps`. Same
  element, same rendering, renamed record.
- **Colour rounding.** Webflow stores at 8-bit/2-dp, so `rgba(4,181,217,.537)`
  comes back `rgba(2,181,216,.54)`. Sub-perceptual.
- **The live timestamp** on thank-you ("Received Monday 8:14 AM") differs between
  the two captures because the page prints the current time.

## The measurement traps — every one of these produced a false finding first

1. **`div.page-wrapper`.** Webflow wraps the whole page in it, so an
   ancestor-chain signature shifts by one level and body-level siblings pair at
   random. It matched the sticky offer rail against the page wrapper and
   reported the rail as completely unstyled. Anchor on the nearest **id**.
2. **The `w-embed` wrapper** lands INSIDE the design's own element, and the
   converter **materialises `::before`/`::after`** as real elements
   (`arr-bg-after`, `step-before`, `summary-after`, `price-was-after`,
   `chapter-after`). Both shift every following sibling's nth. But `catch-after`
   and `hes-after` are the design's OWN elements — do not sweep them up.
   Pairing went 411/542 → 528/542.
3. **One icon geometry maps to MANY icons.** The tick path is the same glyph in
   the chips, the check lists and the inclusion marks at three different sizes.
   Keying a lookup on geometry alone matched every design tick against whichever
   staging tick came first and reported **24 phantom size differences**. The
   sizes are identical. Compare the sorted set of boxes within each geometry.
4. **Sorting colours as strings.** `rgba(2,181,216,.54)` and
   `rgba(4,181,217,.537)` — the same colour — land at opposite ends of a string
   sort, and the comparison then lines each up against an unrelated value and
   reports a near-white against a cyan. Sort numerically.
5. **`border-color` on a zero-width border** paints nothing. Reporting it buries
   the real findings under inherited defaults.
6. **`Page.navigate` then `Runtime.evaluate`** races the commit; the expression
   lands in the OLD document where `document.documentElement` is null.
7. **`sup{line-height:normal}` is not the browser default.** `sup` has no
   line-height of its own and inherits the paragraph's, so `normal` puts the mark
   on a different baseline than the copy around it. Use `inherit`.
