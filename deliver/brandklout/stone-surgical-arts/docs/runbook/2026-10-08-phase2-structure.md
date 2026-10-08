# 2026-10-08 — Phase 2 structure (spacing tokens + combo classes), STAGING — prepared, BLOCKED before the first write

Brief: `instatic-api-sync/output/fleet/BRIEF-phase2.md` (main checkout), standard CLASS-STANDARD.md §10.
Goal: the CSS in the Client-First SHAPE (spacing from the Framework, no contextual override of a
utility/role class), no visual change. **Production untouched. Staging untouched too** — the session
stopped before step 2 A; `draftMatchesPublished: true`, seq 15.

## Done
- Status true; backup `output/fleet/stone-surgical-arts/backup-pre-phase2/` (55 pages + HTML).
- Structure audit before: space scale ok, type tokens ok (phase 1 did both), **9 overrides**, 65% of rem
  spacing on tokens. No `--type` map needed.
- head-parity `stone-surgical-arts-p2-before` saved (55 URLs). css-parity p2-before captured at 1440/390/1920.
- `scale-tokens` dry: 57 rules, 86/296 rem spacing literals equal a house step; 210 off-scale stay literal.
- `context-combo` proposal reviewed → **`21-instatic-upload/class-standard/combo-map.json`** (tracked,
  this commit), dry run accepted: 8 rules, 55 pages. Names: `is-navbar`, `is-on-band`, `is-why`,
  `is-place`, `is-consent`, `is-consent-button`, `is-cta`. Dropped `.section-style-band
  .heading-style-display-xlarge` (matches 0 nodes — a dead rule). `is-band` exists already, hence `is-on-band`.
- Full state and the exact resume commands: `output/fleet/stone-surgical-arts/STATUS-phase2.md` (main checkout).

## Blocked
The runtime half of `migration-gates snapshot p2-before` was killed by Claude Code for low system memory
(three site sessions capturing at once); the session was told not to restart it unasked. Resume = re-run
the snapshot, then A → publish → p2-mid, B → publish → p2-after, D (fold-split, brief step 3b), head-parity
diff, `migration-gates final`, structure after.

## Next
- Resume per STATUS-phase2.md, one capture pass at a time.
- A person: delete or keep the dead `.section-style-band .heading-style-display-xlarge` rule.

## Gotchas
- `is-band` is taken on this site (a class with declarations); the tool refuses it as a combo name.
- One combo name cannot serve two selectors with different node sets (`is-consent` heading vs button).
- The local source `04-design/.tmp/surgical-arts/site-src/` predates phase 1 (68 old class names, 0 new):
  it is NOT updated by phase 1 or 2. A full `push-site.mjs` would undo both; replay class-rename,
  scale-tokens `--files` and the combo map on it first, then `class-sync-check.mjs`.
- `migration-gates snapshot` runs ~25 min of Chrome per site on this machine; with three sites in
  parallel the machine runs out of memory. Stagger the capture passes.

## Version Control

Tracked. Committed with the work it describes.
