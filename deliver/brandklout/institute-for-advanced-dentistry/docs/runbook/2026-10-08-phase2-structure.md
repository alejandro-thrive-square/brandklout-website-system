# 2026-10-08 — Phase 2: Client-First structure on staging (tokens, combo classes, folded classes)

Fleet phase 2 (`instatic-api-sync/output/fleet/BRIEF-phase2.md` on main; `CLASS-STANDARD.md` §10), the IFA
session. Brief: bring the CSS into the Client-First SHAPE, not only its names, with no visible change:
**A** spacing and type read the Framework, **B** contextual overrides of role classes become combo classes,
**D** classes split over several registry rules are folded into one. Step C (snapping off-scale spacing,
visible) was not part of this run. **Staging only.** Production (the WordPress clone on `www.ifadentistry.com`)
was not touched.

IFA is pushed from a local source, so every change was made in `site-src` and pushed through `push/`
(README order) three times: A (seq 24), B (seq 27), D (seq 31). Staging was never written directly.

## Done

- **A, tokens.** `scale-tokens.mjs --files site-src/css --apply`: 208 rem spacing values that equal a house
  step now read `var(--space-*)` (9 files; 363 off-scale values stay literal for step C). The 10 house steps
  (`space-xxsmall` 4px … `space-xxhuge` 192px) and the 6 role-class type bases (`size-h1-base` 96px,
  `size-h2-base` 64, `size-h3-base` 36, `size-h4-base` 24, `size-text-lede-base` 20, `size-text-label-base`
  12.48) are Framework tokens: `01-tokens.css` carries the preview copy, `framework-spec.json` the spec,
  `push/editable.mjs` moves the `:root` copies into the Framework on every push (new: it now handles
  `typography` and `spacing` like the colours, never overwriting a panel value). The role classes read
  `var(--size-h1)` … with the formulas `--size-h1: calc(var(--size-h1-base) * var(--s-d1))` kept in `:root`,
  exactly what `scale-tokens.mjs --type class-standard/type-map.json` plans on the site (its dry run was the
  spec; after the push the same dry run reports 0 rules left to rewrite). `framework.mjs pull` of the live
  Framework is `class-standard/framework.pulled.css` (38 variables).
- **B, combos.** `context-combo.mjs` proposed 17 of the 19 overrides; the reviewed map is
  `class-standard/combo-map.json` (names kept readable; `is-plain-h1` renamed `is-plain-hero`). Applied to the
  source by a new `site-src/tools/combo-classes.mjs` (tag scanner over `pages/` + `partials/`, the 18 rule
  selectors rewritten in place to `.role.is-x`), the same combos written by hand into the templates of
  `tools/gen-journal.mjs` (a regeneration reproduces the patched pages byte for byte). `--check dist`: every
  node the old selectors match carries its combo and no other node does; the counts equal the staging
  proposal's node for node (footer label 232, hero h1 57, plain hero 31, tile label 127 …). After the push
  `context-combo.mjs` on staging proposes 0.
- **Refused, stay for a person:** `.is-cosmetic .checklist_copy .text-style-lede` and
  `.is-gallery-lightbox .lightbox_caption .text-style-label` (three classes would become two: specificity).
- **D, fold.** `push/editable.mjs` runs `fold-split.mjs` right after css-to-registry on every push (the push
  rebuilds the registry, so the fold has to be part of the pipeline). On the D push: **53 classes folded into
  their chip (68 rules removed), 34 left split** for a person (its log: `push/.tmp/editable-fold-split-apply.log`,
  copied to `output/fleet/institute-for-advanced-dentistry/fold-split-apply-d.log` on main's checkout). The
  34 are refused for a reason each: a declaration that would move past a selector-list rule of equal
  specificity on a shared element (`.voices_component`, `.text-rich-text>*+*`, `.arrival_copy,.arrival_figure,…`),
  a shorthand and a longhand of one family in the group (`border`, `overflow`), or a `::before` rule in
  between. Those classes are edited in the Styles panel on the later rule, as before.
- `push/cascade-check.mjs` now allows the Framework's spacing and type tokens to be missing from the
  published stylesheet, as it already allowed the colours.
- Docs: `site-src/KIT.md` (*Class names*: tokens, no contextual overrides), `push/README.md`,
  `class-standard/README.md`.

## Structure report (`structure-audit.mjs --site`)

| Check | Before | After A | After B | After D |
| --- | --- | --- | --- | --- |
| space scale | FAIL (Framework lacks all 10 steps) | ok | ok | ok |
| type tokens | ok (role classes read `var(--s-*)`) | ok (Framework bases) | ok | ok |
| overrides | 19 | 19 | 2 (refused) | 2 (refused) |
| one rule/class | (not reported then) | 87 split | 87 split | 34 split (refused) |
| spacing on tokens | 5% (38 / 700) | 39% (290 / 453) | 39% | 39% |

## Gates (staging)

| Gate | Result |
| --- | --- |
| css parity `p2-before → p2-mid` (A) | **0 real of 0 raw** at 1440 / 390 / 1920 |
| runtime parity `p2-before → p2-mid` | **OK**: 4 first-pass items (GoHighLevel iframe page heights, a skip-link timing flip), none survives a second capture |
| css parity `p2-mid → p2-after` (B) | **0 real of 0 raw** at 1440 / 390 / 1920 |
| runtime parity `p2-mid → p2-after` | **OK**: 12 first-pass items (skip-link timing, GoHighLevel iframe page heights, a slider and an FAQ button), none survives a second capture |
| css parity `p2-pre-fold → p2-post-fold` (D) at 1100 / 850 / 600 / 420 | **PARITY OK, 0 differences** at each width (one width inside every breakpoint band) |
| css + runtime parity `p2-after → p2-folded` (D, the three standard widths) | pending |
| `head-parity diff p2-before → p2-final` | **0 of 57** URLs differ |
| `migration-gates.mjs final --map class-map.json` (after D) | **EDITABLE · IN BOUNDS · CLEAN · editor canvas ok** (3 frames, 0 overlays); structure report as the table above |
| `fold-split.mjs --site` dry run after D | nothing left to fold; the 34 refused listed |
| `scale-tokens.mjs --site` dry run after A | 0 rules left to rewrite; 435 off-scale literals stay |
| `context-combo.mjs --site` after B | 0 candidates; 14 stay (themes, states, the 2 refused) |
| `combo-classes.mjs --check dist` | every matched node carries its combo, 0 elsewhere, 17 of 17 |
| `editability.mjs --published` after A and after B | **EDITABLE** (Framework owns 38 variables) |
| `class-audit.mjs --site --strict` | **IN BOUNDS** (366 classes after B) |
| `class-sync-check.mjs --build site-src/dist` | build = site except the form slot and `__cf_email__` (as always) |
| `push/cascade-check.mjs` after A, B and D | **OK**: 3,426 declarations, 0 missing (16 Framework tokens allowed), 0 swaps the cascade can see (4,329 pairs reordered by the fold, none visible) |
| `editability` / `class-audit` / `class-sync-check` after D | EDITABLE / IN BOUNDS / form slot only |

## Next

- Step C (snap the 435 off-scale spacing literals to the nearest step) is a visible change: the user decides
  per site after a before/after.
- The two refused overrides can be made combos by hand if wanted (`text-style-lede is-cosmetic-checklist`,
  `text-style-label is-lightbox-caption`), writing the rules at three-class specificity.

## Gotchas

- **The source is the truth, so every phase-2 tool runs twice:** on `site-src` to change it, on staging only to
  plan or to prove. `scale-tokens --files` has no `--type`: the type move is written by hand in `01-tokens.css`
  and `02-base.css` from the tool's site dry run, and the same dry run after the push must report 0.
- **Framework tokens need three homes**: `01-tokens.css` (preview), `framework-spec.json` (editable.mjs adds
  only what the panel lacks) and the panel itself. `cascade-check` must know the spec's names or it reports
  the moved tokens as MISSING.
- **The combo tool's counts on staging are the spec for the source**: `combo-classes.mjs --check dist` must
  print the same node counts, or the source misses nodes the generator or a partial produces.
- **Capture passes go through `migration-gates.mjs slot`** (machine-wide slots, 3 since `ee92f546`); a pass
  queued by an older gate process only sees the first two slots. Claude Code's background shells were killed
  for low memory twice during this run: long captures ran detached (`output/fleet/<client>/run-passes.sh`,
  `run-diff.sh`, `run-bands.sh` on main's checkout) and were polled with bounded foreground waits.
- `runtime-parity` prints nothing until a pass ends; a 57-page runtime pass took 37 minutes on the shared machine.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../../SYSTEM_RULES.md).
