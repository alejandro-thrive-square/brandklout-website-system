# 2026-10-08 — nav-menus gate: every submenu tapped open, every link checked

Triggered by Mason Park (bk-mason-park, `docs/runbook/2026-10-08-mobile-menu-submenus.md`): on a
phone, tapping Services in the drawer slid the list half its width off the drawer's left edge, on
production and staging, since launch. Every gate was green. The user asked that the build process
stop it happening on the next builds.

## Done

- **New gate** `deliver/process/tools/instatic-site/gates/nav-menus.mjs`. Below 1024px it taps like a
  finger (touch emulation): the toggle, then every parent with a submenu, outer first. At 1024 and up
  with no toggle showing, it hovers. Each link the open list shows is scrolled into the drawer's view
  and must not be `invisible`, `clipped` (text outside the screen or a clipping ancestor), or
  `covered` (`elementFromPoint`). A parent tap that changes the URL is `navigates`; no menu found is
  `no menu`, a failure so that a renamed nav cannot make the gate pass blind. Defaults cover
  Client-First `navbar_*`, Webflow `w-nav-*` and `header nav`; `--toggle` / `--menu` override.
  Proven: Mason Park production before the fix FAIL, 104 problems; after, `PROBLEMS  none` on both
  instances (4 pages × 5 widths, 1,160 links); the kids site passes (96 links).
- **SOP**: `scenario-0-new-site/03-design-build/DESIGN-STANDARD.md`: a "CSS traps" entry (write
  desktop-only menu states inside `@media (min-width: <drawer breakpoint + 1px>)`), the visual
  checklist line, and **Definition of done #12**. `03-design-build.md` step 8 and `04-qa.md` step 3 run
  the gate; `scenario-2-updates-expansions/03-qa-and-publish.md` runs it after any header, menu or
  stylesheet change; `tools/instatic-site/README.md` lists it.

## Next

- The FigJam *Deliver SOP's* board was synced earlier today; add the gate to the S0 03/04 and S2 03
  cards on the next sync.
- Other live sites were not swept, except the Mason Park kids site. A sweep is one command per host.

## Gotchas

- **click-controls passes this bug by design**: it asks whether a click changed anything, and the
  tap did (`is-open`). A gate has to ask where the revealed content ended up.
- The cause generalises: a `max-width` drawer reset of one class cannot beat a desktop rule on
  `:hover` / `:focus-within` with four, and a tap focuses the link. Specificity, not source order.
- Ad landing pages have no menu by design and report `no menu`; don't pass them.
- `puppeteer-core` is not a repo dependency: `PUPPETEER_DIR=<a worktree's node_modules/>`, as for the
  other gates.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../SYSTEM_RULES.md).
