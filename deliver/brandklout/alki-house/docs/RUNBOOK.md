# RUNBOOK - `bk-alki-house`

The **standing** state of this project: what is true now, what is next, and the traps.
Dated run history is one file per run under [`runbook/`](./runbook/INDEX.md) — read the index,
then only the runs you need. Do not read them all.

**This worktree holds exactly one site: Alki House, in `deliver/brandklout/alki-house/`.**
Nothing else.

## Where the site is, as of 2026-09-13

A complete local design draft of the three page types, built to the design standard and gated.
Nothing is hosted. Facts and open questions are in [`project-overview.md`](./project-overview.md);
the CMS columns in [`cms-schema.md`](./cms-schema.md).

| | State |
| :--- | :--- |
| Worktree | `~/orca/workspaces/Brandklout Website System/bk-alki-house`, branch `bk-alki-house`, sparse, cut from `da1612b1` |
| Source | `workflows/04-design/.tmp/site-src/` — `node build-site.mjs` → `../final-site/` (238 pages) |
| CMS | `site-src/data/products.json`, 235 products from the ledger via `build-catalogue.mjs` + `catalogue-overrides.json`; the Google Sheet and its sync plugin do not exist yet |
| Assets | `03-graphic-resources/.tmp/scenes/` (AI, video, stock) and `product-images/` (harvested), prepared into `site-src/assets/` by `prepare-assets.py`; all gitignored, all reproducible |
| Gates | Journey audit, fluid root, scrub proof and console clean on the last run — see the newest runbook entry |
| `.env` | Generated: `[shared]` + `[alki-house]`. The client section is empty. |
| Hosting | None. No Instatic instance, no Railway service, no domain recorded. |

## How to rebuild from nothing

```
cd deliver/brandklout/alki-house/workflows
node 03-graphic-resources/.tmp/generate-scenes.mjs          # Freepik: needs MAGNIFIC in .env
node 03-graphic-resources/.tmp/harvest-product-images.mjs   # DDG/Bing, ~40 min for 235 products
cd 04-design/.tmp/site-src
node data/build-catalogue.mjs && python prepare-assets.py && node build-site.mjs
node shoot.mjs index.html 1440,390 --motion                  # gates: console, overflow, scrub proof
```

## Next

1. Get the client's answers listed under Open questions in `project-overview.md`.
2. Provision Instatic on Railway and upload; then the sheet sync plugin.
3. Wire the inquiry form and the contact CTA.

## Gotchas

- `scripts/env-sync.mjs` refuses a worktree with no matching master section; `[alki-house]` exists
  for that reason, even while empty.
- The worktree was made with `scripts/new-client-worktree.sh`, not from inside Orca, so the branch
  is bare `bk-alki-house`. If Orca does not list it, add it as an existing worktree.
- The journey audit wants the literal `pin:true`; Draggable's `scrollLeft` mode breaks flex rails;
  the fluid-root gate rejects px font-sizes even on inputs. Details in the 2026-09-13 run.
- Node fetch scripts must not write to a pipe on this machine — redirect to a log.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md).
