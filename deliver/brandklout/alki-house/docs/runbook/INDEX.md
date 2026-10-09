# Runbook index

7 runs, newest first. Each line is one file in this folder.
**Read this index first and open only what you need** — opening every entry is how a runbook
eats a context window.

| Date | Run | File |
| :--- | :--- | :--- |
| 2026-10-09 | DONE 2026-10-09 (evening, `d7db6d45`) - CARD HOVER + CUT-OUTS + SYNC OPTIONS. Hover shot carries the card ground and prefers the next cut-out; cut-outs now an AI matte (rembg) with per-shot `photo-overrides.json` (flood / photo / ai / skip); FX3 cage shots printing $ skipped; WhatsApp↔site options in `cms-schema.md`. Gates green, cart e2e 38/38. **Gotchas: rembg lives in %LOCALAPPDATA%/webzite; the matte hollows white products → flood override; --force after editing overrides.** | [`2026-10-09-card-hover-and-cutouts.md`](./2026-10-09-card-hover-and-cutouts.md) |
| 2026-10-09 | DONE 2026-10-09 (later, `9a63f58a`) - WHATSAPP CATALOGUE REPLACES THE LEDGER. 73 products, Bs prices, statuses disponible / en camino / agotado, the client's photos (ribbon shots kept whole, wordmarks dropped); stage, kits, hero repointed; cart v2. Gates: journey PASS, fluid root 77/77, console/overflow clean, cart e2e 38/38. **Client: 14 blank prices, a `15# Runbook index

6 runs, newest first. Each line is one file in this folder.
**Read this index first and open only what you need** — opening every entry is how a runbook
eats a context window.

| Date | Run | File |
 price, two "Top Handle Smallrig". Gotchas: never delete `catalogue-keys.json`; shoot.mjs needs playwright-core at the worktree root.** | [`2026-10-09-whatsapp-catalogue-replaces-ledger.md`](./2026-10-09-whatsapp-catalogue-replaces-ledger.md) |
| 2026-10-09 | DONE 2026-10-09 (`0afa0766`) - WHATSAPP CATALOGUE EXTRACTED. 73 products + 143 client photos from the shop's WhatsApp Business catalogue (WhatsApp Web, Claude in Chrome on WhatsApp's own models) into `01-content-intake/.tmp/whatsapp-catalog/`; prices in Bs; ~12 not in the ledger. Site untouched. **Open: does it replace the ledger as the CMS source? Gotchas: the panel stops paging at 10; tool output redacts signed URLs; Chrome downloads land in its last-used folder; commit text before `assets.mjs push`.** | [`2026-10-09-whatsapp-catalogue-extracted.md`](./2026-10-09-whatsapp-catalogue-extracted.md) |
| 2026-09-13 | DONE 2026-09-13 (later, `3e38116c`) - SPANISH SITE + WHATSAPP CART. Every page, name and URL in Spanish; cart saved in the browser; `pedido.html` sends the whole order to WhatsApp; gates and an end-to-end cart test passed. **WhatsApp number still missing (`data/site.json`). Gotchas: key on `id`, never `slug`; the cart is a snapshot; clicks during ScrollSmoother easing miss.** | [`2026-09-13-spanish-site-whatsapp-cart.md`](./2026-09-13-spanish-site-whatsapp-cart.md) |
| 2026-09-13 | DONE 2026-09-13 (`6591b8f7`) - LOCAL BUILD: home, catalogue, product template; 235-product CMS from the ledger; scenes, video and product cut-outs; gates passed. **Gotchas: audit wants literal `pin:true`; Draggable scrollLeft breaks flex rails; NaN in a trigger end = zero-length pin.** | [`2026-09-13-local-build-home-catalogue-product.md`](./2026-09-13-local-build-home-catalogue-product.md) |
| 2026-09-12 | DONE 2026-09-12 (later) - WORKFLOW MODULES COPIED. Development-from-Scratch route, `00` + `01`-`06` + `08`-`10`; `07-webflow-build` skipped for Instatic. Reference drop folders created. **Gotchas: pasted images are gitignored.** | [`2026-09-12-workflow-modules-copied.md`](./2026-09-12-workflow-modules-copied.md) |
| 2026-09-12 | DONE 2026-09-12 - WORKTREE AND CLIENT FOLDER CREATED. Sparse `bk-alki-house` from `da1612b1`, `[alki-house]` master env section, docs scaffolded. **Gotchas: env-sync needs a master section before it will write a `.env`.** | [`2026-09-12-worktree-and-client-folder-created.md`](./2026-09-12-worktree-and-client-folder-created.md) |
