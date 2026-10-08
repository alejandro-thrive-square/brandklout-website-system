# 2026-10-07 — The Instatic editor showed the menu drawer and the story modal over every page

Fleet canvas brief (`instatic-api-sync/output/fleet/BRIEF-ifa-canvas.md` on main). **Staging only.**
Production (the WordPress clone on `www.ifadentistry.com`) was not touched.

## What was wrong

The user opened `/admin/site` on staging and saw every page "completely broken": a dark overlay in every
breakpoint frame. Every published-page gate was green. Cause (coordinator, read-only, 2026-10-07): the menu
drawer, the story modal and the gallery lightbox were closed ONLY by the HTML `hidden` attribute
(`.modal_component[hidden] { display: none }`, site.js toggling `el.hidden`). The editor canvas renders the
node tree through React, and Instatic passes `htmlAttributes.hidden` as the empty string, which React drops
for a boolean attribute. Site scripts do not run in the canvas, so the two fixed, full-viewport overlays
(`.modal_component` is 92% dark) sat over the page in all three frames. The published HTML kept `hidden=""`,
which is why nothing else saw it. Baseline: `output/fleet/ifa-dentistry/canvas-before.png` / `.txt` on main
(drawer + modal showing in the 375, 768 and 1440 frames).

## Done

- **Closed is now the CSS default; open is the `is-open` combo.** `site-src/css/10-chrome.css`:
  `.menu-drawer_component { display: none }` + `.menu-drawer_component.is-open { display: flex }`;
  `.modal_component { display: none }` + `.modal_component.is-open { display: grid }`.
  `site-src/css/40-pages.css`: the same for `.lightbox_component` (grid). The three `[hidden]` rules are gone.
- **The scripts toggle both**: `IFA.setOpen(el, open)` in `js/00-core.js` sets `el.hidden = !open` (assistive
  tech: the closed dialog stays out of the accessibility tree and tab order) and toggles `is-open`. Used by
  `openDrawer` / `closeDrawer` (the GSAP clip-path close still finishes before the drawer closes), `openModal` /
  `closeModal`, and the lightbox in `js/30-pages.js`. Every `if (el.hidden) return` guard is unchanged. Escape,
  click-outside, focus return and the `lockScroll` pairing are as before.
- **Every other `hidden` on the site was checked**: nothing else is written in the HTML. FAQ answers
  (`.faq_answer[hidden]`) and filtered gallery items (`.gallery_item[hidden]`) get `hidden` from scripts at
  runtime only, are in flow and small, and the canvas shows them all open — which helps editing. Left as they
  are. `aria-hidden="true"` is a string attribute and survives.
- Rebuilt, local audit IN BOUNDS, pushed through `push/` in README order (replace push, 58 pages, same row ids,
  0 deleted; 404 flag; `editable.mjs --apply`; publish). Staging seq 21 → published 2026-10-08 ~03:10Z.
- `site-src/KIT.md` (*Lessons*) and `push/README.md` (*Traps*) carry the rule and the gate.

## Gates (staging)

| Gate | Result |
| --- | --- |
| `editor-canvas.mjs` (new on main `3abbc787`, inside `migration-gates.mjs final`) | **ok**: 3 frames, 0 overlays; screenshot read: the home renders in the 768 and 1440 frames |
| `migration-gates.mjs final` | **EDITABLE · IN BOUNDS · CLEAN · editor canvas ok** |
| `push/cascade-check.mjs` | **OK**: 3,404 declarations, 0 missing, 0 order swaps the cascade can see |
| `class-sync-check.mjs` | build = site on 58 pages except the form slot (GoHighLevel embed) and `__cf_email__` |
| `head-parity.mjs` before → after | **0 of 57** URLs differ |
| Published HTML | `hidden=""` still on the drawer, modal and lightbox |
| css parity `cv-before → cv-after` | **0 / 0 real** at 1440 / 390 (0 raw). 1920: 2 raw, both the `.container-large` margin:auto reading (home `#specialist`, 0px → 96px); the same reading flips the other way on the HIPAA page between the two *after* captures of one unchanged state, and a live read with scripts off gives 96px on both pages 6 times out of 6 (max-width 1728 in 1920). Capture noise, not a change |
| runtime parity `cv-before → cv-after` | **OK**: 9 first-pass differences, all re-captured; none survives a second capture (the 390 page-height jump is the GoHighLevel iframe, the two "Compare before and after" sliders and the home's "03 · Made" step are the known 390 capture noise) |
| Overlay behaviour (own puppeteer check on the published site: drawer at 1440/390, modal, lightbox at 1440/390) | all three closed at load, open on click with `is-open`, close on Escape with `hidden` back, reopen; no page errors |

## Next

- Nothing for this fix. Production gets it with the launch push like everything else in site-src.
- Pre-existing, not changed: `openModal` focuses the close button while GSAP's `autoAlpha: 0` from-state has the
  modal at `visibility: hidden`, so the focus call lands nowhere (the lightbox animates its box, not the dialog,
  and focuses fine). Focus the button in the tween's `onComplete` when the modal is next touched.

## Gotchas

- **An overlay closed only by `hidden` shows in the editor.** The canvas is a different renderer: React drops
  `hidden=""` and no site script runs. Close overlays in CSS by default (`display: none` on the base class) and
  open them with `.is-open`; toggle `hidden` as well for assistive tech. Gate: `editor-canvas.mjs --site $S`,
  now part of `migration-gates.mjs final`. Look at its screenshot.
- **At 1920 the css gate reads a `.container-large` margin as 0px now and then** (margin:auto, max-width 1728): it shows up as `0px -> 96px` on one page in one capture. Check `css-parity diff <after> <after~n>` for the same flip before calling it a change.
- The three `.x.is-open` compound rules are ambient selector rules in the registry (7 fewer folds, 712 ambient
  vs 705); `cascade-check` is the gate that proves the order still holds.
- The staging control run of the overlay check timed out at 390 while the parity snapshot was hammering
  Chrome: do not run two Chrome-heavy checks at once on this machine.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../../SYSTEM_RULES.md).
