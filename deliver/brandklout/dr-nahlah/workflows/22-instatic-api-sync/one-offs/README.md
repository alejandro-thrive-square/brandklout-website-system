# Dr. Nahlah one-off Instatic fixes

These eight scripts were written for Dr. Nahlah's site only and lived in the shared
`deliver/process/tools/instatic-api-sync/` toolkit on `main` until 2026-09-28, when the system
cleanup moved them here. Each did its job once; they are kept for reference and re-runs.

| Script | What it fixed |
|---|---|
| `adopt-framework-colors-fonts.mjs` | Made the Framework panel drive the site's colours and fonts (token adoption, phase 1) |
| `apply-panel-edits.mjs` | Re-applied four Styles-panel edits the code-asset stylesheet was overriding |
| `collapse-duplicates.mjs` | Collapsed registry rules sharing a selector, left by the 26-page HTML import |
| `patch-hero-seam.mjs` | The four registry rules behind the hairline seam under every hero |
| `prune-dead-rules.mjs` | Deleted registry rules that could never match after the 2026-08-17 class rename |
| `toggle-code-assets.mjs` | Turned the two code-asset stylesheets on or off, for A/B against the registry |
| `widen-large-screens.mjs` | The container and type ceiling above 1920px |
| `restore-review-wall.mjs` | Put the six review cards back on the home page (draft only, no publish) |

## Re-running one
They import `./insta-api.mjs`, which is not in this folder. Copy the current admin client from
`main` beside them first: `deliver/process/tools/instatic-api-sync/insta-api.mjs`. It refuses to
run without `INSTATIC_BASE_URL`, which the generated worktree `.env` provides.

## Version Control
Tracked on `bk-dr-nahlah`; follows the root rules in `SYSTEM_RULES.md`.
