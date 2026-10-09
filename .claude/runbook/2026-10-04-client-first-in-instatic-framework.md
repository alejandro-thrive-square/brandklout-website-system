# 2026-10-04 — Client-First tokens live in the Instatic Framework (SOP change)

## Done
- New standard `deliver/process/tools/client-first-style-guide/INSTATIC-FRAMEWORK.md`: colours, type
  sizes, spacing and radii from the Relume style guide go into the Instatic Framework panel
  (`site.settings.framework` → `framework.css`) so a site stays hand-editable after every AI upload.
- Wired in: Scenario 0 step 03 (checklist, step 1, push-pipeline check), Scenario 2 step 02 (token
  changes go through the Framework; old sites migrate on next touch), `instatic-site/README.md`
  (push section), `instatic-api-sync.md` (layer table), style-guide README, PROCESS_INDEX,
  S2/02 `tools.json` (now mirrors `client-first-style-guide`).
- Read from the Instatic source (`Instatic-main.zip`, `src/core/framework/`,
  `src/core/publisher/frameworkCss.ts`) and the live Dr. Nahlah `site.json` (25 colour tokens).

## Gotchas
- `push-site.mjs` keeps `settings.framework` on both replace and `--update` pushes, but its
  `tokens.css` code asset loads LAST (`reset → framework → style → userStyles`): any variable it
  re-declares overrides the Framework, and a hand edit there looks saved but never shows.
- Framework default root font size is **10**; set 16 or every rem it writes is 1.6x small.
- Colour slugs are normalised to lower case, single dashes: Relume names like
  `--_primitives---colors--neutral-darkest` publish renamed, so name tokens Framework-safe from the start.
- Type/spacing scales emit `clamp(min, calc(vw + x), max)`; use Manual mode with min = max so the
  step is a fixed rem and the fluid root does the scaling.

## Next
- Script it: seed `settings.framework` from `01-tokens.css`, pull it back, strip Framework-owned names
  from `tokens.css` inside `push-site.mjs` (its MUST-token check will need adjusting), and gate the
  "no token in both framework.css and userStyles" check.
- Migrate existing Instatic sites on next touch; Dr. Nahlah first (Framework colours already set).
- FigJam *Deliver SOP's*: add the Framework step to the S0 03 and S2 02 cards.

## Done (later 2026-10-04): built, and tested on Dr. Nahlah staging
- Scope widened at the user's request to **all CSS editable**: tokens in the Framework, every other
  declaration in the registry, no rules in a code asset. Standard rewritten
  (`INSTATIC-FRAMEWORK.md`, now "Everything editable on Instatic").
- New in `deliver/process/tools/instatic-api-sync/`: `css-source.mjs` (dependency-free CSS reader),
  `css-to-registry.mjs` (code asset into the registry, no container), `framework-lib.mjs` +
  `framework.mjs` (show / extract / apply / pull), `registry-repair.mjs` (converter losses back into
  their rules), `editability.mjs` (the gate), `target.mjs` (`--site <client>[:staging]` via the fleet).
  `css-parity.mjs` gained `--site` and `--all-pages`.
- `push-site.mjs`: repairs the converted registry after reading the live site, skips Framework-owned
  tokens, ships a `@font-face`-only `tokens.css`; refuses when a declared custom property is in
  neither registry nor Framework. `TOKEN_ASSET=legacy` = old behaviour. Dry run on Hackensack's build
  against a read-only stub API: 58 declarations restored, 2 left to the Framework, ends "dry run".
- Dr. Nahlah staging (client run `2026-10-04-everything-editable-staging.md` on `bk-dr-nahlah`,
  `e89b422f`): EDITABLE; parity exact (control) at 1440/390, noise-only at 1920; a Framework panel
  edit (Codex in Chrome) survived page and shell uploads. Production untouched.

## Next
- Nahlah production: same steps after a parity snapshot (see the client run).
- Run `editability.mjs` across every Instatic site and move each on its next Scenario 2 visit.
- The first real `push-site.mjs --apply` with the repair: check `output/registry-repair.txt`,
  then `editability.mjs --published` and `css-declared-parity`.
- FigJam *Deliver SOP's*: S0 03 and S2 02 cards still lack the Framework/editability step.

## Gotchas (added)
- The Framework panel shows a `var()` colour alias as `#000000`; editing it there replaces the
  reference. Aliases are repointed with `framework.mjs apply`.
- Framework sizes are two-decimal rem (`round(px/root, 2)`): `.975rem` becomes `.98rem`.
- happy-dom drops custom properties, math values, layered backgrounds and `!important`; the registry
  does not. Write them into `styles` directly.
- The converter splits selector lists into one rule per selector and expands shorthands into
  longhands: a repair must distribute lists and must not append a shorthand after its longhands.
- `css-parity` at 1920 shows ~50 noise values between two identical runs on Nahlah.
- Port 8799 is taken on this workstation (a local service answers 501): pick another for stubs.
