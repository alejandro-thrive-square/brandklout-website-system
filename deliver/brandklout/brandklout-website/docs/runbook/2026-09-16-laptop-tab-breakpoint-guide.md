# 2026-09-16 — "My UI edit didn't publish": no Desktop breakpoint, so every edit went to Laptop (seq 43)

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

- **Root cause (found after Alejandro: "Instatic seems to be showing only the laptop breakpoint and below")**: the
  site had no `desktop` breakpoint. The editor bundle treats id `desktop` as the base (base-style edits,
  default active breakpoint) and a canvas click activates that frame's breakpoint, so with only
  Laptop…Mobile frames nobody could edit base styles. `class-system.mjs` had replaced the list without it.

## Done

- **Seq 43**: `desktop` (1440, `(max-width: 1440px)`) added first to `site.breakpoints` and published.
  Published `style-4ffd548067f2.css` byte-identical before/after; headless editor shows "Desktop 1440px"
  as the first frame. Backup: `21-instatic-upload/.tmp/backup-2026-09-16-seq42-pre-desktop-bp/site.json`.
- `class-system.mjs`: `DESKTOP` written first into the registry's breakpoints; kept out of `BREAKPOINTS`
  (width snapping), where a 1440 max-width would become a base edit.

- Team guide published as an artifact: <https://claude.ai/artifact/BqYyWXMvR7w73EiLjo76Qo>
  (Webflow → Instatic table, width ruler, the cs-section-head case, checklist).
- Commit `98ec2083`. Directive `21-instatic-upload.md`: new section "breakpoint tabs for Webflow users"; the stale
  "seven breakpoint tabs" line corrected to the standard four.
- The `.cs-section-head` edit itself stays Laptop-only until Alejandro decides (move it to base
  and clear the Tablet/Mobile-landscape gaps, or revert).

## Next

- Decision on `.cs-section-head`: all widths, ≤1279 only, or revert.
- Teammates: reload the editor; click in the Desktop frame for base edits.
- Optional: rename the Laptop tab's label (e.g. "≤1279 Laptop") in the site breakpoints, if the team wants the range visible in the editor.

## Gotchas

- **An Instatic site without a `desktop` breakpoint has no base view in the editor.** Never write
  `site.breakpoints` without it first; it never emits CSS on its own.
- Don't add `desktop` to a list that maps source media widths to breakpoints (1440 would snap onto it).

- 1280 is one pixel above Laptop. DevTools' 1280×720 preset, 1440 and a 1512 MacBook browser are all desktop.
- Diagnose "didn't publish" in this order: rule `styles` vs `contextStyles` from `GET /site`, then grep the published CSS, then measure at 1279 and 1280. The stylesheet name is hashed, so it is never a cache problem.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../../SYSTEM_RULES.md).
