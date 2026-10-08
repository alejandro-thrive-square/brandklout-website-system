# 2026-10-08 — Phase 2 structure (spacing tokens + combo classes), STAGING — done, gates clean

Brief: `instatic-api-sync/output/fleet/BRIEF-phase2.md` (main checkout), standard CLASS-STANDARD.md §10.
Goal: the CSS in the Client-First SHAPE (spacing from the Framework, no contextual override of a
utility/role class), no visual change. **Production untouched.** Staging seq 15 → 18, published twice
(07:01Z after A, 08:24Z after B), 55 pages each time.

## Done (staging.dfwsurgicalarts.com)
- Status true; backup `output/fleet/stone-surgical-arts/backup-pre-phase2/` (55 pages + HTML); tool
  backups `shell.before-scale-tokens.15.json`, `before-context-combo.17.json` (same folder).
- Structure before: space scale ok, type tokens ok (phase 1 did both), **9 overrides**, 65% of rem
  spacing on tokens. No `--type` map needed. 0 split classes → brief step D skipped (coordinator).
- **A** `scale-tokens.mjs --apply`: 57 rules, 86 of 296 rem spacing literals now `var(--space-*)`
  (medium 21, small 19, xsmall 19, large 15, xxlarge 5, xxsmall 4, xlarge 3); 210 off-scale stay
  literal for step C. Spacing on tokens 65% → **75%**.
- **B** `context-combo.mjs --map … --apply`: 8 rules rewritten, 55 pages gain combos. Map (tracked):
  `21-instatic-upload/class-standard/combo-map.json` — `button is-navbar` (55 nodes, hidden ≤767),
  `heading-style-display-large is-on-band` (4), `… is-why` (1), `heading-style-display-xlarge
  is-place` (3), `heading-style-display-large is-consent` (1), `button is-secondary
  is-consent-button` (1, + `:hover`), `padding-section-large is-cta` (47). Overrides 9 → **1**: the
  dead `.section-style-band .heading-style-display-xlarge {color}` matches no node (left for a person).
- **Proof**: css-parity 0 real at 1440/390/1920 before→mid and mid→after. Runtime parity before→mid
  OK (book iframe height = noise, re-checked). mid→after: the gate reported one persistent difference
  (home tab "04 Non-Surgical" DEAD at 1440) — judged against the 2026-10-05 `before` label, not
  `p2-before` (tool note, below). Against `p2-before` directly, `p2-after~m` differs only in the book
  iframe height, and the home page's class attributes changed only on the navbar button (`is-navbar`)
  and the CTA wrapper (`is-cta`). Head parity 0 of 55. Final: EDITABLE, IN BOUNDS, CLEAN, editor
  canvas ok (3 frames, 0 overlays), one rule/class ok.
- Report: `output/fleet/stone-surgical-arts/STATUS-phase2.md`; tool notes `TOOL-BUG.md` (same folder).

## Next
- Step C (snap the 210 off-scale spacing values; visible) after a before/after for the user.
- Production: same A + B after review (both tools are idempotent; the map is the spec).
- A person: delete the dead `.section-style-band .heading-style-display-xlarge` rule or leave it.

## Gotchas
- Home tabs 01–04 at 1440: the *active* tab reads DEAD to runtime-parity (a click changes nothing)
  and which tab is active varies per capture, even on an unchanged site. At 390 it is always 01.
  Compare against the run's own baseline before believing it.
- `migration-gates diff` judges persistent differences against the hardcoded `before`/`before~m`
  label (phase 1, 2026-10-05), not the diff's first argument — stale for any later run.
- `is-band` is taken on this site (a class with declarations); the tool refuses it as a combo name.
  One combo name cannot serve two selectors with different node sets.
- The local source `04-design/.tmp/surgical-arts/site-src/` predates phase 1 (68 old class names,
  0 new): untouched by phase 1 and 2. A full `push-site.mjs` would undo both; replay class-rename,
  `scale-tokens --files` and the combo map on it first, then `class-sync-check.mjs`.
- Memory: the user's Chrome holds ~10 GB; captures were killed twice for low memory. Run every
  capture through `migration-gates.mjs` (snapshot, or `slot -- …`): machine-wide slots + memory wait.
  Diffs that may re-capture run in the foreground (the reaper only stops background shells).
- PowerShell splits `--widths 1440,390` into two arguments; quote it.

## Version Control

Tracked. Committed with the work it describes.
