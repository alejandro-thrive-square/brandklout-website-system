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
- **Batch 1 complete (staging)**: Stone Med Spa (`bk-stone-med-spa` `2c535364`, local source renamed
  too) and Stone Surgical Arts (`bk-stone` `064ac08d`): EDITABLE, IN BOUNDS, CLEAN, css parity 0
  real at 1440/390/1920, runtime parity OK.
- **Mason Park complete (staging)** (`bk-mason-park` `aec30c70`): 1,898-rule stylesheet into the
  registry, 497 renames + 4 merges, Framework 33 variables; parity 0 real; EDITABLE, IN BOUNDS, CLEAN.
- **Mason Park Kids complete (staging)** (`bk-mason-park-kids` `d961983c`): 2 stylesheets (1,226
  rules) into the registry (3 `@font-face` stay), Framework 44 variables, 389 class rules renamed;
  css 0 real at every width, runtime parity before→final OK on 434 captures; EDITABLE, IN BOUNDS,
  CLEAN. One revived dead override (`.cf-shot`) fixed forward. Its local `home/` source was renamed
  with the same map later (`bk-mason-park-kids` `b7e6c64d`; `class-sync-check` matches staging on 217
  pages); it still ships `site.css` as a code asset (client runbook, top).
- Held, re-checked read-only in a new session (2026-10-05 evening): Dr. Nahlah staging still
  `draftMatchesPublished: false` and two `bk-dr-nahlah` sessions are active on it; West LA still has
  no staging instance; Brandklout staging unchanged since its 13:51Z publish. Nothing applied.
- Maps prepared and committed, not applied: Dr. Nahlah (`5f93a76c`, 377 renames; staging draft has
  an unreviewed 04:04Z edit, text-identical as far as checked), West LA (`9afba9e6`, 498; no staging
  instance), IFA rebuild local source (`01502dc3`, 371; another session is building it), Brandklout
  website (worktree, untracked: 806 renames + 5 merges, dry run clean; another session re-seeds its
  staging from production, and its page-scoped `site.css` needs a decision).
- New-build kit: `client-first-starter.css` + `framework-spec.template.json`; S0 step 4 starts there;
  DESIGN-STANDARD names chapters `section_<beat>`.
- Engine fixes found by the pilots (all with tests): regex literals, selector chains/tag.class,
  `WZ.section`/`WZ.dom` and `*Class` option keys, dotted names, merges into renamed targets, folders in
  local mode, `--files` safety checks, vendor classes exempt, component-only classes counted,
  in-place dead media overrides (+ `fix-dead-overrides.mjs`), css-parity load wait + frozen
  animations, two-capture noise filter, persistent runtime differences, crash-proof runtime capture.

## Second night (2026-10-05 23:40 → 2026-10-06), parallel sessions coordinated from main
One Claude session per worktree (Orca), briefed from `output/fleet/BRIEF-*.md` (gitignored), each
reporting `output/fleet/<client>/STATUS.md` and `TOOL-BUG.md`; main fixed every tool bug once, on
main, and told the sessions. State table: `output/fleet/COORDINATOR.md`.
- **Brandklout website DONE on staging** (`bk-brandklout-website` `0a60709f`): Framework 28 vars,
  806 renames + 5 merges; css 0 real at every width, legal + head gates 0. `site.css` stays a scoped
  code asset (it carries the fluid root for 2 pages; site-wide would resize every other page) — a
  design decision, the one editability FAIL. 15 nested-slug pages' descriptions now live in Open Graph
  overrides (tell Sang: edit them in the OG panel; production run must write the same 15).
- **Dr. Nahlah DONE on staging** (`bk-dr-nahlah` `248b174b`): staging draft published first with the
  user's own invisible Styles-panel test (coordinator decision); 374 rules renamed, 0 page rows
  written; css 0 real 1440/390, 1920 noise proven; head 0 on 100 URLs; local `site-src` renamed + rebuilt.
- **IFA DONE on staging** (`bk-ifa-dentistry` `59f7e191`): source renamed (371), pushed by its own pipeline (now `push/editable.mjs` + `push/cascade-check.mjs`), Framework 22 vars, 1,055 registry rules, only 8 `@font-face` in a code asset; css 0 real mid→after at every width, all-breakpoint sweep 0 (58 pages × 12 viewports), head 57/57 identical. The push also shipped the queued HIPAA footer link. 13 `vh` fallbacks before `svh` dropped (one value per property). The 404 template page is outside the gates since `pageSlugs()`: checked by hand.
- **Mason Park Kids** local `home/` renamed (`b7e6c64d`). **Mason Park**'s 161 articles were never in
  any gate: verified after the fact against production (`055a074c`), clean.
- **West LA: not started.** Its worktree session waits on the user (Codex lost its Chrome plugin);
  its brief (`BRIEF-west-la-implants.md`) creates the staging clone first.
- **Tool bugs found by the sessions, all fixed on main with tests where possible:**
  `c0397383` gates never loaded collection entries (`pageSlugs()`); `65a30646` orphaned Chrome on
  Windows + launch retries; `9aaea03b` **site-document page saves dropped `seoTitle`/`seoDescription`**
  (now restored by insta-api; nested slugs refused); `6789a211` append-mode fold could flip a base
  class and its combo (`order-pairs.mjs` / `pair-cooccur.mjs` promoted `9e168a72`; Kids 0 risky
  pairs, Mason Park 17 flags never co-occur); `049da0b5` CSS comments read as classes, vendor-iframe
  console counted as errors.
- **Production rollout additions:** compare the published head (title, meta, og, canonical, JSON-LD)
  before/after on every URL (`head-parity.mjs save <client>-before` / `diff`), and run
  `order-pairs.mjs` after any append-mode CSS move.

## 2026-10-07: the editor canvas, which no gate opened
The user opened IFA staging in the Instatic editor and saw every page covered ("completely broken").
Cause: the canvas renders nodes with React, which drops `hidden=""`, and runs no site scripts, so IFA's
story modal (92% dark, fixed) and menu drawer, closed only by the `hidden` attribute, showed over every
breakpoint frame. The published site keeps the attribute, so every gate was green. Not caused by the
migration. New gate `editor-canvas.mjs` (in `migration-gates final`, `3abbc787`). Fleet: IFA fails; Stone
Med Spa, Surgical Arts, Mason Park, Kids, Brandklout website, Dr. Nahlah pass and were checked by eye
(only cosmetic: icon-only menu buttons show Instatic's placeholder label in the editor). The IFA fix
runs in a `bk-ifa-dentistry` session (brief `output/fleet/BRIEF-ifa-canvas.md`, result
`output/fleet/ifa-dentistry/STATUS-canvas.md`). From now on, site work runs in that site's worktree
session; main keeps the shared tools and fleet checks (user, 2026-10-07).

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
