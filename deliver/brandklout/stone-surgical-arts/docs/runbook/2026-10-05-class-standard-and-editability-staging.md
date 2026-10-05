# 2026-10-05 — Client-First class standard + everything editable, STAGING

Standard: `deliver/process/tools/client-first-style-guide/CLASS-STANDARD.md` and `INSTATIC-FRAMEWORK.md`
on main; tools in `deliver/process/tools/instatic-api-sync/`. Second site of the fleet migration
(after Stone Med Spa). **Production untouched.**

## Done (staging.dfwsurgicalarts.com)
- Backup before any write: `instatic-api-sync/output/fleet/stone-surgical-arts/backup-pre-migration/`
  (site.json + 55 pages + published HTML; local). Draft matched published at the start.
- **Editability**: `src/styles/tokens.css` (70 rules) moved into the registry rules it came from
  (`css-to-registry.mjs --in-place`: 69 in place, 1 new), asset disabled. Framework from
  `workflows/21-instatic-upload/class-standard/framework-spec.json`: 25 colours, the type bases
  (`--size-h1-base` …, `--size-display-base`, `--size-numeral-base`…; formulas stay in the registry
  with their breakpoint multipliers), spacing and UI sizes → the Framework owns 48 variables, root 16.
  Kept in the registry: inexact sizes (`--size-h4` 1.625rem, `--size-h6`, `--size-text-medium`,
  `--size-text-small`, `--space-tiny`, `--radius` 2px) and responsive tokens (`--spec-w`,
  `--size-h3-j`, multipliers).
- **Repair**: the first in-place move kept a dead media override (`.arrival_component` `@991
  min-height: 0`, overridden in the old cascade by a later 92vh base): the home hero collapsed on
  phones. Found by css-parity (390), fixed with `fix-dead-overrides.mjs`; the tool is fixed for good.
- **Classes**: `class-map.json` (+ `.expanded.json`): 107 class rules renamed: folders tl → timeline,
  cv → visit, calc → calculator, mech → mechanism, recov → recovery, catx → catalogue-feature,
  dhero → detail-hero, dsec → detail-section, hubfaq → hub-faq, mbar → mobile-bar, prof → profile,
  spec → procedure-spec, toc → table-of-contents; eyebrow → text-style-tagline, reg →
  text-style-registered, display-lg/xl → heading-style-display-large/xlarge, display-accent →
  text-style-display-accent-flat, u-fill → height-full, u-focus-* → object-position-*, dsec →
  section_detail, stone-band/panel → section-style-band/panel, has-ghost → is-ghost, *-num →
  *-number, *-col → *-column, is-a/b/c → is-position-1/2/3. 4 script selectors + 2 classList tokens.
- **Proof**: css-parity 0 real differences before→mid and mid→after at 1440, 390, 1920 (animations
  frozen, two-capture noise filter). Runtime parity before→after: OK on all 110 page/width captures
  (the raw `mid` capture caught the book form iframe and the home accordion mid-load; the re-checked
  baseline agrees). Final: EDITABLE, IN BOUNDS, CLEAN.
- No local source is maintained for this site (Instatic is the source of truth).

## Next
- Production after review: same steps (see the system run `2026-10-05-fleet-class-standard.md`).
- Optional, team decision: inexact tokens into the Framework (sub-pixel shift).
- Audit warnings (not failures): 25 identical-class groups across components, ~190 classes with
  their own font size, ~160 contextual rules.

## Gotchas
- The home hero's phone height came from a LATER base declaration beating an earlier media override:
  in the registry a rule's media overrides always come after its base. `css-to-registry --in-place`
  now drops such dead overrides.
- book page height (GHL iframe) and the home accordion's first item vary between captures.
