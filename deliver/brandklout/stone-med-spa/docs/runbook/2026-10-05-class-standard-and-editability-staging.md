# 2026-10-05 — Client-First class standard + everything editable, STAGING (pilot site)

Standard: `deliver/process/tools/client-first-style-guide/CLASS-STANDARD.md` and `INSTATIC-FRAMEWORK.md`
on main. Tools: `deliver/process/tools/instatic-api-sync/` (main `2467f63b` and later). Stone Med Spa
was the fleet pilot. **Production untouched.**

## Done (staging.westlaketxmedspa.com)
- Backup before any write: `instatic-api-sync/output/fleet/stone-med-spa/backup-pre-migration/`
  (site.json + 27 pages + published HTML; local, gitignored). Draft matched published at the start.
- **Editability**: `src/styles/tokens.css` (74 rules: tokens + the declarations the converter lost)
  went back into the registry rules they came from (`css-to-registry.mjs --in-place`: 71 merged in
  place, 3 new) and the asset is disabled. Framework seeded from
  `workflows/05-instatic-upload/class-standard/framework-spec.json`: 27 colours, 7 type bases
  (`--size-h1-base` …; `--size-h1` etc. stay as formulas with the breakpoint multipliers), 11
  spacing steps, 2 radii → the Framework owns 46 variables, root 16. Kept in the registry because the
  Framework cannot write them exactly: `--size-h4` 1.625rem, `--size-h6`, `--size-text-medium`,
  `--size-text-small`, `--space-tiny`, `--radius` 999px.
- **Classes**: `class-map.json` (+ `.expanded.json`, `pass2`, `pass3`) in the same folder: 51 classes
  renamed (eyebrow → text-style-tagline, u-sr-only → hide-visually, skip-link → skip-link_component,
  u-cover-top → object-position-top, *-num → *-number, *-col → *-column, *-val → *-value,
  is-m1…12 → is-month-1…12, is-a…d → is-position-1…4, folders hscroll → horizontal-scroll,
  spec → at-a-glance). 2 script selectors rewritten. No page or component writes were needed.
- **Proof**: css-parity (59 captures ×3 widths, animations frozen, two-capture noise filter):
  0 real differences before→mid (editability) and mid→after (classes) at 1440, 390, 1920.
  runtime-parity (every control clicked, scroll-through, 1440+390): no persistent difference
  (`book`'s form iframe height and `index`'s visible count vary between loads; both re-captured).
  Final: editability EDITABLE, class-audit IN BOUNDS, class-rename --verify CLEAN.
- **Local source** (`workflows/04-design/.tmp/med-spa/site-src`, tracked): same map applied; the
  build's computed `is-m${month}` fixed by hand in `build-site.mjs`; `node build-site.mjs` builds;
  `class-sync-check.mjs`: build and staging list the same classes (bar Instatic's `wz-embed`).

## Next
- Production, after review: the same steps (backup, baseline, `css-to-registry --in-place`,
  `framework.mjs apply` with this spec, `class-rename --site stone-med-spa:production --map …` with
  the expanded map, the gates). Ask before.
- Optional, team decision: move the six inexact tokens into the Framework (sub-pixel shift).
- Warnings left by the audit (not failures): 18 groups of identical custom classes across different
  components (Client-First allows them to diverge), 107 classes setting their own font size, 117
  contextual rules (`.x p`).

## Gotchas
- `site-src` and `final-site` under `.tmp` ARE tracked on this branch: git is the backup.
- A build script that computes class names (`is-m${month}`) or parses its own HTML with a regex
  needs `class-sync-check.mjs` after a rename; the engine now rewrites regex literals, not computed
  names.
- Book page: the GHL form iframe changes the page height between loads; not a regression.
