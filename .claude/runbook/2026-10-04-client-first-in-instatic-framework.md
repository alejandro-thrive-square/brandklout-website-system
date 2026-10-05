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
