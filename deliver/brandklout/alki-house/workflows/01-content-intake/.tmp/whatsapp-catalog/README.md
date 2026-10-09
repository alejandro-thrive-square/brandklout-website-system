# WhatsApp Business catalogue — Alki House

The client's **current** inventory, as published in the WhatsApp Business catalogue of the shop's
number (contact "Anferny" — *Alki House, Tienda de fotografía*). Extracted 2026-10-09 from
web.whatsapp.com. It is newer than the purchase ledger (`00-…/client-handoff/Stock/products.csv`)
that `site-src/data/products.json` was built from.

| File | Tracked | What |
| :--- | :--- | :--- |
| `catalog.json` | yes | 73 products in catalogue order: `name` (emoji stripped; `nameAsTyped` keeps it), `price` + `currency`, `priceOptions` (row 56 has two), `status` (`disponible` / `en-camino` / `agotado`, from the client's *Estado* text), `estado`, `markedNew` (🆕), `specs` (every other `Etiqueta: valor` line), `notes`, `collections`, `images`, raw `description`. No CDN URLs. |
| `catalog.csv` | yes | The same, flat (UTF-8 with BOM, opens in Excel/Sheets). |
| `images/<waId>/<n>.jpg` | no — R2 | 143 photos, the client's own, mostly 800×800. `node scripts/assets.mjs pull alki-house` restores them. |
| `extract.js` | yes | The in-page script (Claude in Chrome `javascript_tool`, logged-in WhatsApp Web tab, Anferny's catalogue opened once). |
| `recv.mjs` | yes | One-shot local receiver the WhatsApp tab hands the payload to. |
| `unpack.mjs` | yes | Payload → `catalog.json`, `catalog.csv`, `images/`. |

## What the catalogue says (2026-10-09)

- **73 products**: 60 `disponible`, 9 `en-camino`, 4 `agotado`. WhatsApp's own availability flag is
  `in stock` on all 73; the client marks status only in the *Estado* text.
- **Prices are in bolívares (Bs)**, typed by hand in the description (`Precio: 48.850 Bs`). 57 rows
  carry one (row 58 has no unit, assumed Bs); row 73 says `15$`; row 56 gives two options in
  `priceOptions`; 14 are blank, all `en-camino`/`agotado` except row 14. The ledger and the current
  site use $.
- **Collections**: Iluminación 13, Estabilizadores 10, Adaptadores 8, Baterías 6; 38 products are
  in none.
- A rough name match against `products.json` finds ~61 of 73 with a close ledger name; ~12 look
  new (Cinepeer X100, Softbox Zhiyun 40D ×2, Weebill 3E, Colbor W100R, universal phone cage, the
  two tripods, snoot, metal clamp, HDMI capture, K&F FZ100). Not reconciled yet.

## Re-extracting

1. Claude in Chrome, new tab, `https://web.whatsapp.com/` (the user's session). Search *Anferny*,
   open the **contact** (not the "Anferny WhatsApp" chat), click the shop icon in the chat header.
2. Run `extract.js` with `javascript_tool`. It pages the model directly: **the UI stops loading
   "Todos los artículos" at 10 products**, and each collection panel holds only 3.
3. `node recv.mjs <scratch>/catalog.json` in the background. In the WhatsApp tab, arm a one-time
   capture-phase click listener that does `window.open('http://127.0.0.1:47821/')` and, on the
   page's `ready` message, `postMessage(window.__alkiJson, …)`; then click the empty chat wallpaper
   once. The click is needed: a scripted `window.open` is popup-blocked. WhatsApp's COOP is
   `same-origin-allow-popups`, so the opener link survives; its CSP blocks a direct `fetch` to
   localhost.
4. `node unpack.mjs <scratch>/catalog.json`, then `node scripts/assets.mjs push --client alki-house`
   **after** committing the text files (push uploads every untracked file and never removes a
   manifest line).

Why not a download: a Chrome download of the payload works but lands in Chrome's *last-used*
folder (on 2026-10-09 that was `workflows/03-graphic-resources/`, not `~/Downloads`), and the tool
output redacts the signed image URLs, so they cannot be fetched from Node.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../../../../SYSTEM_RULES.md). Images are
gitignored and backed up to R2 through `assets.tsv`.
