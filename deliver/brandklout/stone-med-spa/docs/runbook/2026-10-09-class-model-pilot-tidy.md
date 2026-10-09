# 2026-10-09 — Class-model pilot (Webflow model in Instatic), STAGING: baseline + stage `tidy`

Standard: `deliver/process/tools/client-first-style-guide/CLASS-STANDARD.md` §11 on main ("one place per element":
the Styles panel lists every rule that matches, so the registry may hold only chips, combo chips, chip states and
globals). Brief: `instatic-api-sync/output/fleet/BRIEF-model-pilot.md` (main), steps 0–2. Stone Med Spa is the pilot;
the other sites wait for the user's sign-off in the editor. Tools on main: `class-model-lint.mjs` (gate, read-only),
`class-model.mjs tidy`, `migration-gates.mjs`. **Production untouched.** Nothing converted by hand.

## Done (staging.westlaketxmedspa.com, seq 39 → 40, published 2026-10-09 18:58:02Z, 27 pages)
- Step 0: `draftMatchesPublished: true` (checked again before `--apply`). Backup `backup-pre-model/`. Lint before:
  1045 rules, 740 fit, **305** problems.
- Step 1: `migration-gates snapshot m-before` (css 1440/390/1920 ×2 + runtime 1440/390, all ok); head saved (27 URLs).
- Step 2 `class-model.mjs tidy`: dry run = brief = coordinator's dry run: **3 loose combos → combo chips**
  (`is-navbar`, `is-cover`, `is-doors`: the chip now has the compound selector, e.g. `.button.is-navbar`, plus the
  ambient rule's declarations and seat), **14 selector lists split** into 31 single rules, **94 unused rules deleted**
  (classes on no node, in no script, in no embed, in no published HTML). Checked first: `site.js` adds none of the
  deleted classes; every rule order is a whole number, so split parts keep their seat. Applied, published.
- Lint after: 965 rules, 655 fit, **310** problems. That is a rise, and it's fully accounted for:
  305 − 9 FIX rules deleted as unused − 3 combos − 14 lists + 31 parts = 310. Each part is still a problem in its own
  category (parent state, tag inside class, motion, structural): splitting moves them out of the list, the later
  stages fix them. 0 new problems, 0 rules changed category.

## Proof
| Gate | Result |
| --- | --- |
| css parity m-before → m-tidy 1440 / 390 / 1920 | 0 real / 0 real / 0 real (1440 needed the proof below) |
| head-parity m-before → m-tidy | 0 of 27 URLs differ |
| runtime parity | not captured at m-tidy (brief: css only); m-before is the baseline for the later stages |

**1440.** The gate printed 2 real: `margin-left/right 0 → 8px` on the /hipaa-disclosure navbar `.container-large`
(`body:2>div:2>header:1>div:2>div:1`, width 1280 throughout). Both before captures read 0 and both after captures read
8, so neither pair exposed the flip. Three single-page captures of the published tidy state read 0, 8, 0
(`css-m-tidy-hipaa-proof.out`), and the same element flipped in phase 2. Tidy changed no margin that reaches it.

## Left for the coordinator / later stages
- Next stages (`combos`, `inner`, `vars`, `motion`) come from the coordinator; nothing is converted by hand.
- The lint still flags 3 lists that tidy keeps whole (`.navbar_link:hover, .navbar_link[aria-current]` and its
  `::after`; `.rules_tile:nth-child(2), (3)`), and 11 compound rules as unused that tidy keeps (one class of each is
  used elsewhere).
- The local source (`workflows/04-design/.tmp/med-spa/site-src/css`) still has the deleted and split rules: a full
  push from it brings them back (renders the same). Mirror the stages there once the model is signed off.

## Gotchas
- The lint counts rules, not selectors: splitting a list of N problem selectors raises the count by N − 1. Judge a
  `tidy` by "0 new, 0 unexplained" (`lint-m-delta.txt`), not by the total.
- A flipper can survive `~n` subtraction when each side's pair agrees by chance; prove it on one state with three
  single-page slot captures (`--all-pages --prefix <page>`).
- Backups (main checkout, gitignored, `instatic-api-sync/output/fleet/stone-med-spa/`): `backup-pre-model/` (site.json
  seq 39, pages.json, 27 published HTML), `shell.before-class-model-tidy.39.json`. Rollback: CLASS-STANDARD §8 with
  that shell. Logs and lint reports: see `STATUS-model.md` there.
