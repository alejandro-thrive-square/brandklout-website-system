# 2026-09-13 — the site in Spanish; a browser-saved cart that checks out to WhatsApp

Brief (Alejandro, 2026-09-13, after the local build — "things I forgot to tell you"):
1. The entire site should be in Spanish.
2. Customers keep a cart saved in their browser and go to a checkout; the whole selection is sent
   to WhatsApp.

## Done (commit `3e38116c`)

- **Spanish everywhere.** Every page, partial and script string; `lang="es"`, titles and
  descriptions, alt text, aria labels, chapter names (Llegada · Los Pasillos · El Escenario ·
  La Promesa · El Set · La Vitrina · El Camino · Invitación). Latin-American usage (*celular*,
  *audífonos*, *tú*), matching the ledger's own words.
- **Spanish product names.** `data/build-catalogue.mjs` still makes its clean English name first —
  the brand and category rules and the image harvester's queries run on it — and keeps it as
  `nameEn`. `spanish()` then makes the display name: an `ES` table for ~80 names no rule fits, and
  `RULES` that move the English head noun to the front ("Sony FX30 Cage" → "Jaula Sony FX30"),
  with colours agreeing with the head's gender ("Funda de silicona … (roja)", "Adaptador … (blanco)").
  All 235 read and checked; no slug collisions.
- **Two keys per product.** `id` = the old English slug: images (`assets/products/<id>/`),
  `catalogue-overrides.json`, the harvester's folders and saved carts all key on it, so nothing was
  re-harvested. `slug` = Spanish, the URL. Category ids are Spanish too (`iluminacion`, `energia`,
  `cuidado`…) because they appear in `?cat=` links and the client types them in the sheet.
- **Spanish URLs.** `productos.html`, `productos/<slug>.html`, `producto.html` (canary),
  `pedido.html` (new). The old `products.html` / `product.html` and their page sources are deleted.
- **Merchandising translated.** The 16 overrides (taglines, descriptions, specs) are Spanish; the
  FX30 condition is "Nuevo, sellado" and the Nuevo badge keys on a condition starting `Nuevo`
  (it used to fire on any condition text).
- **The cart** — `sections/cart.js`, `partials/cart.html`, `css/60-cart.css`. `localStorage`
  key `alki-carrito-v1` holds a snapshot per line `{id, slug, name, price, stock, img, qty}`;
  quantity is capped at stock; other tabs follow through the `storage` event. A bag with a count in
  the nav; a drawer with steppers, remove, estimated total, focus trap and Esc; a toast with
  "Ver carrito"; the product shot drops into the bag (GSAP, pointer and motion permitting). Add
  buttons: a `+` on every in-stock card, "Añadir al carrito" on each stage slide, on the product
  page and its phone bar, and "Añadir el kit al carrito" (whole kit) on each of the three kits.
  Cards became `<article>` with the name as a stretched link, so a real button can sit on the photo.
- **The checkout** — `pages/pedido.body.html`, `sections/pedido.js`. The saved lines with the same
  steppers, a summary, name (required), delivery (Recoger en Alki House / Envío a domicilio + address),
  a note. The send button's `href` is written at click time: `https://wa.me/<number>?text=<order>`.
  The message: a greeting, one numbered line per product (`2 x $70 = $140`), items, *Total estimado*
  (and how many are "precio a consultar"), then name, delivery and note; product links are added
  when the site is served over http and dropped if the link would pass 7,000 encoded characters.
  The cart is **not** emptied on send (the site cannot know the message went); a panel offers
  "Vaciar el carrito". Name and delivery choice are remembered (`alki-cliente-v1`).
- **Every "ask" is WhatsApp.** Nav "Escríbenos", product "Preguntar por WhatsApp" (prefilled with
  the piece and price), sold-out "Avisarme cuando llegue", the home form (folds name and camera
  into one message; without script it still GETs `wa.me` with the textarea as `?text=`), the
  catalogue's closing CTA. The number is one setting: `site-src/data/site.json` → `whatsapp`.
- **Search** is accent-blind and matches Spanish and English names, brand and tags: "bateria",
  "batería" and "battery" all work.
- `harvest-product-images.mjs` maps `id`→folder and `nameEn`→query; `.gitignore` ignores
  `final-site/productos/`.
- **Directive loop:** `deliver/process/01-content-intake/01-content-intake.md` step 4 now makes site
  language and the purchase/contact channel required intake answers — both were assumed here and
  cost a rebuild.
- **Docs:** `docs/cms-schema.md` (Spanish values, `id` vs `slug`, the category enum, the cart and
  message), `docs/project-overview.md` (language, ordering, new open questions).

## Gates (final build)

| Gate | Result |
| :--- | :--- |
| `journey-audit.mjs` | **PASS** — 8 chapters, 4 pins, 23 scrubs, 139 GSAP calls, 26 splits, 0 IntersectionObserver, 0 bands |
| `fluid-root.mjs --check` | **239 / 239** pages, problems: none |
| Console (`shoot.mjs --motion`) | Clean on `index`, `productos`, `producto`, `pedido` at 1440 and 390 |
| Document overflow | 0 px on all four at 1440 and 390 (the `.wrap` overflow the probe lists is off-stage stage figures and entrance offsets; none under reduced motion) |
| Scrub proof | Los Pasillos 0.25 / 0.50 / 0.75 · El Escenario 02 / 03 / 04 · El Camino 450 / 300 / 150 px |
| Cart end to end (scratch `cart-test.mjs`) | At 1440 and 390: search, three adds, drawer, stepper keeps focus, remove, Esc, product add + "Ya tienes 1 en tu carrito", kit adds 5, empty-name error, envío shows address, WhatsApp popup opens, message decoded and correct, clear, name remembered — **0 console errors** |
| Real pointer (scratch `click-probe.mjs`) | Three clicks on a card `+`, mid-screen and at the bottom edge: 1 → 2 → 3, each on the button |

Screenshots: `08-qa/.tmp/screenshots/cart/` (drawer, toast, product added, order page, sent) and
the per-page folds under `08-qa/.tmp/screenshots/`.

## Next

1. **The shop's WhatsApp number** into `site-src/data/site.json`, then `node build-site.mjs`.
   Until then every WhatsApp link opens the contact picker (the build prints a warning).
2. Country and city (Spanish variant, currency label, pickup address), and how payment is agreed —
   the order page only promises "Acordamos contigo el pago".
3. Instatic port, now with the cart: `site.js` carries it; the add buttons' payload must survive the
   import (see Gotchas). Then the sheet sync plugin to `docs/cms-schema.md`, keyed on `id`.

## Gotchas

- **Never key anything on `slug`.** Images, overrides, carts and the harvester key on `id`. A slug
  is a URL and may be regenerated from the Spanish name; an `id` never changes.
- **A new ledger spelling needs its English name first** (`CANON` in `build-catalogue.mjs`); the
  Spanish comes from that. Add to `ES` only when no `RULES` entry reads right.
- **The cart is a snapshot.** A price change in the sheet does not reach a saved cart until the
  product is added again — hence *Total estimado* and the shop confirming in the chat.
- **A card is `<article>` with a stretched link** (`.pcard-link::after`, z-index 5) and the `+` at
  `top: calc(100cqw - 3.5rem)` — the card is a size container. Anything clickable inside a card
  needs z-index above 5.
- **Instatic drops `data-*` on form controls** (see memory). `cart.js` reads
  `closest('[data-item]')`, so the payload can move to a wrapper `div` around the button on import.
  Instatic custom-mode forms also POST into a 404: the home ask-form must keep its script path.
- **Clicking while ScrollSmoother is still easing lands beside the target.** A headless click right
  after a scroll "lost" an add in testing; wait ~2.5 s after any scroll, or click through the DOM.
- The toast sits bottom-centre and can cover a middle-column `+` for its 3.6 s.
- `[hidden]{display:none!important}` is now in the base layer; component `display` rules no longer
  beat `hidden`.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../../SYSTEM_RULES.md).
