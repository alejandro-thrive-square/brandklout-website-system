# Runbook index

4 runs, newest first. Each line is one file in this folder.
**Read this index first and open only what you need** — opening every entry is how a runbook
eats a context window.

| Date | Run | File |
| :--- | :--- | :--- |
| 2026-09-13 | DONE 2026-09-13 (later, `PENDING`) - SPANISH SITE + WHATSAPP CART. Every page, name and URL in Spanish; cart saved in the browser; `pedido.html` sends the whole order to WhatsApp; gates and an end-to-end cart test passed. **WhatsApp number still missing (`data/site.json`). Gotchas: key on `id`, never `slug`; the cart is a snapshot; clicks during ScrollSmoother easing miss.** | [`2026-09-13-spanish-site-whatsapp-cart.md`](./2026-09-13-spanish-site-whatsapp-cart.md) |
| 2026-09-13 | DONE 2026-09-13 (`6591b8f7`) - LOCAL BUILD: home, catalogue, product template; 235-product CMS from the ledger; scenes, video and product cut-outs; gates passed. **Gotchas: audit wants literal `pin:true`; Draggable scrollLeft breaks flex rails; NaN in a trigger end = zero-length pin.** | [`2026-09-13-local-build-home-catalogue-product.md`](./2026-09-13-local-build-home-catalogue-product.md) |
| 2026-09-12 | DONE 2026-09-12 (later) - WORKFLOW MODULES COPIED. Development-from-Scratch route, `00` + `01`-`06` + `08`-`10`; `07-webflow-build` skipped for Instatic. Reference drop folders created. **Gotchas: pasted images are gitignored.** | [`2026-09-12-workflow-modules-copied.md`](./2026-09-12-workflow-modules-copied.md) |
| 2026-09-12 | DONE 2026-09-12 - WORKTREE AND CLIENT FOLDER CREATED. Sparse `bk-alki-house` from `da1612b1`, `[alki-house]` master env section, docs scaffolded. **Gotchas: env-sync needs a master section before it will write a `.env`.** | [`2026-09-12-worktree-and-client-folder-created.md`](./2026-09-12-worktree-and-client-folder-created.md) |
