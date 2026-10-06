## 2026-10-06: Client-First class standard + Framework tokens on STAGING (fleet migration)

Part of the fleet migration (system runbook `.claude/runbook/2026-10-05-fleet-class-standard.md` on
main; standard: `deliver/process/tools/client-first-style-guide/CLASS-STANDARD.md` §8). **Staging
only. Production (Sang's live site) was not touched.** Staging was `draftMatchesPublished: true`
at the start (last publish 2026-10-05 13:51Z, the re-seed) and is again at the end
(last publish 2026-10-06 05:24Z).

### Done (staging.brandklout.ai)

1. **Framework tokens** (publish 04:41Z). 18 colours (`--bg --bg2 --panel --panel2 --ink --muted
   --line --accent --accent2 --dark --warn --mint --lime --paper --forest --teal --blue --cyan`) and
   two sizes (`--max` 1180px in group *Spacing*, `--radius` 24px in group *UI*) moved from the three
   registry `:root` rules into the Framework, root font size set to 16. The values are the
   EFFECTIVE ones (the last `:root` rule won: light theme); `--ease` and `--shadow` stay in the
   registry. Framework now owns 28 variables. Spec:
   [`workflows/class-standard/framework-spec.json`](../../workflows/class-standard/framework-spec.json).
2. **Classes** (publish 05:24Z). 806 renames + 5 merges
   ([`class-map.json`](../../workflows/class-standard/class-map.json), notes inside): 1,365 selectors
   rewritten, 28 pages, 2 code assets (`site.js` 31 lines, `site.css` 5 lines: `.calendly-shell` →
   `.calendly-shell_component`). One change to the prepared map: `p3` → `fit-checklist_item-text`
   (the prepared `text-size-regular-fixed` fails `class-audit --strict` as a reimplemented utility).
3. **`site.css` stays a page-scoped code asset**, by the brief's rule, without trying the move:
   [`site-css-decision.md`](../../workflows/class-standard/site-css-decision.md). It holds the fluid
   root and is served on 2 pages only; site-wide it would shrink the other pages 14% at 390 and
   grow them 12.5% at 1920.

### Gates

| Gate | Result |
| --- | --- |
| css parity before → mid (Framework), 34 URLs, 1440 / 390 / 1920 | 0 real (4 / 2 / 0 raw, all capture noise) |
| css parity mid → after (rename) | 0 real (4 / 0 / 2 raw) |
| runtime parity mid → after | OK: nothing survives a second capture |
| runtime parity before → mid | 10 items, cause found, NOT the change: the third-party GHL form had not booted in the `before` capture; see [`runtime-before-mid-cause.md`](../../workflows/class-standard/runtime-before-mid-cause.md) |
| legal gate (4 `/legal/*` pages, whole computed style + box + text, scripts off and on, 3 widths) | before → mid 0, mid → after 0, before → after 0 |
| head gate (title, every `<meta>`, canonical, JSON-LD; 34 URLs) | 0 differ, all 200 |
| `class-audit --strict` | IN BOUNDS: 975 classes, 0 out of bounds, 0 reimplemented (was 785 + 8) |
| `class-rename --verify` | CLEAN: 34 pages, 33 scripts, 3 stylesheets, 811 old names |
| `editability --published` | **FAIL, for one known reason**: `src/styles/site.css` (16 rules, scoped to 2 pages). Everything else is editable |

### Gotchas (read before the production run)

- **A page write drops `seoTitle` / `seoDescription`, and no visual gate sees it.** The rename save
  emptied them on 28 pages; published like that, each page would have shipped the HOME description
  (Open Graph reads override → the row's `seoDescription` → site-wide). Caught before the publish
  by diffing the draft. Repair, in this order: `seo-cells.mjs restore --flat-only` (13 flat-slug
  pages, by row PATCH), `og-overrides.mjs` (15 nested-slug pages, description as an Open Graph
  override), publish, `head-parity.mjs diff`. The shared tool now restores the cells itself and
  refuses nested-slug pages that carry cells (main `9aaea03b`); the nested pages still need the
  override step.
- **Nested-slug pages (`story/…`, `solution/…`, `specialty/…`) cannot keep SEO cells any more.** A row
  PATCH flattens their route (`story/x` → `story-x`; proved on one draft row, then re-saved with
  `reassert-slug.mjs`), and the site-document save that keeps the route drops the cells. On staging
  their descriptions now live in **Open Graph overrides** (15 records, description only). Overrides
  win over the page's own SEO field, are plugin records, and do **not** travel in a clone or an
  export: production needs the same 15 written there (from production's own backup), and an editor
  who changes one of those descriptions must change it in the Open Graph panel.
- **The local pipeline still speaks the old names.** `workflows/21-instatic-upload/`
  (`class-system.mjs`, `push-site.mjs`, `agency/*.css|js`, `.tmp/site/site-src`) generates the
  pre-standard class names from Sang's package. Do NOT run `push-site.mjs` against a migrated
  instance: port `class-map.json` into the generator first. Instatic is the source of truth.
- **The shared parity gates did not load `/legal/*`** until main `c0397383` (they walked page rows:
  a template is a 404 at its own slug). `legal-gate.mjs` covers them in more depth (scripts on:
  `legal-tables.js` builds the tables at runtime).
- The runtime gate's `NEW ERROR console: %c%d font-size:0;color:transparent NaN` is Cloudflare
  Turnstile inside the GHL form iframe, intermittent on an unchanged site. A height change equal to
  the form iframe (150px placeholder → 700 / 1090px) plus 2 visible elements is the form booting.
- Framework colours publish as `hsla()` with two decimals; all 18 round-trip to the same RGB
  (checked before applying). `--max` / `--radius` publish as `clamp(x, calc(0vw + x), x)`.
- `class-audit` warnings left as they are (not failures): 21 classes set a font size outside a type
  role, 121 contextual rules, 24 styling classes selected by `site.js`.

### Next (production, only after review; never from this run)

Same steps on production, dry-run first, with production's own backup as the source for the SEO
repair: Framework spec → publish → gates; rename → SEO cells (flat) + Open Graph overrides (nested)
→ publish → head gate → final gates. Staging goes stale when Sang edits production: re-check
`draftMatchesPublished` and re-run `class-audit` + the rename dry run against production first
(a class he added since is not in the map). Open decision, not made here: whether the fluid root
in `site.css` should apply to every page (a design change, see `site-css-decision.md`).

### Files

- `workflows/class-standard/`: `class-map.json` (+ `.overrides.json`), `framework-spec.json`, the
  two notes above, and `tools/` (the session's read-only gates and staging-only repairs:
  `legal-gate.mjs`, `head-parity.mjs`, `state-diff.mjs`, `og-pages.mjs`, `seo-cells.mjs`,
  `og-overrides.mjs`, `reassert-slug.mjs`). They import `target.mjs` three folders up, so they run
  from `deliver/process/tools/instatic-api-sync/output/fleet/brandklout-website/` in the main
  checkout, where the logs, snapshots and the backups `backup-pre-migration-1006/` and
  `backup-post-migration/` are (gitignored).
- Rollback (staging): `rollback-registry.mjs output/fleet/brandklout-website/backup-pre-migration-1006/site.json --apply`
  restores the registry; page trees and SEO cells from its `pages.json`; delete the 15 Open Graph
  overrides (`DELETE …/plugins/brandklout.open-graph/runtime/override {key}`).

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../../SYSTEM_RULES.md).
