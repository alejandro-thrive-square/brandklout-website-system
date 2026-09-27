# 2026-09-13 — local build: home, catalogue, product template, assets, CMS shape

Brief (Alejandro, 2026-09-12): build the site locally first — home, products, single product —
to the high-end GSAP bar; style references for layout only; modern font; a sheet-driven CMS whose
sync plugin comes later; product photos harvested per product; decorative stock and AI scenes via
the Magnific (Freepik) key.

## Done (commit `6591b8f7`)

- **Catalogue from the ledger.** `Stock/products.csv` is a per-lot purchase log in Spanish (600
  rows, costs and commissions). `site-src/data/build-catalogue.mjs` folds it into 235 products:
  English names (word map plus a canonical-name table for the ~150 spellings the map cannot fix),
  brand, one of 11 categories, latest sale price, units on hand, `New, sealed` when the ledger says
  so. `catalogue-overrides.json` layers taglines, descriptions, specs and `featured` on sixteen
  products. Output `products.json` is the stand-in for the Google Sheet; columns are fixed in
  [`docs/cms-schema.md`](../cms-schema.md). Internal ledger columns are never rendered.
- **Site source** at `workflows/04-design/.tmp/site-src/` (partials, `pages/*.body.html`,
  `css/`, `js/`, `sections/`, `data/`, `assets/`, vendored GSAP 3.15). `node build-site.mjs`
  writes `../final-site/`: `index.html`, `products.html`, `product.html` (canary) and
  `products/<slug>.html` for all 235, one product template rendered per CMS row.
- **Home**: eight named chapters — Arrival (Kling film, split headline, product on a stage that
  leans to the cursor) · The Rail (pinned horizontal walk of the 11 aisles) · The Stage (pinned;
  five featured pieces turn on one spotlight — the signature) · The Promise (light ground,
  velocity marquee, scrubbed counters) · The Set (three kits wipe open; ground tweens apricot →
  coffee) · The Floor (live in-stock grid) · The Way (pinned; a line draws through three steps) ·
  Invitation (form, endpoint unwired).
- **Catalogue**: arrival with category chips → pinned filter rail (search, brand, sort, in-stock
  toggle; state in the URL, so `?cat=gimbals` links land filtered) → the full grid → invitation.
- **Product**: the piece on its stage with up to five angles (thumbs, arrow keys, swipe), price and
  status from the sheet, specs table that writes in under scroll, a draggable rail of the same aisle,
  a fixed action bar on phones.
- **Tokens**: the four brand swatches and their tints; dark-first from the logo; light chapters via
  `data-theme="light"`. Bricolage Grotesque / Manrope / JetBrains Mono. Fluid root installed; type
  in `rem` with four display multipliers. Rationale in `04-design/.tmp/style-direction.md`,
  values in `design-tokens.json`, sources in `reference-inventory.md`.
- **Imagery**: `03-graphic-resources/.tmp/generate-scenes.mjs` — 10 Mystic renders, 3 Kling loops,
  10 Freepik premium stock photos, with a manifest and nine logged rejects.
  `harvest-product-images.mjs` — DuckDuckGo/Bing image search per product, scored and de-duplicated.
  `site-src/prepare-assets.py` — scenes to WebP, product shots knocked out of white grounds into
  transparent WebP cut-outs (`assets/products/index.json` records which are cut-outs).
  Direction and licensing note in `03-graphic-resources/.tmp/asset-direction.md`.
- **Verification tooling**: `site-src/shoot.mjs` (console errors, active modules, overflow, root
  size, scrub proof at 25/50/75 % of every pin, full-page captures) and `peek.mjs` (viewport
  captures at a chapter and progress, motion on). Screenshots under `08-qa/.tmp/screenshots/`.

## Gates (final build, 2026-09-13)

| Gate | Result |
| :--- | :--- |
| `journey-audit.mjs` on `final-site` | **1 / 1 pass** — 8 chapters, 3 pins, 21 scrubs, 135 GSAP calls, 26 splits, 0 IntersectionObserver, 0 bands |
| `fluid-root.mjs --check` | **238 / 238** pages carry the root, problems: none |
| Scrub proof (motion on, `shoot.mjs --motion`) | The Rail 0.25 / 0.50 / 0.75 · The Stage 02 / 03 / 04 · The Way 450 / 300 / 150 px at 25 / 50 / 75 % — real scrubbing on every pin, at 1440 and 390 |
| Console | Clean on home, catalogue and product at 1440 and 390 |
| Overflow | 0 px document overflow at 360 / 390 / 768 / 1024 / 1440 / 1920 on all three pages |
| Screenshots | `08-qa/.tmp/screenshots/{index,products,product}/<width>.png` plus chapter peeks under `peek/`, all reviewed |
| Photos | 235 / 235 products with images (1,162 shots, ~90 % cut-outs); ~30 doubtful matches listed by the harvester: the a7 V cases, the Vello BG-S3 grip, the JVC charger, the Canon lens rubbers, the a7 II card door, the no-name ZU80/ZGRL/100W COB lights, the Osmo Nano kit, the vague-named brackets/kits, the R50 V case, and the Osmo Mobile SE/4 SE siblings. All harvested shots are draft placeholders for the client's own photographs. |

## Next

1. Client answers: contact channel for the form, location, domain, Asana GID, which harvested
   product images they may use (their own unit photos should replace them), the draft specs.
2. Instatic instance on Railway; copy `22-instatic-api-sync`, `18-instatic-embeds`,
   `20-instatic-domain-origins`; upload the package; product template → collection template.
3. The Google Sheet sync plugin, to `docs/cms-schema.md`.
4. Wire the form endpoint; add the phone/WhatsApp CTA once known.

## Gotchas

- **The audit counts the literal `pin:true`.** `pin: someElement` is architecturally identical and
  fails the gate; write `trigger: pinEl, pin: true`.
- **GSAP Draggable `type:'scrollLeft'` wraps the container's children in a block div**, collapsing
  a flex rail into one column with a single child. Hand-rolled pointer drag instead.
- **A `NaN` in a ScrollTrigger `end` function silently gives a zero-length pin.** The rail's
  `end` read `parseFloat('clamp(...)')`; the scrub proof showed `1.000` at 25 % and that was the tell.
- **The fluid-root gate rejects `font-size:16px` even on inputs.** Use `var(--body)`; with the
  478 text multiplier it stays ≥16 px on phones, which keeps iOS from zooming.
- **Mystic invents brand lettering on gear.** "Unbranded, no markings, no text" in the prompt, and
  look at every render; four Mystic passes on the adapter macro never cleaned up, Seedream did.
- **Cut-outs need a white ground to flood from.** `prepare-assets.py` requires five of eight
  edge samples near-white; anything else is kept as a photo and the card shows it edge to edge.
- Pinned chapters need `overflow: clip` with `overflow-clip-margin` on their decks, or the
  off-stage slides (translated 60 %) show up as `.wrap` overflow in the QA probe.
- Draft site is file:// only; nothing is hosted. Images and video are gitignored — re-run
  `generate-scenes.mjs`, `harvest-product-images.mjs` and `prepare-assets.py` on a fresh machine.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../../SYSTEM_RULES.md).
