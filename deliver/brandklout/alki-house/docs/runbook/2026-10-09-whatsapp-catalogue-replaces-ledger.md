# 2026-10-09 (later) — the WhatsApp catalogue replaces the ledger

Brief (Alejandro, 2026-10-09): "yes, replace the ledger with the WhatsApp catalogue."

## Done (commit `<sha>`)

The site's products now come from the shop's WhatsApp Business catalogue (73 products, prices in
Bs, the client's own photos) instead of the purchase ledger (235 products, $, harvested photos).
`final-site` is 77 pages: home, catalogue, order page, canary and 73 product pages.

- **`data/build-catalogue.mjs` rewritten.** Reads `01-content-intake/.tmp/whatsapp-catalog/catalog.json`.
  Name as the client typed it (emoji stripped); brand from "Marca:" or the name (maker only, never
  the camera it fits); category by Spanish rules (tripods/cages/handles/clamps → rigs before
  anything else; softbox/snoot/"adaptador … bowens" → modificadores; lens adapters and filters →
  adaptadores); price in Bs; `status` from Estado; the client's spec lines; free text as description;
  🆕 → `justIn`. Prints `check:` lines for what needs a human. The ledger version is in git at `6591b8f7`.
- **`data/catalogue-keys.json` (new, tracked):** `waId → {id, slug}`, made from the name on first
  sight and never changed, so a WhatsApp rename keeps URLs, photos and saved carts.
- **Overrides re-keyed** (`catalogue-overrides.json`): nine models carried whole (CL60, Scorp C2,
  Mic Mini 2 Combo, DC-550, Smooth 5, Scorp Mini 2 Kit, Lark M2 Combo, Crane M3, Godox S65T), three
  generic items keep only the tagline (EF-RF adapter, magic arm, RGB bar 30 cm), plus new entries:
  Weebill 3E (featured, tagline), Cinepeer X100 Combo and W100R (featured), and
  `adaptador-montura-zhiyun-a-bowens` brand cleared. Ledger-only products (Weebill 3, FX30,
  RS4 Mini…) dropped; the F6 Plus V2 *kit* copy dropped because WhatsApp lists the monitor alone.
- **`prepare-assets.py`:** product photos come from each row's `photos` (WhatsApp), not
  `03-graphic-resources/.tmp/product-images/` (still on disk, unused). The client's first photo leads.
  Two new rules: a photo with the client's EN CAMINO / AGOTADO corner ribbon is kept whole (a cut-out
  would float the ribbon); a cut-out drops pieces lying entirely in the top 14 % (the maker's
  wordmark). Sharding removed (143 shots, ~10 min with `--force`). 106 of 143 shots are cut-outs.
- **`build-site.mjs`:** prices `48.850 Bs`; `avail()` = `disponible` (and stock not 0) drives the
  cart, badges and "Solo en stock"; `en-camino` gets an outline **En camino** badge and **Apartar por
  WhatsApp** (reserve message), `agotado` keeps **Avisarme cuando llegue** and the dimmed card;
  **Recién llegado** badge from 🆕 (the old **Nuevo** badge would have been on 55 of 60 cards).
  Only aisles with products: eight, and the rail heading says **Ocho pasillos** from the data. Stage,
  kits and hero repointed (`zhiyun-weebill-3e`, `luz-colbor-cl60`, `dji-mic-mini-2-combo`,
  `monitor-viltrox-dc-550`, `feiyutech-scorp-c2`; kits of 3, 3 and 4), with a build warning if an
  id disappears. Product folders of products no longer in the CMS are not copied into `final-site`.
- **Cart:** key `alki-carrito-v2` (v1 held ledger ids and $), money in Bs. Catalogue filter on
  `avail`, default sort featured → disponible → en camino → agotado → the client's order.
- **Copy:** the ledger-only stat "unidades vendidas a creadores" became "listos para enviar hoy";
  every "hoja" / "en vivo" claim now says inventario / al día. Rail count shows `08 / 08` at the end
  (it could read `12 / 11` before).
- **CSS:** `.badge-soon`; prices never wrap; card rows wrap at 390.
- **`shoot.mjs`, `peek.mjs`** resolve `playwright-core` from the worktree (`npm i --no-save
  playwright-core` at the root, or `PLAYWRIGHT_DIR`) instead of a dead session scratchpad.
- Docs: `cms-schema.md` rewritten for the WhatsApp columns and the re-sync steps;
  `project-overview.md` CMS line.

## Gates

| Gate | Result |
| :--- | :--- |
| `journey-audit.mjs` (main's copy) | **PASS** — 8 chapters, 4 pins, 23 scrubs, 139 GSAP calls, 26 splits, 0 IO, 0 bands |
| `fluid-root.mjs --check` | **77 / 77**, problems: none |
| `shoot.mjs --motion`, four page types × 1440/390 | Console clean, document overflow 0 px everywhere; scrub proof Los Pasillos 0.25/0.50/0.75, El Escenario 02/03/04, El Camino 450/300/150 px (desktop only by design) |
| Cart end to end (scratch `cart-test.mjs`) | **38 / 38** at 1440 and 390: 73 de 73, "Solo en stock" 60, `?cat=iluminacion` 8, every price Bs, no `$` anywhere, card add, product add, en-camino page has no cart and reserves by WhatsApp, agotado page offers Avisarme, FX3/FX30 shows both prices, Ocho pasillos, 5 stage pieces, 3 kits, kit add, order message in Bs with total = sum of lines, 0 console errors |
| Visual | Stage, floor, catalogue grid at 1440 and 390 reviewed; `08-qa/.tmp/screenshots/peek/` |

## For the client (via Alejandro)

1. **14 products have no price** — 13 are en camino or agotado, plus *Jaula Universal para Celulares*,
   whose Estado says "Nuevo" but whose photo carries an **EN CAMINO** ribbon: probably en camino.
   The site shows it as disponible, a consultar, until the listing says otherwise.
2. ***Trípode para estabilizadores y cámaras* says `15$`** (the photo too); every other price is Bs.
   Shown as "Precio a consultar".
3. **Two listings are both called *Top Handle Smallrig*** (49.000 Bs and 43.965 Bs).
4. Prices in bolívares go stale as the rate moves: the site is as current as the last re-sync.
5. The CL60 lead photo is a collage with a hand cut at the frame edge; on the home stage it shows a
   hard edge. A clean single-product shot would fix it.

## Next

1. The shop's **WhatsApp number** into `site-src/data/site.json`.
2. Decide the sync: re-extract from WhatsApp on a cadence (needs a logged-in WhatsApp Web; see the
   catalogue README), or a Google Sheet after all.
3. The client's answers above; then Instatic.

## Gotchas

- **Never delete `data/catalogue-keys.json`.** It fixes every id and slug; regenerated, a renamed
  product would get a new URL and saved carts would point at nothing.
- **The ribbon leaves the corner tip white**: detect it along the diagonal (80–97 %), not at the corner pixel.
- `slugify` drops `&` ("K&F" → `k-f`); the ledger version spelled it `and`.
- `shoot.mjs` needs `playwright-core` installed at the worktree root after a fresh checkout.
- The old harvested `site-src/assets/products/<ledger-id>/` folders are still on disk; the build skips them.
