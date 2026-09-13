# Style direction — Alki House

Set 2026-09-13 from the client handoff (brand PNGs, eight style references, the stock ledger) and
[`DESIGN-STANDARD.md`](../../../../docs/DESIGN-STANDARD.md). Executable copy of every decision here:
`site-src/css/01-tokens.css`, the chapter files under `site-src/css/3x-*.css` and `site-src/sections/`.

## One sentence

A dark, warm product stage — coffee grounds, ember light, apricot type — where scroll turns the
stage and the inventory sheet is the content.

## What the client gave us, and what each source controls

| Source | Controls | Notes |
| :--- | :--- | :--- |
| `Brand/Color Palette.png` | Palette, polarity | Four swatches: Dark Coffee `#432818`, Autumn Ember `#A65E2A`, Light Apricot `#FFEBB7`, White. Extended only by tints/shades. |
| `Brand/Alkihouse Logo.png` | Mark, polarity | Interlaced A monogram, apricot on coffee. Dark-first follows from it. Extracted to a transparent PNG for the nav and footer. |
| `Style references/` (8 images) | Layout and overall design **only** | Dark e-commerce with a single large product cut-out in the hero; a spec strip; category tiles; a fanned product carousel; wide display type; glass panels over photography. Their palettes (blue, red, orange, monochrome) are ignored. |
| `Stock/products.csv` | Content | The ledger is the catalogue: 235 products after folding 600 lot rows. Names translated, brands and categories derived, latest sale price and units on hand kept. |
| Brief (chat, 2026-09-12) | Scope | Home, catalogue, single product; sheet-driven CMS; high-end GSAP motion; modern font; stock and AI imagery via the Freepik/Magnific key. |

Authority when sources conflict: palette PNG > logo > brief > references. Nothing conflicted.

## Palette rules

- Ember is a **fill**, never text on coffee: it measures 2.5:1. Text accents on coffee are apricot
  (11:1). On the light ground the accent text is `ember-ink` `#6B3A16` (5.6:1).
- Two grounds. Dark is the default (coffee-950); chapters 03 and 04 on the home page, chapter 01 on
  the product page and the catalogue's invitation flip to `data-theme="light"` (apricot). The Set
  chapter tweens its own ground from apricot back to coffee under scroll, so the hand-back is a
  shift, not a cut.
- One accent glow: a radial ember/apricot spot under every product on a stage (hero, The Stage,
  product arrival). It is the site's recurring device.

## Type

Bricolage Grotesque for display (wide, characterful, modern without being a tech cliché), Manrope
for body and UI, JetBrains Mono for chapter tags, labels and specs — the mono is what makes the
spec rows and stock stamps read as "from the sheet". Static weights only: Instatic installs static
instances. Sized in `rem` off the house fluid root; display steps via four multipliers at
1279 / 991 / 767 px, body copy lifted at 478 so it never drops under 16 px on a phone.

## The journey

Home, eight chapters in a fixed order; three are pinned and scrubbed, and scroll drives two more.

| # | Chapter | What scroll does |
| :--- | :--- | :--- |
| 00 | Arrival | Kling film loop, split headline, the featured piece floats on its stage and leans to the cursor. Departs by receding. |
| 01 | The Rail | **Pinned.** Eleven category panels travel sideways; progress bar and `06 / 11` read the trigger. |
| 02 | The Stage | **Pinned, the signature.** One spotlight, five featured pieces; each swings out left as the next lands from the right, copy rising line by line. 25 / 50 / 75 % are three different products. |
| 03 | The Promise | Light ground. Velocity-reactive marquee, counters written by scroll position, photograph parallax. |
| 04 | The Set | Three kit cards wipe open under scroll; the ground tweens apricot → coffee. |
| 05 | The Floor | Live in-stock grid from the sheet, batch-revealed, hover shows the second angle. |
| 06 | The Way | **Pinned (desktop).** A line draws itself through three steps; each lights as the line reaches it. |
| 07 | Invitation | The question form under an ember glow. |

Catalogue: Arrival → The Aisles (the filter rail pins under the nav) → The Floor (the whole sheet,
filtered client-side from the same JSON, state in the URL) → Invitation.

Product: Arrival (the piece on its stage, angles swap with a swing, cursor lean) → The Detail
(light; specs write in row by row under scroll) → The Fit (draggable rail of the same aisle) →
Invitation. A fixed action bar rides the bottom on phones.

## Imagery

- **Product photography**: harvested from the open web per product (manufacturer and retailer
  shots, up to five angles), knocked out of their white grounds by `prepare-assets.py` so they float
  on the coffee stage. Products without a clean shot get a category glyph on the plate, never a
  white box.
- **Scenes**: ten Mystic renders in palette (studio, gimbal, audio desk, rig, adapter macro, creator
  room, softbox glow, product stage, monitor glow), three Kling loops, ten Freepik premium stock
  photos. All under `03-graphic-resources/.tmp/scenes/` with a manifest; prepared to WebP by
  `prepare-assets.py`.

## What the references were *not* used for

No section shape was lifted. The "fanned carousel" became The Stage (one piece at a time, on a
plate, turned by scroll); the "category tiles" became a pinned horizontal rail; the "spec strip"
became the ticker under the hero and the three-column spec row inside The Stage.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../../../SYSTEM_RULES.md).
