# 2026-10-08 — Phase 2: Client-First structure on STAGING (tokens, combo classes, folded classes)

`CLASS-STANDARD.md` §10, fleet brief `BRIEF-phase2.md`, on `staging.masonparkpediatricdental.com` only.
Production untouched. No visual change by construction, proven with the §8 gates. Artifacts in
`workflows/class-standard/` (`type-map.json`, `combo-map.json`, `apply-combos-to-source.mjs`); logs,
backups and captures on main in `deliver/process/tools/instatic-api-sync/output/fleet/mason-park-kids/`
(gitignored; `STATUS-phase2.md` there is the coordinator's view).

## Done
- **Step 0.** `draftMatchesPublished: true` (seq 33); backup `backup-pre-phase2/` (217 html);
  structure "before": space scale FAIL (10 house steps missing), 11 role classes with a literal size,
  11 contextual overrides, **4%** of rem spacing on tokens.
- **A — scale-tokens** (`--type type-map.json --apply`, seq 33 → 34, published 12:44Z): the 10 house
  spacing steps in the Framework; 162 rules rewritten, 251 of 889 rem spacing values → `var(--space-*)`
  (638 off-scale stay literal: step C, not run); 7 role classes → Framework bases (`size-h5` 16.8,
  `size-h6` 15.2, `size-text-tiny` 12.48, `-small` 14.08, `-regular` 16, `-medium` 17.28, `-large`
  20 px) with `:root` formulas. `heading-style-h1`–`h4` keep their `clamp()` sizes (not one base).
  Proof: css parity before → mid **0 real of 0 raw at 1440 / 390 / 1920** (style only, per the
  2026-10-08 rule a17ab9c8).
- **B — context-combo** (`combo-map.json --apply`, seq 34 → 35, published 19:43Z): three contextual
  overrides became combos on exactly the nodes the old selectors matched: `.masthead_actions .button`
  → `.button.is-masthead` (217 nodes; padding + display@767), `.arrival_actions .button` →
  `.button.is-arrival` (434; flex/padding-inline@767), `.doctor_voice .text-style-tagline` →
  `.text-style-tagline.is-doctor-voice` (2). Stay, for a person: `.navbar_actions .button` (runtime
  class), the three `.journey_body .masthead_component … .button` rules (4 classes → 2, selector list,
  runtime `is-solid`), `.background-color-tan .button(:not).is-ghost` and `[data-theme="dark"]` (theme /
  state), `.background-color-ink .text-style-eyebrow` (split class; re-propose after D).
- **Local source `home/`** mirrors A and B: `scale-tokens.mjs --files home --apply` (162 values in
  `assets/site.css`), the three selectors rewritten by exact edit, `apply-combos-to-source.mjs --apply`
  (653 nodes, verified per file: combo = old selector's nodes, no more), `assets/framework.css` pulled
  from the Framework (61 variables) and linked before `site.css` on every page (the live cascade).
  `class-sync-check --build home`: only the pre-existing residue (build `pr-*`/`rv-*`; site Elfsight /
  `__cf_email__`). The role-class rules live in the retired `legacy-migration.css` (workflow 02 `.tmp`),
  not in `home/`: nothing to mirror for the type step.
- **D — fold-split** (`--apply`, seq 35 → 36, published 2026-10-09 05:05Z): 93 classes split over an empty chip
  plus later ambient `.cls` rules folded into ONE rule each (100 rules removed), so the Styles panel edits the
  rule the elements point at. 26 stay split for a person (`fold-dry-post.txt`): shorthand + longhand of one
  family in the group (`button`, `card_component`, `service-card_component`, `service-group_component`,
  `sidebar_component`, `masthead_sub`, `masthead_toggle`, `growth_stage`, `path_card`, `navbar_dropdown-list`,
  and the dead `pr-chip`, `pr-rail`, `rv-item`) or a declaration that would move past an equal-specificity
  rule that can share the element (`navbar_link`, `navbar_item`, `navbar_menu-list`, `navbar_menu`,
  `navbar_actions`, `navbar_toggle`, `navbar_scrim`, `text-style-eyebrow`, `footer_legal`, `chapter_component`,
  `section_arrival`, `foot_component`, `path_bar`).
- **Structure after** (`structure-after.txt`): space scale ok · type tokens: only the 4 `clamp()` headings
  literal (was 11) · overrides 11 → 7 (the refused ones above) · split classes 119 → 26 · spacing on tokens
  **4% → 36%** (285 token / 500 literal; step C would raise it).
- **Gates**: see the table below (filled when run).

## Gates
| Gate | Result |
| --- | --- |
| css before → mid 1440 / 390 / 1920 | 0 real of 0 raw (A) |
| css mid → after 1440 / 390 | 0 real of 0 raw (B alone) |
| css before → after 1440 / 390 / 1920 | 0 real of 0 raw (A + B; the 1920 proof of B, see gotchas) |
| runtime before → after | 434 captures, 3 raw, 2 persistent, both investigated to a cause (not phase 2): `/patient-reviews` height 7130 → 7520 @1440 / 9624 → 10259 @390 is embed content on that page (A/B with the pre-phase-2 compiled CSS swapped in, scripts on: identical heights, `probe-reviews-ab2.txt`; static styles 0 raw; `/contacts` with the same GHL form and `/` with the same Elfsight widget unchanged); the blog TOC `control #33 gone` is the `Conclusion` link captured once without its label (30 controls, 668 visible, 13482 px both sides) |
| D: css pre-fold → post-fold at 1100 / 850 / 600 / 420 | PARITY OK, 0 raw at every band width |
| D: css after → folded 1440 / 390 / 1920 | 0 real of 0 raw |
| head-parity before → after | 0 of 217 URLs differ |
| migration-gates final | EDITABLE · IN BOUNDS · CLEAN · editor canvas ok (3 frames, 0 overlays) |
| structure after | space scale ok · 4 clamp headings · 7 overrides · 26 split · 36% spacing on tokens |

## Next
- Step C (snap off-scale spacing, visible) is a per-site decision after a before/after: not run.
- Production: the same steps after review (A and B are two atomic saves + one publish each).

## Gotchas
- **A reaped background shell is not a dead capture.** Claude Code "stopped" the capture shells for
  low memory three times; each time only the tracked wrapper died and `capture-p2.sh` kept running.
  One such ghost re-captured `p2-mid-1920` after B was published (file set aside); kill the tree with
  `taskkill /T` before relaunching anything, and check `Get-CimInstance Win32_Process` for
  `capture-p2.sh` first. `kill -0 <pid>` in Git Bash cannot see those processes; use `tasklist`.
- `scale-tokens --type` and `context-combo` needed a fix on main (ad3ae844): this site's role classes
  are split over an empty chip and ambient `.cls` rules (css-to-registry append mode), and both tools
  looked for `kind: 'class'` only.
- A proven by style captures alone: a token swap computes the same value, the behaviour capture
  cannot see it and held a slot for hours (a17ab9c8). Behaviour is compared once, before → after.
- Runtime noise on this site: `/patient-reviews` (embed content; the page carries Elfsight, GHL and a
  Maps iframe that lazy-loads) and the long TOC article `blog/pediatric-dental-clinic-care-keeping-little-smiles-healthy`
  (a TOC link sometimes captured unlabelled). When a difference persists across re-captures, the
  decisive test is an A/B of the SAME live page with the old compiled CSS swapped in by request
  interception (Instatic keeps serving old hashed css): `output/fleet/mason-park-kids/probe-reviews-ab.mjs`.
