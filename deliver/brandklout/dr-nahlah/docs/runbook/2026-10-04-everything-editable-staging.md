# 2026-10-04 — Everything editable on Instatic: Framework tokens + landing.css into the registry (STAGING ONLY)

System standard: `deliver/process/tools/client-first-style-guide/INSTATIC-FRAMEWORK.md` on main.
Tools: `deliver/process/tools/instatic-api-sync/` (`framework.mjs`, `css-to-registry.mjs`,
`editability.mjs`, `css-parity.mjs --site --all-pages`). **Production is untouched.**

## Found
- `site.css` and `runtime-states.css` were already disabled on both hosts: the main design lives in
  the registry (1002 rules) since the 2026-08-21 cutover.
- The 25 base colours were already in the Framework and the registry `:root` no longer declared
  them, so the palette was already editable in the Framework panel.
- Not editable: `src/styles/landing.css` (175 rules, enabled code asset scoped to the 19 ads pages)
  and the colour aliases, type sizes and gutter/section values in the registry `:root`. The Framework
  root font size was the default 10.

## Done (staging.drnahlah.com)
- `framework.mjs apply framework/framework-spec.json` (in `workflows/22-instatic-api-sync/`): root 16;
  colours `accent`, `accent-lg`, `rule`, `focus` (as `var()` aliases); group *Type sizes*
  (`size-display-1` … `size-label`, fixed px); group *Layout* (`gutter-min/max`, `section-min/max`).
  Registry `:root`: aliases removed, `--d1` … `--label` now `calc(var(--size-…) * var(--t-…))`,
  `--gutter`/`--section` now `clamp(var(--…-min), Nvw, var(--…-max))`. Framework owns 40 variables.
- `css-to-registry.mjs --files src/styles/landing.css`: 62 rules into their class chips (+16 folded),
  97 selector rules, 2 conditions, 1 class rule demoted; the asset is disabled (content kept).
- Published. `editability.mjs --published`: **EDITABLE** (no `userStyles` on any page now).
- Parity (`css-parity`, 59 pages, scripts off): with the three rounded sizes held at their old values
  the move was **exact** at 1440 and 390, and at 1920 differed by 52 values that a second snapshot of
  the unchanged site reproduces (auto-margin flips, a late font on the ChatGPT page) = capture noise.
  The final state differs only by the Framework's two-decimal rem: body 15.6 → 15.68px,
  labels 11.232 → 11.2px, large body 18 → 18.08px (~39k derived values: line-heights, `ch` widths).
- Manual-edit proof: Codex in Chrome changed `gold-ink` to #B00020 and `size-heading-2` to 60px in
  the Framework panel ("Draft synced"); published live; a per-page write (`veneers`) and a whole-shell
  save as push-site sends them did not undo it; values put back and republished.

## Next
- **Production:** same three steps on www.drnahlah.com when the client/team agrees (spec as is;
  `css-to-registry` on `landing.css`; publish; `editability.mjs --published`). Snapshot parity first.
- Decide whether the sub-pixel rounding is acceptable on production (it is invisible at 1x), or keep
  `--body`, `--label`, `--body-lg` as literals (then those three are not Framework-editable).
- site-src (`04-design/.tmp/site-src/css/`) still declares the old literal tokens; mirror the new
  names (`framework.mjs pull`) before the next local build.

## Gotchas
- The Framework panel shows a `var()` colour alias as `#000000`; the value is intact, but editing it
  in the panel replaces the reference. Repoint aliases with `framework.mjs apply`.
- The Framework writes sizes as two-decimal rem; `.975rem` cannot be expressed.
- `css-parity` at 1920 is noisy on this site (~50 values between identical runs); compare noise
  before reading a 1920 diff.
