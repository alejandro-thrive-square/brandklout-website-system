# RUNBOOK - `bk-alki-house`

The **standing** state of this project: what is true now, what is next, and the traps.
Dated run history is one file per run under [`runbook/`](./runbook/INDEX.md) — read the index,
then only the runs you need. Do not read them all.

**This worktree holds exactly one site: Alki House, in `deliver/brandklout/alki-house/`.**
Nothing else.

## Where the site is, as of 2026-10-09

A complete local design draft **in Spanish**: home, catalogue, the product template, and the order
page; customers fill a cart saved in their browser and send the whole order to the shop's WhatsApp.
Products, prices (Bs) and photos come from the shop's **WhatsApp Business catalogue** (since
2026-10-09; it replaced the purchase ledger).
Built to the design standard and gated. Nothing is hosted. Facts and open questions are in
[`project-overview.md`](./project-overview.md); the CMS columns, the cart and the WhatsApp message
in [`cms-schema.md`](./cms-schema.md).

| | State |
| :--- | :--- |
| Worktree | `~/orca/workspaces/Brandklout Website System/bk-alki-house`, branch `bk-alki-house`, sparse, cut from `da1612b1` |
| Source | `workflows/04-design/.tmp/site-src/` — `node build-site.mjs` → `../final-site/` (77 pages: `index`, `productos`, `productos/<slug>` ×73, `producto` canary, `pedido`) |
| Language | Spanish, Latin-American usage. Product names are the client's own, from WhatsApp |
| CMS | `site-src/data/products.json`, 73 products from the WhatsApp catalogue (`workflows/01-content-intake/.tmp/whatsapp-catalog/catalog.json`) via `build-catalogue.mjs` + `catalogue-overrides.json`; `id`/`slug` fixed per WhatsApp product in `data/catalogue-keys.json`; prices in **Bs**; status `disponible` / `en-camino` / `agotado`. No sync yet: re-extract by hand (steps in `cms-schema.md`) |
| Ordering | Cart in `localStorage` (`sections/cart.js`) → `pedido.html` → `wa.me/<number>?text=<order>` (`sections/pedido.js`). **The number is not set** — `site-src/data/site.json` |
| Assets | `03-graphic-resources/.tmp/scenes/` (AI, video, stock) and the client's WhatsApp photos (`whatsapp-catalog/images/`), prepared into `site-src/assets/` by `prepare-assets.py`; all gitignored and in R2. The harvested `product-images/` are no longer used |
| Gates | Journey audit, fluid root, scrub proof, console and an end-to-end cart test on the last run — see the newest runbook entry |
| `.env` | Generated: `[shared]` + `[alki-house]`. The client section is empty. |
| Hosting | None. No Instatic instance, no Railway service, no domain recorded. |

## How to rebuild from nothing

```
cd deliver/brandklout/alki-house/workflows
node 03-graphic-resources/.tmp/generate-scenes.mjs          # Freepik: needs MAGNIFIC in .env
node ../../../../scripts/assets.mjs pull alki-house          # the WhatsApp photos (or re-extract: whatsapp-catalog/README.md)
cd 04-design/.tmp/site-src
node data/build-catalogue.mjs && python prepare-assets.py && node build-site.mjs   # prepare ~10 min with --force
node shoot.mjs index.html 1440,390 --motion                  # gates: console, overflow, scrub proof
```

## Next

1. The shop's **WhatsApp number** into `site-src/data/site.json`, rebuild.
1b. Client questions from the 2026-10-09 run: 14 blank prices, the `15# RUNBOOK - `bk-alki-house`

The **standing** state of this project: what is true now, what is next, and the traps.
Dated run history is one file per run under [`runbook/`](./runbook/INDEX.md) — read the index,
then only the runs you need. Do not read them all.

**This worktree holds exactly one site: Alki House, in `deliver/brandklout/alki-house/`.**
Nothing else.

## Where the site is, as of 2026-10-09

A complete local design draft **in Spanish**: home, catalogue, the product template, and the order
page; customers fill a cart saved in their browser and send the whole order to the shop's WhatsApp.
Products, prices (Bs) and photos come from the shop's **WhatsApp Business catalogue** (since
2026-10-09; it replaced the purchase ledger).
Built to the design standard and gated. Nothing is hosted. Facts and open questions are in
[`project-overview.md`](./project-overview.md); the CMS columns, the cart and the WhatsApp message
in [`cms-schema.md`](./cms-schema.md).

| | State |
| :--- | :--- |
| Worktree | `~/orca/workspaces/Brandklout Website System/bk-alki-house`, branch `bk-alki-house`, sparse, cut from `da1612b1` |
| Source | `workflows/04-design/.tmp/site-src/` — `node build-site.mjs` → `../final-site/` (77 pages: `index`, `productos`, `productos/<slug>` ×73, `producto` canary, `pedido`) |
| Language | Spanish, Latin-American usage. Product names are the client's own, from WhatsApp |
| CMS | `site-src/data/products.json`, 73 products from the WhatsApp catalogue (`workflows/01-content-intake/.tmp/whatsapp-catalog/catalog.json`) via `build-catalogue.mjs` + `catalogue-overrides.json`; `id`/`slug` fixed per WhatsApp product in `data/catalogue-keys.json`; prices in **Bs**; status `disponible` / `en-camino` / `agotado`. No sync yet: re-extract by hand (steps in `cms-schema.md`) |
| Ordering | Cart in `localStorage` (`sections/cart.js`) → `pedido.html` → `wa.me/<number>?text=<order>` (`sections/pedido.js`). **The number is not set** — `site-src/data/site.json` |
| Assets | `03-graphic-resources/.tmp/scenes/` (AI, video, stock) and the client's WhatsApp photos (`whatsapp-catalog/images/`), prepared into `site-src/assets/` by `prepare-assets.py`; all gitignored and in R2. The harvested `product-images/` are no longer used |
| Gates | Journey audit, fluid root, scrub proof, console and an end-to-end cart test on the last run — see the newest runbook entry |
| `.env` | Generated: `[shared]` + `[alki-house]`. The client section is empty. |
| Hosting | None. No Instatic instance, no Railway service, no domain recorded. |

## How to rebuild from nothing

```
cd deliver/brandklout/alki-house/workflows
node 03-graphic-resources/.tmp/generate-scenes.mjs          # Freepik: needs MAGNIFIC in .env
node ../../../../scripts/assets.mjs pull alki-house          # the WhatsApp photos (or re-extract: whatsapp-catalog/README.md)
cd 04-design/.tmp/site-src
node data/build-catalogue.mjs && python prepare-assets.py && node build-site.mjs   # prepare ~10 min with --force
node shoot.mjs index.html 1440,390 --motion                  # gates: console, overflow, scrub proof
```

## Next

 tripod, two listings named
   *Top Handle Smallrig*, a cleaner CL60 photo. Decide how the catalogue stays current (re-extract
   from WhatsApp on a cadence, or a sheet).
2. The client's other answers under Open questions in `project-overview.md` (country and city,
   payment wording, domain, photos, draft specs).
3. Provision Instatic on Railway and upload, cart included; then the catalogue sync, keyed on `id`.

## Gotchas

- **Key on `id`, never `slug`.** Images, overrides and saved carts use `id`. **Never delete
  `data/catalogue-keys.json`**: it is what keeps ids and URLs stable across WhatsApp renames.
- **The cart is a snapshot** of each product when added; the order says *Total estimado* and the
  shop confirms in the chat. It is not emptied on send.
- **Instatic strips `data-*` from form controls**: the cart reads `closest('[data-item]')`, so the
  payload can live on a wrapper when the buttons are imported.
- `scripts/env-sync.mjs` refuses a worktree with no matching master section; `[alki-house]` exists
  for that reason, even while empty.
- The worktree was made with `scripts/new-client-worktree.sh`, not from inside Orca, so the branch
  is bare `bk-alki-house`. If Orca does not list it, add it as an existing worktree.
- The journey audit wants the literal `pin:true`; Draggable's `scrollLeft` mode breaks flex rails;
  the fluid-root gate rejects px font-sizes even on inputs. Details in the 2026-09-13 build run.
- Headless clicks right after a scroll miss while ScrollSmoother eases; wait ~2.5 s first.
- Node fetch scripts must not write to a pipe on this machine — redirect to a log.
- **WhatsApp Web's catalogue panel stops at 10 products**; page `WAWebCollections.Catalog` instead
  (`whatsapp-catalog/extract.js`). `assets.mjs push` uploads every untracked file and never drops a
  manifest line, so commit text outputs before pushing media.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md).
