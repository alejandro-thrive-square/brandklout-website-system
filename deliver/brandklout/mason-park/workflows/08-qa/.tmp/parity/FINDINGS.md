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

| page | height design / staging | text | images | icons | style diffs |
| :--- | :--- | :--- | :--- | :--- | :--- |
| thank-you | 10496 / **10496** | 97 / 97 | 10 / 10 | 4 / 4 | **0** |
| new-patient-special | 14149 / 14347 | 191 / 191 | 13 / 13 | 37 / 37 | 1 (the ® mark) |
| invisalign | 14082 / 14670 | 241 / 241 | 10 / 10 | 37 / 37 | 1 (the ® mark) |

thank-you is pixel-identical to the design. The other two differ in exactly one
thing, described under "Still open" below.

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

## Still open — the ® mark, and why CSS cannot finish it

**Every `<sup>` was converted into a verbatim HtmlEmbed, and an embed is a
`<div>`.** A div is a block box in the middle of a sentence, and it is not
phrasing content — so where the mark sits inside a `<p>`, the HTML parser
**closes the paragraph before it**, and the mark plus any text after it fall out
of the paragraph entirely. `<p class="eyebrow">Limited-time Invisalign<sup>®</sup>
offer</p>` becomes a paragraph reading "Limited-time Invisalign", followed by a
loose "® offer".

Counts: 19 marks on invisalign (7 inside a `<p>`), 5 on nps (1 inside a `<p>`),
0 on thank-you — which is exactly why thank-you is the page that matches
perfectly.

`.w-embed:has(> sup){display:inline}` is in the patch and removes the block box,
which is a real improvement. It **cannot** fix the in-paragraph cases: the split
is a fact of the DOM the parser built, and no selector can un-split it. The
residual height (+588px invisalign, +198px nps, +0 thank-you — about one line
per mark) tracks the mark count.

The honest fix is upstream: stop emitting `<sup>` as an embed. Either give the
design a `<span class="reg">` styled `vertical-align:super;font-size:smaller`,
which the converter can express as a real Webflow Span, or special-case `<sup>`
in the converter. Both need a rebuild.

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
