# CMS schema — the product catalogue

The site renders **one row per product**; nothing about a product lives anywhere else. This
document fixes the columns so the design and whatever feeds it agree.

**Source, since 2026-10-09: the shop's WhatsApp Business catalogue** (Alejandro: "replace the
ledger with the WhatsApp catalogue"). It is the inventory the client already keeps current. It is
extracted from WhatsApp Web into `workflows/01-content-intake/.tmp/whatsapp-catalog/catalog.json`
(method in that folder's README), and `site-src/data/build-catalogue.mjs` turns it into
`site-src/data/products.json`, whose columns are the ones below. The purchase ledger
(`Stock/products.csv`) fed the 2026-09-13 build and is no longer read.

**The site is in Spanish** (confirmed 2026-09-13), and so is everything the client types. Column
keys stay as below.

## Columns

| Column | Type | From WhatsApp | Rendered where | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `id` | text, unique | — | Nowhere visible | The stable key. Product images live under `assets/products/<id>/`, overrides are keyed by it, and **saved carts** hold it. Made from the name the first time a WhatsApp product is seen and recorded against its `waId` in `data/catalogue-keys.json`; never changes after, even if the client renames the product. |
| `slug` | text, unique | — | URL `productos/<slug>.html` | Same origin and same rule as `id`. Changing it breaks links. |
| `waId` | text | product id | Nowhere | WhatsApp's own id: what `catalogue-keys.json` is keyed on. |
| `order` | integer | catalogue order | Tie-break in every sort | The client's own order in WhatsApp. |
| `name` | text | name, emoji stripped | Everywhere, and in the WhatsApp order | The client's name as typed ("Jaula para Sony A7 IV marca Smallrig"). An override may replace it. |
| `brand` | text | "Marca:" line, else read from the name | Card meta, product tag, brand filter | The maker, never the camera it fits. Blank for generics. |
| `category` | enum | read from the name | Filters, rail, related, `?cat=` links | One of the eleven aisles: `gimbals`, `iluminacion`, `modificadores`, `audio`, `monitores`, `rigs`, `adaptadores`, `energia`, `cuidado`, `camaras`, `accesorios`. Only aisles with products are shown (eight on 2026-10-09). Rules in `build-catalogue.mjs`; an override's `category` wins. |
| `price` | number | "Precio:" line | Cards, stage, product page, cart, WhatsApp order | **Bolívares**, rendered `48.850 Bs`. Blank renders **"Precio a consultar"**. A price written in another currency (one listing says `15$`) is not shown next to Bs prices: it renders as a consultar and the build prints it. A listing with two prices takes the first as `price` and shows both as specs. |
| `currency` | text | — | — | Always `Bs`. |
| `status` | enum | "Estado:" line | Badge, buttons, in-stock filter, sort | `disponible` (cart), `en-camino` (no cart; **Apartar por WhatsApp**), `agotado` (no cart; **Avisarme cuando llegue**; card dimmed). WhatsApp's own availability flag says "in stock" on every product, so the client's text is the only signal. |
| `stock` | integer or null | — | "N disponibles", cart cap | WhatsApp has no counts, so `null`: "Disponible", and the cart caps at 99. A number here (from a future sheet) is used as before; `0` reads as agotado. |
| `condition` | text | "Estado:" when `disponible` | Product page line | "Nuevo", "Nueva", "Refurbished", "Nuevo (Caja Abierta)". No badge: nearly every listing is new. |
| `justIn` | boolean | 🆕 in the name or Estado | **Recién llegado** badge | The client's own new-arrival mark. |
| `tagline` | text | — | Stage, product hero | Overrides only. |
| `description` | long text | free lines of the description | Product page | The client's text first; an override's when the listing has none; then a generic line. |
| `specs` | list of `[label, value]` | every other "Etiqueta: valor" line | Stage (first three), product table | The client's lines first; an override adds only labels the client did not write. |
| `featured` | boolean | — | Home stage/floor ordering, catalogue sort | Overrides only. |
| `tags` | list | — | Search | Overrides only. Search also matches name, brand and aisle, without accents. |
| `collections` | list | collection names | Nowhere yet | Iluminación, Estabilizadores, Adaptadores, Baterías on 2026-10-09; 38 products in none. |
| `photos` | list of paths | the listing's photos | — | Relative to `photoRoot` (top of `products.json`). `prepare-assets.py` turns them into `assets/products/<id>/N.webp`, which `build-site.mjs` reads as `images`. The client's first photo leads. |

Overrides (`data/catalogue-overrides.json`, keyed by `id`) carry what WhatsApp cannot: `featured`,
`tagline`, `tags`, draft `description`/`specs` for a few models, and corrections (`name`, `brand`,
`category`). The build warns about an override that matches no product.

## How the site consumes it

- **Build (now)**: `build-site.mjs` renders every row into `productos/<slug>.html` from the one
  product template, the catalogue grid, the home page stage/floor/kits, and embeds a slim JSON copy
  (`slug, name, brand, category, price, avail, rank, featured, q`) into `productos.html` for
  client-side filtering. The stage, the kits and the hero name products by `id` in `build-site.mjs`;
  a missing one is dropped with a warning.
- **Instatic (later)**: a sync writes the same rows into an Instatic data collection and the product
  template becomes the collection's page template. The `22-instatic-api-sync` notes apply:
  `PATCH /admin/api/cms/data/rows/:id` replaces `cells` wholesale, and a publish republishes every
  page.

## Re-syncing from WhatsApp

1. Re-extract (`whatsapp-catalog/README.md`), `node unpack.mjs`, push the photos to R2.
2. `node data/build-catalogue.mjs` — read its `check:` lines (foreign-currency prices, shared
   names, overrides that match nothing).
3. `python prepare-assets.py`, `node build-site.mjs`, the gates.

Prices in bolívares go stale as the exchange rate moves; the site is only as current as the last
re-sync.

## Connecting the WhatsApp catalogue (researched 2026-10-09)

Meta documents **no API that reads a catalogue built inside the WhatsApp Business app**, and the
WhatsApp Cloud API's coexistence mode lists catalogues as unsupported. The official link runs the
other way: a Commerce Manager catalogue *connected to* the app (Herramientas → Catálogo → ⋮ →
Conectar catálogo; the app catalogue is archived, edits move to Commerce Manager, changes reach
WhatsApp within ~24 h, Meta reviews items). Options, best first:

1. **One source → Commerce Manager → WhatsApp, and the site reads the same source.** The source
   is a Google Sheet or a feed the site itself publishes (CSV/XML), fetched by Commerce Manager on
   a schedule; the site reads the sheet, or `GET /{catalog_id}/products` with a catalogue token.
   Official and free; photos need public URLs (R2). Check first: the menu exists on the shop's
   phone, and Commerce Manager accepts Bs (unverified; else price stays in the description).
2. **The same, with the site's CMS (Instatic) as the source** publishing the feed: one admin, no sheet.
3. **Keep the app catalogue; read it daily with Baileys** (`getCatalog`, `getCollections`) from a
   *separate* WhatsApp account — a catalogue is visible to any customer, so the shop's number is never
   used. Unofficial: WhatsApp's terms forbid it and can ban the reading account. A small server + SIM.
4. **Automate today's WhatsApp Web extraction** (persistent browser profile). Same terms risk, more
   fragile (WhatsApp Web internals change, the session drops).
5. **Paid unofficial APIs** (Green-API `getProducts`, Z-API): option 3 with a fee and a third party.

Sources: faq.whatsapp.com/1057141349534704 (connect a catalogue), the coexistence feature table at
developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/onboarding-business-app-users/,
Baileys `src/Socket/business.ts`. Venezuela is not on Meta's ineligible list for the Platform.

## The cart and the WhatsApp order

Every add button carries a snapshot of its row: `{id, slug, name, price, stock, img}`. The cart
(`sections/cart.js`) keeps those in the browser's `localStorage` under `alki-carrito-v2` (v1 held
ledger ids and $), so a cart survives a closed tab and is shared across tabs, and sends nothing
anywhere until the customer presses **Enviar pedido por WhatsApp** on `pedido.html`. The message is
one numbered line per product with quantity, unit price and line total in Bs, the estimated total,
the customer's name, delivery choice and note. It goes to the number in `site-src/data/site.json`.

Because the cart holds a snapshot, a price change reaches a saved cart only when the customer adds
that product again; the shop confirms the final price in the chat. That is why the order says
**Total estimado**.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md).
