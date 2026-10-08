# 2026-10-08 — Phase 2 structure (tokens, combo classes, fold split classes), STAGING — prepared, BLOCKED before any write

Brief: `instatic-api-sync/output/fleet/BRIEF-phase2.md` on main (CLASS-STANDARD.md §10). Tools in
`deliver/process/tools/instatic-api-sync/` (main `827f797e`). **Nothing has been written to staging**:
`draftMatchesPublished: true`, seq 162, last published 2026-10-08T04:24Z.

## Why it stopped
The `migration-gates.mjs snapshot p2-before` capture (css-parity pass at 1440, ten minutes in, beside
three other sessions' captures) was killed by Claude Code because the machine was critically low on
memory, with the instruction not to restart it unaided. Since then main carries machine-wide capture
slots (`827f797e`, at most 2 browser passes): the resume below runs through them.

## Done (read-only against the site)
| Step | Result |
| --- | --- |
| 0 status | `draftMatchesPublished: true` (65/65 pages, seq 162) |
| 0 backup | `output/fleet/mason-park/backup-pre-phase2/` (site.json, 65 rows, 63 HTML; seq 162) |
| 0 structure before | `structure-p2-before.txt`: space scale **FAIL** (10 house steps missing), type tokens **FAIL** (3: `heading-style-h5` 1.1rem, `text-size-regular` 1rem, `text-size-medium` 1.06rem), **41 overrides**, **218 split classes**, spacing on tokens **10%** (100 var / 898 literal) |
| 1 head-parity | `head-mason-park-p2-before/` saved, 224 URLs, 0 not 200 |
| 1 snapshot p2-before | **not captured** (killed) |
| 2 A dry | `st-p2-dry-type.txt`: + 10 house steps, 255 rules rewritten, 382 of 1,377 rem spacing literals (28%) point at a step, 995 off-scale stay; type map accepted: 3 role classes → `var(--size-*)`, 3 Typography bases, 3 `:root#1372` formulas |
| 3 B propose | 9 candidates (all `.button` contexts), 20 stay (5 selector lists, 8 runtime classes, 4 tag/`:not`, 1 specificity, 2 `is-ghost` dead) |
| 3 B dry | `cc-p2-dry.txt`: map accepted, 9 rules rewritten, 65 pages gain combos |
| 3b D dry | `fs-p2-dry.txt`: 182 classes fold (214 rules removed), 36 left split for a person |

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
their own combos (the proposal had `is-chapter` on all of them). Stay as context, for a person: the five
selector lists (`.background-color-ink/-slate …` headings, eyebrows, secondary/ghost buttons;
`.chapter_component .button,.chapter_component a.button`; the table-of-contents link), the runtime
classes (`hero_overlay`, `step-card_component`, `lp-page`, `is-ghost`), `.landing-rail_component>a:not(.button)`,
`.matrix_component td a.button.financing_apply`, and `.is-landing-page .navbar_actions .button` (3 classes
would become 2).

## Local source (step 4): left untouched, deliberately
`workflows/09-static-rebuild/home/` (+ `home/assets/site.css`) is pre-phase-1: 231 pages still carry
the old names (`ch-*`, `svc-card`…), none the new. Since 2026-10-05 every change reached staging through
API scripts (`.tmp/nav-fix/fix-drawer-submenus.mjs`, the widget and HIPAA injections), never a full push.
A full push would first undo the 497 renames, so phase 2 on that source buys nothing. Before any future
full push replay, in order: `class-rename.mjs --files` with `class-map.json`, `scale-tokens.mjs --files`,
the combo map, `class-sync-check.mjs`. Same call as Stone Surgical Arts.

## Resume (when the user says so; one capture at a time, every capture through migration-gates)
```
cd "C:/Users/ACER/Documents/Webzite Studio/Brandklout Website System/deliver/process/tools/instatic-api-sync"
S=mason-park:staging; C="C:/Users/ACER/orca/workspaces/Brandklout Website System/bk-mason-park/deliver/brandklout/mason-park/workflows/class-standard"
export PUPPETEER_DIR="C:/Users/ACER/orca/workspaces/Brandklout Website System/bk-brandklout-website/node_modules/"
node output/status.mjs --site $S                                   # must still be true, seq 162
node migration-gates.mjs snapshot p2-before --site $S
node scale-tokens.mjs --site $S --type "$C/type-map.json" --apply && node output/publish.mjs --site $S
node migration-gates.mjs snapshot p2-mid --site $S && node migration-gates.mjs diff p2-before p2-mid --site $S
node context-combo.mjs --site $S --map "$C/combo-map.json" --apply && node output/publish.mjs --site $S
node migration-gates.mjs snapshot p2-after --site $S && node migration-gates.mjs diff p2-mid p2-after --site $S
for w in 1100 850 600 420; do WIDTH=$w node migration-gates.mjs slot --site $S -- css-parity.mjs snapshot mason-park-p2-pre-fold-$w --site $S --all-pages; done
node fold-split.mjs --site $S --apply && node output/publish.mjs --site $S
node migration-gates.mjs snapshot p2-folded --site $S && node migration-gates.mjs diff p2-after p2-folded --site $S
for w in 1100 850 600 420; do WIDTH=$w node migration-gates.mjs slot --site $S -- css-parity.mjs snapshot mason-park-p2-post-fold-$w --site $S --all-pages; node css-parity.mjs diff mason-park-p2-pre-fold-$w mason-park-p2-post-fold-$w; done
node head-parity.mjs save mason-park-p2-after --site $S && node head-parity.mjs diff mason-park-p2-before mason-park-p2-after
node migration-gates.mjs final --site $S --map "$C/class-map.json"
node structure-audit.mjs --site $S > output/fleet/mason-park/structure-p2-after.txt
```
Check `output/publish.mjs` exists and its flags before the first publish (phase 1 published with it).

## Gotchas
- A `migration-gates snapshot` prints nothing until a pass ends (`spawnSync`): an empty log is a running
  capture, not a stalled one. Check `Win32_Process` for `css-parity.mjs snap` children.
- `context-combo.mjs` proposes one combo name for a context even when its sub-selectors (`.is-large`,
  `.is-ghost-light`) match different node sets, then refuses that very map: split the names yourself.
