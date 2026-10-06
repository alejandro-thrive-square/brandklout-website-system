# 2026-10-05 — Everything editable + Client-First class standard (STAGING only)

Fleet migration, `CLASS-STANDARD.md` §8 steps 0–4 on `staging.masonparkpediatricdental.com`.
Production untouched. Artifacts in `workflows/class-standard/`: `framework-spec.json`, `class-map.json`
(386 renames + 2 folders), `class-map.expanded.json` (389). Logs, backups and the snapshots on main in
`deliver/process/tools/instatic-api-sync/output/fleet/mason-park-kids/` (gitignored).

## Done
- **Backup** before anything: `output/fleet/mason-park-kids/backup-pre-migration/` (site.json seq 25,
  pages.json, 217 published HTML).
- **Editability.** Both code assets moved into the registry in cascade order (`legacy-migration.css`
  then `mason-park-kids-core.css`, both all-pages, default priority): 1226 rules, 903 ambient + 255
  merged into class chips, 27 media conditions; only the 3 `@font-face` blocks stay in the core asset.
  Framework: 33 colours (+ aliases), 8 type bases (`--f-*-base`, the `--f-*` formulas stay in the
  registry `:root`), `--maxw`, `--radius`, `--radius-sm`; root 16, rem. Tokens redefined at a
  breakpoint (`--ch-pad`, `--bleed`, `--t-*`, the fluid-root vars) stay in the registry `:root`.
  `editability --published`: **EDITABLE**.
- **One fix forward** (`fix-cf-shot.mjs`): css-to-registry folded the DEAD
  `@media (min-width:1100px) { .cf-shot { min-height: 0 } }` (a later base rule set 18rem and won)
  into the `.cf-shot` class rule, where context styles emit after the base, so the home Comfort photo
  went 288px -> 0 at >= 1100. Removed that one declaration. A static scan of both assets
  (`dead-media.mjs`) found no other such case.
- `diff before mid`: css **0 real of 0 raw** at 1440 / 390 / 1920, runtime **PARITY OK**.
- **Classes.** 377 out-of-bounds classes (82%) renamed in one save; published audit
  **0 out of bounds**; `class-rename --verify` **CLEAN**.
- `diff mid after`: css **0 real of 0 raw** at 1440 / 390 / 1920. Runtime: the gate reported 3
  "persistent" differences (2 blog pages with 4 more elements at opacity 0, the `%c%d … NaN`
  console error on /patient-reviews). All three are the `mid` capture being the odd one out: `after`,
  `after~r` and `after~m` equal the original `before` exactly on those pages (stuck 6 / 13, and the
  same console error was already in `before`). Direct `runtime-parity diff before after~m`:
  **RUNTIME PARITY OK**.
- `migration-gates final --map class-map.json`: **EDITABLE**, **IN BOUNDS**, **CLEAN**.

## Done (later, 2026-10-05): step 5, local source
- `class-rename.mjs --files workflows/03-core-pages/home --map workflows/class-standard/class-map.json
  --apply`: 220 files, 964 selectors, 19,086 class attributes, 27 script selectors, 3 classList
  tokens (the script counts equal the staging run). `node --check` passes on `site.js` and `journey.js`.
- `class-sync-check.mjs --site mason-park-kids:staging --build home`: 217 pages compared. Left in the
  build only: `pr-rail`/`pr-rail-in`/`pr-chip` (home `#proof`) and `rv-wall`/`rv-item`/`is-short`/
  `is-long`/`is-lead` (`/patient-reviews`), the pre-Elfsight markup staging replaced on 2026-09-29;
  and five unstyled modifiers on `terms-of-service` (`ch-key`, `ch-messages`, `ch-tools`,
  `ch-liability`, `ch-law`) that Instatic had already dropped. Those five are removed from the source.
  Only on the site: `__cf_email__`, the Elfsight embed classes. Staging was only read.

## Next
- **Before any push from `home/`:** it still ships `assets/site.css` as a code asset (staging has it
  in the registry/Framework) and the old `pr-*`/`rv-*` review markup. A push must not re-enable the
  stylesheet, and `add-elfsight-reviews.mjs` has to be re-run after it.
- Production: the same steps after review.
- 9 identical custom-class groups and 52 font sizes outside a role are listed by the audit (warnings,
  not gates).

## Gotchas
- `css-to-registry` (append mode) can REVIVE a dead `@media` declaration when it folds an earlier media
  occurrence and a later base rule of the same class into one class rule. Check with a static scan or
  a 1440 diff before trusting it.
- Runtime parity on this site takes ~3 h single-threaded (217 pages x 2 widths, every control
  clicked); `blog/pediatric-dental-clinic-care-keeping-little-smiles-healthy` @1440 takes ~1 h on its
  own under the tool (~3 min per TOC link) though a direct probe clicks each in ~1.3 s. Run it chunked
  (`output/fleet/mason-park-kids/runtime-chunked.mjs`).
- The `jr-*` runtime classes (`jr-ready`, `jr-word`, `jr-line`, SplitText's generated `jr-line-mask`)
  were NOT renamed: they never sit on a node and `wordsClass:` / `linesClass:` are not a context
  class-rename rewrites.
