# 2026-10-05 — Fleet migration: Client-First class standard + everything editable (staging, batched)

The user's brief (overnight, autonomous): do all Instatic sites, in batches, carefully, no rework,
staging first, test end to end, and leave a detailed SOP so new builds never need this step.

## The standard and the SOP (main)
- `deliver/process/tools/client-first-style-guide/CLASS-STANDARD.md`: naming (utility / custom
  `folder_element` / combo `is-*`), the Relume vocabulary, common cases, typography, reuse, scripts
  select by `data-` not styling classes, where it is checked, the per-site migration steps (§8) and
  the rename map (§9). Wired into S0 03 (checklist, step 4 "Classes", push gate), S2 02, the index.
- `DESIGN-STANDARD.md` examples now name chapters `section_<beat>` (the old `ch-*` example is where
  five sites got their names).
- Tools (`instatic-api-sync/`): class-audit (+lib), class-rename, js-lexer (+test), runtime-parity,
  migration-gates, class-sync-check, with-site; css-parity freezes animations and takes `--site`
  `--all-pages`; css-to-registry `--in-place`; framework extract handles scaled sizes, inexact sizes
  and responsive tokens.

## Survey (2026-10-05, production unless noted)
| Site | Classes in bounds before | Code-asset CSS | Notes |
| --- | --- | --- | --- |
| Stone Med Spa | 94% | tokens.css 74 rules | pilot |
| Stone Surgical Arts | 92% | tokens.css 70 | |
| Mason Park | 49% | mason-park.css 1900 | agent |
| Mason Park Kids | 27% | 2 assets, 1227 | agent |
| Brandklout website | 27% | site.css 16 | agent, 3 components |
| Dr. Nahlah | 1% | landing.css (prod) | staging draft has an unreviewed edit (home page, 04:04Z): no publish |
| West LA | 1% | tokens.css 72 | no staging instance |
| IFA | 1% | site.css 3518 | Bricks (WordPress) clone: rebuild, not rename |
| Livewell, Oceanic | n/a | none | single-body WordPress clones |

## Done
- Stone Med Spa staging: complete (see the client run on `bk-stone-med-spa`, `2c535364`).
- Stone Surgical Arts staging: editability done (EDITABLE, Framework 48 vars); classes in progress.
- Maps prepared read-only for Dr. Nahlah (377 renames) and West LA (498), in their worktrees,
  uncommitted (Nahlah worktree has someone else's uncommitted work).

## Production rollout (after the user's review; per site, in `deliver/process/tools/instatic-api-sync/`)
The staging maps and specs are the production inputs: same class names, same tokens. Production
registries can differ from staging (unpublished staging work, later production edits), so every
step dry-runs against production first and refuses on surprises.
```bash
S=<client>:production
node output/status.mjs --site $S                      # draftMatchesPublished must be true
node with-site.mjs $S --allow-production -- node ../instatic-site/ops/backup-site.mjs --out output/fleet/<c>/backup-pre-migration-prod
node migration-gates.mjs snapshot before-prod --site $S
node css-to-registry.mjs --site $S --files <asset> [--in-place]      # dry, then --apply (same mode as staging)
node framework.mjs apply <framework-spec.json> --site $S              # dry, then --apply
# publish production (insta-api publish with the production login), then:
node migration-gates.mjs snapshot mid-prod --site $S && node migration-gates.mjs diff before-prod mid-prod --site $S
node class-rename.mjs --site $S --map <class-map.json>                # dry: must match the staging dry run
node class-rename.mjs --site $S --map <class-map.json> --apply        # then publish
node migration-gates.mjs snapshot after-prod --site $S && node migration-gates.mjs diff mid-prod after-prod --site $S
node migration-gates.mjs final --site $S --map <class-map.json>
```
`output/publish.mjs` refuses non-staging hosts on purpose; publish production deliberately.

## Gotchas
- Two captures of an unchanged page differ (auto margins, looping animations, late fonts, iframes):
  every gate here counts only differences that survive a second capture.
- A machine running 4+ headless Chromes times pages out (`networkidle2`): runtime-parity retries
  with `load`; never trust a single empty capture.
- `WZ.section(name, fn)` / `WZ.dom(name, fn)` build `'.' + name`: the engine now treats their first
  argument as a class.
- Build scripts can compute class names (`is-m${month}`) or parse HTML with regexes: run
  `class-sync-check.mjs` after renaming a local source.
- Git Bash `tar` needs `--force-local` for `C:` paths.
- Never write .mjs through a bash heredoc (backslashes halve): it broke three patches tonight.
