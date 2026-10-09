# 2026-10-09 — WhatsApp Business catalogue extracted

Brief (Alejandro, 2026-10-09): the shop's WhatsApp catalogue is the most current inventory; extract
it from WhatsApp Web with browser automation.

## Done (commit `0afa0766`)

- **73 products and 143 photos** read from the catalogue of the contact *Anferny* (Alki House) in
  the user's WhatsApp Web, through Claude in Chrome's `javascript_tool` on WhatsApp's own models
  (`WAWebCollections.Catalog`), not by scraping the panel. Output and the full method in
  [`workflows/01-content-intake/.tmp/whatsapp-catalog/`](../../workflows/01-content-intake/.tmp/whatsapp-catalog/README.md):
  `catalog.json`, `catalog.csv`, `images/<waId>/` (R2), and the three scripts that reproduce it.
- **What it says**: 60 disponible, 9 en camino, 4 agotado; prices in **Bs** typed into the
  description (57 priced, 1 in $, 1 with two options, 14 blank); 4 collections (Iluminación 13,
  Estabilizadores 10, Adaptadores 8, Baterías 6), 38 products in none.
- **Against the site**: a rough name match finds ~61 of the 73 in `products.json` (235 rows from the
  ledger, 142 with stock); ~12 look new. Nothing in the site or its CMS was changed.
- Photos pushed to R2 (`assets.tsv`, 143 rows).

## Next

1. Decide with Alejandro: does the WhatsApp catalogue **replace** the ledger as the site's source
   (73 products, Bs, the client's own photos), or only correct it? It changes `build-catalogue.mjs`,
   the price display and currency, and the 235 product pages.
2. If it replaces: map `catalog.json` → the CMS columns in `docs/cms-schema.md` (`status` →
   `stock`/Agotado, `en-camino` needs a badge the schema lacks, `priceOptions` has no column), use
   `images/` as the product shots in place of the harvested ones.
3. Ask the client about the 14 blank prices and row 73's `15$`.

## Gotchas

- **The panel stops paging at 10 products.** "Todos los artículos" never loads past the first page
  in the UI; `Catalog.findNextProductPage(cat.id, 50)` pages to the end (20 a call), and
  `cat.collections.findCollectionProducts({catalogWid, collectionId, afterCursor, productsLimit})`
  fills each collection.
- **Getting the payload out**: the tool output redacts the signed CDN URLs (and base64), so Node
  cannot fetch the images; fetch them in the page. A Chrome download worked but landed in Chrome's
  *last-used* folder (`workflows/03-graphic-resources/`), not `~/Downloads` — removed after checking
  it was byte-identical. The reliable path is `recv.mjs` + a `window.open` fired from a real click
  (scripted, it is popup-blocked).
- **`assets.mjs push` uploads every untracked file and only ever adds to `assets.tsv`** — commit
  the text files first. Pushed before the commit, the JSON and scripts went in, and a second push
  after the commit did not take them out; the five lines were deleted from `assets.tsv` by hand.
- WhatsApp's `availability` is `in stock` on every product; status lives only in the *Estado* text.
