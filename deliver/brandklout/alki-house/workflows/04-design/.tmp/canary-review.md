# Canary review — Alki House

The home page was built first as the canary, then the catalogue and the product template were
composed from the same tokens, shell and runtime. Reviewed 2026-09-13 on the local build
(`../final-site/`) in the installed Chrome via `site-src/shoot.mjs` and `site-src/peek.mjs`.

## Direction

Dark, warm product stage in the client's four swatches; Bricolage Grotesque / Manrope / JetBrains
Mono; eight named chapters on the home page, four on the catalogue and the product page. Reviewed at
1440 and 390 with motion on, chapter by chapter, from viewport captures under
`08-qa/.tmp/screenshots/peek/`. Approved internally as the direction for the batch; awaiting the
client's eye.

## Gates

| Gate | Result |
| :--- | :--- |
| Journey audit (`journey-audit.mjs`) | 1 / 1 pass: 8 chapters, 3 pins, 21 scrubs, 135 GSAP calls, 26 splits, 0 IntersectionObserver, 0 band-named sections |
| Fluid root (`fluid-root.mjs --check`) | 238 / 238 pages carry the root; problems: none |
| Scrub proof, motion on, 1440 | The Rail `0.250 / 0.500 / 0.750`; The Stage `02 / 03 / 04`; The Way dash offset `450 / 300 / 150 px` — three different intermediate states in every pin |
| Scrub proof, motion on, 390 | The Rail and The Stage as above (The Way is not pinned on phones by design) |
| Console | No errors or warnings on any of the three page types at 1440 or 390 |
| Horizontal overflow | `scrollWidth − innerWidth` = 0 on all three pages at 360, 390, 768, 1024, 1440, 1920 |
| Root font-size | 13.0 px at 360, 13.76 px at 390, 16 px from 768 to 1440, 18 px at 1920 — matches the house table |
| Reduced motion | Every module returns after revealing content; pinned chapters unpin; the film stays on its poster |
| Full-page captures | `08-qa/.tmp/screenshots/{index,products,product}/<width>.png` at the six widths |

## Notes from the review

- The hero product, The Stage and the product arrival share one device (the ember spot under a
  floating cut-out) — deliberate, it is the site's signature.
- Product cut-outs: 1,162 harvested shots, ~90 % knocked out of white grounds; drop shadows are
  removed by a bounded region-grow so nothing sits in a grey puddle. Around 30 products have doubtful
  matches (listed in the 2026-09-13 runbook) and all of them should be replaced by the client's own
  photographs before launch.
- The inquiry form has no endpoint yet and says so on the page.
- Contact details and location are not in the handoff, so the site carries none.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../../../SYSTEM_RULES.md).
