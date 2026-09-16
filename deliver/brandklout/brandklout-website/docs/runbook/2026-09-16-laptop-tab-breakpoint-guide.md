# 2026-09-16 — "My UI edit didn't publish" was the Laptop tab (seq 42, nothing changed)

## Asked

Alejandro: a manual edit to `.cs-section-head` in the Instatic UI, published, did not show on the
live site; teammates (Sam) frustrated. Then: can we have a Webflow-style base breakpoint, or at
least a guide.

## Found

- Draft and published agree (`draftMatchesPublished: true`, published 2026-09-16 15:05 UTC, seq 42).
- The rule `cs-section-head` carries the edit under `contextStyles.laptop`
  (`display:flex; flex-direction:column; gap:20px`, plus an unused `grid-template-columns`);
  the published `style-4ffd548067f2.css` has it inside `@media (max-width: 1279px)`.
- The screenshot was DevTools at **1280×720**. Measured live with puppeteer: 1280 → grid, two
  columns; 1279 → flex column. Home and `/customer-story-ava-dental-launch` alike.
- Below 992 the gap is 35px/23px, because Tablet and Mobile landscape already set their own gaps.
- Instatic already cascades like Webflow (base → max-width tabs). The difference is that this site
  has a max-width **Laptop 1279** tab, where Webflow's 1280 tab is min-width. 77 rules use Laptop.

## Done

- Team guide published as an artifact: <https://claude.ai/artifact/BqYyWXMvR7w73EiLjo76Qo>
  (Webflow → Instatic table, width ruler, the cs-section-head case, checklist).
- Directive `21-instatic-upload.md`: new section "breakpoint tabs for Webflow users"; the stale
  "seven breakpoint tabs" line corrected to the standard four.
- **No change to the site.** The edit stays Laptop-only until Alejandro decides (move it to base
  and clear the Tablet/Mobile-landscape gaps, or revert).

## Next

- Decision on `.cs-section-head`: all widths, ≤1279 only, or revert.
- Optional: rename the Laptop tab's label (e.g. "≤1279 Laptop") in the site breakpoints, if the team wants the range visible in the editor.

## Gotchas

- 1280 is one pixel above Laptop. DevTools' 1280×720 preset, 1440 and a 1512 MacBook browser are all desktop.
- Diagnose "didn't publish" in this order: rule `styles` vs `contextStyles` from `GET /site`, then grep the published CSS, then measure at 1279 and 1280. The stylesheet name is hashed, so it is never a cache problem.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../../SYSTEM_RULES.md).
