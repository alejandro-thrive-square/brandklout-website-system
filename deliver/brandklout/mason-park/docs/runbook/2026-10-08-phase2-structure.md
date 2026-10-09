# 2026-10-08/09 — Phase 2 structure (tokens, combo classes, fold split classes), STAGING

Brief: `instatic-api-sync/output/fleet/BRIEF-phase2.md` on main (CLASS-STANDARD.md §10). Tools in
`deliver/process/tools/instatic-api-sync/` (main `d9f09d0a`+). Logs and backups:
`instatic-api-sync/output/fleet/mason-park/` (gitignored). **Production untouched.**

## Done (staging.masonparkdental.com, seq 162 → 165)
| Step | Result |
| --- | --- |
| 0 status | `draftMatchesPublished: true` (65/65 pages, seq 162) before every write |
| 0 backup | `backup-pre-phase2/` (site.json, 65 rows, 63 HTML; seq 162); per-write backups `shell.before-scale-tokens.162.json`, `before-context-combo.163.json`, `shell.before-fold-split.164.json` |
| 1 baseline | `head-mason-park-p2-before/` 224 URLs; `migration-gates snapshot p2-before`: css 1440/390/1920 (+`~n`), runtime 448 captures |
| 2 **A** scale-tokens + type map | seq 163, published 2026-10-08 14:52Z. Framework + 10 house spacing steps; 255 rules, 382 of 1,377 rem spacing literals (28%) → `var(--space-*)`, 995 off-scale stay; `--type`: `heading-style-h5` 1.1rem → `var(--size-h5)`, `text-size-regular` 1rem → `var(--size-text-regular)`, `text-size-medium` 1.06rem → `var(--size-text-medium)` (Typography bases 17.6 / 16 / 16.96px, `:root#1372` formulas) |
| 2 proof | css p2-before → p2-mid: **PARITY OK** at 1440 (6,093,032 values), 390 (6,115,039), 1920 (6,093,032), 224 pages. Style captures only (brief change 2026-10-08) |
| 3 **B** context-combo | seq 164, published 2026-10-08 20:37Z. 9 rules rewritten, 65 pages gain combos (map below) |
| 3 proof | css p2-mid → p2-after: **PARITY OK** at 1440 / 390 / 1920; runtime p2-before → p2-after: 44 raw, 4 persistent, all traced (below) |
| 3b **D** fold-split | seq 165, published 2026-10-09 06:27Z. 182 classes folded into their chip (214 rules removed), 36 left split (below) |
| 3b proof | css p2-after → p2-folded: **PARITY OK** at 1440 / 390 / 1920; pre-fold → post-fold **PARITY OK** at 1100, 850, 420 (its first pass died on a connect timeout) and 600 (recaptured: the internet drop had emptied 141 of 224 loads of the first pass, 60,585 "differences" of body height 0 / ELEMENT GONE; the clean recapture: **PARITY OK**). Runtime p2-after → p2-folded: 6 raw, 5 persistent, traced to the gate's click under the call bar (below) |
| 5 head-parity | p2-before → p2-after: **0 of 224 URLs differ** |
| 5 final | `migration-gates final`: **EDITABLE** (every style in the Framework or the Styles panel) · **IN BOUNDS** · **CLEAN** (no old class name published) · editor canvas ok (3 frames, 0 overlays) · structure report as below |
| 5 structure | before → after: space scale FAIL → **ok**; type tokens FAIL (3) → **ok**; overrides **41 → 31** (the refused ones); one rule/class **218 → 36** split; spacing on tokens **10% → 42%** (489 var / 671 literal) |

Maps (tracked): `workflows/class-standard/type-map.json`, `workflows/class-standard/combo-map.json`.

## Combo map (reviewed)
| Old selector | Combo | Nodes |
| --- | --- | --- |
| `.navbar_actions .button` | `button is-navbar` | 65 |
| `.chapter_component .button::after` / `:hover` | `button is-chapter` | 289 |
| `.chapter_component .button.is-large` | `button is-large is-chapter-large` | 250 |
| `.chapter_component .button.is-ghost-light` (+`::after`, `:hover`) | `button is-ghost-light is-chapter-ghost-light` | 125 |
| `.arrival_actions .button` | `button is-arrival` | 126 |
| `.landing-rail_component .button` | `button is-landing-rail` | 6 |

The tool refuses one name over different node sets, so the `is-large` / `is-ghost-light` variants carry
their own combos (the proposal had `is-chapter` on all of them). No script names any of the six combos.

## Overrides that stay (31, for a person)
Selector lists (`.background-color-ink/-slate .heading-style-h1…h4`, `… .text-style-eyebrow` (+`::after/::before`),
`… .button.is-secondary/.is-ghost` (+`:hover`), `.chapter_component .button,.chapter_component a.button`,
`.blog-article_table-of-contents a:hover, … a.is-active`): split by hand first. Runtime classes `hero_overlay`,
`step-card_component`, `lp-page`; `.chapter_component .button.is-ghost*` (3 rules, no node: dead);
`.landing-rail_component>a:not(.button)`; `.matrix_component td a.button.financing_apply` (+`:hover`);
`.is-landing-page .navbar_actions .button` (3 classes would become 2).

## Split classes left (36, for a person)
Shorthand + longhand in one group (border / background / flex): `navbar_toggle`, `card_component`,
`notice_component`, `step-card_component`, `service-card_component`, `path_card`, …; a declaration that
would move past an equal-specificity rival: `badge-strip_component`, `fact-strip_component`, `hero_copy`,
`relay_after`, `section_relay`, `section_together`, `landing-why_card`, …. Full list with reasons:
`output/fleet/mason-park/fs-p2-apply.txt`.

## Runtime differences traced (p2-before → p2-after, 4 persistent)
- `blog/post-treatment-care-…` @390 and `blog/the-long-term-benefits-…` @390, "control gone" ×17 each: the
  p2-before entries hold the placeholder label `control #N` from #5 on. That label is what runtime-parity
  stores when its label read throws, and these are exactly the two pages on which the p2-before Chrome died
  (the last page before each crash); the entries carried no `capture:` error, so `--resume` kept them. The
  p2-after captures list the normal table-of-contents links. A capture artefact, not the site.
- `ads-landing-pages/new-patient-special-consultation` @1440 (4 → 6 stuck) and `blog/invisalign-in-katy-tx-how-to-find-…`
  @1440 (11 → 13): reveal timing. `stuck-parity.mjs` (same scroll-through, lists the elements) on the live
  post-B site reproduced the *before* values (4 and 11); the elements are scroll-written chapter tags and
  headings that reveal within 3 s, plus the closed navbar dropdowns; no button or combo among them. The
  count varies 11–13 across the 161 articles in both captures.
- p2-after → p2-folded: 6 raw; the recheck dropped the ad-page reveal and kept 5: FAQ `summary` controls on
  `services/emergency-dentist` @390 "DEAD now" in both post-fold captures. Cause, from a replay of the gate's
  own click sequence (`faq2-parity.mjs`): on this GSAP-journey site `scrollIntoView({block:'center'})` leaves
  the summary off-screen, so puppeteer's `page.click` scrolls it to the viewport's bottom edge, where the
  fixed `a.callbar_component` (48 px, z-index 95) sits under the pointer; the click hits the call bar and the
  details stays closed. Which summaries land there depends on scroll timing: the replay killed 3 on that page
  and 2 on `services/wisdom-teeth`, a page the gate had passed; every one opens from a person's position
  mid-viewport, and a programmatic click opens all 8. Call bar and scroller are untouched by the fold (css
  0 real at seven widths). A gate artefact that can persist across two captures, not the site.

## Local source (step 4): left untouched, deliberately
`workflows/09-static-rebuild/home/` (+ `home/assets/site.css`) is pre-phase-1: 231 pages on the old names,
0 on the new. Every change since 2026-10-05 reached staging through API scripts, never a full push; a full
push would first undo the 497 renames. Before any future full push replay, in order: `class-rename.mjs
--files` with `class-map.json`, `scale-tokens.mjs --files`, the combo map, `class-sync-check.mjs`. Same
call as Stone Surgical Arts. D does not touch a source (the split exists only in the registry).

## Next
- Production after review: the same three applies (A with `--type`, B with the map, D) with the same gates;
  production's draft must match published first.
- The 31 overrides and 36 split classes above are hand work; step C (snap the 671 off-scale spacing
  values) is the user's call per site after a before/after.

## Gotchas
- A `migration-gates snapshot` prints nothing until a pass ends (`spawnSync`): an empty log is a running
  capture. Check `Win32_Process` for `css-parity.mjs snap` children.
- `runtime-parity --resume` keeps an entry whose browser died *during* the controls loop: the controls from
  that point carry `control #N` labels and the diff reports them as "control gone". Before trusting a
  resumed baseline, grep its JSON for `"control #`.
- `context-combo.mjs` proposes one combo name for a context even when its sub-selectors match different
  node sets, then refuses that map: split the names yourself.
- Killing a bash chain from PowerShell: `Stop-Process` on the bash parent can fail silently and the chain
  carries on with the next step. Check `Win32_Process` after, every time.
- A network drop during a css-parity pass yields near-empty captures (body height 0, "ELEMENT GONE" on
  everything) that diff as tens of thousands of differences: count nodes per page before reading the diff.
- `migration-gates slot` guards only `*parity.mjs snapshot …` arguments; any other script runs unslotted
  (name a probe `<x>-parity.mjs` and pass `snapshot` first to get a slot).
- runtime-parity "control DEAD now" on a `summary` at 390 on this site is usually the fixed call bar: the
  gate's `scrollIntoView` does not move the journey scroller, puppeteer parks the control at the bottom edge,
  and the click lands on `a.callbar_component`. Replay with `output/fleet/mason-park/faq2-parity.mjs` before
  believing it; it hits pages that passed the gate just as well.
