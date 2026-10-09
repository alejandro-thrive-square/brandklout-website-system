# 2026-10-08 — Phase 2, Client-First structure on STAGING: spacing tokens (A) and combo classes (B)

Standard: `deliver/process/tools/client-first-style-guide/CLASS-STANDARD.md` §10 on main. Brief:
`instatic-api-sync/output/fleet/BRIEF-phase2.md` (main, `a17ab9c8`: A proven with style captures only).
Tools: `deliver/process/tools/instatic-api-sync/` on main (`scale-tokens.mjs`, `context-combo.mjs`,
`structure-audit.mjs`, `migration-gates.mjs`). No visual change by construction. **Production untouched.**

## Done (staging.westlaketxmedspa.com, seq 37 → 39, published twice: 20:01Z after A, 23:29Z after B, 27 pages each)
- Step 0: `draftMatchesPublished: true` (the coordinator had published the shelf-mobile draft at the user's
  request). Backup `instatic-api-sync/output/fleet/stone-med-spa/backup-pre-phase2/` (site.json, 27 pages,
  published HTML; gitignored). Before audit: space scale ok, type tokens ok (phase 1 seeded the Framework),
  **5 contextual overrides**, one rule/class ok, **10%** of rem spacing on tokens.
- **A** `scale-tokens.mjs --apply`: 136 registry rules rewritten, 223 of 639 rem spacing literals pointed at a
  house step (space-medium ×75, space-large ×53, space-small ×49 …), 416 off-scale left for step C, no new
  Framework steps needed. Seq 37 → 38. No `--type` map: every role class already read a variable.
- **B** `context-combo.mjs`: 3 of 8 contextual overrides became combos (map
  `workflows/05-instatic-upload/class-standard/combo-map.json`, tracked); 3 rules rewritten, 27 pages gained
  classes. Seq 38 → 39.
  | Old selector | Combo | Nodes |
  | --- | --- | --- |
  | `.navbar_actions .button` (display none ≤767) | `button is-small is-navbar` | 27 (every page) |
  | `.cover_title .text-style-display-accent` (green) | `text-style-display-accent is-cover` | 26 (every page but home) |
  | `.doors_body .button` (reveal) | `button is-alternate is-small is-doors` | 3 (/treatments) |
- **D** skipped: 0 split classes (the site was moved `--in-place` in phase 1). **C** not run (visible; user decides).
- After audit: overrides **5 → 2** (both refused, below), spacing on tokens **10% → 41%** (291 token / 411 literal),
  space scale, type tokens and one rule/class ok.
- **Local source** (`workflows/04-design/.tmp/med-spa/site-src`, tracked): `scale-tokens.mjs --files` rewrote 24 css
  files (187 values on tokens, 320 off-scale); `01-tokens.css` already defines the 11 house steps at the Framework's
  values, so no `framework.mjs pull` (a pull would have overwritten its themes and breakpoints). B by hand: the three
  selectors in `20-navbar.css`, `49-cover.css`, `57-menu.css` (base rule + the 767 list; the `:hover`/`.is-open`
  door rules stay contextual), `is-navbar` in `partials/navbar.html`, `is-doors` ×3 in `pages/treatments.body.html`,
  `is-cover` on the `h1.cover_title` em in 12 page bodies and in `build-site.mjs` for the 14 generated treatment
  pages. `node build-site.mjs` rebuilt `final-site` (26 pages; diff = phase 2 only). `class-sync-check.mjs`: build and
  staging list the same classes bar Instatic's `wz-embed`, as in phase 1.

## Proof
| Gate | Result |
| --- | --- |
| css parity p2-before → p2-mid (A) 1440 / 390 / 1920 | 0 real / 0 real / 0 real (auto-margin flippers only) |
| css parity p2-mid → p2-after (B) 1440 / 390 / 1920 | 0 real / 0 real / 0 real — see 1440 note |
| runtime parity p2-before → p2-after (A+B) 1440+390 | PARITY OK, 54 captures, no re-check needed |
| head-parity p2-before → p2-after | 0 of 27 URLs differ |
| final: editability · class-audit --strict · class-rename --verify · editor-canvas | EDITABLE · IN BOUNDS · CLEAN · ok (3 frames, 0 overlays) |
| structure after | overrides 2 (refused), spacing 41% |

**1440 mid→after note.** 8 raw differences, all `margin-left/right 8px ↔ 0px` on a centred inner div (auto margins:
8px at 1440, 144px at 1920): hipaa-disclosure, jeuveau and botox flip between the two after captures (noise by the
gate's rule); the same element on /treatments flipped between the two p2-before captures and between the two p2-mid
captures at 1920, and B touched no margin (display, color, opacity/transform/transition only). Proven on one state:
three single-page slot captures of /treatments at 1440 on the published after state read 0px, 8px, 8px
(`css-p2-treatments-proof.out`). 0 real.

## Refused / left for a person
- `.names_card.is-here .button.is-link {color}` and its `:hover` — the tool refuses: `names_card`/`is-link` read as
  runtime classes and a combo would drop specificity from 4 classes to 3. These are the 2 overrides the after audit
  still reports. Fold by hand if wanted (`.button.is-link.is-here-card` …), or leave.
- Stay as context, correctly: `[data-theme="green"] .button:hover`, `.js .button`, `.legal_body a:not(.button)`,
  the `.doors_door:hover/.is-open … .doors_body .button` state rules.
- Step C (snap the 416 off-scale rem values) is a visible change: before/after for the user first.

## Gotchas
- A is invisible to the behaviour capture; the coordinator dropped the p2-mid runtime pass mid-run (brief
  `a17ab9c8`). Behaviour is compared once, p2-before → p2-after.
- Claude Code killed one background slot pass for low memory; re-queued the remaining five (the slot wrapper waits
  for 6 GB free). Captures only ever ran through `migration-gates.mjs` (snapshot or `slot`), two slots machine-wide.
- The treatments/botox/jeuveau/hipaa centred containers read `margin: 0` in roughly one capture in three at 1440 and
  1920; a diff with no `~n` on one side will show them as real.
- `01-tokens.css` in site-src is a hand file (themes, breakpoints), not a Framework mirror — never `framework.mjs pull`
  over it.
- Backups: `backup-pre-phase2/`, `shell.before-scale-tokens.37.json`, `before-context-combo.38.json` in
  `instatic-api-sync/output/fleet/stone-med-spa/` (main checkout, gitignored). Rollback: §8 of CLASS-STANDARD.
