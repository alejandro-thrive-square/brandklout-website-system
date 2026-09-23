## DONE 2026-08-22: the hero gradient, and the gate that could not see it — `f8ca058`

**Client-visible defect, now fixed and live.** On all 27 interior pages the H1
was sitting on bare photograph. The hero scrim `.pg-hero .ph-bg::after` is three
stacked gradients in the build and had been reduced to **one** on Instatic; the
missing `linear-gradient(100deg,...)` is the horizontal cream floor under the
copy column. `.ch-proof .pf-film::after` on the home page lost its radial
vignette the same way (2 layers -> 1).

**Cause: happy-dom's `background` SHORTHAND parser handles ONE layer.** Given
three comma-separated gradients it returns the LAST one plus a row of `initial`
longhands, and reports success. `conv-encode.ts`'s probe only asked
`length > 0`, so a *partial* parse sailed through — the verbatim fallback fires
only on a TOTAL parse failure. The `background-image` LONGHAND parses layers
correctly, which is why `.ct-form select`'s two-layer arrow survived the same
run. **Only 2 rules site-wide were affected**; the audit is in the repair tool.

**Why nothing caught it: `getComputedStyle(el)` cannot see a pseudo-element.**
The parity gate reported **0 differences on 557,670 values** while this was
live, because every scrim in this design lives in `::before`/`::after` and the
gate never sampled one. That is the transferable lesson — *a green gate is not
evidence when the defect is invisible to the gate.*

Three changes so it cannot recur or hide:
- `repair-multilayer-backgrounds.mjs` — reads the LOCAL build as source of
  truth, repairs any registry rule with fewer layers. Re-runnable, reports
  `nothing to do` when clean, so it is also a check. Writes the draft only.
- `conv-encode.ts` — the probe now asserts no LAYERS were lost, not merely that
  something survived. Verified against real happy-dom on the container over
  `background` / `background-image` / `font-family` / `transition` /
  `box-shadow`: catches the flattening, zero false positives.
- `css-parity.mjs` — samples `::before` and `::after` (skipping `content: none`,
  which would otherwise add two empty bags per element). Coverage 557,670 ->
  **592,834** values.

**Gated:** pseudo-aware diff = exactly **28 differences** (27 hero scrims + 1
proof film), nothing else moved. `compare-local` clean on the scrim subtree at
1440 **and** 390, leaving only the two documented non-defects (`aspect-ratio`
and the blurhash LQIP, both on the `<img>`). Published; screenshot confirms the
copy column has its floor back.

Volume before publishing: **24% used, 657 MB free** — healthy, ~40 publishes.
