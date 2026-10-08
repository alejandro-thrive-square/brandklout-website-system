# 2026-10-08 — Mobile menu: the submenus slid off the drawer

Reported: "the mobile menu is broken … specifically on the services dropdown, the links did not
appear correctly". On a phone (and up to 1150px), tapping **Services**, **About** or **Patients** in
the drawer opened the list half its width past the drawer's left edge: the links sat at x = −43 on a
390 screen and showed as clipped fragments ("gums", "pain"). **Live on production and staging since
the launch**: the 2026-10-05 class rename did not cause it.

## Cause

The drawer's reset `.navbar_dropdown-list { transform: none }` (one class, inside
`@media (max-width: 1150px)`) loses to the desktop hover menu's
`.navbar_item.has-dropdown:hover > .navbar_dropdown-list, … :focus-within > …
{ transform: translateX(-50%) translateY(0) }` (four classes), which has no media query. A tap
focuses the parent link, so `:focus-within` matched and the open list moved left by half its width.
Nested lists got the 5-class twins.

## Done

- **Source** `workflows/09-static-rebuild/home/assets/site.css`: in the 1150 block, after the drawer's
  link padding, each desktop selector again with `.navbar_menu` in front, `transform: none`.
- **Staging** (CSS in the registry, Client-First names): one ambient rule, `media:(max-width: 1150px)`
  `{ transform: none }`, selectors with `is-dropdown`; seq 161 → 162, published 2026-10-08 04:24Z.
- **Production** (code asset `src/styles/mason-park.css`, old names): the same block inserted; the
  asset now equals `site.css` byte for byte. Published 2026-10-08 04:31Z. The pending production draft
  edit from 2026-10-04 17:51Z (`.pr-badges-in { margin-bottom: 0px }`, Styles panel) shipped with it:
  a visual no-op, since the asset sets `margin: 0 auto` and wins over the registry. **Production's draft
  now matches published**, so the 2026-10-05 note "resolve before any production publish" is closed.
- Script: `.tmp/nav-fix/fix-drawer-submenus.mjs --site mason-park:<env> [--apply] [--publish]`
  (backs up the shell first; the backups are beside it).
- **Gate**: new `tools/instatic-site/gates/nav-menus.mjs` on main (`9975abc1`, with the SOP changes). Before: production FAIL, 104
  problems (every submenu at 390 and 768). After: `PROBLEMS  none` on both instances, `/`,
  `/our-services`, `/services/invisalign`, `/blog` at 360/390/768/1024/1440 (1,160 links each).
  The kids site passes too (96 links), so it never had this.

## Next

- Nothing open for this. Any new menu item is covered by re-running
  `nav-menus.mjs --base <host> --widths 360,390,768,1024,1440`.

## Gotchas

- **click-controls could not catch this**: the tap DID change something (`is-open`). Only a check of
  where the revealed links landed does, which is what `nav-menus.mjs` adds.
- `nav-menus.mjs` on an ad landing page reports `no menu`: they have no nav by design; don't pass them.
- A `max-width` drawer block cannot reset what a desktop `:hover` / `:focus-within` rule sets unless
  it matches that rule's specificity. New builds write desktop menu states inside a `min-width` query
  (DESIGN-STANDARD.md, "CSS traps", on main).

## Version Control

This run file follows the runbook rules in [SYSTEM_RULES.md §5](../../../../SYSTEM_RULES.md).
