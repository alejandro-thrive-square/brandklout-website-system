# Staging vs local design — parity findings (2026-08-10)

Source Asana task GID: 1217040406855582

The existing gates (scrub-proof, staging-verify, pin-fit) all pass, and they are
still right about what they measure — motion, reachability, fit. None of them
asks whether the built page **looks like the approved design**, which is what
the client asked. Two new gates do:

| gate | question | run |
| :--- | :--- | :--- |
| `08-qa/.tmp/parity.mjs` | is the same CONTENT there — copy, assets, icons | `node parity.mjs [page]` |
| `08-qa/.tmp/deep-diff.mjs` | does every element RENDER the same | `node deep-diff.mjs [page]` |

Both fingerprint the local design and staging and diff. Reports land in
`08-qa/.tmp/parity/`.

## Content is intact — the drift is entirely visual

`parity.mjs` on invisalign: **241 / 241 text runs identical**, 10 / 10 images
identical, 37 / 37 icon geometries identical. Every asset is mapped correctly;
the CDN filenames keep the design's own basename after the 24-char asset id
(`6a75f6f55de88305f0932586_logo.webp` is `logo.webp`). No missing section, no
swapped photo, no wrong icon.

So "make them identical to the local version" is a **styling** job, not a
re-paste. Nothing needs re-pasting and no asset needs re-uploading.

## The pairing traps — read before trusting any diff

Three things break naive element pairing, and each one produced a page of
confident nonsense before it was fixed:

1. **Webflow wraps the whole page in `div.page-wrapper`.** An ancestor-chain
   signature shifts by one level, and body-level siblings pair at random — it
   matched the design's sticky `div.offer-rail` against the page wrapper and
   reported the rail as completely unstyled. `deep-diff.mjs` now anchors on the
   nearest **id** instead, which both sides share.
2. **A verbatim SVG lands as `<div class="… w-embed"><style>…<svg></div>` INSIDE
   the design's own element.** The wrapper has no design counterpart, so it
   pushes every following sibling's nth out of step.
3. **The converter materialises `::before`/`::after` into real elements**
   (`arr-bg-after`, `step-before`, `summary-after`, `price-was-after`,
   `chapter-after`), because a Webflow class cannot carry a pseudo. Same problem.
   Careful: `catch-after` and `hes-after` ARE the design's own real elements and
   must not be swept up with them.

After all three: **528/542, 466/470, 226/230 paired**. Before: 411/542, and the
findings were mostly artefacts.

Colour comparison also needs a tolerance — Webflow stores at 8-bit/2-dp, so a
design colour comes back a shade off (`rgba(6,182,217,.53)` vs
`rgba(2,180,216,.54)`). And `border-color` on a **zero-width** border paints
nothing; reporting it buries the real findings under inherited defaults.

## Confirmed defects

Ordered by how visible they are.

### 1 — Dark chapters render in light-theme colours (all three pages)

The design themes per section with `data-theme="dark|light"`, which swaps a block
of custom properties. **The section backgrounds converted correctly** — chapter
02 and 05 are `rgb(38,41,47)` on staging exactly as designed. What did not
convert is the four **descendant** overrides, because a Webflow class has
nowhere to put a rule that only applies inside a dark section:

```css
[data-theme="dark"] .chapter-tag { color: #8FDCEC; }
[data-theme="dark"] .lead        { color: rgba(255,255,255,0.78); }
[data-theme="dark"] .label       { color: #8FDCEC; }
[data-theme="dark"] .btn--ghost  { border-color: rgba(255,255,255,0.34); color: #fff; }
```

So dark grounds carry the LIGHT palette: chapter tags at `#007E9B` and leads at
`#525A64` on near-black. 7 elements on invisalign, 7 on new-patient-special,
6 + 2 on thank-you.

The `data-theme` attributes themselves DID survive the paste (verified with
`08-qa/.tmp/theme-probe.mjs`), which is what makes the fix simple.

### 2 — Every figcaption block is centred (24 inv / 33 nps / 9 ty)

Webflow's own base stylesheet carries a **bare-tag** rule:

```css
figcaption { text-align: center; margin-top: 5px; }
```

`.inv-figcaption` sets no `text-align`, so Webflow's default wins and the whole
testimonial and team-card caption subtree centres — reviewer names, roles, the
Google mark. The design leaves them start-aligned. This is the single largest
count of drifted elements, and it comes from one rule.

### 3 — `.chip` lost its white pill (4 inv / 19 nps)

Stored record vs design:

| | design | site record |
| :--- | :--- | :--- |
| `display` | `inline-block` | `flex` |
| `background` | `#ffffff` (`var(--card)`) | *absent* |

Border, radius, padding and colour all converted. The chips render as
transparent full-width flex rows instead of white pills.

### 4 — The sticky offer rail is unstyled (invisalign, new-patient-special)

`.offer-rail` stores only `display`, margins, `font-family: Inter`,
`color: #525A64`, `font-size`, `line-height`. Everything that makes it a rail is
missing: `position: fixed`, `left`, `bottom`, `z-index`, `width`, `transform`,
`align-items`, `gap`, `padding`, `border-radius: 999px`,
`background: rgba(32,36,42,.96)`, `box-shadow`. Its `.rail-sep` divider is gone
too. The breakpoint ladder (`main: flex`, `small/tiny: none`) IS correct.

### 5 — Webflow base rules the design never counters

Same class of fault as the figcaption rule — bare-tag defaults from Webflow's
stylesheet that the design's own reset would have beaten locally:

- `blockquote` gets `border-left: 5px solid #e2e2e2` — a grey bar down the left
  of all three invisalign testimonials.
- `label` gets `font-weight: bold` — the consent line on both form pages renders
  700 where the design is 400.
- `sup` gets `font-size: 75%; line-height: 0` — every ® mark sits at the wrong
  size with a collapsed line box (~20 elements across the three pages).

### 6 — Dropped descendant rules

Same root cause as the dark theme: a descendant selector has no class to live on.

- `.faq .answer-wrap { display: grid; grid-template-rows: 0fr }` — dropped, so
  the invisalign FAQ accordion has no height to animate (8 elements). This one
  is **functional**, not only cosmetic.
- `.site-foot .fine { color: rgba(255,255,255,.45) }` — dropped; the footer's
  fine print renders slate on dark.
- `.progress span.on { background: var(--sand-deep) }` — dropped; the arrival
  progress dot is grey instead of cyan.

### 7 — Smaller colour drifts, to confirm individually

`.eyebrow` on the nps invitation (design `#26292F`, staging `#007E9B`) and
`.btn--ghost` border alpha (design `.45`, staging `.12`). Both are single
elements and both need the design's own cascade checked before patching.

## Not defects — pairing crosswise

Left in the report but verified as artefacts of two adjacent siblings pairing
the wrong way round. Do not "fix" these:

- `div.rating` ↔ `div.arr-cue` (invisalign and nps report them mirrored)
- `div` ↔ `foot-base`, `div.wrap` ↔ `foot-grid`

## The fix, and why it is a head block and not 60 style records

Most of these cannot be expressed as a Webflow class at all — a descendant
selector under `[data-theme]`, a bare-tag override of Webflow's own base, a
`clamp()`/`min()` value the style panel cannot parse. The site already carries a
custom head `<style>` block (the fluid `html` rung, the `.x.x` specificity
boosts, the runtime-state CSS), and it is injected **after** the Webflow
stylesheet link, so equal-specificity rules in it win on source order.

So: extend that head block with a parity patch copied from `shared/mpd.css`, and
use `update_style` only where a real class record is simply missing a
declaration (`.chip` background and display, `.offer-rail`'s visual properties).

Verification is `deep-diff.mjs` again, on all three pages, plus a re-run of
`scrub-proof` and `staging-verify` to prove nothing regressed. Leave 30–45s
between staging runs or the CDN closes connections and the results are garbage.
