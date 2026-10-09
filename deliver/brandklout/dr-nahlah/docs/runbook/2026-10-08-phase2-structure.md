# 2026-10-08 — Phase 2 structure on STAGING: spacing tokens (A), one combo class (B), 19 classes folded (D)

Fleet brief: `deliver/process/tools/instatic-api-sync/output/fleet/BRIEF-phase2.md` (+ `BRIEF-common.md`),
standard `CLASS-STANDARD.md` §10. **Staging only** (`staging.drnahlah.com`); production untouched. Logs,
backups and captures: `deliver/process/tools/instatic-api-sync/output/fleet/dr-nahlah/` in the main checkout
(gitignored); `STATUS-phase2.md` there is the coordinator's copy of this. Session bk-dr-nahlah, 10:05–00:30Z.
No visual change, by construction and by gate: the site's CSS now has the Client-First SHAPE, not only the names.

## Done
1. Step 0: `draftMatchesPublished: true` (68 pages, seq 215); `backup-site.mjs` → `backup-pre-phase2/`
   (68 rows, 66 HTML). Structure before: space scale missing (all 10 steps), type tokens ok, **4** overrides,
   **24** split classes, **5%** of rem spacing on tokens.
2. Baselines: `migration-gates.mjs snapshot p2-before` (109 URLs: 66 pages + 43 posts) at 1440 / 390 twice,
   1920 once (see gotchas), runtime at 1440 / 390; `head-parity.mjs save dr-nahlah-p2-before` (109 URLs).
3. **A** `scale-tokens.mjs --apply` (seq 215 → 246, published 15:22Z): the 10 house steps added to the
   Framework group "Spacing"; **153 rules rewritten, 260 of 948 rem spacing literals pointed at a step**
   (space-small ×103, -medium ×52, -xsmall ×35, -large ×33, -xlarge ×18, -xxlarge ×12, -huge ×3, -xhuge ×2,
   -xxsmall ×2); 688 off-scale literals stay for step C. No type map needed (every role class already read a
   Framework variable since 2026-10-04). css parity p2-before → p2-mid: **0 real at 1440 and 390 (0 raw,
   2.24 M values each), 0 real at 1920 after the flipper proof** below.
4. **B** `context-combo.mjs`: one candidate, `.landing_contact-details .text-style-tagline {color, font-size}`
   → `text-style-tagline is-landing-contact` on **24 nodes / 6 ads thank-you pages**, rule
   `.text-style-tagline.is-landing-contact` (same specificity, same seat). Map tracked at
   `workflows/22-instatic-api-sync/class-standard/combo-map.json`. Applied seq 246 → 247, published 18:18Z.
   Three overrides stay (refused: a tag in the selector): `.section_page-hero h1.text-style-tagline`,
   `.section_arrival h1.text-style-tagline`, `.section_content h1.text-style-tagline` {font-size} — the keyword
   H1 rules from Scenario 7 (2026-10-06d/08). css parity p2-mid → p2-after: **0 real at 1440 / 390 / 1920**
   (one broken `~n` capture of `ads-landing-pages/alexandria-dental-implants-thank-you` at 390, covered by the
   first comparison and re-read once more: 227 elements, 13,177 values identical to mid).
5. Runtime p2-before → p2-after (A + B together, as the updated brief asks): every page identical except
   `dental-implants @1440`, explained below (a broken baseline capture).
6. **D** `fold-split.mjs --apply` (seq 247 → 248, published 23:36Z): **19 classes folded into their chip, 43
   rules removed** (versus_row, standard_grid, menu-drawer_grid, intro_component, split_component,
   stats_component, related-pages_component, facility_grid, whitening-table_table, office-card_grid,
   transformation_compare, story_row, reviews_wall, blog_grid, video_grid, legal_office-choice,
   article_related-grid, next-steps_list, mobile-bar_component). **5 left split for a person** (a shorthand
   meets a longhand of the same family in the group): `section_arrival` (overflow), `nav_menu-slot`
   (transition), `menu-drawer_footer` (margin), `facility_figure` (overflow), `lp-warn` (border).
   Proof: see "Fold proof" below.
7. Structure after: space scale ok, type tokens ok, **3** overrides (the refused h1 rules), **5** split
   classes (the refused five), **45%** of rem spacing on tokens (242 token / 297 literal; the fold dropped
   6 dead duplicate declarations that counted before).
8. Head parity p2-before → p2-after (after D): **0 of 109 URLs differ** (title, every meta, canonical, JSON-LD).
9. `migration-gates.mjs final`: **EDITABLE · IN BOUNDS · CLEAN · editor canvas ok** (3 frames, 0 overlays).
10. **Local source** `workflows/04-design/.tmp/site-src` (tracked): `scale-tokens.mjs --files` → 26 CSS files,
    170 rem values on steps (433 off-scale stay); the combo added to the 12 `text-style-tagline` spans of the
    three `ads-*-thank-you.body.html` sources and the selector rewritten in `css/70-landing.css`; the Framework
    mirror pulled to **`css/01a-framework.css`** (50 variables; new file, sorts after `01-tokens.css` and before
    `02-base.css` in the build's code-point order, so the Framework's values win over the old literals);
    `node build-site.mjs` 56/56 → `final-site/` (24 combo nodes across the six built thank-you pages, same as
    staging); `class-sync-check.mjs`: the build-only list is identical to phase 1's (29), the site-only list
    grew only by Scenario 7's API-made classes (is-block, faq_list, faq_answer, read-on_link …) — nothing
    phase 2 touched differs. D needs nothing in the source (the split existed only in the registry).

## Fold proof
- `migration-gates diff p2-after p2-folded` (109 URLs, two captures per side): css **0 real at 1440 (0 raw), 0 real at
  390 (0 raw; one broken `~n` capture of `ads-landing-pages/alexandria-dental-implants-thank-you`, covered by the
  first comparison), 1920: 4 "real" of 20 raw = the auto-margin flipper** on `patient-center section:4>div:1` and
  `dental-conditions section:2>div:1`, both of which read 0px in p2-mid and 115.203px in p2-mid~n (one unchanged
  state; `inspect-1920-p2-folded.txt`). Runtime p2-after~m → p2-folded: 16 first-pass
  differences, all the Termly "Cookie Policy" banner control on 8 posts; re-captured: **RUNTIME PARITY OK, no
  difference survives a second capture**. The gate's exit 1 is the 1920 flipper alone.
- css-parity at one width inside every breakpoint band, pre-fold (p2-after state) vs post-fold, 109 pages each,
  single captures through slot mode: **1100 → 0, 850 → 0, 600 → 0, 420 → 0 differences** (`css-diff-fold-<w>.log`).

## Gate evidence, investigated to a cause
- **css 1920, 4 "real" before → mid and 4 before → after.** The p2-before 1920 pass hung (css-parity had no
  CDP timeout; fixed on main `8d2fe435` the same afternoon) and was killed; the `~n` pass completed, and to
  start A on time it was copied as the first capture too (`parity-dr-nahlah-p2-before-1920.json` = `~n`).
  With one before capture the gate cannot subtract before-side flips, so the auto-margin flipper of this site
  (`margin-left/right` 0 ↔ 115.203px on `section > div:1` containers, width unchanged at 1689.59px; proven on
  2026-10-04 and 10-06) surfaces as "real". Proven again on one unchanged state: three captures of
  `emergency-dentistry` at 1920 (`gates-flip-mid.out`) read 115.2 / 115.2 / 0; `tysons-all-on-4` and `our-team`
  read 0 in p2-mid and 115.2 in p2-mid~n (`inspect-1920-p2*.txt`). Every 1920 raw line is this pattern; the only
  other raw lines were one budget-expired page (`five-year-warranty`, recorded empty) covered by its `~n`.
- **runtime `dental-implants @1440`: "3 more stuck, visible 501 → 550".** The p2-before capture of that page
  has **empty root classes** (`wz-ready`/`wz-kit` never set: the site runtime did not boot), 0 stuck, 501 visible
  and a dead drawer; every other capture of that page, in both states, reads 3 stuck / 550 visible / runtime
  booted (2026-10-06 before + after, p2-mid, p2-mid~r, p2-after). The p2-after~r re-check read 55 stuck
  (reveals unfinished on a loaded machine) and so the gate called it persistent. The page is not touched by A
  or B (its CSS parity is 0 at every width). `runtime-dental-implants-p2-before-vs-mid.txt`.
- **runtime "Cookie Policy control gone" on 8 posts (both widths).** The Termly banner button: present in
  p2-before and p2-mid~r, absent in the 2026-10-06 before/after, p2-mid and p2-after of the same unchanged
  pages (`runtime-cookie-control-history.txt`). Banner load timing; it never survived a re-capture.

## Next
- **Step C** (visible: snap the 688 off-scale rem spacing literals to the nearest step) is the user's
  decision per site after a before/after; not run.
- The 5 split classes and the 3 `h1.text-style-tagline` overrides stay for a person (listed above).
- Production: same three tools, same gates, after review (production still has the OLD class names and no
  phase 1 either).
- Every `22-instatic-api-sync/push-*.mjs` and `ads-to-nodes.py` + `push-ads-pages.mjs` that rebuilds the
  thank-you pages must carry `is-landing-contact` (the source does now); a full `push-site.mjs` from
  `site-src` would not undo phase 2 (source and staging carry the same tokens and combo).

## Gotchas
- **Captures are a shared, slow resource today**: two machine-wide slots, a 6 GB free-memory guard, and five
  sites capturing. A 109-URL style pass takes ~15 min when it runs, hours when queued; the runtime pass ~75 min.
  Run every multi-hour pass as a DETACHED process (`Start-Process` of a `.cmd` that calls
  `migration-gates.mjs`), not a Claude Code background shell: the harness killed an idle background capture
  for low memory at 12:04Z (it had just taken a slot and launched Chrome, which survived as an orphan).
- The slot waiter polls every 30 s; a hand pass lost the freed slot to other sessions four times in a row.
  Queue ordering was added on main later that day ("place N of M in the queue").
- A single before capture (no `~n`) makes the gate report every flipper on that side as real. Capture both or
  prove the flip on one state (three captures of one page through slot mode take minutes).
- `Get-CimInstance Win32_Process | ? CommandLine -match <pattern> | Stop-Process` matches the PowerShell/bash
  that runs it (its own command line carries the pattern): filter on `Name` (cmd.exe / node.exe) first.
- Framework mirror for a source that still declares the same names: a NEW file sorted after the tokens file,
  not an edit of `01-tokens.css` (the mirror is regenerated by `framework.mjs pull`).
- Tool reports in `TOOL-BUG.md` (fleet folder): the css-parity hang (fixed on main `8d2fe435`), a slot
  reclaimed from a live owner.

## Version Control
Follows the root rules in [SYSTEM_RULES.md](../../../../../SYSTEM_RULES.md). Committed on `bk-dr-nahlah`
only (combo map, site-src + final-site, this run, INDEX, RUNBOOK rows). Nothing pushed, nothing on main.
