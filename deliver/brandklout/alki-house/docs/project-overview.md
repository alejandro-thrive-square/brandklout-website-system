# Project Overview — Alki House

| Field | Value |
| :--- | :--- |
| **Client** | Alki House |
| **Agency** | Brandklout (white-label partner; Webzite delivers, Brandklout owns the relationship) |
| **Engagement** | New website, built from scratch (no existing site to migrate) |
| **Domain** | not yet recorded |
| **Hosting** | not yet provisioned — the house target is Instatic on Railway |
| **Asana task** | not yet recorded — find it in the Brandklout workspace and put the GID here |
| **Started** | 2026-09-12 |
| **Language** | **Spanish, the entire site** (Alejandro, 2026-09-13). Latin-American usage: *celular*, *audífonos*, *tú*. Product names are Spanish, head noun first; URLs are Spanish (`productos/<slug>.html`). |
| **Ordering** | **A cart saved in the browser, checked out to WhatsApp** (Alejandro, 2026-09-13). No payment on the site: `pedido.html` sends the whole order as one WhatsApp message; the shop confirms stock, condition and the final total in the chat. Number: `site-src/data/site.json` — **not yet supplied**. |
| **Sells** | Camera gimbals, studio lighting, softboxes, wireless audio, monitors, cages and rigs, lens adapters, batteries, camera care — new and pre-owned |
| **CMS** | **The shop's WhatsApp Business catalogue** (Alejandro, 2026-10-09: it replaces the purchase ledger), extracted into `workflows/01-content-intake/.tmp/whatsapp-catalog/` and built into `workflows/04-design/.tmp/site-src/data/products.json`; columns in [`cms-schema.md`](./cms-schema.md). Prices in **bolívares**. Whether a Google Sheet still comes later, or a sync reads WhatsApp, is open. |
| **Worktree** | `bk-alki-house` at `~/orca/workspaces/Brandklout Website System/bk-alki-house` (sparse) |
| **process_baseline_commit** | `da1612b1` (local `main` when the worktree was cut) |

> [!IMPORTANT]
> **This worktree holds exactly one site: Alki House, in `deliver/brandklout/alki-house/`.**
> It is a sparse checkout: the client folder, `deliver/process/`, `deliver/brandklout/docs`,
> `deliver/brandklout/scripts`, `scripts/`, `mcp-servers/` and `.claude/`. Another client's folder
> is not on disk here, on purpose. `git sparse-checkout add <path>` if you truly need one.

> [!IMPORTANT]
> **Brandklout is a partner engagement.** Never compute or record a price, rate, quote or cost
> anywhere under `deliver/brandklout/`.

## Design bar

Read [`../../docs/DESIGN-STANDARD.md`](../../docs/DESIGN-STANDARD.md) before the first page.
Brandklout rejects static first builds: go straight to the elevated version — a photograph on
every page, scroll-driven motion, grounds that change under the reader. No section shape may be
lifted from another client's site; a technique may repeat, a layout may not.

## Workflows

Copied 2026-09-12 from `deliver/process/` at `da1612b1`, following the **Development from
Scratch** route in [`OFFER_ROUTING.md`](../../../process/OFFER_ROUTING.md):
`01` -> `02` -> `03` -> `04` -> `05` -> `06` -> build -> `08` -> `09` -> `10`. Each module is the
template's directive, executor and trigger prompt, with an empty `.tmp/` to work in.

| Module | Put here |
| :--- | :--- |
| `00-client-delivery-initialization/.tmp/client-handoff/` | Everything the client or Brandklout sends at the start: brief, logo, brand files, copy, links |
| `00-client-delivery-initialization/.tmp/design-system/` | The chosen reference package from `deliver/process/design-system-library/`, if one is picked |
| `04-design/.tmp/references/` | Design references and inspiration: screenshots, URLs, moodboards |
| any other `<module>/.tmp/` | Files that phase receives or produces |

**Skipped: `07-webflow-build`.** This site is built on Instatic, not Webflow. When the build
starts, copy the Instatic modules it needs (`22-instatic-api-sync`, `18-instatic-embeds`,
`20-instatic-domain-origins`) from `deliver/process/` the same way.

> [!NOTE]
> Images, PDFs and video are gitignored everywhere (`.gitignore`, "Binary / Media Assets"). A
> screenshot pasted into a `.tmp/` stays on this machine until `scripts/mirror-assets.sh` syncs
> it; only text files (`.md`, `.txt`, `.json`, URL lists) travel with a commit.

## Brand assets (received 2026-09-12)

- Logo and four-swatch palette in `workflows/00-client-delivery-initialization/.tmp/client-handoff/Brand/`.
- No fonts supplied; Bricolage Grotesque / Manrope / JetBrains Mono chosen, changeable.
- No photography supplied; product shots harvested per model, scenes generated — see `workflows/03-graphic-resources/.tmp/asset-direction.md`.

## Open questions

- The domain, and whether an existing site or DNS zone is live on it.
- The Asana task GID for this build.
- Which Instatic instance (new Railway service) the site will publish to.
- **The shop's WhatsApp number** (international format, digits only) for `site-src/data/site.json`. Until it is set, every WhatsApp link opens the contact picker instead of the shop's chat.
- The shop's country and city: sets the Spanish variant, the currency label (prices show the ledger's `$`), the pickup address for "Recoger en Alki House", and how shipping is described.
- How the shop takes payment once an order arrives on WhatsApp (the order page promises "Acordamos contigo el pago"; nothing more specific is claimed).
- Whether the client's own unit photographs will replace the harvested manufacturer shots before launch (they should).
- Confirmation of the draft specs in `catalogue-overrides.json` for the sixteen featured products.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md). Work happens on
branch `bk-alki-house`.
